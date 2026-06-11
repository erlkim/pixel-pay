use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    RequestPartsExt,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: Uuid,
    pub email: String,
    pub role: String,
    pub exp: usize,
    pub iat: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AdminClaims {
    pub claims: Claims,
}

#[async_trait]
impl<S: Send + Sync> FromRequestParts<S> for Claims {
    type Rejection = (StatusCode, axum::Json<serde_json::Value>);
    async fn from_request_parts(
        parts: &mut Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| {
                (
                    StatusCode::UNAUTHORIZED,
                    axum::Json(serde_json::json!({
                        "success": false,
                        "error": {"code": "AUTH_ERROR", "message": "Token tidak ditemukan"}
                    })),
                )
            })?;
        let secret = std::env::var("JWT_SECRET")
            .unwrap_or_else(|_| "pixel-pay-secret-change-me".into());
        let data = decode::<Claims>(
            bearer.token(),
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::new(Algorithm::HS256),
        )
        .map_err(|_| {
            (
                StatusCode::UNAUTHORIZED,
                axum::Json(serde_json::json!({
                    "success": false,
                    "error": {"code": "AUTH_ERROR", "message": "Token tidak valid"}
                })),
            )
        })?;
        Ok(data.claims)
    }
}

#[async_trait]
impl<S: Send + Sync> FromRequestParts<S> for AdminClaims {
    type Rejection = (StatusCode, axum::Json<serde_json::Value>);
    async fn from_request_parts(
        parts: &mut Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let claims = Claims::from_request_parts(parts, state).await?;
        if claims.role != "admin" && claims.role != "superadmin" {
            return Err((
                StatusCode::FORBIDDEN,
                axum::Json(serde_json::json!({
                    "success": false,
                    "error": {"code": "FORBIDDEN", "message": "Akses admin diperlukan"}
                })),
            ));
        }
        Ok(AdminClaims { claims })
    }
}
