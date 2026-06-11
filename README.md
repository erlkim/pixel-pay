# Pixel Pay

Pixel Pay adalah platform Top Up Game & PPOB (Payment Point Online Bank) dengan nuansa retro 8-bit.

## Tech Stack

| Layer | Framework | Deskripsi |
|---|---|---|
| Backend API | Rust + Axum | RESTful API & integrasi Digiflazz/Midtrans |
| Web Client | React + Vite | Frontend customer portal |
| Admin Panel | React + Vite | Panel admin dan manajemen |
| Database | PostgreSQL + SQLx | Database relasional & query builder |
| Monorepo | npm workspaces | Workspace management |

## Struktur Proyek

```
pixel-pay/
+-- README.md
+-- package.json
+-- package-lock.json
+-- turbo.json
+-- docker-compose.yml
+-- setup.sh
+-- start.sh
+-- stop.sh
+-- Cargo.toml
+-- Cargo.lock
+-- .env.example
+-- .gitignore
+-- database/
|   +-- package.json
|   +-- tsconfig.json
|   +-- drizzle.config.ts
|   +-- src/
|       +-- client.ts
|       +-- index.ts
|       +-- seed.ts
|       +-- schema/
|           +-- index.ts
|           +-- categories.ts
|           +-- products.ts
|           +-- transactions.ts
|           +-- users.ts
|           +-- wallets.ts
+-- apps/
|   +-- api/  Backend (Rust + Axum)
|   |   +-- Cargo.toml
|   |   +-- .env
|   |   +-- .env.example
|   |   +-- src/
|   |       +-- main.rs
|   |       +-- config.rs
|   |       +-- db.rs
|   |       +-- error.rs
|   |       +-- handlers/
|   |       |   +-- mod.rs
|   |       |   +-- admin.rs
|   |       |   +-- admin_detail.rs
|   |       |   +-- admin_export.rs
|   |       |   +-- auth.rs
|   |       |   +-- notification.rs
|   |       |   +-- payment.rs
|   |       |   +-- product.rs
|   |       |   +-- profile.rs
|   |       |   +-- transaction.rs
|   |       |   +-- voucher.rs
|   |       |   +-- wallet.rs
|   |       +-- middleware/
|   |       |   +-- mod.rs
|   |       |   +-- auth.rs
|   |       |   +-- security.rs
|   |       +-- models/
|   |       |   +-- mod.rs
|   |       |   +-- category.rs
|   |       |   +-- notification.rs
|   |       |   +-- product.rs
|   |       |   +-- transaction.rs
|   |       |   +-- user.rs
|   |       |   +-- wallet.rs
|   |       +-- routes/
|   |       |   +-- mod.rs
|   |       |   +-- api.rs
|   |       +-- services/
|   |           +-- mod.rs
|   |           +-- auth_service.rs
|   |           +-- digiflazz_service.rs
|   |           +-- midtrans.rs
|   |           +-- product_service.rs
|   |           +-- transaction_service.rs
|   |           +-- wallet_service.rs
|   +-- web/  Frontend User (React + Vite)
|   |   +-- package.json
|   |   +-- index.html
|   |   +-- vite.config.ts
|   |   +-- tsconfig.json
|   |   +-- tailwind.config.ts
|   |   +-- postcss.config.js
|   |   +-- public/
|   |   |   +-- favicon.svg
|   |   |   +-- icon-192.svg
|   |   |   +-- icon-512.svg
|   |   |   +-- manifest.json
|   |   |   +-- sw.js
|   |   +-- src/
|   |       +-- App.tsx
|   |       +-- main.tsx
|   |       +-- index.css
|   |       +-- components/
|   |       |   +-- home/
|   |       |   |   +-- Hero.tsx
|   |       |   +-- layout/
|   |       |       +-- Footer.tsx
|   |       |       +-- Header.tsx
|   |       |       +-- MainLayout.tsx
|   |       +-- lib/
|   |       |   +-- api.ts
|   |       +-- pages/
|   |           +-- CheckoutPage.tsx
|   |           +-- ContactPage.tsx
|   |           +-- FaqPage.tsx
|   |           +-- HistoryPage.tsx
|   |           +-- HomePage.tsx
|   |           +-- InvoicePage.tsx
|   |           +-- LoginPage.tsx
|   |           +-- NotificationsPage.tsx
|   |           +-- ProductsPage.tsx
|   |           +-- ProfilePage.tsx
|   |           +-- SearchPage.tsx
|   |           +-- TermsPage.tsx
|   |           +-- TopUpPage.tsx
|   |           +-- TopupGuidePage.tsx
|   |           +-- TransactionPage.tsx
|   |           +-- UserDashboard.tsx
|   |           +-- VoucherPage.tsx
|   |           +-- WalletPage.tsx
|   +-- admin/  Frontend Admin (React + Vite)
|       +-- package.json
|       +-- index.html
|       +-- vite.config.ts
|       +-- tsconfig.json
|       +-- tailwind.config.ts
|       +-- postcss.config.js
|       +-- src/
|           +-- App.tsx
|           +-- main.tsx
|           +-- index.css
|           +-- components/
|           |   +-- TransactionDetailModal.tsx
|           |   +-- UserDetailModal.tsx
|           |   +-- layout/
|           |   |   +-- AdminLayout.tsx
|           |   |   +-- Sidebar.tsx
|           |   |   +-- Topbar.tsx
|           |   +-- ui/
|           |       +-- PixelBadge.tsx
|           |       +-- PixelButton.tsx
|           |       +-- PixelCard.tsx
|           +-- lib/
|           |   +-- api.ts
|           +-- pages/
|               +-- BroadcastPage.tsx
|               +-- DashboardPage.tsx
|               +-- DigiflazzPage.tsx
|               +-- LoginPage.tsx
|               +-- LogsPage.tsx
|               +-- PaymentsPage.tsx
|               +-- PriceManagementPage.tsx
|               +-- ProductsPage.tsx
|               +-- ReportsPage.tsx
|               +-- SettingsPage.tsx
|               +-- TransactionsPage.tsx
|               +-- UsersPage.tsx
|               +-- VoucherManagementPage.tsx
```

## Fitur Utama

### Untuk Pengguna

- Produk Digital: Pulsa, data internet, token PLN, voucher game, e-money, TV kabel
- Payment Gateway: 13 metode bayar via Midtrans
- Top Up Saldo
- Voucher & Promo
- Notifikasi real-time
- Pencarian produk
- Profil & ubah password
- PWA

### Untuk Admin

- Dashboard & laporan keuangan
- Manajemen user, transaksi, harga, voucher
- Export CSV, broadcast, log aktivitas
- Sync produk dari Digiflazz

### Keamanan

- Rate Limiting: 100 req/menit global, 10 req/menit auth
- Login Lockout: 5x gagal terkunci 15 menit
- CORS Whitelist
- Security Headers
- Webhook Signature SHA-512
- JWT + bcrypt + role-based access
- Auto-Refund

## Instalasi

### Termux (Android)

```bash
pkg update && pkg upgrade -y
pkg install -y postgresql rust nodejs-lts git pkg-config openssl
git clone https://github.com/erlkim/pixel-pay.git
cd pixel-pay
initdb $PREFIX/share/postgresql
pg_ctl -D $PREFIX/share/postgresql start
sleep 2
createuser -s root
createdb pixel_pay
psql -d pixel_pay -f database/schema.sql
cp apps/api/.env.example apps/api/.env
nano apps/api/.env
npm install
cd apps/api && cargo build --release && cd ../..
./start.sh
```

### Linux / macOS

```bash
git clone https://github.com/erlkim/pixel-pay.git
cd pixel-pay
createdb pixel_pay
psql -d pixel_pay -f database/schema.sql
cp apps/api/.env.example apps/api/.env
nano apps/api/.env
npm install
cd apps/api && cargo build --release && cd ../..
./start.sh
```

## Environment Variables

| Variable | Keterangan |
|---|---|
| DATABASE_URL | Koneksi PostgreSQL |
| JWT_SECRET | Secret key untuk JWT |
| DIGIFLAZZ_USERNAME | Username dari https://digiflazz.com |
| DIGIFLAZZ_API_KEY | API key dari Digiflazz |
| MIDTRANS_SERVER_KEY | Server key dari https://midtrans.com |
| MIDTRANS_CLIENT_KEY | Client key dari Midtrans |

API key yang diawali dev- otomatis pakai mode testing.

## Shortcut

| Perintah | Fungsi |
|---|---|
| ./start.sh | Start semua layanan |
| ./stop.sh | Stop semua layanan |

## Akses

| Layanan | URL |
|---|---|
| User | http://localhost:5173 |
| Admin | http://localhost:5174 |
| API | http://localhost:3001 |

## Default Account

| Role | Email | Password |
|---|---|---|
| Admin | admin2@pixelpay.id | admin123 |
| User | baru@test.com | 123456 |

## Test Case (Digiflazz dev mode)

| No HP | Hasil |
|---|---|
| 087800001230 | Sukses |
| 087800001231 | Pending |
| 087800001232 | Gagal |

## Lisensi

MIT

---

Built with MiMo-V2.5-Pro
