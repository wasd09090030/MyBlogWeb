/**
 * 画廊页面的图片预加载函数
 */

/**
 * 预加载单张图片
 * @param {string} src - 图片URL
 * @param {Object} loadingState - 包含loadedImagesCount和totalImagesToLoad的对象
 * @param {Ref} loadingProgressRef - 加载进度的响应式引用
 * @returns {Promise<HTMLImageElement>} 加载完成的图片元素
 */
export function preloadImage(src, loadingState, loadingProgressRef) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      loadingState.loadedImagesCount.value++
      loadingProgressRef.value = (loadingState.loadedImagesCount.value / loadingState.totalImagesToLoad.value) * 100
      resolve(img)
    }
    img.onerror = reject
    img.src = src
  })
}

/**
 * 预加载多张图片（批量）
 * @param {Array} galleries - 画廊图片数组
 * @param {Object} loadingState - 加载状态对象
 * @param {Ref} loadingProgressRef - 加载进度引用
 * @param {Ref} previewImagesRef - 预览图片引用
 * @param {number} preloadCount - 需要预加载的数量
 * @param {number} concurrencyLimit - 并发限制
 * @returns {Promise<void>}
 */
export async function preloadAllImages(
  galleries,
  loadingState,
  loadingProgressRef,
  previewImagesRef,
  preloadCount = 15,
  concurrencyLimit = 5
) {
  if (galleries.length === 0) return

  const imagesToPreload = galleries.slice(0, preloadCount)
  
  loadingState.totalImagesToLoad.value = imagesToPreload.length
  loadingState.loadedImagesCount.value = 0
  loadingProgressRef.value = 0

  previewImagesRef.value = galleries.slice(0, 3)

  try {
    const chunks = []
    for (let i = 0; i < imagesToPreload.length; i += concurrencyLimit) {
      chunks.push(imagesToPreload.slice(i, i + concurrencyLimit))
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(gallery => preloadImage(gallery.imageUrl, loadingState, loadingProgressRef))
      )
    }

    loadingProgressRef.value = 100
    await new Promise(resolve => setTimeout(resolve, 300))
  } catch (error) {
    console.error('预加载图片失败:', error)
    throw error
  }
}

/**
 * 确保最小加载时间
 * @param {number} startTime - 开始时间戳
 * @param {number} minLoadingTime - 最小加载时间（毫秒）
 * @returns {Promise<void>}
 */
export async function ensureMinLoadingTime(startTime, minLoadingTime = 2000) {
  const elapsedTime = Date.now() - startTime
  if (elapsedTime < minLoadingTime) {
    await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime))
  }
}
