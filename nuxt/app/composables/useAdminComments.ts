import type { AdminComment, AuthFetchLike, CommentStatus } from '~/types/api'

export const useAdminComments = () => {
  const authStore = useAuthStore() as AuthFetchLike

  const getAllComments = async (): Promise<AdminComment[]> => {
    try {
      return await authStore.authFetch<AdminComment[]>('/comments/admin/all')
    } catch (error) {
      console.error('获取评论失败:', error)
      throw error
    }
  }

  const getPendingComments = async (): Promise<AdminComment[]> => {
    try {
      return await authStore.authFetch<AdminComment[]>('/comments/admin/pending')
    } catch (error) {
      console.error('获取待审核评论失败:', error)
      throw error
    }
  }

  const updateCommentStatus = async (
    commentId: string | number,
    status: CommentStatus | string
  ): Promise<AdminComment> => {
    try {
      return await authStore.authFetch<AdminComment>(`/comments/${commentId}/status`, {
        method: 'PATCH',
        body: { status }
      })
    } catch (error) {
      console.error('更新评论状态失败:', error)
      throw error
    }
  }

  const deleteComment = async (commentId: string | number): Promise<void> => {
    try {
      await authStore.authFetch<void>(`/comments/${commentId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('删除评论失败:', error)
      throw error
    }
  }

  const getStatusType = (status: CommentStatus | string): string => {
    const types: Record<string, string> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error'
    }
    return types[status] || 'default'
  }

  const getStatusText = (status: CommentStatus | string): string => {
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
