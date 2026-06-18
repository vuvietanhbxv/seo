import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

const htmlGuideMaxBytes = 2 * 1024 * 1024

const sendJson = (res: ServerResponse, status: number, payload: unknown) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

const readBody = (req: IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > htmlGuideMaxBytes * 2) {
        reject(new Error('Payload too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })

const safeEntityGuideFileName = (fileName: string) => {
  const baseName = path.basename(String(fileName || '').trim()).trim()
  if (!baseName || !/\.html?$/i.test(baseName)) {
    throw new Error('Tên file hướng dẫn Entity phải là file .html hoặc .htm.')
  }
  const safeName = baseName.replace(/[^A-Za-z0-9._ -]/g, '-').replace(/\s+/g, '-')
  if (!safeName || safeName === '.' || safeName === '..') {
    throw new Error('Tên file hướng dẫn Entity không hợp lệ.')
  }
  return safeName
}

const isInsideDirectory = (parentDir: string, targetPath: string) => {
  const relative = path.relative(parentDir, targetPath)
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative)
}

const entityGuideDevApi = (): Plugin => ({
  name: 'seo-ops-entity-guide-dev-api',
  configureServer(server) {
    const entityGuideDir = path.join(process.cwd(), 'db', 'entity-guides')

    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url || '/', 'http://localhost')

      if (url.pathname.startsWith('/entity-guides/')) {
        try {
          const fileName = safeEntityGuideFileName(decodeURIComponent(url.pathname.replace(/^\/entity-guides\/?/, '')))
          const targetPath = path.resolve(path.join(entityGuideDir, fileName))
          if (!isInsideDirectory(entityGuideDir, targetPath) || !fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.end('Not found')
            return
          }
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'no-cache')
          fs.createReadStream(targetPath).pipe(res)
        } catch {
          res.statusCode = 404
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('Not found')
        }
        return
      }

      if (url.pathname !== '/api/entity-guides/upload') {
        next()
        return
      }

      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, message: 'Method not allowed' })
        return
      }

      try {
        const payload = JSON.parse(await readBody(req))
        const fileName = safeEntityGuideFileName(payload.fileName)
        const bytes = Buffer.from(String(payload.contentBase64 || ''), 'base64')
        if (!bytes.length || bytes.length > htmlGuideMaxBytes) {
          sendJson(res, 400, { ok: false, message: 'File HTML hướng dẫn Entity tối đa 2MB.' })
          return
        }

        fs.mkdirSync(entityGuideDir, { recursive: true })
        const targetPath = path.resolve(path.join(entityGuideDir, fileName))
        if (!isInsideDirectory(entityGuideDir, targetPath)) {
          sendJson(res, 400, { ok: false, message: 'Tên file không hợp lệ.' })
          return
        }

        fs.writeFileSync(targetPath, bytes)
        sendJson(res, 200, {
          ok: true,
          fileName,
          url: `/entity-guides/${encodeURIComponent(fileName)}`,
          savedAt: new Date().toISOString(),
        })
      } catch (error) {
        sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : 'Không upload được file HTML.' })
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [entityGuideDevApi(), react()],
})
