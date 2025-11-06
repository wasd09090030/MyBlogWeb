// 文章相关的Composable - 适配Nuxt 3
export const useArticles = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  // 获取推荐文章
  const getFeaturedArticles = async (limit = 5) => {
    return await $fetch(`${baseURL}/articles/featured`, {
      params: { limit }
    })
  }

  // 搜索文章
  const searchArticles = async (keyword) => {
    return await $fetch(`${baseURL}/articles/search`, {
      params: { keyword }
    })
  }

  // 获取文章列表
  const getArticles = async (options = {}) => {
    const {
      category = null,
      page = 1,
      limit = 10,
      summary = true
    } = options

    const params = { summary, page, limit }
    if (category) {
      params.category = category
    }

    return await $fetch(`${baseURL}/articles`, {
      params
    })
  }

  // 获取所有文章
  const getAllArticles = async () => {
    try {
      // 先获取第一页来了解总数
      const firstPage = await getArticles({ page: 1, limit: 50, summary: true })

      // 检查返回的数据结构
      if (Array.isArray(firstPage)) {
        return firstPage
      }

      // 如果是分页结构
      const { data, total, pageSize } = firstPage
      const totalPages = Math.ceil(total / pageSize)

      if (totalPages <= 1) {
        return data
      }

      // 如果有多页，获取所有页面
      const allArticles = [...data]
      const promises = []

      for (let page = 2; page <= totalPages; page++) {
        promises.push(getArticles({ page, limit: 50, summary: true }))
      }

      const results = await Promise.all(promises)
      results.forEach(result => {
        if (result.data) {
          allArticles.push(...result.data)
        } else if (Array.isArray(result)) {
          allArticles.push(...result)
        }
      })

      return allArticles
    } catch (error) {
      console.error('获取所有文章失败:', error)
      throw error
    }
  }

  // 获取指定类别的文章
  const getArticlesByCategory = async (category) => {
    return await $fetch(`${baseURL}/articles/category/${category}`)
  }

  // 获取单篇文章
  const getArticleById = async (id) => {
    return await $fetch(`${baseURL}/articles/${id}`)
  }

  return {
    getFeaturedArticles,
    searchArticles,
    getArticles,
    getAllArticles,
    getArticlesByCategory,
    getArticleById
  }
}