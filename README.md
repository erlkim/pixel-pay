# Pixel Pay

Pixel Pay adalah platform Top Up Game & PPOB (Payment Point Online Bank) dengan nuansa retro 8-bit. Dibangun dengan arsitektur monorepo, menggabungkan Rust (Axum) untuk backend berperforma tinggi dan React untuk frontend yang responsif.

## Tech Stack

| Layer | Framework | Deskripsi |
|-------|-----------|-----------|
| Backend API | Rust + Axum | Backend utama untuk RESTful API & integrasi Digiflazz/Midtrans |
| Web Client | React + Vite | Frontend untuk pengguna akhir (customer portal) |
| Admin Panel | React + Vite | Panel admin dan manajemen platform |
| Database | PostgreSQL + Drizzle ORM | Database relasional & schema management |
| Monorepo | Turborepo + npm workspaces | Pengelola workspace untuk efisiensi build |

## Struktur Proyek

    pixel-pay
    |-- README.md
    |-- package.json
    |-- turbo.json
    |-- setup.sh
    |-- start.sh
    |-- stop.sh
    |-- docker-compose.yml
    |-- .env.example
    |-- .gitignore
    |-- apps/
    |   |-- api/                  Backend (Rust + Axum)
    |   |   |-- Cargo.toml
    |   |   |-- .env.example
    |   |   |-- migrations/
    |   |   +-- src/
    |   |       |-- main.rs
    |   |       |-- config.rs
    |   |       |-- db.rs
    |   |       |-- error.rs
    |   |       |-- handlers/
    |   |       |-- middleware/
    |   |       |-- models/
    |   |       |-- routes/
    |   |       +-- services/
    |   |-- web/                  Frontend user (React + Vite)
    |   |   |-- package.json
    |   |   |-- vite.config.ts
    |   |   +-- src/
    |   |       |-- pages/
    |   |       |-- components/
    |   |       |-- hooks/
    |   |       +-- lib/
    |   +-- admin/                Frontend admin (React + Vite)
    |       |-- package.json
    |       |-- vite.config.ts
    |       +-- src/
    |           |-- pages/
    |           |-- components/
    |           |-- hooks/
    |           +-- lib/
    +-- database/                 Schema & seed (Drizzle ORM)
        |-- package.json
        |-- drizzle.config.ts
        +-- src/
            |-- schema/
            +-- seed.ts

## Fitur Utama

### Untuk Pengguna

- **Produk Digital** — Pulsa, data internet, token PLN, voucher game, e-money, TV kabel
- **Payment Gateway** — 13 metode bayar via Midtrans (VA, e-wallet, QRIS, kartu kredit, minimarket)
- **Top Up Saldo** — Isi saldo untuk transaksi lebih cepat
- **Voucher & Promo** — Gunakan voucher untuk diskon
- **Notifikasi** — Status transaksi real-time
- **Pencarian** — Cari produk dari seluruh kategori
- **Profil** — Edit profil, ubah password
- **PWA** — Install sebagai app di HP

### Untuk Admin

- **Dashboard** — Ringkasan transaksi, revenue, user aktif
- **Manajemen User** — Lihat, blokir, reset password, edit saldo
- **Manajemen Transaksi** — Filter, detail, retry, refund
- **Manajemen Harga** — Edit markup per produk, bulk markup
- **Manajemen Voucher** — Buat, edit, nonaktifkan voucher
- **Laporan Keuangan** — Grafik revenue, export CSV
- **Broadcast** — Kirim notifikasi ke semua user
- **Log Aktivitas** — Riwayat semua aksi admin
- **Pengaturan** — Konfigurasi sistem
- **Sync Produk** — Sinkronisasi dari Digiflazz

### Keamanan

- **Race Condition** — Advisory lock + idempotency check
- **SQL Injection** — Parameterized queries (SQLx)
- **XSS** — Input sanitization
- **Authentication** — JWT token + expiry
- **Authorization** — Role-based access (user / admin / superadmin)
- **Password** — bcrypt hashing
- **Auto-Refund** — Saldo dikembalikan jika transaksi gagal

## Instalasi

### Termux (Android)

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
    cd apps/web && npm run build && cd ../..
    cd apps/admin && npm run build && cd ../..
    ./start.sh

### Linux / macOS

    git clone https://github.com/erlkim/pixel-pay.git
    cd pixel-pay
    createdb pixel_pay
    psql -d pixel_pay -f database/schema.sql
    cp apps/api/.env.example apps/api/.env
    nano apps/api/.env
    npm install
    cd apps/api && cargo build --release && cd ../..
    cd apps/web && npm run build && cd ../..
    cd apps/admin && npm run build && cd ../..
    ./start.sh

### Docker

    git clone https://github.com/erlkim/pixel-pay.git
    cd pixel-pay
    cp apps/api/.env.example apps/api/.env
    nano apps/api/.env
    docker-compose up -d

## Environment Variables

Salin apps/api/.env.example ke apps/api/.env lalu isi:

| Variable | Keterangan |
|----------|-----------|
| DATABASE_URL | Koneksi PostgreSQL |
| JWT_SECRET | Secret key untuk JWT |
| DIGIFLAZZ_USERNAME | Username dari https://digiflazz.com |
| DIGIFLAZZ_API_KEY | API key dari Digiflazz |
| MIDTRANS_SERVER_KEY | Server key dari https://midtrans.com |
| MIDTRANS_CLIENT_KEY | Client key dari Midtrans |

API key yang diawali dev- otomatis pakai mode testing.

## Akses

| Layanan | URL |
|---------|-----|
| User | http://localhost:5173 |
| Admin | http://localhost:5174 |
| API | http://localhost:3001 |

## Shortcut

    ./start.sh    start semua layanan
    ./stop.sh     stop semua layanan

## Default Account

| Role | Email | Password |
|------|-------|----------|
| Admin | admin2@pixelpay.id | admin123 |
| User | baru@test.com | 123456 |

## Test Case (Digiflazz dev mode)

| No HP | Hasil |
|-------|-------|
| 087800001230 | Sukses |
| 087800001231 | Pending |
| 087800001232 | Gagal |

## Lisensi

MIT

---

Built with MiMo-V2.5-Pro
