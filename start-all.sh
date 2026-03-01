#!/bin/bash
# start-all.sh - Starts the full TrafficJam integration stack in a tmux session.
# Usage: bash start-all.sh  (from anywhere in WSL)

SESSION="trafficjam"
BACKEND_VENV=/tmp/trafficjam-be-venv
MAPDATA_VENV=/tmp/trafficjam-mapdata-venv

# ── 1. Docker infra ──────────────────────────────────────────────────────────
echo "Starting PostgreSQL..."
make stop 2>/dev/null; make build && make run

echo "Starting NATS JetStream..."
make nats-stop 2>/dev/null; make nats-build && make nats-run

echo "Docker containers up."

# ── 2. tmux session ──────────────────────────────────────────────────────────
tmux kill-session -t "$SESSION" 2>/dev/null

tmux new-session  -d -s "$SESSION" -n "backend"
tmux send-keys    -t "$SESSION:backend" "cd trafficjam-be && ([ -d $BACKEND_VENV ] || python3 -m venv $BACKEND_VENV) && source $BACKEND_VENV/bin/activate && pip install -r requirements.txt -q && fastapi dev --port 8001" Enter

tmux new-window   -t "$SESSION" -n "map-data"
tmux send-keys    -t "$SESSION:map-data" "cd map-data-service && ([ -d $MAPDATA_VENV ] || python3 -m venv $MAPDATA_VENV) && source $MAPDATA_VENV/bin/activate && pip install -r requirements.txt -q && fastapi dev" Enter

tmux new-window   -t "$SESSION" -n "frontend"
tmux send-keys    -t "$SESSION:frontend" "cd trafficjam-fe && bun install && bun run dev" Enter

tmux new-window   -t "$SESSION" -n "simengine"
tmux send-keys    -t "$SESSION:simengine" "rsync -a --exclude=target simengine/ /tmp/trafficjam-simengine/ && cd /tmp/trafficjam-simengine && mvn spring-boot:run" Enter

# ── 3. Attach ────────────────────────────────────────────────────────────────
echo ""
echo "Attaching to tmux session '$SESSION'..."
echo "   Switch windows: Ctrl+B then 0-3 (or n/p for next/prev)"
echo "   Detach:         Ctrl+B then d"
echo ""
tmux attach-session -t "$SESSION"
