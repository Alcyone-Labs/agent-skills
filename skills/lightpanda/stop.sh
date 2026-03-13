#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="${SCRIPT_DIR}/runtime/state"
PID_FILE="${STATE_DIR}/lightpanda.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "Lightpanda is not running (no PID file)"
  exit 0
fi

PID="$(cat "$PID_FILE")"
if kill -0 "$PID" 2>/dev/null; then
  kill "$PID" 2>/dev/null || true
  echo "Lightpanda stopped (PID: $PID)"
else
  echo "Lightpanda process not found (stale PID file)"
fi

rm -f "$PID_FILE"
