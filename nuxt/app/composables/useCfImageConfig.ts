type AuthStoreLike = {
  authFetch: <T = unknown>(url: string, options?: Record<string, unknown>) => Promise<T>
}

type CfImageConfigPayload = Record<string, unknown>

export const useCfImageConfig = () => {
  const authStore = useAuthStore() as unknown as AuthStoreLike

  const getConfig = async (): Promise<unknown> => {
    try {
      return await authStore.authFetch('/cf-image-config')
    } catch (error) {
      console.error('获取 Cloudflare 缩略图配置失败:', error)
      throw error
    }
  }

  const saveConfig = async (configData: CfImageConfigPayload): Promise<unknown> => {
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
