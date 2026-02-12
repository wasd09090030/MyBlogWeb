import type { ArticleLike } from '~/utils/workers/types'
import type { ArticlesListOptions } from '~/features/article-list/types/article'
import { createApiClient } from '~/shared/api/client'

type NuxtDataContainer = {
  data?: Record<string, unknown>
}

function getCachedNuxtData<T>(nuxtApp: { payload: unknown; static: unknown }, key: string): T | null {
  const payloadData = (nuxtApp.payload as NuxtDataContainer).data
  if (payloadData && key in payloadData) {
    return payloadData[key] as T
  }

  const staticData = (nuxtApp.static as NuxtDataContainer).data
  if (staticData && key in staticData) {
    return staticData[key] as T
  }

  return null
}

export const createArticlesRepository = () => {
  const client = createApiClient()

  const getFeaturedArticles = async (limit = 5): Promise<ArticleLike[] | null> => {
    const { data, error } = await useFetch<ArticleLike[] | null>(`${client.baseURL}/articles/featured`, {
      key: `featured-articles-${limit}`,
      params: { limit },
      getCachedData: (key, nuxtApp) => {
        return getCachedNuxtData<ArticleLike[] | null>(nuxtApp as { payload: unknown; static: unknown }, key)
      }
    })

    if (error.value) throw error.value
    return data.value
  }

  const searchArticles = async (keyword: string): Promise<ArticleLike[]> => {
    return await client.get<ArticleLike[]>('/articles/search', {
      params: { keyword }
    })
  }

  const getArticles = async (options: ArticlesListOptions = {}): Promise<unknown> => {
    const {
      category = null,
      page = 1,
      limit = 10,
      summary = true
    } = options

    const params: Record<string, string | number | boolean> = { summary, page, limit }
    if (category) {
      params.category = category
    }

    return await client.get('/articles', { params })
  }

  const getArticlesByCategory = async (category: string): Promise<ArticleLike[]> => {
    return await client.get<ArticleLike[]>(`/articles/category/${encodeURIComponent(category)}`)
  }

  return {
    getFeaturedArticles,
    searchArticles,
    getArticles,
    getArticlesByCategory
  }
}