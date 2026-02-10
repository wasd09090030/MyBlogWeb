// Admin 评论相关 composable
export const useAdminComments = () => {
  const authStore = useAuthStore()

  // 获取所有评论
  const getAllComments = async () => {
    try {
      return await authStore.authFetch('/comments/admin/all')
    } catch (error) {
      console.error('获取评论失败:', error)
      throw error
    }
  }

  // 获取待审核评论
  const getPendingComments = async () => {
    try {
      return await authStore.authFetch('/comments/admin/pending')
    } catch (error) {
      console.error('获取待审核评论失败:', error)
      throw error
    }
  }

  // 更新评论状态
  const updateCommentStatus = async (commentId, status) => {
    try {
      return await authStore.authFetch(`/comments/${commentId}/status`, {
        method: 'PATCH',
        body: { status }
      })
    } catch (error) {
      console.error('更新评论状态失败:', error)
      throw error
    }
  }

  // 删除评论
  const deleteComment = async (commentId) => {
    try {
      return await authStore.authFetch(`/comments/${commentId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('删除评论失败:', error)
      throw error
    }
  }

  // 状态相关方法
  const getStatusType = (status) => {
    const types = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error'
    }
    return types[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝'
    }
    return texts[status] || '未知'
  }

  return {
    getAllComments,
    getPendingComments,
    updateCommentStatus,
    deleteComment,
    getStatusType,
    getStatusText
  }
}
