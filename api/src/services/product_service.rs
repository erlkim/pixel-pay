use sqlx::PgPool;
use uuid::Uuid;
use crate::error::AppError;
use crate::models::{category::Category, product::*};

#[allow(dead_code)]
pub struct ProductService;

#[allow(dead_code)]
impl ProductService {
    pub async fn list_categories(pool: &PgPool) -> Result<Vec<Category>, AppError> {
        sqlx::query_as::<_, Category>(
            "SELECT * FROM categories WHERE is_active=true ORDER BY sort_order",
        )
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)
    }
    pub async fn list_by_category(
        pool: &PgPool,
        slug: &str,
    ) -> Result<Vec<Product>, AppError> {
        sqlx::query_as::<_, Product>(
            "SELECT p.* FROM products p \
             JOIN categories c ON p.category_id=c.id \
             WHERE c.slug=$1 AND p.is_active=true \
             ORDER BY p.sell_price",
        )
        .bind(slug)
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)
    }
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Product, AppError> {
        sqlx::query_as::<_, Product>(
            "SELECT * FROM products WHERE id=$1 AND is_active=true",
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Produk tidak ditemukan".into()))
    }
    pub async fn search(pool: &PgPool, q: &str) -> Result<Vec<Product>, AppError> {
        let p = format!("%{}%", q);
        sqlx::query_as::<_, Product>(
            "SELECT * FROM products \
             WHERE is_active=true AND (name ILIKE $1 OR brand ILIKE $1) \
             ORDER BY sell_price LIMIT 50",
        )
        .bind(&p)
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)
    }
}
