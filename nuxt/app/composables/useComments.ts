type CommentSubmitPayload = Record<string, unknown>

export const useComments = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  const getCommentsByArticle = async (articleId: string | number): Promise<unknown> => {
    return await $fetch(`${baseURL}/comments/article/${articleId}`)
  }

  const submitComment = async (commentData: CommentSubmitPayload): Promise<unknown> => {
    return await $fetch(`${baseURL}/comments`, {
      method: 'POST',
      body: commentData
    })
  }

  const likeComment = async (commentId: string | number): Promise<unknown> => {
    return await $fetch(`${baseURL}/comments/${commentId}/like`, {
      method: 'POST'
    })
  }

  return {
    getCommentsByArticle,
    submitComment,
    likeComment
  }
}
