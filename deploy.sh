#!/bin/bash

set -e

# appleboy/ssh-action runs a minimal environment; bash -l does not always source
# ~/.bashrc (e.g. root with a minimal ~/.profile). Load Node/pnpm explicitly.
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
elif command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env)"
fi
export PATH="$HOME/.local/share/pnpm:$PATH"
if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ pnpm not found. Install pnpm on this user (e.g. corepack prepare pnpm@9 --activate) or ensure ~/.profile sources ~/.bashrc for login shells." >&2
  exit 127
fi

echo "🚀 Starting deployment..."

echo "📥 Pulling latest changes..."
git pull

echo "📦 Installing dependencies..."
# Serialize package extraction/lifecycle scripts to keep peak memory low on the
# VPS. `sharp` is skipped via `pnpm.neverBuiltDependencies` (the landing site is
# a static export with unoptimized images, so it is never needed).
pnpm install --frozen-lockfile --child-concurrency=1

echo "🏗️ Building project..."
# Landing builds as a static export into apps/landing/out (see next.config.ts):
# no Node runtime, no sharp, and lint/type-check are skipped at build time
# (CI already runs `pnpm codecheck`), which keeps the build within the VPS's RAM.
MODE=prod pnpm build

echo "🗄️ Applying database migrations..."
# Runs drizzle-kit migrate against the prod (Turso) DB using apps/server/.env.
# It's a no-op when there's nothing pending, so it's safe to run every deploy.
# `set -e` means a failed migration aborts the deploy BEFORE the PM2 restart,
# so we never bring the app up against a mismatched schema.
MODE=prod pnpm db.migrate

echo "🔄 Restarting with PM2..."
pnpm run pm2.restart || echo "PM2 restart failed :("

echo "Deployed at $(date +%Y.%m.%d-%H:%M:%S)" > .deploy.info
echo "✅ Deployment completed!"
