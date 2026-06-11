use axum::{extract::State, Json};
use sqlx::PgPool;
use crate::{
    config::AppConfig, error::AppError, middleware::Claims,
    middleware::security::{check_lockout, record_fail, reset_fail},
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
    if req.password.len() > 128 {
        return Err(AppError::Validation("Password maksimal 128 karakter".into()));
    }
    if req.email.len() > 255 {
        return Err(AppError::Validation("Email terlalu panjang".into()));
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
    // Input validation
    if req.email.is_empty() || req.password.is_empty() {
        return Err(AppError::Validation("Email/password wajib diisi".into()));
    }
    if req.email.len() > 255 || req.password.len() > 128 {
        return Err(AppError::Validation("Input terlalu panjang".into()));
    }

    // Check lockout (5 gagal dalam 15 menit)
    let locked = check_lockout(&s.pool, &req.email).await
        .map_err(AppError::Database)?;
    if locked {
        return Err(AppError::Auth("Akun terkunci 15 menit karena terlalu banyak percobaan gagal".into()));
    }

    let user = AuthService::find_by_email(&s.pool, &req.email)
        .await?
        .ok_or_else(|| {
            // Record fail even if user not found (prevent timing attack)
            let pool = s.pool.clone();
            let email = req.email.clone();
            tokio::spawn(async move { let _ = record_fail(&pool, &email).await; });
            AppError::Auth("Email/password salah".into())
        })?;

    if !user.is_active {
        return Err(AppError::Auth("Akun dinonaktifkan".into()));
    }

    if !AuthService::verify_password(&req.password, &user.password_hash)? {
        let _ = record_fail(&s.pool, &req.email).await;
        return Err(AppError::Auth("Email/password salah".into()));
    }

    // Login berhasil - reset fail counter
    let _ = reset_fail(&s.pool, &req.email).await;
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
