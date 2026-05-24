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
npm.cmd run build:seo-ops
npm.cmd start
npm.cmd run lint
```

App local mac dinh:

```text
http://127.0.0.1:5173/
```

## Deploy phaohoa.shop/seo-ops

Build frontend cho subpath `/seo-ops`:

```powershell
npm.cmd run build:seo-ops
```

Chay backend Node dung chung database:

```powershell
$env:SEO_OPS_PORT='5173'
$env:SEO_OPS_HOST='0.0.0.0'
$env:SEO_OPS_BASE_PATH='/seo-ops'
$env:SEO_OPS_DB_DIR='.\db'
npm.cmd start
```

Reverse proxy domain:

```text
https://phaohoa.shop/seo-ops -> http://127.0.0.1:5173/seo-ops
```

Database dung chung:

```text
db/seo-ops-data.json
```

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
