#!/bin/bash
# stop-all.sh - Stops all TrafficJam services without killing the tmux session.

SESSION="trafficjam"

for window in backend map-data frontend simengine; do
    tmux send-keys -t "$SESSION:$window" C-c 2>/dev/null
done

make nats-stop 2>/dev/null
make stop 2>/dev/null

echo "All services stopped."
