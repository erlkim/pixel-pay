use chrono::NaiveDateTime;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Clone)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub sort_order: Option<i32>,
    pub is_active: bool,
    pub digiflazz_cmd: Option<String>,
    pub parent_slug: Option<String>,
    #[allow(dead_code)]
    pub created_at: NaiveDateTime,
    #[allow(dead_code)]
    pub updated_at: NaiveDateTime,
}
