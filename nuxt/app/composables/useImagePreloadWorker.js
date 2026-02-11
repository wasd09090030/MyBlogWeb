/**
 * 图片预加载 Worker Composable
 *
 * 封装 Image Preloader Worker 的通信逻辑，提供：
 * - preloadImages(): 并行预加载多张图片（Worker 线程解码）
 * - quickCacheImages(): 快速缓存图片（仅 fetch 不解码）
 *
 * 自动降级：Worker 不可用时使用传统 Image() 方式
 */

import { createWorkerManager, isWorkerSupported, isImageBitmapSupported } from '~/utils/workers/workerManager'

// Worker 管理器单例
let imageWorkerManager = null

/**
 * 获取或创建 Image Worker 管理器
 */
function getManager() {
  if (imageWorkerManager) return imageWorkerManager

  if (!isWorkerSupported() || !process.client) return null

  try {
    imageWorkerManager = createWorkerManager(
      'image-preloader',
      () => new Worker(
        new URL('~/utils/workers/imagePreloader.worker.js', import.meta.url),
        { type: 'module' }
      ),
      { timeout: 60000, singleton: true, maxRetries: 1 }
    )
    return imageWorkerManager
  } catch (e) {
    console.warn('[useImagePreloadWorker] Worker 创建失败:', e.message)
    return null
  }
}

// =========================================================
// 主线程降级函数
// =========================================================

/**
 * 主线程版图片预加载（降级用）
 */
function preloadImageFallback(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({
      url,
      width: img.width,
      height: img.height,
      hasBitmap: false
    })
    img.onerror = () => reject(new Error(`图片加载失败: ${url}`))
    img.src = url
  })
}

/**
 * 主线程版批量预加载（降级用）
 */
async function batchPreloadFallback(urls, concurrency, onProgress) {
  const total = urls.length
  let loaded = 0
  let failed = 0
  const results = []

  for (let i = 0; i < urls.length; i += concurrency) {
    const chunk = urls.slice(i, i + concurrency)

    const chunkResults = await Promise.allSettled(
      chunk.map(url => preloadImageFallback(url))
    )

    for (const result of chunkResults) {
      loaded++
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        failed++
        results.push({ url: chunk[chunkResults.indexOf(result)], error: result.reason?.message })
      }

      if (onProgress) {
        onProgress({
          loaded,
          total,
          failed,
          percentage: Math.round((loaded / total) * 100)
        })
      }
    }
  }

  return results
}

// =========================================================
// Composable
// =========================================================

export function useImagePreloadWorker() {
  /**
   * 批量预加载图片
   * @param {Array<string>} urls - 图片 URL 数组
   * @param {Object} options - 选项
   * @param {number} options.concurrency - 并发限制（默认 5）
   * @param {Function} options.onProgress - 进度回调 ({ loaded, total, failed, percentage })
   * @returns {Promise<Array>} 加载结果数组
   */
  async function preloadImages(urls, options = {}) {
    const { concurrency = 5, onProgress } = options

    if (!urls || urls.length === 0) return []

    // SSR 环境下不执行图片预加载
    if (!process.client) return []

    const manager = getManager()
    if (!manager) {
      console.log('[useImagePreloadWorker] Worker 不可用，使用主线程降级')
      return batchPreloadFallback(urls, concurrency, onProgress)
    }

    try {
      return await manager.postTask(
        'preloadBatch',
        { urls, concurrency },
        {
          timeout: Math.max(60000, urls.length * 5000), // 至少 60s，每图 5s
          onProgress
        }
      )
    } catch (e) {
      console.warn('[useImagePreloadWorker] Worker 预加载失败，降级到主线程:', e.message)
      return batchPreloadFallback(urls, concurrency, onProgress)
    }
  }

  /**
   * 快速缓存图片（仅 fetch 触发浏览器缓存，不解码）
   * 适合在路由 hover 时使用
   * @param {Array<string>} urls - 图片 URL 数组
   * @returns {Promise<Array>} 缓存结果
   */
  async function quickCacheImages(urls) {
    if (!urls || urls.length === 0) return []

    const manager = getManager()
    if (!manager) return []

    try {
      return await manager.postTask(
        'quickPreload',
        { urls },
        { timeout: 30000 }
      )
    } catch (e) {
      // 静默失败，预缓存不影响用户体验
      return []
    }
  }

  /**
   * 获取 Worker 状态
   */
  function isAvailable() {
    const manager = getManager()
    return manager?.isAvailable() || false
  }

  /**
   * 销毁 Worker
   */
  function dispose() {
    if (imageWorkerManager) {
      imageWorkerManager.terminate()
      imageWorkerManager = null
    }
  }

  return {
    preloadImages,
    quickCacheImages,
    isAvailable,
    dispose
  }
}
