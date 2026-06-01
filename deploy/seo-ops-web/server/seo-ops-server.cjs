const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createMcpHandler } = require('./seo-ops-mcp.cjs')

const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const packagedPublicDir = path.join(rootDir, 'deploy', 'seo-ops-web')
const publicDir = process.env.SEO_OPS_PUBLIC_DIR
  ? path.resolve(process.env.SEO_OPS_PUBLIC_DIR)
  : choosePublicDir()
const configuredDbDir = process.env.SEO_OPS_DB_DIR ? path.resolve(process.env.SEO_OPS_DB_DIR) : ''
const dbDir = configuredDbDir || path.join(rootDir, 'db')
const dbPath = path.join(dbDir, 'seo-ops-data.json')
const dbBackupDir = path.join(dbDir, 'backups')
const googleOAuthPath = path.join(dbDir, 'seo-ops-google-oauth.json')
const seedPath = path.join(publicDir, 'seo-ops-seed.json')
const port = Number(process.env.PORT || process.env.SEO_OPS_PORT || 5173)
const host = process.env.HOST || process.env.SEO_OPS_HOST || '0.0.0.0'
const apiToken = process.env.SEO_OPS_API_TOKEN || ''
const mcpToken = process.env.SEO_OPS_MCP_TOKEN || ''
const mcpConnectorKey = process.env.SEO_OPS_MCP_CONNECTOR_KEY || ''
const searchConsoleToken = process.env.SEO_OPS_SEARCH_CONSOLE_TOKEN || ''
const googleClientId = process.env.SEO_OPS_GOOGLE_CLIENT_ID || ''
const googleClientSecret = process.env.SEO_OPS_GOOGLE_CLIENT_SECRET || ''
const googleRedirectUri = process.env.SEO_OPS_GOOGLE_REDIRECT_URI || ''
const googleTokenSecret = process.env.SEO_OPS_GOOGLE_TOKEN_SECRET || ''
const basePath = normalizeBasePath(process.env.SEO_OPS_BASE_PATH || '/')
const productionMode = process.env.NODE_ENV === 'production'
const maxDbBackups = Math.max(0, Number(process.env.SEO_OPS_DB_BACKUPS || 50))
const googleScopes = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
]
const googleOAuthConfigured = Boolean(googleClientId && googleClientSecret && googleRedirectUri && googleTokenSecret)

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

function isInsideApp(targetPath) {
  const relativePath = path.relative(rootDir, targetPath)
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
}

function validateDatabaseLocation() {
  if (!productionMode) return
  if (!configuredDbDir) {
    throw new Error('Production requires SEO_OPS_DB_DIR outside the application directory. Configure external storage before starting the app.')
  }
  if (isInsideApp(dbDir)) {
    throw new Error(`Unsafe production database location: ${dbDir}. Set SEO_OPS_DB_DIR outside ${rootDir}.`)
  }
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

function dataCounts(data) {
  if (!data || typeof data !== 'object') return {}
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => Array.isArray(value))
      .map(([key, value]) => [key, value.length]),
  )
}

function importantRecordCount(data) {
  return Object.values(dataCounts(data)).reduce((total, count) => total + count, 0)
}

function isCleanDefaultData(data) {
  if (!data || !Array.isArray(data.users)) return false
  const counts = dataCounts(data)
  const hasOnlyDefaultAdmin = data.users.length <= 1 && data.users.every((user) => user?.email === 'admin@seo-ops.local' || user?.id === 'u-admin')
  return hasOnlyDefaultAdmin && Object.entries(counts).every(([key, count]) => key === 'users' || count === 0)
}

function assertSafeDbWrite(currentData, nextData) {
  if (!currentData) return
  if (importantRecordCount(currentData) > importantRecordCount(nextData) && isCleanDefaultData(nextData)) {
    const error = new Error('Refused to overwrite existing SEO Ops data with clean default data.')
    error.code = 'SEO_OPS_CLEAN_OVERWRITE'
    throw error
  }
}

function backupDb() {
  if (!maxDbBackups || !fs.existsSync(dbPath)) return
  fs.mkdirSync(dbBackupDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  fs.copyFileSync(dbPath, path.join(dbBackupDir, `seo-ops-data-${timestamp}.json`))
  const backups = fs.readdirSync(dbBackupDir)
    .filter((entry) => entry.startsWith('seo-ops-data-') && entry.endsWith('.json'))
    .map((entry) => {
      const fullPath = path.join(dbBackupDir, entry)
      return { fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs }
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
  for (const backup of backups.slice(maxDbBackups)) {
    fs.rmSync(backup.fullPath, { force: true })
  }
}

function writeDb(data) {
  ensureDb()
  const currentData = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf8')) : null
  assertSafeDbWrite(currentData, data)
  backupDb()
  const tempPath = `${dbPath}.tmp`
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2))
  fs.renameSync(tempPath, dbPath)
}

function readGoogleConnections() {
  ensureDb()
  if (!fs.existsSync(googleOAuthPath)) return { connections: {} }
  return JSON.parse(fs.readFileSync(googleOAuthPath, 'utf8'))
}

function writeGoogleConnections(data) {
  ensureDb()
  const tempPath = `${googleOAuthPath}.tmp`
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2))
  fs.renameSync(tempPath, googleOAuthPath)
}

function googleEncryptionKey() {
  if (!googleTokenSecret) throw new Error('Server chưa cấu hình SEO_OPS_GOOGLE_TOKEN_SECRET.')
  return crypto.createHash('sha256').update(googleTokenSecret).digest()
}

function encryptGoogleToken(token) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', googleEncryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.')
}

function decryptGoogleToken(value) {
  const [version, iv, tag, ciphertext] = String(value || '').split('.')
  if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('Dữ liệu kết nối Google không hợp lệ.')
  const decipher = crypto.createDecipheriv('aes-256-gcm', googleEncryptionKey(), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8')
}

function hasProject(projectId) {
  return Boolean(projectId && readDb().projects.some((project) => project.id === projectId))
}

function connectionForProject(projectId) {
  return readGoogleConnections().connections?.[projectId]
}

function requestOrigin(req) {
  const protocol = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() || (req.socket.encrypted ? 'https' : 'http')
  return `${protocol}://${req.headers.host || 'localhost'}`
}

function stateSecret() {
  return googleTokenSecret || googleClientSecret
}

function createGoogleState(projectId) {
  const payload = Buffer.from(JSON.stringify({ projectId, issuedAt: Date.now() })).toString('base64url')
  const signature = crypto.createHmac('sha256', stateSecret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function parseCookies(req) {
  return String(req.headers.cookie || '').split(';').reduce((cookies, item) => {
    const [name, ...parts] = item.trim().split('=')
    if (name) cookies[name] = decodeURIComponent(parts.join('='))
    return cookies
  }, {})
}

function verifyGoogleState(req, state) {
  const cookieState = parseCookies(req).seo_ops_google_oauth_state
  if (!state || !cookieState || state !== cookieState) throw new Error('Phiên kết nối Google không hợp lệ hoặc đã hết hạn.')
  const [payload, signature] = String(state).split('.')
  const expected = crypto.createHmac('sha256', stateSecret()).update(payload).digest('base64url')
  if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error('Không xác minh được yêu cầu kết nối Google.')
  }
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  if (!decoded.projectId || Date.now() - Number(decoded.issuedAt) > 10 * 60 * 1000) {
    throw new Error('Phiên kết nối Google đã hết hạn. Hãy thực hiện lại.')
  }
  return decoded
}

function googleCookie(req, value, maxAge) {
  const secure = requestOrigin(req).startsWith('https://') ? '; Secure' : ''
  return `seo_ops_google_oauth_state=${encodeURIComponent(value)}; Path=${basePath || '/'}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

function googleAppRedirect(status, projectId, message = '') {
  const params = new URLSearchParams({ google_oauth: status, projectId })
  if (message) params.set('message', message)
  return `${basePath || '/'}?${params.toString()}#projects`
}

async function googleTokenRequest(parameters) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(parameters),
  })
  const result = await response.json().catch(() => ({ error_description: 'Google trả về phản hồi token không hợp lệ.' }))
  if (!response.ok) {
    throw new Error(result.error_description || result.error || `Google OAuth trả về HTTP ${response.status}.`)
  }
  return result
}

async function googleAccessToken(projectId) {
  const connection = connectionForProject(projectId)
  if (!connection?.refreshToken) throw new Error('Dự án chưa kết nối tài khoản Google.')
  const refreshToken = decryptGoogleToken(connection.refreshToken)
  const result = await googleTokenRequest({
    client_id: googleClientId,
    client_secret: googleClientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  return result.access_token
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
      sendJson(res, 200, { ok: true, dbPath, publicDir, storage: 'json-db', basePath: basePath || '/', databaseProtected: !isInsideApp(dbDir), dataCounts: dataCounts(readDb()), mcpConfigured: mcp.configured, mcpConnectorKeyConfigured: mcp.connectorKeyConfigured, searchConsoleConfigured: Boolean(searchConsoleToken), googleOAuthConfigured })
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
        try {
          writeDb(nextData)
        } catch (error) {
          if (error?.code === 'SEO_OPS_CLEAN_OVERWRITE') {
            sendJson(res, 409, { ok: false, message: error.message })
            return
          }
          throw error
        }
        sendJson(res, 200, { ok: true, savedAt: new Date().toISOString() })
        return
      }

      sendJson(res, 405, { ok: false, message: 'Method not allowed' })
      return
    }

    if (scopedPathname === '/api/google/oauth/status') {
      const projectId = String(url.searchParams.get('projectId') || '')
      if (!hasProject(projectId)) {
        sendJson(res, 404, { ok: false, message: 'Không tìm thấy dự án.' })
        return
      }
      const connection = connectionForProject(projectId)
      sendJson(res, 200, {
        ok: true,
        configured: googleOAuthConfigured,
        connected: Boolean(connection?.refreshToken),
        connectedAt: connection?.connectedAt || '',
        scope: connection?.scope || '',
      })
      return
    }

    if (scopedPathname === '/api/google/oauth/start') {
      const projectId = String(url.searchParams.get('projectId') || '')
      if (!googleOAuthConfigured) {
        sendJson(res, 503, { ok: false, message: 'Server chưa cấu hình Google OAuth Client và khóa mã hóa token.' })
        return
      }
      if (!hasProject(projectId)) {
        sendJson(res, 404, { ok: false, message: 'Không tìm thấy dự án để kết nối Google.' })
        return
      }
      const state = createGoogleState(projectId)
      const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authorizationUrl.search = new URLSearchParams({
        client_id: googleClientId,
        redirect_uri: googleRedirectUri,
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
        scope: googleScopes.join(' '),
        state,
      }).toString()
      res.writeHead(302, {
        Location: authorizationUrl.toString(),
        'Set-Cookie': googleCookie(req, state, 600),
        'Cache-Control': 'no-store',
      })
      res.end()
      return
    }

    if (scopedPathname === '/api/google/oauth/callback') {
      let projectId = ''
      try {
        if (!googleOAuthConfigured) throw new Error('Server chưa cấu hình Google OAuth.')
        const verified = verifyGoogleState(req, String(url.searchParams.get('state') || ''))
        projectId = verified.projectId
        if (url.searchParams.get('error')) throw new Error(`Google từ chối cấp quyền: ${url.searchParams.get('error')}.`)
        const code = String(url.searchParams.get('code') || '')
        if (!code) throw new Error('Google không trả về authorization code.')
        const tokenResult = await googleTokenRequest({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: googleRedirectUri,
        })
        const existing = connectionForProject(projectId)
        if (!tokenResult.refresh_token && !existing?.refreshToken) {
          throw new Error('Google chưa cấp refresh token. Hãy ngắt quyền ứng dụng Google và kết nối lại.')
        }
        const storage = readGoogleConnections()
        storage.connections = storage.connections || {}
        storage.connections[projectId] = {
          refreshToken: tokenResult.refresh_token ? encryptGoogleToken(tokenResult.refresh_token) : existing.refreshToken,
          scope: tokenResult.scope || existing?.scope || googleScopes.join(' '),
          connectedAt: new Date().toISOString(),
        }
        writeGoogleConnections(storage)
        res.writeHead(302, {
          Location: googleAppRedirect('connected', projectId),
          'Set-Cookie': googleCookie(req, '', 0),
          'Cache-Control': 'no-store',
        })
        res.end()
      } catch (error) {
        const message = error.message || 'Không kết nối được Google.'
        res.writeHead(302, {
          Location: googleAppRedirect('error', projectId, message),
          'Set-Cookie': googleCookie(req, '', 0),
          'Cache-Control': 'no-store',
        })
        res.end()
      }
      return
    }

    if (scopedPathname === '/api/google/oauth/disconnect') {
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, message: 'Method not allowed' })
        return
      }
      const payload = JSON.parse(await readBody(req))
      const projectId = String(payload.projectId || '')
      const storage = readGoogleConnections()
      if (storage.connections?.[projectId]) {
        delete storage.connections[projectId]
        writeGoogleConnections(storage)
      }
      sendJson(res, 200, { ok: true, connected: false })
      return
    }

    if (scopedPathname === '/api/search-console/inspect') {
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, message: 'Method not allowed' })
        return
      }
      const payload = JSON.parse(await readBody(req))
      if (!payload.inspectionUrl || !payload.siteUrl) {
        sendJson(res, 400, { ok: false, message: 'Thiếu inspectionUrl hoặc siteUrl.' })
        return
      }
      let token = searchConsoleToken
      if (payload.projectId && googleOAuthConfigured && connectionForProject(String(payload.projectId))) {
        try {
          token = await googleAccessToken(String(payload.projectId))
        } catch (error) {
          sendJson(res, 401, { ok: false, message: `Không làm mới được quyền Google. ${error.message || ''}`.trim() })
          return
        }
      }
      if (!token) {
        sendJson(res, 503, { ok: false, message: 'Dự án chưa kết nối Google OAuth và server chưa cấu hình token Search Console dự phòng.' })
        return
      }
      const googleResponse = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
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

    if (scopedPathname === '/api/google/analytics/report') {
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, message: 'Method not allowed' })
        return
      }
      if (!googleOAuthConfigured) {
        sendJson(res, 503, { ok: false, message: 'Server chưa cấu hình Google OAuth.' })
        return
      }
      const payload = JSON.parse(await readBody(req))
      const projectId = String(payload.projectId || '')
      const propertyId = String(payload.propertyId || '').replace(/^properties\//, '').trim()
      if (!hasProject(projectId) || !propertyId) {
        sendJson(res, 400, { ok: false, message: 'Thiếu projectId hoặc GA4 Property ID.' })
        return
      }
      let token = ''
      try {
        token = await googleAccessToken(projectId)
      } catch (error) {
        sendJson(res, 401, { ok: false, message: `Dự án chưa có quyền Google hợp lệ. ${error.message || ''}`.trim() })
        return
      }
      const googleResponse = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: Array.isArray(payload.dateRanges) ? payload.dateRanges : [{ startDate: '14daysAgo', endDate: 'today' }],
          dimensions: Array.isArray(payload.dimensions) ? payload.dimensions : [{ name: 'date' }],
          metrics: Array.isArray(payload.metrics) ? payload.metrics : [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'engagementRate' },
          ],
        }),
      })
      const result = await googleResponse.json().catch(() => ({ ok: false, message: 'Google Analytics trả về dữ liệu không hợp lệ.' }))
      sendJson(res, googleResponse.status, result)
      return
    }

    serveStatic(req, res)
  } catch (error) {
    sendJson(res, 500, { ok: false, message: error.message || 'Server error' })
  }
})

validateDatabaseLocation()
ensureDb()
server.listen(port, host, () => {
  console.log(`SEO Ops running at http://${host}:${port}${basePath || '/'}`)
  console.log(`Shared data file: ${dbPath}`)
})
