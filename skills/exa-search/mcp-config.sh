#!/usr/bin/env bash
set -euo pipefail

cat <<'EOF'
{
  "mcpServers": {
    "exa": {
      "url": "https://mcp.exa.ai/mcp?exaApiKey=YOUR_API_KEY"
    }
  }
}
EOF
