use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tracing::warn;

// ==================== Rate Limiter (per IP) ====================

#[derive(Clone)]
pub struct RateLimiter {
    inner: Arc<RwLock<HashMap<String, Vec<Instant>>>>,
    max_requests: usize,
    window: Duration,
}

impl RateLimiter {
    pub fn new(max_requests: usize, window_secs: u64) -> Self {
        let inner: Arc<RwLock<HashMap<String, Vec<Instant>>>> =
            Arc::new(RwLock::new(HashMap::new()));
        let c = inner.clone();
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(Duration::from_secs(window_secs.max(60))).await;
                let now = Instant::now();
                let w = Duration::from_secs(window_secs);
                let mut m = c.write().await;
                m.retain(|_, t| {
                    t.retain(|x| now.duration_since(*x) < w);
                    !t.is_empty()
                });
            }
        });
        Self {
            inner,
            max_requests,
            window: Duration::from_secs(window_secs),
        }
    }

    pub async fn check(&self, key: &str) -> bool {
        let now = Instant::now();
        let mut m = self.inner.write().await;
        let e = m.entry(key.to_string()).or_default();
        e.retain(|t| now.duration_since(*t) < self.window);
        if e.len() >= self.max_requests {
            return false;
        }
        e.push(now);
        true
    }
}

// Login-specific limiter (stricter)
#[derive(Clone)]
pub struct LoginLimiter {
    inner: Arc<RwLock<HashMap<String, Vec<Instant>>>>,
}

impl LoginLimiter {
    pub fn new() -> Self {
        let inner: Arc<RwLock<HashMap<String, Vec<Instant>>>> =
            Arc::new(RwLock::new(HashMap::new()));
        let c = inner.clone();
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(Duration::from_secs(300)).await;
                let now = Instant::now();
                let mut m = c.write().await;
                m.retain(|_, t| {
                    t.retain(|x| now.duration_since(*x) < Duration::from_secs(900));
                    !t.is_empty()
                });
            }
        });
        Self { inner }
    }

    pub async fn check(&self, ip: &str, max: usize, secs: u64) -> bool {
        let now = Instant::now();
        let w = Duration::from_secs(secs);
        let mut m = self.inner.write().await;
        let e = m.entry(ip.to_string()).or_default();
        e.retain(|t| now.duration_since(*t) < w);
        if e.len() >= max {
            return false;
        }
        e.push(now);
        true
    }
}

fn client_ip(headers: &HeaderMap) -> String {
    headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(',').next())
        .map(|s| s.trim().to_string())
        .or_else(|| {
            headers
                .get("x-real-ip")
                .and_then(|v| v.to_str().ok())
                .map(|s| s.to_string())
        })
        .unwrap_or_else(|| "unknown".to_string())
}

// Middleware: global rate limit (100 req/min per IP)
pub async fn global_rate_limit(
    State(lim): State<RateLimiter>,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let ip = client_ip(req.headers());
    if !lim.check(&ip).await {
        warn!("Rate limit exceeded: {}", ip);
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }
    Ok(next.run(req).await)
}

// Middleware: auth rate limit (10 req/min per IP)
pub async fn auth_rate_limit(
    State(lim): State<LoginLimiter>,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let ip = client_ip(req.headers());
    if !lim.check(&ip, 10, 60).await {
        warn!("Auth rate limit exceeded: {}", ip);
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }
    Ok(next.run(req).await)
}

// ==================== Security Headers ====================

pub async fn security_headers(req: Request, next: Next) -> Response {
    let mut resp = next.run(req).await;
    let h = resp.headers_mut();
    h.insert("x-content-type-options", "nosniff".parse().unwrap());
    h.insert("x-frame-options", "DENY".parse().unwrap());
    h.insert("x-xss-protection", "1; mode=block".parse().unwrap());
    h.insert(
        "referrer-policy",
        "strict-origin-when-cross-origin".parse().unwrap(),
    );
    h.insert(
        "permissions-policy",
        "camera=(), microphone=(), geolocation=()".parse().unwrap(),
    );
    h.insert(
        "cache-control",
        "no-store, no-cache, must-revalidate".parse().unwrap(),
    );
    resp
}

// ==================== Webhook Signature ====================

pub fn verify_midtrans_signature(
    order_id: &str,
    status_code: &str,
    gross_amount: &str,
    server_key: &str,
    signature: &str,
) -> bool {
    use sha2::{Digest, Sha512};
    let input = format!("{}{}{}{}", order_id, status_code, gross_amount, server_key);
    let mut h = Sha512::new();
    h.update(input.as_bytes());
    format!("{:x}", h.finalize()) == signature
}

// ==================== Login Lockout (DB) ====================

pub async fn check_lockout(pool: &sqlx::PgPool, email: &str) -> Result<bool, sqlx::Error> {
    let r: Option<(Option<chrono::DateTime<chrono::Utc>>,)> = sqlx::query_as(
        "SELECT locked_until FROM users WHERE email = $1",
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;
    match r {
        Some((Some(lu),)) if lu > chrono::Utc::now() => Ok(true),
        _ => Ok(false),
    }
}

pub async fn record_fail(pool: &sqlx::PgPool, email: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE users SET failed_login_attempts = COALESCE(failed_login_attempts,0) + 1,
         locked_until = CASE WHEN COALESCE(failed_login_attempts,0) + 1 >= 5
           THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END WHERE email = $1",
    )
    .bind(email)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn reset_fail(pool: &sqlx::PgPool, email: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = $1",
    )
    .bind(email)
    .execute(pool)
    .await?;
    Ok(())
}
