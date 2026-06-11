use axum::{extract::State, Json};
use serde::Deserialize;
use sqlx::{PgPool, Row};
use crate::{error::AppError, middleware::Claims};

#[derive(Deserialize)]
pub struct ApplyVoucherReq {
    pub code: String,
    pub amount: f64,
}

pub async fn list_available(
    State(p): State<PgPool>,
    c: Claims,
) -> Result<Json<serde_json::Value>, AppError> {
    let vouchers = sqlx::query(
        "SELECT id, code, description, discount_type, discount_value, min_transaction, max_discount, expires_at
         FROM vouchers
         WHERE is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())
         AND used_count < usage_limit
         AND id NOT IN (SELECT voucher_id FROM user_vouchers WHERE user_id = $1)
         ORDER BY created_at DESC",
    )
    .bind(c.sub)
    .fetch_all(&p)
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
            "expires_at": v.get::<Option<chrono::NaiveDateTime>, _>("expires_at"),
        })
    }).collect();

    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "vouchers": result }
    })))
}

pub async fn apply(
    State(p): State<PgPool>,
    c: Claims,
    Json(req): Json<ApplyVoucherReq>,
) -> Result<Json<serde_json::Value>, AppError> {
    let voucher = sqlx::query(
        "SELECT id, code, description, discount_type, discount_value, min_transaction, max_discount, used_count, usage_limit, expires_at
         FROM vouchers WHERE code = $1 AND is_active = true",
    )
    .bind(req.code.to_uppercase())
    .fetch_optional(&p)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Voucher tidak ditemukan".into()))?;

    let expires_at = voucher.get::<Option<chrono::NaiveDateTime>, _>("expires_at");
    if let Some(exp) = expires_at {
        if exp < chrono::Utc::now().naive_utc() {
            return Err(AppError::Validation("Voucher sudah expired".into()));
        }
    }

    let used_count: i32 = voucher.get("used_count");
    let usage_limit: i32 = voucher.get("usage_limit");
    if used_count >= usage_limit {
        return Err(AppError::Validation("Voucher sudah habis".into()));
    }

    let min_transaction: f64 = voucher.get::<rust_decimal::Decimal, _>("min_transaction").to_string().parse().unwrap_or(0.0);
    if req.amount < min_transaction {
        return Err(AppError::Validation(format!("Minimal transaksi Rp {}", min_transaction)));
    }

    let voucher_id: uuid::Uuid = voucher.get("id");
    let already_used = sqlx::query_as::<_, (i64,)>(
        "SELECT COUNT(*) FROM user_vouchers WHERE user_id = $1 AND voucher_id = $2",
    )
    .bind(c.sub)
    .bind(voucher_id)
    .fetch_one(&p)
    .await
    .unwrap_or((0,));

    if already_used.0 > 0 {
        return Err(AppError::Validation("Voucher sudah pernah dipakai".into()));
    }

    let discount_type: String = voucher.get("discount_type");
    let discount_value: f64 = voucher.get::<rust_decimal::Decimal, _>("discount_value").to_string().parse().unwrap_or(0.0);
    let max_discount: f64 = voucher.get::<Option<rust_decimal::Decimal>, _>("max_discount")
        .map(|d| d.to_string().parse::<f64>().unwrap_or(0.0))
        .unwrap_or(f64::MAX);

    let mut discount = if discount_type == "percentage" {
        req.amount * discount_value / 100.0
    } else {
        discount_value
    };

    if discount > max_discount {
        discount = max_discount;
    }
    if discount > req.amount {
        discount = req.amount;
    }

    let code: String = voucher.get("code");

    Ok(Json(serde_json::json!({
        "success": true,
        "data": {
            "voucher_id": voucher_id,
            "code": code,
            "discount": discount,
            "discount_formatted": format!("Rp {}", discount.ceil() as i64),
            "original_amount": req.amount,
            "final_amount": req.amount - discount,
        }
    })))
}
