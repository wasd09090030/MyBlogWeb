/**
 * 文章搜索 Worker Composable
 */

import { createWorkerManager, isWorkerSupported } from '~/utils/workers/workerManager'
import type {
  ArticleLike,
  SearchQueryOptions,
  SearchWorkerActionMap
} from '~/utils/workers/types'

let searchWorkerManager: ReturnType<typeof createWorkerManager<SearchWorkerActionMap>> | null = null

function getManager() {
  if (searchWorkerManager) return searchWorkerManager

  if (!isWorkerSupported() || !process.client) return null

  try {
    searchWorkerManager = createWorkerManager<SearchWorkerActionMap>(
      'article-search',
      () => new Worker(
        new URL('~/utils/workers/articleSearch.worker.ts', import.meta.url),
        { type: 'module' }
      ),
      { timeout: 10000, singleton: true, maxRetries: 1 }
    )
    return searchWorkerManager
  } catch (e: any) {
    console.warn('[useSearchWorker] Worker 创建失败:', e?.message)
    return null
  }
}

function searchFallback(articles: ArticleLike[] | null | undefined, keyword: string): ArticleLike[] {
  if (!articles || !keyword) return []
  const lower = keyword.toLowerCase()
  return articles.filter((article) =>
    article.title?.toLowerCase().includes(lower) ||
    article.summary?.toLowerCase().includes(lower) ||
    article.tags?.some((tag) => tag.toLowerCase().includes(lower))
  )
}

function filterFallback(
  articles: ArticleLike[] | null | undefined,
  category?: string,
  tag?: string
): ArticleLike[] {
  let result = articles || []
  if (category && category !== 'all') {
    result = result.filter((a) => a.category === category)
  }
  if (tag) {
    const lower = tag.toLowerCase()
    result = result.filter((a) => a.tags?.some((t) => t.toLowerCase() === lower))
  }
  return result
}

function sortFallback(
  articles: ArticleLike[] | null | undefined,
  sortBy: 'date' | 'title' | 'id' = 'date',
  order: 'asc' | 'desc' = 'desc'
): ArticleLike[] {
  const sorted = [...(articles || [])]
  if (sortBy === 'date') {
    sorted.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return order === 'desc' ? db - da : da - db
    })
  }
  return sorted
}

export function useSearchWorker() {
  const indexBuilt = ref(false)

  async function buildIndex(articles: ArticleLike[] | null | undefined): Promise<void> {
    if (!articles || articles.length === 0) return

    const manager = getManager()
    if (!manager) return

    try {
      await manager.postTask('buildIndex', { articles })
      indexBuilt.value = true
      console.log(`[SearchWorker] 索引构建完成，共 ${articles.length} 篇文章`)
    } catch (e: any) {
      console.warn('[SearchWorker] 索引构建失败:', e?.message)
    }
  }

  async function search(articles: ArticleLike[] | null | undefined, keyword: string): Promise<ArticleLike[]> {
    if (!keyword) return articles || []

    const manager = getManager()
    if (!manager) {
      return searchFallback(articles, keyword)
    }

    return manager.postTaskWithFallback(
      'search',
      { articles: articles || [], keyword },
      () => searchFallback(articles, keyword)
    )
  }

  async function query(articles: ArticleLike[] | null | undefined, options: SearchQueryOptions = {}): Promise<ArticleLike[]> {
    const manager = getManager()
    if (!manager) {
      let result = articles || []
      if (options.keyword) result = searchFallback(result, options.keyword)
      result = filterFallback(result, options.category, options.tag)
      if (!options.keyword) result = sortFallback(result, options.sortBy, options.order)
      return result
    }

    return manager.postTaskWithFallback(
      'query',
      { articles: articles || [], options },
      () => {
        let result = articles || []
        if (options.keyword) result = searchFallback(result, options.keyword)
        result = filterFallback(result, options.category, options.tag)
        if (!options.keyword) result = sortFallback(result, options.sortBy, options.order)
        return result
      }
    )
  }

  function dispose() {
    if (searchWorkerManager) {
      searchWorkerManager.terminate()
      searchWorkerManager = null
    }
    indexBuilt.value = false
  }

  return {
    buildIndex,
    search,
    query,
    dispose,
    indexBuilt: readonly(indexBuilt)
  }
}
