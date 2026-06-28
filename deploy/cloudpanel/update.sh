#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-seoops}"
APP_DIR="${APP_DIR:-/home/seoops/htdocs/seoops.sumu.id.vn}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

git pull --ff-only origin "$BRANCH"
npm ci
npm run build:seo-domain

if command -v pm2 >/dev/null 2>&1; then
  pm2 startOrRestart ecosystem.config.cjs --env production
  pm2 save
  pm2 status "$APP_NAME"
else
  echo "PM2 is not installed. Restart the Node.js Site in CloudPanel after this update."
fi

curl -fsS http://127.0.0.1:3000/api/health || true
echo
echo "Update finished. Check: https://seoops.sumu.id.vn/api/health"
