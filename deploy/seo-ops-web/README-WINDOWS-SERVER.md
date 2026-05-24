# SEO Ops - deploy root domain

Goi nay dung cho domain rieng:

```text
https://seo.cuahangphaohoa.shop
```

App chay o root `/`, khong chay trong thu muc `/seo-ops`.

## Chay thu

```powershell
cd C:\seo-ops-web
powershell -ExecutionPolicy Bypass -File .\start-seo-ops.ps1 -Port 5173 -BasePath /
```

Kiem tra:

```text
http://127.0.0.1:5173/
http://127.0.0.1:5173/api/health
```

## Reverse proxy

Tro domain ve Node app:

```text
https://seo.cuahangphaohoa.shop -> http://127.0.0.1:5173
```

Neu hosting Node.js cho cau hinh bien moi truong, dung:

```text
SEO_OPS_PORT=5173
SEO_OPS_HOST=0.0.0.0
SEO_OPS_BASE_PATH=/
SEO_OPS_DB_DIR=./db
```

## Database dung chung

Du lieu test dang nam tai:

```text
db/seo-ops-data.json
```

Hay backup dinh ky file nay. Backend hien tai luu JSON dung chung, nhieu nguoi co the truy cap cung data, nhung neu nhieu nguoi luu cung luc thi ban ghi sau se ghi de ban ghi truoc.
