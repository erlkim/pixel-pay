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

- **Backend:** Rust, Axum, SQLx, Tokio
- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **Database:** PostgreSQL
- **Produk:** Digiflazz
- **Payment:** Midtrans

## Struktur

    pixel-pay/
    +-- api/            Backend (Rust + Axum)
    +-- web/            Frontend user (React)
    +-- admin/          Frontend admin (React)
    +-- database/       SQL schema
    +-- start.sh
    +-- stop.sh
    +-- docker-compose.yml

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

- DATABASE_URL - koneksi PostgreSQL
- DIGIFLAZZ_USERNAME / DIGIFLAZZ_API_KEY - dari https://digiflazz.com
- MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY - dari https://midtrans.com

API key yang diawali dev- otomatis pakai mode testing.

## Akses

- User: http://localhost:5173
- Admin: http://localhost:5174
- API: http://localhost:3001

## Shortcut

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
