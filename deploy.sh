#!/bin/bash

set -e

echo "🚀 Starting deployment..."

echo "📥 Pulling latest changes..."
git pull

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🔍 Running code checks..."
pnpm run codecheck

echo "🏗️ Building project..."
pnpm build

echo "🔄 Restarting with PM2..."
pnpm run pm2.restart || echo "PM2 restart failed :("

echo "✅ Deployment completed!"
