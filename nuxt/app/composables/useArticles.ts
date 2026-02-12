// 文章相关的Composable
// 提供缓存优化和非缓存两种API访问方式

type ArticlesListOptions = {
  category?: string | null
  page?: number
  limit?: number
  summary?: boolean
}

export const useArticles = () => {
  // 获取 API 基础 URL 的辅助函数（确保在正确的上下文中获取）
  const getBaseURL = (): string => {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase

    // 如果环境变量已配置，直接使用
    if (apiBase) {
      // SSR 阶段：如果是相对路径，转换为内网完整地址
      if (process.server && apiBase.startsWith('/')) {
        return 'http://127.0.0.1:5000' + apiBase
      }
      return apiBase
    }

    // Fallback：生产环境走反向代理，开发环境走本地后端
    return process.env.NODE_ENV === 'production'
      ? '/api'
      : 'http://localhost:5000/api'
  }

  // 引用全局缓存（现阶段保持为 unknown/any，后续可单独为 useArticleCache 建类型）
  const articleCache: any = useArticleCache()

  // 获取推荐文章（使用useFetch自动缓存）
  const getFeaturedArticles = async (limit = 5): Promise<unknown> => {
    const baseURL = getBaseURL()
    const { data, error } = await useFetch<unknown, any>(`${baseURL}/articles/featured`, {
      key: `featured-articles-${limit}`,
      params: { limit },
      // 缓存5分钟
      getCachedData: (key, nuxtApp) => {
        const cached = (nuxtApp.payload as any).data?.[key] || (nuxtApp.static as any).data?.[key]
        if (cached) return cached
        return null
      }
    })

    if (error.value) throw error.value
    return data.value
  }

  // 搜索文章 - 优先使用本地缓存搜索，减少API调用
  const searchArticles = async (keyword: string): Promise<unknown> => {
    // 如果缓存有效，使用本地搜索
    if (articleCache.isCacheValid()) {
      return articleCache.searchArticlesLocal(keyword)
    }
    // 否则调用API
    const baseURL = getBaseURL()
    return await $fetch(`${baseURL}/articles/search`, {
      params: { keyword }
    })
  }

  // 获取文章列表（分页请求）
  const getArticles = async (options: ArticlesListOptions = {}): Promise<unknown> => {
    const {
      category = null,
      page = 1,
      limit = 10,
      summary = true
    } = options

    const params: Record<string, any> = { summary, page, limit }
    if (category) {
      params.category = category
    }

    const baseURL = getBaseURL()
    return await $fetch(`${baseURL}/articles`, {
      params
    })
  }

  // 获取所有文章 - 代理到全局缓存
  const getAllArticles = async (forceRefresh = false): Promise<unknown> => {
    return await articleCache.getAllArticles(forceRefresh)
  }

  // 获取指定类别的文章 - 优先使用缓存筛选
  const getArticlesByCategory = async (category: string): Promise<unknown> => {
    // 如果缓存有效，使用本地筛选
    if (articleCache.isCacheValid()) {
      return articleCache.getArticlesByCategory(category)
    }
    // 否则调用API
    const baseURL = getBaseURL()
    return await $fetch(`${baseURL}/articles/category/${category}`)
  }

  // 获取单篇文章（使用useAsyncData缓存）
  const getArticleById = async (id: string | number): Promise<unknown> => {
    const baseURL = getBaseURL()
    const { data, error } = await useAsyncData<unknown, any>(
      `article-${id}`,
      () => $fetch<unknown>(`${baseURL}/articles/${id}` as string),
      {
        // 单篇文章缓存10分钟
        getCachedData: (key, nuxtApp) => {
          return (nuxtApp.payload as any).data?.[key] || (nuxtApp.static as any).data?.[key]
        }
      }
    )

    if (error.value) throw error.value
    return data.value
  }

  // 使缓存失效（在文章更新后调用）
  const invalidateCache = (): void => {
    articleCache.invalidateCache()
  }

  return {
    getFeaturedArticles,
    searchArticles,
    getArticles,
    getAllArticles,
    getArticlesByCategory,
    getArticleById,
    invalidateCache,
    // 暴露统计数据
    categoryStats: articleCache.categoryStats,
    monthStats: articleCache.monthStats
  }
}
