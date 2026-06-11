use axum::{extract::State, Json};
use serde::Deserialize;
use sqlx::Row;
use crate::{
    error::AppError, middleware::Claims,
    models::transaction::*, services::TransactionService,
};
use super::admin::AdminState;

pub async fn create(
    State(s): State<AdminState>,
    c: Claims,
    Json(req): Json<CreateTransactionRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.customer_number.len() < 10 {
        return Err(AppError::Validation("Nomor min 10 digit".into()));
    }
    let tx = TransactionService::create(
        &s.pool,
        c.sub,
        req.product_id,
        &req.customer_number,
        &s.digiflazz,
    )
    .await?;
    let pn: String = sqlx::query_scalar("SELECT name FROM products WHERE id=$1")
        .bind(tx.product_id)
        .fetch_one(&s.pool)
        .await
        .unwrap_or_else(|_| "Unknown".into());
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "transaction": tx.to_response(&pn) }
    })))
}

pub async fn list(
    State(s): State<AdminState>,
    c: Claims,
) -> Result<Json<serde_json::Value>, AppError> {
    let txs = TransactionService::list_by_user(&s.pool, c.sub, 50).await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "transactions": txs }
    })))
}

#[derive(Deserialize)]
pub struct DetailRequest {
    pub ref_id: String,
}

pub async fn detail(
    State(s): State<AdminState>,
    c: Claims,
    Json(req): Json<DetailRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let row = sqlx::query(
        "SELECT t.*, p.name as product_name
         FROM transactions t
         LEFT JOIN products p ON t.product_id = p.id
         WHERE t.ref_id = $1 AND t.user_id = $2"
    )
    .bind(&req.ref_id)
    .bind(c.sub)
    .fetch_optional(&s.pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Transaksi tidak ditemukan".into()))?;

    let status: String = row.get("status");
    let status_label = match status.as_str() {
        "success" => "Berhasil",
        "failed" => "Gagal",
        "pending" => "Menunggu",
        "processing" => "Diproses",
        "refunded" => "Dikembalikan",
        _ => "Unknown",
    };

    let sell_price: rust_decimal::Decimal = row.get("sell_price");

    Ok(Json(serde_json::json!({
        "success": true,
        "data": {
            "transaction": {
                "id": row.get::<uuid::Uuid, _>("id"),
                "ref_id": row.get::<String, _>("ref_id"),
                "product_name": row.get::<Option<String>, _>("product_name").unwrap_or_else(|| "Unknown".into()),
                "customer_number": row.get::<String, _>("customer_number"),
                "sell_price": sell_price.to_string(),
                "sell_price_formatted": format!("Rp {}", sell_price.to_string().parse::<f64>().unwrap_or(0.0).ceil() as i64),
                "status": status,
                "status_label": status_label,
                "sn": row.get::<Option<String>, _>("serial_number"),
                "created_at": row.get::<chrono::NaiveDateTime, _>("created_at"),
            }
        }
    })))
}
