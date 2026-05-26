const fs = require('fs')
const path = require('path')

const appDir = path.resolve(__dirname, '..')
const distDir = path.join(appDir, 'dist')
const deployDir = path.join(appDir, 'deploy', 'seo-ops-web')
const deployAssetsDir = path.join(deployDir, 'assets')

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  throw new Error('dist/index.html does not exist. Run npm run build:seo-domain first.')
}

if (!path.resolve(deployDir).startsWith(path.join(appDir, 'deploy'))) {
  throw new Error('Unsafe deploy path.')
}

fs.mkdirSync(deployAssetsDir, { recursive: true })
for (const entry of fs.readdirSync(deployAssetsDir)) {
  fs.rmSync(path.join(deployAssetsDir, entry), { recursive: true, force: true })
}
for (const entry of fs.readdirSync(distDir)) {
  fs.cpSync(path.join(distDir, entry), path.join(deployDir, entry), { recursive: true })
}
fs.mkdirSync(path.join(deployDir, 'server'), { recursive: true })
fs.cpSync(path.join(appDir, 'server', 'seo-ops-server.cjs'), path.join(deployDir, 'server', 'seo-ops-server.cjs'))
fs.cpSync(path.join(appDir, 'server', 'seo-ops-mcp.cjs'), path.join(deployDir, 'server', 'seo-ops-mcp.cjs'))
fs.cpSync(path.join(appDir, 'app.js'), path.join(deployDir, 'app.js'))
fs.cpSync(path.join(appDir, 'package.json'), path.join(deployDir, 'package.json'))
fs.cpSync(path.join(appDir, 'package-lock.json'), path.join(deployDir, 'package-lock.json'))
fs.cpSync(path.join(appDir, 'README.md'), path.join(deployDir, 'README.md'))

console.log('Published code assets to deploy/seo-ops-web.')
console.log('Runtime database is not copied. Configure SEO_OPS_DB_DIR outside the application directory in production.')
