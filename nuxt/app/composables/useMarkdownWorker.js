/**
 * Markdown Worker Composable
 *
 * 封装 Markdown 预处理 Worker 的通信逻辑，提供：
 * - preprocessMarkdown(): 预处理 Markdown（TOC + 代码分析 + 文本统计）
 * - prefetchArticle(): 在 Worker 中预取文章数据
 * - extractToc(): 仅提取 TOC
 *
 * 自动降级：Worker 不可用时在主线程执行
 */

import { createWorkerManager, isWorkerSupported } from '~/utils/workers/workerManager'

// Worker 管理器单例（模块级别，所有组件共享）
let markdownWorkerManager = null

/**
 * 获取或创建 Markdown Worker 管理器
 */
function getManager() {
  if (markdownWorkerManager) return markdownWorkerManager

  if (!isWorkerSupported() || !process.client) return null

  try {
    markdownWorkerManager = createWorkerManager(
      'markdown-processor',
      () => new Worker(
        new URL('~/utils/workers/markdownProcessor.worker.js', import.meta.url),
        { type: 'module' }
      ),
      { timeout: 15000, singleton: true, maxRetries: 1 }
    )
    return markdownWorkerManager
  } catch (e) {
    console.warn('[useMarkdownWorker] Worker 创建失败:', e.message)
    return null
  }
}

// =========================================================
// 主线程降级函数
// =========================================================

/**
 * 主线程版 TOC 提取（降级用）
 */
function extractTocFallback(markdown) {
  if (!markdown) return []

  const lines = markdown.split('\n')
  const headings = []
  let inCodeBlock = false

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = line.match(/^(#{1,6})\s+(.+?)(?:\s+#*)?$/)
    if (match) {
      const level = match[1].length
      const text = match[2]
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

/**
 * 主线程版预处理（降级用）
 */
function preprocessFallback(markdown) {
  const toc = extractTocFallback(markdown)
  const hasMermaid = markdown?.includes('```mermaid') || false

  const codeBlockRegex = /```(\w+)?/g
  const languages = new Set()
  let codeBlockCount = 0
  let match
  let isOpening = true

  while ((match = codeBlockRegex.exec(markdown || '')) !== null) {
    if (isOpening) {
      codeBlockCount++
      if (match[1]) languages.add(match[1].toLowerCase())
    }
    isOpening = !isOpening
  }

  // 简化的文字统计
  const text = (markdown || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_~\[\]()>|\\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const cjkChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const words = text.split(/\s+/).filter(w => w.length > 0).length
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

// =========================================================
// Composable
// =========================================================

export function useMarkdownWorker() {
  /**
   * 预处理 Markdown（TOC + 代码分析 + 文本统计）
   * @param {string} markdown - 原始 Markdown 文本
   * @returns {Promise<{ toc, codeBlocks, stats }>}
   */
  async function preprocessMarkdown(markdown) {
    if (!markdown) return { toc: [], codeBlocks: { languages: [], hasMermaid: false, codeBlockCount: 0 }, stats: { charCount: 0, wordCount: 0, readingTime: 0 } }

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

  /**
   * 仅提取 TOC
   * @param {string} markdown
   * @returns {Promise<Array>}
   */
  async function extractToc(markdown) {
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

  /**
   * 在 Worker 中预取文章数据
   * @param {string} apiBase - API 基础 URL
   * @param {string|number} articleId - 文章 ID
   * @returns {Promise<Object|null>} 文章数据，失败返回 null
   */
  async function prefetchArticle(apiBase, articleId) {
    const manager = getManager()
    if (!manager) return null

    try {
      return await manager.postTask('prefetchArticle', {
        apiBase,
        articleId
      }, { timeout: 10000 })
    } catch (e) {
      console.warn('[useMarkdownWorker] 预取文章失败:', e.message)
      return null
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
