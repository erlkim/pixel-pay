use axum::{extract::State, Json};
use sqlx::PgPool;
use uuid::Uuid;
use crate::{
    config::AppConfig, error::AppError, error::format_rupiah,
    middleware::AdminClaims, models::user::UserPublic,
    services::{DigiflazzService, TransactionService},
};

#[derive(Clone)]
#[allow(dead_code)]
pub struct AdminState {
    pub pool: PgPool,
    pub digiflazz: DigiflazzService,
    pub config: AppConfig,
}

pub async fn dashboard(
    State(s): State<AdminState>,
    _a: AdminClaims,
) -> Result<Json<serde_json::Value>, AppError> {
    let rev: (Option<rust_decimal::Decimal>,) = sqlx::query_as(
        "SELECT COALESCE(SUM(profit),0) FROM transactions WHERE status='success' AND created_at::date=CURRENT_DATE",
    )
    .fetch_one(&s.pool)
    .await?;
    let cnt: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM transactions WHERE created_at::date=CURRENT_DATE",
    )
    .fetch_one(&s.pool)
    .await?;
    let users: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(&s.pool)
        .await?;
    let rf = rev.0.unwrap_or_default().to_string().parse::<f64>().unwrap_or(0.0);
    Ok(Json(serde_json::json!({
        "success": true,
        "data": {
            "revenue_today": format_rupiah(rf),
            "transactions_today": cnt.0,
            "total_users": users.0
        }
    })))
}

pub async fn all_transactions(
    State(s): State<AdminState>,
    _a: AdminClaims,
) -> Result<Json<serde_json::Value>, AppError> {
    let txs = TransactionService::list_all(&s.pool, 100).await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "transactions": txs }
    })))
}

pub async fn list_users_admin(
    State(s): State<AdminState>,
    _a: AdminClaims,
) -> Result<Json<serde_json::Value>, AppError> {
    let us = sqlx::query_as::<_, crate::models::user::User>(
        "SELECT * FROM users ORDER BY created_at DESC LIMIT 200",
    )
    .fetch_all(&s.pool)
    .await?;
    let publ: Vec<_> = us.into_iter().map(UserPublic::from).collect();
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "users": publ }
    })))
}

pub async fn sync_products(
    State(s): State<AdminState>,
    _a: AdminClaims,
) -> Result<Json<serde_json::Value>, AppError> {
    let cats = sqlx::query_as::<_, crate::models::category::Category>(
        "SELECT * FROM categories WHERE is_active = true ORDER BY sort_order",
    )
    .fetch_all(&s.pool)
    .await
    .map_err(AppError::Database)?;

    let mut total_synced: u32 = 0;
    let mut errors: Vec<String> = Vec::new();
    let mut per_category: Vec<serde_json::Value> = Vec::new();

    for cat in &cats {
        if let Some(cmd) = &cat.digiflazz_cmd {
            tracing::info!("Syncing category: {} (cmd: {})", cat.name, cmd);
            match s.digiflazz.price_list(cmd).await {
                Ok(products) => {
                    let count = products.len();
                    for p in &products {
                        let sell_price = p.price * 1.05;
                        let profit = sell_price - p.price;
                        let sku = format!("{}-{}", cmd, p.buyer_sku_code);

                        let result = sqlx::query(
                            "INSERT INTO products \
                             (id, category_id, sku, buyer_sku_code, name, \
                              provider, brand, type, \
                              base_price, sell_price, profit, \
                              buyer_product_status, seller_product_status, \
                              stock, unlimited_stock, synced_at) \
                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW()) \
                             ON CONFLICT (sku) DO UPDATE SET \
                              name = EXCLUDED.name, \
                              brand = EXCLUDED.brand, \
                              base_price = EXCLUDED.base_price, \
                              sell_price = EXCLUDED.sell_price, \
                              profit = EXCLUDED.profit, \
                              buyer_product_status = EXCLUDED.buyer_product_status, \
                              seller_product_status = EXCLUDED.seller_product_status, \
                              stock = EXCLUDED.stock, \
                              unlimited_stock = EXCLUDED.unlimited_stock, \
                              synced_at = NOW(), \
                              updated_at = NOW()",
                        )
                        .bind(Uuid::new_v4())
                        .bind(cat.id)
                        .bind(&sku)
                        .bind(&p.buyer_sku_code)
                        .bind(&p.product_name)
                        .bind(&p.brand)
                        .bind(&p.brand)
                        .bind(&p.product_type)
                        .bind(p.price)
                        .bind(sell_price)
                        .bind(profit)
                        .bind(p.buyer_product_status)
                        .bind(p.seller_product_status)
                        .bind(p.stock.unwrap_or(0))
                        .bind(p.unlimited_stock)
                        .execute(&s.pool)
                        .await;

                        match result {
                            Ok(_) => total_synced += 1,
                            Err(e) => {
                                let msg = format!("{}: {}", p.product_name, e);
                                tracing::error!("Insert error: {}", msg);
                                errors.push(msg);
                            }
                        }
                    }
                    tracing::info!("Synced {} products for {}", count, cat.name);
                    per_category.push(serde_json::json!({
                        "category": cat.name,
                        "status": "ok",
                        "count": count
                    }));
                }
                Err(e) => {
                    let msg = format!("{}: {}", cat.name, e);
                    tracing::error!("Sync error: {}", msg);
                    errors.push(msg.clone());
                    per_category.push(serde_json::json!({
                        "category": cat.name,
                        "status": "error",
                        "count": 0,
                        "error": e.to_string()
                    }));
                }
            }
        }
    }

    let db_total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM products")
        .fetch_one(&s.pool)
        .await
        .unwrap_or((0,));

    Ok(Json(serde_json::json!({
        "success": true,
        "message": format!("Synced {} products. Total in DB: {}", total_synced, db_total.0),
        "data": {
            "synced_this_run": total_synced,
            "total_in_db": db_total.0,
            "errors": errors.len(),
            "per_category": per_category
        }
    })))
}
