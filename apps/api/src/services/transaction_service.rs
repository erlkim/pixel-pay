use sqlx::PgPool;
use uuid::Uuid;
use crate::error::AppError;
use crate::models::transaction::*;
use crate::services::{DigiflazzService, ProductService, WalletService};

pub struct TransactionService;

impl TransactionService {
    pub fn generate_ref_id() -> String {
        format!("PP-{}", Uuid::new_v4().to_string()[..12].to_uppercase())
    }

    /// Hash UUID ke i64 untuk advisory lock
    fn uid_to_lock_key(uid: Uuid) -> i64 {
        let bytes = uid.as_bytes();
        i64::from_be_bytes(bytes[..8].try_into().unwrap_or([0; 8]))
    }

    pub async fn create(
        pool: &PgPool,
        uid: Uuid,
        pid: Uuid,
        customer: &str,
        dg: &DigiflazzService,
    ) -> Result<Transaction, AppError> {
        // ============================================
        // SEMUA DALAM 1 TRANSAKSI DATABASE (ATOMIC)
        // ============================================
        let mut db_tx = pool.begin().await
            .map_err(AppError::Database)?;

        // 1. Advisory lock per user — serialize semua transaksi user ini
        //    User lain bisa paralel, tapi user yang SAMA harus antri
        let lock_key = Self::uid_to_lock_key(uid);
        sqlx::query("SELECT pg_advisory_xact_lock($1)")
            .bind(lock_key)
            .execute(&mut *db_tx)
            .await
            .map_err(AppError::Database)?;

        // 2. Cek duplikasi dalam 30 detik (SEKARANG ATOMIC karena di dalam lock)
        let recent: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM transactions
             WHERE user_id = $1 AND product_id = $2 AND customer_number = $3
             AND status IN ('pending','processing')
             AND created_at > NOW() - INTERVAL '30 seconds'"
        )
        .bind(uid)
        .bind(pid)
        .bind(customer)
        .fetch_one(&mut *db_tx)
        .await
        .unwrap_or((0,));

        if recent.0 > 0 {
            db_tx.rollback().await.ok();
            return Err(AppError::Validation(
                "Transaksi sedang diproses, tunggu beberapa detik".into()
            ));
        }

        // 3. Validasi produk
        let prod = ProductService::find_by_id(pool, pid).await?;
        if !prod.buyer_product_status || !prod.seller_product_status {
            db_tx.rollback().await.ok();
            return Err(AppError::Validation("Produk tidak tersedia".into()));
        }
        if !prod.unlimited_stock && prod.stock <= 0 {
            db_tx.rollback().await.ok();
            return Err(AppError::Validation("Stok habis".into()));
        }

        // 4. Cek & potong saldo (SELECT FOR UPDATE di dalam transaksi yang sama)
        let wallet = sqlx::query_as::<_, crate::models::wallet::Wallet>(
            "SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE"
        )
        .bind(uid)
        .fetch_one(&mut *db_tx)
        .await
        .map_err(|_| AppError::NotFound("Wallet tidak ditemukan".into()))?;

        if wallet.balance < prod.sell_price {
            db_tx.rollback().await.ok();
            return Err(AppError::InsufficientBalance {
                need: prod.sell_price.to_string(),
                have: wallet.balance.to_string(),
            });
        }

        let before = wallet.balance;
        let after = before - prod.sell_price;

        // 5. Update saldo
        sqlx::query("UPDATE wallets SET balance=$1, updated_at=NOW() WHERE id=$2")
            .bind(after)
            .bind(wallet.id)
            .execute(&mut *db_tx)
            .await
            .map_err(AppError::Database)?;

        // 6. Log debit
        let ref_id = Self::generate_ref_id();
        sqlx::query(
            "INSERT INTO balance_logs \
             (wallet_id, amount, type, description, ref_id, balance_before, balance_after) \
             VALUES ($1, $2, 'debit', $3, $4, $5, $6)"
        )
        .bind(wallet.id)
        .bind(prod.sell_price)
        .bind(format!("Beli {}", prod.name))
        .bind(&ref_id)
        .bind(before)
        .bind(after)
        .execute(&mut *db_tx)
        .await
        .map_err(AppError::Database)?;

        // 7. Buat transaksi
        let txn = sqlx::query_as::<_, Transaction>(
            "INSERT INTO transactions \
             (user_id, product_id, ref_id, customer_number, \
              base_price, sell_price, profit, status) \
             VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING *"
        )
        .bind(uid)
        .bind(pid)
        .bind(&ref_id)
        .bind(customer)
        .bind(prod.base_price)
        .bind(prod.sell_price)
        .bind(prod.profit)
        .fetch_one(&mut *db_tx)
        .await
        .map_err(AppError::Database)?;

        // 8. COMMIT — semua atau tidak sama sekali
        db_tx.commit().await.map_err(AppError::Database)?;

        // 9. Ambil data lengkap untuk response
        let txn = Self::get_by_id(pool, txn.id).await?;

        // ============================================
        // BACKGROUND: Kirim ke Digiflazz (di luar TX)
        // ============================================
        let dg_cloned = dg.clone();
        let dg_ref = ref_id.clone();
        let sku = prod.buyer_sku_code.clone().unwrap_or_default();
        let cust = customer.to_string();
        let pool_c = pool.clone();
        let user_id = uid;

        tokio::spawn(async move {
            match dg_cloned.buy(&sku, &cust, &dg_ref).await {
                Ok(res) => {
                    tracing::info!("Digiflazz response for {}: status={}, sn={}, msg={}",
                        dg_ref, res.status, res.sn.as_deref().unwrap_or("-"), res.message);

                    let new_status = match res.status.as_str() {
                        "Sukses" => "success",
                        "Gagal" => "failed",
                        _ => "processing",
                    };

                    let _ = sqlx::query(
                        "UPDATE transactions SET status=$1, digiflazz_status=$2, \
                         digiflazz_message=$3, serial_number=$4, completed_at=NOW() WHERE ref_id=$5"
                    )
                    .bind(new_status)
                    .bind(&res.status)
                    .bind(&res.message)
                    .bind(&res.sn)
                    .bind(&dg_ref)
                    .execute(&pool_c)
                    .await;

                    // Refund jika gagal
                    if new_status == "failed" {
                        if let Ok(Some(tx)) = sqlx::query_as::<_, Transaction>(
                            "SELECT * FROM transactions WHERE ref_id=$1"
                        )
                        .bind(&dg_ref)
                        .fetch_optional(&pool_c)
                        .await
                        {
                            let _ = WalletService::credit(
                                &pool_c, tx.user_id, tx.sell_price,
                                &format!("Refund - transaksi gagal {}", dg_ref),
                                Some(&dg_ref),
                            ).await;
                        }
                    }

                    // Notifikasi
                    let title = if new_status == "success" { "Transaksi Berhasil!" } else { "Transaksi Gagal" };
                    let _ = sqlx::query(
                        "INSERT INTO notifications (user_id, title, message, type, ref_id) \
                         VALUES ($1, $2, $3, $4, $5)"
                    )
                    .bind(user_id)
                    .bind(title)
                    .bind(format!("{} ke {}", "Transaksi", cust))
                    .bind(new_status)
                    .bind(&dg_ref)
                    .execute(&pool_c).await;
                }
                Err(e) => {
                    tracing::error!("Digiflazz error for {}: {}", dg_ref, e);

                    let _ = sqlx::query(
                        "UPDATE transactions SET status='failed', \
                         digiflazz_message=$1, completed_at=NOW() WHERE ref_id=$2"
                    )
                    .bind(e.to_string())
                    .bind(&dg_ref)
                    .execute(&pool_c)
                    .await;

                    // Refund
                    if let Ok(Some(tx)) = sqlx::query_as::<_, Transaction>(
                        "SELECT * FROM transactions WHERE ref_id=$1"
                    )
                    .bind(&dg_ref)
                    .fetch_optional(&pool_c)
                    .await
                    {
                        let _ = WalletService::credit(
                            &pool_c, tx.user_id, tx.sell_price,
                            &format!("Refund - transaksi gagal {}", dg_ref),
                            Some(&dg_ref),
                        ).await;
                    }

                    // Notifikasi gagal
                    let _ = sqlx::query(
                        "INSERT INTO notifications (user_id, title, message, type, ref_id) \
                         VALUES ($1, 'Transaksi Gagal', $2, 'failed', $3)"
                    )
                    .bind(user_id)
                    .bind(format!("Transaksi ke {} gagal: {}", cust, e))
                    .bind(&dg_ref)
                    .execute(&pool_c).await;
                }
            }
        });

        Ok(txn)
    }

    pub async fn get_by_id(pool: &PgPool, id: Uuid) -> Result<Transaction, AppError> {
        sqlx::query_as::<_, Transaction>("SELECT * FROM transactions WHERE id=$1")
            .bind(id)
            .fetch_optional(pool)
            .await?
            .ok_or_else(|| AppError::NotFound("Transaksi tidak ditemukan".into()))
    }

    #[allow(dead_code)]
    pub async fn get_by_ref(pool: &PgPool, ref_id: &str) -> Result<Transaction, AppError> {
        sqlx::query_as::<_, Transaction>("SELECT * FROM transactions WHERE ref_id=$1")
            .bind(ref_id)
            .fetch_optional(pool)
            .await?
            .ok_or_else(|| AppError::NotFound("Transaksi tidak ditemukan".into()))
    }

    pub async fn list_by_user(pool: &PgPool, uid: Uuid, limit: i64) -> Result<Vec<Transaction>, AppError> {
        sqlx::query_as::<_, Transaction>(
            "SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2",
        )
        .bind(uid)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)
    }

    pub async fn list_all(pool: &PgPool, limit: i64) -> Result<Vec<Transaction>, AppError> {
        sqlx::query_as::<_, Transaction>(
            "SELECT * FROM transactions ORDER BY created_at DESC LIMIT $1",
        )
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)
    }
}
