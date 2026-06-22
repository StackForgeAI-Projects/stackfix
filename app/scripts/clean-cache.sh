#!/usr/bin/env bash
# Clears Next.js / API build caches that break dev when mixed with production builds.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Clearing StackFix build caches..."

rm -rf "$ROOT/apps/web/.next"
rm -rf "$ROOT/apps/api/dist"

if [[ "${1:-}" == "--all" ]]; then
  rm -rf "$ROOT/.turbo/cache"
  echo "  - turbo cache"
fi

echo "Done. Start dev with: pnpm dev"
