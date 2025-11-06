// 画廊相关的Composable - 适配Nuxt 3
export const useGallery = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  // 获取所有激活的画廊图片 (公开接口)
  const getGalleries = async () => {
    return await $fetch(`${baseURL}/gallery`)
  }

  // 获取所有画廊图片 (管理员接口)
  const getAllGalleries = async () => {
    return await $fetch(`${baseURL}/gallery/admin`, {
      headers: {
        'Authorization': 'AdminToken' // 简化认证，实际项目中应该使用更安全的方式
      }
    })
  }

  return {
    getGalleries,
    getAllGalleries
  }
}