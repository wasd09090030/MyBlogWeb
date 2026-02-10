// Admin 文章相关 composable
export const useAdminArticles = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase
  const authStore = useAuthStore()

  // 类别映射
  const categoryLabels = {
    study: '学习',
    game: '游戏',
    work: '个人作品',
    resource: '资源分享',
    other: '其他'
  }

  const getCategoryLabel = (category) => {
    return categoryLabels[category] || category || '未分类'
  }

  const getCategoryType = (category) => {
    const types = {
      study: 'info',
      game: 'success',
      work: 'warning',
      resource: 'primary',
      other: 'default'
    }
    return types[category] || 'default'
  }

  // 获取所有文章
  const getArticles = async (options = {}) => {
    const { summary = false, page = 1, limit = 1000 } = options
    try {
      const result = await $fetch(`${baseURL}/articles`, {
        params: { summary, page, limit }
      })
      return result
    } catch (error) {
      console.error('获取文章列表失败:', error)
      throw error
    }
  }

  // 获取单个文章
  const getArticle = async (id) => {
    try {
      const result = await $fetch(`${baseURL}/articles/${id}`)
      return result
    } catch (error) {
      console.error('获取文章失败:', error)
      throw error
    }
  }

  // 创建文章
  const createArticle = async (articleData) => {
    try {
      return await authStore.authFetch('/articles', {
        method: 'POST',
        body: articleData
      })
    } catch (error) {
      console.error('创建文章失败:', error)
      throw error
    }
  }

  // 更新文章
  const updateArticle = async (id, articleData) => {
    try {
      return await authStore.authFetch(`/articles/${id}`, {
        method: 'PUT',
        body: articleData
      })
    } catch (error) {
      console.error('更新文章失败:', error)
      throw error
    }
  }

  // 删除文章
  const deleteArticle = async (id) => {
    try {
      return await authStore.authFetch(`/articles/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('删除文章失败:', error)
      throw error
    }
  }

  // 生成 AI 概要
  const generateAiSummary = async (content) => {
    try {
      return await authStore.authFetch('/ai/generate-summary', {
        method: 'POST',
        body: { content }
      })
    } catch (error) {
      console.error('生成 AI 概要失败:', error)
      throw error
    }
  }

  return {
    categoryLabels,
    getCategoryLabel,
    getCategoryType,
    getArticles,
    getArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    generateAiSummary
  }
}
