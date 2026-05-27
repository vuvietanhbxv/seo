# SEO Project Manager Demo

Demo webapp quan ly du an SEO cho agency, xay dung bang Node.js + React + Vite + TypeScript.

## Chuc nang

- Tong quan cong ty: KPI du an, doanh thu, task, keyword rank.
- Du an SEO: tao du an, chon du an, xem chi tiet, quan ly keyword va task rieng theo du an.
- Tai chinh: quan ly thu chi theo tung du an va tong quan cong ty.
- Nhan su: tao tai khoan demo, gan vai tro va quyen truy cap.
- Tien do: xem muc do hoan thanh task theo nhan vien va theo du an.
- Du lieu co the dung chung qua Node backend tai `/api/data`; localStorage chi la fallback/cache.

## Lenh chay

PowerShell tren may nay dang chan `npm.ps1`, vi vay dung `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run build:seo-domain
npm.cmd run build:seo-ops
npm.cmd run publish:plesk
npm.cmd start
npm.cmd run lint
```

App local mac dinh:

```text
http://127.0.0.1:5173/
```

## Deploy seo.cuahangphaohoa.shop

Neu dung Plesk va deploy bang Git, cau hinh co dinh:

```text
Application Root: /seo.cuahangphaohoa.shop
Document Root: /seo.cuahangphaohoa.shop/deploy/seo-ops-web
Application Startup File: app.js
Application Mode: production
```

Document Root phai tro vao `deploy/seo-ops-web`, khong tro vao thu muc goc chua `index.html` cua Vite dev.

Build frontend cho domain rieng, chay o root `/`:

```powershell
npm.cmd run build:seo-domain
```

Neu deploy bang Git tren Plesk, file production da nam trong `deploy/seo-ops-web`. Khi tao cap nhat production tu may phat trien, chay lenh nay de dong bo code/assets; script khong dong vao database:

```powershell
npm.cmd run publish:plesk
```

### Bao ve database production

Database production bat buoc phai dat ngoai thu muc Git/application. Khong dung:

```text
/mnt/data_web/cuahangphaohoa.shop/seo.cuahangphaohoa.shop/db
```

Dung thu muc storage rieng:

```text
/mnt/data_web/cuahangphaohoa.shop/seo-ops-storage/seo-ops-data.json
```

Truoc lan pull/deploy ban code nay tren Plesk:

1. Dung File Manager copy file `seo.cuahangphaohoa.shop/db/seo-ops-data.json` hien tai sang `seo-ops-storage/seo-ops-data.json`.
2. Sua `Custom environment variables`:

```text
SEO_OPS_DB_DIR=/mnt/data_web/cuahangphaohoa.shop/seo-ops-storage
```

3. Restart app va truy cap `/api/health`. Kiem tra `dbPath` la duong dan storage rieng va `databaseProtected` la `true`.
4. Chi sau khi xac nhan xong moi Git pull/deploy code moi.

O che do `production`, server se tu choi khoi dong neu `SEO_OPS_DB_DIR` thieu hoac van tro vao ben trong thu muc ung dung. Quy tac nay ngan deploy code ghi de du lieu that.

Chay backend Node local:

```powershell
$env:SEO_OPS_PORT='5173'
$env:SEO_OPS_HOST='0.0.0.0'
$env:SEO_OPS_BASE_PATH='/'
$env:SEO_OPS_DB_DIR='.\db'
npm.cmd start
```

Reverse proxy domain:

```text
https://seo.cuahangphaohoa.shop -> http://127.0.0.1:5173
```

Database local/runtime khong con duoc Git theo doi:

```text
db/seo-ops-data.json
```

File `public/seo-ops-seed.json` chi la seed khoi tao sach cho cai dat moi, khong chua du lieu du an production. Tai khoan khoi tao la `admin@seo-ops.local` / `123456`; doi mat khau ngay khi tao database moi.

## Google Search Console - Check Index

Module `Quan ly Keyword` dung Google Search Console URL Inspection API de check trang thai index cua URL bai viet.

## Ket noi Google OAuth cho Search Console va GA4

SEO Ops ho tro nguoi dung dang nhap Google va cap quyen doc Search Console/Google Analytics theo tung du an. Refresh token duoc ma hoa tai backend va luu trong thu muc `SEO_OPS_DB_DIR`, khong ghi vao frontend, localStorage hoac file du lieu du an.

Trong Google Cloud Console:

```text
1. Bat Google Search Console API va Google Analytics Data API.
2. Tao OAuth Client loai Web application.
3. Them Authorized redirect URI:
   https://seo.cuahangphaohoa.shop/api/google/oauth/callback
```

Them bien moi truong tren Plesk va restart app:

```text
SEO_OPS_GOOGLE_CLIENT_ID=google-oauth-client-id
SEO_OPS_GOOGLE_CLIENT_SECRET=google-oauth-client-secret
SEO_OPS_GOOGLE_REDIRECT_URI=https://seo.cuahangphaohoa.shop/api/google/oauth/callback
SEO_OPS_GOOGLE_TOKEN_SECRET=chuoi-bi-mat-dai-ngau-nhien-de-ma-hoa-refresh-token
```

Sau khi restart, vao `Du an SEO -> Ket noi Google`, bam `Dang nhap voi Google`. App yeu cau hai scope chi doc:

```text
https://www.googleapis.com/auth/webmasters.readonly
https://www.googleapis.com/auth/analytics.readonly
```

Google Analytics van can nhap `GA4 Property ID` cua du an. Khi du an da ket noi Google, nut dong bo se tu dong goi GA4 Data API qua backend SEO Ops.

Trong `Du an SEO -> Google Search Console / Check Index`, cau hinh:

```text
Search Console Property URL: https://tenmien.vn/ hoac sc-domain:tenmien.vn
URL Inspection API Endpoint: /api/search-console/inspect
```

URL-prefix property phai co dau `/` cuoi. Cau hinh token tinh duoi day chi dung lam fallback neu chua ket noi Google OAuth:

```text
SEO_OPS_SEARCH_CONSOLE_TOKEN=oauth-access-token-co-scope-webmasters-readonly
```

OAuth token can scope:

```text
https://www.googleapis.com/auth/webmasters.readonly
```

Khi dung Google OAuth, backend tu lay access token moi bang refresh token da ma hoa. Neu nguoi dung thu hoi quyen Google, ket noi lai trong giao dien du an. Google gioi han URL Inspection theo site; nut check hang loat gui lan luot de tranh tang tai dot bien.

## MCP cho Claude Code

Backend co endpoint MCP de Claude doc keyword va luu ban nhap bai viet vao module `Bai viet`:

```text
https://seo.cuahangphaohoa.shop/mcp
```

Dat Bearer token tren Plesk trong `Custom environment variables`, sau do restart app:

```text
SEO_OPS_MCP_TOKEN=mot-token-dai-ngau-nhien
```

### Claude Connectors tren web/Desktop

Claude Connectors khong nhan Bearer header thu cong nhu Claude Code. Neu chua trien khai OAuth, dat them mot key rieng tren Plesk:

```text
SEO_OPS_MCP_CONNECTOR_KEY=mot-key-rieng-dai-ngau-nhien
```

Trong `Customize -> Connectors -> Add custom connector`, nhap URL:

```text
https://seo.cuahangphaohoa.shop/mcp?key=mot-key-rieng-dai-ngau-nhien
```

Khong dien OAuth Client ID/Secret. URL nay chua quyen doc va ghi ban nhap, can giu bi mat va rotate neu bi lo.

### Claude Code

Cau hinh `.mcp.json`:

```json
{
  "mcpServers": {
    "seo-ops": {
      "type": "http",
      "url": "https://seo.cuahangphaohoa.shop/mcp",
      "headers": {
        "Authorization": "Bearer mot-token-dai-ngau-nhien"
      }
    }
  }
}
```

Tools:

- `seo_list_projects`: lay danh sach du an.
- `seo_list_keywords`: tim keyword can viet bai.
- `seo_get_keyword`: lay chi tiet keyword va ban nhap hien tai.
- `seo_save_article_draft`: luu bai viet Claude tao ve SEO Ops.
- `seo_update_article_status`: cap nhat trang thai duyet bai.

Sau khi Claude luu bai, refresh SEO Ops va vao `Bai viet -> Ban nhap -> Xem / sua`.

## Ket noi GitHub

Tao repo moi tren GitHub.com, vi du `seo-project-manager-demo`, sau do chay:

```powershell
git branch -M main
git add .
git commit -m "Initial SEO project manager demo"
git remote add origin https://github.com/<your-user>/seo-project-manager-demo.git
git push -u origin main
```

Neu repo da co remote `origin`, kiem tra bang:

```powershell
git remote -v
```
