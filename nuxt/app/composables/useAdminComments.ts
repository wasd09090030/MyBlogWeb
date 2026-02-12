type AuthStoreLike = {
  authFetch: <T = unknown>(url: string, options?: Record<string, unknown>) => Promise<T>
}

type CommentStatus = 'pending' | 'approved' | 'rejected' | string

export const useAdminComments = () => {
  const authStore = useAuthStore() as unknown as AuthStoreLike

  const getAllComments = async (): Promise<unknown> => {
    try {
      return await authStore.authFetch('/comments/admin/all')
    } catch (error) {
      console.error('获取评论失败:', error)
      throw error
    }
  }

  const getPendingComments = async (): Promise<unknown> => {
    try {
      return await authStore.authFetch('/comments/admin/pending')
    } catch (error) {
      console.error('获取待审核评论失败:', error)
      throw error
    }
  }

  const updateCommentStatus = async (commentId: string | number, status: CommentStatus): Promise<unknown> => {
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

  const deleteComment = async (commentId: string | number): Promise<unknown> => {
    try {
      return await authStore.authFetch(`/comments/${commentId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('删除评论失败:', error)
      throw error
    }
  }

  const getStatusType = (status: CommentStatus): string => {
    const types: Record<string, string> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error'
    }
    return types[status] || 'default'
  }

  const getStatusText = (status: CommentStatus): string => {
    const texts: Record<string, string> = {
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
