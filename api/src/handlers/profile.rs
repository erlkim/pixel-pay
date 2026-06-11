use axum::{extract::State, Json};
use serde::Deserialize;
use sqlx::PgPool;
use crate::{error::AppError, middleware::Claims};

fn sanitize(input: &str) -> String {
    input
        .replace('<', "")
        .replace('>', "")
        .replace('"', "")
        .replace('\'', "")
        .replace('&', "")
        .replace('/', "")
        .trim()
        .to_string()
}

#[derive(Deserialize)]
pub struct UpdateProfileReq {
    pub full_name: Option<String>,
    pub phone: Option<String>,
}

#[derive(Deserialize)]
pub struct ChangePasswordReq {
    pub current_password: String,
    pub new_password: String,
}

pub async fn get_profile(
    State(p): State<PgPool>,
    c: Claims,
) -> Result<Json<serde_json::Value>, AppError> {
    let user = sqlx::query_as::<_, crate::models::user::User>(
        "SELECT * FROM users WHERE id = $1",
    )
    .bind(c.sub)
    .fetch_optional(&p)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("User tidak ditemukan".into()))?;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": {
            "user": {
                "id": user.id,
                "email": user.email,
                "phone": user.phone,
                "full_name": user.full_name,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at,
            }
        }
    })))
}

pub async fn update_profile(
    State(p): State<PgPool>,
    c: Claims,
    Json(req): Json<UpdateProfileReq>,
) -> Result<Json<serde_json::Value>, AppError> {
    let clean_name = req.full_name.as_deref().map(sanitize);
    let clean_phone = req.phone.as_deref().map(|p| p.replace(|c: char| !c.is_ascii_digit(), ""));

    if let Some(ref name) = clean_name {
        if name.len() < 2 {
            return Err(AppError::Validation("Nama minimal 2 karakter".into()));
        }
        if name.len() > 100 {
            return Err(AppError::Validation("Nama maksimal 100 karakter".into()));
        }
    }
    if let Some(ref phone) = clean_phone {
        if phone.len() < 10 {
            return Err(AppError::Validation("Nomor HP minimal 10 digit".into()));
        }
        if phone.len() > 15 {
            return Err(AppError::Validation("Nomor HP maksimal 15 digit".into()));
        }
        if !phone.chars().all(|c| c.is_ascii_digit() || c == '+') {
            return Err(AppError::Validation("Nomor HP hanya boleh angka".into()));
        }
    }

    sqlx::query("UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), updated_at = NOW() WHERE id = $3")
        .bind(&clean_name)
        .bind(&clean_phone)
        .bind(c.sub)
        .execute(&p)
        .await
        .map_err(AppError::Database)?;

    let user = sqlx::query_as::<_, crate::models::user::User>("SELECT * FROM users WHERE id = $1")
        .bind(c.sub)
        .fetch_one(&p)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Profil berhasil diperbarui",
        "data": {
            "user": {
                "id": user.id,
                "email": user.email,
                "phone": user.phone,
                "full_name": user.full_name,
                "role": user.role,
            }
        }
    })))
}

pub async fn change_password(
    State(p): State<PgPool>,
    c: Claims,
    Json(req): Json<ChangePasswordReq>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.new_password.len() < 6 {
        return Err(AppError::Validation("Password baru minimal 6 karakter".into()));
    }
    if req.new_password.len() > 128 {
        return Err(AppError::Validation("Password maksimal 128 karakter".into()));
    }

    let user = sqlx::query_as::<_, crate::models::user::User>("SELECT * FROM users WHERE id = $1")
        .bind(c.sub)
        .fetch_one(&p)
        .await
        .map_err(AppError::Database)?;

    let valid = bcrypt::verify(&req.current_password, &user.password_hash)
        .map_err(|e| AppError::Internal(e.to_string()))?;

    if !valid {
        return Err(AppError::Auth("Password lama salah".into()));
    }

    let new_hash = bcrypt::hash(&req.new_password, 12)
        .map_err(|e| AppError::Internal(e.to_string()))?;

    sqlx::query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2")
        .bind(&new_hash)
        .bind(c.sub)
        .execute(&p)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Password berhasil diubah"
    })))
}
