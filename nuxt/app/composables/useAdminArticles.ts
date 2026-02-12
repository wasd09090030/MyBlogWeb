type AuthStoreLike = {
  authFetch: <T = unknown>(url: string, options?: Record<string, unknown>) => Promise<T>
}

type ArticlePayload = Record<string, unknown>
type CategoryKey = 'study' | 'game' | 'work' | 'resource' | 'other' | string

export const useAdminArticles = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase
  const authStore = useAuthStore() as unknown as AuthStoreLike

  const categoryLabels: Record<string, string> = {
    study: '学习',
    game: '游戏',
    work: '个人作品',
    resource: '资源分享',
    other: '其他'
  }

  const getCategoryLabel = (category: CategoryKey): string => {
    return categoryLabels[category] || category || '未分类'
  }

  const getCategoryType = (category: CategoryKey): string => {
    const types: Record<string, string> = {
      study: 'info',
      game: 'success',
      work: 'warning',
      resource: 'primary',
      other: 'default'
    }
    return types[category] || 'default'
  }

  const getArticles = async (
    options: { summary?: boolean; page?: number; limit?: number } = {}
  ): Promise<unknown> => {
    const { summary = false, page = 1, limit = 1000 } = options
    try {
      return await $fetch(`${baseURL}/articles`, {
        params: { summary, page, limit }
      })
    } catch (error) {
      console.error('获取文章列表失败:', error)
      throw error
    }
  }

  const getArticle = async (id: string | number): Promise<unknown> => {
    try {
      return await $fetch(`${baseURL}/articles/${id}`)
    } catch (error) {
      console.error('获取文章失败:', error)
      throw error
    }
  }

  const createArticle = async (articleData: ArticlePayload): Promise<unknown> => {
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

  const updateArticle = async (id: string | number, articleData: ArticlePayload): Promise<unknown> => {
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

  const deleteArticle = async (id: string | number): Promise<unknown> => {
    try {
      return await authStore.authFetch(`/articles/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('删除文章失败:', error)
      throw error
    }
  }

  const generateAiSummary = async (content: string): Promise<unknown> => {
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
