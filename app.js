import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(appDir, 'dist')

if (process.env.SEO_OPS_PUBLISH_DIST !== 'false' && fs.existsSync(path.join(distDir, 'index.html'))) {
  for (const entry of fs.readdirSync(distDir)) {
    fs.cpSync(path.join(distDir, entry), path.join(appDir, entry), { recursive: true })
  }
}

await import('./server/seo-ops-server.cjs')
