use std::env;

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiration_hours: i64,
    pub digiflazz_username: String,
    pub digiflazz_api_key: String,
    pub digiflazz_base_url: String,
    pub server_host: String,
    pub server_port: u16,
    pub max_connections: u32,
    pub min_connections: u32,
}

impl AppConfig {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();
        Self {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://postgres:password@localhost:5432/pixel_pay".into()),
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "pixel-pay-secret-change-me".into()),
            jwt_expiration_hours: env::var("JWT_EXPIRATION_HOURS")
                .unwrap_or_else(|_| "24".into())
                .parse()
                .unwrap_or(24),
            digiflazz_username: env::var("DIGIFLAZZ_USERNAME").unwrap_or_default(),
            digiflazz_api_key: env::var("DIGIFLAZZ_API_KEY").unwrap_or_default(),
            digiflazz_base_url: env::var("DIGIFLAZZ_BASE_URL")
                .unwrap_or_else(|_| "https://api.digiflazz.com/v1".into()),
            server_host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".into()),
            server_port: env::var("PORT")
                .unwrap_or_else(|_| "3001".into())
                .parse()
                .unwrap_or(3001),
            max_connections: env::var("DB_MAX_CONNECTIONS")
                .unwrap_or_else(|_| "20".into())
                .parse()
                .unwrap_or(20),
            min_connections: env::var("DB_MIN_CONNECTIONS")
                .unwrap_or_else(|_| "5".into())
                .parse()
                .unwrap_or(5),
        }
    }
}
