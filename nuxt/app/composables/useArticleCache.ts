import { useSearchWorker } from '~/composables/useSearchWorker'
import type { ArticleLike, SearchQueryOptions } from '~/utils/workers/types'

type ArticleListResponse =
  | ArticleLike[]
  | {
    data?: ArticleLike[]
    total?: number
    pageSize?: number
  }

export const useArticleCache = () => {
  const searchWorker = process.client ? useSearchWorker() : null

  const getBaseURL = (): string => {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase

    if (apiBase) {
      if (process.server && apiBase.startsWith('/')) {
        return `http://127.0.0.1:5000${apiBase}`
      }
      return apiBase
    }

    return process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'
  }

  const articlesCache = useState<ArticleLike[] | null>('articles-cache', () => null)
  const articlesCacheTime = useState<number>('articles-cache-time', () => 0)
  const isLoadingArticles = useState<boolean>('articles-loading', () => false)

  const CACHE_DURATION = 5 * 60 * 1000

  const isCacheValid = (): boolean => {
    if (!articlesCache.value) return false
    return Date.now() - articlesCacheTime.value < CACHE_DURATION
  }

  const getAllArticles = async (forceRefresh = false): Promise<ArticleLike[] | null> => {
    if (!forceRefresh && isCacheValid()) {
      return articlesCache.value
    }

    if (isLoadingArticles.value) {
      await new Promise<void>((resolve) => {
        const checkCache = setInterval(() => {
          if (!isLoadingArticles.value) {
            clearInterval(checkCache)
            resolve()
          }
        }, 50)
      })
      return articlesCache.value
    }

    isLoadingArticles.value = true

    try {
      const baseURL = getBaseURL()
      const result = await $fetch<ArticleListResponse>(`${baseURL}/articles`, {
        params: { summary: true, page: 1, limit: 100 }
      })

      let allArticles: ArticleLike[] = []

      if (Array.isArray(result)) {
        allArticles = result
      } else if (result.data) {
        const { data, total = 0, pageSize = 100 } = result
        allArticles = [...data]

        const totalPages = Math.ceil(total / pageSize)
        if (totalPages > 1) {
          const promises: Array<Promise<ArticleListResponse>> = []
          for (let page = 2; page <= totalPages; page++) {
            promises.push(
              $fetch<ArticleListResponse>(`${baseURL}/articles`, {
                params: { summary: true, page, limit: 100 }
              })
            )
          }

          const results = await Promise.all(promises)
          results.forEach((res) => {
            if (Array.isArray(res)) {
              allArticles.push(...res)
            } else if (res.data) {
              allArticles.push(...res.data)
            }
          })
        }
      }

      allArticles.sort((a, b) => {
        const left = Number.parseInt(String(b.id ?? ''), 10) || 0
        const right = Number.parseInt(String(a.id ?? ''), 10) || 0
        return left - right
      })

      articlesCache.value = allArticles
      articlesCacheTime.value = Date.now()

      if (searchWorker && allArticles.length > 0) {
        searchWorker.buildIndex(allArticles).catch(() => {})
      }

      return allArticles
    } catch (error) {
      console.error('获取文章缓存失败:', error)
      throw error
    } finally {
      isLoadingArticles.value = false
    }
  }

  const categoryStats = computed<Record<string, number>>(() => {
    if (!articlesCache.value) return {}

    const stats: Record<string, number> = { study: 0, game: 0, work: 0, resource: 0 }
    articlesCache.value.forEach((article) => {
      if (article.category && stats[article.category] !== undefined) {
        stats[article.category]++
      }
    })
    return stats
  })

  const monthStats = computed<Record<string, number>>(() => {
    if (!articlesCache.value) return {}

    const stats: Record<string, number> = {}
    articlesCache.value.forEach((article) => {
      if (article.createdAt) {
        const date = new Date(article.createdAt)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        stats[key] = (stats[key] || 0) + 1
      }
    })
    return stats
  })

  const getArticlesByCategory = (category: string): ArticleLike[] => {
    if (!articlesCache.value) return []
    return articlesCache.value.filter((article) => article.category === category)
  }

  const searchArticlesLocal = (keyword: string): ArticleLike[] => {
    if (!articlesCache.value || !keyword) return []
    const lowerKeyword = keyword.toLowerCase()
    return articlesCache.value.filter((article) =>
      article.title?.toLowerCase().includes(lowerKeyword) ||
      article.summary?.toLowerCase().includes(lowerKeyword) ||
      article.tags?.some((tag) => tag.toLowerCase().includes(lowerKeyword))
    )
  }

  const searchArticlesAsync = async (keyword: string): Promise<ArticleLike[]> => {
    if (!articlesCache.value || !keyword) return []
    if (searchWorker) {
      return searchWorker.search(articlesCache.value, keyword)
    }
    return searchArticlesLocal(keyword)
  }

  const queryArticlesAsync = async (options: SearchQueryOptions = {}): Promise<ArticleLike[]> => {
    if (!articlesCache.value) return []
    if (searchWorker) {
      return searchWorker.query(articlesCache.value, options)
    }

    let result: ArticleLike[] = articlesCache.value
    if (options.keyword) result = searchArticlesLocal(options.keyword)
    if (options.category && options.category !== 'all') {
      result = result.filter((article) => article.category === options.category)
    }
    return result
  }

  const invalidateCache = (): void => {
    articlesCache.value = null
    articlesCacheTime.value = 0
  }

  const preloadCache = async (): Promise<void> => {
    if (!isCacheValid()) {
      await getAllArticles()
    }
  }

  return {
    getAllArticles,
    getArticlesByCategory,
    searchArticlesLocal,
    searchArticlesAsync,
    queryArticlesAsync,
    categoryStats,
    monthStats,
    isCacheValid,
    invalidateCache,
    preloadCache,
    isLoading: isLoadingArticles,
    cachedArticles: articlesCache
  }
}
