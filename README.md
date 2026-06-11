# Pixel Pay

Pixel Pay adalah platform Top Up Game & PPOB (Payment Point Online Bank) dengan nuansa retro 8-bit. Dibangun dengan arsitektur monorepo, menggabungkan Rust (Axum) untuk backend berperforma tinggi dan React untuk frontend yang responsif.

## Tech Stack

| Layer | Framework | Deskripsi |
|-------|-----------|-----------|
| Backend API | Rust + Axum | Backend utama untuk RESTful API & integrasi Digiflazz/Midtrans |
| Web Client | React + Vite | Frontend untuk pengguna akhir (customer portal) |
| Admin Panel | React + Vite | Panel admin dan manajemen platform |
| Database | PostgreSQL + SQLx | Database relasional & query builder |
| Monorepo | npm workspaces + Turborepo | Pengelola workspace untuk efisiensi build |

## Struktur Proyek

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
