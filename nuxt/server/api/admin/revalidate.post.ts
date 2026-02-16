import { createError, defineEventHandler, getHeader, readBody, type H3Event } from 'h3'

type RevalidateBody = {
  mode?: 'all' | 'targeted'
  paths?: string[]
  reason?: string
}

type RevalidateResult = {
  ok: boolean
  mode: 'all' | 'targeted'
  removed: number
  scanned: number
  matched: number
  reason: string
  paths: string[]
}

function normalizePath(path: string): string {
  const value = String(path || '').trim()
  if (!value) return ''
  if (value.startsWith('/')) return value
  return `/${value}`
}

function escapeKey(key: string): string {
  return String(key).replace(/\W/g, '')
}

function ensureAuthorized(event: H3Event, token: string): void {
  if (!token) {
    throw createError({ statusCode: 500, statusMessage: '服务端未配置 revalidate token' })
  }

  const authHeader = getHeader(event, 'authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!bearer || bearer !== token) {
    throw createError({ statusCode: 401, statusMessage: '未授权的缓存刷新请求' })
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  ensureAuthorized(event, String(config.revalidateToken || ''))

  const body = await readBody<RevalidateBody>(event).catch(() => ({} as RevalidateBody))
  const mode: 'all' | 'targeted' = body?.mode === 'targeted' ? 'targeted' : 'all'
  const normalizedPaths = Array.isArray(body?.paths)
    ? body.paths.map(normalizePath).filter(Boolean)
    : []

  const storage = useStorage('cache') as {
    getKeys?: (base?: string) => Promise<string[]>
    removeItem: (key: string) => Promise<void>
  }

  const keys = typeof storage.getKeys === 'function'
    ? await storage.getKeys('nitro/handlers')
    : []

  const escapedPaths = normalizedPaths.map(escapeKey)
  const targets = mode === 'all'
    ? keys
    : keys.filter((key) => escapedPaths.some((pathKey) => pathKey && key.includes(pathKey)))

  let removed = 0
  for (const key of targets) {
    await storage.removeItem(key)
    removed += 1
  }

  const result: RevalidateResult = {
    ok: true,
    mode,
    removed,
    scanned: keys.length,
    matched: targets.length,
    reason: body?.reason || 'manual',
    paths: normalizedPaths
  }

  return result
})
