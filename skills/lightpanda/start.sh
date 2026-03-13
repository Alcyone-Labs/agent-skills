#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST="${LIGHTPANDA_HOST:-127.0.0.1}"
PORT="${LIGHTPANDA_PORT:-9222}"
BINARY_PATH="${LIGHTPANDA_BINARY:-${SCRIPT_DIR}/runtime/browser/lightpanda}"
STATE_DIR="${SCRIPT_DIR}/runtime/state"
PID_FILE="${STATE_DIR}/lightpanda.pid"
LOG_FILE="${STATE_DIR}/lightpanda.log"

mkdir -p "$STATE_DIR"

if [[ ! -x "$BINARY_PATH" ]]; then
  echo "Lightpanda binary not found at: $BINARY_PATH" >&2
  echo "Install or repair runtime with: agent-skills reset lightpanda --local|--global" >&2
  exit 1
fi

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" 2>/dev/null; then
    echo "Lightpanda already running (PID: $PID)"
    echo "WebSocket: ws://${HOST}:${PORT}"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

echo "Starting Lightpanda on ${HOST}:${PORT}..."
nohup "$BINARY_PATH" serve --host "$HOST" --port "$PORT" > "$LOG_FILE" 2>&1 &
PID=$!
echo "$PID" > "$PID_FILE"

for _ in {1..20}; do
  if curl -s "http://${HOST}:${PORT}/json/version" >/dev/null 2>&1; then
    echo "Lightpanda started (PID: $PID)"
    echo "WebSocket: ws://${HOST}:${PORT}"
    echo "HTTP: http://${HOST}:${PORT}/json/version"
    exit 0
  fi
  sleep 0.5
done

echo "Failed to start Lightpanda" >&2
echo "Check log: $LOG_FILE" >&2
rm -f "$PID_FILE"
exit 1
