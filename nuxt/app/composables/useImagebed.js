// 图床管理 composable
export const useImagebed = () => {
  const authStore = useAuthStore()

  // ==================== 配置管理 ====================
  
  /**
   * 获取图床配置
   */
  const getConfig = async () => {
    try {
      return await authStore.authFetch('/imagebed/config')
    } catch (error) {
      console.error('获取图床配置失败:', error)
      throw error
    }
  }

  /**
   * 保存图床配置
   * @param {Object} configData - { domain, apiToken, uploadFolder }
   */
  const saveConfig = async (configData) => {
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

  // ==================== 上传模块 ====================

  /**
   * 上传图片到图床
   * @param {File} file - 图片文件
   * @param {Object} options - { domain, apiToken, uploadFolder }
   */
  const uploadImage = async (file, options) => {
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
          'Authorization': `Bearer ${apiToken}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upload failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      
      if (Array.isArray(result) && result.length > 0 && result[0].src) {
        // 自动添加域名前缀
        const fullUrl = getFullUrl(domain, result[0].src)
        return {
          success: true,
          src: result[0].src,
          url: fullUrl,
          fileName: file.name
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  /**
   * 批量上传图片
   * @param {File[]} files - 图片文件数组
   * @param {Object} options - { domain, apiToken, uploadFolder }
   * @param {Function} onProgress - 进度回调函数 (index, total, result)
   */
  const uploadMultipleImages = async (files, options, onProgress) => {
    const results = []
    const errors = []

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadImage(files[i], options)
        results.push(result)
        if (onProgress) {
          onProgress(i + 1, files.length, result)
        }
      } catch (error) {
        errors.push({ file: files[i].name, error: error.message })
        if (onProgress) {
          onProgress(i + 1, files.length, { success: false, error: error.message })
        }
      }
    }

    return { results, errors }
  }

  // ==================== 列表模块 ====================

  /**
   * 获取文件列表
   * @param {Object} options - { domain, apiToken, start, count, search, dir, recursive }
   */
  const getFileList = async (options) => {
    const { domain, apiToken, start = 0, count = 50, search = '', dir = '', recursive = false } = options

    const params = new URLSearchParams({
      start: start.toString(),
      count: count.toString(),
      channel: 'CloudflareR2',
      fileType: 'image'
    })

    if (search) {
      params.append('search', search)
    }
    if (dir) {
      params.append('dir', dir)
    }
    if (recursive) {
      params.append('recursive', 'true')
    }

    try {
      const domainUrl = domain.replace(/\/$/, '')
      const response = await fetch(`${domainUrl}/api/manage/list?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`List failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      
      return {
        files: (result.files || []).map(file => ({
          name: file.name,
          size: file.metadata?.['File-Size'] || 0,
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

  /**
   * 获取文件总数统计
   * @param {Object} options - { domain, apiToken, dir }
   */
  const getFileCount = async (options) => {
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
          'Authorization': `Bearer ${apiToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Count failed: ${response.status}`)
      }

      const result = await response.json()
      return result.sum || 0
    } catch (error) {
      console.error('Count error:', error)
      throw error
    }
  }

  // ==================== 删除模块 ====================

  /**
   * 删除单个文件
   * @param {Object} options - { domain, apiToken, filePath }
   */
  const deleteFile = async (options) => {
    const { domain, apiToken, filePath } = options

    try {
      const domainUrl = domain.replace(/\/$/, '')
      const response = await fetch(`${domainUrl}/api/manage/delete/${encodeURIComponent(filePath)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Delete failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  /**
   * 删除文件夹（递归删除）
   * @param {Object} options - { domain, apiToken, folderPath }
   */
  const deleteFolder = async (options) => {
    const { domain, apiToken, folderPath } = options

    try {
      const domainUrl = domain.replace(/\/$/, '')
      const response = await fetch(`${domainUrl}/api/manage/delete/${encodeURIComponent(folderPath)}?folder=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Delete folder failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Delete folder error:', error)
      throw error
    }
  }

  /**
   * 批量删除文件
   * @param {Object} options - { domain, apiToken, filePaths }
   */
  const deleteMultipleFiles = async (options) => {
    const { domain, apiToken, filePaths } = options
    const results = {
      success: [],
      failed: []
    }

    for (const filePath of filePaths) {
      try {
        const result = await deleteFile({ domain, apiToken, filePath })
        if (result.success) {
          results.success.push(filePath)
        } else {
          results.failed.push({ filePath, error: result.error || 'Unknown error' })
        }
      } catch (error) {
        results.failed.push({ filePath, error: error.message })
      }
    }

    return results
  }

  // ==================== 工具函数 ====================

  /**
   * 获取带域名的完整URL
   * @param {String} domain - 图床域名
   * @param {String} src - 相对路径
   */
  const getFullUrl = (domain, src) => {
    const domainUrl = domain.replace(/\/$/, '')
    const path = src.startsWith('/') ? src : `/${src}`
    return `${domainUrl}${path}`
  }

  /**
   * 格式化文件大小
   * @param {Number} bytes - 字节数
   */
  const formatFileSize = (bytes) => {
    bytes = parseInt(bytes) || 0
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 格式化时间戳
   * @param {String} timestamp - 时间戳字符串
   */
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-'
    const date = new Date(parseInt(timestamp))
    return date.toLocaleString('zh-CN')
  }

  return {
    // 配置管理
    getConfig,
    saveConfig,
    
    // 上传模块
    uploadImage,
    uploadMultipleImages,
    
    // 列表模块
    getFileList,
    getFileCount,
    
    // 删除模块
    deleteFile,
    deleteFolder,
    deleteMultipleFiles,
    
    // 工具函数
    getFullUrl,
    formatFileSize,
    formatTimestamp
  }
}
