#!/usr/bin/env bash
# Interactive Agent Skills Installer
# This script runs the TypeScript installer using Bun

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALLER_DIR="${SCRIPT_DIR}/installer"

# Check if bun is available
if ! command -v bun &> /dev/null; then
    echo "Error: Bun is required to run the interactive installer"
    echo "Install Bun: https://bun.sh/"
    exit 1
fi

# Install dependencies if needed
if [[ ! -d "${INSTALLER_DIR}/node_modules" ]]; then
    echo "Installing dependencies..."
    (cd "${INSTALLER_DIR}" && bun install)
fi

# Run the installer
exec bun run "${INSTALLER_DIR}/src/installer.ts"
