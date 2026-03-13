#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
RUNTIME_BROWSER_DIR="${SKILL_ROOT}/runtime/browser"
RUNTIME_STATE_DIR="${SKILL_ROOT}/runtime/state"
BINARY_PATH="${RUNTIME_BROWSER_DIR}/lightpanda"

mkdir -p "$RUNTIME_BROWSER_DIR" "$RUNTIME_STATE_DIR"

npm install --omit=dev

ARCH_RAW="$(uname -m)"
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"

case "$ARCH_RAW" in
  arm64|aarch64) ARCH="aarch64" ;;
  x86_64|amd64) ARCH="x86_64" ;;
  *)
    echo "Unsupported architecture: $ARCH_RAW" >&2
    exit 1
    ;;
esac

case "$OS" in
  linux) OS="linux" ;;
  darwin) OS="macos" ;;
  *)
    echo "Unsupported OS: $OS" >&2
    exit 1
    ;;
esac

BINARY_NAME="lightpanda-${ARCH}-${OS}"
DOWNLOAD_URL="https://github.com/lightpanda-io/browser/releases/download/nightly/${BINARY_NAME}"

if [[ -x "$BINARY_PATH" ]]; then
  exit 0
fi

curl -fSL "$DOWNLOAD_URL" -o "$BINARY_PATH"
chmod +x "$BINARY_PATH"
