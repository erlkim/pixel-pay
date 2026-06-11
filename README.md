# Pixel Pay

Platform PPOB 8-bit. Pulsa, token PLN, voucher game, e-wallet, TV kabel.

## Fitur

- Beli produk digital (pulsa, data, PLN, game, e-money, TV kabel)
- Top up saldo via payment gateway (Midtrans)
- 13 metode bayar (VA, e-wallet, QRIS, kartu kredit, minimarket)
- Voucher dan promo
- Notifikasi real-time
- Pencarian produk
- Profil dan ubah password
- Admin panel lengkap (dashboard, user, transaksi, harga, laporan, broadcast, log)
- Auto-refund jika transaksi gagal
- PWA

## Tech Stack

- Rust + Axum + SQLx (backend)
- React + TypeScript + Vite + TailwindCSS (frontend)
- PostgreSQL (database)
- Digiflazz (produk digital)
- Midtrans (payment gateway)

## Struktur

    pixel-pay/
    +-- api/          Rust backend
    +-- web/          React user frontend
    +-- admin/        React admin frontend
    +-- database/     SQL schema
    +-- start.sh
    +-- stop.sh

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

## Environment

isi api/.env dari api/.env.example:

- DATABASE_URL
- DIGIFLAZZ_USERNAME / DIGIFLAZZ_API_KEY (https://digiflazz.com)
- MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY (https://midtrans.com)

key dev- otomatis mode testing.

## Akses

- User: http://localhost:5173
- Admin: http://localhost:5174
- API: http://localhost:3001

    ./start.sh    start
    ./stop.sh     stop

## Default Account

- Admin: admin2@pixelpay.id / admin123
- User: baru@test.com / 123456

## Lisensi

MIT
