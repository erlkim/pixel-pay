use axum::{extract::State, response::IntoResponse};
use crate::{error::AppError, handlers::admin::AdminState, middleware::AdminClaims};

pub async fn export_transactions_csv(
    State(s): State<AdminState>,
    _a: AdminClaims,
) -> Result<impl IntoResponse, AppError> {
    let txs = sqlx::query_as::<_, crate::models::transaction::Transaction>(
        "SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10000",
    )
    .fetch_all(&s.pool)
    .await
    .map_err(AppError::Database)?;

    let mut csv = String::from("REF_ID,NOMOR,PRODUK_ID,HARGA_JUAL,PROFIT,STATUS,SN,WAKTU\n");
    for tx in &txs {
        csv.push_str(&format!(
            "{},{},{},{},{},{},{},{}\n",
            tx.ref_id,
            tx.customer_number,
            tx.product_id,
            tx.sell_price,
            tx.profit,
            tx.status,
            tx.serial_number.as_deref().unwrap_or("-"),
            tx.created_at.format("%Y-%m-%d %H:%M:%S"),
        ));
    }

    Ok((
        [
            ("content-type", "text/csv"),
            ("content-disposition", "attachment; filename=transactions.csv"),
        ],
        csv,
    ))
}

pub async fn revenue_stats(
    State(s): State<AdminState>,
    _a: AdminClaims,
) -> Result<axum::Json<serde_json::Value>, AppError> {
    let daily = sqlx::query_as::<_, (String, rust_decimal::Decimal, i64)>(
        "SELECT TO_CHAR(created_at::date, 'YYYY-MM-DD') as day, COALESCE(SUM(profit),0) as revenue, COUNT(*) as count
         FROM transactions WHERE status='success' AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY day ORDER BY day"
    )
    .fetch_all(&s.pool)
    .await
    .map_err(AppError::Database)?;

    let by_category = sqlx::query_as::<_, (String, rust_decimal::Decimal, i64)>(
        "SELECT c.name, COALESCE(SUM(t.profit),0) as revenue, COUNT(*) as count
         FROM transactions t JOIN products p ON t.product_id = p.id JOIN categories c ON p.category_id = c.id
         WHERE t.status='success' AND t.created_at >= NOW() - INTERVAL '30 days'
         GROUP BY c.name ORDER BY revenue DESC"
    )
    .fetch_all(&s.pool)
    .await
    .map_err(AppError::Database)?;

    let daily_data: Vec<serde_json::Value> = daily.iter().map(|(day, rev, cnt)| {
        serde_json::json!({"date": day, "revenue": rev.to_string().parse::<f64>().unwrap_or(0.0), "count": cnt})
    }).collect();

    let cat_data: Vec<serde_json::Value> = by_category.iter().map(|(name, rev, cnt)| {
        serde_json::json!({"category": name, "revenue": rev.to_string().parse::<f64>().unwrap_or(0.0), "count": cnt})
    }).collect();

    Ok(axum::Json(serde_json::json!({
        "success": true,
        "data": {
            "daily": daily_data,
            "by_category": cat_data,
        }
    })))
}
