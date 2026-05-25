# SEO Ops - Plesk Node.js

Cau hinh Plesk:

```text
Application Root: /seo.cuahangphaohoa.shop
Document Root: /seo.cuahangphaohoa.shop/deploy/seo-ops-web
Application Startup File: app.js
Application Mode: production
```

Khong dat Document Root vao thu muc goc vi `index.html` o do la file Vite dung cho che do dev.

Sau khi Git pull/deploy:

```text
NPM install
Restart App
```

Neu trang chu van la ban dev co `/src/main.tsx`, chay them:

```text
npm run publish:plesk
Restart App
```

Kiem tra:

```text
https://seo.cuahangphaohoa.shop/api/health
```

Ket qua dung co `ok: true`.
