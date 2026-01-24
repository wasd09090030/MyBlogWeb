// 画廊相关的Composable - 适配Nuxt 3
// 使用useState实现全局缓存，避免重复请求
export const useGallery = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  // 全局缓存状态
  const galleriesCache = useState('galleries-cache', () => null)
  const galleriesCacheTime = useState('galleries-cache-time', () => 0)
  const isLoadingGalleries = useState('galleries-loading', () => false)
  
  // 缓存有效期（10分钟，画廊数据更新频率较低）
  const CACHE_DURATION = 10 * 60 * 1000

  // 检查缓存是否有效
  const isCacheValid = () => {
    if (!galleriesCache.value) return false
    return Date.now() - galleriesCacheTime.value < CACHE_DURATION
  }

  // 获取所有激活的画廊图片 (公开接口，带缓存)
  const getGalleries = async (forceRefresh = false) => {
    // 如果缓存有效且不强制刷新，直接返回缓存
    if (!forceRefresh && isCacheValid()) {
      return galleriesCache.value
    }

    // 如果正在加载中，等待加载完成
    if (isLoadingGalleries.value) {
      await new Promise(resolve => {
        const checkCache = setInterval(() => {
          if (!isLoadingGalleries.value) {
            clearInterval(checkCache)
            resolve()
          }
        }, 50)
      })
      return galleriesCache.value
    }

    isLoadingGalleries.value = true

    try {
      const result = await $fetch(`${baseURL}/gallery`)
      
      // 更新缓存
      galleriesCache.value = result
      galleriesCacheTime.value = Date.now()
      
      return result
    } catch (error) {
      console.error('获取画廊数据失败:', error)
      throw error
    } finally {
      isLoadingGalleries.value = false
    }
  }

  // 获取所有画廊图片 (管理员接口，不缓存)
  const getAllGalleries = async () => {
    return await $fetch(`${baseURL}/gallery/admin`, {
      headers: {
        'Authorization': 'AdminToken'
      }
    })
  }

  // 使缓存失效（在画廊更新后调用）
  const invalidateCache = () => {
    galleriesCache.value = null
    galleriesCacheTime.value = 0
  }

  // 预加载缓存
  const preloadCache = async () => {
    if (!isCacheValid()) {
      await getGalleries()
    }
  }

  return {
    getGalleries,
    getAllGalleries,
    invalidateCache,
    preloadCache,
    isLoading: isLoadingGalleries,
    cachedGalleries: galleriesCache
  }
}