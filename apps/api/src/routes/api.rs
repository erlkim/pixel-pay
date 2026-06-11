use axum::{routing::{get, post, put}, Router, middleware};
use sqlx::PgPool;
use tower_http::cors::{AllowOrigin, CorsLayer};
use crate::{
    config::AppConfig, handlers::*, services::DigiflazzService,
    handlers::admin::AdminState,
    middleware::security::{RateLimiter, LoginLimiter, global_rate_limit, auth_rate_limit, security_headers},
};

pub fn build_router(pool: PgPool, config: AppConfig) -> Router {
    let dg = DigiflazzService::new(config.clone());
    let auth_s = auth::AuthState { pool: pool.clone(), config: config.clone() };
    let adm_s = AdminState { pool: pool.clone(), digiflazz: dg.clone(), config: config.clone() };

    // CORS - whitelist origins
    let origins: Vec<_> = config.allowed_origins.split(',')
        .filter_map(|s| s.trim().parse().ok()).collect();
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_methods(tower_http::cors::Any)
        .allow_headers(tower_http::cors::Any);

    // Security instances
    let global_limiter = RateLimiter::new(100, 60);
    let auth_limiter = LoginLimiter::new();

    let auth_r = Router::new()
        .route("/register", post(auth::register))
        .route("/login", post(auth::login))
        .route("/me", get(auth::me))
        .with_state(auth_s)
        .route_layer(middleware::from_fn_with_state(auth_limiter, auth_rate_limit));

    let prod_r = Router::new()
        .route("/categories", get(product::list_categories))
        .route("/category/:slug", get(product::list_products))
        .route("/search", get(product::search_products))
        .with_state(pool.clone());

    let wallet_r = Router::new()
        .route("/balance", get(wallet::get_balance))
        .route("/topup", post(wallet::topup))
        .route("/history", get(wallet::get_history))
        .with_state(pool.clone());

    let tx_r = Router::new()
        .route("/create", post(transaction::create))
        .route("/list", get(transaction::list))
        .route("/detail", post(transaction::detail))
        .with_state(adm_s.clone());

    let profile_r = Router::new()
        .route("/get", get(profile::get_profile))
        .route("/update", post(profile::update_profile))
        .route("/change-password", post(profile::change_password))
        .with_state(pool.clone());

    let notif_r = Router::new()
        .route("/list", get(notification::list))
        .route("/read", post(notification::mark_read))
        .with_state(pool.clone());

    let voucher_r = Router::new()
        .route("/available", get(voucher::list_available))
        .route("/apply", post(voucher::apply))
        .with_state(pool.clone());

    let payment_r = Router::new()
        .route("/methods", get(payment::list_payment_methods))
        .route("/create", post(payment::create_payment))
        .route("/status", get(payment::check_payment_status))
        .route("/config", get(payment::midtrans_config))
        .with_state(adm_s.clone());

    let adm_r = Router::new()
        .route("/dashboard", get(admin::dashboard))
        .route("/users", get(admin::list_users_admin))
        .route("/transactions", get(admin::all_transactions))
        .route("/sync-products", post(admin::sync_products))
        .route("/export-csv", get(admin_export::export_transactions_csv))
        .route("/revenue-stats", get(admin_export::revenue_stats))
        .route("/transaction/:id", get(admin_detail::transaction_detail))
        .route("/transaction/:id/retry", post(admin_detail::retry_transaction))
        .route("/transaction/:id/refund", post(admin_detail::refund_transaction))
        .route("/user/:id", get(admin_detail::user_detail))
        .route("/user/:id/block", post(admin_detail::toggle_block_user))
        .route("/user/:id/reset-password", post(admin_detail::reset_user_password))
        .route("/user/:id/edit-balance", post(admin_detail::edit_user_balance))
        .route("/transactions/filtered", post(admin_detail::filtered_transactions))
        .route("/product/:id/markup", put(admin_detail::update_product_markup))
        .route("/products/bulk-markup", post(admin_detail::bulk_update_markup))
        .route("/settings", get(admin_detail::get_settings))
        .route("/settings/update", post(admin_detail::update_setting))
        .route("/logs", get(admin_detail::admin_logs))
        .route("/broadcast", post(admin_detail::broadcast_notification))
        .route("/payments", get(payment::admin_list_payments))
        .with_state(adm_s);

    let webhook_r = Router::new()
        .route("/midtrans-notification", post(payment::midtrans_notification))
        .with_state(AdminState { pool: pool.clone(), digiflazz: dg.clone(), config: config.clone() });

    let health = Router::new().route("/health", get(|| async {
        axum::Json(serde_json::json!({"status": "ok", "service": "pixel-pay-api"}))
    }));

    Router::new()
        .merge(health)
        .nest("/api/auth", auth_r)
        .nest("/api/products", prod_r)
        .nest("/api/wallet", wallet_r)
        .nest("/api/transactions", tx_r)
        .nest("/api/admin", adm_r)
        .nest("/api/profile", profile_r)
        .nest("/api/notifications", notif_r)
        .nest("/api/vouchers", voucher_r)
        .nest("/api/payment", payment_r)
        .nest("/api/webhook", webhook_r)
        .layer(cors)
        .layer(middleware::from_fn(security_headers))
        .route_layer(middleware::from_fn_with_state(global_limiter, global_rate_limit))
}
