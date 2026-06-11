use axum::{extract::State, Json};
use sqlx::PgPool;
use crate::{
    config::AppConfig, error::AppError, middleware::Claims,
    models::user::*, services::AuthService,
};

#[derive(Clone)]
pub struct AuthState {
    pub pool: PgPool,
    pub config: AppConfig,
}

pub async fn register(
    State(s): State<AuthState>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.password.len() < 6 {
        return Err(AppError::Validation("Password min 6 karakter".into()));
    }
    let user = AuthService::create_user(&s.pool, &req).await?;
    let token = AuthService::generate_token(user.id, &user.email, &user.role, &s.config)?;
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Registrasi berhasil",
        "data": { "token": token, "user": UserPublic::from(user) }
    })))
}

pub async fn login(
    State(s): State<AuthState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user = AuthService::find_by_email(&s.pool, &req.email)
        .await?
        .ok_or_else(|| AppError::Auth("Email/password salah".into()))?;
    if !user.is_active {
        return Err(AppError::Auth("Akun dinonaktifkan".into()));
    }
    if !AuthService::verify_password(&req.password, &user.password_hash)? {
        return Err(AppError::Auth("Email/password salah".into()));
    }
    AuthService::update_last_login(&s.pool, user.id).await?;
    let token = AuthService::generate_token(user.id, &user.email, &user.role, &s.config)?;
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Login berhasil",
        "data": { "token": token, "user": UserPublic::from(user) }
    })))
}

pub async fn me(
    State(s): State<AuthState>,
    c: Claims,
) -> Result<Json<serde_json::Value>, AppError> {
    let user = AuthService::find_by_id(&s.pool, c.sub)
        .await?
        .ok_or_else(|| AppError::NotFound("User tidak ditemukan".into()))?;
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "user": UserPublic::from(user) }
    })))
}
