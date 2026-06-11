use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use sqlx::PgPool;
use uuid::Uuid;
use crate::config::AppConfig;
use crate::error::AppError;
use crate::middleware::Claims;
use crate::models::user::*;

pub struct AuthService;

impl AuthService {
    pub fn hash_password(pw: &str) -> Result<String, AppError> {
        hash(pw, DEFAULT_COST).map_err(|e| AppError::Internal(e.to_string()))
    }
    pub fn verify_password(pw: &str, h: &str) -> Result<bool, AppError> {
        verify(pw, h).map_err(|e| AppError::Internal(e.to_string()))
    }
    pub fn generate_token(
        uid: Uuid,
        email: &str,
        role: &str,
        cfg: &AppConfig,
    ) -> Result<String, AppError> {
        let now = Utc::now();
        let c = Claims {
            sub: uid,
            email: email.into(),
            role: role.into(),
            iat: now.timestamp() as usize,
            exp: (now + Duration::hours(cfg.jwt_expiration_hours)).timestamp() as usize,
        };
        encode(
            &Header::default(),
            &c,
            &EncodingKey::from_secret(cfg.jwt_secret.as_bytes()),
        )
        .map_err(|e| AppError::Internal(e.to_string()))
    }
    pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, AppError> {
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
            .bind(email)
            .fetch_optional(pool)
            .await
            .map_err(AppError::Database)
    }
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>, AppError> {
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await
            .map_err(AppError::Database)
    }
    pub async fn create_user(pool: &PgPool, req: &RegisterRequest) -> Result<User, AppError> {
        let ph = Self::hash_password(&req.password)?;
        let uid = Uuid::new_v4();
        let user = sqlx::query_as::<_, User>(
            "INSERT INTO users (id, email, phone, password_hash, full_name) \
             VALUES ($1, $2, $3, $4, $5) RETURNING *",
        )
        .bind(uid)
        .bind(&req.email)
        .bind(&req.phone)
        .bind(&ph)
        .bind(&req.full_name)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(ref d) = e {
                if d.constraint().is_some() {
                    return AppError::Validation("Email/HP sudah terdaftar".into());
                }
            }
            AppError::Database(e)
        })?;
        sqlx::query("INSERT INTO wallets (user_id) VALUES ($1)")
            .bind(uid)
            .execute(pool)
            .await?;
        Ok(user)
    }
    pub async fn update_last_login(pool: &PgPool, uid: Uuid) -> Result<(), AppError> {
        sqlx::query("UPDATE users SET last_login_at = NOW() WHERE id = $1")
            .bind(uid)
            .execute(pool)
            .await?;
        Ok(())
    }
}
