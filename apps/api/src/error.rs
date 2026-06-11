use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

pub fn format_rupiah(val: f64) -> String {
    let s = format!("{:.0}", val);
    let mut result = String::new();
    let chars: Vec<char> = s.chars().collect();
    let len = chars.len();
    for (i, c) in chars.iter().enumerate() {
        if i > 0 && (len - i) % 3 == 0 {
            result.push('.');
        }
        result.push(*c);
    }
    format!("Rp {}", result)
}

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Auth error: {0}")]
    Auth(String),
    #[error("Forbidden: {0}")]
    #[allow(dead_code)]
    Forbidden(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Validation: {0}")]
    Validation(String),
    #[error("Insufficient balance")]
    InsufficientBalance { need: String, have: String },
    #[error("Digiflazz error: {0}")]
    Digiflazz(String),
    #[error("Internal error: {0}")]
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, msg) = match &self {
            AppError::Database(e) => {
                tracing::error!("DB: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR", "Kesalahan sistem".into())
            }
            AppError::Auth(m) => (StatusCode::UNAUTHORIZED, "AUTH_ERROR", m.clone()),
            AppError::Forbidden(m) => (StatusCode::FORBIDDEN, "FORBIDDEN", m.clone()),
            AppError::NotFound(m) => (StatusCode::NOT_FOUND, "NOT_FOUND", m.clone()),
            AppError::Validation(m) => (StatusCode::BAD_REQUEST, "VALIDATION", m.clone()),
            AppError::InsufficientBalance { need, have } => (
                StatusCode::BAD_REQUEST,
                "INSUFFICIENT_BALANCE",
                format!("Butuh {}, punya {}", need, have),
            ),
            AppError::Digiflazz(m) => {
                tracing::error!("Digiflazz: {}", m);
                (StatusCode::BAD_GATEWAY, "DIGIFLAZZ_ERROR", m.clone())
            }
            AppError::Internal(m) => {
                tracing::error!("Internal: {}", m);
                (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", m.clone())
            }
        };
        (status, Json(json!({"success": false, "error": {"code": code, "message": msg}}))).into_response()
    }
}
