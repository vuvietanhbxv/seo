const { createJsonStorage } = require('./json-storage.cjs')
const { createMysqlStorage } = require('./mysql-storage.cjs')

function normalizeStorageDriver(value) {
  const driver = String(value || 'json').trim().toLowerCase()
  if (driver === 'mysql' || driver === 'mariadb') return 'mysql'
  return 'json'
}

function createStorage(options) {
  const storageDriver = normalizeStorageDriver(options.storageDriver || process.env.SEO_OPS_STORAGE_DRIVER)
  if (storageDriver === 'mysql') return createMysqlStorage(options)
  return createJsonStorage(options)
}

module.exports = { createStorage, normalizeStorageDriver }
