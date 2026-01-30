// Cloudflare 图片转换配置 composable
export const useCfImageConfig = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase
  const authStore = useAuthStore()

  const getConfig = async () => {
    try {
      return await $fetch(`${baseURL}/cf-image-config`, {
        headers: authStore.authHeaders
      })
    } catch (error) {
      console.error('获取 Cloudflare 缩略图配置失败:', error)
      throw error
    }
  }

  const saveConfig = async (configData) => {
    try {
      return await $fetch(`${baseURL}/cf-image-config`, {
        method: 'POST',
        headers: authStore.authHeaders,
        body: configData
      })
    } catch (error) {
      console.error('保存 Cloudflare 缩略图配置失败:', error)
      throw error
    }
  }

  return {
    getConfig,
    saveConfig
  }
}
