use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::error::format_rupiah;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Transaction {
    pub id: Uuid,
    pub user_id: Uuid,
    pub product_id: Uuid,
    pub ref_id: String,
    pub customer_number: String,
    pub base_price: rust_decimal::Decimal,
    pub sell_price: rust_decimal::Decimal,
    pub profit: rust_decimal::Decimal,
    pub status: String,
    pub digiflazz_ref_id: Option<String>,
    pub digiflazz_status: Option<String>,
    pub digiflazz_message: Option<String>,
    pub serial_number: Option<String>,
    pub response_payload: Option<serde_json::Value>,
    pub retry_count: i32,
    pub completed_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionRequest {
    pub product_id: Uuid,
    pub customer_number: String,
}

#[derive(Debug, Serialize)]
pub struct TransactionResponse {
    pub id: Uuid,
    pub ref_id: String,
    pub product_name: String,
    pub customer_number: String,
    pub sell_price: String,
    pub sell_price_formatted: String,
    pub status: String,
    pub status_label: String,
    pub sn: Option<String>,
    pub created_at: NaiveDateTime,
}

impl Transaction {
    pub fn to_response(&self, product_name: &str) -> TransactionResponse {
        let p = self.sell_price.to_string().parse::<f64>().unwrap_or(0.0);
        let label = match self.status.as_str() {
            "pending" => "Menunggu",
            "processing" => "Diproses",
            "success" => "Berhasil",
            "failed" => "Gagal",
            "refunded" => "Dikembalikan",
            "expired" => "Kedaluwarsa",
            _ => &self.status,
        };
        TransactionResponse {
            id: self.id,
            ref_id: self.ref_id.clone(),
            product_name: product_name.to_string(),
            customer_number: self.customer_number.clone(),
            sell_price: self.sell_price.to_string(),
            sell_price_formatted: format_rupiah(p),
            status: self.status.clone(),
            status_label: label.to_string(),
            sn: self.serial_number.clone(),
            created_at: self.created_at,
        }
    }
}
