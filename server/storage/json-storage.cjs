const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const APP_DATA_KEY = 'app:data'

function jsonText(value) {
  return JSON.stringify(value, null, 2)
}

function checksumJson(value) {
  return crypto.createHash('sha256').update(jsonText(value)).digest('hex')
}

function safeFileName(value) {
  return String(value || 'document')
    .replace(/[^a-z0-9_.-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'document'
}

function createJsonStorage(options) {
  const {
    dbDir,
    dbPath,
    dbBackupDir,
    seedPath,
    maxDbBackups,
    assertSafeDbWrite,
    isInsideApp,
    legacyDocumentPaths = {},
  } = options

  function ensureDb() {
    fs.mkdirSync(dbDir, { recursive: true })
    if (!fs.existsSync(dbPath)) {
      const seed = fs.existsSync(seedPath)
        ? JSON.parse(fs.readFileSync(seedPath, 'utf8'))
        : { data: { projects: [], keywords: [], tasks: [], transactions: [], users: [] } }
      const data = seed.data || seed
      fs.writeFileSync(dbPath, jsonText(data))
    }
  }

  function documentPath(key) {
    return legacyDocumentPaths[key] || path.join(dbDir, `${safeFileName(key)}.json`)
  }

  function readJsonFile(filePath, fallback) {
    if (!fs.existsSync(filePath)) return fallback
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return parsed && typeof parsed === 'object' ? parsed : fallback
  }

  function writeJsonFile(filePath, data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    const tempPath = `${filePath}.tmp`
    fs.writeFileSync(tempPath, jsonText(data))
    fs.renameSync(tempPath, filePath)
  }

  async function initStorage() {
    ensureDb()
  }

  async function readDb() {
    ensureDb()
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
  }

  async function backupDb() {
    if (!maxDbBackups || !fs.existsSync(dbPath)) return null
    fs.mkdirSync(dbBackupDir, { recursive: true })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(dbBackupDir, `seo-ops-data-${timestamp}.json`)
    fs.copyFileSync(dbPath, backupPath)
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
    return backupPath
  }

  async function writeDb(data, writeOptions = {}) {
    ensureDb()
    const currentData = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf8')) : null
    assertSafeDbWrite(currentData, data, writeOptions)
    await backupDb('write')
    writeJsonFile(dbPath, data)
  }

  async function readJsonDocument(key, fallback = {}) {
    ensureDb()
    return readJsonFile(documentPath(key), fallback)
  }

  async function writeJsonDocument(key, data) {
    ensureDb()
    writeJsonFile(documentPath(key), data)
  }

  async function getStorageInfo() {
    const exists = fs.existsSync(dbPath)
    return {
      storageDriver: 'json',
      storage: 'json-db',
      dbPath,
      storageKey: APP_DATA_KEY,
      databaseProtected: !isInsideApp(dbDir),
      checksum: exists ? checksumJson(JSON.parse(fs.readFileSync(dbPath, 'utf8'))) : '',
    }
  }

  return {
    initStorage,
    readDb,
    writeDb,
    backupDb,
    readJsonDocument,
    writeJsonDocument,
    getStorageInfo,
  }
}

module.exports = { APP_DATA_KEY, createJsonStorage }
