#!/bin/bash
# Start Jarvis Kanban server
cd "$(dirname "$0")"
nohup node server.js > /tmp/jarvis-kanban.log 2>&1 &
echo "🤖 Jarvis Kanban started on http://localhost:8888"
echo "   Logs: /tmp/jarvis-kanban.log"
