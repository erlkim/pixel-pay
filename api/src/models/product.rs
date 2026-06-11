use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::error::format_rupiah;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Product {
    pub id: Uuid,
    pub category_id: Uuid,
    pub sku: String,
    pub buyer_sku_code: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub provider: String,
    pub brand: Option<String>,
    #[sqlx(rename = "type")]
    pub product_type: Option<String>,
    pub base_price: rust_decimal::Decimal,
    pub sell_price: rust_decimal::Decimal,
    pub profit: rust_decimal::Decimal,
    pub is_active: bool,
    pub buyer_product_status: bool,
    pub seller_product_status: bool,
    pub stock: i32,
    pub unlimited_stock: bool,
    pub synced_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Serialize)]
#[allow(dead_code)]
pub struct ProductListItem {
    pub id: Uuid,
    pub name: String,
    pub provider: String,
    pub brand: Option<String>,
    pub sell_price: String,
    pub sell_price_formatted: String,
    pub stock: i32,
    pub is_available: bool,
}

impl Product {
    #[allow(dead_code)]
    pub fn to_list_item(&self) -> ProductListItem {
        let p = self.sell_price.to_string().parse::<f64>().unwrap_or(0.0);
        ProductListItem {
            id: self.id,
            name: self.name.clone(),
            provider: self.provider.clone(),
            brand: self.brand.clone(),
            sell_price: self.sell_price.to_string(),
            sell_price_formatted: format_rupiah(p),
            stock: self.stock,
            is_available: self.is_active
                && self.buyer_product_status
                && self.seller_product_status
                && (self.unlimited_stock || self.stock > 0),
        }
    }
}
