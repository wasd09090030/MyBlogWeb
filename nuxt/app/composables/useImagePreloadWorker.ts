/**
 * 图片预加载 Worker Composable
 */

import { createWorkerManager, isWorkerSupported } from '~/utils/workers/workerManager'
import type {
  ImagePreloadProgress,
  ImagePreloadResult,
  ImagePreloadWorkerActionMap,
  QuickPreloadResult
} from '~/utils/workers/types'

let imageWorkerManager: ReturnType<typeof createWorkerManager<ImagePreloadWorkerActionMap>> | null = null

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function getManager() {
  if (imageWorkerManager) return imageWorkerManager

  if (!isWorkerSupported() || !process.client) return null

  try {
    imageWorkerManager = createWorkerManager<ImagePreloadWorkerActionMap>(
      'image-preloader',
      () => new Worker(
        new URL('~/utils/workers/imagePreloader.worker.ts', import.meta.url),
        { type: 'module' }
      ),
      { timeout: 60000, singleton: true, maxRetries: 1 }
    )
    return imageWorkerManager
  } catch (e: unknown) {
    console.warn('[useImagePreloadWorker] Worker 创建失败:', getErrorMessage(e))
    return null
  }
}

function preloadImageFallback(url: string): Promise<ImagePreloadResult> {
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

async function batchPreloadFallback(
  urls: string[],
  concurrency: number,
  onProgress?: (p: ImagePreloadProgress) => void
): Promise<ImagePreloadResult[]> {
  const total = urls.length
  let loaded = 0
  let failed = 0
  const results: ImagePreloadResult[] = []

  for (let i = 0; i < urls.length; i += concurrency) {
    const chunk = urls.slice(i, i + concurrency)

    const chunkResults = await Promise.allSettled(chunk.map((url) => preloadImageFallback(url)))

    for (let j = 0; j < chunkResults.length; j++) {
      const result = chunkResults[j]
      loaded++
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        failed++
        results.push({ url: chunk[j], error: getErrorMessage(result.reason) })
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

export function useImagePreloadWorker() {
  async function preloadImages(
    urls: string[],
    options: { concurrency?: number; onProgress?: (p: ImagePreloadProgress) => void } = {}
  ): Promise<ImagePreloadResult[]> {
    const { concurrency = 5, onProgress } = options

    if (!urls || urls.length === 0) return []
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
          timeout: Math.max(60000, urls.length * 5000),
          onProgress
        }
      )
    } catch (e: unknown) {
      console.warn('[useImagePreloadWorker] Worker 预加载失败，降级到主线程:', getErrorMessage(e))
      return batchPreloadFallback(urls, concurrency, onProgress)
    }
  }

  async function quickCacheImages(urls: string[]): Promise<QuickPreloadResult[]> {
    if (!urls || urls.length === 0) return []

    const manager = getManager()
    if (!manager) return []

    try {
      return await manager.postTask('quickPreload', { urls }, { timeout: 30000 })
    } catch {
      return []
    }
  }

  function isAvailable() {
    const manager = getManager()
    return manager?.isAvailable() || false
  }

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
