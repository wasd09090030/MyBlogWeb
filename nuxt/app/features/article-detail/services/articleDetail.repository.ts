export const createArticleDetailRepository = () => {
  const getArticleById = async (id: string | number): Promise<Record<string, unknown> | null> => {
    return await $fetch<Record<string, unknown>>(`/api/articles/${id}`)
  }

  return {
    getArticleById
  }
}