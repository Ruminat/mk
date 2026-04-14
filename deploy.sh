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
pnpm install --frozen-lockfile

echo "🏗️ Building project..."
pnpm build

echo "🔄 Restarting with PM2..."
pnpm run pm2.restart || echo "PM2 restart failed :("

echo "Deployed at $(date +%Y.%m.%d-%H:%M:%S)" > .deploy.info
echo "✅ Deployment completed!"
