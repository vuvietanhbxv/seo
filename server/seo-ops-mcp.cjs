const crypto = require('crypto')

const protocolVersion = '2024-11-05'

function textResult(payload) {
  return {
    content: [
      {
        type: 'text',
        text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
      },
    ],
  }
}

function rpcResult(id, result) {
  return { jsonrpc: '2.0', id, result }
}

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

function secureEquals(left, right) {
  const leftBuffer = Buffer.from(String(left || ''))
  const rightBuffer = Buffer.from(String(right || ''))
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function createMcpHandler({ readDb, writeDb, token, connectorKey }) {
  function authorized(req) {
    const header = req.headers.authorization || ''
    if (token && header.startsWith('Bearer ') && secureEquals(header.slice(7).trim(), token)) return true
    if (!connectorKey) return false
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    return secureEquals(url.searchParams.get('key'), connectorKey)
  }

  function keywordOutput(data, keyword) {
    const project = data.projects.find((item) => item.id === keyword.projectId)
    const parent = data.keywords.find((item) => item.id === keyword.parentId)
    return {
      id: keyword.id,
      projectId: keyword.projectId,
      projectName: project?.name || '',
      website: project?.website || '',
      term: keyword.term,
      keywordType: keyword.keywordType || 'A',
      parentKeyword: parent?.term || '',
      searchIntent: keyword.searchIntent,
      landingUrl: keyword.landingUrl,
      searchVolume: keyword.searchVolume,
      keywordDifficulty: keyword.keywordDifficulty,
      position: keyword.position,
      articleType: keyword.articleType || 'Informational Content',
      articleTitle: keyword.articleTitle || '',
      articleMetaDescription: keyword.articleMetaDescription || '',
      articleContent: keyword.articleContent || '',
      articleStatus: keyword.articleStatus || 'Chua viet',
      articleUrl: keyword.articleUrl || '',
      articleUpdatedAt: keyword.articleUpdatedAt || '',
    }
  }

  const tools = [
    {
      name: 'seo_list_projects',
      description: 'List SEO Ops projects and their keyword/article counts.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'seo_list_keywords',
      description: 'List keywords available for article writing. Filter by project, text search, or items without an article draft.',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          search: { type: 'string' },
          needsArticle: { type: 'boolean' },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
        },
      },
    },
    {
      name: 'seo_get_keyword',
      description: 'Get one keyword with SEO metrics and any existing article draft before writing or revising content.',
      inputSchema: {
        type: 'object',
        required: ['keywordId'],
        properties: { keywordId: { type: 'string' } },
      },
    },
    {
      name: 'seo_save_article_draft',
      description: 'Save a Claude-written article draft to a keyword in SEO Ops. Content can be Markdown or HTML.',
      inputSchema: {
        type: 'object',
        required: ['keywordId', 'title', 'content'],
        properties: {
          keywordId: { type: 'string' },
          title: { type: 'string' },
          metaDescription: { type: 'string' },
          content: { type: 'string' },
          status: { type: 'string', enum: ['Ban nhap AI', 'Cho duyet', 'Da duyet', 'Can chinh sua'] },
        },
      },
    },
    {
      name: 'seo_update_article_status',
      description: 'Update review status for an article already saved in SEO Ops.',
      inputSchema: {
        type: 'object',
        required: ['keywordId', 'status'],
        properties: {
          keywordId: { type: 'string' },
          status: { type: 'string', enum: ['Ban nhap AI', 'Cho duyet', 'Da duyet', 'Can chinh sua'] },
        },
      },
    },
  ]

  function callTool(name, args = {}) {
    const data = readDb()
    switch (name) {
      case 'seo_list_projects': {
        return textResult(
          data.projects
            .filter((project) => !project.deletedAt)
            .map((project) => {
              const keywords = data.keywords.filter((keyword) => keyword.projectId === project.id)
              return {
                id: project.id,
                name: project.name,
                website: project.website,
                keywordCount: keywords.length,
                draftedArticleCount: keywords.filter((keyword) => keyword.articleContent).length,
              }
            }),
        )
      }
      case 'seo_list_keywords': {
        const query = String(args.search || '').toLowerCase().trim()
        const limit = Math.min(Math.max(Number(args.limit) || 30, 1), 100)
        const keywords = data.keywords
          .filter((keyword) => !args.projectId || keyword.projectId === args.projectId)
          .filter((keyword) => !query || `${keyword.term} ${keyword.articleTitle || ''}`.toLowerCase().includes(query))
          .filter((keyword) => !args.needsArticle || !keyword.articleContent)
          .slice(0, limit)
          .map((keyword) => keywordOutput(data, keyword))
        return textResult(keywords)
      }
      case 'seo_get_keyword': {
        const keyword = data.keywords.find((item) => item.id === args.keywordId)
        if (!keyword) throw new Error('Keyword not found.')
        return textResult(keywordOutput(data, keyword))
      }
      case 'seo_save_article_draft': {
        const keyword = data.keywords.find((item) => item.id === args.keywordId)
        if (!keyword) throw new Error('Keyword not found.')
        if (!String(args.title || '').trim() || !String(args.content || '').trim()) {
          throw new Error('Title and content are required.')
        }
        const updatedAt = new Date().toISOString()
        const nextKeyword = {
          ...keyword,
          articleTitle: String(args.title).trim(),
          articleMetaDescription: String(args.metaDescription || '').trim(),
          articleContent: String(args.content),
          articleStatus: String(args.status || 'Ban nhap AI'),
          articleUpdatedAt: updatedAt,
          articleSource: 'Claude MCP',
        }
        writeDb({
          ...data,
          keywords: data.keywords.map((item) => (item.id === keyword.id ? nextKeyword : item)),
        })
        return textResult({ saved: true, keyword: keywordOutput(data, nextKeyword) })
      }
      case 'seo_update_article_status': {
        const keyword = data.keywords.find((item) => item.id === args.keywordId)
        if (!keyword) throw new Error('Keyword not found.')
        const nextKeyword = {
          ...keyword,
          articleStatus: String(args.status),
          articleUpdatedAt: new Date().toISOString(),
        }
        writeDb({
          ...data,
          keywords: data.keywords.map((item) => (item.id === keyword.id ? nextKeyword : item)),
        })
        return textResult({ saved: true, keyword: keywordOutput(data, nextKeyword) })
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true }
    }
  }

  async function handle(req, res, readBody, sendJson) {
    if (!token && !connectorKey) {
      sendJson(res, 503, { ok: false, message: 'MCP disabled. Set SEO_OPS_MCP_TOKEN or SEO_OPS_MCP_CONNECTOR_KEY on the server.' })
      return
    }
    if (!authorized(req)) {
      sendJson(res, 401, rpcError(null, -32001, 'Unauthorized: invalid Bearer token.'))
      return
    }
    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, message: 'MCP endpoint accepts POST requests only.' })
      return
    }

    const request = JSON.parse(await readBody(req))
    const id = request.id ?? null
    if (String(request.method || '').startsWith('notifications/')) {
      res.writeHead(202)
      res.end()
      return
    }

    try {
      switch (request.method) {
        case 'initialize':
          sendJson(res, 200, rpcResult(id, {
            protocolVersion,
            capabilities: { tools: {} },
            serverInfo: { name: 'seo-ops-mcp', version: '1.0.0' },
          }))
          return
        case 'ping':
          sendJson(res, 200, rpcResult(id, {}))
          return
        case 'tools/list':
          sendJson(res, 200, rpcResult(id, { tools }))
          return
        case 'tools/call':
          sendJson(res, 200, rpcResult(id, callTool(request.params?.name, request.params?.arguments || {})))
          return
        default:
          sendJson(res, 200, rpcError(id, -32601, `Method not found: ${request.method}`))
      }
    } catch (error) {
      sendJson(res, 200, rpcError(id, -32603, error.message || 'MCP tool error.'))
    }
  }

  return { handle, configured: Boolean(token || connectorKey), connectorKeyConfigured: Boolean(connectorKey) }
}

module.exports = { createMcpHandler }
