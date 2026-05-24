const fs = require('fs')
const path = require('path')

const appDir = path.resolve(__dirname, '..')
const distDir = path.join(appDir, 'dist')

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  throw new Error('dist/index.html does not exist. Run npm run build:seo-domain first.')
}

for (const entry of fs.readdirSync(distDir)) {
  fs.cpSync(path.join(distDir, entry), path.join(appDir, entry), { recursive: true })
}

console.log('Published dist files to application root.')
