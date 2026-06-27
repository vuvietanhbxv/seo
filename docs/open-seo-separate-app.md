# OpenSEO Separate App Runbook

This repository contains two apps that are deployed from the same Git repo:

- `SEO Ops` at the repository root.
- `OpenSEO` in `open-seo/`.

They must run as separate processes and keep separate runtime data.

## Runtime Layout

| App | Source folder | Default local port | Runtime data |
| --- | --- | --- | --- |
| SEO Ops | repo root | `5173` for Vite, app server via `npm run start` | `db/` |
| OpenSEO | `open-seo/` | `3001` | `open-seo/.wrangler/` |

Do not commit runtime data or secrets:

- `db/*.json`
- `open-seo/.env.local`
- `open-seo/.wrangler/`
- `open-seo/.logs/`
- `node_modules/`
- build output folders

## Local Setup

Install root SEO Ops dependencies:

```powershell
npm.cmd install
```

Install OpenSEO dependencies:

```powershell
npm.cmd run open-seo:install
```

Create `open-seo/.env.local`:

```env
AUTH_MODE=local_noauth
PORT=3001
CLOUDFLARE_INCLUDE_PROCESS_ENV=true
VITE_SHOW_DEVTOOLS=false
DATAFORSEO_API_KEY=base64_encoded_login_colon_password
```

Create the DataForSEO value:

```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("DATAFORSEO_LOGIN:DATAFORSEO_PASSWORD"))
```

Initialize the OpenSEO local D1 database:

```powershell
npm.cmd run open-seo:migrate
```

Run SEO Ops:

```powershell
npm.cmd run dev
```

Run OpenSEO:

```powershell
npm.cmd run open-seo:dev
```

OpenSEO MCP endpoint:

```text
http://127.0.0.1:3001/mcp
```

## Production On Windows VPS

Use two Windows services, one per app. NSSM is the simplest option.

Example OpenSEO start file at `C:\apps\seo\start-open-seo.cmd`:

```bat
@echo off
cd /d C:\apps\seo
set NODE_OPTIONS=--max-old-space-size=4096
npm.cmd run open-seo:preview
```

Example service:

```powershell
nssm install OpenSEO C:\Windows\System32\cmd.exe
nssm set OpenSEO AppParameters /c C:\apps\seo\start-open-seo.cmd
nssm set OpenSEO AppDirectory C:\apps\seo
nssm set OpenSEO AppStdout C:\apps\seo\open-seo\.logs\service.out.log
nssm set OpenSEO AppStderr C:\apps\seo\open-seo\.logs\service.err.log
nssm start OpenSEO
```

SEO Ops should have its own service and its own port. Do not run both apps in the same Node process.

## Reverse Proxy

Use two hostnames or paths that point to different local ports:

```text
seoops.example.com  -> 127.0.0.1:<seo-ops-port>
openseo.example.com -> 127.0.0.1:3001
```

OpenSEO self-host local mode uses `AUTH_MODE=local_noauth`, so protect the public hostname with Cloudflare Access, VPN, or another authentication layer. Do not expose port `3001` directly to the internet.

## Backup

Back up both runtime data locations:

```text
db/
open-seo/.wrangler/
```

Back up environment files separately and securely:

```text
open-seo/.env.local
```

## Update Flow

```powershell
git pull
npm.cmd install
npm.cmd run open-seo:install
npm.cmd run open-seo:migrate
npm.cmd run build
npm.cmd run open-seo:build
nssm restart SeoOps
nssm restart OpenSEO
```

If only OpenSEO changed, restart only `OpenSEO`.
