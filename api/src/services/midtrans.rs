use reqwest::Client;
use serde::{Deserialize, Serialize};
use base64::Engine;

#[derive(Clone)]
pub struct MidtransService {
    server_key: String,
    client_key: String,
    is_production: bool,
    http: Client,
}

#[derive(Debug, Serialize)]
pub struct ChargeRequest {
    pub payment_type: String,
    #[serde(rename = "transaction_details")]
    pub transaction_details: TransactionDetails,
    #[serde(rename = "customer_details", skip_serializing_if = "Option::is_none")]
    pub customer_details: Option<CustomerDetails>,
    #[serde(rename = "bank_transfer", skip_serializing_if = "Option::is_none")]
    pub bank_transfer: Option<BankTransfer>,
    #[serde(rename = "ewallet", skip_serializing_if = "Option::is_none")]
    pub ewallet: Option<Ewallet>,
    #[serde(rename = "cstore", skip_serializing_if = "Option::is_none")]
    pub cstore: Option<Cstore>,
    #[serde(rename = "credit_card", skip_serializing_if = "Option::is_none")]
    pub credit_card: Option<CreditCard>,
    #[serde(rename = "qris", skip_serializing_if = "Option::is_none")]
    pub qris: Option<Qris>,
    #[serde(rename = "expiry", skip_serializing_if = "Option::is_none")]
    pub expiry: Option<Expiry>,
}

#[derive(Debug, Serialize)]
pub struct TransactionDetails {
    pub order_id: String,
    pub gross_amount: i64,
}

#[derive(Debug, Serialize)]
pub struct CustomerDetails {
    pub first_name: String,
    pub email: String,
    pub phone: String,
}

#[derive(Debug, Serialize)]
pub struct BankTransfer {
    pub bank: String,
}

#[derive(Debug, Serialize)]
pub struct Ewallet {
    #[serde(rename = "payment_code")]
    pub payment_code: String,
}

#[derive(Debug, Serialize)]
pub struct Cstore {
    pub store: String,
    #[serde(rename = "message")]
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct CreditCard {
    pub secure: bool,
}

#[derive(Debug, Serialize)]
pub struct Qris {}

#[derive(Debug, Serialize)]
pub struct Expiry {
    pub unit: String,
    pub duration: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChargeResponse {
    pub status_code: String,
    pub status_message: String,
    pub transaction_id: Option<String>,
    pub order_id: String,
    pub gross_amount: String,
    pub payment_type: Option<String>,
    pub transaction_status: Option<String>,
    pub transaction_time: Option<String>,
    pub expiry_time: Option<String>,
    pub va_numbers: Option<Vec<VaNumber>>,
    pub permata_va_number: Option<String>,
    pub bill_key: Option<String>,
    pub biller_code: Option<String>,
    pub actions: Option<Vec<Action>>,
    pub qris_url: Option<String>,
    pub finish_redirect_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VaNumber {
    pub bank: String,
    pub va_number: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Action {
    pub name: String,
    pub method: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatusResponse {
    pub status_code: String,
    pub status_message: String,
    pub transaction_id: Option<String>,
    pub order_id: String,
    pub gross_amount: String,
    pub payment_type: Option<String>,
    pub transaction_status: Option<String>,
    pub transaction_time: Option<String>,
    pub settlement_time: Option<String>,
    pub va_numbers: Option<Vec<VaNumber>>,
    pub fraud_status: Option<String>,
}

impl MidtransService {
    pub fn new(server_key: String, client_key: String, is_production: bool) -> Self {
        Self {
            server_key,
            client_key,
            is_production,
            http: Client::new(),
        }
    }

    fn base_url(&self) -> &str {
        if self.is_production {
            "https://api.midtrans.com/v2"
        } else {
            "https://api.sandbox.midtrans.com/v2"
        }
    }

    fn snap_url(&self) -> &str {
        if self.is_production {
            "https://app.midtrans.com/snap/v1"
        } else {
            "https://app.sandbox.midtrans.com/snap/v1"
        }
    }

    pub fn get_client_key(&self) -> &str {
        &self.client_key
    }

    pub fn is_production(&self) -> bool {
        self.is_production
    }

    fn auth_header(&self) -> String {
        let encoded = base64::engine::general_purpose::STANDARD.encode(format!("{}:", &self.server_key));
        format!("Basic {}", encoded)
    }

    pub async fn charge(&self, req: &ChargeRequest) -> Result<ChargeResponse, String> {
        let url = format!("{}/charge", self.base_url());
        let resp = self.http.post(&url)
            .header("Authorization", self.auth_header())
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .json(req)
            .send()
            .await
            .map_err(|e| format!("Request error: {}", e))?;

        let status = resp.status();
        let body = resp.text().await.map_err(|e| format!("Body error: {}", e))?;

        if status.is_success() {
            serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))
        } else {
            Err(format!("Midtrans error ({}): {}", status, body))
        }
    }

    pub async fn check_status(&self, order_id: &str) -> Result<StatusResponse, String> {
        let url = format!("{}/{}/status", self.base_url(), order_id);
        let resp = self.http.get(&url)
            .header("Authorization", self.auth_header())
            .header("Accept", "application/json")
            .send()
            .await
            .map_err(|e| format!("Request error: {}", e))?;

        let status = resp.status();
        let body = resp.text().await.map_err(|e| format!("Body error: {}", e))?;

        if status.is_success() {
            serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))
        } else {
            Err(format!("Status check error ({}): {}", status, body))
        }
    }

    pub async fn cancel(&self, order_id: &str) -> Result<StatusResponse, String> {
        let url = format!("{}/{}/cancel", self.base_url(), order_id);
        let resp = self.http.post(&url)
            .header("Authorization", self.auth_header())
            .header("Accept", "application/json")
            .send()
            .await
            .map_err(|e| format!("Request error: {}", e))?;

        let status = resp.status();
        let body = resp.text().await.map_err(|e| format!("Body error: {}", e))?;

        if status.is_success() {
            serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))
        } else {
            Err(format!("Cancel error ({}): {}", status, body))
        }
    }

    pub async fn approve(&self, order_id: &str) -> Result<StatusResponse, String> {
        let url = format!("{}/{}/approve", self.base_url(), order_id);
        let resp = self.http.post(&url)
            .header("Authorization", self.auth_header())
            .header("Accept", "application/json")
            .send()
            .await
            .map_err(|e| format!("Request error: {}", e))?;

        let status = resp.status();
        let body = resp.text().await.map_err(|e| format!("Body error: {}", e))?;

        if status.is_success() {
            serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))
        } else {
            Err(format!("Approve error ({}): {}", status, body))
        }
    }

    pub async fn create_snap_token(&self, req: &ChargeRequest) -> Result<String, String> {
        let url = format!("{}/transactions", self.snap_url());
        let resp = self.http.post(&url)
            .header("Authorization", self.auth_header())
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .json(req)
            .send()
            .await
            .map_err(|e| format!("Request error: {}", e))?;

        let status = resp.status();
        let body = resp.text().await.map_err(|e| format!("Body error: {}", e))?;

        if status.is_success() {
            let result: serde_json::Value = serde_json::from_str(&body)
                .map_err(|e| format!("Parse error: {}", e))?;
            result.get("token")
                .and_then(|t| t.as_str())
                .map(|s| s.to_string())
                .ok_or_else(|| "No token in response".to_string())
        } else {
            Err(format!("Snap error ({}): {}", status, body))
        }
    }
}
