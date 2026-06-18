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

const googleDriveIdFromRef = (value: string) => {
  const text = String(value || '').trim()
  if (!text) return ''
  if (/^[A-Za-z0-9_-]{20,}$/.test(text)) return text
  try {
    const driveUrl = new URL(text)
    if (!/(^|\.)drive\.google\.com$/i.test(driveUrl.hostname) && !/(^|\.)docs\.google\.com$/i.test(driveUrl.hostname)) return ''
    const patterns = [
      /\/folders\/([A-Za-z0-9_-]+)/,
      /\/file\/d\/([A-Za-z0-9_-]+)/,
      /\/document\/d\/([A-Za-z0-9_-]+)/,
      /\/presentation\/d\/([A-Za-z0-9_-]+)/,
      /\/spreadsheets\/d\/([A-Za-z0-9_-]+)/,
    ]
    for (const pattern of patterns) {
      const match = driveUrl.pathname.match(pattern)
      if (match?.[1]) return match[1]
    }
    return driveUrl.searchParams.get('id') || ''
  } catch {
    return ''
  }
}

const googleDriveQueryStringLiteral = (value: string) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 20000) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

const findGoogleDriveFileIdByName = async (folderRef: string, fileName: string, apiKey: string) => {
  if (!apiKey) {
    throw new Error('Server chưa cấu hình SEO_OPS_GOOGLE_DRIVE_API_KEY nên chưa thể tìm file theo tên trong thư mục Drive. Có thể dán thẳng link file Google Drive vào ô Hướng dẫn khác để mở không cần API key.')
  }
  const folderId = googleDriveIdFromRef(folderRef)
  if (!folderId) throw new Error('Link thư mục Google Drive không hợp lệ.')
  const apiUrl = new URL('https://www.googleapis.com/drive/v3/files')
  apiUrl.searchParams.set('key', apiKey)
  apiUrl.searchParams.set('pageSize', '10')
  apiUrl.searchParams.set('fields', 'files(id,name,mimeType,size)')
  apiUrl.searchParams.set('q', `${googleDriveQueryStringLiteral(folderId)} in parents and name = ${googleDriveQueryStringLiteral(fileName)} and trashed = false`)
  const response = await fetchWithTimeout(apiUrl.toString(), { headers: { Accept: 'application/json' } }, 20000)
  const payload = await response.json().catch(() => ({})) as { error?: { message?: string }; files?: Array<{ id?: string; name?: string }> }
  if (!response.ok) throw new Error(payload.error?.message || `Google Drive API HTTP ${response.status}`)
  const file = payload.files?.find((item) => item.name === fileName)
  if (!file?.id) throw new Error(`Không tìm thấy file "${fileName}" trong thư mục Google Drive.`)
  return file.id
}

const fetchGoogleDriveHtml = async (fileId: string) => {
  if (!/^[A-Za-z0-9_-]{20,}$/.test(fileId)) throw new Error('Google Drive file ID không hợp lệ.')
  const response = await fetchWithTimeout(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`, {
    headers: { Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1' },
  }, 25000)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (!response.ok) throw new Error(`Google Drive download HTTP ${response.status}`)
  if (!bytes.length) throw new Error('File Google Drive rỗng.')
  if (bytes.length > htmlGuideMaxBytes) throw new Error('File HTML hướng dẫn Entity tối đa 2MB.')
  return bytes
}

const serveGoogleDriveEntityGuide = async (fileName: string, searchParams: URLSearchParams, res: ServerResponse, apiKey: string) => {
  const driveFileRef = searchParams.get('driveFile') || ''
  const driveFolderRef = searchParams.get('driveFolder') || process.env.SEO_OPS_ENTITY_GUIDE_DRIVE_FOLDER || ''
  let fileId = googleDriveIdFromRef(driveFileRef)
  if (!fileId && driveFolderRef) fileId = await findGoogleDriveFileIdByName(driveFolderRef, fileName, apiKey)
  if (!fileId) return false
  const bytes = await fetchGoogleDriveHtml(fileId)
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Content-Disposition', `inline; filename="${fileName.replace(/"/g, '')}"`)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(bytes)
  return true
}

const entityGuideDevApi = (): Plugin => ({
  name: 'seo-ops-entity-guide-dev-api',
  configureServer(server) {
    const googleDriveApiKey = process.env.SEO_OPS_GOOGLE_DRIVE_API_KEY || process.env.GOOGLE_DRIVE_API_KEY || ''
    const entityGuideDir = process.env.SEO_OPS_ENTITY_GUIDE_DIR
      ? path.resolve(process.env.SEO_OPS_ENTITY_GUIDE_DIR)
      : path.join(process.cwd(), 'db', 'Entity Guide')
    const legacyEntityGuideDir = path.join(process.cwd(), 'db', 'entity-guides')
    const entityGuideSearchDirs = [...new Set([entityGuideDir, legacyEntityGuideDir].map((item) => path.resolve(item)))]

    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url || '/', 'http://localhost')

      if (url.pathname.startsWith('/entity-guides/')) {
        try {
          const fileName = safeEntityGuideFileName(decodeURIComponent(url.pathname.replace(/^\/entity-guides\/?/, '')))
          const targetPath = entityGuideSearchDirs
            .map((guideDir) => ({
              guideDir,
              filePath: path.resolve(path.join(guideDir, fileName)),
            }))
            .find(({ guideDir, filePath }) =>
              isInsideDirectory(guideDir, filePath) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile(),
            )?.filePath
          if (!targetPath) {
            try {
              if (await serveGoogleDriveEntityGuide(fileName, url.searchParams, res, googleDriveApiKey)) return
            } catch (error) {
              sendEntityGuideError(res, 502, 'Không mở được hướng dẫn Google Drive', error instanceof Error ? error.message : 'Không tải được file HTML từ Google Drive.')
              return
            }
            sendEntityGuideError(res, 404, 'Không tìm thấy file hướng dẫn', `Không tìm thấy "${fileName}" trong storage server hoặc Google Drive đã cấu hình.`)
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
