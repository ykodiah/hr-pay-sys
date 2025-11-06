#!/usr/bin/env bash

set -euo pipefail

echo "[smoke] Starting AkwaabaHR smoke verification"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[smoke] pnpm not found in PATH" >&2
  exit 1
fi

echo "[smoke] Running lint"
pnpm lint

echo "[smoke] Building production bundle"
pnpm build

echo "[smoke] Smoke checks completed successfully"
