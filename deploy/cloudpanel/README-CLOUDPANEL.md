# SEO Ops CloudPanel Deploy

Thong tin host moi:

```text
Domain: seoops.sumu.id.vn
Application root: /home/seoops/htdocs/seoops.sumu.id.vn
Site user: seoops
Node.js version: Node 22 LTS
App port: 3000
Startup file: app.js
```

## 1. Cau hinh CloudPanel

Trong CloudPanel, giu cau hinh Node.js:

```text
Root Directory: seoops.sumu.id.vn
App Port: 3000
Node.js Version: Node 22 LTS
Startup File: app.js
```

Neu CloudPanel co o environment variables, them:

```text
NODE_ENV=production
PORT=3000
SEO_OPS_BASE_PATH=/
SEO_OPS_DB_DIR=/home/seoops/seo-ops-storage
SEO_OPS_ENTITY_GUIDE_DIR=/home/seoops/seo-ops-storage/Entity Guide
SEO_OPS_TOOL_OUTPUT_DIR=/home/seoops/seo-ops-storage/tools
SEO_OPS_DB_BACKUPS=50
```

Neu dang dung Google OAuth cho Search Console/GA4, cap nhat redirect domain moi:

```text
SEO_OPS_GOOGLE_REDIRECT_URI=https://seoops.sumu.id.vn/api/google/oauth/callback
```

Trong Google Cloud Console, them Authorized redirect URI giong dong tren.

## 2. Tao storage ngoai web root

Database production khong duoc nam trong `/home/seoops/htdocs/seoops.sumu.id.vn`.
Tao storage rieng:

```bash
mkdir -p "/home/seoops/seo-ops-storage/Entity Guide"
mkdir -p "/home/seoops/seo-ops-storage/entity-guides"
mkdir -p "/home/seoops/seo-ops-storage/tools"
mkdir -p "/home/seoops/seo-ops-storage/backups"
chown -R seoops:seoops /home/seoops/seo-ops-storage
chmod -R 700 /home/seoops/seo-ops-storage
```

Neu SSH bang user `seoops` va khong co sudo, bo qua `chown`.

## 3. Lay code tu Git

Neu root directory dang rong:

```bash
cd /home/seoops/htdocs/seoops.sumu.id.vn
git clone https://github.com/vuvietanhbxv/seo.git .
npm ci
npm run build:seo-domain
```

Neu CloudPanel pull Git tu giao dien, dung deploy command:

```bash
npm ci
npm run build:seo-domain
```

Server Node se uu tien serve `dist/`. Neu khong build tren server, ban can commit goi `deploy/seo-ops-web` da duoc tao bang:

```powershell
npm.cmd run publish:cloudpanel
```

## 4. Chuyen du lieu tu host cu

Can copy cac file/thu muc runtime sau tu host cu sang `/home/seoops/seo-ops-storage`:

```text
seo-ops-data.json
seo-ops-tool-config.json
seo-ops-google-oauth.json
seo-ops-vertex-credentials.json
Entity Guide/
entity-guides/
tools/
backups/
```

File bat buoc la `seo-ops-data.json`. Cac file khac chi can neu ban da cau hinh AI, Google OAuth, Vertex, file huong dan Entity, hoac lich su bai viet/anh.

Vi du neu host cu la Plesk va storage cu nam tai `/mnt/data_web/cuahangphaohoa.shop/seo-ops-storage`:

```bash
rsync -avz old_user@OLD_SERVER:/mnt/data_web/cuahangphaohoa.shop/seo-ops-storage/ /home/seoops/seo-ops-storage/
chown -R seoops:seoops /home/seoops/seo-ops-storage
```

Neu chuyen tu may local Windows hien tai, upload cac file trong:

```text
C:\Users\ADMIN\Documents\New project 8\db\
```

vao:

```text
/home/seoops/seo-ops-storage/
```

## 5. Restart va kiem tra

Restart Node.js app trong CloudPanel, sau do mo:

```text
https://seoops.sumu.id.vn/api/health
```

Can thay cac gia tri chinh:

```json
{
  "storage": "json-db",
  "basePath": "/",
  "databaseProtected": true,
  "dbPath": "/home/seoops/seo-ops-storage/seo-ops-data.json",
  "entityGuideDir": "/home/seoops/seo-ops-storage/Entity Guide"
}
```

Neu `databaseProtected` la `false`, dung app ngay va sua lai `SEO_OPS_DB_DIR` vi database dang nam trong thu muc ung dung.

## 6. Checklist sau khi chuyen

- DNS `seoops.sumu.id.vn` tro A record ve IP server CloudPanel.
- Bat SSL/Let's Encrypt cho domain.
- CloudPanel app chay Node 22 LTS, port 3000.
- `/api/health` tra `databaseProtected: true`.
- Dang nhap duoc bang tai khoan cu.
- Module Cong cu doc duoc cau hinh AI neu da copy `seo-ops-tool-config.json`.
- Google OAuth redirect URI da doi sang `https://seoops.sumu.id.vn/api/google/oauth/callback`.
