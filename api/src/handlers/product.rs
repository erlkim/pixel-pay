use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use sqlx::PgPool;
use crate::error::AppError;

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: Option<String>,
}

pub async fn list_categories(
    State(p): State<PgPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let cats = sqlx::query_as::<_, crate::models::category::Category>(
        "SELECT * FROM categories WHERE is_active = true ORDER BY sort_order",
    )
    .fetch_all(&p)
    .await
    .map_err(AppError::Database)?;

    let result: Vec<serde_json::Value> = cats.iter().map(|c| {
        serde_json::json!({
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "description": c.description,
            "icon": c.icon,
            "sort_order": c.sort_order,
            "is_active": c.is_active,
            "parent_slug": c.parent_slug,
            "is_group": c.parent_slug.is_some(),
        })
    }).collect();

    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "categories": result }
    })))
}

pub async fn list_products(
    State(p): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let cat = sqlx::query_as::<_, crate::models::category::Category>(
        "SELECT * FROM categories WHERE slug = $1 AND is_active = true",
    )
    .bind(&slug)
    .fetch_optional(&p)
    .await
    .map_err(AppError::Database)?;

    let cat = match cat {
        Some(c) => c,
        None => {
            return Ok(Json(serde_json::json!({
                "success": true,
                "data": { "products": [] }
            })));
        }
    };

    let products = if cat.parent_slug.is_some() {
        sqlx::query_as::<_, crate::models::product::Product>(
            "SELECT * FROM products WHERE category_id = $1 AND is_active = true ORDER BY name",
        )
        .bind(cat.id)
        .fetch_all(&p)
        .await
        .map_err(AppError::Database)?
    } else if slug == "e-money" {
        sqlx::query_as::<_, crate::models::product::Product>(
            "SELECT p.* FROM products p
             JOIN categories c ON p.category_id = c.id
             WHERE c.parent_slug = 'e-money' AND p.is_active = true
             ORDER BY p.name",
        )
        .fetch_all(&p)
        .await
        .map_err(AppError::Database)?
    } else {
        sqlx::query_as::<_, crate::models::product::Product>(
            "SELECT * FROM products WHERE category_id = $1 AND is_active = true ORDER BY name",
        )
        .bind(cat.id)
        .fetch_all(&p)
        .await
        .map_err(AppError::Database)?
    };

    let result: Vec<serde_json::Value> = products.iter().map(|p| {
        serde_json::json!({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "provider": p.provider,
            "brand": p.brand,
            "type": p.product_type,
            "sell_price": p.sell_price.to_string(),
            "sell_price_formatted": format!("Rp {}", p.sell_price.to_string().parse::<f64>().unwrap_or(0.0).ceil() as i64),
            "is_available": p.is_active && (p.unlimited_stock || p.stock > 0),
            "stock": p.stock,
            "unlimited_stock": p.unlimited_stock,
        })
    }).collect();

    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "products": result }
    })))
}

pub async fn search_products(
    State(p): State<PgPool>,
    Query(q): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let q = q.q.unwrap_or_default();
    if q.len() < 2 {
        return Ok(Json(serde_json::json!({
            "success": true,
            "data": { "products": [] }
        })));
    }

    let products = sqlx::query_as::<_, crate::models::product::Product>(
        "SELECT * FROM products WHERE is_active = true AND (name ILIKE $1 OR brand ILIKE $1 OR provider ILIKE $1) ORDER BY name LIMIT 50",
    )
    .bind(format!("%{}%", q))
    .fetch_all(&p)
    .await
    .map_err(AppError::Database)?;

    let result: Vec<serde_json::Value> = products.iter().map(|p| {
        serde_json::json!({
            "id": p.id,
            "name": p.name,
            "provider": p.provider,
            "brand": p.brand,
            "sell_price": p.sell_price.to_string(),
            "sell_price_formatted": format!("Rp {}", p.sell_price.to_string().parse::<f64>().unwrap_or(0.0).ceil() as i64),
            "is_available": p.is_active,
        })
    }).collect();

    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "products": result }
    })))
}
