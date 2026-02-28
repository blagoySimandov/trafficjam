#!/bin/bash
# start-all.sh - Starts the full TrafficJam integration stack in a tmux session.
# Usage: bash start-all.sh  (from anywhere in WSL)

ROOT="/mnt/c/Users/clanc/Desktop/trafficjam"
SESSION="trafficjam"

# ── 1. Docker infra ──────────────────────────────────────────────────────────
echo "🐘 Starting PostgreSQL..."
cd "$ROOT"
make stop 2>/dev/null; make build && make run

echo "📨 Starting NATS JetStream..."
make nats-stop 2>/dev/null; make nats-build && make nats-run

echo "✅ Docker containers up."

# ── 2. tmux session ──────────────────────────────────────────────────────────
tmux kill-session -t "$SESSION" 2>/dev/null

tmux new-session  -d -s "$SESSION" -n "backend"
tmux send-keys    -t "$SESSION:backend" "cd $ROOT/trafficjam-be && fastapi dev --port 8001" Enter

tmux new-window   -t "$SESSION" -n "map-data"
tmux send-keys    -t "$SESSION:map-data" "cd $ROOT/map-data-service && fastapi dev" Enter

tmux new-window   -t "$SESSION" -n "frontend"
tmux send-keys    -t "$SESSION:frontend" "cd $ROOT/trafficjam-fe && bun run dev" Enter

tmux new-window   -t "$SESSION" -n "simengine"
tmux send-keys    -t "$SESSION:simengine" "cd $ROOT/simengine && mvn spring-boot:run" Enter

# ── 3. Attach ────────────────────────────────────────────────────────────────
echo ""
echo "🚀 Attaching to tmux session '$SESSION'..."
echo "   Switch windows: Ctrl+B then 0-3 (or n/p for next/prev)"
echo "   Detach:         Ctrl+B then d"
echo ""
tmux attach-session -t "$SESSION"
