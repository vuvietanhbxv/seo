#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-seoops}"
APP_DIR="${APP_DIR:-/home/seoops/htdocs/seoops.sumu.id.vn}"
APP_PARENT="$(dirname "$APP_DIR")"
BRANCH="${BRANCH:-main}"
REPO_URL="${REPO_URL:-https://github.com/vuvietanhbxv/seo.git}"
STORAGE_DIR="${STORAGE_DIR:-/home/seoops/seo-ops-storage}"

mkdir -p "$APP_PARENT" "$STORAGE_DIR/backups" "$STORAGE_DIR/tools" "$STORAGE_DIR/Entity Guide" "$STORAGE_DIR/entity-guides"

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git pull --ff-only origin "$BRANCH"
else
  mkdir -p "$APP_DIR"
  if [ "$(find "$APP_DIR" -mindepth 1 -maxdepth 1 | wc -l)" -gt 0 ]; then
    echo "ERROR: $APP_DIR is not empty and is not a Git repo. Stop to avoid overwriting files." >&2
    exit 1
  fi
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

if [ ! -f .env.local ]; then
  cat > .env.local <<EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
SEO_OPS_BASE_PATH=/
SEO_OPS_STORAGE_DRIVER=json
SEO_OPS_DB_DIR=$STORAGE_DIR
SEO_OPS_ENTITY_GUIDE_DIR=$STORAGE_DIR/Entity Guide
SEO_OPS_TOOL_OUTPUT_DIR=$STORAGE_DIR/tools
SEO_OPS_DB_BACKUPS=50
EOF
  chmod 600 .env.local
fi

if command -v npm >/dev/null 2>&1; then
  npm ci || npm install
else
  echo "ERROR: npm is not available for $(whoami). Check CloudPanel Node.js site Node 22 LTS setup." >&2
  exit 1
fi

npm run build:seo-domain

if command -v pm2 >/dev/null 2>&1; then
  pm2 startOrRestart ecosystem.config.cjs --env production
  pm2 save
else
  echo "PM2 is not installed. Install it with: npm install -g pm2"
  echo "Or start/restart the app from CloudPanel Node.js Site using startup file app.js."
fi

curl -fsS http://127.0.0.1:3000/api/health || true
echo
echo "Deploy finished. Check: https://seoops.sumu.id.vn/api/health"
