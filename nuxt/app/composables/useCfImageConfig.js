// Cloudflare 图片转换配置 composable
export const useCfImageConfig = () => {
  const authStore = useAuthStore()

  const getConfig = async () => {
    try {
      return await authStore.authFetch('/cf-image-config')
    } catch (error) {
      console.error('获取 Cloudflare 缩略图配置失败:', error)
      throw error
    }
  }

  const saveConfig = async (configData) => {
    try {
      return await authStore.authFetch('/cf-image-config', {
        method: 'POST',
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
