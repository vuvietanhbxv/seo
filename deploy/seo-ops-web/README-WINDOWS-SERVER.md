# SEO Ops - deploy root domain

Goi nay dung cho domain rieng:

```text
https://seo.cuahangphaohoa.shop
```

App chay o root `/`, khong chay trong thu muc `/seo-ops`.

## Plesk Node.js

Trong Plesk, cau hinh:

```text
Application Root: /seo.cuahangphaohoa.shop
Document Root: /seo.cuahangphaohoa.shop
Application Startup File: app.js
Application Mode: production
```

Neu deploy bang Git, sau khi pull code hay chay:

```text
npm run publish:plesk
```

Sau do bam:

```text
NPM install
Restart App
```

Kiem tra:

```text
https://seo.cuahangphaohoa.shop/
https://seo.cuahangphaohoa.shop/api/health
```

## Bien moi truong

Neu Plesk cho khai bao bien moi truong, dung:

```text
SEO_OPS_BASE_PATH=/
SEO_OPS_DB_DIR=./db
```

Khong can dat `SEO_OPS_PORT` tren Plesk vi Plesk se tu gan `PORT` cho Node app.

## Database dung chung

Du lieu test dang nam tai:

```text
db/seo-ops-data.json
```

Hay backup dinh ky file nay. Backend hien tai luu JSON dung chung, nhieu nguoi co the truy cap cung data, nhung neu nhieu nguoi luu cung luc thi ban ghi sau se ghi de ban ghi truoc.
