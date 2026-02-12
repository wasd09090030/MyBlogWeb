type AuthStoreLike = {
  authFetch: <T = unknown>(url: string, options?: Record<string, unknown>) => Promise<T>
}

type GalleryPayload = Record<string, unknown>

export const useAdminGallery = () => {
  const authStore = useAuthStore() as unknown as AuthStoreLike

  const getAllGalleries = async (): Promise<unknown> => {
    try {
      return await authStore.authFetch('/gallery/admin')
    } catch (error) {
      console.error('获取画廊失败:', error)
      throw error
    }
  }

  const createGallery = async (galleryData: GalleryPayload): Promise<unknown> => {
    try {
      return await authStore.authFetch('/gallery', {
        method: 'POST',
        body: galleryData
      })
    } catch (error) {
      console.error('创建画廊失败:', error)
      throw error
    }
  }

  const updateGallery = async (id: string | number, galleryData: GalleryPayload): Promise<unknown> => {
    try {
      return await authStore.authFetch(`/gallery/${id}`, {
        method: 'PATCH',
        body: galleryData
      })
    } catch (error) {
      console.error('更新画廊失败:', error)
      throw error
    }
  }

  const deleteGallery = async (id: string | number): Promise<unknown> => {
    try {
      return await authStore.authFetch(`/gallery/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('删除画廊失败:', error)
      throw error
    }
  }

  const toggleActive = async (id: string | number): Promise<unknown> => {
    try {
      return await authStore.authFetch(`/gallery/${id}/toggle-active`, {
        method: 'PATCH'
      })
    } catch (error) {
      console.error('切换显示状态失败:', error)
      throw error
    }
  }

  const batchImport = async (data: GalleryPayload): Promise<unknown> => {
    try {
      return await authStore.authFetch('/gallery/batch/import', {
        method: 'POST',
        body: data
      })
    } catch (error) {
      console.error('批量导入失败:', error)
      throw error
    }
  }

  const updateSort = async (sortData: GalleryPayload): Promise<unknown> => {
    try {
      return await authStore.authFetch('/gallery/batch/sort-order', {
        method: 'PATCH',
        body: sortData
      })
    } catch (error) {
      console.error('更新排序失败:', error)
      throw error
    }
  }

  const refreshDimensions = async (): Promise<unknown> => {
    try {
      return await authStore.authFetch('/gallery/refresh-dimensions', {
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
