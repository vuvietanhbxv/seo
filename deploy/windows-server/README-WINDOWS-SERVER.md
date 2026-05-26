# SEO Ops - Huong dan cai tren Windows Server

Ban deploy Node.js dung database JSON chung. Database runtime phai nam ngoai thu muc app de cap nhat code khong ghi de du lieu.

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

Mac dinh script luu database tai thu muc `seo-ops-storage` nam canh thu muc app, vi du:

```text
C:\seo-ops-storage\seo-ops-data.json
```

Neu dang nang cap tu ban cu, copy `C:\seo-ops-web\db\seo-ops-data.json` sang thu muc storage nay truoc khi chay ban moi.

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

- Goi deploy co kem `seo-ops-seed.json` sach chi de khoi tao cai dat moi, khong chua du lieu du an production.
- Khi chay bang `start-seo-ops.ps1`, nhieu nguoi dung chung data file tai thu muc `seo-ops-storage` nam ngoai thu muc app.
- Trinh duyet van giu localStorage fallback, nhung khi backend `/api/data` hoat dong thi du lieu chung tren VPS la nguon chinh.
- Hay backup dinh ky file `seo-ops-storage\seo-ops-data.json`.
