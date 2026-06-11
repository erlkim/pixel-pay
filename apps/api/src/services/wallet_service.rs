use sqlx::PgPool;
use uuid::Uuid;
use crate::error::AppError;
use crate::models::wallet::*;

pub struct WalletService;

impl WalletService {
    pub async fn get_by_user(pool: &PgPool, uid: Uuid) -> Result<Wallet, AppError> {
        sqlx::query_as::<_, Wallet>("SELECT * FROM wallets WHERE user_id = $1")
            .bind(uid)
            .fetch_optional(pool)
            .await?
            .ok_or_else(|| AppError::NotFound("Wallet tidak ditemukan".into()))
    }
    pub async fn get_balance(pool: &PgPool, uid: Uuid) -> Result<WalletResponse, AppError> {
        Ok(Self::get_by_user(pool, uid).await?.to_response())
    }
    pub async fn credit(
        pool: &PgPool,
        uid: Uuid,
        amount: rust_decimal::Decimal,
        desc: &str,
        ref_id: Option<&str>,
    ) -> Result<Wallet, AppError> {
        let mut tx = pool.begin().await?;
        let w = sqlx::query_as::<_, Wallet>(
            "SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE",
        )
        .bind(uid)
        .fetch_one(&mut *tx)
        .await?;
        let before = w.balance;
        let after = before + amount;
        sqlx::query("UPDATE wallets SET balance=$1, updated_at=NOW() WHERE id=$2")
            .bind(after)
            .bind(w.id)
            .execute(&mut *tx)
            .await?;
        sqlx::query(
            "INSERT INTO balance_logs \
             (wallet_id, amount, type, description, ref_id, balance_before, balance_after) \
             VALUES ($1, $2, 'credit', $3, $4, $5, $6)",
        )
        .bind(w.id)
        .bind(amount)
        .bind(desc)
        .bind(ref_id)
        .bind(before)
        .bind(after)
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        Ok(Wallet {
            balance: after,
            ..w
        })
    }
    pub async fn debit(
        pool: &PgPool,
        uid: Uuid,
        amount: rust_decimal::Decimal,
        desc: &str,
        ref_id: Option<&str>,
    ) -> Result<Wallet, AppError> {
        let mut tx = pool.begin().await?;
        let w = sqlx::query_as::<_, Wallet>(
            "SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE",
        )
        .bind(uid)
        .fetch_one(&mut *tx)
        .await?;
        if w.balance < amount {
            return Err(AppError::InsufficientBalance {
                need: amount.to_string(),
                have: w.balance.to_string(),
            });
        }
        let before = w.balance;
        let after = before - amount;
        sqlx::query("UPDATE wallets SET balance=$1, updated_at=NOW() WHERE id=$2")
            .bind(after)
            .bind(w.id)
            .execute(&mut *tx)
            .await?;
        sqlx::query(
            "INSERT INTO balance_logs \
             (wallet_id, amount, type, description, ref_id, balance_before, balance_after) \
             VALUES ($1, $2, 'debit', $3, $4, $5, $6)",
        )
        .bind(w.id)
        .bind(amount)
        .bind(desc)
        .bind(ref_id)
        .bind(before)
        .bind(after)
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        Ok(Wallet {
            balance: after,
            ..w
        })
    }
    pub async fn get_logs(
        pool: &PgPool,
        uid: Uuid,
        limit: i64,
    ) -> Result<Vec<BalanceLog>, AppError> {
        let w = Self::get_by_user(pool, uid).await?;
        sqlx::query_as::<_, BalanceLog>(
            "SELECT * FROM balance_logs WHERE wallet_id=$1 ORDER BY created_at DESC LIMIT $2",
        )
        .bind(w.id)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)
    }
}
