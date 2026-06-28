#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const {
  APP_DATA_KEY,
  assertChecksum,
  backupSourceFile,
  checksumText,
  connectDatabase,
  dataCounts,
  ensureTables,
  jsonText,
  loadEnvFiles,
  normalizeAppData,
  parseArgs,
  readStorageRow,
  report,
  resolveSourcePath,
} = require('./mysql-cli-utils.cjs')

function usage() {
  console.log([
    'Usage: node scripts/migrate-json-to-mariadb.cjs [--source=/path/to/seo-ops-data.json] [--dry-run] [--force]',
    '',
    'Priority source path:',
    '1. --source=/path',
    '2. SEO_OPS_DB_DIR/seo-ops-data.json',
    '3. db/seo-ops-data.json',
  ].join('\n'))
}

function sameCounts(left, right) {
  return JSON.stringify(dataCounts(left)) === JSON.stringify(dataCounts(right))
}

async function main() {
  loadEnvFiles()
  const args = parseArgs()
  if (args.help) {
    usage()
    return
  }

  const sourcePath = resolveSourcePath(args)
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    throw new Error(`Source JSON file not found: ${sourcePath || '(none)'}`)
  }

  const parsed = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
  const data = normalizeAppData(parsed)
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Source JSON is valid JSON but not a SEO Ops data object.')
  }
  const storageValue = jsonText(data)
  const checksum = checksumText(storageValue)

  const { connection, config } = await connectDatabase()
  let backupPath = ''
  try {
    const existingRow = await readStorageRow(connection)
    if (existingRow && !args.force) {
      throw new Error(`${APP_DATA_KEY} already exists in MariaDB. Re-run with --force only if you intentionally want to replace it.`)
    }

    if (args.dryRun) {
      report({
        ok: true,
        dryRun: true,
        source: path.resolve(sourcePath),
        dbHost: config.host,
        dbDatabase: config.database,
        storageKey: APP_DATA_KEY,
        storageRowExists: Boolean(existingRow),
        wouldWrite: !existingRow || Boolean(args.force),
        checksum,
        counts: dataCounts(data),
      })
      return
    }

    backupPath = backupSourceFile(sourcePath)
    await ensureTables(connection)
    await connection.beginTransaction()
    try {
      const lockedRow = await readStorageRow(connection, true)
      if (lockedRow && !args.force) {
        throw new Error(`${APP_DATA_KEY} already exists in MariaDB. Re-run with --force only if you intentionally want to replace it.`)
      }
      if (lockedRow) {
        await connection.query(
          `INSERT INTO seo_ops_backups (storage_key, storage_value, checksum, reason)
           VALUES (?, ?, ?, ?)`,
          [lockedRow.storage_key, lockedRow.storage_value, lockedRow.checksum, 'json-migration-force'],
        )
        await connection.query(
          `UPDATE seo_ops_storage
           SET storage_value = ?, checksum = ?, version = version + 1
           WHERE storage_key = ?`,
          [storageValue, checksum, APP_DATA_KEY],
        )
      } else {
        await connection.query(
          `INSERT INTO seo_ops_storage (storage_key, storage_value, checksum, version)
           VALUES (?, ?, ?, 1)`,
          [APP_DATA_KEY, storageValue, checksum],
        )
      }
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    }

    const savedRow = await readStorageRow(connection)
    assertChecksum(savedRow)
    const savedData = JSON.parse(savedRow.storage_value)
    if (savedRow.checksum !== checksum || !sameCounts(data, savedData)) {
      throw new Error('Migration verification failed: saved data does not match source counts/checksum.')
    }

    report({
      ok: true,
      dryRun: false,
      source: path.resolve(sourcePath),
      backup: path.resolve(backupPath),
      dbHost: config.host,
      dbDatabase: config.database,
      storageKey: APP_DATA_KEY,
      checksum,
      counts: dataCounts(savedData),
      version: savedRow.version,
      updatedAt: savedRow.updated_at ? new Date(savedRow.updated_at).toISOString() : '',
    })
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  report({ ok: false, message: error.message || String(error) })
  process.exit(1)
})
