#!/usr/bin/env node
const path = require('path')
const {
  APP_DATA_KEY,
  assertChecksum,
  connectDatabase,
  dataCounts,
  defaultExportPath,
  loadEnvFiles,
  parseArgs,
  readStorageRow,
  report,
  writeFileNoOverwrite,
} = require('./mysql-cli-utils.cjs')

function usage() {
  console.log('Usage: node scripts/export-mariadb-to-json.cjs [--output=/path/to/export.json]')
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
    const outputPath = writeFileNoOverwrite(args.output ? path.resolve(args.output) : defaultExportPath(), `${row.storage_value}\n`)
    report({
      ok: true,
      output: outputPath,
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
