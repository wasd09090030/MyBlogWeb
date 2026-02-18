/**
 * Markdown Worker Composable
 */

import { createWorkerManager, isWorkerSupported } from '~/utils/workers/workerManager'
import type {
  MarkdownPreprocessResult,
  MarkdownWorkerActionMap,
  TocItem
} from '~/utils/workers/types'

let markdownWorkerManager: ReturnType<typeof createWorkerManager<MarkdownWorkerActionMap>> | null = null

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function getManager() {
  if (markdownWorkerManager) return markdownWorkerManager

  if (!isWorkerSupported() || !process.client) return null

  try {
    markdownWorkerManager = createWorkerManager<MarkdownWorkerActionMap>(
      'markdown-processor',
      () => new Worker(
        new URL('~/utils/workers/markdownProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      ),
      { timeout: 15000, singleton: true, maxRetries: 1 }
    )
    return markdownWorkerManager
  } catch (e: unknown) {
    console.warn('[useMarkdownWorker] Worker 创建失败:', getErrorMessage(e))
    return null
  }
}

function extractTocFallback(markdown: string): TocItem[] {
  if (!markdown) return []

  const lines = markdown.split('\n')
  const headings: TocItem[] = []
  let inCodeBlock = false

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = line.match(/^(#{1,6})\s+(.+?)(?:\s+#*)?$/)
    if (match) {
      const level = (match[1] || '').length
      const text = (match[2] || '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .trim()

      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      headings.push({ id, text, level })
    }
  }

  return headings
}

function preprocessFallback(markdown: string): MarkdownPreprocessResult {
  const toc = extractTocFallback(markdown)
  const hasMermaid = markdown?.includes('```mermaid') || false

  const codeBlockRegex = /```(\w+)?/g
  const languages = new Set<string>()
  let codeBlockCount = 0
  let match: RegExpExecArray | null
  let isOpening = true

  while ((match = codeBlockRegex.exec(markdown || '')) !== null) {
    if (isOpening) {
      codeBlockCount++
      if (match[1]) languages.add(match[1].toLowerCase())
    }
    isOpening = !isOpening
  }

  const text = (markdown || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_~\[\]()>|\\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const cjkChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const words = text.split(/\s+/).filter((w) => w.length > 0).length
  const wordCount = cjkChars + words
  const readingTime = Math.max(1, Math.ceil(wordCount / 275))

  return {
    toc,
    codeBlocks: {
      languages: Array.from(languages),
      hasMermaid,
      codeBlockCount
    },
    stats: {
      charCount: text.length,
      wordCount,
      readingTime
    }
  }
}

export function useMarkdownWorker() {
  async function preprocessMarkdown(markdown: string): Promise<MarkdownPreprocessResult> {
    if (!markdown) {
      return {
        toc: [],
        codeBlocks: { languages: [], hasMermaid: false, codeBlockCount: 0 },
        stats: { charCount: 0, wordCount: 0, readingTime: 0 }
      }
    }

    const manager = getManager()
    if (!manager) {
      return preprocessFallback(markdown)
    }

    return manager.postTaskWithFallback(
      'preprocess',
      { markdown },
      () => preprocessFallback(markdown)
    )
  }

  async function extractToc(markdown: string): Promise<TocItem[]> {
    const manager = getManager()
    if (!manager) {
      return extractTocFallback(markdown)
    }

    return manager.postTaskWithFallback(
      'extractToc',
      { markdown },
      () => extractTocFallback(markdown)
    )
  }

  async function prefetchArticle(apiBase: string, articleId: string | number): Promise<Record<string, unknown> | null> {
    const manager = getManager()
    if (!manager) return null

    try {
      return await manager.postTask('prefetchArticle', { apiBase, articleId }, { timeout: 10000 })
    } catch (e: unknown) {
      console.warn('[useMarkdownWorker] 预取文章失败:', getErrorMessage(e))
      return null
    }
  }

  function isAvailable() {
    const manager = getManager()
    return manager?.isAvailable() || false
  }

  function dispose() {
    if (markdownWorkerManager) {
      markdownWorkerManager.terminate()
      markdownWorkerManager = null
    }
  }

  return {
    preprocessMarkdown,
    extractToc,
    prefetchArticle,
    isAvailable,
    dispose
  }
}
