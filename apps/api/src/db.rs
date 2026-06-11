use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use tracing::info;

pub async fn create_pool(database_url: &str, max: u32, min: u32) -> PgPool {
    info!("Connecting to PostgreSQL...");
    let pool = PgPoolOptions::new()
        .max_connections(max)
        .min_connections(min)
        .acquire_timeout(std::time::Duration::from_secs(10))
        .connect(database_url)
        .await
        .expect("Failed to connect to PostgreSQL");
    info!("PostgreSQL connected");
    pool
}
