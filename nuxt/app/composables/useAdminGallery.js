// Admin 画廊相关 composable
export const useAdminGallery = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase
  const authStore = useAuthStore()

  // 获取所有画廊（管理员）
  const getAllGalleries = async () => {
    try {
      const result = await $fetch(`${baseURL}/gallery/admin`, {
        headers: authStore.authHeaders
      })
      return result
    } catch (error) {
      console.error('获取画廊失败:', error)
      throw error
    }
  }

  // 创建画廊
  const createGallery = async (galleryData) => {
    try {
      const result = await $fetch(`${baseURL}/gallery`, {
        method: 'POST',
        headers: authStore.authHeaders,
        body: galleryData
      })
      return result
    } catch (error) {
      console.error('创建画廊失败:', error)
      throw error
    }
  }

  // 更新画廊
  const updateGallery = async (id, galleryData) => {
    try {
      const result = await $fetch(`${baseURL}/gallery/${id}`, {
        method: 'PATCH',
        headers: authStore.authHeaders,
        body: galleryData
      })
      return result
    } catch (error) {
      console.error('更新画廊失败:', error)
      throw error
    }
  }

  // 删除画廊
  const deleteGallery = async (id) => {
    try {
      const result = await $fetch(`${baseURL}/gallery/${id}`, {
        method: 'DELETE',
        headers: authStore.authHeaders
      })
      return result
    } catch (error) {
      console.error('删除画廊失败:', error)
      throw error
    }
  }

  // 切换显示状态
  const toggleActive = async (id) => {
    try {
      const result = await $fetch(`${baseURL}/gallery/${id}/toggle-active`, {
        method: 'PATCH',
        headers: authStore.authHeaders
      })
      return result
    } catch (error) {
      console.error('切换显示状态失败:', error)
      throw error
    }
  }

  // 批量导入
  const batchImport = async (data) => {
    try {
      const result = await $fetch(`${baseURL}/gallery/batch/import`, {
        method: 'POST',
        headers: authStore.authHeaders,
        body: data
      })
      return result
    } catch (error) {
      console.error('批量导入失败:', error)
      throw error
    }
  }

  // 更新排序
  const updateSort = async (sortData) => {
    try {
      const result = await $fetch(`${baseURL}/gallery/batch/sort-order`, {
        method: 'PATCH',
        headers: authStore.authHeaders,
        body: sortData
      })
      return result
    } catch (error) {
      console.error('更新排序失败:', error)
      throw error
    }
  }

  // 刷新图片宽高
  const refreshDimensions = async () => {
    try {
      const result = await $fetch(`${baseURL}/gallery/refresh-dimensions`, {
        method: 'POST',
        headers: authStore.authHeaders
      })
      return result
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
