import type {
  AiSummaryResult,
  ArticleCategory,
  ArticleDetail,
  ArticleSummary,
  AuthFetchLike,
  CreateArticlePayload,
  PagedArticleResult,
  UpdateArticlePayload
} from '~/types/api'

type CategoryKey = ArticleCategory

export const useAdminArticles = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase
  const authStore = useAuthStore() as AuthFetchLike

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
  ): Promise<ArticleSummary[] | ArticleDetail[] | PagedArticleResult> => {
    const { summary = false, page = 1, limit = 1000 } = options
    try {
      return await $fetch<ArticleSummary[] | ArticleDetail[] | PagedArticleResult>(`${baseURL}/articles`, {
        params: { summary, page, limit }
      })
    } catch (error) {
      console.error('获取文章列表失败:', error)
      throw error
    }
  }

  const getArticle = async (id: string | number): Promise<ArticleDetail> => {
    try {
      return await $fetch<ArticleDetail>(`${baseURL}/articles/${id}`)
    } catch (error) {
      console.error('获取文章失败:', error)
      throw error
    }
  }

  const createArticle = async (articleData: CreateArticlePayload): Promise<ArticleDetail> => {
    try {
      return await authStore.authFetch<ArticleDetail>('/articles', {
        method: 'POST',
        body: articleData
      })
    } catch (error) {
      console.error('创建文章失败:', error)
      throw error
    }
  }

  const updateArticle = async (
    id: string | number,
    articleData: UpdateArticlePayload
  ): Promise<ArticleDetail> => {
    try {
      return await authStore.authFetch<ArticleDetail>(`/articles/${id}`, {
        method: 'PUT',
        body: articleData
      })
    } catch (error) {
      console.error('更新文章失败:', error)
      throw error
    }
  }

  const deleteArticle = async (id: string | number): Promise<void> => {
    try {
      await authStore.authFetch<void>(`/articles/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('删除文章失败:', error)
      throw error
    }
  }

  const generateAiSummary = async (content: string): Promise<AiSummaryResult> => {
    try {
      return await authStore.authFetch<AiSummaryResult>('/ai/generate-summary', {
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
