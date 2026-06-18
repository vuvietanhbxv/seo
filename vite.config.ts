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
      if (body.length > 25 * 1024 * 1024) {
        reject(new Error('Payload too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })

const safeEntityGuideFileName = (fileName: string) => {
  const baseName = path.posix.basename(String(fileName || '').trim().replace(/\\/g, '/')).trim()
  if (!baseName || !/\.html?$/i.test(baseName)) {
    throw new Error('Tên file hướng dẫn Entity phải là file .html hoặc .htm.')
  }
  const safeName = baseName.replace(/[<>:"|?*\x00-\x1F]/g, '-')
  if (!safeName || safeName === '.' || safeName === '..') {
    throw new Error('Tên file hướng dẫn Entity không hợp lệ.')
  }
  return safeName
}

const isInsideDirectory = (parentDir: string, targetPath: string) => {
  const relative = path.relative(parentDir, targetPath)
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative)
}

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const sendEntityGuideError = (res: ServerResponse, status: number, title: string, message: string) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.end(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;margin:40px;background:#f8fafc;color:#0f172a}.box{max-width:760px;background:white;border:1px solid #dbe4f0;border-radius:14px;padding:24px;box-shadow:0 18px 45px rgba(15,23,42,.08)}h1{margin:0 0 12px;font-size:22px}p{line-height:1.6;color:#475569}</style></head><body><main class="box"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></main></body></html>`)
}

const entityGuideDevApi = (): Plugin => ({
  name: 'seo-ops-entity-guide-dev-api',
  configureServer(server) {
    const entityGuideDir = process.env.SEO_OPS_ENTITY_GUIDE_DIR
      ? path.resolve(process.env.SEO_OPS_ENTITY_GUIDE_DIR)
      : path.join(process.cwd(), 'db', 'Entity Guide')
    const legacyEntityGuideDir = path.join(process.cwd(), 'db', 'entity-guides')
    const entityGuideSearchDirs = [...new Set([entityGuideDir, legacyEntityGuideDir].map((item) => path.resolve(item)))]
    const entityGuidePublicUrl = (fileName: string) => `/entity-guides/${encodeURIComponent(fileName)}`
    const findEntityGuidePath = (fileName: string) =>
      entityGuideSearchDirs
        .map((guideDir) => ({
          guideDir,
          filePath: path.resolve(path.join(guideDir, fileName)),
        }))
        .find(({ guideDir, filePath }) =>
          isInsideDirectory(guideDir, filePath) &&
          fs.existsSync(filePath) &&
          fs.statSync(filePath).isFile(),
        )?.filePath || ''

    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url || '/', 'http://localhost')

      if (url.pathname.startsWith('/entity-guides/')) {
        try {
          const fileName = safeEntityGuideFileName(decodeURIComponent(url.pathname.replace(/^\/entity-guides\/?/, '')))
          const targetPath = findEntityGuidePath(fileName)
          if (!targetPath) {
            sendEntityGuideError(res, 404, 'Không tìm thấy file hướng dẫn', `Không tìm thấy "${fileName}" trong thư mục hướng dẫn Entity đã cấu hình.`)
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

      if (!['/api/entity-guides/upload', '/api/entity-guides/scan'].includes(url.pathname)) {
        next()
        return
      }

      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, message: 'Method not allowed' })
        return
      }

      try {
        const payload = JSON.parse(await readBody(req))
        if (url.pathname === '/api/entity-guides/scan') {
          const requestedNames: string[] = Array.isArray(payload.fileNames) ? payload.fileNames.map((fileName: unknown) => String(fileName)) : []
          const checkedAt = new Date().toISOString()
          const uniqueNames = Array.from(new Set<string>(requestedNames.map((fileName: string) => safeEntityGuideFileName(fileName))))
          sendJson(res, 200, {
            ok: true,
            files: uniqueNames.map((fileName) => ({
              fileName,
              exists: Boolean(findEntityGuidePath(fileName)),
              url: entityGuidePublicUrl(fileName),
              checkedAt,
            })),
            checkedAt,
            entityGuideDir,
            entityGuideSearchDirs,
          })
          return
        }

        fs.mkdirSync(entityGuideDir, { recursive: true })
        const uploadItems = Array.isArray(payload.files) ? payload.files : [payload]
        if (uploadItems.length === 0) {
          sendJson(res, 400, { ok: false, message: 'Thiếu file HTML hướng dẫn Entity.' })
          return
        }
        const savedAt = new Date().toISOString()
        const files = []
        for (const item of uploadItems) {
          const fileName = safeEntityGuideFileName(item.fileName)
          const bytes = Buffer.from(String(item.contentBase64 || ''), 'base64')
          if (!bytes.length || bytes.length > htmlGuideMaxBytes) {
            sendJson(res, 400, { ok: false, message: `File ${fileName} tối đa 2MB.` })
            return
          }
          const targetPath = path.resolve(path.join(entityGuideDir, fileName))
          if (!isInsideDirectory(entityGuideDir, targetPath)) {
            sendJson(res, 400, { ok: false, message: 'Tên file không hợp lệ.' })
            return
          }
          fs.writeFileSync(targetPath, bytes)
          files.push({ fileName, url: entityGuidePublicUrl(fileName), exists: true, checkedAt: savedAt })
        }
        sendJson(res, 200, { ok: true, files, savedAt })
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
