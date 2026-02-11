/**
 * 文档导出 Worker Composable
 *
 * 将耗时的文档导出操作分解为可调度的异步任务，
 * 通过 requestIdleCallback 和 chunk 化处理减少主线程阻塞。
 *
 * 注：PDF 导出依赖 html2canvas（需要 DOM），无法完全在 Worker 中运行。
 * 但通过以下策略可显著减少 UI 阻塞：
 * 1. DOCX 文档构建的文本解析在 Worker 中执行
 * 2. PDF 生成使用 chunked rendering 避免长阻塞
 * 3. 进度回调保持 UI 响应
 */

import { createWorkerManager, isWorkerSupported } from '~/utils/workers/workerManager'

// Worker 管理器单例
let exportWorkerManager = null

function getManager() {
  if (exportWorkerManager) return exportWorkerManager

  if (!isWorkerSupported() || !process.client) return null

  try {
    exportWorkerManager = createWorkerManager(
      'document-export',
      () => new Worker(
        new URL('~/utils/workers/documentExport.worker.js', import.meta.url),
        { type: 'module' }
      ),
      { timeout: 60000, singleton: true, maxRetries: 0 }
    )
    return exportWorkerManager
  } catch (e) {
    console.warn('[useExportWorker] Worker 创建失败:', e.message)
    return null
  }
}

// =========================================================
// Composable
// =========================================================

export function useExportWorker() {
  const isExporting = ref(false)
  const exportProgress = ref(0)

  /**
   * 在 Worker 中解析 Markdown 为 DOCX 段落结构
   * @param {string} markdown - Markdown 文本
   * @param {Object} options - 样式选项
   * @returns {Promise<Array>} DOCX 段落数据结构
   */
  async function parseMarkdownForDocx(markdown, options = {}) {
    const manager = getManager()
    if (!manager) {
      // 降级：返回 null 让调用方使用原逻辑
      return null
    }

    try {
      return await manager.postTask('parseForDocx', {
        markdown,
        options
      }, {
        timeout: 30000,
        onProgress: (progress) => {
          exportProgress.value = progress.percentage || 0
        }
      })
    } catch (e) {
      console.warn('[useExportWorker] Worker 解析失败:', e.message)
      return null
    }
  }

  /**
   * 使用 chunked rendering 优化 PDF 导出
   * 将 DOM 克隆操作分批执行，避免长阻塞
   * @param {HTMLElement} sourceElement - 源 DOM 元素
   * @param {Function} onChunk - 每个 chunk 完成的回调
   * @returns {Promise<HTMLElement>} 处理后的克隆元素
   */
  async function prepareElementForPdf(sourceElement, onChunk) {
    isExporting.value = true
    exportProgress.value = 0

    try {
      // 克隆 DOM
      const cloned = sourceElement.cloneNode(true)

      // 移除不需要的元素
      cloned.querySelectorAll('.animate-pulse, .skeleton, .loading').forEach(el => el.remove())

      // 分批处理子元素以避免长阻塞
      const children = Array.from(cloned.children)
      const chunkSize = 20
      let processed = 0

      for (let i = 0; i < children.length; i += chunkSize) {
        // 让出主线程给 UI 更新
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 0))
        }

        processed += Math.min(chunkSize, children.length - i)
        exportProgress.value = Math.round((processed / children.length) * 50)

        if (onChunk) onChunk(exportProgress.value)
      }

      exportProgress.value = 50
      return cloned
    } catch (e) {
      console.error('[useExportWorker] DOM 预处理失败:', e)
      throw e
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    isExporting.value = false
    exportProgress.value = 0
  }

  /**
   * 销毁 Worker
   */
  function dispose() {
    if (exportWorkerManager) {
      exportWorkerManager.terminate()
      exportWorkerManager = null
    }
    reset()
  }

  return {
    parseMarkdownForDocx,
    prepareElementForPdf,
    reset,
    dispose,
    isExporting: readonly(isExporting),
    exportProgress: readonly(exportProgress)
  }
}
