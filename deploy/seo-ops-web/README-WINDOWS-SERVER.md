# SEO Ops - Huong dan cai tren Windows Server

Ban deploy nay la frontend tinh React/Vite. Du lieu hien dang luu trong localStorage cua trinh duyet, chua co backend/database rieng.

## Cach 1: Chay bang Node.js co backend dung chung

1. Cai Node.js LTS tren VPS.
2. Copy thu muc `seo-ops-web` vao VPS, vi du:

```text
C:\seo-ops-web
```

3. Mo PowerShell tai thu muc do va chay:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-seo-ops.ps1 -Port 5173 -BasePath /seo-ops
```

Tu cai tu dong chay khi VPS khoi dong:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-seo-ops-task.ps1 -Port 5173 -BasePath /seo-ops
```

4. Mo firewall port 5173 neu can:

```powershell
New-NetFirewallRule -DisplayName "SEO Ops 5173" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

5. Truy cap:

```text
http://IP-VPS:5173
```

Neu dung domain `phaohoa.shop/seo-ops`, hay reverse proxy IIS/Nginx/hosting tu:

```text
https://phaohoa.shop/seo-ops
```

ve:

```text
http://127.0.0.1:5173/seo-ops
```

## Cach 2: Cai bang IIS

1. Bat IIS:

```powershell
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
```

2. Copy toan bo file trong thu muc `seo-ops-web` vao:

```text
C:\inetpub\wwwroot\seo-ops
```

3. Tao Website trong IIS:

```powershell
New-Website -Name "SEO Ops" -Port 80 -PhysicalPath "C:\inetpub\wwwroot\seo-ops"
```

4. Cai URL Rewrite module cho IIS neu chua co.

5. Neu refresh link co hash `#projects`, app van chay binh thuong vi routing hien tai dung hash route.

## Cau hinh ket noi WordPress

Trong SEO Ops, vao:

```text
Du an SEO -> Ket noi WordPress / Site Kit
```

Nhap:

```text
WordPress Site URL: https://tenmien.vn
Connector Endpoint: https://tenmien.vn/wp-json/seo-ops/v1
SEO Ops API Key: copy tu plugin WordPress SEO Ops
```

Neu app chay tren VPS bang domain, trong plugin WordPress SEO Ops dien Allowed Origin la origin cua app, vi du:

```text
http://IP-VPS:5173/seo-ops
```

hoac:

```text
https://seoops.tenmien.vn
```

Khong them dau `/` o cuoi.

## Luu y quan trong

- Goi deploy co kem `seo-ops-seed.json`. Neu trinh duyet chua co localStorage `seo-demo-data-v5`, app se tu nap du lieu test nay.
- Khi chay bang `start-seo-ops.ps1`, nhieu nguoi dung chung cung mot data file tai `db/seo-ops-data.json`.
- Trinh duyet van giu localStorage fallback, nhung khi backend `/api/data` hoat dong thi du lieu chung tren VPS la nguon chinh.
- Hay backup dinh ky file `db/seo-ops-data.json`.
