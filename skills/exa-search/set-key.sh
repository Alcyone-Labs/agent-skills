#!/bin/bash
# Set Exa API key in keychain

set -e

KEY_NAME="exa-api-key"

if [ -z "$1" ]; then
  echo "Usage: exa-set-key YOUR_API_KEY"
  echo ""
  echo "Get your API key at: https://dashboard.exa.ai/api-keys"
  exit 1
fi

API_KEY="$1"

# Validate key format (basic check)
if [[ ! "$API_KEY" =~ ^[a-zA-Z0-9_-]{20,}$ ]]; then
  echo "Warning: API key format looks unusual. Expected 20+ alphanumeric characters."
fi

# Store in keychain (using secret type)
if command -v security &> /dev/null; then
  # macOS keychain
  security add-generic-password -a "exa" -s "$KEY_NAME" -w "$API_KEY" -U 2>/dev/null || \
    security add-generic-password -a "exa" -s "$KEY_NAME" -w "$API_KEY"
  echo "✓ API key stored in macOS keychain"
else
  # Linux - store in file with restricted permissions
  KEY_FILE="$HOME/.config/exa/api_key"
  mkdir -p "$(dirname "$KEY_FILE")"
  echo "$API_KEY" > "$KEY_FILE"
  chmod 600 "$KEY_FILE"
  echo "✓ API key stored in $KEY_FILE"
fi

# Also set as environment variable for current session
export EXA_API_KEY="$API_KEY"

echo ""
echo "API key set. You can now use:"
echo "  exa-search \"your query\""
echo "  exa-code \"code query\""
echo "  exa-company \"company name\""
