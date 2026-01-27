// 评论相关的Composable - 适配Nuxt 3
export const useComments = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  // 获取文章评论
  const getCommentsByArticle = async (articleId) => {
    return await $fetch(`${baseURL}/comments/article/${articleId}`)
  }

  // 提交评论
  const submitComment = async (commentData) => {
    return await $fetch(`${baseURL}/comments`, {
      method: 'POST',
      body: commentData
    })
  }

  // 点赞评论
  const likeComment = async (commentId) => {
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