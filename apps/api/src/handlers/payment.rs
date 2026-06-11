use axum::{extract::{State, Query}, Json};
use serde::Deserialize;
use sqlx::Row;
use crate::{
    error::AppError,
    middleware::Claims,
    services::midtrans::*,
    handlers::admin::AdminState,
};

fn midtrans_from_env() -> MidtransService {
    let server_key = std::env::var("MIDTRANS_SERVER_KEY").unwrap_or_default();
    let client_key = std::env::var("MIDTRANS_CLIENT_KEY").unwrap_or_default();
    let is_prod = std::env::var("MIDTRANS_IS_PRODUCTION").unwrap_or_default() == "true";
    MidtransService::new(server_key, client_key, is_prod)
}

#[derive(Deserialize)]
pub struct PaymentMethodQuery {
    pub min_amount: Option<f64>,
}

pub async fn list_payment_methods(
    State(s): State<AdminState>,
    _c: Claims,
    Query(_q): Query<PaymentMethodQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = sqlx::query(
        "SELECT id, code, name, method_type, provider, icon, fee_flat, fee_percent, min_amount, max_amount, instructions, sort_order
         FROM payment_methods WHERE is_active = true ORDER BY sort_order",
    )
    .fetch_all(&s.pool)
    .await
    .map_err(AppError::Database)?;

    let methods: Vec<serde_json::Value> = rows.iter().map(|r| {
        serde_json::json!({
            "id": r.get::<uuid::Uuid, _>("id"),
            "code": r.get::<String, _>("code"),
            "name": r.get::<String, _>("name"),
            "method_type": r.get::<String, _>("method_type"),
            "icon": r.get::<Option<String>, _>("icon"),
            "fee_flat": r.get::<rust_decimal::Decimal, _>("fee_flat").to_string().parse::<f64>().unwrap_or(0.0),
            "fee_percent": r.get::<rust_decimal::Decimal, _>("fee_percent").to_string().parse::<f64>().unwrap_or(0.0),
            "min_amount": r.get::<rust_decimal::Decimal, _>("min_amount").to_string().parse::<f64>().unwrap_or(0.0),
            "max_amount": r.get::<rust_decimal::Decimal, _>("max_amount").to_string().parse::<f64>().unwrap_or(0.0),
            "instructions": r.get::<Option<String>, _>("instructions"),
        })
    }).collect();

    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "payment_methods": methods }
    })))
}

#[derive(Deserialize)]
pub struct CreatePaymentReq {
    pub payment_method_code: String,
    pub amount: f64,
}

pub async fn create_payment(
    State(s): State<AdminState>,
    c: Claims,
    Json(req): Json<CreatePaymentReq>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Get payment method
    let method = sqlx::query(
        "SELECT * FROM payment_methods WHERE code = $1 AND is_active = true",
    )
    .bind(&req.payment_method_code)
    .fetch_optional(&s.pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Metode pembayaran tidak ditemukan".into()))?;

    let fee_flat: f64 = method.get::<rust_decimal::Decimal, _>("fee_flat").to_string().parse().unwrap_or(0.0);
    let fee_percent: f64 = method.get::<rust_decimal::Decimal, _>("fee_percent").to_string().parse().unwrap_or(0.0);
    let min_amount: f64 = method.get::<rust_decimal::Decimal, _>("min_amount").to_string().parse().unwrap_or(0.0);
    let max_amount: f64 = method.get::<rust_decimal::Decimal, _>("max_amount").to_string().parse().unwrap_or(0.0);

    if req.amount < min_amount {
        return Err(AppError::Validation(format!("Minimal top up Rp {}", min_amount as i64)));
    }
    if req.amount > max_amount {
        return Err(AppError::Validation(format!("Maksimal top up Rp {}", max_amount as i64)));
    }

    let fee = fee_flat + (req.amount * fee_percent / 100.0);
    let total = req.amount + fee;

    // Generate order ID
    let order_id = format!("PP-TOPUP-{}", uuid::Uuid::new_v4().to_string().split('-').next().unwrap_or("00000000"));

    // Get user info
    let user = sqlx::query_as::<_, crate::models::user::User>("SELECT * FROM users WHERE id = $1")
        .bind(c.sub)
        .fetch_one(&s.pool)
        .await
        .map_err(AppError::Database)?;

    let _method_code: String = method.get("code");
    let midtrans_code: Option<String> = method.get("midtrans_code");
    let method_type: String = method.get("method_type");

    // Build Midtrans charge request
    let payment_type = match method_type.as_str() {
        "bank_transfer" => match midtrans_code.as_deref().unwrap_or("") {
            "echannel" => "echannel".to_string(),
            "permata_va" => "permata_va".to_string(),
            _ => "bank_transfer".to_string(),
        },
        "ewallet" => match midtrans_code.as_deref().unwrap_or("") {
            "gopay" => "gopay".to_string(),
            "shopeepay" => "shopeepay".to_string(),
            _ => "gopay".to_string(),
        },
        "qris" => "qris".to_string(),
        "cstore" => "cstore".to_string(),
        "credit_card" => "credit_card".to_string(),
        _ => "bank_transfer".to_string(),
    };

    let bank_transfer = match method_type.as_str() {
        "bank_transfer" => {
            let bank = match midtrans_code.as_deref().unwrap_or("") {
                "bca_va" => "bca",
                "bni_va" => "bni",
                "bri_va" => "bri",
                "permata_va" => "permata",
                "echannel" => "mandiri",
                _ => "bca",
            };
            Some(BankTransfer { bank: bank.to_string() })
        }
        _ => None,
    };

    let charge_req = ChargeRequest {
        payment_type: payment_type.clone(),
        transaction_details: TransactionDetails {
            order_id: order_id.clone(),
            gross_amount: total.round() as i64,
        },
        customer_details: Some(CustomerDetails {
            first_name: user.full_name.clone(),
            email: user.email.clone(),
            phone: user.phone.clone(),
        }),
        bank_transfer,
        ewallet: None,
        cstore: if method_type == "cstore" {
            Some(Cstore {
                store: midtrans_code.clone().unwrap_or_default(),
                message: format!("Top up Pixel Pay {}", order_id),
            })
        } else { None },
        credit_card: if method_type == "credit_card" {
            Some(CreditCard { secure: true })
        } else { None },
        qris: if method_type == "qris" { Some(Qris {}) } else { None },
        expiry: Some(Expiry { unit: "minutes".to_string(), duration: 60 }),
    };

    // Call Midtrans from .env
    let midtrans = midtrans_from_env();

    let charge_result = midtrans.charge(&charge_req).await
        .map_err(|e| AppError::Internal(format!("Payment gateway error: {}", e)))?;

    // Extract VA numbers, bill key, QR string
    let va_number = charge_result.va_numbers.as_ref()
        .and_then(|v| v.first())
        .map(|v| v.va_number.clone())
        .or(charge_result.permata_va_number.clone());

    let bank = charge_result.va_numbers.as_ref()
        .and_then(|v| v.first())
        .map(|v| v.bank.clone());

    let bill_key = charge_result.bill_key.clone();
    let bill_code = charge_result.biller_code.clone();

    let qr_string = charge_result.actions.as_ref()
        .and_then(|a| a.iter().find(|x| x.name == "generate-qr-code" || x.name == "qr-code"))
        .map(|a| a.url.clone())
        .or(charge_result.qris_url.clone());

    // Save to database
    sqlx::query(
        "INSERT INTO payment_transactions (user_id, payment_method_id, order_id, amount, fee, total_amount, status, payment_type, midtrans_transaction_id, midtrans_status, midtrans_response, va_number, bank, bill_key, bill_code, qr_string, expiry_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW() + INTERVAL '1 hour')"
    )
    .bind(c.sub)
    .bind(method.get::<uuid::Uuid, _>("id"))
    .bind(&order_id)
    .bind(rust_decimal::Decimal::try_from(req.amount).unwrap_or_default())
    .bind(rust_decimal::Decimal::try_from(fee).unwrap_or_default())
    .bind(rust_decimal::Decimal::try_from(total).unwrap_or_default())
    .bind("pending")
    .bind(&payment_type)
    .bind(&charge_result.transaction_id)
    .bind(&charge_result.transaction_status)
    .bind(serde_json::to_string(&charge_result).unwrap_or_default())
    .bind(&va_number)
    .bind(&bank)
    .bind(&bill_key)
    .bind(&bill_code)
    .bind(&qr_string)
    .execute(&s.pool)
    .await
    .map_err(AppError::Database)?;

    // Build response
    let mut resp = serde_json::json!({
        "success": true,
        "data": {
            "order_id": order_id,
            "amount": req.amount,
            "fee": fee,
            "total_amount": total,
            "payment_type": payment_type,
            "method_name": method.get::<String, _>("name"),
            "method_type": method_type,
            "status": "pending",
            "transaction_id": charge_result.transaction_id,
            "expiry": charge_result.expiry_time,
        }
    });

    // Add payment-specific data
    if let Some(vn) = &charge_result.va_numbers {
        if let Some(first) = vn.first() {
            resp["data"]["va_number"] = serde_json::json!(first.va_number);
            resp["data"]["bank"] = serde_json::json!(first.bank);
            resp["data"]["instructions"] = serde_json::json!(format!("Transfer ke {} Virtual Account: {}", first.bank.to_uppercase(), first.va_number));
        }
    }
    if let Some(pva) = &charge_result.permata_va_number {
        resp["data"]["va_number"] = serde_json::json!(pva);
        resp["data"]["bank"] = serde_json::json!("permata");
    }
    if let Some(bk) = &charge_result.bill_key {
        resp["data"]["bill_key"] = serde_json::json!(bk);
        resp["data"]["bill_code"] = serde_json::json!(&charge_result.biller_code);
        resp["data"]["instructions"] = serde_json::json!(format!("Gunakan kode: {} / {}", charge_result.biller_code.as_deref().unwrap_or(""), bk));
    }
    if let Some(qr) = &qr_string {
        resp["data"]["qr_url"] = serde_json::json!(qr);
    }

    Ok(Json(resp))
}

#[derive(Deserialize)]
pub struct CheckStatusQuery {
    pub order_id: String,
}

pub async fn check_payment_status(
    State(s): State<AdminState>,
    c: Claims,
    Query(q): Query<CheckStatusQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let pt = sqlx::query("SELECT * FROM payment_transactions WHERE order_id = $1 AND user_id = $2")
        .bind(&q.order_id)
        .bind(c.sub)
        .fetch_optional(&s.pool)
        .await
        .map_err(AppError::Database)?
        .ok_or_else(|| AppError::NotFound("Transaksi tidak ditemukan".into()))?;

    let status: String = pt.get("status");

    // If already paid/failed, just return current status
    if status == "paid" || status == "failed" || status == "refunded" {
        return Ok(Json(serde_json::json!({
            "success": true,
            "data": {
                "order_id": q.order_id,
                "status": status,
                "amount": pt.get::<rust_decimal::Decimal, _>("amount").to_string().parse::<f64>().unwrap_or(0.0),
                "paid_at": pt.get::<Option<chrono::NaiveDateTime>, _>("paid_at"),
            }
        })));
    }

    // Check with Midtrans from .env
    let midtrans = midtrans_from_env();

    match midtrans.check_status(&q.order_id).await {
        Ok(status_resp) => {
            let new_status = match status_resp.transaction_status.as_deref().unwrap_or("") {
                "capture" | "settlement" => "paid",
                "pending" => "pending",
                "deny" | "cancel" | "failure" => "failed",
                "expire" => "failed",
                _ => "pending",
            };

            if new_status == "paid" && status != "paid" {
                // Credit wallet
                let amount: f64 = pt.get::<rust_decimal::Decimal, _>("amount").to_string().parse().unwrap_or(0.0);
                let uid: uuid::Uuid = pt.get("user_id");
                let order: String = pt.get("order_id");

                crate::services::WalletService::credit(
                    &s.pool, uid,
                    rust_decimal::Decimal::try_from(amount).unwrap_or_default(),
                    &format!("Top up via Midtrans - {}", order),
                    Some(&order),
                ).await?;

                sqlx::query("UPDATE payment_transactions SET status = 'paid', paid_at = NOW(), midtrans_status = $1, updated_at = NOW() WHERE order_id = $2")
                    .bind(&status_resp.transaction_status)
                    .bind(&q.order_id)
                    .execute(&s.pool)
                    .await
                    .map_err(AppError::Database)?;

                // Send notification
                let _ = sqlx::query(
                    "INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES ($1, 'Top Up Berhasil!', $2, 'topup', $3)"
                )
                .bind(uid)
                .bind(format!("Top up Rp {} berhasil masuk ke wallet Anda.", amount as i64))
                .bind(&q.order_id)
                .execute(&s.pool).await;

            } else if new_status == "failed" && status == "pending" {
                sqlx::query("UPDATE payment_transactions SET status = 'failed', midtrans_status = $1, updated_at = NOW() WHERE order_id = $2")
                    .bind(&status_resp.transaction_status)
                    .bind(&q.order_id)
                    .execute(&s.pool)
                    .await
                    .map_err(AppError::Database)?;
            }

            Ok(Json(serde_json::json!({
                "success": true,
                "data": {
                    "order_id": q.order_id,
                    "status": new_status,
                    "midtrans_status": status_resp.transaction_status,
                    "amount": pt.get::<rust_decimal::Decimal, _>("amount").to_string().parse::<f64>().unwrap_or(0.0),
                    "paid_at": if new_status == "paid" { Some(chrono::Utc::now().naive_utc()) } else { None },
                }
            })))
        }
        Err(e) => Ok(Json(serde_json::json!({
            "success": true,
            "data": {
                "order_id": q.order_id,
                "status": status,
                "error": e,
            }
        }))),
    }
}

// Admin: list all payment transactions
pub async fn admin_list_payments(
    State(s): State<AdminState>,
    _a: crate::middleware::AdminClaims,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = sqlx::query(
        "SELECT pt.*, u.full_name, u.email, pm.name as method_name, pm.icon as method_icon
         FROM payment_transactions pt
         LEFT JOIN users u ON pt.user_id = u.id
         LEFT JOIN payment_methods pm ON pt.payment_method_id = pm.id
         ORDER BY pt.created_at DESC LIMIT 200",
    )
    .fetch_all(&s.pool)
    .await
    .map_err(AppError::Database)?;

    let result: Vec<serde_json::Value> = rows.iter().map(|r| {
        serde_json::json!({
            "id": r.get::<uuid::Uuid, _>("id"),
            "order_id": r.get::<String, _>("order_id"),
            "user_name": r.get::<Option<String>, _>("full_name"),
            "user_email": r.get::<Option<String>, _>("email"),
            "method_name": r.get::<Option<String>, _>("method_name"),
            "method_icon": r.get::<Option<String>, _>("method_icon"),
            "amount": r.get::<rust_decimal::Decimal, _>("amount").to_string().parse::<f64>().unwrap_or(0.0),
            "fee": r.get::<rust_decimal::Decimal, _>("fee").to_string().parse::<f64>().unwrap_or(0.0),
            "total_amount": r.get::<rust_decimal::Decimal, _>("total_amount").to_string().parse::<f64>().unwrap_or(0.0),
            "status": r.get::<String, _>("status"),
            "payment_type": r.get::<Option<String>, _>("payment_type"),
            "va_number": r.get::<Option<String>, _>("va_number"),
            "bank": r.get::<Option<String>, _>("bank"),
            "paid_at": r.get::<Option<chrono::NaiveDateTime>, _>("paid_at"),
            "created_at": r.get::<chrono::NaiveDateTime, _>("created_at"),
        })
    }).collect();

    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "payments": result, "total": result.len() }
    })))
}

// Midtrans config for frontend (Snap token)
pub async fn midtrans_config(
    State(_s): State<AdminState>,
    _c: Claims,
) -> Result<Json<serde_json::Value>, AppError> {
    let client_key = std::env::var("MIDTRANS_CLIENT_KEY").unwrap_or_default();
    let is_prod = std::env::var("MIDTRANS_IS_PRODUCTION").unwrap_or_default() == "true";

    Ok(Json(serde_json::json!({
        "success": true,
        "data": {
            "client_key": client_key,
            "is_production": is_prod,
        }
    })))
}

// Midtrans notification webhook
pub async fn midtrans_notification(
    State(s): State<AdminState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let order_id = payload.get("order_id").and_then(|v| v.as_str()).unwrap_or("");
    let transaction_status = payload.get("transaction_status").and_then(|v| v.as_str()).unwrap_or("");
    let fraud_status = payload.get("fraud_status").and_then(|v| v.as_str()).unwrap_or("");

    let pt = sqlx::query("SELECT * FROM payment_transactions WHERE order_id = $1")
        .bind(order_id)
        .fetch_optional(&s.pool)
        .await
        .map_err(AppError::Database)?;

    if let Some(pt) = pt {
        let current_status: String = pt.get("status");

        let new_status = match transaction_status {
            "capture" => {
                if fraud_status == "accept" { "paid" } else { "pending" }
            }
            "settlement" => "paid",
            "pending" => "pending",
            "deny" | "cancel" | "failure" => "failed",
            "expire" => "failed",
            _ => "pending",
        };

        if new_status == "paid" && current_status != "paid" {
            let amount: f64 = pt.get::<rust_decimal::Decimal, _>("amount").to_string().parse().unwrap_or(0.0);
            let uid: uuid::Uuid = pt.get("user_id");

            crate::services::WalletService::credit(
                &s.pool, uid,
                rust_decimal::Decimal::try_from(amount).unwrap_or_default(),
                &format!("Top up via Midtrans - {}", order_id),
                Some(order_id),
            ).await?;

            sqlx::query("UPDATE payment_transactions SET status = 'paid', paid_at = NOW(), midtrans_status = $1, midtrans_response = $2, updated_at = NOW() WHERE order_id = $3")
                .bind(transaction_status)
                .bind(serde_json::to_string(&payload).unwrap_or_default())
                .bind(order_id)
                .execute(&s.pool)
                .await
                .map_err(AppError::Database)?;

            let _ = sqlx::query(
                "INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES ($1, 'Top Up Berhasil!', $2, 'topup', $3)"
            )
            .bind(uid)
            .bind(format!("Top up Rp {} berhasil!", amount as i64))
            .bind(order_id)
            .execute(&s.pool).await;
        } else if new_status == "failed" {
            sqlx::query("UPDATE payment_transactions SET status = 'failed', midtrans_status = $1, midtrans_response = $2, updated_at = NOW() WHERE order_id = $3")
                .bind(transaction_status)
                .bind(serde_json::to_string(&payload).unwrap_or_default())
                .bind(order_id)
                .execute(&s.pool)
                .await
                .map_err(AppError::Database)?;
        }
    }

    Ok(Json(serde_json::json!({"status": "ok"})))
}
