use axum::{extract::{Path, State}, Json};
use serde::Deserialize;
use uuid::Uuid;
use sqlx::Row;
use crate::{error::AppError, handlers::admin::AdminState, middleware::AdminClaims};

// ============ TRANSACTION DETAIL ============

pub async fn transaction_detail(
    State(s): State<AdminState>,
    _a: AdminClaims,
    Path(tx_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tx = sqlx::query_as::<_, crate::models::transaction::Transaction>(
        "SELECT * FROM transactions WHERE id::text = $1 OR ref_id = $1",
    )
    .bind(&tx_id)
    .fetch_optional(&s.pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Transaksi tidak ditemukan".into()))?;

    let user = sqlx::query_as::<_, crate::models::user::User>(
        "SELECT * FROM users WHERE id = $1",
    )
    .bind(tx.user_id)
    .fetch_optional(&s.pool)
    .await
    .map_err(AppError::Database)?;

    let product = sqlx::query_as::<_, crate::models::product::Product>(
        "SELECT * FROM products WHERE id = $1",
    )
    .bind(tx.product_id)
    .fetch_optional(&s.pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": {
            "transaction": tx,
            "user": user.map(|u| serde_json::json!({
                "id": u.id, "full_name": u.full_name, "email": u.email, "phone": u.phone
            })),
            "product": product.map(|p| serde_json::json!({
                "id": p.id, "name": p.name, "brand": p.brand, "provider": p.provider
            }))
        }
    })))
}

// ============ RETRY TRANSACTION ============

pub async fn retry_transaction(
    State(s): State<AdminState>,
    a: AdminClaims,
    Path(tx_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tx = sqlx::query_as::<_, crate::models::transaction::Transaction>(
        "SELECT * FROM transactions WHERE (id::text = $1 OR ref_id = $1) AND status IN ('failed','pending')",
    )
    .bind(&tx_id)
    .fetch_optional(&s.pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Transaksi tidak ditemukan atau tidak bisa di-retry".into()))?;

    let product = crate::services::ProductService::find_by_id(&s.pool, tx.product_id).await?;
    let sku = product.buyer_sku_code.clone().unwrap_or_default();

    sqlx::query("UPDATE transactions SET status = 'processing', updated_at = NOW() WHERE id = $1")
        .bind(tx.id)
        .execute(&s.pool)
        .await
        .map_err(AppError::Database)?;

    let dg = s.digiflazz.clone();
    let ref_id = tx.ref_id.clone();
    let customer = tx.customer_number.clone();
    let pool_c = s.pool.clone();

    tokio::spawn(async move {
        match dg.buy(&sku, &customer, &ref_id).await {
            Ok(res) => {
                let new_status = match res.status.as_str() {
                    "Sukses" => "success",
                    "Gagal" => "failed",
                    _ => "processing",
                };
                let _ = sqlx::query(
                    "UPDATE transactions SET status=$1, digiflazz_status=$2, digiflazz_message=$3, sn=$4, completed_at=NOW() WHERE ref_id=$5",
                )
                .bind(new_status).bind(&res.status).bind(&res.message).bind(&res.sn).bind(&ref_id)
                .execute(&pool_c).await;
            }
            Err(e) => {
                let _ = sqlx::query("UPDATE transactions SET status='failed', digiflazz_message=$1 WHERE ref_id=$2")
                    .bind(e.to_string()).bind(&ref_id).execute(&pool_c).await;
            }
        }
    });

    log_action(&s.pool, a.claims.sub, "RETRY_TRANSACTION", "transaction", &tx_id, "Retry transaksi").await;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Transaksi sedang di-proses ulang"
    })))
}

// ============ REFUND TRANSACTION ============

pub async fn refund_transaction(
    State(s): State<AdminState>,
    a: AdminClaims,
    Path(tx_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tx = sqlx::query_as::<_, crate::models::transaction::Transaction>(
        "SELECT * FROM transactions WHERE (id::text = $1 OR ref_id = $1) AND status NOT IN ('refunded','success')",
    )
    .bind(&tx_id)
    .fetch_optional(&s.pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Transaksi tidak ditemukan atau tidak bisa di-refund".into()))?;

    crate::services::WalletService::credit(
        &s.pool, tx.user_id, tx.sell_price,
        &format!("Refund manual oleh admin - {}", tx.ref_id),
        Some(&tx.ref_id),
    ).await?;

    sqlx::query("UPDATE transactions SET status = 'refunded', updated_at = NOW() WHERE id = $1")
        .bind(tx.id)
        .execute(&s.pool)
        .await
        .map_err(AppError::Database)?;

    log_action(&s.pool, a.claims.sub, "REFUND_TRANSACTION", "transaction", &tx_id, "Refund manual").await;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": format!("Refund Rp {} berhasil", tx.sell_price)
    })))
}

// ============ USER DETAIL ============

pub async fn user_detail(
    State(s): State<AdminState>,
    _a: AdminClaims,
    Path(user_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user = sqlx::query_as::<_, crate::models::user::User>(
        "SELECT * FROM users WHERE id::text = $1",
    )
    .bind(&user_id)
    .fetch_optional(&s.pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("User tidak ditemukan".into()))?;

    let wallet = sqlx::query_as::<_, crate::models::wallet::Wallet>(
        "SELECT * FROM wallets WHERE user_id = $1",
    )
    .bind(user.id)
    .fetch_optional(&s.pool)
    .await
    .map_err(AppError::Database)?;

    let tx_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM transactions WHERE user_id = $1")
        .bind(user.id).fetch_one(&s.pool).await.unwrap_or((0,));

    let tx_success: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND status = 'success'")
        .bind(user.id).fetch_one(&s.pool).await.unwrap_or((0,));

    let total_spent: (Option<rust_decimal::Decimal>,) = sqlx::query_as(
        "SELECT COALESCE(SUM(sell_price),0) FROM transactions WHERE user_id = $1 AND status = 'success'"
    )
    .bind(user.id).fetch_one(&s.pool).await.unwrap_or((None,));

    let recent_tx = sqlx::query_as::<_, crate::models::transaction::Transaction>(
        "SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
    )
    .bind(user.id)
    .fetch_all(&s.pool)
    .await
    .unwrap_or_default();

    Ok(Json(serde_json::json!({
        "success": true,
        "data": {
            "user": {
                "id": user.id, "email": user.email, "phone": user.phone,
                "full_name": user.full_name, "role": user.role,
                "is_active": user.is_active, "is_blocked": user.is_blocked,
                "blocked_reason": user.blocked_reason,
                "created_at": user.created_at,
            },
            "wallet": wallet.map(|w| serde_json::json!({"id": w.id, "balance": w.balance.to_string()})),
            "stats": {
                "total_transactions": tx_count.0,
                "success_transactions": tx_success.0,
                "total_spent": total_spent.0.unwrap_or_default().to_string(),
            },
            "recent_transactions": recent_tx.iter().map(|t| serde_json::json!({
                "id": t.id, "ref_id": t.ref_id, "status": t.status,
                "sell_price": t.sell_price.to_string(),
                "customer_number": t.customer_number,
                "created_at": t.created_at,
            })).collect::<Vec<_>>()
        }
    })))
}

// ============ BLOCK/UNBLOCK USER ============

#[derive(Deserialize)]
pub struct BlockUserReq {
    pub blocked: bool,
    pub reason: Option<String>,
}

pub async fn toggle_block_user(
    State(s): State<AdminState>,
    a: AdminClaims,
    Path(user_id): Path<String>,
    Json(req): Json<BlockUserReq>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        "UPDATE users SET is_blocked = $1, blocked_reason = $2, blocked_at = CASE WHEN $1 THEN NOW() ELSE NULL END, updated_at = NOW() WHERE id::text = $3",
    )
    .bind(req.blocked)
    .bind(&req.reason)
    .bind(&user_id)
    .execute(&s.pool)
    .await
    .map_err(AppError::Database)?;

    let action = if req.blocked { "BLOCK_USER" } else { "UNBLOCK_USER" };
    log_action(&s.pool, a.claims.sub, action, "user", &user_id, &req.reason.unwrap_or_default()).await;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": if req.blocked { "User berhasil diblokir" } else { "User berhasil di-unblock" }
    })))
}

// ============ RESET PASSWORD USER ============

#[derive(Deserialize)]
pub struct ResetPasswordReq {
    pub new_password: String,
}

pub async fn reset_user_password(
    State(s): State<AdminState>,
    a: AdminClaims,
    Path(user_id): Path<String>,
    Json(req): Json<ResetPasswordReq>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.new_password.len() < 6 {
        return Err(AppError::Validation("Password minimal 6 karakter".into()));
    }
    let hash = bcrypt::hash(&req.new_password, 12)
        .map_err(|e| AppError::Internal(e.to_string()))?;
    sqlx::query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id::text = $2")
        .bind(&hash).bind(&user_id).execute(&s.pool).await.map_err(AppError::Database)?;
    log_action(&s.pool, a.claims.sub, "RESET_PASSWORD", "user", &user_id, "").await;
    Ok(Json(serde_json::json!({"success": true, "message": "Password berhasil direset"})))
}

// ============ EDIT USER BALANCE ============

#[derive(Deserialize)]
pub struct EditBalanceReq {
    pub amount: f64,
    pub description: String,
}

pub async fn edit_user_balance(
    State(s): State<AdminState>,
    a: AdminClaims,
    Path(user_id): Path<String>,
    Json(req): Json<EditBalanceReq>,
) -> Result<Json<serde_json::Value>, AppError> {
    let uid = Uuid::parse_str(&user_id).map_err(|_| AppError::Validation("Invalid user ID".into()))?;
    let amount = rust_decimal::Decimal::try_from(req.amount.abs())
        .map_err(|_| AppError::Validation("Invalid amount".into()))?;

    if req.amount >= 0.0 {
        crate::services::WalletService::credit(&s.pool, uid, amount, &req.description, None).await?;
    } else {
        crate::services::WalletService::debit(&s.pool, uid, amount, &req.description, None).await?;
    }

    log_action(&s.pool, a.claims.sub, "EDIT_BALANCE", "user", &user_id, &format!("{}: {}", req.amount, req.description)).await;

    Ok(Json(serde_json::json!({"success": true, "message": format!("Saldo berhasil {}", if req.amount >= 0.0 { "ditambah" } else { "dikurangi" })})))
}

// ============ TRANSACTION FILTER ============

pub async fn filtered_transactions(
    State(s): State<AdminState>,
    _a: AdminClaims,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let date_from = req.get("date_from").and_then(|v| v.as_str()).unwrap_or("");
    let date_to = req.get("date_to").and_then(|v| v.as_str()).unwrap_or("");
    let status = req.get("status").and_then(|v| v.as_str()).unwrap_or("");
    let category = req.get("category").and_then(|v| v.as_str()).unwrap_or("");
    let limit = req.get("limit").and_then(|v| v.as_i64()).unwrap_or(100);

    let mut query = String::from(
        "SELECT t.* FROM transactions t
         LEFT JOIN products p ON t.product_id = p.id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE 1=1"
    );

    if !date_from.is_empty() {
        query.push_str(&format!(" AND t.created_at >= '{}'", date_from));
    }
    if !date_to.is_empty() {
        query.push_str(&format!(" AND t.created_at <= '{} 23:59:59'", date_to));
    }
    if !status.is_empty() && status != "all" {
        query.push_str(&format!(" AND t.status = '{}'", status));
    }
    if !category.is_empty() && category != "all" {
        query.push_str(&format!(" AND c.slug = '{}'", category));
    }

    query.push_str(&format!(" ORDER BY t.created_at DESC LIMIT {}", limit));

    let txs = sqlx::query_as::<_, crate::models::transaction::Transaction>(&query)
        .fetch_all(&s.pool)
        .await
        .map_err(AppError::Database)?;

    let total_revenue: f64 = txs.iter().filter(|t| t.status == "success")
        .map(|t| t.sell_price.to_string().parse::<f64>().unwrap_or(0.0)).sum();
    let total_profit: f64 = txs.iter().filter(|t| t.status == "success")
        .map(|t| t.profit.to_string().parse::<f64>().unwrap_or(0.0)).sum();

    Ok(Json(serde_json::json!({
        "success": true,
        "data": {
            "transactions": txs,
            "total": txs.len(),
            "total_revenue": total_revenue,
            "total_profit": total_profit,
        }
    })))
}

// ============ PRODUCT PRICE MANAGEMENT ============

#[derive(Deserialize)]
pub struct UpdateMarkupReq {
    pub markup_percent: f64,
}

pub async fn update_product_markup(
    State(s): State<AdminState>,
    a: AdminClaims,
    Path(product_id): Path<String>,
    Json(req): Json<UpdateMarkupReq>,
) -> Result<Json<serde_json::Value>, AppError> {
    let pid = Uuid::parse_str(&product_id).map_err(|_| AppError::Validation("Invalid product ID".into()))?;

    let product = crate::services::ProductService::find_by_id(&s.pool, pid).await?;
    let factor = rust_decimal::Decimal::try_from(1.0 + req.markup_percent / 100.0)
        .unwrap_or(rust_decimal::Decimal::ONE);
    let new_sell = product.base_price * factor;
    let new_profit = new_sell - product.base_price;

    sqlx::query(
        "UPDATE products SET markup_percent = $1, sell_price = $2, profit = $3, updated_at = NOW() WHERE id = $4",
    )
    .bind(req.markup_percent)
    .bind(new_sell)
    .bind(new_profit)
    .bind(pid)
    .execute(&s.pool)
    .await
    .map_err(AppError::Database)?;

    log_action(&s.pool, a.claims.sub, "UPDATE_MARKUP", "product", &product_id, &format!("Markup: {}%", req.markup_percent)).await;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": format!("Markup produk berhasil diubah ke {}%", req.markup_percent),
        "data": {
            "new_sell_price": new_sell.to_string(),
            "new_profit": new_profit.to_string(),
        }
    })))
}

pub async fn bulk_update_markup(
    State(s): State<AdminState>,
    a: AdminClaims,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let category_slug = req.get("category_slug").and_then(|v| v.as_str()).unwrap_or("");
    let markup = req.get("markup_percent").and_then(|v| v.as_f64()).unwrap_or(5.0);

    let markup_dec = rust_decimal::Decimal::try_from(markup).unwrap_or_default();
    let factor = rust_decimal::Decimal::try_from(1.0 + markup / 100.0)
        .unwrap_or(rust_decimal::Decimal::ONE);

    let result = if !category_slug.is_empty() {
        sqlx::query(
            "UPDATE products SET markup_percent = $1, sell_price = base_price * $2, profit = base_price * $2 - base_price, updated_at = NOW()
             WHERE category_id = (SELECT id FROM categories WHERE slug = $3) AND is_active = true",
        )
        .bind(markup_dec).bind(factor).bind(category_slug)
        .execute(&s.pool).await.map_err(AppError::Database)?
    } else {
        sqlx::query(
            "UPDATE products SET markup_percent = $1, sell_price = base_price * $2, profit = base_price * $2 - base_price, updated_at = NOW() WHERE is_active = true",
        )
        .bind(markup_dec).bind(factor)
        .execute(&s.pool).await.map_err(AppError::Database)?
    };

    log_action(&s.pool, a.claims.sub, "BULK_UPDATE_MARKUP", "products", category_slug, &format!("{}% for {} products", markup, result.rows_affected())).await;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": format!("Markup {}% diterapkan ke {} produk", markup, result.rows_affected())
    })))
}

// ============ SYSTEM SETTINGS ============

pub async fn get_settings(
    State(s): State<AdminState>,
    _a: AdminClaims,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = sqlx::query("SELECT key, value, description FROM system_settings ORDER BY key")
        .fetch_all(&s.pool)
        .await
        .map_err(AppError::Database)?;

    let mut map = serde_json::Map::new();
    for row in rows {
        let key: String = row.get("key");
        let value: String = row.get("value");
        map.insert(key, serde_json::Value::String(value));
    }

    Ok(Json(serde_json::json!({"success": true, "data": {"settings": serde_json::Value::Object(map)}})))
}

#[derive(Deserialize)]
pub struct UpdateSettingReq {
    pub key: String,
    pub value: String,
}

pub async fn update_setting(
    State(s): State<AdminState>,
    a: AdminClaims,
    Json(req): Json<UpdateSettingReq>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE system_settings SET value = $1, updated_at = NOW() WHERE key = $2")
        .bind(&req.value).bind(&req.key).execute(&s.pool).await.map_err(AppError::Database)?;
    log_action(&s.pool, a.claims.sub, "UPDATE_SETTING", "system", &req.key, &req.value).await;
    Ok(Json(serde_json::json!({"success": true, "message": format!("Setting {} berhasil diubah", req.key)})))
}

// ============ ADMIN LOGS ============

pub async fn admin_logs(
    State(s): State<AdminState>,
    _a: AdminClaims,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = sqlx::query(
        "SELECT al.id, al.admin_id, al.action, al.target_type, al.target_id, al.details, al.created_at, u.full_name as admin_name
         FROM admin_logs al LEFT JOIN users u ON al.admin_id = u.id ORDER BY al.created_at DESC LIMIT 200",
    )
    .fetch_all(&s.pool)
    .await
    .map_err(AppError::Database)?;

    let result: Vec<serde_json::Value> = rows.iter().map(|r| {
        serde_json::json!({
            "id": r.get::<Uuid, _>("id"),
            "admin_id": r.get::<Uuid, _>("admin_id"),
            "admin_name": r.get::<Option<String>, _>("admin_name"),
            "action": r.get::<String, _>("action"),
            "target_type": r.get::<Option<String>, _>("target_type"),
            "target_id": r.get::<Option<String>, _>("target_id"),
            "details": r.get::<Option<String>, _>("details"),
            "created_at": r.get::<chrono::NaiveDateTime, _>("created_at"),
        })
    }).collect();

    Ok(Json(serde_json::json!({"success": true, "data": {"logs": result}})))
}

// ============ BROADCAST NOTIFICATION ============

#[derive(Deserialize)]
pub struct BroadcastReq {
    pub title: String,
    pub message: String,
    pub notif_type: String,
}

pub async fn broadcast_notification(
    State(s): State<AdminState>,
    a: AdminClaims,
    Json(req): Json<BroadcastReq>,
) -> Result<Json<serde_json::Value>, AppError> {
    let users = sqlx::query_as::<_, (Uuid,)>("SELECT id FROM users WHERE is_active = true AND is_blocked = false")
        .fetch_all(&s.pool).await.map_err(AppError::Database)?;

    let count = users.len();
    for (uid,) in &users {
        let _ = sqlx::query(
            "INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)",
        )
        .bind(uid).bind(&req.title).bind(&req.message).bind(&req.notif_type)
        .execute(&s.pool).await;
    }

    log_action(&s.pool, a.claims.sub, "BROADCAST", "notification", "", &format!("Ke {} user: {}", count, req.title)).await;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": format!("Notifikasi berhasil dikirim ke {} user", count)
    })))
}

// ============ HELPER: LOG ADMIN ACTION ============

pub async fn log_action(pool: &sqlx::PgPool, admin_id: Uuid, action: &str, target_type: &str, target_id: &str, details: &str) {
    let _ = sqlx::query(
        "INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(admin_id).bind(action).bind(target_type).bind(target_id).bind(details)
    .execute(pool).await;
}
