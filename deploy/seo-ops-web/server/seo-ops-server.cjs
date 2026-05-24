const http = require('http')
const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const publicDir = path.join(rootDir, 'dist')
const dbDir = process.env.SEO_OPS_DB_DIR ? path.resolve(process.env.SEO_OPS_DB_DIR) : path.join(rootDir, 'db')
const dbPath = path.join(dbDir, 'seo-ops-data.json')
const seedPath = path.join(publicDir, 'seo-ops-seed.json')
const port = Number(process.env.PORT || process.env.SEO_OPS_PORT || 5173)
const host = process.env.HOST || process.env.SEO_OPS_HOST || '0.0.0.0'
const apiToken = process.env.SEO_OPS_API_TOKEN || ''
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
      sendJson(res, 200, { ok: true, dbPath, storage: 'json-db', basePath: basePath || '/' })
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
