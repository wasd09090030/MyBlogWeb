import type {
  AdminGallery,
  ApiOperationResult,
  AuthFetchLike,
  BatchImportGalleryPayload,
  BatchImportGalleryResult,
  CreateGalleryPayload,
  GalleryRefreshResult,
  UpdateGalleryPayload,
  UpdateSortOrderPayload
} from '~/types/api'

export const useAdminGallery = () => {
  const authStore = useAuthStore() as AuthFetchLike

  const getAllGalleries = async (): Promise<AdminGallery[]> => {
    try {
      return await authStore.authFetch<AdminGallery[]>('/gallery/admin')
    } catch (error) {
      console.error('获取画廊失败:', error)
      throw error
    }
  }

  const createGallery = async (galleryData: CreateGalleryPayload): Promise<AdminGallery> => {
    try {
      return await authStore.authFetch<AdminGallery>('/gallery', {
        method: 'POST',
        body: galleryData
      })
    } catch (error) {
      console.error('创建画廊失败:', error)
      throw error
    }
  }

  const updateGallery = async (
    id: string | number,
    galleryData: UpdateGalleryPayload
  ): Promise<AdminGallery> => {
    try {
      return await authStore.authFetch<AdminGallery>(`/gallery/${id}`, {
        method: 'PATCH',
        body: galleryData
      })
    } catch (error) {
      console.error('更新画廊失败:', error)
      throw error
    }
  }

  const deleteGallery = async (id: string | number): Promise<void> => {
    try {
      await authStore.authFetch<void>(`/gallery/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('删除画廊失败:', error)
      throw error
    }
  }

  const toggleActive = async (id: string | number): Promise<AdminGallery> => {
    try {
      return await authStore.authFetch<AdminGallery>(`/gallery/${id}/toggle-active`, {
        method: 'PATCH'
      })
    } catch (error) {
      console.error('切换显示状态失败:', error)
      throw error
    }
  }

  const batchImport = async (data: BatchImportGalleryPayload): Promise<BatchImportGalleryResult> => {
    try {
      return await authStore.authFetch<BatchImportGalleryResult>('/gallery/batch/import', {
        method: 'POST',
        body: data
      })
    } catch (error) {
      console.error('批量导入失败:', error)
      throw error
    }
  }

  const updateSort = async (sortData: UpdateSortOrderPayload): Promise<ApiOperationResult> => {
    try {
      return await authStore.authFetch<ApiOperationResult>('/gallery/batch/sort-order', {
        method: 'PATCH',
        body: sortData
      })
    } catch (error) {
      console.error('更新排序失败:', error)
      throw error
    }
  }

  const refreshDimensions = async (): Promise<GalleryRefreshResult> => {
    try {
      return await authStore.authFetch<GalleryRefreshResult>('/gallery/refresh-dimensions', {
        method: 'POST'
      })
    } catch (error) {
      console.error('刷新图片宽高失败:', error)
      throw error
    }
  }

  return {
    getAllGalleries,
    createGallery,
    updateGallery,
    deleteGallery,
    toggleActive,
    batchImport,
    updateSort,
    refreshDimensions
  }
}
