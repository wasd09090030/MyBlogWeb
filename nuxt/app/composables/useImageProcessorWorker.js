/**
 * 图片处理 Worker 组合式函数
 *
 * 提供 OffscreenCanvas Worker 接口用于图片格式转换，
 * 当 Worker 不可用时自动降级为主线程 Canvas 操作。
 */
import { ref, onUnmounted } from 'vue'
import { createWorkerManager, isWorkerSupported } from '~/utils/workers/workerManager'

let workerInstance = null
let refCount = 0

function getWorker() {
  if (!workerInstance && isWorkerSupported()) {
    try {
      workerInstance = createWorkerManager(
        'imageProcessor',
        () => new Worker(new URL('~/utils/workers/imageProcessor.worker.js', import.meta.url), {
          type: 'module'
        }),
        { maxRetries: 1, taskTimeout: 30000 }
      )
    } catch (e) {
      console.warn('[useImageProcessorWorker] Worker 创建失败:', e)
    }
  }
  refCount++
  return workerInstance
}

export function useImageProcessorWorker() {
  const worker = process.client ? getWorker() : null
  const formatSupport = ref(null)

  onUnmounted(() => {
    refCount--
    if (refCount <= 0 && workerInstance) {
      workerInstance.terminate()
      workerInstance = null
      refCount = 0
    }
  })

  /**
   * 检查 OffscreenCanvas 和格式支持
   */
  async function checkSupport() {
    if (formatSupport.value) return formatSupport.value

    if (worker) {
      try {
        const result = await worker.postTask({ action: 'checkSupport' })
        formatSupport.value = result
        return result
      } catch { /* fall through */ }
    }

    // SSR 环境下返回基础支持信息
    if (!process.client) {
      const result = { offscreenCanvas: false, formats: { png: true, jpeg: true, webp: false, avif: false } }
      formatSupport.value = result
      return result
    }

    // 降级：主线程检测
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const result = {
      offscreenCanvas: false,
      formats: {
        png: true,
        jpeg: true,
        webp: canvas.toDataURL('image/webp').startsWith('data:image/webp'),
        avif: false // 主线程 Canvas 通常不支持 AVIF 导出
      }
    }
    formatSupport.value = result
    return result
  }

  /**
   * 在 Worker 中转换图片格式
   * @param {File|Blob} imageBlob - 图片 Blob
   * @param {Object} options - { format, quality, maxWidth, maxHeight }
   * @returns {Promise<{ blob: Blob, width: number, height: number, size: number }>}
   */
  async function convertImage(imageBlob, options) {
    // SSR 环境下不执行图片转换
    if (!process.client) {
      throw new Error('图片转换仅在客户端可用')
    }

    // 尝试 Worker 转换
    if (worker) {
      try {
        const result = await worker.postTask({
          action: 'convert',
          imageBlob,
          options
        })
        return result
      } catch (e) {
        console.warn('[useImageProcessorWorker] Worker 转换失败，降级到主线程:', e)
      }
    }

    // 降级：主线程 Canvas 转换
    return await convertImageMainThread(imageBlob, options)
  }

  /**
   * 批量转换图片
   */
  async function batchConvert(images, options, onProgress) {
    // SSR 环境下不执行批量转换
    if (!process.client) return []

    if (worker) {
      try {
        const result = await worker.postTaskWithFallback(
          { action: 'batchConvert', images, options },
          () => batchConvertMainThread(images, options, onProgress),
          { onProgress: onProgress ? (prog) => onProgress(prog) : undefined }
        )
        return result
      } catch { /* fall through */ }
    }

    return await batchConvertMainThread(images, options, onProgress)
  }

  /**
   * Worker 是否可用
   */
  function isAvailable() {
    return !!(worker && typeof OffscreenCanvas !== 'undefined')
  }

  function dispose() {
    refCount--
    if (refCount <= 0 && workerInstance) {
      workerInstance.terminate()
      workerInstance = null
      refCount = 0
    }
  }

  return {
    convertImage,
    batchConvert,
    checkSupport,
    isAvailable,
    formatSupport,
    dispose
  }
}

// =========================================================
// 主线程降级实现
// =========================================================

async function convertImageMainThread(imageBlob, options) {
  const { format, quality = 0.85, maxWidth, maxHeight } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(imageBlob)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let width = img.naturalWidth
      let height = img.naturalHeight

      if (maxWidth && width > maxWidth) {
        height = Math.round((maxWidth / width) * height)
        width = maxWidth
      }
      if (maxHeight && height > maxHeight) {
        width = Math.round((maxHeight / height) * width)
        height = maxHeight
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      const mimeTypes = {
        'png': 'image/png',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'avif': 'image/avif'
      }
      const mimeType = mimeTypes[format] || 'image/png'

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob 失败'))
            return
          }
          resolve({ blob, width, height, size: blob.size, format, mimeType: blob.type })
        },
        mimeType,
        format === 'png' ? undefined : quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }

    img.src = url
  })
}

async function batchConvertMainThread(images, options, onProgress) {
  const results = []
  for (let i = 0; i < images.length; i++) {
    try {
      const result = await convertImageMainThread(images[i], options)
      results.push({ index: i, ...result })
    } catch (e) {
      results.push({ index: i, error: e.message })
    }
    if (onProgress) {
      onProgress({
        processed: i + 1,
        total: images.length,
        percentage: Math.round(((i + 1) / images.length) * 100)
      })
    }
  }
  return results
}
