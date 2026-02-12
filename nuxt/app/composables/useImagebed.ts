type AuthStoreLike = {
  authFetch: <T = unknown>(url: string, options?: Record<string, unknown>) => Promise<T>
}

type ImagebedConfig = {
  domain: string
  apiToken: string
  uploadFolder?: string
}

type UploadResult = {
  success: boolean
  src?: string
  url?: string
  fileName?: string
  error?: string
}

type FileListOptions = {
  domain: string
  apiToken: string
  start?: number
  count?: number
  search?: string
  dir?: string
  recursive?: boolean
}

type FileListItem = {
  name: string
  size: number
  type: string
  channel: string
  timestamp: string
  url: string
}

type DeleteMultipleResult = {
  success: string[]
  failed: Array<{ filePath: string; error: string }>
}

type DeleteFileOptions = {
  domain: string
  apiToken: string
  filePath: string
}

type DeleteFolderOptions = {
  domain: string
  apiToken: string
  folderPath: string
}

type DeleteMultipleOptions = {
  domain: string
  apiToken: string
  filePaths: string[]
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误'
}

export const useImagebed = () => {
  const authStore = useAuthStore() as unknown as AuthStoreLike

  const getConfig = async (): Promise<unknown> => {
    try {
      return await authStore.authFetch('/imagebed/config')
    } catch (error) {
      console.error('获取图床配置失败:', error)
      throw error
    }
  }

  const saveConfig = async (configData: ImagebedConfig): Promise<unknown> => {
    try {
      return await authStore.authFetch('/imagebed/config', {
        method: 'POST',
        body: configData
      })
    } catch (error) {
      console.error('保存图床配置失败:', error)
      throw error
    }
  }

  const getFullUrl = (domain: string, src: string): string => {
    const domainUrl = domain.replace(/\/$/, '')
    const path = src.startsWith('/') ? src : `/${src}`
    return `${domainUrl}${path}`
  }

  const uploadImage = async (file: File, options: ImagebedConfig): Promise<UploadResult> => {
    const { domain, apiToken, uploadFolder } = options
    const formData = new FormData()
    formData.append('file', file)

    const params = new URLSearchParams({
      uploadChannel: 'cfr2',
      returnFormat: 'default'
    })

    if (uploadFolder) {
      params.append('uploadFolder', uploadFolder)
    }

    try {
      const domainUrl = domain.replace(/\/$/, '')
      const response = await fetch(`${domainUrl}/upload?${params.toString()}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upload failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json() as Array<{ src?: string }>

      if (Array.isArray(result) && result.length > 0 && result[0].src) {
        const fullUrl = getFullUrl(domain, result[0].src)
        return {
          success: true,
          src: result[0].src,
          url: fullUrl,
          fileName: file.name
        }
      }

      throw new Error('Invalid response format')
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const uploadMultipleImages = async (
    files: File[],
    options: ImagebedConfig,
    onProgress?: (index: number, total: number, result: UploadResult) => void
  ): Promise<{ results: UploadResult[]; errors: Array<{ file: string; error: string }> }> => {
    const results: UploadResult[] = []
    const errors: Array<{ file: string; error: string }> = []

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadImage(files[i], options)
        results.push(result)
        if (onProgress) {
          onProgress(i + 1, files.length, result)
        }
      } catch (error) {
        const errorMessage = getErrorMessage(error)
        errors.push({ file: files[i].name, error: errorMessage })
        if (onProgress) {
          onProgress(i + 1, files.length, { success: false, error: errorMessage })
        }
      }
    }

    return { results, errors }
  }

  const getFileList = async (options: FileListOptions): Promise<{
    files: FileListItem[]
    directories: string[]
    totalCount: number
    returnedCount: number
  }> => {
    const { domain, apiToken, start = 0, count = 50, search = '', dir = '', recursive = false } = options

    const params = new URLSearchParams({
      start: start.toString(),
      count: count.toString(),
      channel: 'CloudflareR2',
      fileType: 'image'
    })

    if (search) params.append('search', search)
    if (dir) params.append('dir', dir)
    if (recursive) params.append('recursive', 'true')

    try {
      const domainUrl = domain.replace(/\/$/, '')
      const response = await fetch(`${domainUrl}/api/manage/list?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`List failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json() as {
        files?: Array<{ name: string; metadata?: Record<string, string> }>
        directories?: string[]
        totalCount?: number
        returnedCount?: number
      }

      return {
        files: (result.files || []).map((file) => ({
          name: file.name,
          size: Number.parseInt(file.metadata?.['File-Size'] || '0', 10) || 0,
          type: file.metadata?.['File-Mime'] || 'unknown',
          channel: file.metadata?.Channel || 'unknown',
          timestamp: file.metadata?.TimeStamp || '',
          url: getFullUrl(domain, `/file/${file.name}`)
        })),
        directories: result.directories || [],
        totalCount: result.totalCount || 0,
        returnedCount: result.returnedCount || 0
      }
    } catch (error) {
      console.error('List error:', error)
      throw error
    }
  }

  const getFileCount = async (options: { domain: string; apiToken: string; dir?: string }): Promise<number> => {
    const { domain, apiToken, dir = '' } = options

    const params = new URLSearchParams({
      count: '-1',
      sum: 'true',
      channel: 'CloudflareR2',
      fileType: 'image'
    })

    if (dir) {
      params.append('dir', dir)
    }

    try {
      const domainUrl = domain.replace(/\/$/, '')
      const response = await fetch(`${domainUrl}/api/manage/list?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Count failed: ${response.status}`)
      }

      const result = await response.json() as { sum?: number }
      return result.sum || 0
    } catch (error) {
      console.error('Count error:', error)
      throw error
    }
  }

  const deleteFile = async (options: DeleteFileOptions): Promise<Record<string, unknown>> => {
    const { domain, apiToken, filePath } = options

    try {
      const domainUrl = domain.replace(/\/$/, '')
      const response = await fetch(`${domainUrl}/api/manage/delete/${encodeURIComponent(filePath)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Delete failed: ${response.status} - ${errorText}`)
      }

      return await response.json() as Record<string, unknown>
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  const deleteFolder = async (options: DeleteFolderOptions): Promise<Record<string, unknown>> => {
    const { domain, apiToken, folderPath } = options

    try {
      const domainUrl = domain.replace(/\/$/, '')
      const response = await fetch(`${domainUrl}/api/manage/delete/${encodeURIComponent(folderPath)}?folder=true`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Delete folder failed: ${response.status} - ${errorText}`)
      }

      return await response.json() as Record<string, unknown>
    } catch (error) {
      console.error('Delete folder error:', error)
      throw error
    }
  }

  const deleteMultipleFiles = async (options: DeleteMultipleOptions): Promise<DeleteMultipleResult> => {
    const { domain, apiToken, filePaths } = options
    const results: DeleteMultipleResult = {
      success: [],
      failed: []
    }

    for (const filePath of filePaths) {
      try {
        const result = await deleteFile({ domain, apiToken, filePath }) as { success?: boolean; error?: string }
        if (result.success) {
          results.success.push(filePath)
        } else {
          results.failed.push({ filePath, error: result.error || 'Unknown error' })
        }
      } catch (error) {
        results.failed.push({ filePath, error: getErrorMessage(error) })
      }
    }

    return results
  }

  const formatFileSize = (bytes: string | number): string => {
    const normalizedBytes = Number.parseInt(String(bytes), 10) || 0
    if (normalizedBytes === 0) return '0 B'
    const unit = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const index = Math.floor(Math.log(normalizedBytes) / Math.log(unit))
    return `${Number.parseFloat((normalizedBytes / Math.pow(unit, index)).toFixed(2))} ${sizes[index]}`
  }

  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return '-'
    const date = new Date(Number.parseInt(timestamp, 10))
    return date.toLocaleString('zh-CN')
  }

  return {
    getConfig,
    saveConfig,
    uploadImage,
    uploadMultipleImages,
    getFileList,
    getFileCount,
    deleteFile,
    deleteFolder,
    deleteMultipleFiles,
    getFullUrl,
    formatFileSize,
    formatTimestamp
  }
}
