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


// ==================== VOUCHER MANAGEMENT ====================

pub async fn admin_list_vouchers(
    State(s): State<AdminState>,
    c: AdminClaims,
) -> Result<Json<serde_json::Value>, AppError> {
    let vouchers = sqlx::query(
        "SELECT * FROM vouchers ORDER BY created_at DESC"
    )
    .fetch_all(&s.pool)
    .await
    .map_err(AppError::Database)?;

    let result: Vec<serde_json::Value> = vouchers.iter().map(|v| {
        serde_json::json!({
            "id": v.get::<uuid::Uuid, _>("id"),
            "code": v.get::<String, _>("code"),
            "description": v.get::<Option<String>, _>("description"),
            "discount_type": v.get::<String, _>("discount_type"),
            "discount_value": v.get::<rust_decimal::Decimal, _>("discount_value").to_string(),
            "min_transaction": v.get::<rust_decimal::Decimal, _>("min_transaction").to_string(),
            "max_discount": v.get::<Option<rust_decimal::Decimal>, _>("max_discount").map(|d| d.to_string()),
            "usage_limit": v.get::<i32, _>("usage_limit"),
            "used_count": v.get::<i32, _>("used_count"),
            "is_active": v.get::<bool, _>("is_active"),
            "expires_at": v.get::<Option<chrono::NaiveDateTime>, _>("expires_at"),
            "created_at": v.get::<chrono::NaiveDateTime, _>("created_at"),
        })
    }).collect();

    log_action(&s.pool, c.claims.sub, "list_vouchers", "voucher", "", "List all vouchers").await;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "vouchers": result }
    })))
}

pub async fn admin_create_voucher(
    State(s): State<AdminState>,
    c: AdminClaims,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let code = req.get("code").and_then(|v| v.as_str()).unwrap_or("").to_uppercase();
    let description = req.get("description").and_then(|v| v.as_str()).unwrap_or("");
    let discount_type = req.get("discount_type").and_then(|v| v.as_str()).unwrap_or("percentage");
    let discount_value: f64 = req.get("discount_value").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let min_transaction: f64 = req.get("min_transaction").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let max_discount = req.get("max_discount").and_then(|v| v.as_f64());
    let usage_limit: i32 = req.get("usage_limit").and_then(|v| v.as_i64()).unwrap_or(100) as i32;
    let expires_at = req.get("expires_at").and_then(|v| v.as_str());

    if code.is_empty() {
        return Err(AppError::Validation("Kode voucher wajib diisi".into()));
    }
    if code.len() < 3 || code.len() > 50 {
        return Err(AppError::Validation("Kode voucher 3-50 karakter".into()));
    }
    if discount_value <= 0.0 {
        return Err(AppError::Validation("Nilau diskon harus lebih dari 0".into()));
    }
    if discount_type != "percentage" && discount_type != "fixed" {
        return Err(AppError::Validation("Tipe diskon: percentage atau fixed".into()));
    }
    if usage_limit < 1 {
        return Err(AppError::Validation("Batas penggunaan minimal 1".into()));
    }

    let voucher = sqlx::query(
        "INSERT INTO vouchers (code, description, discount_type, discount_value, min_transaction, max_discount, usage_limit, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id"
    )
    .bind(&code)
    .bind(if description.is_empty() { None } else { Some(description) })
    .bind(discount_type)
    .bind(rust_decimal::Decimal::from_f64_retain(discount_value).unwrap_or_default())
    .bind(rust_decimal::Decimal::from_f64_retain(min_transaction).unwrap_or_default())
    .bind(max_discount.map(|d| rust_decimal::Decimal::from_f64_retain(d).unwrap_or_default()))
    .bind(usage_limit)
    .bind(expires_at.and_then(|s| chrono::NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S").ok()))
    .fetch_one(&s.pool)
    .await
    .map_err(|e| {
        if e.to_string().contains("unique") || e.to_string().contains("duplicate") {
            AppError::Validation(format!("Kode voucher '{}' sudah ada", code))
        } else {
            AppError::Database(e)
        }
    })?;

    let vid: uuid::Uuid = voucher.get("id");
    log_action(&s.pool, c.claims.sub, "create_voucher", "voucher", &vid.to_string(), &format!("Created voucher: {}", code)).await;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": format!("Voucher '{}' berhasil dibuat", code),
        "data": { "voucher_id": vid, "code": code }
    })))
}

pub async fn admin_update_voucher(
    State(s): State<AdminState>,
    c: AdminClaims,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let existing = sqlx::query("SELECT id FROM vouchers WHERE id = $1")
        .bind(id)
        .fetch_optional(&s.pool)
        .await
        .map_err(AppError::Database)?
        .ok_or_else(|| AppError::NotFound("Voucher tidak ditemukan".into()))?;
    let _ = existing;

    let description = req.get("description").and_then(|v| v.as_str());
    let discount_type = req.get("discount_type").and_then(|v| v.as_str());
    let discount_value = req.get("discount_value").and_then(|v| v.as_f64());
    let min_transaction = req.get("min_transaction").and_then(|v| v.as_f64());
    let max_discount = req.get("max_discount").and_then(|v| v.as_f64());
    let usage_limit = req.get("usage_limit").and_then(|v| v.as_i64()).map(|v| v as i32);
    let is_active = req.get("is_active").and_then(|v| v.as_bool());
    let expires_at = req.get("expires_at").and_then(|v| v.as_str());

    sqlx::query(
        "UPDATE vouchers SET
         description = COALESCE($1, description),
         discount_type = COALESCE($2, discount_type),
         discount_value = COALESCE($3, discount_value),
         min_transaction = COALESCE($4, min_transaction),
         max_discount = $5,
         usage_limit = COALESCE($6, usage_limit),
         is_active = COALESCE($7, is_active),
         expires_at = $8
         WHERE id = $9"
    )
    .bind(description)
    .bind(discount_type)
    .bind(discount_value.map(|v| rust_decimal::Decimal::from_f64_retain(v).unwrap_or_default()))
    .bind(min_transaction.map(|v| rust_decimal::Decimal::from_f64_retain(v).unwrap_or_default()))
    .bind(max_discount.map(|v| rust_decimal::Decimal::from_f64_retain(v).unwrap_or_default()))
    .bind(usage_limit)
    .bind(is_active)
    .bind(expires_at.and_then(|s| chrono::NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S").ok()))
    .bind(id)
    .execute(&s.pool)
    .await
    .map_err(AppError::Database)?;

    log_action(&s.pool, c.claims.sub, "update_voucher", "voucher", &id.to_string(), "Updated voucher").await;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Voucher berhasil diperbarui"
    })))
}

pub async fn admin_delete_voucher(
    State(s): State<AdminState>,
    c: AdminClaims,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query("DELETE FROM vouchers WHERE id = $1")
        .bind(id)
        .execute(&s.pool)
        .await
        .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Voucher tidak ditemukan".into()));
    }

    log_action(&s.pool, c.claims.sub, "delete_voucher", "voucher", &id.to_string(), "Deleted voucher").await;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Voucher berhasil dihapus"
    })))
}

pub async fn admin_toggle_voucher(
    State(s): State<AdminState>,
    c: AdminClaims,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query(
        "UPDATE vouchers SET is_active = NOT is_active WHERE id = $1 RETURNING code, is_active"
    )
    .bind(id)
    .fetch_one(&s.pool)
    .await
    .map_err(|e| {
        if e.to_string().contains("no rows") {
            AppError::NotFound("Voucher tidak ditemukan".into())
        } else {
            AppError::Database(e)
        }
    })?;

    let code: String = result.get("code");
    let active: bool = result.get("is_active");
    let status = if active { "diaktifkan" } else { "dinonaktifkan" };

    log_action(&s.pool, c.claims.sub, "toggle_voucher", "voucher", &id.to_string(), &format!("Voucher {} {}", code, status)).await;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": format!("Voucher '{}' {}", code, status),
        "data": { "is_active": active }
    })))
}
