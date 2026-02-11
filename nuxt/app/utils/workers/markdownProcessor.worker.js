/**
 * Markdown 预处理 Worker
 *
 * 在 Worker 线程中执行以下任务，避免阻塞主线程：
 * 1. 从原始 Markdown 文本中提取 TOC 标题结构
 * 2. 检测 Mermaid 代码块
 * 3. 检测所需的代码高亮语言
 * 4. 计算文字统计（字数、阅读时间）
 * 5. 预取文章 API 数据
 */

// =========================================================
// TOC 提取
// =========================================================

/**
 * 从 Markdown 原始文本中提取标题结构
 * @param {string} markdown
 * @returns {Array} TOC 链接树
 */
function extractToc(markdown) {
  if (!markdown) return []

  const lines = markdown.split('\n')
  const headings = []

  let inCodeBlock = false

  for (const line of lines) {
    // 跟踪代码块状态
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    // 匹配 ATX 标题 (# ~ ######)
    const match = line.match(/^(#{1,6})\s+(.+?)(?:\s+#*)?$/)
    if (match) {
      const level = match[1].length
      const text = match[2]
        .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
        .replace(/\*(.*?)\*/g, '$1')     // 移除斜体
        .replace(/`(.*?)`/g, '$1')       // 移除行内代码
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接
        .trim()

      // 生成 slug ID
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      headings.push({ id, text, level })
    }
  }

  // 构建嵌套树结构
  return buildTocTree(headings)
}

/**
 * 将扁平标题列表构建为嵌套树
 */
function buildTocTree(headings) {
  if (headings.length === 0) return []

  const root = { children: [] }
  const stack = [{ node: root, level: 0 }]

  for (const heading of headings) {
    const item = {
      id: heading.id,
      text: heading.text,
      level: heading.level,
      children: []
    }

    // 找到正确的父节点
    while (stack.length > 1 && stack[stack.length - 1].level >= heading.level) {
      stack.pop()
    }

    stack[stack.length - 1].node.children.push(item)
    stack.push({ node: item, level: heading.level })
  }

  return root.children
}

// =========================================================
// 代码块分析
// =========================================================

/**
 * 检测 Markdown 中的代码块信息
 * @param {string} markdown
 * @returns {Object} { languages: string[], hasMermaid: boolean, codeBlockCount: number }
 */
function analyzeCodeBlocks(markdown) {
  if (!markdown) return { languages: [], hasMermaid: false, codeBlockCount: 0 }

  const languages = new Set()
  let hasMermaid = false
  let codeBlockCount = 0

  const codeBlockRegex = /```(\w+)?/g
  let match
  let isOpening = true

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    if (isOpening) {
      codeBlockCount++
      const lang = match[1]
      if (lang) {
        if (lang === 'mermaid') {
          hasMermaid = true
        }
        languages.add(lang.toLowerCase())
      }
    }
    isOpening = !isOpening
  }

  return {
    languages: Array.from(languages),
    hasMermaid,
    codeBlockCount
  }
}

// =========================================================
// 文本统计
// =========================================================

/**
 * 计算文本统计
 * @param {string} markdown
 * @returns {Object} { charCount, wordCount, readingTime }
 */
function computeTextStats(markdown) {
  if (!markdown) return { charCount: 0, wordCount: 0, readingTime: 0 }

  // 移除代码块
  let text = markdown.replace(/```[\s\S]*?```/g, '')
  // 移除行内代码
  text = text.replace(/`[^`]+`/g, '')
  // 移除 Markdown 标记
  text = text.replace(/[#*_~\[\]()>|\\-]/g, '')
  // 移除多余空白
  text = text.replace(/\s+/g, ' ').trim()

  const charCount = text.length

  // 中文字数（CJK 字符）
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length
  // 英文单词数
  const englishWords = text
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0).length

  const wordCount = cjkChars + englishWords

  // 阅读时间（中文 300 字/分钟，英文 200 词/分钟）
  const readingTime = Math.max(1, Math.ceil(cjkChars / 300 + englishWords / 200))

  return { charCount, wordCount, readingTime }
}

// =========================================================
// 数据预取
// =========================================================

/**
 * 在 Worker 中预取文章数据
 * @param {string} apiBase - API 基础 URL
 * @param {string|number} articleId - 文章 ID
 * @returns {Promise<Object>} 文章数据
 */
async function prefetchArticle(apiBase, articleId) {
  const response = await fetch(`${apiBase}/articles/${articleId}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

// =========================================================
// Worker 消息处理
// =========================================================

self.onmessage = async function (event) {
  const { taskId, action, ...payload } = event.data

  try {
    let result

    switch (action) {
      case 'extractToc': {
        result = extractToc(payload.markdown)
        break
      }

      case 'analyzeCodeBlocks': {
        result = analyzeCodeBlocks(payload.markdown)
        break
      }

      case 'computeTextStats': {
        result = computeTextStats(payload.markdown)
        break
      }

      case 'preprocess': {
        // 组合预处理：一次性执行所有分析
        const markdown = payload.markdown
        const toc = extractToc(markdown)
        const codeBlocks = analyzeCodeBlocks(markdown)
        const stats = computeTextStats(markdown)

        result = { toc, codeBlocks, stats }
        break
      }

      case 'prefetchArticle': {
        result = await prefetchArticle(payload.apiBase, payload.articleId)

        // 如果返回了 Markdown 内容，顺带做预处理
        if (result.contentMarkdown) {
          const markdown = result.contentMarkdown
          result._workerPreprocessed = {
            toc: extractToc(markdown),
            codeBlocks: analyzeCodeBlocks(markdown),
            stats: computeTextStats(markdown)
          }
        }
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
