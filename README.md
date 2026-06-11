# Pixel Pay

Pixel Pay adalah platform Top Up Game & PPOB (Payment Point Online Bank) dengan nuansa retro 8-bit. Dibangun dengan arsitektur monorepo, menggabungkan Rust (Axum) untuk backend berperforma tinggi dan React untuk frontend yang responsif.

## Tech Stack

| Layer | Framework | Deskripsi |
|-------|-----------|-----------|
| Backend API | Rust + Axum | Backend utama untuk RESTful API & integrasi Digiflazz/Midtrans |
| Web Client | React + Vite | Frontend untuk pengguna akhir (customer portal) |
| Admin Panel | React + Vite | Panel admin dan manajemen platform |
| Database | PostgreSQL + SQLx | Database relasional & query builder |
| Monorepo | npm workspaces | Pengelola workspace untuk efisiensi build |

## Struktur Proyek

```
pixel-pay/
+-- README.md
+-- package.json
+-- start.sh
+-- stop.sh
+-- apps/
|   +-- api/                  Backend (Rust + Axum)
|   |   +-- Cargo.toml
|   |   +-- .env
|   |   +-- src/
|   |       +-- main.rs
|   |       +-- config.rs
|   |       +-- db.rs
|   |       +-- error.rs
|   |       +-- handlers/
|   |       +-- middleware/
|   |       +-- models/
|   |       +-- routes/
|   |       +-- services/
|   +-- web/                  Frontend user (React + Vite)
|   |   +-- package.json
|   |   +-- src/
|   |       +-- pages/
|   |       +-- components/
|   |       +-- hooks/
|   |       +-- lib/
|   +-- admin/                Frontend admin (React + Vite)
|       +-- package.json
|       +-- src/
|           +-- pages/
|           +-- components/
|           +-- hooks/
|           +-- lib/
```

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
- **Manajemen Voucher** — Buat, edit, nonaktifkan, hapus voucher
- **Laporan Keuangan** — Grafik revenue, export CSV
- **Broadcast** — Kirim notifikasi ke semua user
- **Log Aktivitas** — Riwayat semua aksi admin
- **Pengaturan** — Konfigurasi sistem
- **Sync Produk** — Sinkronisasi dari Digiflazz

### Keamanan

- **Rate Limiting** — 100 req/menit per IP (global), 10 req/menit (auth)
- **Login Lockout** — 5x gagal login → akun terkunci 15 menit
- **CORS Whitelist** — Hanya origin terdaftar yang diizinkan
- **Security Headers** — X-Content-Type, X-Frame-Options, XSS-Protection, Referrer-Policy, Permissions-Policy, Cache-Control
- **Webhook Signature** — SHA-512 verification untuk Midtrans
- **Race Condition** — Advisory lock + idempotency check
- **SQL Injection** — Parameterized queries (SQLx)
- **XSS** — Input sanitization
- **Authentication** — JWT token + 24h expiry
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
./start.sh

## Environment Variables

| Variable | Keterangan |
|----------|------------|
| DATABASE_URL | Koneksi PostgreSQL |
| JWT_SECRET | Secret key untuk JWT |
| DIGIFLAZZ_USERNAME | Username dari https://digiflazz.com |
| DIGIFLAZZ_API_KEY | API key dari Digiflazz |
| MIDTRANS_SERVER_KEY | Server key dari https://midtrans.com |
| MIDTRANS_CLIENT_KEY | Client key dari Midtrans |

API key yang diawali dev- otomatis pakai mode testing.

## Shortcut

| Perintah | Fungsi |
|----------|--------|
| ./start.sh | Start semua layanan |
| ./stop.sh | Stop semua layanan |

## Akses

| Layanan | URL |
|---------|-----|
| User | http://localhost:5173 |
| Admin | http://localhost:5174 |
| API | http://localhost:3001 |

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
