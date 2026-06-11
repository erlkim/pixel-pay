# Pixel Pay

Platform PPOB 8-bit. Pulsa, token PLN, voucher game, e-wallet, TV kabel.

## Fitur

- Produk digital dari Digiflazz (pulsa, data, PLN, game, e-money, TV kabel)
- Top up saldo via Midtrans (VA, e-wallet, QRIS, kartu kredit, minimarket)
- Voucher dan promo
- Notifikasi real-time
- Pencarian produk global
- Profil dan ubah password
- PWA (install sebagai app)
- Auto-refund jika transaksi gagal
- Admin panel (dashboard, user, transaksi, harga, voucher, laporan, broadcast, log aktivitas)
- Keamanan: race condition protection, XSS sanitize, JWT auth, role-based access

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Rust + Axum + SQLx + Tokio |
| Frontend | React + TypeScript + Vite + TailwindCSS |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Produk | Digiflazz |
| Payment | Midtrans |

## Struktur

    pixel-pay/
    +-- api/                        Backend (Rust + Axum)
    |   +-- src/handlers/           Auth, wallet, produk, transaksi, payment, admin
    |   +-- src/middleware/         JWT auth & admin guard
    |   +-- src/models/            Data models
    |   +-- src/services/          Digiflazz, Midtrans, transaksi, wallet
    |   +-- src/routes/            API routing
    |   +-- migrations/            Database migrations
    |   +-- .env                   Environment variables
    |   +-- Cargo.toml
    +-- web/                        Frontend user (React + TailwindCSS)
    |   +-- src/pages/             Halaman user
    |   +-- src/components/        Komponen UI
    |   +-- src/hooks/             Custom hooks
    |   +-- src/lib/               API client
    |   +-- public/                PWA assets (manifest, icons, service worker)
    +-- admin/                      Frontend admin (React + TailwindCSS)
    |   +-- src/pages/             Halaman admin
    |   +-- src/components/        Komponen UI admin
    |   +-- src/hooks/             Custom hooks
    |   +-- src/lib/               API client
    +-- database/                   Schema & seed (Drizzle ORM)
    |   +-- src/schema/            Database schema
    |   +-- src/seed.ts            Seed data
    +-- start.sh                    Start semua layanan
    +-- stop.sh                     Stop semua layanan
    +-- setup.sh                    Setup awal
    +-- docker-compose.yml          Docker setup
    +-- package.json                Monorepo config (Turborepo)
    +-- .env.example                Template environment

## Install (Termux)

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
    cp api/.env.example api/.env
    nano api/.env
    cd web && npm install && cd ..
    cd admin && npm install && cd ..
    cd api && cargo build --release && cd ..
    ./start.sh

## Install (Linux / macOS)

    git clone https://github.com/erlkim/pixel-pay.git
    cd pixel-pay
    createdb pixel_pay
    psql -d pixel_pay -f database/schema.sql
    cp api/.env.example api/.env
    nano api/.env
    cd web && npm install && cd ..
    cd admin && npm install && cd ..
    cd api && cargo build --release && cd ..
    ./start.sh

## Install (Docker)

    git clone https://github.com/erlkim/pixel-pay.git
    cd pixel-pay
    cp api/.env.example api/.env
    nano api/.env
    docker-compose up -d

## Environment

Salin api/.env.example ke api/.env lalu isi:

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

    ./start.sh    start semua
    ./stop.sh     stop semua

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
