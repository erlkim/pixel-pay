use axum::{extract::State, Json};
use sqlx::PgPool;
use serde::Deserialize;
use crate::{error::AppError, middleware::Claims, services::WalletService};

#[derive(Deserialize)]
pub struct TopUpReq {
    pub amount: rust_decimal::Decimal,
}

pub async fn get_balance(
    State(p): State<PgPool>,
    c: Claims,
) -> Result<Json<serde_json::Value>, AppError> {
    let w = WalletService::get_balance(&p, c.sub).await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "wallet": w }
    })))
}

pub async fn topup(
    State(p): State<PgPool>,
    c: Claims,
    Json(req): Json<TopUpReq>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.amount <= rust_decimal::Decimal::ZERO {
        return Err(AppError::Validation("Jumlah harus lebih dari 0".into()));
    }
    let w = WalletService::credit(
        &p,
        c.sub,
        req.amount,
        "Top up saldo",
        None,
    )
    .await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Top up berhasil",
        "data": { "wallet": w.to_response() }
    })))
}

pub async fn get_history(
    State(p): State<PgPool>,
    c: Claims,
) -> Result<Json<serde_json::Value>, AppError> {
    let logs = WalletService::get_logs(&p, c.sub, 50).await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "logs": logs }
    })))
}
