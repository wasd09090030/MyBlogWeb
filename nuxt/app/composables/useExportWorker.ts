/**
 * 文档导出 Worker Composable
 */

import { createWorkerManager, isWorkerSupported } from '~/utils/workers/workerManager'
import type { DocxParagraph, ExportWorkerActionMap } from '~/utils/workers/types'

let exportWorkerManager: ReturnType<typeof createWorkerManager<ExportWorkerActionMap>> | null = null

function getManager() {
  if (exportWorkerManager) return exportWorkerManager

  if (!isWorkerSupported() || !process.client) return null

  try {
    exportWorkerManager = createWorkerManager<ExportWorkerActionMap>(
      'document-export',
      () => new Worker(
        new URL('~/utils/workers/documentExport.worker.ts', import.meta.url),
        { type: 'module' }
      ),
      { timeout: 60000, singleton: true, maxRetries: 0 }
    )
    return exportWorkerManager
  } catch (e: any) {
    console.warn('[useExportWorker] Worker 创建失败:', e?.message)
    return null
  }
}

export function useExportWorker() {
  const isExporting = ref(false)
  const exportProgress = ref(0)

  async function parseMarkdownForDocx(
    markdown: string,
    options: Record<string, unknown> = {}
  ): Promise<DocxParagraph[] | null> {
    const manager = getManager()
    if (!manager) {
      return null
    }

    try {
      return await manager.postTask(
        'parseForDocx',
        { markdown, options },
        {
          timeout: 30000,
          onProgress: (progress) => {
            exportProgress.value = progress?.percentage || 0
          }
        }
      )
    } catch (e: any) {
      console.warn('[useExportWorker] Worker 解析失败:', e?.message)
      return null
    }
  }

  async function prepareElementForPdf(
    sourceElement: HTMLElement,
    onChunk?: (progress: number) => void
  ): Promise<HTMLElement> {
    isExporting.value = true
    exportProgress.value = 0

    try {
      const cloned = sourceElement.cloneNode(true) as HTMLElement

      cloned.querySelectorAll('.animate-pulse, .skeleton, .loading').forEach((el) => el.remove())

      const children = Array.from(cloned.children)
      const chunkSize = 20
      let processed = 0

      for (let i = 0; i < children.length; i += chunkSize) {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 0))
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

  function reset() {
    isExporting.value = false
    exportProgress.value = 0
  }

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
