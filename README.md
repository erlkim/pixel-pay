# Pixel Pay

Platform PPOB 8-bit. Pulsa, token PLN, voucher game, e-wallet, TV kabel.

## Tech Stack

- Backend: Rust (Axum) + PostgreSQL
- Frontend: React + TypeScript + TailwindCSS
- Payment: Midtrans (VA, e-wallet, QRIS, kartu kredit)
- Produk: Digiflazz

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

- DATABASE_URL: koneksi PostgreSQL
- DIGIFLAZZ_USERNAME / DIGIFLAZZ_API_KEY: dari https://digiflazz.com
- MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY: dari https://midtrans.com

API key Digiflazz yang diawali dev- otomatis pakai mode testing.

## Akses

- User: http://localhost:5173
- Admin: http://localhost:5174
- API: http://localhost:3001

## Shortcut

    ./start.sh    start semua
    ./stop.sh     stop semua

## Default Account

- Admin: admin2@pixelpay.id / admin123
- User: baru@test.com / 123456

## Test Case (Digiflazz dev mode)

- 087800001230 -> Sukses
- 087800001231 -> Pending
- 087800001232 -> Gagal

## Lisensi

MIT
