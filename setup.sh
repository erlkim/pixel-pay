
- API -> http://localhost:3001
- Admin -> http://localhost:5174
- Web -> http://localhost:5173
EOF

# ============================================================
# DATABASE
# ============================================================
mkdir -p database/src/schema

cat > database/package.json << 'EOF'
{
  "name": "@pixel-pay/database",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "push": "drizzle-kit push",
    "seed": "tsx src/seed.ts",
    "studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "^0.38.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0"
  }
}
EOF

cat > database/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"]
}
EOF

cat > database/drizzle.config.ts << 'EOF'
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/pixel_pay",
  },
  verbose: true,
  strict: true,
});
EOF

cat > database/src/client.ts << 'EOF'
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/pixel_pay";
const client = postgres(connectionString, { max: 10 });
export const db = drizzle(client, { schema });
EOF

cat > database/src/schema/users.ts << 'EOF'
import {
  pgTable, uuid, varchar, text, boolean, timestamp, pgEnum, index,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "superadmin"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    role: userRoleEnum("role").default("user").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_phone_idx").on(table.phone),
    index("users_role_idx").on(table.role),
  ]
);
EOF

cat > database/src/schema/wallets.ts << 'EOF'
import {
  pgTable, uuid, decimal, timestamp, varchar, text, pgEnum, index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const wallets = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const topupStatusEnum = pgEnum("topup_status", [
  "pending", "success", "failed", "expired",
]);

export const walletTopups = pgTable(
  "wallet_topups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    walletId: uuid("wallet_id").references(() => wallets.id).notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    method: varchar("method", { length: 50 }).notNull(),
    status: topupStatusEnum("status").default("pending").notNull(),
    externalRef: varchar("external_ref", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("topups_wallet_idx").on(table.walletId),
    index("topups_status_idx").on(table.status),
  ]
);

export const balanceLogs = pgTable("balance_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletId: uuid("wallet_id").references(() => wallets.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  description: text("description").notNull(),
  refId: varchar("ref_id", { length: 100 }),
  balanceBefore: decimal("balance_before", { precision: 15, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
EOF

cat > database/src/schema/categories.ts << 'EOF'
import {
  pgTable, uuid, varchar, text, integer, boolean, timestamp, index,
} from "drizzle-orm/pg-core";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: text("description"),
    icon: varchar("icon", { length: 10 }).default("package"),
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true).notNull(),
    digiflazzCmd: varchar("digiflazz_cmd", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("categories_slug_idx").on(table.slug),
    index("categories_sort_idx").on(table.sortOrder),
  ]
);
EOF

cat > database/src/schema/products.ts << 'EOF'
import {
  pgTable, uuid, varchar, text, decimal, boolean, integer,
  timestamp, jsonb, index,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id").references(() => categories.id).notNull(),
    sku: varchar("sku", { length: 200 }).notNull().unique(),
    buyerSkuCode: varchar("buyer_sku_code", { length: 200 }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    provider: varchar("provider", { length: 100 }).notNull(),
    brand: varchar("brand", { length: 100 }),
    type: varchar("type", { length: 50 }),
    basePrice: decimal("base_price", { precision: 15, scale: 2 }).notNull(),
    sellPrice: decimal("sell_price", { precision: 15, scale: 2 }).notNull(),
    profit: decimal("profit", { precision: 15, scale: 2 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    buyerProductStatus: boolean("buyer_product_status").default(true),
    sellerProductStatus: boolean("seller_product_status").default(true),
    stock: integer("stock").default(0),
    unlimitedStock: boolean("unlimited_stock").default(false),
    multi: boolean("multi").default(false),
    cutOffStart: varchar("cut_off_start", { length: 10 }),
    cutOffEnd: varchar("cut_off_end", { length: 10 }),
    meta: jsonb("meta"),
    syncedAt: timestamp("synced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("products_category_idx").on(table.categoryId),
    index("products_sku_idx").on(table.sku),
    index("products_buyer_sku_idx").on(table.buyerSkuCode),
    index("products_active_idx").on(table.isActive),
    index("products_brand_idx").on(table.brand),
  ]
);
EOF

cat > database/src/schema/transactions.ts << 'EOF'
import {
  pgTable, uuid, varchar, text, decimal, jsonb, timestamp,
  pgEnum, integer, index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { products } from "./products";

export const txStatusEnum = pgEnum("tx_status", [
  "pending", "processing", "success", "failed", "refunded", "expired",
]);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    productId: uuid("product_id").references(() => products.id).notNull(),
    refId: varchar("ref_id", { length: 100 }).notNull().unique(),
    customerNumber: varchar("customer_number", { length: 50 }).notNull(),
    basePrice: decimal("base_price", { precision: 15, scale: 2 }).notNull(),
    sellPrice: decimal("sell_price", { precision: 15, scale: 2 }).notNull(),
    profit: decimal("profit", { precision: 15, scale: 2 }).notNull(),
    status: txStatusEnum("status").default("pending").notNull(),
    digiflazzRefId: varchar("digiflazz_ref_id", { length: 200 }),
    digiflazzStatus: varchar("digiflazz_status", { length: 50 }),
    digiflazzMessage: text("digiflazz_message"),
    serialNumber: text("sn"),
    responsePayload: jsonb("response_payload"),
    retryCount: integer("retry_count").default(0),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("tx_user_idx").on(table.userId),
    index("tx_status_idx").on(table.status),
    index("tx_ref_idx").on(table.refId),
    index("tx_created_idx").on(table.createdAt),
    index("tx_product_idx").on(table.productId),
  ]
);
EOF

cat > database/src/schema/index.ts << 'EOF'
export { users, userRoleEnum } from "./users";
export { wallets, walletTopups, balanceLogs, topupStatusEnum } from "./wallets";
export { categories } from "./categories";
export { products } from "./products";
export { transactions, txStatusEnum } from "./transactions";
EOF

cat > database/src/index.ts << 'EOF'
export * from "./schema";
export { db } from "./client";
EOF

cat > database/src/seed.ts << 'EOF'
import { db } from "./client";
import { categories } from "./schema";

async function seed() {
  console.log("Seeding database...");
  const data = [
    { name: "Pulsa & Data", slug: "pulsa-data", icon: "mobile", sortOrder: 1, digiflazzCmd: "pulsa", description: "Isi ulang pulsa dan paket data" },
    { name: "Token PLN", slug: "token-pln", icon: "zap", sortOrder: 2, digiflazzCmd: "pln", description: "Token listrik PLN prabayar" },
    { name: "Pascabayar", slug: "pascabayar", icon: "file-text", sortOrder: 3, digiflazzCmd: "pascabayar", description: "Bayar tagihan pascabayar" },
    { name: "PDAM", slug: "pdam", icon: "droplets", sortOrder: 4, digiflazzCmd: "pdam", description: "Bayar tagihan air PDAM" },
    { name: "BPJS", slug: "bpjs", icon: "heart-pulse", sortOrder: 5, digiflazzCmd: "bpjs", description: "Iuran BPJS Kesehatan" },
    { name: "Voucher Game", slug: "voucher-game", icon: "gamepad-2", sortOrder: 6, digiflazzCmd: "game", description: "Diamond ML, UC PUBG" },
    { name: "TV Kabel", slug: "tv-kabel", icon: "tv", sortOrder: 7, digiflazzCmd: "tv", description: "Indihome, MNC Play" },
    { name: "E-Money", slug: "e-money", icon: "credit-card", sortOrder: 8, digiflazzCmd: "emoney", description: "Top up e-wallet" },
    { name: "Telkom", slug: "telkom", icon: "phone", sortOrder: 9, digiflazzCmd: "telkom", description: "Tagihan Telkom" },
    { name: "PGN Gas", slug: "pgn", icon: "flame", sortOrder: 10, digiflazzCmd: "pgn", description: "Tagihan gas PGN" },
  ];
  for (const cat of data) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }
  console.log("Seeding complete!");
  process.exit(0);
}
seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
EOF

# ============================================================
# RUST API
# ============================================================
mkdir -p api/src/{middleware,models,handlers,services,routes}
mkdir -p api/migrations

cat > api/Cargo.toml << 'EOF'
[package]
name = "pixel-pay-api"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = { version = "0.7", features = ["macros"] }
axum-extra = { version = "0.9", features = ["typed-header"] }
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.8", features = [
  "runtime-tokio", "tls-rustls", "postgres", "uuid",
  "chrono", "json", "decimal",
] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace", "limit"] }
jsonwebtoken = "9"
bcrypt = "0.15"
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
reqwest = { version = "0.12", features = ["json", "rustls-tls"], default-features = false }
dotenvy = "0.15"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
thiserror = "2"
rand = "0.8"
sha2 = "0.10"
rust_decimal = { version = "1", features = ["serde-with-str"] }
futures = "0.3"
EOF

cat > api/.env << 'EOF'
DATABASE_URL=postgresql://postgres:password@localhost:5432/pixel_pay
JWT_SECRET=pixel-pay-super-secret-key-2024
JWT_EXPIRATION_HOURS=24
DIGIFLAZZ_USERNAME=your_username
DIGIFLAZZ_API_KEY=your_api_key
DIGIFLAZZ_BASE_URL=https://api.digiflazz.com/v1
HOST=0.0.0.0
PORT=3001
RUST_LOG=pixel_pay_api=debug,tower_http=debug
DB_MAX_CONNECTIONS=20
DB_MIN_CONNECTIONS=5
EOF

cat > api/src/config.rs << 'EOF'
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
EOF

cat > api/src/db.rs << 'EOF'
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
EOF

cat > api/src/error.rs << 'ERRUST'
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Auth error: {0}")]
    Auth(String),
    #[error("Forbidden: {0}")]
    Forbidden(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Validation: {0}")]
    Validation(String),
    #[error("Insufficient balance")]
    InsufficientBalance { need: String, have: String },
    #[error("Digiflazz: {0}")]
    Digiflazz(String),
    #[error("Internal: {0}")]
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, msg) = match &self {
            AppError::Database(e) => {
                tracing::error!("DB: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR", "Kesalahan sistem".to_string())
            }
            AppError::Auth(m) => (StatusCode::UNAUTHORIZED, "AUTH_ERROR", m.clone()),
            AppError::Forbidden(m) => (StatusCode::FORBIDDEN, "FORBIDDEN", m.clone()),
            AppError::NotFound(m) => (StatusCode::NOT_FOUND, "NOT_FOUND", m.clone()),
            AppError::Validation(m) => (StatusCode::BAD_REQUEST, "VALIDATION", m.clone()),
            AppError::InsufficientBalance { .. } => (
                StatusCode::PAYMENT_REQUIRED,
                "INSUFFICIENT_BALANCE",
                "Saldo tidak cukup".to_string(),
            ),
            AppError::Digiflazz(m) => {
                tracing::error!("DGF: {}", m);
                (StatusCode::BAD_GATEWAY, "DIGIFLAZZ", m.clone())
            }
            AppError::Internal(m) => {
                tracing::error!("INT: {}", m);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "INTERNAL",
                    "Kesalahan internal".to_string(),
                )
            }
        };
        (
            status,
            Json(json!({"success": false, "error": {"code": code, "message": msg}})),
        )
            .into_response()
    }
}
ERRUST

cat > api/src/models/mod.rs << 'EOF'
pub mod user;
pub mod wallet;
pub mod product;
pub mod category;
pub mod transaction;
pub use user::*;
pub use wallet::*;
pub use product::*;
pub use category::*;
pub use transaction::*;
EOF

cat > api/src/models/user.rs << 'EOF'
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub phone: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub full_name: String,
    pub role: String,
    pub is_active: bool,
    pub last_login_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub phone: String,
    pub password: String,
    pub full_name: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct UserPublic {
    pub id: Uuid,
    pub email: String,
    pub phone: String,
    pub full_name: String,
    pub role: String,
    pub is_active: bool,
    pub created_at: NaiveDateTime,
}

impl From<User> for UserPublic {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            email: u.email,
            phone: u.phone,
            full_name: u.full_name,
            role: u.role,
            is_active: u.is_active,
            created_at: u.created_at,
        }
    }
}
EOF

cat > api/src/models/wallet.rs << 'EOF'
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Wallet {
    pub id: Uuid,
    pub user_id: Uuid,
    pub balance: rust_decimal::Decimal,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct TopUpRequest {
    pub amount: rust_decimal::Decimal,
    pub method: String,
}

#[derive(Debug, Serialize)]
pub struct WalletResponse {
    pub id: Uuid,
    pub balance: String,
    pub balance_formatted: String,
}

impl Wallet {
    pub fn to_response(&self) -> WalletResponse {
        let b = self.balance.to_string().parse::<f64>().unwrap_or(0.0);
        WalletResponse {
            id: self.id,
            balance: self.balance.to_string(),
            balance_formatted: format!("Rp {:,.0}", b),
        }
    }
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct BalanceLog {
    pub id: Uuid,
    pub wallet_id: Uuid,
    pub amount: rust_decimal::Decimal,
    #[sqlx(rename = "type")]
    pub log_type: String,
    pub description: String,
    pub ref_id: Option<String>,
    pub balance_before: rust_decimal::Decimal,
    pub balance_after: rust_decimal::Decimal,
    pub created_at: NaiveDateTime,
}
EOF

cat > api/src/models/category.rs << 'EOF'
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub sort_order: i32,
    pub is_active: bool,
    pub digiflazz_cmd: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}
EOF

cat > api/src/models/product.rs << 'EOF'
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Product {
    pub id: Uuid,
    pub category_id: Uuid,
    pub sku: String,
    pub buyer_sku_code: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub provider: String,
    pub brand: Option<String>,
    #[sqlx(rename = "type")]
    pub product_type: Option<String>,
    pub base_price: rust_decimal::Decimal,
    pub sell_price: rust_decimal::Decimal,
    pub profit: rust_decimal::Decimal,
    pub is_active: bool,
    pub buyer_product_status: bool,
    pub seller_product_status: bool,
    pub stock: i32,
    pub unlimited_stock: bool,
    pub synced_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Serialize)]
pub struct ProductListItem {
    pub id: Uuid,
    pub name: String,
    pub provider: String,
    pub brand: Option<String>,
    pub sell_price: String,
    pub sell_price_formatted: String,
    pub stock: i32,
    pub is_available: bool,
}

impl Product {
    pub fn to_list_item(&self) -> ProductListItem {
        let p = self.sell_price.to_string().parse::<f64>().unwrap_or(0.0);
        ProductListItem {
            id: self.id,
            name: self.name.clone(),
            provider: self.provider.clone(),
            brand: self.brand.clone(),
            sell_price: self.sell_price.to_string(),
            sell_price_formatted: format!("Rp {:,.0}", p),
            stock: self.stock,
            is_available: self.is_active
                && self.buyer_product_status
                && self.seller_product_status
                && (self.unlimited_stock || self.stock > 0),
        }
    }
}
EOF

cat > api/src/models/transaction.rs << 'EOF'
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Transaction {
    pub id: Uuid,
    pub user_id: Uuid,
    pub product_id: Uuid,
    pub ref_id: String,
    pub customer_number: String,
    pub base_price: rust_decimal::Decimal,
    pub sell_price: rust_decimal::Decimal,
    pub profit: rust_decimal::Decimal,
    pub status: String,
    pub digiflazz_ref_id: Option<String>,
    pub digiflazz_status: Option<String>,
    pub digiflazz_message: Option<String>,
    pub serial_number: Option<String>,
    pub response_payload: Option<serde_json::Value>,
    pub retry_count: i32,
    pub completed_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionRequest {
    pub product_id: Uuid,
    pub customer_number: String,
}

#[derive(Debug, Serialize)]
pub struct TransactionResponse {
    pub id: Uuid,
    pub ref_id: String,
    pub product_name: String,
    pub customer_number: String,
    pub sell_price: String,
    pub sell_price_formatted: String,
    pub status: String,
    pub status_label: String,
    pub sn: Option<String>,
    pub created_at: NaiveDateTime,
}

impl Transaction {
    pub fn to_response(&self, product_name: &str) -> TransactionResponse {
        let p = self.sell_price.to_string().parse::<f64>().unwrap_or(0.0);
        let label = match self.status.as_str() {
            "pending" => "Menunggu",
            "processing" => "Diproses",
            "success" => "Berhasil",
            "failed" => "Gagal",
            "refunded" => "Dikembalikan",
            "expired" => "Kedaluwarsa",
            _ => &self.status,
        };
        TransactionResponse {
            id: self.id,
            ref_id: self.ref_id.clone(),
            product_name: product_name.to_string(),
            customer_number: self.customer_number.clone(),
            sell_price: self.sell_price.to_string(),
            sell_price_formatted: format!("Rp {:,.0}", p),
            status: self.status.clone(),
            status_label: label.to_string(),
            sn: self.serial_number.clone(),
            created_at: self.created_at,
        }
    }
}
EOF

cat > api/src/middleware/mod.rs << 'EOF'
pub mod auth;
pub use auth::{Claims, AdminClaims};
EOF

cat > api/src/middleware/auth.rs << 'EOF'
use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    RequestPartsExt,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: Uuid,
    pub email: String,
    pub role: String,
    pub exp: usize,
    pub iat: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AdminClaims {
    pub claims: Claims,
}

#[async_trait]
impl<S: Send + Sync> FromRequestParts<S> for Claims {
    type Rejection = (StatusCode, axum::Json<serde_json::Value>);
    async fn from_request_parts(
        parts: &mut Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| {
                (
                    StatusCode::UNAUTHORIZED,
                    axum::Json(serde_json::json!({
                        "success": false,
                        "error": {"code": "AUTH_ERROR", "message": "Token tidak ditemukan"}
                    })),
                )
            })?;
        let secret = std::env::var("JWT_SECRET")
            .unwrap_or_else(|_| "pixel-pay-secret-change-me".into());
        let data = decode::<Claims>(
            bearer.token(),
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::new(Algorithm::HS256),
        )
        .map_err(|_| {
            (
                StatusCode::UNAUTHORIZED,
                axum::Json(serde_json::json!({
                    "success": false,
                    "error": {"code": "AUTH_ERROR", "message": "Token tidak valid"}
                })),
            )
        })?;
        Ok(data.claims)
    }
}

#[async_trait]
impl<S: Send + Sync> FromRequestParts<S> for AdminClaims {
    type Rejection = (StatusCode, axum::Json<serde_json::Value>);
    async fn from_request_parts(
        parts: &mut Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let claims = Claims::from_request_parts(parts, state).await?;
        if claims.role != "admin" && claims.role != "superadmin" {
            return Err((
                StatusCode::FORBIDDEN,
                axum::Json(serde_json::json!({
                    "success": false,
                    "error": {"code": "FORBIDDEN", "message": "Akses admin diperlukan"}
                })),
            ));
        }
        Ok(AdminClaims { claims })
    }
}
EOF

cat > api/src/services/mod.rs << 'EOF'
pub mod auth_service;
pub mod wallet_service;
pub mod product_service;
pub mod transaction_service;
pub mod digiflazz_service;
pub use auth_service::AuthService;
pub use wallet_service::WalletService;
pub use product_service::ProductService;
pub use transaction_service::TransactionService;
pub use digiflazz_service::DigiflazzService;
EOF

cat > api/src/services/auth_service.rs << 'EOF'
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use sqlx::PgPool;
use uuid::Uuid;
use crate::config::AppConfig;
use crate::error::AppError;
use crate::middleware::Claims;
use crate::models::user::*;

pub struct AuthService;

impl AuthService {
    pub fn hash_password(pw: &str) -> Result<String, AppError> {
        hash(pw, DEFAULT_COST).map_err(|e| AppError::Internal(e.to_string()))
    }
    pub fn verify_password(pw: &str, h: &str) -> Result<bool, AppError> {
        verify(pw, h).map_err(|e| AppError::Internal(e.to_string()))
    }
    pub fn generate_token(
        uid: Uuid,
        email: &str,
        role: &str,
        cfg: &AppConfig,
    ) -> Result<String, AppError> {
        let now = Utc::now();
        let c = Claims {
            sub: uid,
            email: email.into(),
            role: role.into(),
            iat: now.timestamp() as usize,
            exp: (now + Duration::hours(cfg.jwt_expiration_hours)).timestamp() as usize,
        };
        encode(
            &Header::default(),
            &c,
            &EncodingKey::from_secret(cfg.jwt_secret.as_bytes()),
        )
        .map_err(|e| AppError::Internal(e.to_string()))
    }
    pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, AppError> {
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
            .bind(email)
            .fetch_optional(pool)
            .await
            .map_err(AppError::Database)
    }
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>, AppError> {
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await
            .map_err(AppError::Database)
    }
    pub async fn create_user(pool: &PgPool, req: &RegisterRequest) -> Result<User, AppError> {
        let ph = Self::hash_password(&req.password)?;
        let uid = Uuid::new_v4();
        let user = sqlx::query_as::<_, User>(
            "INSERT INTO users (id, email, phone, password_hash, full_name) \
             VALUES ($1, $2, $3, $4, $5) RETURNING *",
        )
        .bind(uid)
        .bind(&req.email)
        .bind(&req.phone)
        .bind(&ph)
        .bind(&req.full_name)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(ref d) = e {
                if d.constraint().is_some() {
                    return AppError::Validation("Email/HP sudah terdaftar".into());
                }
            }
            AppError::Database(e)
        })?;
        sqlx::query("INSERT INTO wallets (user_id) VALUES ($1)")
            .bind(uid)
            .execute(pool)
            .await?;
        Ok(user)
    }
    pub async fn update_last_login(pool: &PgPool, uid: Uuid) -> Result<(), AppError> {
        sqlx::query("UPDATE users SET last_login_at = NOW() WHERE id = $1")
            .bind(uid)
            .execute(pool)
            .await?;
        Ok(())
    }
}
EOF

cat > api/src/services/wallet_service.rs << 'EOF'
use sqlx::PgPool;
use uuid::Uuid;
use crate::error::AppError;
use crate::models::wallet::*;

pub struct WalletService;

impl WalletService {
    pub async fn get_by_user(pool: &PgPool, uid: Uuid) -> Result<Wallet, AppError> {
        sqlx::query_as::<_, Wallet>("SELECT * FROM wallets WHERE user_id = $1")
            .bind(uid)
            .fetch_optional(pool)
            .await?
            .ok_or_else(|| AppError::NotFound("Wallet tidak ditemukan".into()))
    }
    pub async fn get_balance(pool: &PgPool, uid: Uuid) -> Result<WalletResponse, AppError> {
        Ok(Self::get_by_user(pool, uid).await?.to_response())
    }
    pub async fn credit(
        pool: &PgPool,
        uid: Uuid,
        amount: rust_decimal::Decimal,
        desc: &str,
        ref_id: Option<&str>,
    ) -> Result<Wallet, AppError> {
        let mut tx = pool.begin().await?;
        let w = sqlx::query_as::<_, Wallet>(
            "SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE",
        )
        .bind(uid)
        .fetch_one(&mut *tx)
        .await?;
        let before = w.balance;
        let after = before + amount;
        sqlx::query("UPDATE wallets SET balance=$1, updated_at=NOW() WHERE id=$2")
            .bind(after)
            .bind(w.id)
            .execute(&mut *tx)
            .await?;
        sqlx::query(
            "INSERT INTO balance_logs \
             (wallet_id, amount, type, description, ref_id, balance_before, balance_after) \
             VALUES ($1, $2, 'credit', $3, $4, $5, $6)",
        )
        .bind(w.id)
        .bind(amount)
        .bind(desc)
        .bind(ref_id)
        .bind(before)
        .bind(after)
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        Ok(Wallet {
            balance: after,
            ..w
        })
    }
    pub async fn debit(
        pool: &PgPool,
        uid: Uuid,
        amount: rust_decimal::Decimal,
        desc: &str,
        ref_id: Option<&str>,
    ) -> Result<Wallet, AppError> {
        let mut tx = pool.begin().await?;
        let w = sqlx::query_as::<_, Wallet>(
            "SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE",
        )
        .bind(uid)
        .fetch_one(&mut *tx)
        .await?;
        if w.balance < amount {
            return Err(AppError::InsufficientBalance {
                need: amount.to_string(),
                have: w.balance.to_string(),
            });
        }
        let before = w.balance;
        let after = before - amount;
        sqlx::query("UPDATE wallets SET balance=$1, updated_at=NOW() WHERE id=$2")
            .bind(after)
            .bind(w.id)
            .execute(&mut *tx)
            .await?;
        sqlx::query(
            "INSERT INTO balance_logs \
             (wallet_id, amount, type, description, ref_id, balance_before, balance_after) \
             VALUES ($1, $2, 'debit', $3, $4, $5, $6)",
        )
        .bind(w.id)
        .bind(amount)
        .bind(desc)
        .bind(ref_id)
        .bind(before)
        .bind(after)
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        Ok(Wallet {
            balance: after,
            ..w
        })
    }
    pub async fn get_logs(
        pool: &PgPool,
        uid: Uuid,
        limit: i64,
    ) -> Result<Vec<BalanceLog>, AppError> {
        let w = Self::get_by_user(pool, uid).await?;
        sqlx::query_as::<_, BalanceLog>(
            "SELECT * FROM balance_logs WHERE wallet_id=$1 ORDER BY created_at DESC LIMIT $2",
        )
        .bind(w.id)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)
    }
}
EOF

cat > api/src/services/product_service.rs << 'EOF'
use sqlx::PgPool;
use uuid::Uuid;
use crate::error::AppError;
use crate::models::{category::Category, product::*};

pub struct ProductService;

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
EOF

cat > api/src/services/digiflazz_service.rs << 'EOF'
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use crate::config::AppConfig;
use crate::error::AppError;

#[derive(Clone)]
pub struct DigiflazzService {
    client: Client,
    config: AppConfig,
}

#[derive(Debug, Deserialize)]
pub struct DgApiResponse<T> {
    pub data: Option<T>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DgTransaction {
    pub ref_id: String,
    pub status: String,
    pub message: String,
    pub sn: Option<String>,
    pub price: Option<f64>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DgProduct {
    pub buyer_sku_code: String,
    pub product_name: String,
    pub category: String,
    pub brand: String,
    #[serde(rename = "type")]
    pub product_type: String,
    pub price: f64,
    pub buyer_product_status: bool,
    pub seller_product_status: bool,
    pub unlimited_stock: bool,
    pub stock: Option<i32>,
}

impl DigiflazzService {
    pub fn new(config: AppConfig) -> Self {
        Self {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap(),
            config,
        }
    }
    fn sign(&self, ref_id: &str) -> String {
        let input = format!(
            "{}{}{}",
            self.config.digiflazz_username, self.config.digiflazz_api_key, ref_id
        );
        format!("{:x}", Sha256::digest(input.as_bytes()))
    }
    pub async fn price_list(&self, cmd: &str) -> Result<Vec<DgProduct>, AppError> {
        let body = serde_json::json!({
            "cmd": cmd,
            "username": self.config.digiflazz_username,
            "sign": self.sign("pricelist")
        });
        let r = self
            .client
            .post(format!(
                "{}/price-list",
                self.config.digiflazz_base_url
            ))
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Digiflazz(e.to_string()))?;
        let res: DgApiResponse<Vec<DgProduct>> = r
            .json()
            .await
            .map_err(|e| AppError::Digiflazz(e.to_string()))?;
        Ok(res.data.unwrap_or_default())
    }
    pub async fn buy(
        &self,
        sku: &str,
        customer_no: &str,
        ref_id: &str,
    ) -> Result<DgTransaction, AppError> {
        let body = serde_json::json!({
            "username": self.config.digiflazz_username,
            "buyer_sku_code": sku,
            "customer_no": customer_no,
            "ref_id": ref_id,
            "sign": self.sign(ref_id)
        });
        let r = self
            .client
            .post(format!(
                "{}/transaction",
                self.config.digiflazz_base_url
            ))
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Digiflazz(e.to_string()))?;
        let res: DgApiResponse<DgTransaction> = r
            .json()
            .await
            .map_err(|e| AppError::Digiflazz(e.to_string()))?;
        res.data
            .ok_or_else(|| AppError::Digiflazz("Empty response".into()))
    }
    pub async fn check(&self, ref_id: &str) -> Result<DgTransaction, AppError> {
        let body = serde_json::json!({
            "username": self.config.digiflazz_username,
            "ref_id": ref_id,
            "sign": self.sign(ref_id)
        });
        let r = self
            .client
            .post(format!(
                "{}/transaction",
                self.config.digiflazz_base_url
            ))
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Digiflazz(e.to_string()))?;
        let res: DgApiResponse<DgTransaction> = r
            .json()
            .await
            .map_err(|e| AppError::Digiflazz(e.to_string()))?;
        res.data
            .ok_or_else(|| AppError::Digiflazz("Not found".into()))
    }
}
EOF

cat > api/src/services/transaction_service.rs << 'EOF'
use sqlx::PgPool;
use uuid::Uuid;
use crate::error::AppError;
use crate::models::transaction::*;
use crate::services::{DigiflazzService, ProductService, WalletService};

pub struct TransactionService;

impl TransactionService {
    pub fn generate_ref_id() -> String {
        format!("PP-{}", Uuid::new_v4().to_string()[..12].to_uppercase())
    }
    pub async fn create(
        pool: &PgPool,
        uid: Uuid,
        pid: Uuid,
        customer: &str,
        dg: &DigiflazzService,
    ) -> Result<Transaction, AppError> {
        let prod = ProductService::find_by_id(pool, pid).await?;
        if !prod.buyer_product_status || !prod.seller_product_status {
            return Err(AppError::Validation("Produk tidak tersedia".into()));
        }
        if !prod.unlimited_stock && prod.stock <= 0 {
            return Err(AppError::Validation("Stok habis".into()));
        }
        WalletService::debit(
            pool,
            uid,
            prod.sell_price,
            &format!("Beli {}", prod.name),
            None,
        )
        .await?;
        let ref_id = Self::generate_ref_id();
        let tx = sqlx::query_as::<_, Transaction>(
            "INSERT INTO transactions \
             (user_id, product_id, ref_id, customer_number, \
              base_price, sell_price, profit, status) \
             VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING *",
        )
        .bind(uid)
        .bind(pid)
        .bind(&ref_id)
        .bind(customer)
        .bind(prod.base_price)
        .bind(prod.sell_price)
        .bind(prod.profit)
        .fetch_one(pool)
        .await?;
        let sku = prod.buyer_sku_code.as_deref().unwrap_or(&prod.sku);
        match dg.buy(sku, customer, &ref_id).await {
            Ok(resp) => {
                let st = match resp.status.as_str() {
                    "Sukses" => "success",
                    "Gagal" => "failed",
                    _ => "processing",
                };
                sqlx::query(
                    "UPDATE transactions SET status=$1, digiflazz_status=$2, sn=$3, \
                     response_payload=$4, digiflazz_ref_id=$5, \
                     completed_at=CASE WHEN $1 IN ('success','failed') \
                     THEN NOW() ELSE NULL END, updated_at=NOW() WHERE ref_id=$6",
                )
                .bind(st)
                .bind(&resp.status)
                .bind(&resp.sn)
                .bind(serde_json::to_value(&resp).unwrap_or_default())
                .bind(&resp.ref_id)
                .bind(&ref_id)
                .execute(pool)
                .await?;
                if st == "failed" {
                    let _ = WalletService::credit(
                        pool,
                        uid,
                        prod.sell_price,
                        &format!("Refund: {}", prod.name),
                        Some(&ref_id),
                    )
                    .await;
                }
            }
            Err(e) => tracing::error!("DGF buy {}: {:?}", ref_id, e),
        }
        sqlx::query_as::<_, Transaction>(
            "SELECT * FROM transactions WHERE ref_id=$1",
        )
        .bind(&ref_id)
        .fetch_one(pool)
        .await
        .map_err(AppError::Database)
    }
    pub async fn list_by_user(
        pool: &PgPool,
        uid: Uuid,
        limit: i64,
    ) -> Result<Vec<Transaction>, AppError> {
        sqlx::query_as::<_, Transaction>(
            "SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2",
        )
        .bind(uid)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)
    }
    pub async fn list_all(
        pool: &PgPool,
        limit: i64,
    ) -> Result<Vec<Transaction>, AppError> {
        sqlx::query_as::<_, Transaction>(
            "SELECT * FROM transactions ORDER BY created_at DESC LIMIT $1",
        )
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)
    }
    pub async fn get_by_ref(pool: &PgPool, ref_id: &str) -> Result<Transaction, AppError> {
        sqlx::query_as::<_, Transaction>(
            "SELECT * FROM transactions WHERE ref_id=$1",
        )
        .bind(ref_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Transaksi tidak ditemukan".into()))
    }
}
EOF

cat > api/src/handlers/mod.rs << 'EOF'
pub mod auth;
pub mod wallet;
pub mod product;
pub mod transaction;
pub mod admin;
EOF

cat > api/src/handlers/auth.rs << 'EOF'
use axum::{extract::State, Json};
use sqlx::PgPool;
use crate::{
    config::AppConfig, error::AppError, middleware::Claims,
    models::user::*, services::AuthService,
};

#[derive(Clone)]
pub struct AuthState {
    pub pool: PgPool,
    pub config: AppConfig,
}

pub async fn register(
    State(s): State<AuthState>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.password.len() < 6 {
        return Err(AppError::Validation("Password min 6 karakter".into()));
    }
    let user = AuthService::create_user(&s.pool, &req).await?;
    let token = AuthService::generate_token(user.id, &user.email, &user.role, &s.config)?;
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Registrasi berhasil",
        "data": { "token": token, "user": UserPublic::from(user) }
    })))
}

pub async fn login(
    State(s): State<AuthState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user = AuthService::find_by_email(&s.pool, &req.email)
        .await?
        .ok_or_else(|| AppError::Auth("Email/password salah".into()))?;
    if !user.is_active {
        return Err(AppError::Auth("Akun dinonaktifkan".into()));
    }
    if !AuthService::verify_password(&req.password, &user.password_hash)? {
        return Err(AppError::Auth("Email/password salah".into()));
    }
    AuthService::update_last_login(&s.pool, user.id).await?;
    let token = AuthService::generate_token(user.id, &user.email, &user.role, &s.config)?;
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Login berhasil",
        "data": { "token": token, "user": UserPublic::from(user) }
    })))
}

pub async fn me(
    State(s): State<AuthState>,
    c: Claims,
) -> Result<Json<serde_json::Value>, AppError> {
    let user = AuthService::find_by_id(&s.pool, c.sub)
        .await?
        .ok_or_else(|| AppError::NotFound("User tidak ditemukan".into()))?;
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "user": UserPublic::from(user) }
    })))
}
EOF

cat > api/src/handlers/wallet.rs << 'EOF'
use axum::{extract::State, Json};
use sqlx::PgPool;
use crate::{error::AppError, middleware::Claims, services::WalletService};

pub async fn get_balance(
    State(p): State<PgPool>,
    c: Claims,
) -> Result<Json<serde_json::Value>, AppError> {
    let w = WalletService::get_balance(&p, c.sub).await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "wallet": w }
    })))
}

pub async fn get_history(
    State(p): State<PgPool>,
    c: Claims,
) -> Result<Json<serde_json::Value>, AppError> {
    let logs = WalletService::get_logs(&p, c.sub, 50).await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "logs": logs }
    })))
}
EOF

cat > api/src/handlers/product.rs << 'EOF'
use axum::{extract::{Path, Query, State}, Json};
use serde::Deserialize;
use sqlx::PgPool;
use crate::{error::AppError, services::ProductService};

#[derive(Deserialize)]
pub struct SearchQ {
    pub q: Option<String>,
}

pub async fn list_categories(
    State(p): State<PgPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "categories": ProductService::list_categories(&p).await? }
    })))
}

pub async fn list_products(
    State(p): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let prods = ProductService::list_by_category(&p, &slug).await?;
    let items: Vec<_> = prods.iter().map(|x| x.to_list_item()).collect();
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "products": items }
    })))
}

pub async fn search_products(
    State(p): State<PgPool>,
    Query(q): Query<SearchQ>,
) -> Result<Json<serde_json::Value>, AppError> {
    let q = q.q.unwrap_or_default();
    if q.len() < 2 {
        return Err(AppError::Validation("Query min 2 karakter".into()));
    }
    let prods = ProductService::search(&p, &q).await?;
    let items: Vec<_> = prods.iter().map(|x| x.to_list_item()).collect();
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "products": items }
    })))
}
EOF

cat > api/src/handlers/transaction.rs << 'EOF'
use axum::{extract::State, Json};
use sqlx::PgPool;
use crate::{
    config::AppConfig, error::AppError, middleware::Claims,
    models::transaction::*, services::{DigiflazzService, TransactionService},
};

#[derive(Clone)]
pub struct TxState {
    pub pool: PgPool,
    pub digiflazz: DigiflazzService,
    pub config: AppConfig,
}

pub async fn create(
    State(s): State<TxState>,
    c: Claims,
    Json(req): Json<CreateTransactionRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.customer_number.len() < 10 {
        return Err(AppError::Validation("Nomor min 10 digit".into()));
    }
    let tx = TransactionService::create(
        &s.pool,
        c.sub,
        req.product_id,
        &req.customer_number,
        &s.digiflazz,
    )
    .await?;
    let pn: String = sqlx::query_scalar("SELECT name FROM products WHERE id=$1")
        .bind(tx.product_id)
        .fetch_one(&s.pool)
        .await
        .unwrap_or_else(|_| "Unknown".into());
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "transaction": tx.to_response(&pn) }
    })))
}

pub async fn list(
    State(p): State<PgPool>,
    c: Claims,
) -> Result<Json<serde_json::Value>, AppError> {
    let txs = TransactionService::list_by_user(&p, c.sub, 50).await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "transactions": txs }
    })))
}
EOF

cat > api/src/handlers/admin.rs << 'EOF'
use axum::{extract::State, Json};
use sqlx::PgPool;
use crate::{
    config::AppConfig, error::AppError, middleware::AdminClaims,
    models::user::UserPublic,
    services::{DigiflazzService, ProductService, TransactionService},
};

#[derive(Clone)]
pub struct AdminState {
    pub pool: PgPool,
    pub digiflazz: DigiflazzService,
    pub config: AppConfig,
}

pub async fn dashboard(
    State(p): State<PgPool>,
    _a: AdminClaims,
) -> Result<Json<serde_json::Value>, AppError> {
    let rev: (Option<rust_decimal::Decimal>,) = sqlx::query_as(
        "SELECT COALESCE(SUM(profit),0) FROM transactions \
         WHERE status='success' AND created_at::date=CURRENT_DATE",
    )
    .fetch_one(&p)
    .await?;
    let cnt: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM transactions WHERE created_at::date=CURRENT_DATE",
    )
    .fetch_one(&p)
    .await?;
    let users: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(&p)
        .await?;
    let rf = rev
        .0
        .unwrap_or_default()
        .to_string()
        .parse::<f64>()
        .unwrap_or(0.0);
    Ok(Json(serde_json::json!({
        "success": true,
        "data": {
            "revenue_today": format!("Rp {:,.0}", rf),
            "transactions_today": cnt.0,
            "total_users": users.0
        }
    })))
}

pub async fn all_transactions(
    State(p): State<PgPool>,
    _a: AdminClaims,
) -> Result<Json<serde_json::Value>, AppError> {
    let txs = TransactionService::list_all(&p, 100).await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "transactions": txs }
    })))
}

pub async fn list_users_admin(
    State(p): State<PgPool>,
    _a: AdminClaims,
) -> Result<Json<serde_json::Value>, AppError> {
    let us = sqlx::query_as::<_, crate::models::user::User>(
        "SELECT * FROM users ORDER BY created_at DESC LIMIT 200",
    )
    .fetch_all(&p)
    .await?;
    let publ: Vec<_> = us.into_iter().map(UserPublic::from).collect();
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "users": publ }
    })))
}

pub async fn sync_products(
    State(s): State<AdminState>,
    _a: AdminClaims,
) -> Result<Json<serde_json::Value>, AppError> {
    let cats = ProductService::list_categories(&s.pool).await?;
    let mut total = 0u32;
    for cat in &cats {
        if let Some(cmd) = &cat.digiflazz_cmd {
            match s.digiflazz.price_list(cmd).await {
                Ok(prods) => {
                    total += prods.len() as u32;
                    tracing::info!("Synced {} for {}", prods.len(), cat.name);
                }
                Err(e) => tracing::error!("Sync {}: {:?}", cat.name, e),
            }
        }
    }
    Ok(Json(serde_json::json!({
        "success": true,
        "data": { "total_synced": total }
    })))
}
EOF

cat > api/src/routes/mod.rs << 'EOF'
pub mod api;
EOF

cat > api/src/routes/api.rs << 'EOF'
use axum::{routing::{get, post}, Router};
use sqlx::PgPool;
use tower_http::cors::{Any, CorsLayer};
use crate::{config::AppConfig, handlers::*, services::DigiflazzService};

pub fn build_router(pool: PgPool, config: AppConfig) -> Router {
    let dg = DigiflazzService::new(config.clone());
    let auth_s = auth::AuthState {
        pool: pool.clone(),
        config: config.clone(),
    };
    let tx_s = transaction::TxState {
        pool: pool.clone(),
        digiflazz: dg.clone(),
        config: config.clone(),
    };
    let adm_s = admin::AdminState {
        pool: pool.clone(),
        digiflazz: dg.clone(),
        config: config.clone(),
    };
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let auth_r = Router::new()
        .route("/register", post(auth::register))
        .route("/login", post(auth::login))
        .route("/me", get(auth::me))
        .with_state(auth_s);

    let prod_r = Router::new()
        .route("/categories", get(product::list_categories))
        .route("/category/{slug}", get(product::list_products))
        .route("/search", get(product::search_products))
        .with_state(pool.clone());

    let wallet_r = Router::new()
        .route("/balance", get(wallet::get_balance))
        .route("/history", get(wallet::get_history))
        .with_state(pool.clone());

    let tx_r = Router::new()
        .route("/create", post(transaction::create))
        .route("/list", get(transaction::list))
        .with_state(tx_s);

    let adm_r = Router::new()
        .route("/dashboard", get(admin::dashboard))
        .route("/users", get(admin::list_users_admin))
        .route("/transactions", get(admin::all_transactions))
        .route("/sync-products", post(admin::sync_products))
        .with_state(adm_s);

    let health = Router::new().route(
        "/health",
        get(|| async {
            axum::Json(
                serde_json::json!({"status": "ok", "service": "pixel-pay-api"}),
            )
        }),
    );

    Router::new()
        .merge(health)
        .nest("/api/auth", auth_r)
        .nest("/api/products", prod_r)
        .nest("/api/wallet", wallet_r)
        .nest("/api/transactions", tx_r)
        .nest("/api/admin", adm_r)
        .layer(cors)
}
EOF

cat > api/src/main.rs << 'EOF'
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
EOF

# ============================================================
# ADMIN - React + Vite + Tailwind
# ============================================================
mkdir -p admin/src/{lib,hooks,components/{layout,ui,dashboard},pages}

cat > admin/package.json << 'EOF'
{
  "name": "@pixel-pay/admin",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 5174",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.0",
    "axios": "^1.7.0",
    "recharts": "^2.15.0",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
EOF

cat > admin/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
EOF

cat > admin/vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: { "/api": { target: "http://localhost:3001", changeOrigin: true } },
  },
});
EOF

cat > admin/tailwind.config.ts << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        body: ['"VT323"', "monospace"],
      },
      colors: {
        px: {
          bg: "#0b0b1a",
          surface: "#12122b",
          card: "#1a1a3e",
          border: "#2a2a5a",
          primary: "#00ff88",
          secondary: "#ff2e63",
          accent: "#08d9d6",
          yellow: "#ffcc00",
          purple: "#a855f7",
          white: "#eaeaff",
          muted: "#5a5a8a",
        },
      },
      animation: {
        blink: "blink 1.2s step-end infinite",
        slideUp: "slideUp 0.5s ease forwards",
      },
      keyframes: {
        blink: { "50%": { opacity: "0.3" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
EOF

cat > admin/postcss.config.js << 'EOF'
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
EOF

cat > admin/index.html << 'EOF'
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap"
      rel="stylesheet"
    />
    <title>PIXEL PAY - Admin</title>
  </head>
  <body class="bg-px-bg text-px-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

cat > admin/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
  body { @apply font-body text-xl antialiased; }
}
@layer utilities {
  .scanline {
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0, 0, 0, 0.06) 2px, rgba(0, 0, 0, 0.06) 4px
    );
    pointer-events: none;
    z-index: 9999;
  }
  .glow { text-shadow: 0 0 20px rgba(0, 255, 136, 0.4); }
  .glow-y { text-shadow: 0 0 20px rgba(255, 204, 0, 0.4); }
}
EOF

cat > admin/src/main.tsx << 'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > admin/src/lib/api.ts << 'EOF'
import axios from "axios";
const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("px_admin_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.removeItem("px_admin_token");
      window.location.href = "/login";
    }
    return Promise.reject(e);
  }
);
export default api;
EOF

cat > admin/src/components/ui/PixelButton.tsx << 'EOF'
import { ButtonHTMLAttributes, ReactNode } from "react";
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "accent" | "yellow" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}
export default function PixelButton({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: Props) {
  const v: Record<string, string> = {
    primary:
      "border-px-primary text-px-primary hover:bg-px-primary hover:text-px-bg",
    danger:
      "border-px-secondary text-px-secondary hover:bg-px-secondary hover:text-px-white",
    accent:
      "border-px-accent text-px-accent hover:bg-px-accent hover:text-px-bg",
    yellow:
      "border-px-yellow text-px-yellow hover:bg-px-yellow hover:text-px-bg",
    ghost:
      "border-px-muted text-px-muted hover:border-px-white hover:text-px-white",
  };
  const s: Record<string, string> = {
    sm: "font-pixel text-[6px] px-3 py-1.5",
    md: "font-pixel text-[8px] px-5 py-2.5",
    lg: "font-pixel text-[10px] px-8 py-3.5",
  };
  return (
    <button
      className={`border-[3px] bg-transparent cursor-pointer uppercase tracking-wider transition-all hover:-translate-y-0.5 disabled:opacity-40 ${v[variant]} ${s[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
EOF

cat > admin/src/components/ui/PixelCard.tsx << 'EOF'
import { ReactNode } from "react";
export default function PixelCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-px-card border-[3px] border-px-border ${className}`}>
      {children}
    </div>
  );
}
EOF

cat > admin/src/components/ui/PixelBadge.tsx << 'EOF'
export default function PixelBadge({
  variant,
  children,
}: {
  variant: "success" | "pending" | "failed" | "info";
  children: React.ReactNode;
}) {
  const v: Record<string, string> = {
    success: "border-px-primary text-px-primary",
    pending: "border-px-yellow text-px-yellow",
    failed: "border-px-secondary text-px-secondary",
    info: "border-px-accent text-px-accent",
  };
  return (
    <span
      className={`font-pixel text-[6px] px-3 py-1.5 border-[2px] uppercase tracking-wider inline-block ${v[variant]}`}
    >
      {children}
    </span>
  );
}
EOF

cat > admin/src/components/layout/Sidebar.tsx << 'EOF'
import { useLocation, useNavigate } from "react-router-dom";
const items = [
  { path: "/", icon: "📊", label: "DASHBOARD" },
  { path: "/users", icon: "👥", label: "USERS" },
  { path: "/transactions", icon: "💰", label: "TRANSAKSI" },
  { path: "/products", icon: "📦", label: "PRODUK" },
  { path: "/digiflazz", icon: "🔄", label: "DIGIFLAZZ" },
];
export default function Sidebar() {
  const loc = useLocation();
  const nav = useNavigate();
  return (
    <aside className="w-[260px] bg-px-surface border-r-[3px] border-px-border flex flex-col fixed top-0 left-0 bottom-0 z-50">
      <div className="p-6 border-b-[3px] border-px-border text-center">
        <h1 className="font-pixel text-sm text-px-primary glow tracking-wider">
          PIXEL PAY
        </h1>
        <div className="font-pixel text-[7px] text-px-accent mt-1.5 tracking-[3px]">
          ADMIN PANEL
        </div>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {items.map((i) => {
          const a =
            loc.pathname === i.path ||
            (i.path !== "/" && loc.pathname.startsWith(i.path));
          return (
            <div
              key={i.path}
              onClick={() => nav(i.path)}
              className={`flex items-center gap-3.5 px-6 py-3.5 cursor-pointer border-l-4 font-pixel text-[8px] tracking-wider transition-all ${
                a
                  ? "bg-px-primary/10 text-px-primary border-l-px-primary glow"
                  : "text-px-muted border-l-transparent hover:bg-px-primary/5 hover:text-px-primary hover:border-l-px-primary"
              }`}
            >
              <span className="text-lg w-6 text-center">{i.icon}</span>
              {i.label}
            </div>
          );
        })}
      </nav>
      <div className="p-4 border-t-[3px] border-px-border text-center font-pixel text-[6px] text-px-muted">
        PIXEL PAY v1.0
      </div>
    </aside>
  );
}
EOF

cat > admin/src/components/layout/AdminLayout.tsx << 'EOF'
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-px-bg">
      <div className="fixed inset-0 scanline pointer-events-none" />
      <Sidebar />
      <main className="flex-1 ml-[260px]">
        <Outlet />
      </main>
    </div>
  );
}
EOF

cat > admin/src/pages/LoginPage.tsx << 'EOF'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PixelButton from "../components/ui/PixelButton";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    localStorage.setItem("px_admin_token", "demo");
    nav("/");
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-px-bg flex items-center justify-center">
      <div className="fixed inset-0 scanline pointer-events-none" />
      <div className="bg-px-card border-[4px] border-px-primary p-10 w-full max-w-md relative">
        <div className="absolute -inset-1 bg-px-primary/5 blur-xl pointer-events-none" />
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="font-pixel text-xl text-px-primary glow tracking-wider mb-2">
              PIXEL PAY
            </h1>
            <div className="font-pixel text-[8px] text-px-accent tracking-[4px]">
              ADMIN LOGIN
            </div>
          </div>
          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none"
                placeholder="admin@pixelpay.id"
                required
              />
            </div>
            <div>
              <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full px-4 py-3.5 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none"
                placeholder="********"
                required
              />
            </div>
            <PixelButton type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "LOADING..." : "LOGIN"}
            </PixelButton>
          </form>
        </div>
      </div>
    </div>
  );
}
EOF

cat > admin/src/pages/DashboardPage.tsx << 'EOF'
import PixelCard from "../components/ui/PixelCard";
const stats = [
  { label: "PENDAPATAN", value: "Rp 12.450.000", change: "+12.5%", ok: true, icon: "💰" },
  { label: "TX HARI INI", value: "847", change: "+23", ok: true, icon: "📊" },
  { label: "TOTAL USER", value: "3.241", change: "+156", ok: true, icon: "👥" },
  { label: "TX GAGAL", value: "12", change: "1.4%", ok: false, icon: "⚠️" },
];
const bars = [
  { d: "SEN", h: 60 }, { d: "SEL", h: 85 }, { d: "RAB", h: 45 },
  { d: "KAM", h: 90 }, { d: "JUM", h: 70 }, { d: "SAB", h: 100 }, { d: "MIN", h: 55 },
];
const syncs = [
  { i: "📱", n: "PULSA & DATA", c: 342 },
  { i: "⚡", n: "TOKEN PLN", c: 18 },
  { i: "🎮", n: "VOUCHER GAME", c: 156 },
  { i: "💧", n: "PDAM", c: 89 },
];
export default function DashboardPage() {
  return (
    <>
      <div className="bg-px-surface border-b-[3px] border-px-border px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <h2 className="font-pixel text-[11px] text-px-white tracking-wider">// DASHBOARD</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-px-primary animate-blink" />
          <span className="font-pixel text-[7px] text-px-primary">DIGIFLAZZ: CONNECTED</span>
        </div>
      </div>
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <PixelCard key={i}>
              <div className="relative overflow-hidden p-6">
                <div className={`absolute top-0 left-0 right-0 h-1 ${s.ok ? "bg-px-primary" : "bg-px-secondary"}`} />
                <span className="font-pixel text-[7px] text-px-muted tracking-wider uppercase">{s.label}</span>
                <div className={`font-pixel text-lg mt-2 ${s.ok ? "text-px-primary glow" : "text-px-secondary"}`}>{s.value}</div>
                <div className={`font-pixel text-[7px] mt-1 ${s.ok ? "text-px-primary" : "text-px-secondary"}`}>{s.change}</div>
              </div>
            </PixelCard>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PixelCard>
            <div className="p-4 border-b-[3px] border-px-border">
              <span className="font-pixel text-[9px] text-px-accent tracking-wider">PENJUALAN 7 HARI</span>
            </div>
            <div className="p-6 flex items-end gap-3 h-44">
              {bars.map((b) => (
                <div key={b.d} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-px-primary" style={{ height: `${b.h}%` }} />
                  <span className="font-pixel text-[6px] text-px-muted">{b.d}</span>
                </div>
              ))}
            </div>
          </PixelCard>
          <PixelCard>
            <div className="p-4 border-b-[3px] border-px-border">
              <span className="font-pixel text-[9px] text-px-purple tracking-wider">DIGIFLAZZ SYNC</span>
            </div>
            {syncs.map((s) => (
              <div key={s.n} className="flex items-center gap-5 p-5 border-b border-px-border/50 last:border-b-0">
                <div className="text-2xl w-10 h-10 flex items-center justify-center border-[3px] border-px-border">{s.i}</div>
                <div className="flex-1">
                  <div className="font-pixel text-[8px] text-px-white">{s.n}</div>
                  <div className="font-body text-sm text-px-muted">{s.c} produk</div>
                </div>
                <div className="font-pixel text-[7px] text-px-primary">SYNCED</div>
              </div>
            ))}
          </PixelCard>
        </div>
      </div>
    </>
  );
}
EOF

cat > admin/src/pages/UsersPage.tsx << 'EOF'
import PixelCard from "../components/ui/PixelCard";
import PixelBadge from "../components/ui/PixelBadge";
const users = [
  { n: "Budi Santoso", e: "budi@mail.com", p: "081234567890", r: "user", a: true },
  { n: "Sari Dewi", e: "sari@mail.com", p: "085678901234", r: "user", a: true },
  { n: "Admin Utama", e: "admin@px.id", p: "081111111111", r: "admin", a: true },
];
export default function UsersPage() {
  return (
    <>
      <div className="bg-px-surface border-b-[3px] border-px-border px-8 py-4 sticky top-0 z-40">
        <h2 className="font-pixel text-[11px] text-px-white tracking-wider">// MANAJEMEN USER</h2>
      </div>
      <div className="p-8">
        <PixelCard>
          <div className="p-4 border-b-[3px] border-px-border">
            <span className="font-pixel text-[9px] text-px-accent">
              DAFTAR USER ({users.length})
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b-[3px] border-px-border">
                {["NAMA", "EMAIL", "TELEPON", "ROLE", "STATUS"].map((h) => (
                  <th key={h} className="font-pixel text-[7px] text-px-muted text-left p-4 tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-b border-px-border/50 hover:bg-px-primary/5">
                  <td className="p-4 font-body text-lg">{u.n}</td>
                  <td className="p-4 font-body text-lg text-px-muted">{u.e}</td>
                  <td className="p-4 font-body text-lg">{u.p}</td>
                  <td className="p-4">
                    <PixelBadge variant={u.r === "admin" ? "info" : "success"}>
                      {u.r.toUpperCase()}
                    </PixelBadge>
                  </td>
                  <td className="p-4">
                    <PixelBadge variant={u.a ? "success" : "failed"}>
                      {u.a ? "AKTIF" : "NONAKTIF"}
                    </PixelBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PixelCard>
      </div>
    </>
  );
}
EOF

cat > admin/src/App.tsx << 'EOF'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
function Guard({ children }: { children: React.ReactNode }) {
  return localStorage.getItem("px_admin_token") ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace />
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <Guard>
              <AdminLayout />
            </Guard>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route
            path="transactions"
            element={
              <div className="p-8">
                <span className="font-pixel text-px-accent">TRANSAKSI - Coming Soon</span>
              </div>
            }
          />
          <Route
            path="products"
            element={
              <div className="p-8">
                <span className="font-pixel text-px-accent">PRODUK - Coming Soon</span>
              </div>
            }
          />
          <Route
            path="digiflazz"
            element={
              <div className="p-8">
                <span className="font-pixel text-px-accent">DIGIFLAZZ - Coming Soon</span>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
EOF

# ============================================================
# WEB - Customer React + Vite + Tailwind
# ============================================================
mkdir -p web/src/{lib,hooks,components/{layout,ui,home,wallet,transaction},pages}

cat > web/package.json << 'EOF'
{
  "name": "@pixel-pay/web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 5173",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.0",
    "axios": "^1.7.0",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
EOF

cat > web/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
EOF

cat > web/vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://localhost:3001", changeOrigin: true } },
  },
});
EOF

cat > web/tailwind.config.ts << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        body: ['"VT323"', "monospace"],
      },
      colors: {
        px: {
          bg: "#0f0e17",
          surface: "#1a1a2e",
          card: "#222244",
          "card-hover": "#2a2a55",
          border: "#333366",
          primary: "#00ff88",
          secondary: "#ff2e63",
          accent: "#08d9d6",
          yellow: "#ffcc00",
          purple: "#a855f7",
          white: "#fffff0",
          text: "#cdcde0",
          muted: "#5a5a8a",
        },
      },
      animation: {
        float: "float 12s linear infinite",
        blink: "blink 1s step-end infinite",
        fadeUp: "fadeUp 0.6s ease forwards",
        marquee: "marquee 25s linear infinite",
      },
      keyframes: {
        float: {
          "0%": { transform: "translateY(100vh)", opacity: "0" },
          "10%": { opacity: ".3" },
          "90%": { opacity: ".3" },
          "100%": { transform: "translateY(-10vh)", opacity: "0" },
        },
        blink: { "50%": { opacity: "0" } },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
EOF

cat > web/postcss.config.js << 'EOF'
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
EOF

cat > web/index.html << 'EOF'
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap"
      rel="stylesheet"
    />
    <title>PIXEL PAY - Bayar Tagihan Ala Retro!</title>
  </head>
  <body class="bg-px-bg text-px-text">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

cat > web/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
  body { @apply font-body text-xl antialiased overflow-x-hidden; }
}
@layer utilities {
  .scanline {
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0, 0, 0, 0.06) 2px, rgba(0, 0, 0, 0.06) 4px
    );
    pointer-events: none;
    z-index: 9999;
  }
  .grid-bg {
    background-image: linear-gradient(rgba(0, 255, 136, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 136, 0.02) 1px, transparent 1px);
    background-size: 32px 32px;
  }
  .glow { text-shadow: 0 0 30px rgba(0, 255, 136, 0.4); }
  .glow-y { text-shadow: 0 0 20px rgba(255, 204, 0, 0.4); }
}
EOF

cat > web/src/main.tsx << 'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > web/src/lib/api.ts << 'EOF'
import axios from "axios";
const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("px_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
export default api;
EOF

cat > web/src/components/layout/Header.tsx << 'EOF'
import { Link, useLocation } from "react-router-dom";
const links = [
  { to: "/", l: "HOME" },
  { to: "/products", l: "PRODUK" },
  { to: "/transaction", l: "BELI" },
  { to: "/history", l: "RIWAYAT" },
];
export default function Header() {
  const loc = useLocation();
  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-px-bg/95 backdrop-blur-md border-b-[3px] border-px-border">
      <div className="max-w-6xl mx-auto px-6 h-[70px] flex items-center justify-between">
        <Link
          to="/"
          className="font-pixel text-base text-px-primary glow tracking-[3px]"
        >
          PIXEL<span className="text-px-secondary">PAY</span>
        </Link>
        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={`font-pixel text-[8px] tracking-wider relative after:absolute after:bottom-[-4px] after:left-0 after:h-[3px] after:bg-px-primary after:transition-all ${
                  loc.pathname === l.to
                    ? "text-px-primary glow after:w-full"
                    : "text-px-muted hover:text-px-primary hover:after:w-full after:w-0"
                }`}
              >
                {l.l}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-px-primary/10 border-[3px] border-px-primary px-4 py-2 cursor-pointer">
            <span className="text-xl">💰</span>
            <div>
              <div className="font-pixel text-[6px] text-px-primary">SALDO</div>
              <div className="font-pixel text-[9px] text-px-yellow glow-y">
                Rp 250.000
              </div>
            </div>
          </div>
          <Link
            to="/login"
            className="font-pixel text-[8px] border-[3px] border-px-accent text-px-accent px-5 py-2.5 hover:bg-px-accent hover:text-px-bg transition-all"
          >
            LOGIN
          </Link>
        </div>
      </div>
    </header>
  );
}
EOF

cat > web/src/components/layout/Footer.tsx << 'EOF'
export default function Footer() {
  const sections = [
    { t: "PRODUK", l: ["Pulsa & Data", "Token PLN", "PDAM", "BPJS", "Voucher Game"] },
    { t: "BANTUAN", l: ["FAQ", "Cara Top Up", "Hubungi Kami", "S&K"] },
    { t: "KONTAK", l: ["support@pixelpay.id", "+62 812-3456", "Instagram", "Telegram"] },
  ];
  return (
    <footer className="bg-px-surface border-t-[3px] border-px-border pt-12 pb-6">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="font-pixel text-base text-px-primary glow tracking-[3px] mb-4">
              PIXEL<span className="text-px-secondary">PAY</span>
            </div>
            <p className="font-body text-lg text-px-muted">
              Platform PPOB terlengkap bertema retro 8-bit.
            </p>
          </div>
          {sections.map((s) => (
            <div key={s.t}>
              <div className="font-pixel text-[8px] text-px-primary tracking-wider mb-5">
                {s.t}
              </div>
              <ul className="space-y-3">
                {s.l.map((x) => (
                  <li key={x}>
                    <a href="#" className="font-body text-lg text-px-muted hover:text-px-primary transition-colors">
                      {x}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t-[3px] border-px-border pt-6 flex flex-col sm:flex-row justify-between gap-4">
          <span className="font-pixel text-[6px] text-px-muted tracking-wider">
            2024 PIXEL PAY
          </span>
          <span className="font-pixel text-[6px] text-px-muted tracking-wider">
            POWERED BY DIGIFLAZZ
          </span>
        </div>
      </div>
    </footer>
  );
}
EOF

cat > web/src/components/layout/MainLayout.tsx << 'EOF'
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed inset-0 scanline pointer-events-none" />
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <Header />
      <main className="flex-1 pt-[70px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
EOF

cat > web/src/components/home/Hero.tsx << 'EOF'
import { Link } from "react-router-dom";
const colors = ["#00ff88", "#ff2e63", "#08d9d6", "#ffcc00"];
const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: (i * 5.1) % 100,
  size: 2 + (i % 3) * 2,
  color: colors[i % 4],
  duration: 8 + (i % 5) * 3,
  delay: (i % 7) * 1.4,
}));
export default function Hero() {
  return (
    <section className="relative py-40 text-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute animate-float opacity-0"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <div className="inline-block font-pixel text-[7px] text-px-accent border-[2px] border-px-accent px-5 py-2 mb-8 tracking-[3px] animate-fadeUp">
          // PPOB TERLENGKAP 2024
        </div>
        <h1
          className="font-pixel text-3xl md:text-5xl text-px-white leading-[1.4] mb-4 animate-fadeUp"
          style={{
            animationDelay: "100ms",
            opacity: 0,
            textShadow: "4px 4px 0 #00ff88, 8px 8px 0 rgba(0,255,136,0.15)",
          }}
        >
          BAYAR <span className="text-px-primary">TAGIHAN</span>
          <br />
          ALA <span className="text-px-secondary">RETRO!</span>
        </h1>
        <p
          className="font-body text-2xl md:text-3xl text-px-muted mb-12 animate-fadeUp"
          style={{ animationDelay: "200ms", opacity: 0 }}
        >
          Pulsa, Listrik, PDAM, BPJS, Game - semua dalam genggaman 8-bit
          <span className="inline-block w-3 h-8 bg-px-primary ml-1 align-middle animate-blink" />
        </p>
        <div
          className="flex gap-5 justify-center animate-fadeUp"
          style={{ animationDelay: "300ms", opacity: 0 }}
        >
          <Link
            to="/transaction"
            className="font-pixel text-[11px] px-10 py-4 bg-px-primary border-4 border-px-primary text-px-bg tracking-[0.2em] hover:shadow-[0_0_40px_rgba(0,255,136,0.4)] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            MULAI BAYAR
          </Link>
          <Link
            to="/products"
            className="font-pixel text-[11px] px-10 py-4 border-4 border-px-yellow text-px-yellow tracking-[0.2em] hover:bg-px-yellow hover:text-px-bg hover:shadow-[0_0_40px_rgba(255,204,0,0.3)] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            LIHAT KATEGORI
          </Link>
        </div>
      </div>
    </section>
  );
}
EOF

cat > web/src/pages/HomePage.tsx << 'EOF'
import Hero from "../components/home/Hero";
const cats = [
  { i: "📱", n: "PULSA & DATA", d: "Isi ulang pulsa semua operator" },
  { i: "⚡", n: "TOKEN PLN", d: "Token listrik prabayar" },
  { i: "💧", n: "PDAM AIR", d: "Bayar tagihan air" },
  { i: "🏥", n: "BPJS", d: "Iuran BPJS Kesehatan" },
  { i: "🎮", n: "VOUCHER GAME", d: "Diamond ML, UC PUBG" },
  { i: "📺", n: "TV KABEL", d: "Indihome, MNC Play" },
  { i: "💳", n: "E-MONEY", d: "GoPay, OVO, Dana" },
  { i: "🔥", n: "PGN GAS", d: "Tagihan gas PGN" },
];
const marquee =
  "TELKOMSEL 25K - Rp 27.000 | PLN TOKEN 100K - Rp 103.500 | ML DIAMOND - Rp 75.000 | BPJS - Rp 150.000 | ";
const steps = [
  { n: "01", t: "DAFTAR & TOP UP", d: "Buat akun dan isi saldo wallet kamu.", c: "text-px-primary" },
  { n: "02", t: "PILIH PRODUK", d: "Pilih kategori dan masukkan nomor tujuan.", c: "text-px-accent" },
  { n: "03", t: "SELESAI!", d: "Transaksi diproses otomatis. Instan!", c: "text-px-yellow" },
];
export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="bg-px-surface border-y-[3px] border-px-border py-3 overflow-hidden">
        <div className="flex gap-12 whitespace-nowrap animate-marquee" style={{ width: "max-content" }}>
          {[0, 1].map((i) => (
            <span key={i} className="font-pixel text-[8px] text-px-muted tracking-wider">
              {marquee}{marquee}
            </span>
          ))}
        </div>
      </div>
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">
              // PILIH QUEST
            </div>
            <h2 className="font-pixel text-xl text-px-white">KATEGORI PRODUK</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {cats.map((c) => (
              <div
                key={c.n}
                className="bg-px-card border-[3px] border-px-border p-8 text-center cursor-pointer hover:border-px-primary hover:-translate-y-1 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-px-primary scale-x-0 group-hover:scale-x-100 transition-transform" />
                <span className="text-4xl block mb-4">{c.i}</span>
                <div className="font-pixel text-[8px] text-px-white mb-2 tracking-wider">{c.n}</div>
                <div className="font-body text-lg text-px-muted">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-px-surface border-y-[3px] border-px-border py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[{ v: "50K+", l: "TRANSAKSI" }, { v: "12K", l: "PENGGUNA" }, { v: "500+", l: "PRODUK" }, { v: "99.8%", l: "SUCCESS RATE" }].map((s) => (
            <div key={s.l} className="text-center py-5">
              <div className="font-pixel text-2xl md:text-3xl text-px-primary glow mb-2">{s.v}</div>
              <div className="font-pixel text-[7px] text-px-muted tracking-wider">{s.l}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// TUTORIAL</div>
            <h2 className="font-pixel text-xl text-px-white">CARA BERMAIN</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="bg-px-card border-[3px] border-px-border p-8 text-center">
                <div className={`font-pixel text-4xl mb-5 ${s.c}`}>{s.n}</div>
                <div className="font-pixel text-[9px] text-px-white mb-3 tracking-wider">{s.t}</div>
                <div className="font-body text-xl text-px-muted">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
EOF

cat > web/src/pages/ProductsPage.tsx << 'EOF'
import { useState } from "react";
const tabs = ["SEMUA", "PULSA", "DATA", "PLN", "GAME", "E-MONEY"];
const prods = [
  { cat: "pulsa", pv: "TELKOMSEL", nm: "Pulsa 25.000", dc: "Pulsa reguler", pr: "Rp 27.000" },
  { cat: "pulsa", pv: "XL", nm: "Pulsa 50.000", dc: "Pulsa XL", pr: "Rp 52.500" },
  { cat: "data", pv: "INDOSAT", nm: "Data 15GB", dc: "Kuota 30 hari", pr: "Rp 65.000" },
  { cat: "pln", pv: "PLN", nm: "Token 100K", dc: "Listrik prabayar", pr: "Rp 103.500" },
  { cat: "game", pv: "MOONTON", nm: "ML 278 Diamond", dc: "Diamond ML", pr: "Rp 75.000" },
  { cat: "emoney", pv: "GOOGLE", nm: "Play 50K", dc: "Voucher GP", pr: "Rp 52.000" },
];
export default function ProductsPage() {
  const [tab, setTab] = useState("SEMUA");
  const f = tab === "SEMUA" ? prods : prods.filter((p) => p.cat === tab.toLowerCase());
  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// ITEM SHOP</div>
          <h2 className="font-pixel text-xl text-px-white">PRODUK TERLARIS</h2>
        </div>
        <div className="flex flex-wrap gap-1 mb-8">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-pixel text-[7px] px-6 py-3 border-[3px] tracking-wider transition-all ${
                tab === t
                  ? "bg-px-primary/10 border-px-primary text-px-primary"
                  : "bg-px-card border-px-border text-px-muted hover:border-px-primary hover:text-px-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {f.map((p, i) => (
            <div
              key={i}
              className="bg-px-card border-[3px] border-px-border p-6 hover:border-px-yellow hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="font-pixel text-[6px] text-px-accent tracking-widest mb-2">{p.pv}</div>
              <div className="font-pixel text-[9px] text-px-white mb-3">{p.nm}</div>
              <div className="font-body text-lg text-px-muted mb-4">{p.dc}</div>
              <div className="flex items-center justify-between">
                <div className="font-pixel text-sm text-px-yellow glow-y">{p.pr}</div>
                <button className="font-pixel text-[7px] border-[3px] border-px-primary text-px-primary px-5 py-2.5 hover:bg-px-primary hover:text-px-bg transition-all">
                  BELI
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
EOF

cat > web/src/App.tsx << 'EOF'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route
            path="/transaction"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <span className="font-pixel text-px-accent">TRANSACTION - Build Next</span>
              </div>
            }
          />
          <Route
            path="/history"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <span className="font-pixel text-px-accent">HISTORY - Build Next</span>
              </div>
            }
          />
          <Route
            path="/login"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <span className="font-pixel text-px-accent">LOGIN - Build Next</span>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
EOF

# ============================================================
# COUNT FILES & CREATE ZIP
# ============================================================
cd ..
TOTAL=$(find $P -type f | wc -l)
echo ""
echo "============================================"
echo "  PIXEL PAY - Project Generated!"
echo "============================================"
echo ""
echo "  Total files: $TOTAL"
echo "  Folders:"
echo "  ├── api/          (Rust + Axum backend)"
echo "  ├── database/     (Drizzle ORM schema)"
echo "  ├── admin/        (React admin panel)"
echo "  └── web/          (React customer web)"
echo ""
echo "  Quick Start:"
echo "  cd $P"
echo "  docker compose up -d postgres"
echo "  npm install"
echo "  npm run db:push && npm run db:seed"
echo "  npm run dev"
echo ""
echo "  Ports:"
echo "  API   -> http://localhost:3001"
echo "  Admin -> http://localhost:5174"
echo "  Web   -> http://localhost:5173"
echo ""
echo "  Creating archive..."

if command -v zip &> /dev/null; then
  zip -r pixel-pay.zip $P/
  echo "  Done: pixel-pay.zip"
elif command -v tar &> /dev/null; then
  tar -czf pixel-pay.tar.gz $P/
  echo "  Done: pixel-pay.tar.gz"
else
  echo "  zip/tar not found. Project in ./$P/"
fi

echo ""
echo "  Done!"
