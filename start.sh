#!/bin/bash

echo "================================"
echo "  PIXEL PAY - Starting..."
echo "================================"

# 1. Start PostgreSQL
echo "[1/4] Starting PostgreSQL..."
pg_isready > /dev/null 2>&1
if [ $? -ne 0 ]; then
    pg_ctl -D $PREFIX/var/lib/postgresql/data -l $PREFIX/var/lib/postgresql/logfile start
    sleep 2
fi
echo "      PostgreSQL: OK"

# 2. Start API (background)
echo "[2/4] Starting API on port 3001..."
cd ~/pixel-pay/api
cargo run --release > ~/pixel-pay/api.log 2>&1 &
API_PID=$!
sleep 5
echo "      API PID: $API_PID"

# 3. Start Web (background)
echo "[3/4] Starting Web on port 5173..."
cd ~/pixel-pay/web
npm run dev > ~/pixel-pay/web.log 2>&1 &
WEB_PID=$!
sleep 2
echo "      Web PID: $WEB_PID"

# 4. Start Admin (background)
echo "[4/4] Starting Admin on port 5174..."
cd ~/pixel-pay/admin
npm run dev > ~/pixel-pay/admin.log 2>&1 &
ADMIN_PID=$!
sleep 2
echo "      Admin PID: $ADMIN_PID"

echo ""
echo "================================"
echo "  PIXEL PAY Running!"
echo "================================"
echo "  API   -> http://localhost:3001"
echo "  Web   -> http://localhost:5173"
echo "  Admin -> http://localhost:5174"
echo "================================"
echo ""
echo "  Logs:"
echo "  tail -f ~/pixel-pay/api.log"
echo "  tail -f ~/pixel-pay/web.log"
echo "  tail -f ~/pixel-pay/admin.log"
echo ""
echo "  Stop: kill $API_PID $WEB_PID $ADMIN_PID"
echo "================================"

# Simpan PID ke file supaya gampang stop
echo "$API_PID $WEB_PID $ADMIN_PID" > ~/pixel-pay/.pids

# Tunggu (biar script tidak keluar)
wait
