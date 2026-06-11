use reqwest::Client;
use serde::{Deserialize, Serialize};
use md5::Md5;
use md5::Digest;
use crate::config::AppConfig;
use crate::error::AppError;

#[derive(Clone)]
pub struct DigiflazzService {
    client: Client,
    config: AppConfig,
}

#[derive(Debug, Deserialize)]
pub struct DgApiResponse<T> {
    pub data: Option<T>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DgTransaction {
    pub ref_id: String,
    pub status: String,
    pub message: String,
    pub sn: Option<String>,
    pub price: Option<f64>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DgProduct {
    pub buyer_sku_code: String,
    pub product_name: String,
    pub category: String,
    pub brand: String,
    #[serde(rename = "type")]
    pub product_type: String,
    pub price: f64,
    pub buyer_product_status: bool,
    pub seller_product_status: bool,
    pub unlimited_stock: bool,
    pub stock: Option<i32>,
}

impl DigiflazzService {
    pub fn new(config: AppConfig) -> Self {
        Self {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap(),
            config,
        }
    }

    fn sign(&self, ref_id: &str) -> String {
        let input = format!(
            "{}{}{}",
            self.config.digiflazz_username, self.config.digiflazz_api_key, ref_id
        );
        let mut hasher = Md5::new();
        hasher.update(input.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    pub fn is_testing(&self) -> bool {
        self.config.digiflazz_api_key.starts_with("dev-")
    }

    pub async fn price_list(&self, cmd: &str) -> Result<Vec<DgProduct>, AppError> {
        let body = serde_json::json!({
            "cmd": cmd,
            "username": self.config.digiflazz_username,
            "sign": self.sign("pricelist")
        });
        let r = self
            .client
            .post(format!(
                "{}/price-list",
                self.config.digiflazz_base_url
            ))
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Digiflazz(e.to_string()))?;
        let res: DgApiResponse<Vec<DgProduct>> = r
            .json()
            .await
            .map_err(|e| AppError::Digiflazz(e.to_string()))?;
        Ok(res.data.unwrap_or_default())
    }

    pub async fn buy(
        &self,
        sku: &str,
        customer_no: &str,
        ref_id: &str,
    ) -> Result<DgTransaction, AppError> {
        let sign = self.sign(ref_id);
        let testing = self.is_testing();

        tracing::info!(
            "Digiflazz buy: sku={}, customer={}, ref_id={}, testing={}, sign={}",
            sku, customer_no, ref_id, testing, sign
        );

        let mut body = serde_json::json!({
            "username": self.config.digiflazz_username,
            "buyer_sku_code": sku,
            "customer_no": customer_no,
            "ref_id": ref_id,
            "sign": sign
        });

        // Auto-add testing: true kalau pakai dev key
        if testing {
            body["testing"] = serde_json::json!(true);
        }

        let r = self
            .client
            .post(format!(
                "{}/transaction",
                self.config.digiflazz_base_url
            ))
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Digiflazz(e.to_string()))?;

        let status = r.status();
        let body_text = r.text().await.map_err(|e| AppError::Digiflazz(e.to_string()))?;

        tracing::info!("Digiflazz response ({}): {}", status, body_text);

        let res: DgApiResponse<DgTransaction> = serde_json::from_str(&body_text)
            .map_err(|e| AppError::Digiflazz(format!("Parse error: {} - body: {}", e, body_text)))?;

        res.data
            .ok_or_else(|| AppError::Digiflazz(format!("Empty response: {}", body_text)))
    }

    #[allow(dead_code)]
    pub async fn check(&self, ref_id: &str) -> Result<DgTransaction, AppError> {
        let sign = self.sign(ref_id);
        let mut body = serde_json::json!({
            "username": self.config.digiflazz_username,
            "ref_id": ref_id,
            "sign": sign
        });
        if self.is_testing() {
            body["testing"] = serde_json::json!(true);
        }
        let r = self
            .client
            .post(format!(
                "{}/transaction",
                self.config.digiflazz_base_url
            ))
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Digiflazz(e.to_string()))?;
        let res: DgApiResponse<DgTransaction> = r
            .json()
            .await
            .map_err(|e| AppError::Digiflazz(e.to_string()))?;
        res.data
            .ok_or_else(|| AppError::Digiflazz("Not found".into()))
    }
}
