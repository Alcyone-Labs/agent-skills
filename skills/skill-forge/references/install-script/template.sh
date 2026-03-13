#!/usr/bin/env bash
set -euo pipefail

# Thin per-skill installer wrapper.
# Replace SKILL_NAME when generating a concrete skill installer.
SKILL_NAME="{{SKILL_NAME}}"

if [[ -z "$SKILL_NAME" || "$SKILL_NAME" == "{{SKILL_NAME}}" ]]; then
  echo "SKILL_NAME is not configured in install.sh" >&2
  exit 1
fi

if command -v agent-skills >/dev/null 2>&1; then
  exec agent-skills install "$SKILL_NAME" "$@"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOCAL_INSTALLER_TS="${REPO_ROOT}/installer/src/installer.ts"

if [[ -f "$LOCAL_INSTALLER_TS" ]] && command -v bun >/dev/null 2>&1; then
  exec bun run "$LOCAL_INSTALLER_TS" install "$SKILL_NAME" "$@"
fi

exec npx @alcyone-labs/agent-skills install "$SKILL_NAME" "$@"
