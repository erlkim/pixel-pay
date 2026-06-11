use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::error::format_rupiah;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Wallet {
    pub id: Uuid,
    pub user_id: Uuid,
    pub balance: rust_decimal::Decimal,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct TopUpRequest {
    pub amount: rust_decimal::Decimal,
    pub method: String,
}

#[derive(Debug, Serialize)]
pub struct WalletResponse {
    pub id: Uuid,
    pub balance: String,
    pub balance_formatted: String,
}

impl Wallet {
    pub fn to_response(&self) -> WalletResponse {
        let b = self.balance.to_string().parse::<f64>().unwrap_or(0.0);
        WalletResponse {
            id: self.id,
            balance: self.balance.to_string(),
            balance_formatted: format_rupiah(b),
        }
    }
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct BalanceLog {
    pub id: Uuid,
    pub wallet_id: Uuid,
    pub amount: rust_decimal::Decimal,
    #[sqlx(rename = "type")]
    pub log_type: String,
    pub description: String,
    pub ref_id: Option<String>,
    pub balance_before: rust_decimal::Decimal,
    pub balance_after: rust_decimal::Decimal,
    pub created_at: NaiveDateTime,
}
