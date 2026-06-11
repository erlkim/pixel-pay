#!/bin/bash
echo "Stopping PIXEL PAY..."

# Kill by PID file
if [ -f ~/pixel-pay/.pids ]; then
    kill $(cat ~/pixel-pay/.pids) 2>/dev/null
    rm ~/pixel-pay/.pids
fi

# Kill by process name (fallback)
pkill -f "pixel-pay-api" 2>/dev/null
pkill -f "vite.*apps/web" 2>/dev/null
pkill -f "vite.*apps/admin" 2>/dev/null

sleep 2

# Force kill if still running
pkill -9 -f "pixel-pay-api" 2>/dev/null
pkill -9 -f "vite.*apps/web" 2>/dev/null
pkill -9 -f "vite.*apps/admin" 2>/dev/null

echo "All services stopped."
