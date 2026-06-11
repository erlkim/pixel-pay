#!/bin/bash
echo "Stopping PIXEL PAY..."
if [ -f ~/pixel-pay/.pids ]; then
    kill $(cat ~/pixel-pay/.pids) 2>/dev/null
    rm ~/pixel-pay/.pids
    echo "All services stopped."
else
    echo "No PID file found. Kill manually:"
    echo "  pkill -f pixel-pay-api"
    echo "  pkill -f 'npm run dev'"
fi
