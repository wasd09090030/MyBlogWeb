import { createApiClient } from '~/shared/api/client'

export const createArticleDetailRepository = () => {
  const client = createApiClient()

  const getArticleById = async (id: string | number): Promise<Record<string, unknown> | null> => {
    return await client.get<Record<string, unknown>>(`/articles/${id}`)
  }

  return {
    getArticleById
  }
}