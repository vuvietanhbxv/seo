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

for (const entry of ['server', 'scripts']) {
  fs.rmSync(path.join(deployDir, entry), { recursive: true, force: true })
  fs.cpSync(path.join(appDir, entry), path.join(deployDir, entry), { recursive: true })
}

for (const entry of ['app.js', 'ecosystem.config.cjs', 'package.json', 'package-lock.json', '.env.example', 'README.md']) {
  fs.cpSync(path.join(appDir, entry), path.join(deployDir, entry))
}

fs.mkdirSync(path.join(deployDir, 'deploy', 'cloudpanel'), { recursive: true })
for (const entry of ['README-CLOUDPANEL.md', 'README-MARIADB.md', 'deploy.sh', 'update.sh']) {
  const sourcePath = path.join(appDir, 'deploy', 'cloudpanel', entry)
  if (fs.existsSync(sourcePath)) {
    fs.cpSync(sourcePath, path.join(deployDir, 'deploy', 'cloudpanel', entry))
  }
}

console.log('Published CloudPanel bundle to deploy/seo-ops-web.')
console.log('Runtime data is not copied. Keep SEO_OPS_DB_DIR outside the Git/application directory.')
