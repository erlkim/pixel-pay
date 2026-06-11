use chrono::NaiveDateTime;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub message: String,
    #[sqlx(rename = "type")]
    pub notif_type: String,
    pub is_read: bool,
    pub ref_id: Option<String>,
    pub created_at: NaiveDateTime,
}
