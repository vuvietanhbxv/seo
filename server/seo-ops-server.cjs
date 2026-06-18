const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { GoogleAuth } = require('google-auth-library')
const { createMcpHandler } = require('./seo-ops-mcp.cjs')

const rootDir = path.resolve(__dirname, '..')
loadDotEnvFile(path.join(rootDir, '.env'))
loadDotEnvFile(path.join(rootDir, '.env.local'))
const distDir = path.join(rootDir, 'dist')
const packagedPublicDir = path.join(rootDir, 'deploy', 'seo-ops-web')
const publicDir = process.env.SEO_OPS_PUBLIC_DIR
  ? path.resolve(process.env.SEO_OPS_PUBLIC_DIR)
  : choosePublicDir()
const configuredDbDir = process.env.SEO_OPS_DB_DIR ? path.resolve(process.env.SEO_OPS_DB_DIR) : ''
const dbDir = configuredDbDir || path.join(rootDir, 'db')
const dbPath = path.join(dbDir, 'seo-ops-data.json')
const dbBackupDir = path.join(dbDir, 'backups')
const toolOutputDir = process.env.SEO_OPS_TOOL_OUTPUT_DIR
  ? path.resolve(process.env.SEO_OPS_TOOL_OUTPUT_DIR)
  : path.join(dbDir, 'tools')
const entityGuideDir = process.env.SEO_OPS_ENTITY_GUIDE_DIR
  ? path.resolve(process.env.SEO_OPS_ENTITY_GUIDE_DIR)
  : path.join(dbDir, 'Entity Guide')
const legacyEntityGuideDir = path.join(dbDir, 'entity-guides')
const entityGuideSearchDirs = [...new Set([entityGuideDir, legacyEntityGuideDir].map((item) => path.resolve(item)))]
const toolConfigPath = path.join(dbDir, 'seo-ops-tool-config.json')
const toolVertexCredentialsPath = path.join(dbDir, 'seo-ops-vertex-credentials.json')
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
const googleDriveApiKey = process.env.SEO_OPS_GOOGLE_DRIVE_API_KEY || process.env.GOOGLE_DRIVE_API_KEY || ''
const claudeGatewayBaseUrl = process.env.CLAUDE_GATEWAY_BASE_URL || process.env.SEO_OPS_CLAUDE_GATEWAY_BASE_URL || 'https://1gw.gwai.cloud'
const claudeGatewayAuthHeader = process.env.CLAUDE_GATEWAY_AUTH_HEADER || process.env.SEO_OPS_CLAUDE_GATEWAY_AUTH_HEADER || 'x-api-key'
const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.SEO_OPS_CLAUDE_API_KEY || ''
const claudeModel = process.env.CLAUDE_MODEL || process.env.SEO_OPS_CLAUDE_MODEL || 'claude-3-5-sonnet'
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.SEO_OPS_GEMINI_API_KEY || ''
const geminiImageModel = process.env.GEMINI_IMAGE_MODEL || process.env.SEO_OPS_GEMINI_IMAGE_MODEL || 'imagen-4.0-fast-generate-001'
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL || process.env.SEO_OPS_GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com'
const articleImageProvider = process.env.ARTICLE_IMAGE_PROVIDER || process.env.SEO_OPS_ARTICLE_IMAGE_PROVIDER || 'google-ai'
const vertexProjectId = process.env.VERTEX_AI_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.SEO_OPS_VERTEX_PROJECT_ID || ''
const vertexRegion = process.env.VERTEX_AI_REGION || process.env.GOOGLE_CLOUD_LOCATION || process.env.SEO_OPS_VERTEX_REGION || 'us-central1'
const vertexImageModel = process.env.VERTEX_AI_IMAGE_MODEL || process.env.SEO_OPS_VERTEX_IMAGE_MODEL || 'imagen-4.0-fast-generate-001'
const vertexCredentialsPath = process.env.VERTEX_AI_CREDENTIALS_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.SEO_OPS_VERTEX_CREDENTIALS_PATH || ''
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
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/)
    if (!match) continue
    const key = match[1]
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
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

function isInsideDirectory(parentPath, targetPath) {
  const relativePath = path.relative(parentPath, targetPath)
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

function detectLargeDataDrop(currentData, nextData) {
  const currentCounts = dataCounts(currentData)
  const nextCounts = dataCounts(nextData)
  const protectedKeys = [
    'projects',
    'keywords',
    'tasks',
    'users',
    'seoEntities',
    'seoEntityPlatforms',
    'seoEntityLinks',
    'seoBacklinks',
    'internalNotes',
    'socialPosts',
  ]

  for (const key of protectedKeys) {
    const currentCount = currentCounts[key] || 0
    const nextCount = nextCounts[key] || 0
    if (currentCount >= 10 && nextCount < Math.floor(currentCount * 0.5)) {
      return `${key}: ${currentCount} -> ${nextCount}`
    }
  }

  const currentImportant = importantRecordCount(currentData)
  const nextImportant = importantRecordCount(nextData)
  if (currentImportant >= 100 && nextImportant < Math.floor(currentImportant * 0.65)) {
    return `total records: ${currentImportant} -> ${nextImportant}`
  }

  return ''
}

function assertSafeDbWrite(currentData, nextData, options = {}) {
  if (!currentData) return
  if (options.allowLargeOverwrite) return
  if (importantRecordCount(currentData) > importantRecordCount(nextData) && isCleanDefaultData(nextData)) {
    const error = new Error('Refused to overwrite existing SEO Ops data with clean default data.')
    error.code = 'SEO_OPS_CLEAN_OVERWRITE'
    throw error
  }
  const largeDrop = detectLargeDataDrop(currentData, nextData)
  if (largeDrop) {
    const error = new Error(`Refused to overwrite existing SEO Ops data because the new payload is much smaller (${largeDrop}). Use Import backup JSON to intentionally replace production data.`)
    error.code = 'SEO_OPS_LARGE_DATA_DROP'
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

function writeDb(data, options = {}) {
  ensureDb()
  const currentData = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf8')) : null
  assertSafeDbWrite(currentData, data, options)
  backupDb()
  const tempPath = `${dbPath}.tmp`
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2))
  fs.renameSync(tempPath, dbPath)
}

const taskDeadlineDayMs = 24 * 60 * 60 * 1000

function parseTaskDeadline(value) {
  const raw = String(value || '').trim()
  if (!raw) return NaN
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? `${raw}T20:00:00+07:00`
    : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)
      ? `${raw}:00+07:00`
      : raw
  return Date.parse(normalized)
}

function formatTaskDeadline(value) {
  const timestamp = parseTaskDeadline(value)
  if (!Number.isFinite(timestamp)) return String(value || '')
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).format(new Date(timestamp))
}

function applyTaskDeadlineAutomation(data, now = new Date()) {
  if (!data || !Array.isArray(data.tasks)) return { data, changed: false }
  const nowIso = now.toISOString()
  const nowMs = now.getTime()
  const projects = Array.isArray(data.projects) ? data.projects : []
  const users = Array.isArray(data.users) ? data.users : []
  const projectById = new Map(projects.map((project) => [project.id, project]))
  const adminIds = users.filter((user) => user.active && user.role === 'Quản trị viên').map((user) => user.id)
  const notifications = []
  const activityLogs = []
  let changed = false

  const addEvent = (task, recipientIds, title, message, action) => {
    Array.from(new Set(recipientIds.filter(Boolean))).forEach((recipientId) => {
      notifications.push({
        id: `noti-${crypto.randomUUID()}`,
        recipientId,
        title,
        message,
        projectId: task.projectId,
        taskId: task.id,
        linkView: 'tasks',
        createdAt: nowIso,
      })
    })
    activityLogs.push({
      id: `log-${crypto.randomUUID()}`,
      actorId: '',
      actorName: 'Hệ thống deadline',
      action,
      target: task.title,
      at: nowIso,
    })
  }

  const tasks = data.tasks.map((task) => {
    if (['Hoàn thành', 'Đã hủy'].includes(task.status)) return task
    const deadlineValue = task.deadlineAt || task.dueDate
    const deadlineMs = parseTaskDeadline(deadlineValue)
    if (!Number.isFinite(deadlineMs)) return task
    const diffMs = nowMs - deadlineMs
    const projectOwnerId = projectById.get(task.projectId)?.ownerId || ''
    const adminRecipients = [...adminIds, projectOwnerId]

    if (diffMs >= 7 * taskDeadlineDayMs && !task.cancelledAt) {
      changed = true
      addEvent(
        task,
        [task.assigneeId, ...adminRecipients],
        'Task đã bị hủy do quá hạn',
        `Task "${task.title}" đã quá hạn 7 ngày và được hệ thống chuyển sang trạng thái Đã hủy.`,
        'Tự động hủy task quá hạn',
      )
      return { ...task, status: 'Đã hủy', cancelledAt: nowIso }
    }
    if (diffMs >= 4 * taskDeadlineDayMs && !task.overdueEscalatedAt) {
      changed = true
      addEvent(
        task,
        [task.assigneeId, ...adminRecipients],
        'Yêu cầu hoàn thành task trong 3 ngày',
        `Task "${task.title}" đã quá hạn 4 ngày. Vui lòng hoàn thành trước ${formatTaskDeadline(new Date(deadlineMs + 7 * taskDeadlineDayMs).toISOString())}.`,
        'Cảnh báo task quá hạn 4 ngày',
      )
      return { ...task, overdueEscalatedAt: nowIso }
    }
    if (diffMs <= 0 && Math.abs(diffMs) <= taskDeadlineDayMs && !task.deadlineReminderAt) {
      changed = true
      addEvent(
        task,
        [task.assigneeId],
        'Task sắp tới deadline',
        `Task "${task.title}" cần hoàn thành trước ${formatTaskDeadline(deadlineValue)}.`,
        'Nhắc task sắp tới deadline',
      )
      return { ...task, deadlineReminderAt: nowIso }
    }
    return task
  })

  if (!changed) return { data, changed: false }
  return {
    changed: true,
    data: {
      ...data,
      tasks,
      notifications: [...notifications, ...(data.notifications || [])].slice(0, 500),
      activityLogs: [...activityLogs, ...(data.activityLogs || [])].slice(0, 300),
    },
  }
}

function runTaskDeadlineAutomation() {
  const currentData = readDb()
  const result = applyTaskDeadlineAutomation(currentData)
  if (result.changed) writeDb(result.data)
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

function readToolConfig() {
  ensureDb()
  if (!fs.existsSync(toolConfigPath)) return { articleComposer: {} }
  const parsed = JSON.parse(fs.readFileSync(toolConfigPath, 'utf8'))
  return parsed && typeof parsed === 'object' ? parsed : { articleComposer: {} }
}

function writeToolConfig(data) {
  ensureDb()
  const tempPath = `${toolConfigPath}.tmp`
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2))
  fs.renameSync(tempPath, toolConfigPath)
}

function normalizeArticleImageProvider(value) {
  return String(value || '').trim() === 'vertex-ai' ? 'vertex-ai' : 'google-ai'
}

function resolveMaybePath(value) {
  const candidate = String(value || '').trim()
  return candidate ? path.resolve(candidate) : ''
}

function vertexCredentialProjectId(credentialsPath) {
  try {
    if (!credentialsPath || !fs.existsSync(credentialsPath)) return ''
    const parsed = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
    return String(parsed.project_id || '').trim()
  } catch {
    return ''
  }
}

function normalizeVertexProjectId(projectId, credentialsPath) {
  const candidate = String(projectId || '').trim()
  const credentialProjectId = vertexCredentialProjectId(credentialsPath)
  if (!candidate) return credentialProjectId
  if (/^\d{16,}$/.test(candidate) && credentialProjectId) return credentialProjectId
  return candidate
}

function isVertexConfigured(config) {
  return Boolean(normalizeVertexProjectId(config.vertexProjectId, config.vertexCredentialsPath) && config.vertexRegion && config.vertexImageModel && config.vertexCredentialsPath)
}

function isArticleImageConfigured(config) {
  return config.imageProvider === 'vertex-ai' ? isVertexConfigured(config) : Boolean(config.geminiApiKey)
}

function applyImageProviderOverride(config, value) {
  const provider = String(value || '').trim()
  return provider ? { ...config, imageProvider: normalizeArticleImageProvider(provider) } : config
}

function articleComposerConfig() {
  const stored = readToolConfig().articleComposer || {}
  const storedVertexCredentialsPath = resolveMaybePath(stored.vertexCredentialsPath)
  const envVertexCredentialsPath = resolveMaybePath(vertexCredentialsPath)
  const activeVertexCredentialsPath = storedVertexCredentialsPath || envVertexCredentialsPath
  const activeVertexProjectId = normalizeVertexProjectId(stored.vertexProjectId || vertexProjectId, activeVertexCredentialsPath)
  return {
    imageProvider: normalizeArticleImageProvider(stored.imageProvider || articleImageProvider),
    claudeGatewayBaseUrl: stored.claudeGatewayBaseUrl || claudeGatewayBaseUrl,
    claudeGatewayAuthHeader: stored.claudeGatewayAuthHeader || claudeGatewayAuthHeader,
    claudeApiKey: stored.claudeApiKey || claudeApiKey,
    claudeModel: stored.claudeModel || claudeModel,
    geminiApiKey: stored.geminiApiKey || geminiApiKey,
    geminiImageModel: normalizeGeminiImageModel(stored.geminiImageModel || geminiImageModel),
    geminiApiBaseUrl: stored.geminiApiBaseUrl || geminiApiBaseUrl,
    vertexProjectId: activeVertexProjectId,
    vertexRegion: stored.vertexRegion || vertexRegion,
    vertexImageModel: normalizeGeminiImageModel(stored.vertexImageModel || vertexImageModel),
    vertexCredentialsPath: activeVertexCredentialsPath,
    updatedAt: stored.updatedAt || '',
    storedClaudeConfigured: Boolean(stored.claudeApiKey),
    storedGeminiConfigured: Boolean(stored.geminiApiKey),
    storedVertexCredentialsConfigured: Boolean(storedVertexCredentialsPath),
    envClaudeConfigured: Boolean(claudeApiKey),
    envGeminiConfigured: Boolean(geminiApiKey),
    envVertexCredentialsConfigured: Boolean(envVertexCredentialsPath),
  }
}

function publicArticleComposerConfig() {
  const config = articleComposerConfig()
  return {
    articleComposerConfigured: Boolean(config.claudeApiKey && isArticleImageConfigured(config)),
    claudeConfigured: Boolean(config.claudeApiKey),
    geminiConfigured: Boolean(config.geminiApiKey),
    vertexConfigured: isVertexConfigured(config),
    imageProvider: config.imageProvider,
    claudeGatewayBaseUrl: config.claudeGatewayBaseUrl,
    claudeGatewayAuthHeader: config.claudeGatewayAuthHeader,
    claudeModel: config.claudeModel,
    geminiImageModel: config.geminiImageModel,
    geminiApiBaseUrl: config.geminiApiBaseUrl,
    vertexProjectId: config.vertexProjectId,
    vertexRegion: config.vertexRegion,
    vertexImageModel: config.vertexImageModel,
    outputDir: toolOutputDir,
    updatedAt: config.updatedAt,
    storedClaudeConfigured: config.storedClaudeConfigured,
    storedGeminiConfigured: config.storedGeminiConfigured,
    storedVertexCredentialsConfigured: config.storedVertexCredentialsConfigured,
    envClaudeConfigured: config.envClaudeConfigured,
    envGeminiConfigured: config.envGeminiConfigured,
    envVertexCredentialsConfigured: config.envVertexCredentialsConfigured,
    logs: publicArticleToolLogs(),
  }
}

function publicArticleToolLogs() {
  const storage = readToolConfig()
  return Array.isArray(storage.articleComposerLogs) ? storage.articleComposerLogs.slice(0, 80) : []
}

function articleHistoryRecord(result) {
  return {
    runId: result.runId,
    topic: result.topic,
    presentationStyle: result.presentationStyle,
    imageProvider: result.imageProvider,
    htmlUrl: result.htmlUrl,
    sourceUrl: result.sourceUrl,
    outputDir: result.outputDir,
    images: Array.isArray(result.images) ? result.images : [],
    imageErrors: Array.isArray(result.imageErrors) ? result.imageErrors : [],
    generatedAt: result.generatedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function publicArticleHistory() {
  const storage = readToolConfig()
  const history = Array.isArray(storage.articleComposerHistory) ? storage.articleComposerHistory : []
  return history.slice(0, 120)
}

function upsertArticleHistory(result) {
  const storage = readToolConfig()
  const history = Array.isArray(storage.articleComposerHistory) ? storage.articleComposerHistory : []
  const record = articleHistoryRecord(result)
  storage.articleComposerHistory = [record, ...history.filter((item) => item.runId !== record.runId)].slice(0, 150)
  writeToolConfig(storage)
  return record
}

function updateArticleHistoryRecord(runId, updater) {
  const storage = readToolConfig()
  const history = Array.isArray(storage.articleComposerHistory) ? storage.articleComposerHistory : []
  const current = history.find((item) => item.runId === runId) || { runId, generatedAt: new Date().toISOString() }
  const next = { ...current, ...updater(current), updatedAt: new Date().toISOString() }
  storage.articleComposerHistory = [next, ...history.filter((item) => item.runId !== runId)].slice(0, 150)
  writeToolConfig(storage)
  return next
}

function appendArticleToolLog(entry) {
  const storage = readToolConfig()
  const logs = Array.isArray(storage.articleComposerLogs) ? storage.articleComposerLogs : []
  const log = {
    id: crypto.randomBytes(8).toString('hex'),
    at: new Date().toISOString(),
    action: entry.action || 'tool',
    status: entry.status || 'info',
    message: entry.message || '',
    details: Array.isArray(entry.details) ? entry.details : [],
  }
  storage.articleComposerLogs = [log, ...logs].slice(0, 100)
  writeToolConfig(storage)
  return log
}

function updateArticleComposerConfig(payload) {
  const storage = readToolConfig()
  const next = { ...(storage.articleComposer || {}) }
  for (const field of ['claudeGatewayBaseUrl', 'claudeGatewayAuthHeader', 'claudeModel', 'geminiImageModel', 'geminiApiBaseUrl', 'vertexProjectId', 'vertexRegion', 'vertexImageModel']) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      next[field] = field === 'geminiImageModel' || field === 'vertexImageModel'
        ? normalizeGeminiImageModel(payload[field])
        : String(payload[field] || '').trim()
    }
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'imageProvider')) {
    next.imageProvider = normalizeArticleImageProvider(payload.imageProvider)
  }
  if (String(payload.vertexCredentialsPath || '').trim()) {
    next.vertexCredentialsPath = path.resolve(String(payload.vertexCredentialsPath).trim())
  }
  if (String(payload.claudeApiKey || '').trim()) next.claudeApiKey = String(payload.claudeApiKey).trim()
  if (String(payload.geminiApiKey || '').trim()) next.geminiApiKey = String(payload.geminiApiKey).trim()
  if (String(payload.vertexServiceAccountJson || '').trim()) {
    const parsed = JSON.parse(String(payload.vertexServiceAccountJson))
    if (!parsed.client_email || !parsed.private_key) throw new Error('Service Account JSON không hợp lệ: thiếu client_email hoặc private_key.')
    ensureDb()
    fs.writeFileSync(toolVertexCredentialsPath, JSON.stringify(parsed, null, 2), { mode: 0o600 })
    next.vertexCredentialsPath = toolVertexCredentialsPath
    if (parsed.project_id && (!next.vertexProjectId || /^\d{16,}$/.test(String(next.vertexProjectId)))) next.vertexProjectId = parsed.project_id
  }
  if (payload.clearClaudeApiKey) delete next.claudeApiKey
  if (payload.clearGeminiApiKey) delete next.geminiApiKey
  if (payload.clearVertexCredentials) {
    if (next.vertexCredentialsPath && path.resolve(next.vertexCredentialsPath) === toolVertexCredentialsPath && fs.existsSync(toolVertexCredentialsPath)) {
      fs.unlinkSync(toolVertexCredentialsPath)
    }
    delete next.vertexCredentialsPath
  }
  next.updatedAt = new Date().toISOString()
  storage.articleComposer = next
  writeToolConfig(storage)
  appendArticleToolLog({
    action: 'config',
    status: 'success',
    message: 'Đã lưu cấu hình công cụ Viết bài.',
  })
  return publicArticleComposerConfig()
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function jsonErrorMessage(payload, fallback) {
  return payload?.error?.message || payload?.error_description || payload?.message || fallback
}

function apiStatusHint(label, status) {
  if (status === 401) return `${label} HTTP 401: API key không hợp lệ, đã hết hạn, bị nhập sai hoặc auth header chưa đúng.`
  if (status === 403) return `${label} HTTP 403: API key hợp lệ nhưng chưa có quyền dùng model/API này.`
  if (status === 429) return `${label} HTTP 429: đã vượt quota hoặc giới hạn request.`
  return `${label} tra ve HTTP ${status}.`
}

async function fetchJsonWithRetry(url, options, label, config = {}) {
  const retries = Number(config.retries ?? 2)
  const timeoutMs = Number(config.timeoutMs ?? 90000)
  const retryableStatuses = new Set([408, 429, 500, 502, 503, 504])

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      const text = await response.text()
      let payload = {}
      if (text) {
        try {
          payload = JSON.parse(text)
        } catch {
          payload = { message: text.replace(/\s+/g, ' ').trim().slice(0, 400) }
        }
      }
      if (response.ok) return payload
      const message = jsonErrorMessage(payload, apiStatusHint(label, response.status))
      if (attempt < retries && retryableStatuses.has(response.status)) {
        await sleep(1200 * (attempt + 1))
        continue
      }
      throw new Error(message)
    } catch (error) {
      const message = error.name === 'AbortError' ? `${label} qua thoi gian cho phan hoi.` : (error.message || `${label} that bai.`)
      if (attempt < retries && (error.name === 'AbortError' || /fetch|network|socket|timeout/i.test(message))) {
        await sleep(1200 * (attempt + 1))
        continue
      }
      throw new Error(message)
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error(`${label} that bai.`)
}

function slugifyFileName(value) {
  const slug = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
  return slug || 'seo-article'
}

function safeToolPublicUrl(relativePath) {
  return `${basePath || ''}/tool-output/${String(relativePath).replace(/\\/g, '/')}`
}

function extensionForMimeType(mimeType) {
  if (/jpe?g/i.test(mimeType)) return '.jpg'
  if (/webp/i.test(mimeType)) return '.webp'
  if (/gif/i.test(mimeType)) return '.gif'
  return '.png'
}

function normalizeGeminiImageModel(value) {
  const model = String(value || 'imagen-4.0-fast-generate-001').trim().replace(/^models\//, '')
  if (!model) return 'imagen-4.0-fast-generate-001'
  if (
    model === 'gemini-2.5-flash-image' ||
    model === 'gemini-2.5-flash-preview-image' ||
    model === 'gemini-2.5-flash-image-preview' ||
    model === 'imagen-4.0-fast-generate'
  ) {
    return 'imagen-4.0-fast-generate-001'
  }
  return model
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function normalizePresentationStyle(value) {
  if (value === 'wordpress') return 'wordpress'
  return value === 'raw' ? 'raw' : 'professional'
}

function buildSeoArticlePrompt(payload) {
  const keyword = String(payload.keyword || payload.topic || '').trim()
  const audience = String(payload.targetAudience || 'nguoi doc Viet Nam quan tam toi SEO va san pham/dich vu lien quan').trim()
  const tone = String(payload.tone || 'chuyen nghiep, ro rang, de doc').trim()
  const wordCount = Math.max(800, Math.min(6000, Number(payload.wordCount) || 1800))
  const presentationStyle = normalizePresentationStyle(payload.presentationStyle)
  const presentationPrompt = (() => {
    if (presentationStyle === 'wordpress') {
      return [
        '- Kieu trinh bay: WordPress (HTML).',
        '- Tra ve HTML fragment san sang copy vao bai viet WordPress, tuyet doi khong tra ve <!doctype>, <html>, <head> hoac <body>.',
        '- Bat dau bang mot the <style> chua CSS dep, responsive, sau do la <article class="seoops-wp-article">...</article>.',
        '- Toan bo CSS phai duoc scope trong .seoops-wp-article de khong lam hong theme WordPress hien co.',
        '- Dung bo cuc dep, chuyen nghiep: muc luc, khoi noi bat, bang thong tin, FAQ, callout, nut CTA neu phu hop.',
        '- Co the dung icon bang ky tu/emoji nhe hoac inline text, khong dung JavaScript, iframe, form, external CSS/JS, external image URL.',
        '- HTML phai hop le de dan vao block Custom HTML cua WordPress.',
      ]
    }
    return presentationStyle === 'professional'
      ? [
        '- Kieu trinh bay: Trinh bay chuyen nghiep.',
        '- Tra ve HTML hoan chinh co <!doctype html>, <html>, <head>, <meta charset="utf-8">, <title>, <style> va <body>.',
        '- Viet HTML + CSS dep mat, bo cuc chuan SEO, de doc, co muc luc, section ro rang, card/box thong tin khi can.',
        '- Dung mau sac truc quan, icon minh hoa bang ky tu hoac inline element nhe, khong dung thu vien ngoai, khong dung anh ngoai.',
        '- CSS phai nam trong the <style>, responsive cho mobile, khong dung script.',
      ]
      : [
        '- Kieu trinh bay: Raw - Van ban thuan.',
        '- Tra ve HTML toi gian, gan nhu van ban thuan, khong CSS trang tri, khong icon, khong mau sac, khong card.',
        '- Chi dung cac the noi dung co ban: article, h1, h2, h3, p, ul, ol, li, strong, em, table neu can.',
        '- Van phai la HTML hop le de co the preview trong trinh duyet.',
      ]
  })()

  return [
    'Ban la chuyen gia content SEO tieng Viet.',
    `Hay viet mot bai viet HTML chuan SEO, chi tiet, huu ich dua tren tu khoa/chu de: "${keyword}".`,
    `Doi tuong doc: ${audience}.`,
    `Giong van: ${tone}. Do dai muc tieu khoang ${wordCount} tu.`,
    '',
    'Yeu cau bat buoc:',
    ...presentationPrompt,
    '- Viet bang tieng Viet tu nhien, co H1, muc luc neu phu hop, cac H2/H3 ro rang.',
    '- Toi uu title, meta description, intent tim kiem, internal link goi y va FAQ neu phu hop.',
    '- Khong boc noi dung trong code block.',
    '- NGAY SAU MOI the <h2>, BAT BUOC chen dung mot dong rieng theo cu phap chinh xac:',
    '[IMAGE_PROMPT: <Mo ta chi tiet bang tieng Anh de tao anh>]',
    '- Mo ta anh phai bang tieng Anh, cu the ve boi canh, chu the, phong cach, anh sang, ti le khung hinh; khong chen chu noi tren anh neu khong can.',
    '- Khong de IMAGE_PROMPT ben trong thuoc tinh HTML.',
  ].join('\n')
}

function extractClaudeText(payload) {
  if (typeof payload?.completion === 'string') return payload.completion
  if (typeof payload?.text === 'string') return payload.text
  if (Array.isArray(payload?.content)) {
    return payload.content
      .map((part) => {
        if (typeof part === 'string') return part
        if (typeof part?.text === 'string') return part.text
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

function stripCodeFence(value) {
  return String(value || '')
    .trim()
    .replace(/^```(?:html|markdown|md)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

async function createClaudeArticleHtml(payload, config) {
  const baseUrl = String(config.claudeGatewayBaseUrl || '').replace(/\/+$/, '')
  if (!baseUrl) throw new Error('Chua cau hinh Claude Gateway base URL.')
  const response = await fetchJsonWithRetry(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      [config.claudeGatewayAuthHeader]: config.claudeApiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.claudeModel,
      max_tokens: 7000,
      temperature: 0.7,
      messages: [{ role: 'user', content: buildSeoArticlePrompt(payload) }],
    }),
  }, 'Claude Gateway', { timeoutMs: 120000, retries: 2 })
  const html = stripCodeFence(extractClaudeText(response))
  if (!html) throw new Error('Claude khong tra ve noi dung bai viet hop le.')
  return html
}

function extractImagePromptMarkers(markdown) {
  const markers = []
  const pattern = /\[IMAGE_PROMPT:\s*([\s\S]*?)\]/g
  let match = pattern.exec(markdown)
  while (match) {
    markers.push({ marker: match[0], prompt: match[1].trim() })
    match = pattern.exec(markdown)
  }
  return markers
}

function extractGeminiInlineImage(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : []
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : []
    for (const part of parts) {
      const inline = part?.inlineData || part?.inline_data
      if (inline?.data) {
        return {
          data: inline.data,
          mimeType: inline.mimeType || inline.mime_type || 'image/png',
        }
      }
    }
  }
  throw new Error('Gemini khong tra ve anh inlineData.')
}

function extractImagenPredictionImage(payload) {
  const predictions = Array.isArray(payload?.predictions) ? payload.predictions : []
  for (const prediction of predictions) {
    const data = prediction?.bytesBase64Encoded || prediction?.image?.bytesBase64Encoded || prediction?.imageBytes
    if (data) {
      return {
        data,
        mimeType: prediction?.mimeType || prediction?.image?.mimeType || 'image/png',
      }
    }
  }
  throw new Error('Imagen khong tra ve predictions[0].bytesBase64Encoded.')
}

async function createGeminiImage(prompt, index, imagesDir, config) {
  const cleanModel = normalizeGeminiImageModel(config.geminiImageModel)
  const endpoint = `${String(config.geminiApiBaseUrl).replace(/\/+$/, '')}/v1beta/models/${encodeURIComponent(cleanModel)}:predict?key=${encodeURIComponent(config.geminiApiKey)}`
  const response = await fetchJsonWithRetry(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '16:9',
      },
    }),
  }, 'Imagen API', { timeoutMs: 120000, retries: 2 })
  const image = extractImagenPredictionImage(response)
  const extension = extensionForMimeType(image.mimeType)
  const fileName = `image-${String(index + 1).padStart(2, '0')}${extension}`
  const filePath = path.join(imagesDir, fileName)
  fs.writeFileSync(filePath, Buffer.from(image.data, 'base64'))
  return { fileName, filePath, mimeType: image.mimeType }
}

async function vertexAccessToken(config) {
  if (!config.vertexCredentialsPath) throw new Error('Chưa có file Service Account JSON cho Vertex AI.')
  if (!fs.existsSync(config.vertexCredentialsPath)) throw new Error(`Không tìm thấy file credentials: ${config.vertexCredentialsPath}`)
  const auth = new GoogleAuth({
    keyFile: config.vertexCredentialsPath,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const client = await auth.getClient()
  const tokenResponse = await client.getAccessToken()
  const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token
  if (!token) throw new Error('Không lấy được access token từ Service Account JSON.')
  return token
}

function vertexPredictEndpoint(config) {
  const projectId = normalizeVertexProjectId(config.vertexProjectId, config.vertexCredentialsPath)
  if (!projectId) throw new Error('Chưa cấu hình Vertex AI Project ID.')
  if (!config.vertexRegion) throw new Error('Chưa cấu hình Vertex AI Region.')
  const cleanModel = normalizeGeminiImageModel(config.vertexImageModel)
  return `https://${encodeURIComponent(config.vertexRegion)}-aiplatform.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/${encodeURIComponent(config.vertexRegion)}/publishers/google/models/${encodeURIComponent(cleanModel)}:predict`
}

async function createVertexImage(prompt, index, imagesDir, config) {
  const token = await vertexAccessToken(config)
  const endpoint = vertexPredictEndpoint(config)
  const response = await fetchJsonWithRetry(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '16:9',
        enhancePrompt: false,
        outputOptions: {
          mimeType: 'image/png',
        },
      },
    }),
  }, 'Vertex AI Imagen API', { timeoutMs: 120000, retries: 2 })
  const image = extractImagenPredictionImage(response)
  const extension = extensionForMimeType(image.mimeType)
  const fileName = `image-${String(index + 1).padStart(2, '0')}${extension}`
  const filePath = path.join(imagesDir, fileName)
  fs.writeFileSync(filePath, Buffer.from(image.data, 'base64'))
  return { fileName, filePath, mimeType: image.mimeType }
}

async function createArticleImage(prompt, index, imagesDir, config) {
  return config.imageProvider === 'vertex-ai'
    ? createVertexImage(prompt, index, imagesDir, config)
    : createGeminiImage(prompt, index, imagesDir, config)
}

function generatedImageFigure(image, index) {
  return `<figure class="seo-generated-image" data-image-index="${index}"><img src="${image.fileUrl}" alt="Anh minh hoa SEO" loading="lazy"><figcaption>Anh minh hoa cho noi dung SEO</figcaption></figure>`
}

function failedImagePlaceholder(error, index) {
  return `<p class="seo-image-error" data-image-index="${index}">Khong tao duoc anh: ${escapeHtml(error?.message || 'Image API that bai.')}</p>`
}

function safeRunId(value) {
  const runId = String(value || '').trim()
  if (!runId || runId.includes('..') || runId.includes('/') || runId.includes('\\')) {
    throw new Error('Ma lan tao bai viet khong hop le.')
  }
  return runId
}

async function testClaudeArticleConnection(config) {
  if (!config.claudeApiKey) throw new Error('Chưa có Claude API key.')
  const baseUrl = String(config.claudeGatewayBaseUrl || '').replace(/\/+$/, '')
  if (!baseUrl) throw new Error('Chưa có Claude Gateway base URL.')
  const response = await fetchJsonWithRetry(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      [config.claudeGatewayAuthHeader]: config.claudeApiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.claudeModel,
      max_tokens: 64,
      temperature: 0,
      messages: [{ role: 'user', content: 'Return exactly: SEO_OPS_CLAUDE_OK' }],
    }),
  }, 'Claude Gateway', { timeoutMs: 45000, retries: 1 })
  const text = extractClaudeText(response).trim()
  if (!text) throw new Error('Claude trả về phản hồi rỗng.')
  return text.slice(0, 120)
}

async function testGeminiArticleConnection(config) {
  if (!config.geminiApiKey) throw new Error('Chưa có Google AI API key.')
  const cleanModel = normalizeGeminiImageModel(config.geminiImageModel)
  const endpoint = `${String(config.geminiApiBaseUrl).replace(/\/+$/, '')}/v1beta/models/${encodeURIComponent(cleanModel)}:predict?key=${encodeURIComponent(config.geminiApiKey)}`
  const response = await fetchJsonWithRetry(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ prompt: 'A simple clean green checkmark icon on a white background, no text, minimal vector style.' }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '16:9',
      },
    }),
  }, 'Imagen API', { timeoutMs: 60000, retries: 1 })
  const image = extractImagenPredictionImage(response)
  return `${image.mimeType}, ${Math.round(Buffer.byteLength(image.data, 'base64') / 1024)} KB`
}

async function testVertexArticleConnection(config) {
  const token = await vertexAccessToken(config)
  const projectId = normalizeVertexProjectId(config.vertexProjectId, config.vertexCredentialsPath)
  if (!projectId) throw new Error('Chưa cấu hình Vertex AI Project ID.')
  if (!config.vertexRegion) throw new Error('Chưa cấu hình Vertex AI Region.')
  if (!config.vertexImageModel) throw new Error('Chưa cấu hình Vertex AI image model.')
  return `Auth OK, project ${projectId}, region ${config.vertexRegion}, model ${config.vertexImageModel}. Chưa tạo ảnh để tránh tốn quota.`
}

async function testArticleComposerConnectionLegacy() {
  const config = articleComposerConfig()
  const details = []
  for (const test of [
    { provider: 'Claude Gateway', run: () => testClaudeArticleConnection(config) },
    config.imageProvider === 'vertex-ai'
      ? { provider: 'Vertex AI Imagen', run: () => testVertexArticleConnection(config) }
      : { provider: 'Imagen Image', run: () => testGeminiArticleConnection(config) },
  ]) {
    try {
      const result = await test.run()
      details.push({ provider: test.provider, ok: true, message: `Kết nối thành công. ${result}` })
    } catch (error) {
      details.push({ provider: test.provider, ok: false, message: error.message || 'Kiểm tra kết nối thất bại.' })
    }
  }
  const ok = details.every((item) => item.ok)
  const log = appendArticleToolLog({
    action: 'connection-test',
    status: ok ? 'success' : 'error',
    message: ok ? 'Kiểm tra kết nối Viết bài thành công.' : 'Kiểm tra kết nối Viết bài có lỗi.',
    details,
  })
  return { ok, details, log, config: publicArticleComposerConfig() }
}

async function testArticleComposerConnection(provider = 'all') {
  const config = articleComposerConfig()
  const tests = [
    { key: 'claude', provider: 'Claude Gateway', run: () => testClaudeArticleConnection(config) },
    { key: 'gemini', provider: 'Imagen Image', run: () => testGeminiArticleConnection(config) },
    { key: 'vertex', provider: 'Vertex AI Imagen', run: () => testVertexArticleConnection(config) },
  ]
    .filter((test) => provider === 'all' || test.key === provider)
    .filter((test) => provider !== 'all' || test.key === 'claude' || (config.imageProvider === 'vertex-ai' ? test.key === 'vertex' : test.key === 'gemini'))

  const details = []
  for (const test of tests) {
    try {
      const result = await test.run()
      details.push({ provider: test.provider, ok: true, message: `Kết nối thành công. ${result}` })
    } catch (error) {
      details.push({ provider: test.provider, ok: false, message: error.message || 'Kiểm tra kết nối thất bại.' })
    }
  }
  const ok = details.length > 0 && details.every((item) => item.ok)
  const label = provider === 'all' ? 'Viết bài' : provider === 'claude' ? 'Claude' : provider === 'vertex' ? 'Vertex AI' : 'Imagen'
  const log = appendArticleToolLog({
    action: provider === 'all' ? 'connection-test' : `connection-test-${provider}`,
    status: ok ? 'success' : 'error',
    message: ok ? `Kiểm tra ${label} thành công.` : `Kiểm tra ${label} có lỗi.`,
    details,
  })
  return { ok, details, log, config: publicArticleComposerConfig() }
}

async function composeSeoArticle(payload) {
  const keyword = String(payload.keyword || payload.topic || '').trim()
  if (!keyword) throw new Error('Vui long nhap tu khoa hoac chu de can soan bai.')
  const presentationStyle = normalizePresentationStyle(payload.presentationStyle)
  const config = applyImageProviderOverride(articleComposerConfig(), payload.imageProviderOverride)
  if (!config.claudeApiKey) throw new Error('Chua cau hinh Claude API key trong Cong cu -> Viet bai.')
  if (!isArticleImageConfigured(config)) {
    throw new Error(config.imageProvider === 'vertex-ai'
      ? 'Chua cau hinh Vertex AI Project ID, Region hoac Service Account JSON trong Cong cu -> Viet bai.'
      : 'Chua cau hinh Google AI API key trong Cong cu -> Viet bai.')
  }

  // Buoc 1-2: goi Claude de tao bai HTML kem cac marker IMAGE_PROMPT.
  const claudeHtml = await createClaudeArticleHtml({ ...payload, keyword, presentationStyle }, config)
  const markers = extractImagePromptMarkers(claudeHtml)
  if (!markers.length) throw new Error('Claude khong tra ve IMAGE_PROMPT nao. Hay thu lai de tao bai dung cau truc anh.')

  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}-${slugifyFileName(keyword)}`
  const runDir = path.join(toolOutputDir, runId)
  const imagesDir = path.join(runDir, 'images')
  fs.mkdirSync(imagesDir, { recursive: true })

  // Buoc 3-5: tach prompt anh, tao anh bang nha cung cap da chon, roi thay marker bang HTML image.
  const images = []
  const imagesByIndex = []
  const imageErrors = []
  for (let index = 0; index < markers.length; index += 1) {
    const marker = markers[index]
    try {
      const image = await createArticleImage(marker.prompt, index, imagesDir, config)
      const relativePath = `images/${image.fileName}`
      images.push({
        index,
        prompt: marker.prompt,
        filePath: image.filePath,
        relativePath,
        fileUrl: safeToolPublicUrl(`${runId}/${relativePath}`),
        mimeType: image.mimeType,
        imageProvider: config.imageProvider,
      })
      imagesByIndex[index] = images[images.length - 1]
    } catch (error) {
      imageErrors.push({ index, prompt: marker.prompt, message: error.message || 'Khong tao duoc anh.', imageProvider: config.imageProvider })
    }
  }

  let finalHtml = claudeHtml
  for (let index = 0; index < markers.length; index += 1) {
    const image = imagesByIndex[index]
    const fallback = imageErrors.find((item) => item.index === index)
    const replacement = image
      ? generatedImageFigure(image, index)
      : failedImagePlaceholder(fallback, index)
    finalHtml = finalHtml.replace(markers[index].marker, replacement)
  }

  if (presentationStyle !== 'wordpress' && !/<!doctype html/i.test(finalHtml) && !/<html[\s>]/i.test(finalHtml)) {
    finalHtml = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(keyword)}</title>
</head>
<body>
${finalHtml}
</body>
</html>`
  }

  // Buoc 6: luu file HTML hoan thien vao storage rieng.
  const htmlPath = path.join(runDir, 'article.html')
  const sourcePath = path.join(runDir, 'article-source.txt')
  fs.writeFileSync(htmlPath, finalHtml, 'utf8')
  fs.writeFileSync(sourcePath, finalHtml, 'utf8')

  const result = {
    runId,
    topic: keyword,
    presentationStyle,
    imageProvider: config.imageProvider,
    html: finalHtml,
    previewHtml: finalHtml,
    htmlPath,
    htmlUrl: safeToolPublicUrl(`${runId}/article.html`),
    sourcePath,
    sourceUrl: safeToolPublicUrl(`${runId}/article-source.txt`),
    outputDir: runDir,
    images,
    imageErrors,
    generatedAt: new Date().toISOString(),
  }
  upsertArticleHistory(result)
  return result
}

async function regenerateArticleImage(payload) {
  const runId = safeRunId(payload.runId)
  const prompt = String(payload.prompt || '').trim()
  const index = Number(payload.index)
  if (!prompt) throw new Error('Thieu prompt tao anh.')
  if (!Number.isInteger(index) || index < 0) throw new Error('Chi so anh khong hop le.')

  const config = applyImageProviderOverride(articleComposerConfig(), payload.imageProviderOverride)
  if (!isArticleImageConfigured(config)) {
    throw new Error(config.imageProvider === 'vertex-ai'
      ? 'Chua cau hinh Vertex AI Project ID, Region hoac Service Account JSON trong Cong cu -> Viet bai.'
      : 'Chua cau hinh Google AI API key trong Cong cu -> Viet bai.')
  }

  const runDir = path.resolve(path.join(toolOutputDir, runId))
  if (!isInsideDirectory(toolOutputDir, runDir) || !fs.existsSync(runDir) || !fs.statSync(runDir).isDirectory()) {
    throw new Error('Khong tim thay thu muc bai viet da tao.')
  }
  const imagesDir = path.join(runDir, 'images')
  fs.mkdirSync(imagesDir, { recursive: true })

  const image = await createArticleImage(prompt, index, imagesDir, config)
  const relativePath = `images/${image.fileName}`
  const fileUrl = `${safeToolPublicUrl(`${runId}/${relativePath}`)}?v=${Date.now()}`
  const imageResult = {
    index,
    prompt,
    filePath: image.filePath,
    relativePath,
    fileUrl,
    mimeType: image.mimeType,
    imageProvider: config.imageProvider,
  }

  const htmlPath = path.join(runDir, 'article.html')
  const sourcePath = path.join(runDir, 'article-source.txt')
  if (!fs.existsSync(htmlPath)) throw new Error('Khong tim thay file HTML bai viet de cap nhat anh.')
  const currentHtml = fs.readFileSync(htmlPath, 'utf8')
  const figureHtml = generatedImageFigure(imageResult, index)
  const placeholderPattern = new RegExp(`<p class="seo-image-error"[^>]*data-image-index="${index}"[^>]*>[\\s\\S]*?<\\/p>`)
  if (!placeholderPattern.test(currentHtml)) {
    throw new Error('Khong tim thay vi tri anh loi trong HTML. Hay tao lai bai hoac cap nhat bai moi co data-image-index.')
  }
  const finalHtml = currentHtml.replace(placeholderPattern, figureHtml)
  fs.writeFileSync(htmlPath, finalHtml, 'utf8')
  fs.writeFileSync(sourcePath, finalHtml, 'utf8')

  const record = updateArticleHistoryRecord(runId, (current) => ({
    images: [...(Array.isArray(current.images) ? current.images : []).filter((item) => Number(item.index ?? -1) !== index), imageResult].sort((a, b) => Number(a.index ?? 0) - Number(b.index ?? 0)),
    imageErrors: (Array.isArray(current.imageErrors) ? current.imageErrors : []).filter((item) => Number(item.index ?? -1) !== index),
  }))

  return {
    runId,
    topic: record.topic || '',
    presentationStyle: record.presentationStyle || 'professional',
    imageProvider: record.imageProvider || config.imageProvider,
    image: imageResult,
    html: finalHtml,
    previewHtml: finalHtml,
    htmlPath,
    htmlUrl: safeToolPublicUrl(`${runId}/article.html`),
    sourcePath,
    sourceUrl: safeToolPublicUrl(`${runId}/article-source.txt`),
    images: record.images || [imageResult],
    imageErrors: record.imageErrors || [],
    generatedAt: new Date().toISOString(),
  }
}

function loadArticleHistoryItem(runIdValue) {
  const runId = safeRunId(runIdValue)
  const runDir = path.resolve(path.join(toolOutputDir, runId))
  if (!isInsideDirectory(toolOutputDir, runDir) || !fs.existsSync(runDir) || !fs.statSync(runDir).isDirectory()) {
    throw new Error('Khong tim thay bai viet da tao.')
  }
  const htmlPath = path.join(runDir, 'article.html')
  const sourcePath = path.join(runDir, 'article-source.txt')
  if (!fs.existsSync(htmlPath)) throw new Error('Khong tim thay file HTML bai viet.')
  const html = fs.readFileSync(htmlPath, 'utf8')
  const record = publicArticleHistory().find((item) => item.runId === runId) || {}
  return {
    runId,
    topic: record.topic || runId,
    presentationStyle: record.presentationStyle || 'professional',
    imageProvider: record.imageProvider || '',
    html,
    previewHtml: html,
    htmlPath,
    htmlUrl: safeToolPublicUrl(`${runId}/article.html`),
    sourcePath,
    sourceUrl: safeToolPublicUrl(`${runId}/article-source.txt`),
    outputDir: runDir,
    images: Array.isArray(record.images) ? record.images : [],
    imageErrors: Array.isArray(record.imageErrors) ? record.imageErrors : [],
    generatedAt: record.generatedAt || fs.statSync(htmlPath).birthtime.toISOString(),
  }
}

function updateArticleHistoryHtml(payload) {
  const runId = safeRunId(payload.runId)
  const html = String(payload.html || '').trim()
  if (!html) throw new Error('Noi dung HTML khong duoc de trong.')
  const runDir = path.resolve(path.join(toolOutputDir, runId))
  if (!isInsideDirectory(toolOutputDir, runDir) || !fs.existsSync(runDir) || !fs.statSync(runDir).isDirectory()) {
    throw new Error('Khong tim thay bai viet da tao.')
  }
  const htmlPath = path.join(runDir, 'article.html')
  const sourcePath = path.join(runDir, 'article-source.txt')
  fs.writeFileSync(htmlPath, html, 'utf8')
  fs.writeFileSync(sourcePath, html, 'utf8')
  const topic = String(payload.topic || '').trim()
  updateArticleHistoryRecord(runId, () => topic ? { topic } : {})
  return loadArticleHistoryItem(runId)
}

async function generateStandaloneImage(payload) {
  const prompt = String(payload.prompt || '').trim()
  if (!prompt) throw new Error('Vui long nhap mo ta anh can tao.')
  const config = applyImageProviderOverride(articleComposerConfig(), payload.imageProviderOverride)
  if (!isArticleImageConfigured(config)) {
    throw new Error(config.imageProvider === 'vertex-ai'
      ? 'Chua cau hinh Vertex AI Project ID, Region hoac Service Account JSON trong Cong cu -> Viet bai.'
      : 'Chua cau hinh Google AI API key trong Cong cu -> Viet bai.')
  }
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}-${slugifyFileName(prompt)}`
  const imageDir = path.join(toolOutputDir, 'single-images', runId)
  fs.mkdirSync(imageDir, { recursive: true })
  const image = await createArticleImage(prompt, 0, imageDir, config)
  const imageResult = {
    index: 0,
    prompt,
    filePath: image.filePath,
    relativePath: image.fileName,
    fileUrl: safeToolPublicUrl(`single-images/${runId}/${image.fileName}`),
    mimeType: image.mimeType,
    imageProvider: config.imageProvider,
    generatedAt: new Date().toISOString(),
  }
  return { runId, image: imageResult }
}

function serveToolOutput(scopedPathname, res) {
  const cleanPath = decodeURIComponent(scopedPathname.replace(/^\/tool-output\/?/, ''))
  const resolvedPath = path.resolve(path.join(toolOutputDir, cleanPath))
  if (!isInsideDirectory(toolOutputDir, resolvedPath) || !fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
    return
  }
  const ext = path.extname(resolvedPath)
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.md' ? 'no-cache' : 'public, max-age=86400',
  })
  fs.createReadStream(resolvedPath).pipe(res)
}

function safeEntityGuideFileName(value) {
  const baseName = path.basename(String(value || '').trim())
  if (!baseName || !/\.html?$/i.test(baseName)) {
    throw new Error('Tên file hướng dẫn Entity phải là file .html hoặc .htm.')
  }
  const safeName = baseName.replace(/[^A-Za-z0-9._ -]/g, '-').replace(/\s+/g, '-')
  if (!safeName || safeName === '.' || safeName === '..') {
    throw new Error('Tên file hướng dẫn Entity không hợp lệ.')
  }
  return safeName
}

function entityGuidePublicUrl(fileName) {
  const prefix = basePath || ''
  return `${prefix}/entity-guides/${encodeURIComponent(fileName)}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sendEntityGuideError(res, status, title, message) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' })
  res.end(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;margin:40px;background:#f8fafc;color:#0f172a}.box{max-width:760px;background:white;border:1px solid #dbe4f0;border-radius:14px;padding:24px;box-shadow:0 18px 45px rgba(15,23,42,.08)}h1{margin:0 0 12px;font-size:22px}p{line-height:1.6;color:#475569}</style></head><body><main class="box"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></main></body></html>`)
}

function googleDriveIdFromRef(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (/^[A-Za-z0-9_-]{20,}$/.test(text)) return text
  try {
    const url = new URL(text)
    if (!/(^|\.)drive\.google\.com$/i.test(url.hostname) && !/(^|\.)docs\.google\.com$/i.test(url.hostname)) return ''
    const patterns = [
      /\/folders\/([A-Za-z0-9_-]+)/,
      /\/file\/d\/([A-Za-z0-9_-]+)/,
      /\/document\/d\/([A-Za-z0-9_-]+)/,
      /\/presentation\/d\/([A-Za-z0-9_-]+)/,
      /\/spreadsheets\/d\/([A-Za-z0-9_-]+)/,
    ]
    for (const pattern of patterns) {
      const match = url.pathname.match(pattern)
      if (match?.[1]) return match[1]
    }
    return url.searchParams.get('id') || ''
  } catch {
    return ''
  }
}

function googleDriveQueryStringLiteral(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function findGoogleDriveFileIdByName(folderRef, fileName) {
  if (!googleDriveApiKey) {
    throw new Error('Server chưa cấu hình SEO_OPS_GOOGLE_DRIVE_API_KEY nên chưa thể tìm file theo tên trong thư mục Drive. Có thể dán thẳng link file Google Drive vào ô Hướng dẫn khác để mở không cần API key.')
  }
  const folderId = googleDriveIdFromRef(folderRef)
  if (!folderId) throw new Error('Link thư mục Google Drive không hợp lệ.')
  const apiUrl = new URL('https://www.googleapis.com/drive/v3/files')
  apiUrl.searchParams.set('key', googleDriveApiKey)
  apiUrl.searchParams.set('pageSize', '10')
  apiUrl.searchParams.set('fields', 'files(id,name,mimeType,size)')
  apiUrl.searchParams.set('q', `${googleDriveQueryStringLiteral(folderId)} in parents and name = ${googleDriveQueryStringLiteral(fileName)} and trashed = false`)
  const response = await fetchWithTimeout(apiUrl.toString(), { headers: { Accept: 'application/json' } }, 20000)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error?.message || `Google Drive API HTTP ${response.status}`)
  const file = Array.isArray(payload.files) ? payload.files.find((item) => item.name === fileName) : null
  if (!file?.id) throw new Error(`Không tìm thấy file "${fileName}" trong thư mục Google Drive.`)
  return file.id
}

async function fetchGoogleDriveHtml(fileId) {
  if (!/^[A-Za-z0-9_-]{20,}$/.test(fileId)) throw new Error('Google Drive file ID không hợp lệ.')
  const response = await fetchWithTimeout(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`, {
    headers: { Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1' },
  }, 25000)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (!response.ok) throw new Error(`Google Drive download HTTP ${response.status}`)
  if (!bytes.length) throw new Error('File Google Drive rỗng.')
  if (bytes.length > 2 * 1024 * 1024) throw new Error('File HTML hướng dẫn Entity tối đa 2MB.')
  return bytes
}

async function serveGoogleDriveEntityGuide(fileName, searchParams, res) {
  const driveFileRef = searchParams.get('driveFile') || ''
  const driveFolderRef = searchParams.get('driveFolder') || process.env.SEO_OPS_ENTITY_GUIDE_DRIVE_FOLDER || ''
  let fileId = googleDriveIdFromRef(driveFileRef)
  if (!fileId && driveFolderRef) fileId = await findGoogleDriveFileIdByName(driveFolderRef, fileName)
  if (!fileId) return false
  const bytes = await fetchGoogleDriveHtml(fileId)
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Content-Disposition': `inline; filename="${fileName.replace(/"/g, '')}"`,
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(bytes)
  return true
}

async function serveEntityGuide(scopedPathname, res, searchParams = new URLSearchParams()) {
  let fileName = ''
  try {
    fileName = safeEntityGuideFileName(decodeURIComponent(scopedPathname.replace(/^\/entity-guides\/?/, '')))
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
    return
  }
  const resolvedPath = entityGuideSearchDirs
    .map((guideDir) => ({
      guideDir,
      filePath: path.resolve(path.join(guideDir, fileName)),
    }))
    .find(({ guideDir, filePath }) =>
      isInsideDirectory(guideDir, filePath) &&
      fs.existsSync(filePath) &&
      fs.statSync(filePath).isFile(),
    )?.filePath
  if (!resolvedPath) {
    try {
      if (await serveGoogleDriveEntityGuide(fileName, searchParams, res)) return
    } catch (error) {
      sendEntityGuideError(res, 502, 'Không mở được hướng dẫn Google Drive', error.message || 'Không tải được file HTML từ Google Drive.')
      return
    }
    sendEntityGuideError(res, 404, 'Không tìm thấy file hướng dẫn', `Không tìm thấy "${fileName}" trong storage server hoặc Google Drive đã cấu hình.`)
    return
  }
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  })
  fs.createReadStream(resolvedPath).pipe(res)
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
      const articleConfig = publicArticleComposerConfig()
      sendJson(res, 200, { ok: true, dbPath, publicDir, toolOutputDir, entityGuideDir, entityGuideSearchDirs, entityGuideDriveConfigured: Boolean(googleDriveApiKey || process.env.SEO_OPS_ENTITY_GUIDE_DRIVE_FOLDER), toolConfigPath, storage: 'json-db', basePath: basePath || '/', databaseProtected: !isInsideApp(dbDir), dataCounts: dataCounts(readDb()), mcpConfigured: mcp.configured, mcpConnectorKeyConfigured: mcp.connectorKeyConfigured, searchConsoleConfigured: Boolean(searchConsoleToken), googleOAuthConfigured, articleComposerConfigured: articleConfig.articleComposerConfigured })
      return
    }

    if (scopedPathname.startsWith('/tool-output/')) {
      serveToolOutput(scopedPathname, res)
      return
    }

    if (scopedPathname.startsWith('/entity-guides/')) {
      await serveEntityGuide(scopedPathname, res, url.searchParams)
      return
    }

    if (scopedPathname === '/mcp' || scopedPathname === '/api/mcp') {
      await mcp.handle(req, res, readBody, sendJson)
      return
    }

    if (scopedPathname === '/api/entity-guides/upload') {
      if (!isAuthorized(req)) {
        sendJson(res, 401, { ok: false, message: 'Unauthorized' })
        return
      }
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, message: 'Method not allowed' })
        return
      }
      const payload = JSON.parse(await readBody(req))
      let fileName = ''
      try {
        fileName = safeEntityGuideFileName(payload.fileName)
      } catch (error) {
        sendJson(res, 400, { ok: false, message: error.message || 'Tên file không hợp lệ.' })
        return
      }
      const contentBase64 = String(payload.contentBase64 || '')
      if (!contentBase64) {
        sendJson(res, 400, { ok: false, message: 'Thiếu nội dung file HTML.' })
        return
      }
      const bytes = Buffer.from(contentBase64, 'base64')
      if (!bytes.length || bytes.length > 2 * 1024 * 1024) {
        sendJson(res, 400, { ok: false, message: 'File HTML hướng dẫn Entity tối đa 2MB.' })
        return
      }
      fs.mkdirSync(entityGuideDir, { recursive: true })
      const targetPath = path.resolve(path.join(entityGuideDir, fileName))
      if (!isInsideDirectory(entityGuideDir, targetPath)) {
        sendJson(res, 400, { ok: false, message: 'Tên file không hợp lệ.' })
        return
      }
      fs.writeFileSync(targetPath, bytes)
      sendJson(res, 200, { ok: true, fileName, url: entityGuidePublicUrl(fileName), savedAt: new Date().toISOString() })
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
          writeDb(applyTaskDeadlineAutomation(nextData).data, {
            allowLargeOverwrite: req.headers['x-seo-ops-allow-large-overwrite'] === 'true',
          })
        } catch (error) {
          if (error?.code === 'SEO_OPS_CLEAN_OVERWRITE' || error?.code === 'SEO_OPS_LARGE_DATA_DROP') {
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

    if (scopedPathname === '/api/tools/status') {
      sendJson(res, 200, {
        ok: true,
        ...publicArticleComposerConfig(),
      })
      return
    }

    if (scopedPathname === '/api/tools/article-compose/config') {
      if (req.method === 'GET') {
        sendJson(res, 200, { ok: true, config: publicArticleComposerConfig() })
        return
      }
      if (req.method === 'POST') {
        const payload = JSON.parse(await readBody(req))
        sendJson(res, 200, { ok: true, config: updateArticleComposerConfig(payload) })
        return
      }
      sendJson(res, 405, { ok: false, message: 'Method not allowed' })
      return
    }

    if (scopedPathname === '/api/tools/article-compose/test') {
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, message: 'Method not allowed' })
        return
      }
      const provider = String(url.searchParams.get('provider') || 'all').toLowerCase()
      const safeProvider = ['claude', 'gemini', 'vertex', 'all'].includes(provider) ? provider : 'all'
      const result = await testArticleComposerConnection(safeProvider)
      sendJson(res, 200, result)
      return
    }

    if (scopedPathname === '/api/tools/article-compose/history') {
      if (req.method !== 'GET') {
        sendJson(res, 405, { ok: false, message: 'Method not allowed' })
        return
      }
      sendJson(res, 200, { ok: true, history: publicArticleHistory() })
      return
    }

    if (scopedPathname === '/api/tools/article-compose/history-item') {
      if (req.method === 'GET') {
        const runId = url.searchParams.get('runId') || ''
        sendJson(res, 200, { ok: true, result: loadArticleHistoryItem(runId), history: publicArticleHistory() })
        return
      }
      if (req.method === 'POST') {
        const payload = JSON.parse(await readBody(req))
        const result = updateArticleHistoryHtml(payload)
        appendArticleToolLog({
          action: 'edit-article-html',
          status: 'success',
          message: `Da cap nhat HTML bai viet ${payload.runId}.`,
        })
        sendJson(res, 200, { ok: true, result, history: publicArticleHistory() })
        return
      }
      sendJson(res, 405, { ok: false, message: 'Method not allowed' })
      return
    }

    if (scopedPathname === '/api/tools/article-compose/generate-image') {
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, message: 'Method not allowed' })
        return
      }
      try {
        const payload = JSON.parse(await readBody(req))
        const result = await generateStandaloneImage(payload)
        appendArticleToolLog({
          action: 'single-image',
          status: 'success',
          message: 'Da tao anh don theo mo ta.',
        })
        sendJson(res, 200, { ok: true, result, config: publicArticleComposerConfig() })
      } catch (error) {
        appendArticleToolLog({
          action: 'single-image',
          status: 'error',
          message: error.message || 'Khong tao duoc anh don.',
        })
        sendJson(res, 500, { ok: false, message: error.message || 'Khong tao duoc anh don.' })
      }
      return
    }

    if (scopedPathname === '/api/tools/article-compose/regenerate-image') {
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, message: 'Method not allowed' })
        return
      }
      try {
        const payload = JSON.parse(await readBody(req))
        const result = await regenerateArticleImage(payload)
        appendArticleToolLog({
          action: 'regenerate-image',
          status: 'success',
          message: `Da tao lai anh ${Number(payload.index) + 1} cho bai viet ${payload.runId}.`,
        })
        sendJson(res, 200, { ok: true, result, config: publicArticleComposerConfig() })
      } catch (error) {
        appendArticleToolLog({
          action: 'regenerate-image',
          status: 'error',
          message: error.message || 'Khong tao lai duoc anh.',
        })
        sendJson(res, 500, { ok: false, message: error.message || 'Khong tao lai duoc anh.' })
      }
      return
    }

    if (scopedPathname === '/api/tools/article-compose') {
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, message: 'Method not allowed' })
        return
      }
      try {
        const payload = JSON.parse(await readBody(req))
        const result = await composeSeoArticle(payload)
        appendArticleToolLog({
          action: 'compose',
          status: 'success',
          message: `Đã tạo bài viết SEO: ${result.topic}`,
        })
        sendJson(res, 200, { ok: true, result })
      } catch (error) {
        const missingConfig = /CLAUDE_API_KEY|GEMINI_API_KEY|API key|Gateway base URL|Chua cau hinh|Chưa/i.test(error.message || '')
        appendArticleToolLog({
          action: 'compose',
          status: 'error',
          message: error.message || 'Không tạo được bài viết SEO.',
        })
        sendJson(res, missingConfig ? 503 : 500, { ok: false, message: error.message || 'Khong tao duoc bai viet SEO.' })
      }
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
runTaskDeadlineAutomation()
const taskDeadlineTimer = setInterval(runTaskDeadlineAutomation, 60 * 1000)
taskDeadlineTimer.unref()

server.listen(port, host, () => {
  console.log(`SEO Ops running at http://${host}:${port}${basePath || '/'}`)
  console.log(`Shared data file: ${dbPath}`)
})
