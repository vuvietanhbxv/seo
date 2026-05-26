# SEO Ops - Plesk Node.js

Cau hinh Plesk:

```text
Application Root: /seo.cuahangphaohoa.shop
Document Root: /seo.cuahangphaohoa.shop/deploy/seo-ops-web
Application Startup File: app.js
Application Mode: production
```

Khong dat Document Root vao thu muc goc vi `index.html` o do la file Vite dung cho che do dev.

Bien moi truong MCP cho Claude Connectors:

```text
SEO_OPS_MCP_CONNECTOR_KEY=mot-key-rieng-dai-ngau-nhien
SEO_OPS_BASE_PATH=/
SEO_OPS_DB_DIR=/mnt/data_web/cuahangphaohoa.shop/seo.cuahangphaohoa.shop/db
SEO_OPS_SEARCH_CONSOLE_TOKEN=oauth-access-token-co-scope-webmasters-readonly
```

Trong SEO Ops, vao `Du an SEO -> Google Search Console / Check Index`, nhap property dang `https://tenmien.vn/` hoac `sc-domain:tenmien.vn`, giu endpoint `/api/search-console/inspect`, sau do bam `Kiem tra ket noi`.

URL connector:

```text
https://seo.cuahangphaohoa.shop/mcp?key=mot-key-rieng-dai-ngau-nhien
```

Sau khi Git pull/deploy:

```text
NPM install
Restart App
```
