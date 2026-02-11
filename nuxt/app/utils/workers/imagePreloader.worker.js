/**
 * 图片预加载 Worker
 *
 * 在 Worker 线程中并行获取和解码图片，避免主线程阻塞。
 * 支持：
 * 1. 并行 fetch 图片数据
 * 2. 使用 createImageBitmap 在 Worker 线程解码
 * 3. 并发限制和进度报告
 * 4. 错误容错（单张图片失败不影响整体）
 */

/**
 * 检测 Worker 环境是否支持 createImageBitmap
 */
const supportsImageBitmap = typeof createImageBitmap === 'function'

/**
 * 预加载单张图片
 * @param {string} url - 图片 URL
 * @returns {Promise<{ url, bitmap?, blob?, width?, height?, size? }>}
 */
async function preloadSingleImage(url) {
  const response = await fetch(url, { mode: 'cors', credentials: 'omit' })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const blob = await response.blob()
  const size = blob.size

  if (supportsImageBitmap) {
    try {
      const bitmap = await createImageBitmap(blob)
      return {
        url,
        width: bitmap.width,
        height: bitmap.height,
        size,
        bitmap // Transferable object
      }
    } catch (e) {
      // createImageBitmap 失败时退回 blob 模式
      return { url, size, blobUrl: true }
    }
  }

  return { url, size, blobUrl: true }
}

/**
 * 执行批量图片预加载
 * @param {string} taskId - 任务 ID
 * @param {Array<string>} urls - 图片 URL 数组
 * @param {number} concurrency - 并发限制
 */
async function batchPreload(taskId, urls, concurrency = 5) {
  const total = urls.length
  let loaded = 0
  let failed = 0
  const results = []
  const transferables = []

  // 将 URL 分成并发块
  for (let i = 0; i < urls.length; i += concurrency) {
    const chunk = urls.slice(i, i + concurrency)

    const chunkResults = await Promise.allSettled(
      chunk.map(url => preloadSingleImage(url))
    )

    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        loaded++
        const data = result.value

        // 收集 Transferable 对象
        if (data.bitmap) {
          transferables.push(data.bitmap)
        }

        results.push({
          url: data.url,
          width: data.width,
          height: data.height,
          size: data.size,
          hasBitmap: !!data.bitmap,
          blobUrl: data.blobUrl || false
        })
      } else {
        failed++
        loaded++
        results.push({
          url: chunk[chunkResults.indexOf(result)],
          error: result.reason?.message || '加载失败'
        })
      }
    }

    // 报告进度
    self.postMessage({
      taskId,
      type: 'progress',
      data: {
        loaded,
        total,
        failed,
        percentage: Math.round((loaded / total) * 100)
      }
    })
  }

  return { results, transferables }
}

/**
 * 预加载单张图片（快速模式，仅 fetch 不解码）
 */
async function quickPreload(url) {
  const response = await fetch(url, { mode: 'cors', credentials: 'omit' })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  // 仅读取响应体以触发缓存
  await response.blob()
  return { url, cached: true }
}

// =========================================================
// Worker 消息处理
// =========================================================

self.onmessage = async function (event) {
  const { taskId, action, ...payload } = event.data

  try {
    let result
    let transferables = []

    switch (action) {
      case 'preloadBatch': {
        const { urls, concurrency = 5 } = payload
        const batchResult = await batchPreload(taskId, urls, concurrency)
        result = batchResult.results
        transferables = batchResult.transferables
        break
      }

      case 'preloadSingle': {
        result = await preloadSingleImage(payload.url)
        if (result.bitmap) {
          transferables = [result.bitmap]
        }
        break
      }

      case 'quickPreload': {
        // 快速预缓存（仅 fetch 不解码）
        const { urls } = payload
        const promises = urls.map(url =>
          quickPreload(url).catch(err => ({ url, error: err.message }))
        )
        result = await Promise.all(promises)
        break
      }

      default:
        throw new Error(`未知的 Worker 动作: ${action}`)
    }

    // 使用 Transferable 传输 ImageBitmap（零拷贝）
    if (transferables.length > 0) {
      self.postMessage({ taskId, type: 'result', data: result }, transferables)
    } else {
      self.postMessage({ taskId, type: 'result', data: result })
    }
  } catch (error) {
    self.postMessage({ taskId, type: 'error', error: error.message })
  }
}
