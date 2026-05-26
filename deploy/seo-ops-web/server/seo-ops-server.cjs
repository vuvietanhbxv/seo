const http = require('http')
const fs = require('fs')
const path = require('path')
const { createMcpHandler } = require('./seo-ops-mcp.cjs')

const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const packagedPublicDir = path.join(rootDir, 'deploy', 'seo-ops-web')
const publicDir = process.env.SEO_OPS_PUBLIC_DIR
  ? path.resolve(process.env.SEO_OPS_PUBLIC_DIR)
  : choosePublicDir()
const dbDir = process.env.SEO_OPS_DB_DIR ? path.resolve(process.env.SEO_OPS_DB_DIR) : path.join(rootDir, 'db')
const dbPath = path.join(dbDir, 'seo-ops-data.json')
const seedPath = path.join(publicDir, 'seo-ops-seed.json')
const port = Number(process.env.PORT || process.env.SEO_OPS_PORT || 5173)
const host = process.env.HOST || process.env.SEO_OPS_HOST || '0.0.0.0'
const apiToken = process.env.SEO_OPS_API_TOKEN || ''
const mcpToken = process.env.SEO_OPS_MCP_TOKEN || ''
const mcpConnectorKey = process.env.SEO_OPS_MCP_CONNECTOR_KEY || ''
const searchConsoleToken = process.env.SEO_OPS_SEARCH_CONSOLE_TOKEN || ''
const basePath = normalizeBasePath(process.env.SEO_OPS_BASE_PATH || '/')

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

function normalizeBasePath(value) {
  const raw = String(value || '/').trim()
  if (!raw || raw === '/') return ''
  return `/${raw.replace(/^\/+|\/+$/g, '')}`
}

function hasBuiltFrontend(dir) {
  const indexPath = path.join(dir, 'index.html')
  if (!fs.existsSync(indexPath)) return false
  const html = fs.readFileSync(indexPath, 'utf8')
  return html.includes('/assets/') && !html.includes('/src/main.tsx')
}

function choosePublicDir() {
  if (hasBuiltFrontend(distDir)) return distDir
  if (hasBuiltFrontend(rootDir)) return rootDir
  if (hasBuiltFrontend(packagedPublicDir)) return packagedPublicDir
  return rootDir
}

function stripBasePath(pathname) {
  if (!basePath) return pathname
  if (pathname === basePath) return '/'
  if (pathname.startsWith(`${basePath}/`)) return pathname.slice(basePath.length)
  return null
}

function ensureDb() {
  fs.mkdirSync(dbDir, { recursive: true })
  if (!fs.existsSync(dbPath)) {
    const seed = fs.existsSync(seedPath)
      ? JSON.parse(fs.readFileSync(seedPath, 'utf8'))
      : { data: { projects: [], keywords: [], tasks: [], transactions: [], users: [] } }
    const data = seed.data || seed
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
  }
}

function readDb() {
  ensureDb()
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
}

function writeDb(data) {
  ensureDb()
  const tempPath = `${dbPath}.tmp`
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2))
  fs.renameSync(tempPath, dbPath)
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(JSON.stringify(payload))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 25 * 1024 * 1024) {
        reject(new Error('Payload too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function isAuthorized(req) {
  if (!apiToken) return true
  const header = req.headers.authorization || ''
  return header === `Bearer ${apiToken}` || req.headers['x-seo-ops-server-token'] === apiToken
}

const mcp = createMcpHandler({ readDb, writeDb, token: mcpToken, connectorKey: mcpConnectorKey })

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const scopedPathname = stripBasePath(url.pathname)
  if (scopedPathname === null) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
    return
  }
  const cleanPath = decodeURIComponent(scopedPathname).replace(/^\/+/, '')
  const requestedPath = cleanPath ? path.join(publicDir, cleanPath) : path.join(publicDir, 'index.html')
  const resolvedPath = path.resolve(requestedPath)
  const safePath = resolvedPath.startsWith(publicDir) ? resolvedPath : path.join(publicDir, 'index.html')
  const filePath = fs.existsSync(safePath) && fs.statSync(safePath).isFile() ? safePath : path.join(publicDir, 'index.html')
  const ext = path.extname(filePath)
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  })
  fs.createReadStream(filePath).pipe(res)
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const scopedPathname = stripBasePath(url.pathname)

    if (scopedPathname === null) {
      sendJson(res, 404, { ok: false, message: `Use ${basePath || '/'} as base path` })
      return
    }

    if (scopedPathname === '/api/health') {
      sendJson(res, 200, { ok: true, dbPath, publicDir, storage: 'json-db', basePath: basePath || '/', mcpConfigured: mcp.configured, mcpConnectorKeyConfigured: mcp.connectorKeyConfigured, searchConsoleConfigured: Boolean(searchConsoleToken) })
      return
    }

    if (scopedPathname === '/mcp' || scopedPathname === '/api/mcp') {
      await mcp.handle(req, res, readBody, sendJson)
      return
    }

    if (scopedPathname === '/api/data') {
      if (!isAuthorized(req)) {
        sendJson(res, 401, { ok: false, message: 'Unauthorized' })
        return
      }

      if (req.method === 'GET') {
        sendJson(res, 200, { ok: true, data: readDb() })
        return
      }

      if (req.method === 'PUT' || req.method === 'POST') {
        const payload = JSON.parse(await readBody(req))
        const nextData = payload.data || payload
        if (!nextData || !Array.isArray(nextData.projects) || !Array.isArray(nextData.users)) {
          sendJson(res, 400, { ok: false, message: 'Invalid SEO Ops data shape' })
          return
        }
        writeDb(nextData)
        sendJson(res, 200, { ok: true, savedAt: new Date().toISOString() })
        return
      }

      sendJson(res, 405, { ok: false, message: 'Method not allowed' })
      return
    }

    if (scopedPathname === '/api/search-console/inspect') {
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, message: 'Method not allowed' })
        return
      }
      if (!searchConsoleToken) {
        sendJson(res, 503, { ok: false, message: 'Server chưa cấu hình SEO_OPS_SEARCH_CONSOLE_TOKEN.' })
        return
      }
      const payload = JSON.parse(await readBody(req))
      if (!payload.inspectionUrl || !payload.siteUrl) {
        sendJson(res, 400, { ok: false, message: 'Thiếu inspectionUrl hoặc siteUrl.' })
        return
      }
      const googleResponse = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${searchConsoleToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspectionUrl: String(payload.inspectionUrl),
          siteUrl: String(payload.siteUrl),
          languageCode: String(payload.languageCode || 'vi-VN'),
        }),
      })
      const result = await googleResponse.json().catch(() => ({ ok: false, message: 'Google Search Console trả về dữ liệu không hợp lệ.' }))
      sendJson(res, googleResponse.status, result)
      return
    }

    serveStatic(req, res)
  } catch (error) {
    sendJson(res, 500, { ok: false, message: error.message || 'Server error' })
  }
})

ensureDb()
server.listen(port, host, () => {
  console.log(`SEO Ops running at http://${host}:${port}${basePath || '/'}`)
  console.log(`Shared data file: ${dbPath}`)
})
