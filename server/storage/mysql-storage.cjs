const fs = require('fs')
const crypto = require('crypto')
const mysql = require('mysql2/promise')

const APP_DATA_KEY = 'app:data'

function jsonText(value) {
  return JSON.stringify(value, null, 2)
}

function checksumText(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function checksumJson(value) {
  return checksumText(jsonText(value))
}

function parseBoolean(value) {
  return /^(1|true|yes|on)$/i.test(String(value || '').trim())
}

function createDbConfig(env = process.env) {
  return {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    database: env.DB_DATABASE || '',
    user: env.DB_USERNAME || '',
    password: env.DB_PASSWORD || '',
    ssl: parseBoolean(env.DB_SSL) ? {} : undefined,
  }
}

function createTablesSql() {
  return [
    `CREATE TABLE IF NOT EXISTS seo_ops_storage (
      storage_key VARCHAR(191) NOT NULL PRIMARY KEY,
      storage_value LONGTEXT NOT NULL,
      checksum CHAR(64) NOT NULL,
      version BIGINT UNSIGNED NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS seo_ops_backups (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      storage_key VARCHAR(191) NOT NULL,
      storage_value LONGTEXT NOT NULL,
      checksum CHAR(64) NOT NULL,
      reason VARCHAR(191) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_storage_key_created_at (storage_key, created_at)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  ]
}

function createMysqlStorage(options) {
  const {
    dbPath,
    seedPath,
    maxDbBackups,
    assertSafeDbWrite,
    legacyDocumentPaths = {},
    env = process.env,
  } = options
  const dbConfig = createDbConfig(env)
  let pool = null
  let initialized = false

  function requireConfig() {
    const missing = []
    if (!dbConfig.database) missing.push('DB_DATABASE')
    if (!dbConfig.user) missing.push('DB_USERNAME')
    if (!dbConfig.password) missing.push('DB_PASSWORD')
    if (missing.length) {
      throw new Error(`Missing MariaDB configuration: ${missing.join(', ')}`)
    }
  }

  function getPool() {
    requireConfig()
    if (!pool) {
      pool = mysql.createPool({
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user,
        password: dbConfig.password,
        ssl: dbConfig.ssl,
        charset: 'utf8mb4',
        waitForConnections: true,
        connectionLimit: Number(env.DB_CONNECTION_LIMIT || 10),
        namedPlaceholders: false,
      })
    }
    return pool
  }

  async function ensureTables(connection) {
    for (const sql of createTablesSql()) {
      await connection.query(sql)
    }
  }

  function defaultData() {
    return { projects: [], keywords: [], tasks: [], transactions: [], users: [] }
  }

  function seedData() {
    const sourcePath = [dbPath, seedPath].find((filePath) => filePath && fs.existsSync(filePath))
    if (!sourcePath) return defaultData()
    const parsed = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
    return parsed.data || parsed
  }

  function keyForDocument(key) {
    return `kv:${String(key || '').trim() || 'document'}`
  }

  async function rowForKey(connection, key, lock = false) {
    const [rows] = await connection.query(
      `SELECT storage_key, storage_value, checksum, version, updated_at
       FROM seo_ops_storage
       WHERE storage_key = ?${lock ? ' FOR UPDATE' : ''}`,
      [key],
    )
    return rows[0] || null
  }

  async function backupRow(connection, row, reason = '') {
    if (!row || !maxDbBackups) return
    await connection.query(
      `INSERT INTO seo_ops_backups (storage_key, storage_value, checksum, reason)
       VALUES (?, ?, ?, ?)`,
      [row.storage_key, row.storage_value, row.checksum, String(reason || '').slice(0, 191) || null],
    )
  }

  async function pruneBackups(connection, key) {
    const keep = Math.max(0, Number(maxDbBackups) || 0)
    if (!keep) return
    await connection.query(
      `DELETE FROM seo_ops_backups
       WHERE storage_key = ?
         AND id NOT IN (
           SELECT id FROM (
             SELECT id
             FROM seo_ops_backups
             WHERE storage_key = ?
             ORDER BY id DESC
             LIMIT ${keep}
           ) AS keep_rows
         )`,
      [key, key],
    )
  }

  async function writeRow(connection, key, data, reason = '', writeOptions = {}) {
    const currentRow = await rowForKey(connection, key, true)
    const currentData = currentRow ? JSON.parse(currentRow.storage_value) : null
    if (key === APP_DATA_KEY) assertSafeDbWrite(currentData, data, writeOptions)
    const nextText = jsonText(data)
    const nextChecksum = checksumText(nextText)
    await backupRow(connection, currentRow, reason)
    if (currentRow) {
      await connection.query(
        `UPDATE seo_ops_storage
         SET storage_value = ?, checksum = ?, version = version + 1
         WHERE storage_key = ?`,
        [nextText, nextChecksum, key],
      )
    } else {
      await connection.query(
        `INSERT INTO seo_ops_storage (storage_key, storage_value, checksum, version)
         VALUES (?, ?, ?, 1)`,
        [key, nextText, nextChecksum],
      )
    }
    await pruneBackups(connection, key)
    const savedRow = await rowForKey(connection, key)
    if (!savedRow || savedRow.checksum !== nextChecksum) {
      throw new Error(`MariaDB checksum verification failed for ${key}.`)
    }
    return savedRow
  }

  async function ensureInitialized() {
    if (!initialized) await initStorage()
  }

  async function initStorage() {
    const connection = await getPool().getConnection()
    try {
      await ensureTables(connection)
      await connection.beginTransaction()
      const currentRow = await rowForKey(connection, APP_DATA_KEY, true)
      if (!currentRow) {
        const data = seedData()
        await writeRow(connection, APP_DATA_KEY, data, 'seed-empty-mysql', { allowLargeOverwrite: true })
      }
      await connection.commit()
      initialized = true
    } catch (error) {
      try {
        await connection.rollback()
      } catch {}
      throw error
    } finally {
      connection.release()
    }
  }

  async function readDb() {
    await ensureInitialized()
    const [rows] = await getPool().query(
      'SELECT storage_value, checksum FROM seo_ops_storage WHERE storage_key = ?',
      [APP_DATA_KEY],
    )
    const row = rows[0]
    if (!row) return defaultData()
    if (checksumText(row.storage_value) !== row.checksum) {
      throw new Error('MariaDB checksum verification failed for app:data.')
    }
    return JSON.parse(row.storage_value)
  }

  async function writeDb(data, writeOptions = {}) {
    await ensureInitialized()
    const connection = await getPool().getConnection()
    try {
      await connection.beginTransaction()
      await writeRow(connection, APP_DATA_KEY, data, 'write', writeOptions)
      await connection.commit()
    } catch (error) {
      try {
        await connection.rollback()
      } catch {}
      throw error
    } finally {
      connection.release()
    }
  }

  async function backupDb(reason = 'manual') {
    await ensureInitialized()
    const connection = await getPool().getConnection()
    try {
      await connection.beginTransaction()
      const row = await rowForKey(connection, APP_DATA_KEY, true)
      await backupRow(connection, row, reason)
      await pruneBackups(connection, APP_DATA_KEY)
      await connection.commit()
    } catch (error) {
      try {
        await connection.rollback()
      } catch {}
      throw error
    } finally {
      connection.release()
    }
  }

  async function seedLegacyDocument(key, fallback) {
    const legacyPath = legacyDocumentPaths[key]
    if (!legacyPath || !fs.existsSync(legacyPath)) return fallback
    const parsed = JSON.parse(fs.readFileSync(legacyPath, 'utf8'))
    const value = parsed && typeof parsed === 'object' ? parsed : fallback
    const connection = await getPool().getConnection()
    try {
      await connection.beginTransaction()
      const currentRow = await rowForKey(connection, keyForDocument(key), true)
      if (!currentRow) await writeRow(connection, keyForDocument(key), value, 'seed-legacy-json', { allowLargeOverwrite: true })
      await connection.commit()
    } catch (error) {
      try {
        await connection.rollback()
      } catch {}
      throw error
    } finally {
      connection.release()
    }
    return value
  }

  async function readJsonDocument(key, fallback = {}) {
    await ensureInitialized()
    const storageKey = keyForDocument(key)
    const [rows] = await getPool().query(
      'SELECT storage_value, checksum FROM seo_ops_storage WHERE storage_key = ?',
      [storageKey],
    )
    const row = rows[0]
    if (!row) return seedLegacyDocument(key, fallback)
    if (checksumText(row.storage_value) !== row.checksum) {
      throw new Error(`MariaDB checksum verification failed for ${storageKey}.`)
    }
    const parsed = JSON.parse(row.storage_value)
    return parsed && typeof parsed === 'object' ? parsed : fallback
  }

  async function writeJsonDocument(key, data) {
    await ensureInitialized()
    const connection = await getPool().getConnection()
    try {
      await connection.beginTransaction()
      await writeRow(connection, keyForDocument(key), data, `write-${key}`, { allowLargeOverwrite: true })
      await connection.commit()
    } catch (error) {
      try {
        await connection.rollback()
      } catch {}
      throw error
    } finally {
      connection.release()
    }
  }

  async function getStorageInfo() {
    await ensureInitialized()
    const [rows] = await getPool().query(
      'SELECT checksum, version, updated_at FROM seo_ops_storage WHERE storage_key = ?',
      [APP_DATA_KEY],
    )
    const row = rows[0] || {}
    return {
      storageDriver: 'mysql',
      storage: 'mysql-document',
      databaseProtected: true,
      dbHost: dbConfig.host,
      dbPort: dbConfig.port,
      dbDatabase: dbConfig.database,
      storageKey: APP_DATA_KEY,
      checksum: row.checksum || '',
      version: row.version || 0,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
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

module.exports = {
  APP_DATA_KEY,
  checksumJson,
  checksumText,
  createDbConfig,
  createMysqlStorage,
  createTablesSql,
  jsonText,
}
