// Admin 画廊相关 composable
export const useAdminGallery = () => {
  const authStore = useAuthStore()

  // 获取所有画廊（管理员）
  const getAllGalleries = async () => {
    try {
      return await authStore.authFetch('/gallery/admin')
    } catch (error) {
      console.error('获取画廊失败:', error)
      throw error
    }
  }

  // 创建画廊
  const createGallery = async (galleryData) => {
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

  // 更新画廊
  const updateGallery = async (id, galleryData) => {
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

  // 删除画廊
  const deleteGallery = async (id) => {
    try {
      return await authStore.authFetch(`/gallery/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('删除画廊失败:', error)
      throw error
    }
  }

  // 切换显示状态
  const toggleActive = async (id) => {
    try {
      return await authStore.authFetch(`/gallery/${id}/toggle-active`, {
        method: 'PATCH'
      })
    } catch (error) {
      console.error('切换显示状态失败:', error)
      throw error
    }
  }

  // 批量导入
  const batchImport = async (data) => {
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

  // 更新排序
  const updateSort = async (sortData) => {
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

  // 刷新图片宽高
  const refreshDimensions = async () => {
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
