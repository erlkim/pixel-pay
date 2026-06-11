# 🕹️ PIXEL PAY

Platform PPOB 8-Bit — Isi Pulsa, Token PLN, Voucher Game, E-Wallet. Bayar tagihan ala retro. Modern di dalam, pixel di luar.


## Fitur

- 222+ Produk Digital (Pulsa, Data, Token PLN, Voucher Game, E-Wallet, TV Kabel)
- 13 Metode Pembayaran (VA BCA/BNI/BRI/Mandiri/Permata, GoPay, ShopeePay, DANA, QRIS, Indomaret, Alfamart, Kartu Kredit)
- Profil & Notifikasi (Edit profil, ubah password, notifikasi real-time, voucher & promo)
- Pencarian Global (Cari produk dari mana saja)
- Admin Panel (Dashboard, manajemen user/transaksi/harga/voucher, laporan keuangan, broadcast, log aktivitas)
- Keamanan (Race condition protection advisory lock, XSS sanitize, JWT auth, role-based access)
- PWA (Install sebagai app di HP)
- Auto-Refund (Saldo otomatis dikembalikan jika transaksi gagal)

## Arsitektur

User Web App (React) + Admin Panel (React) -> Rust Axum API -> Digiflazz (Produk) + Midtrans (Payment) + PostgreSQL

## Instalasi di Termux (Android)

    pkg update && pkg upgrade -y
    pkg install -y postgresql rust nodejs-lts git pkg-config openssl
    git clone https://github.com/erlkim/pixel-pay.git
    cd pixel-pay
    initdb /data/data/com.termux/files/usr/share/postgresql
    pg_ctl -D /data/data/com.termux/files/usr/share/postgresql start
    sleep 2
    createuser -s root
    createdb pixel_pay
    psql -d pixel_pay -f database/schema.sql
    cp api/.env.example api/.env
    nano api/.env
    cd web && npm install && cd ..
    cd admin && npm install && cd ..
    cd api && cargo build --release && cd ..
    chmod +x start.sh stop.sh
    ./start.sh

User: http://localhost:5173 | Admin: http://localhost:5174 | API: http://localhost:3001

## Instalasi Universal (Linux / macOS / WSL)

    curl --proto ==https --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source /data/data/com.termux/files/home/.cargo/env
    git clone https://github.com/erlkim/pixel-pay.git
    cd pixel-pay
    sudo -u postgres createdb pixel_pay
    sudo -u postgres psql -d pixel_pay -f database/schema.sql
    cp api/.env.example api/.env
    nano api/.env
    cd web && npm install && npm run build && cd ..
    cd admin && npm install && npm run build && cd ..
    cd api && cargo build --release && cd ..
    chmod +x start.sh stop.sh
    ./start.sh

## Instalasi dengan Docker

    git clone https://github.com/erlkim/pixel-pay.git
    cd pixel-pay
    cp api/.env.example api/.env
    nano api/.env
    docker-compose up -d

## Konfigurasi Environment (api/.env)

    DATABASE_URL=postgresql://user:password@localhost:5432/pixel_pay
    JWT_SECRET=change-this-to-random-secret-key
    JWT_EXPIRATION_HOURS=24
    DIGIFLAZZ_USERNAME=your-username
    DIGIFLAZZ_API_KEY=dev-your-api-key
    DIGIFLAZZ_BASE_URL=https://api.digiflazz.com/v1
    MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxx
    MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxx
    MIDTRANS_MERCHANT_ID=Gxxxxxxxx
    MIDTRANS_IS_PRODUCTION=false
    HOST=0.0.0.0
    PORT=3001
    RUST_LOG=pixel_pay_api=debug,tower_http=debug
    DB_MAX_CONNECTIONS=20
    DB_MIN_CONNECTIONS=5

### Mendapatkan API Key

Digiflazz (Produk Digital):
1. Daftar di https://digiflazz.com
2. Login -> Dashboard -> Salin Username dan API Key
3. Mode dev- = test case (tidak bayar sungguhan)
4. Mode production = transaksi sungguhan

Midtrans (Payment Gateway):
1. Daftar di https://midtrans.com
2. Login -> Dashboard Sandbox -> Settings -> Access Keys
3. Salin Server Key dan Client Key
4. Setting webhook: https://domain-kamu.com/api/webhook/midtrans-notification

## Test Case Digiflazz

| No HP | Status |
|-------|--------|
| 087800001230 | Sukses (SN: 1234567890) |
| 087800001231 | Pending |
| 087800001232 | Gagal |

Otomatis ditambahkan testing:true saat API key diawali dev-

## Struktur Project

    pixel-pay/
    +-- api/                        Backend (Rust + Axum)
    |   +-- src/handlers/           Auth, Wallet, Product, Transaction, Payment, Admin
    |   +-- src/middleware/         JWT auth & admin guard
    |   +-- src/models/            Data models
    |   +-- src/services/          Digiflazz, Midtrans, Transaction, Wallet
    |   +-- Cargo.toml
    +-- web/                        Frontend User (React) - 19 halaman
    +-- admin/                      Frontend Admin (React) - 12 halaman
    +-- database/                   Schema SQL
    +-- start.sh                    Start semua layanan
    +-- stop.sh                     Stop semua layanan
    +-- docker-compose.yml          Docker setup

## API Endpoint (30+)

### Public
POST /api/auth/register - Register
POST /api/auth/login - Login
GET /api/products/categories - List kategori
GET /api/products/category/:slug - Produk per kategori
GET /api/products/search?q= - Cari produk

### User (Auth)
GET /api/wallet/balance - Cek saldo
POST /api/wallet/topup - Top up manual
POST /api/transactions/create - Beli produk
POST /api/transactions/detail - Detail transaksi
GET /api/profile/get - Profil
GET /api/notifications/list - Notifikasi
GET /api/vouchers/available - Voucher
GET /api/payment/methods - 13 metode bayar
POST /api/payment/create - Buat pembayaran
GET /api/payment/status - Cek status bayar

### Admin
GET /api/admin/dashboard - Stats
GET /api/admin/users - List user
GET /api/admin/user/:id - Detail user
POST /api/admin/user/:id/block - Blokir user
POST /api/admin/transactions/filtered - Filter transaksi
POST /api/admin/transaction/:id/retry - Retry transaksi
POST /api/admin/transaction/:id/refund - Refund
PUT /api/admin/product/:id/markup - Edit markup
GET /api/admin/revenue-stats - Grafik revenue
GET /api/admin/export-csv - Export CSV
POST /api/admin/broadcast - Broadcast notifikasi
GET /api/admin/logs - Log aktivitas
GET /api/admin/settings - Pengaturan

## Tech Stack

- Backend: Rust, Axum, SQLx, Tokio, Serde, JWT, bcrypt, reqwest
- Frontend: React 18, TypeScript, Vite, TailwindCSS, React Router, Axios
- Database: PostgreSQL
- Integration: Digiflazz (produk), Midtrans (payment)

## Keamanan

| Fitur | Implementasi |
|-------|-------------|
| Race Condition | pg_advisory_xact_lock + idempotency check 30 detik |
| SQL Injection | SQLx parameterized queries |
| XSS | Input sanitization |
| Auth | JWT token + expiry |
| Authorization | Role-based (user / admin / superadmin) |
| Password | bcrypt (cost 12) |
| Secrets | .env file (tidak masuk git) |

## Shortcut

    ./start.sh    Start semua layanan
    ./stop.sh     Stop semua layanan

## Akun Default

| Role | Email | Password |
|------|-------|----------|
| Admin | admin2@pixelpay.id | admin123 |
| User | baru@test.com | 123456 |

## Lisensi

MIT License

---

Dibuat dengan MiMo v2.5 Pro - Xiaomi LLM Core Team
