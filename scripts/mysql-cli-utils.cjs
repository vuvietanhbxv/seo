const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')
const {
  APP_DATA_KEY,
  checksumText,
  createDbConfig,
  createTablesSql,
  jsonText,
} = require('../server/storage/mysql-storage.cjs')

const rootDir = path.resolve(__dirname, '..')

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

function loadEnvFiles() {
  loadDotEnvFile(path.join(rootDir, '.env'))
  loadDotEnvFile(path.join(rootDir, '.env.local'))
}

function parseArgs(argv = process.argv.slice(2)) {
  return argv.reduce((result, item) => {
    if (item === '--dry-run') result.dryRun = true
    else if (item === '--force') result.force = true
    else if (item.startsWith('--source=')) result.source = item.slice('--source='.length)
    else if (item.startsWith('--output=')) result.output = item.slice('--output='.length)
    else if (item === '--help' || item === '-h') result.help = true
    else throw new Error(`Unknown argument: ${item}`)
    return result
  }, {})
}

function timestamp() {
  const pad = (value) => String(value).padStart(2, '0')
  const date = new Date()
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('-')
}

function dataCounts(data) {
  if (!data || typeof data !== 'object') return {}
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => Array.isArray(value))
      .map(([key, value]) => [key, value.length]),
  )
}

function normalizeAppData(parsed) {
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data) && !Array.isArray(parsed.projects)) {
    return parsed.data
  }
  return parsed
}

function resolveSourcePath(args) {
  const candidates = []
  if (args.source) candidates.push(path.resolve(args.source))
  if (process.env.SEO_OPS_DB_DIR) candidates.push(path.resolve(process.env.SEO_OPS_DB_DIR, 'seo-ops-data.json'))
  candidates.push(path.join(rootDir, 'db', 'seo-ops-data.json'))
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0]
}

function assertDbConfig(config) {
  const missing = []
  if (!config.database) missing.push('DB_DATABASE')
  if (!config.user) missing.push('DB_USERNAME')
  if (!config.password) missing.push('DB_PASSWORD')
  if (missing.length) throw new Error(`Missing MariaDB configuration: ${missing.join(', ')}`)
}

async function connectDatabase() {
  const config = createDbConfig(process.env)
  assertDbConfig(config)
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl,
    charset: 'utf8mb4',
  })
  return { connection, config }
}

async function ensureTables(connection) {
  for (const sql of createTablesSql()) {
    await connection.query(sql)
  }
}

async function readStorageRow(connection, lock = false) {
  try {
    const [rows] = await connection.query(
      `SELECT storage_key, storage_value, checksum, version, updated_at
       FROM seo_ops_storage
       WHERE storage_key = ?${lock ? ' FOR UPDATE' : ''}`,
      [APP_DATA_KEY],
    )
    return rows[0] || null
  } catch (error) {
    if (error && error.code === 'ER_NO_SUCH_TABLE') return null
    throw error
  }
}

function assertChecksum(row) {
  if (!row) throw new Error(`Missing storage row ${APP_DATA_KEY}.`)
  const actualChecksum = checksumText(row.storage_value)
  if (actualChecksum !== row.checksum) {
    throw new Error(`Checksum mismatch for ${APP_DATA_KEY}: expected ${row.checksum}, got ${actualChecksum}.`)
  }
}

function backupSourceFile(sourcePath) {
  const backupPath = `${sourcePath}.migration-backup-${timestamp()}.json`
  if (fs.existsSync(backupPath)) throw new Error(`Backup file already exists: ${backupPath}`)
  fs.copyFileSync(sourcePath, backupPath)
  return backupPath
}

function defaultExportPath() {
  return path.join(rootDir, 'exports', `seo-ops-data-export-${timestamp()}.json`)
}

function writeFileNoOverwrite(filePath, content) {
  const resolvedPath = path.resolve(filePath)
  if (fs.existsSync(resolvedPath)) throw new Error(`Output file already exists: ${resolvedPath}`)
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true })
  fs.writeFileSync(resolvedPath, content, 'utf8')
  return resolvedPath
}

function report(payload) {
  console.log(JSON.stringify(payload, null, 2))
}

module.exports = {
  APP_DATA_KEY,
  assertChecksum,
  backupSourceFile,
  checksumText,
  connectDatabase,
  dataCounts,
  defaultExportPath,
  ensureTables,
  jsonText,
  loadEnvFiles,
  normalizeAppData,
  parseArgs,
  readStorageRow,
  report,
  resolveSourcePath,
  rootDir,
  writeFileNoOverwrite,
}
