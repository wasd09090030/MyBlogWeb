/**
 * 文章预加载缓存（模块级单例）
 *
 * 存储通过后台预加载的完整文章数据（含 _mdcAst 解析结果），
 * 供 [id].vue 的 useAsyncData getCachedData 使用，实现“零阻塞”导航。
 *
 * 特性：
 * - 一次性消费：consumePreloadedArticle 读取后自动删除
 * - 5 分钟 TTL 自动过期
 * - 仅客户端有效（调用方负责确保只在 client 侧写入）
 */

type CacheEntry = {
  data: unknown
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟

/**
 * 存入预加载数据
 * @param key - useAsyncData 的 key，格式：`article-{rawId}`
 * @param data - 完整文章数据（含 _mdcAst, _mdcToc）
 */
export function setPreloadedArticle<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

/**
 * 获取并消费预加载数据（一次性使用）
 * @param key - useAsyncData 的 key
 * @returns 文章数据，未命中返回 undefined
 */
export function consumePreloadedArticle<T = unknown>(key: string): T | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined

  // 过期检查
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return undefined
  }

  // 一次性消费
  cache.delete(key)
  return entry.data as T
}

/**
 * 检查是否有预加载数据
 */
export function hasPreloadedArticle(key: string): boolean {
  const entry = cache.get(key)
  if (!entry) return false
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return false
  }
  return true
}

/**
 * 清除所有预加载缓存
 */
export function clearPreloadCache(): void {
  cache.clear()
}
