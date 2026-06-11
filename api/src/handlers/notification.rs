use axum::{extract::State, Json};
use sqlx::PgPool;
use crate::{error::AppError, middleware::Claims};

pub async fn list(
    State(p): State<PgPool>,
    c: Claims,
) -> Result<Json<serde_json::Value>, AppError> {
    let notifs = sqlx::query_as::<_, crate::models::notification::Notification>(
        "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
    )
    .bind(c.sub)
    .fetch_all(&p)
    .await
    .map_err(AppError::Database)?;

    let unread: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false")
        .bind(c.sub)
        .fetch_one(&p)
        .await
        .unwrap_or((0,));

    Ok(Json(serde_json::json!({
        "success": true,
        "data": {
            "notifications": notifs,
            "unread_count": unread.0
        }
    })))
}

pub async fn mark_read(
    State(p): State<PgPool>,
    c: Claims,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false")
        .bind(c.sub)
        .execute(&p)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Semua notifikasi ditandai sudah dibaca"
    })))
}
