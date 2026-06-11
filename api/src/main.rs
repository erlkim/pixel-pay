mod config;
mod db;
mod error;
mod handlers;
mod middleware;
mod models;
mod routes;
mod services;

use config::AppConfig;
use routes::api::build_router;
use tracing::info;
use tracing_subscriber::{fmt, EnvFilter};

#[tokio::main]
async fn main() {
    fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("pixel_pay_api=debug,tower_http=debug")),
        )
        .init();
    let config = AppConfig::from_env();
    info!("Starting PIXEL PAY API v{}", env!("CARGO_PKG_VERSION"));
    let pool =
        db::create_pool(&config.database_url, config.max_connections, config.min_connections)
            .await;
    let app = build_router(pool, config.clone());
    let addr = format!("{}:{}", config.server_host, config.server_port);
    info!("Listening on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Bind failed");
    axum::serve(listener, app).await.expect("Server error");
}
