#!/bin/bash
# Start Kanban_Bot server
cd "$(dirname "$0")"
nohup node server.js > /tmp/kanban-bot.log 2>&1 &
echo "🤖 Kanban_Bot started on http://localhost:8888"
echo "   Logs: /tmp/kanban-bot.log"
