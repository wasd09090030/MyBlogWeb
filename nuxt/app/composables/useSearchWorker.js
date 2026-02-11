/**
 * 文章搜索 Worker Composable
 *
 * 封装 Article Search Worker 的通信逻辑，提供：
 * - buildIndex(): 构建倒排索引
 * - search(): 全文搜索
 * - query(): 组合查询（搜索 + 过滤 + 排序）
 *
 * 自动降级：Worker 不可用时在主线程执行
 */

import { createWorkerManager, isWorkerSupported } from '~/utils/workers/workerManager'

// Worker 管理器单例
let searchWorkerManager = null

/**
 * 获取或创建 Search Worker 管理器
 */
function getManager() {
  if (searchWorkerManager) return searchWorkerManager

  if (!isWorkerSupported() || !process.client) return null

  try {
    searchWorkerManager = createWorkerManager(
      'article-search',
      () => new Worker(
        new URL('~/utils/workers/articleSearch.worker.js', import.meta.url),
        { type: 'module' }
      ),
      { timeout: 10000, singleton: true, maxRetries: 1 }
    )
    return searchWorkerManager
  } catch (e) {
    console.warn('[useSearchWorker] Worker 创建失败:', e.message)
    return null
  }
}

// =========================================================
// 主线程降级函数
// =========================================================

function searchFallback(articles, keyword) {
  if (!articles || !keyword) return []
  const lower = keyword.toLowerCase()
  return articles.filter(article =>
    article.title?.toLowerCase().includes(lower) ||
    article.summary?.toLowerCase().includes(lower) ||
    article.tags?.some(tag => tag.toLowerCase().includes(lower))
  )
}

function filterFallback(articles, category, tag) {
  let result = articles || []
  if (category && category !== 'all') {
    result = result.filter(a => a.category === category)
  }
  if (tag) {
    const lower = tag.toLowerCase()
    result = result.filter(a => a.tags?.some(t => t.toLowerCase() === lower))
  }
  return result
}

function sortFallback(articles, sortBy = 'date', order = 'desc') {
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

// =========================================================
// Composable
// =========================================================

export function useSearchWorker() {
  const indexBuilt = ref(false)

  /**
   * 构建倒排索引（后台执行，不阻塞 UI）
   * @param {Array} articles - 文章数组
   */
  async function buildIndex(articles) {
    if (!articles || articles.length === 0) return

    const manager = getManager()
    if (!manager) return

    try {
      await manager.postTask('buildIndex', { articles })
      indexBuilt.value = true
      console.log(`[SearchWorker] 索引构建完成，共 ${articles.length} 篇文章`)
    } catch (e) {
      console.warn('[SearchWorker] 索引构建失败:', e.message)
    }
  }

  /**
   * 搜索文章
   * @param {Array} articles - 文章数组
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>} 搜索结果
   */
  async function search(articles, keyword) {
    if (!keyword) return articles || []

    const manager = getManager()
    if (!manager) {
      return searchFallback(articles, keyword)
    }

    return manager.postTaskWithFallback(
      'search',
      { articles, keyword },
      () => searchFallback(articles, keyword)
    )
  }

  /**
   * 组合查询（搜索 + 过滤 + 排序）
   * @param {Array} articles - 文章数组
   * @param {Object} options - 查询选项
   * @param {string} options.keyword - 搜索关键词
   * @param {string} options.category - 分类
   * @param {string} options.tag - 标签
   * @param {string} options.sortBy - 排序字段 (date/title/id)
   * @param {string} options.order - 排序方向 (asc/desc)
   * @returns {Promise<Array>} 查询结果
   */
  async function query(articles, options = {}) {
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
      { articles, options },
      () => {
        let result = articles || []
        if (options.keyword) result = searchFallback(result, options.keyword)
        result = filterFallback(result, options.category, options.tag)
        if (!options.keyword) result = sortFallback(result, options.sortBy, options.order)
        return result
      }
    )
  }

  /**
   * 销毁 Worker
   */
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
