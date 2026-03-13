#!/usr/bin/env bash
# Get Exa API key from storage.
set -euo pipefail

KEY_NAME="exa-api-key"
QUIET=false

if [[ "${1:-}" == "--quiet" ]]; then
  QUIET=true
fi

# Environment variable has highest priority.
if [[ -n "${EXA_API_KEY:-}" ]]; then
  echo "$EXA_API_KEY"
  exit 0
fi

# macOS Keychain lookup.
if command -v security >/dev/null 2>&1; then
  KEY="$(security find-generic-password -a "exa" -s "$KEY_NAME" -w 2>/dev/null || true)"
  if [[ -n "$KEY" ]]; then
    echo "$KEY"
    exit 0
  fi
fi

# Linux file fallback.
KEY_FILE="$HOME/.config/exa/api_key"
if [[ -f "$KEY_FILE" ]]; then
  cat "$KEY_FILE"
  exit 0
fi

if [[ "$QUIET" != true ]]; then
  echo "Error: Exa API key not found." >&2
  echo "Run: exa-set-key YOUR_API_KEY" >&2
  echo "Get your key at: https://dashboard.exa.ai/api-keys" >&2
fi

exit 1
