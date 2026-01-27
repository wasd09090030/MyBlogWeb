// 全局文章数据缓存 - 消除多组件重复请求
// 使用Nuxt的useState实现跨组件共享缓存

export const useArticleCache = () => {
  // 获取 API 基础 URL 的辅助函数（确保在正确的上下文中获取）
  const getBaseURL = () => {
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
    
    // Fallback：开发环境默认值
    return 'http://localhost:5000/api'
  }

  // 全局缓存状态 - 所有组件共享
  const articlesCache = useState('articles-cache', () => null)
  const articlesCacheTime = useState('articles-cache-time', () => 0)
  const isLoadingArticles = useState('articles-loading', () => false)
  
  // 缓存有效期（5分钟）
  const CACHE_DURATION = 5 * 60 * 1000

  // 检查缓存是否有效
  const isCacheValid = () => {
    if (!articlesCache.value) return false
    return Date.now() - articlesCacheTime.value < CACHE_DURATION
  }

  // 获取所有文章（带缓存）
  const getAllArticles = async (forceRefresh = false) => {
    // 如果缓存有效且不强制刷新，直接返回缓存
    if (!forceRefresh && isCacheValid()) {
      return articlesCache.value
    }

    // 如果正在加载中，等待加载完成
    if (isLoadingArticles.value) {
      // 等待其他请求完成
      await new Promise(resolve => {
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
      // 使用单次大批量请求获取所有文章
      const baseURL = getBaseURL()
      const result = await $fetch(`${baseURL}/articles`, {
        params: { summary: true, page: 1, limit: 100 }
      })

      let allArticles = []

      if (Array.isArray(result)) {
        allArticles = result
      } else if (result.data) {
        const { data, total, pageSize } = result
        allArticles = [...data]
        
        // 如果还有更多页面，并行获取
        const totalPages = Math.ceil(total / pageSize)
        if (totalPages > 1) {
          const promises = []
          for (let page = 2; page <= totalPages; page++) {
            promises.push(
              $fetch(`${baseURL}/articles`, {
                params: { summary: true, page, limit: 100 }
              })
            )
          }
          
          const results = await Promise.all(promises)
          results.forEach(res => {
            if (res.data) {
              allArticles.push(...res.data)
            } else if (Array.isArray(res)) {
              allArticles.push(...res)
            }
          })
        }
      }

      // 按ID降序排序（最新的在前）
      allArticles.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0))

      // 更新缓存
      articlesCache.value = allArticles
      articlesCacheTime.value = Date.now()

      return allArticles
    } catch (error) {
      console.error('获取文章缓存失败:', error)
      throw error
    } finally {
      isLoadingArticles.value = false
    }
  }

  // 预计算的分类统计
  const categoryStats = computed(() => {
    if (!articlesCache.value) return {}
    
    const stats = { study: 0, game: 0, work: 0, resource: 0 }
    articlesCache.value.forEach(article => {
      if (article.category && stats[article.category] !== undefined) {
        stats[article.category]++
      }
    })
    return stats
  })

  // 预计算的月份统计
  const monthStats = computed(() => {
    if (!articlesCache.value) return {}
    
    const stats = {}
    articlesCache.value.forEach(article => {
      if (article.createdAt) {
        const date = new Date(article.createdAt)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        stats[key] = (stats[key] || 0) + 1
      }
    })
    return stats
  })

  // 按分类筛选文章
  const getArticlesByCategory = (category) => {
    if (!articlesCache.value) return []
    return articlesCache.value.filter(a => a.category === category)
  }

  // 搜索文章（客户端搜索，减少API调用）
  const searchArticlesLocal = (keyword) => {
    if (!articlesCache.value || !keyword) return []
    const lowerKeyword = keyword.toLowerCase()
    return articlesCache.value.filter(article => 
      article.title?.toLowerCase().includes(lowerKeyword) ||
      article.summary?.toLowerCase().includes(lowerKeyword) ||
      article.tags?.some(tag => tag.toLowerCase().includes(lowerKeyword))
    )
  }

  // 使缓存失效
  const invalidateCache = () => {
    articlesCache.value = null
    articlesCacheTime.value = 0
  }

  // 预加载缓存（可在app启动时调用）
  const preloadCache = async () => {
    if (!isCacheValid()) {
      await getAllArticles()
    }
  }

  return {
    // 数据获取
    getAllArticles,
    getArticlesByCategory,
    searchArticlesLocal,
    
    // 统计数据
    categoryStats,
    monthStats,
    
    // 缓存管理
    isCacheValid,
    invalidateCache,
    preloadCache,
    
    // 状态
    isLoading: isLoadingArticles,
    cachedArticles: articlesCache
  }
}
