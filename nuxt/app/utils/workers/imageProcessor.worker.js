/**
 * 图片处理 Worker（增强版）
 *
 * 使用 OffscreenCanvas 在 Worker 线程中执行图片格式转换，
 * 完全不阻塞主线程。
 *
 * 支持：
 * 1. 格式转换（PNG/JPEG/WebP/AVIF）
 * 2. 尺寸调整（等比缩放）
 * 3. 质量压缩
 *
 * 注：需要浏览器支持 OffscreenCanvas（Chrome 69+, Firefox 105+, Safari 16.4+）
 */

const supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined'

/**
 * 检测格式支持
 */
async function checkFormatSupport(format) {
  if (format === 'png' || format === 'jpeg') return true

  if (!supportsOffscreenCanvas) return false

  try {
    const canvas = new OffscreenCanvas(1, 1)
    const blob = await canvas.convertToBlob({ type: getMimeType(format), quality: 0.5 })
    return blob.type === getMimeType(format)
  } catch {
    return false
  }
}

/**
 * 获取 MIME 类型
 */
function getMimeType(format) {
  const mimeTypes = {
    'png': 'image/png',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'avif': 'image/avif'
  }
  return mimeTypes[format] || 'image/png'
}

/**
 * 在 Worker 中转换图片格式
 * @param {Blob} imageBlob - 原始图片 Blob
 * @param {Object} options - 转换选项
 * @returns {Promise<Object>} { blob, width, height, size, format }
 */
async function convertImage(imageBlob, options) {
  const { format, quality = 0.85, maxWidth, maxHeight } = options

  // 解码图片
  const bitmap = await createImageBitmap(imageBlob)
  let targetWidth = bitmap.width
  let targetHeight = bitmap.height

  // 计算缩放尺寸
  if (maxWidth && targetWidth > maxWidth) {
    targetHeight = Math.round((maxWidth / targetWidth) * targetHeight)
    targetWidth = maxWidth
  }
  if (maxHeight && targetHeight > maxHeight) {
    targetWidth = Math.round((maxHeight / targetHeight) * targetWidth)
    targetHeight = maxHeight
  }

  // 使用 OffscreenCanvas 绘制
  const canvas = new OffscreenCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
  bitmap.close()

  // 转换为目标格式
  const mimeType = getMimeType(format)
  const blob = await canvas.convertToBlob({
    type: mimeType,
    quality: format === 'png' ? undefined : quality
  })

  return {
    blob,
    width: targetWidth,
    height: targetHeight,
    size: blob.size,
    format,
    mimeType: blob.type
  }
}

/**
 * 批量转换图片
 */
async function batchConvert(taskId, images, options) {
  const results = []
  const total = images.length

  for (let i = 0; i < images.length; i++) {
    try {
      const result = await convertImage(images[i], options)
      results.push({ index: i, ...result })
    } catch (e) {
      results.push({ index: i, error: e.message })
    }

    // 报告进度
    self.postMessage({
      taskId,
      type: 'progress',
      data: {
        processed: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 100)
      }
    })
  }

  return results
}

// =========================================================
// Worker 消息处理
// =========================================================

self.onmessage = async function (event) {
  const { taskId, action, ...payload } = event.data

  try {
    let result

    switch (action) {
      case 'checkSupport': {
        result = {
          offscreenCanvas: supportsOffscreenCanvas,
          formats: {
            png: true,
            jpeg: true,
            webp: await checkFormatSupport('webp'),
            avif: await checkFormatSupport('avif')
          }
        }
        break
      }

      case 'convert': {
        if (!supportsOffscreenCanvas) {
          throw new Error('浏览器不支持 OffscreenCanvas')
        }
        result = await convertImage(payload.imageBlob, payload.options)
        // Blob 通过结构化克隆传输
        break
      }

      case 'batchConvert': {
        if (!supportsOffscreenCanvas) {
          throw new Error('浏览器不支持 OffscreenCanvas')
        }
        result = await batchConvert(taskId, payload.images, payload.options)
        break
      }

      default:
        throw new Error(`未知的 Worker 动作: ${action}`)
    }

    self.postMessage({ taskId, type: 'result', data: result })
  } catch (error) {
    self.postMessage({ taskId, type: 'error', error: error.message })
  }
}
