#!/usr/bin/env node
const {
  APP_DATA_KEY,
  assertChecksum,
  connectDatabase,
  dataCounts,
  loadEnvFiles,
  parseArgs,
  readStorageRow,
  report,
} = require('./mysql-cli-utils.cjs')

function usage() {
  console.log('Usage: node scripts/verify-mariadb-storage.cjs')
}

async function main() {
  loadEnvFiles()
  const args = parseArgs()
  if (args.help) {
    usage()
    return
  }

  const { connection, config } = await connectDatabase()
  try {
    const row = await readStorageRow(connection)
    assertChecksum(row)
    const data = JSON.parse(row.storage_value)
    report({
      ok: true,
      dbHost: config.host,
      dbDatabase: config.database,
      storageKey: APP_DATA_KEY,
      checksum: row.checksum,
      version: row.version,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
      counts: dataCounts(data),
    })
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  report({ ok: false, message: error.message || String(error) })
  process.exit(1)
})
