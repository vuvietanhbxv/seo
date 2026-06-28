# Nang cap SEO Ops tu JSON DB sang MariaDB tren CloudPanel

Tai lieu nay ap dung khi ung dung dang chay tren CloudPanel Node.js, vi du port `3000`, va ban muon chuyen du lieu tu file `seo-ops-data.json` sang MariaDB/MySQL.

## 1. Tao database trong CloudPanel

Trong CloudPanel, tao database va user rieng cho app. Neu ban tao theo anh chup man hinh:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=seoops
DB_USERNAME=seoops
DB_PASSWORD=<mat-khau-database-trong-cloudpanel>
DB_SSL=false
```

Neu ban dung ten khac, chi can thay `DB_DATABASE` va `DB_USERNAME` dung voi CloudPanel. Khong commit mat khau vao git.

## 2. Cau hinh `.env.local` tren server

Tai thu muc app tren CloudPanel, vi du:

```bash
cd /home/seoops/htdocs/seoops.sumu.id.vn
```

Tao hoac sua file `.env.local`:

```env
PORT=3000
NODE_ENV=production

SEO_OPS_STORAGE_DRIVER=json
SEO_OPS_DB_DIR=/home/seoops/seo-ops-storage
SEO_OPS_DB_BACKUPS=50

DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=seoops
DB_USERNAME=seoops
DB_PASSWORD=<mat-khau-database-trong-cloudpanel>
DB_SSL=false
```

Bat dau voi `SEO_OPS_STORAGE_DRIVER=json` de app van doc file JSON cu trong luc kiem tra migration.

## 3. Dat file JSON cu vao server

Khuyen nghi dat file JSON ngoai thu muc code:

```bash
mkdir -p /home/seoops/seo-ops-storage
```

Tai file cu len:

```text
/home/seoops/seo-ops-storage/seo-ops-data.json
```

Khong xoa file JSON sau khi migrate. File nay la duong rollback nhanh nhat.

## 4. Cai dependency va build

```bash
npm install
npm run build:seo-domain
```

## 5. Chay dry-run migrate

Dry-run se ket noi database, doc JSON, tinh checksum va dem so ban ghi, nhung khong ghi vao MariaDB.

```bash
npm run db:mysql:migrate -- --source=/home/seoops/seo-ops-storage/seo-ops-data.json --dry-run
```

Kiem tra output:

```json
{
  "ok": true,
  "dryRun": true,
  "storageKey": "app:data",
  "checksum": "...",
  "counts": { "projects": 1, "tasks": 10 }
}
```

## 6. Migrate that

Lan chay that se tao backup file JSON nguon truoc, tao bang neu chua co, ghi `app:data`, sau do doc lai de verify checksum/counts.

```bash
npm run db:mysql:migrate -- --source=/home/seoops/seo-ops-storage/seo-ops-data.json
```

Neu database da co `app:data`, script se tu choi de tranh ghi de. Chi dung lenh nay khi ban chu dong muon thay the du lieu MariaDB hien co:

```bash
npm run db:mysql:migrate -- --source=/home/seoops/seo-ops-storage/seo-ops-data.json --force
```

## 7. Verify MariaDB

```bash
npm run db:mysql:verify
```

Output hop le se co:

```json
{
  "ok": true,
  "storageKey": "app:data",
  "checksum": "...",
  "version": 1,
  "counts": {}
}
```

## 8. Bat MySQL driver va restart app

Sau khi verify thanh cong, sua `.env.local`:

```env
SEO_OPS_STORAGE_DRIVER=mysql
```

Restart Node.js app trong CloudPanel. Sau do kiem tra health endpoint:

```bash
curl https://seoops.sumu.id.vn/api/health
```

Health khong tra ve password. Cac truong quan trong:

```json
{
  "storageDriver": "mysql",
  "databaseProtected": true,
  "dbHost": "127.0.0.1",
  "dbDatabase": "seoops",
  "storageKey": "app:data"
}
```

## 9. Rollback ve JSON neu can

Neu can quay lai file JSON:

```env
SEO_OPS_STORAGE_DRIVER=json
```

Restart app. Vi script khong xoa JSON, app se doc lai `/home/seoops/seo-ops-storage/seo-ops-data.json`.

## 10. Export MariaDB ra JSON

De sao luu hoac rollback bang du lieu moi tu MariaDB:

```bash
npm run db:mysql:export
```

Mac dinh file se nam trong:

```text
exports/seo-ops-data-export-YYYY-MM-DD-HH-mm-ss.json
```

Hoac chi dinh duong dan rieng:

```bash
npm run db:mysql:export -- --output=/home/seoops/seo-ops-storage/seo-ops-data-from-mariadb.json
```

Lenh export khong ghi de file da ton tai.

## 11. Bang du lieu duoc tao

App tao hai bang:

```sql
seo_ops_storage
seo_ops_backups
```

Du lieu chinh nam trong `seo_ops_storage.storage_key = 'app:data'`. Moi lan backend ghi du lieu MySQL, gia tri cu duoc dua vao `seo_ops_backups` truoc, va giu theo `SEO_OPS_DB_BACKUPS`.

