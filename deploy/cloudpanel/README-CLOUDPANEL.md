# Deploy SEO Ops tren VPS Ubuntu 24.04 + CloudPanel Node.js Site

Tai lieu nay chi danh cho moi truong hien tai:

```text
VPS: Ubuntu 24.04
Panel: CloudPanel
Domain: seoops.sumu.id.vn
Site type: Node.js Site
Node.js Version: Node 22 LTS
App Port: 3000
Site User: seoops
CloudPanel Root Directory: seoops.sumu.id.vn
Project path: /home/seoops/htdocs/seoops.sumu.id.vn
Repo: https://github.com/vuvietanhbxv/seo
Startup file: app.js
Production storage: /home/seoops/seo-ops-storage
```

Repo nay da co backend Node.js tai `app.js` -> `server/seo-ops-server.cjs`. Khong deploy nhu static-only neu can du lieu online; backend cung cap `/api/data`, `/api/health`, MCP, Google OAuth va tool output.

## A. Cau hinh CloudPanel

Trong CloudPanel, tao/chinh Node.js Site voi cac gia tri:

```text
Domain Name: seoops.sumu.id.vn
Node.js Version: Node 22 LTS
App Port: 3000
Site User: seoops
Root Directory: seoops.sumu.id.vn
Startup File: app.js
```

Environment Variables nen dien trong CloudPanel hoac trong file `.env.local` tai project:

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
SEO_OPS_BASE_PATH=/
SEO_OPS_STORAGE_DRIVER=json
SEO_OPS_DB_DIR=/home/seoops/seo-ops-storage
SEO_OPS_ENTITY_GUIDE_DIR=/home/seoops/seo-ops-storage/Entity Guide
SEO_OPS_TOOL_OUTPUT_DIR=/home/seoops/seo-ops-storage/tools
SEO_OPS_DB_BACKUPS=50
```

Neu CloudPanel Node.js runner khong ket noi duoc app, doi rieng `HOST=0.0.0.0` va giu `PORT=3000`.

Neu dung Google OAuth:

```env
SEO_OPS_GOOGLE_REDIRECT_URI=https://seoops.sumu.id.vn/api/google/oauth/callback
SEO_OPS_GOOGLE_TOKEN_SECRET=<chuoi-random-dai>
```

## B. SSH deploy tu Git

Dang nhap VPS, chuyen sang user site:

```bash
ssh root@YOUR_SERVER_IP
sudo -iu seoops
```

Tao storage ngoai thu muc Git:

```bash
mkdir -p /home/seoops/seo-ops-storage/backups
mkdir -p /home/seoops/seo-ops-storage/tools
mkdir -p "/home/seoops/seo-ops-storage/Entity Guide"
mkdir -p /home/seoops/seo-ops-storage/entity-guides
chmod -R 700 /home/seoops/seo-ops-storage
```

Clone repo neu thu muc project dang rong:

```bash
cd /home/seoops/htdocs
mkdir -p seoops.sumu.id.vn
cd seoops.sumu.id.vn
git clone https://github.com/vuvietanhbxv/seo.git .
```

Neu da clone roi:

```bash
cd /home/seoops/htdocs/seoops.sumu.id.vn
git pull --ff-only origin main
```

Tao `.env.local` neu chua co:

```bash
cat > .env.local <<'EOF'
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
SEO_OPS_BASE_PATH=/
SEO_OPS_STORAGE_DRIVER=json
SEO_OPS_DB_DIR=/home/seoops/seo-ops-storage
SEO_OPS_ENTITY_GUIDE_DIR=/home/seoops/seo-ops-storage/Entity Guide
SEO_OPS_TOOL_OUTPUT_DIR=/home/seoops/seo-ops-storage/tools
SEO_OPS_DB_BACKUPS=50
EOF
chmod 600 .env.local
```

Cai dependency va build production:

```bash
npm ci
npm run build:seo-domain
```

Neu `npm ci` loi vi lockfile khac moi truong:

```bash
npm install
npm run build:seo-domain
```

## C. Chay du lieu online

Repo hien da ho tro backend online:

```text
Startup: app.js
API data: /api/data
Health: /api/health
Frontend production: dist/
JSON DB: /home/seoops/seo-ops-storage/seo-ops-data.json
```

Frontend van co cache/localStorage fallback de app khong vo khi mat ket noi API, nhung production source nen la backend `/api/data`. Khi backend chay dung, moi thay doi se ghi vao JSON DB tren VPS thay vi chi nam trong trinh duyet.

Neu `/api/health` khong truy cap duoc, khong deploy static-only `dist`; hay sua Node.js Site de startup bang `app.js`.

## D. Cau hinh luu du lieu

Uu tien JSON DB truoc khi chuyen MariaDB:

```env
SEO_OPS_STORAGE_DRIVER=json
SEO_OPS_DB_DIR=/home/seoops/seo-ops-storage
SEO_OPS_DB_BACKUPS=50
```

Khong luu production data trong:

```text
/home/seoops/htdocs/seoops.sumu.id.vn
```

Vi thu muc do la Git checkout va co the thay doi khi pull/build. Neu co file JSON cu, copy vao:

```bash
cp /duong-dan-file-cu/seo-ops-data.json /home/seoops/seo-ops-storage/seo-ops-data.json
chmod 600 /home/seoops/seo-ops-storage/seo-ops-data.json
```

Neu da co MariaDB va muon chuyen sau:

```env
SEO_OPS_STORAGE_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=seoops_db
DB_USERNAME=seoops_user
DB_PASSWORD=<mat-khau-db>
DB_SSL=false
```

Chay migrate theo tai lieu `deploy/cloudpanel/README-MARIADB.md`. Khong bat `SEO_OPS_STORAGE_DRIVER=mysql` truoc khi migrate/verify thanh cong.

## E. Chay production

Chon mot trong hai cach: CloudPanel Node.js runner hoac PM2. Khong chay ca hai cung luc tren port 3000.

### Cach 1: CloudPanel Node.js runner

Trong CloudPanel:

```text
Startup File: app.js
App Port: 3000
Node.js Version: Node 22 LTS
```

Sau khi `npm ci` va `npm run build:seo-domain`, bam Restart Node.js App trong CloudPanel.

Test:

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -I https://seoops.sumu.id.vn
```

### Cach 2: PM2 duoi user seoops

Cai PM2 neu chua co:

```bash
npm install -g pm2
```

Start/restart:

```bash
cd /home/seoops/htdocs/seoops.sumu.id.vn
pm2 startOrRestart ecosystem.config.cjs --env production
pm2 save
pm2 logs seoops
```

Test:

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -I https://seoops.sumu.id.vn
```

Neu server reboot va PM2 khong tu len lai, chay:

```bash
pm2 startup
```

Lam theo lenh PM2 in ra, sau do:

```bash
pm2 save
```

## F. Cap nhat code sau nay

Lenh update thu cong:

```bash
sudo -iu seoops
cd /home/seoops/htdocs/seoops.sumu.id.vn
git pull --ff-only origin main
npm ci
npm run build:seo-domain
pm2 restart seoops --update-env
pm2 save
curl -fsS http://127.0.0.1:3000/api/health
```

Neu dung CloudPanel Node.js runner thay PM2, thay hai lenh PM2 bang thao tac Restart trong CloudPanel.

Repo cung co script:

```bash
bash deploy/cloudpanel/update.sh
```

Deploy lan dau co the dung:

```bash
bash deploy/cloudpanel/deploy.sh
```

## G. Checklist loi thuong gap tren CloudPanel

- Sai App Port: CloudPanel va `.env.local` phai cung la `3000`.
- App listen sai host: thu `HOST=127.0.0.1`; neu CloudPanel runner khong ket noi duoc thi doi `HOST=0.0.0.0`.
- Sai Root Directory: trong CloudPanel dien `seoops.sumu.id.vn`, full path la `/home/seoops/htdocs/seoops.sumu.id.vn`.
- Thieu `.env.local`: production JSON mode can `SEO_OPS_DB_DIR` nam ngoai Git.
- Thieu Node/NPM cho user `seoops`: chay `node -v` va `npm -v` trong `sudo -iu seoops`.
- PM2 chay duoi sai user: lenh PM2 phai chay sau khi `sudo -iu seoops`.
- Port 3000 bi app khac chiem: chay `ss -ltnp | grep ':3000'`.
- Chay ca PM2 va CloudPanel runner cung luc: dung mot process manager.
- Du lieu van nam trong localStorage: kiem tra `/api/health` va `/api/data`; neu API loi, frontend chi con cache local.
- `databaseProtected` la `false`: sua `SEO_OPS_DB_DIR=/home/seoops/seo-ops-storage`, restart app.
- Build xong nhung domain van cu: xoa cache trinh duyet, kiem tra `dist/index.html`, restart Node.js App.

## H. Patch production da ho tro

Repo da co nhung thanh phan production can thiet:

```text
app.js
server/seo-ops-server.cjs
server/storage/
.env.example
ecosystem.config.cjs
deploy/cloudpanel/deploy.sh
deploy/cloudpanel/update.sh
deploy/cloudpanel/README-CLOUDPANEL.md
deploy/cloudpanel/README-MARIADB.md
```

Neu can them API toi thieu trong tuong lai, giu nguyen frontend va them route backend duoi `server/seo-ops-server.cjs`. Khong bo localStorage fallback; chi dam bao backend `/api/data` la source production khi online.
