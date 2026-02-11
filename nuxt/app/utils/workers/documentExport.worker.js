/**
 * 文档导出 Worker
 *
 * 在 Worker 线程中执行：
 * 1. Markdown 文本解析为 DOCX 段落结构
 * 2. 文本处理和格式化
 *
 * 注：PDF 生成依赖 DOM (html2canvas)，不在此 Worker 中处理
 */

// =========================================================
// Markdown → DOCX 段落结构解析
// =========================================================

/**
 * 解析 Markdown 为 DOCX 可用的段落结构数据
 * @param {string} markdown - 原始 Markdown 文本
 * @param {Object} options - 样式选项
 * @returns {Array} 段落结构数组
 */
function parseMarkdownToDocxStructure(markdown, options = {}) {
  const lines = markdown.split('\n')
  const paragraphs = []
  let inCodeBlock = false
  let codeBlockLines = []
  let codeLanguage = ''
  let inTable = false
  let tableLines = []
  const total = lines.length

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 代码块处理
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // 结束代码块
        paragraphs.push({
          type: 'codeBlock',
          language: codeLanguage,
          lines: [...codeBlockLines]
        })
        codeBlockLines = []
        codeLanguage = ''
        inCodeBlock = false
      } else {
        // 开始代码块
        inCodeBlock = true
        codeLanguage = line.slice(3).trim()
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(line)
      continue
    }

    // 表格处理
    if (line.match(/^\|.+\|$/)) {
      if (!inTable) inTable = true
      tableLines.push(line)
      continue
    } else if (inTable) {
      // 结束表格
      paragraphs.push({
        type: 'table',
        rows: parseTableRows(tableLines)
      })
      tableLines = []
      inTable = false
    }

    // 空行
    if (!line.trim()) {
      continue
    }

    // 标题
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      paragraphs.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
        runs: parseInlineFormatting(headingMatch[2])
      })
      continue
    }

    // 分隔线
    if (line.match(/^(-{3,}|\*{3,}|_{3,})\s*$/)) {
      paragraphs.push({ type: 'horizontalRule' })
      continue
    }

    // 引用
    if (line.startsWith('>')) {
      const text = line.replace(/^>\s*/, '')
      paragraphs.push({
        type: 'blockquote',
        text,
        runs: parseInlineFormatting(text)
      })
      continue
    }

    // 无序列表
    if (line.match(/^[-*+]\s+/)) {
      const text = line.replace(/^[-*+]\s+/, '')
      const indent = (line.match(/^\s*/) || [''])[0].length
      paragraphs.push({
        type: 'unorderedList',
        text,
        indent: Math.floor(indent / 2),
        runs: parseInlineFormatting(text)
      })
      continue
    }

    // 有序列表
    const olMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (olMatch) {
      const indent = (line.match(/^\s*/) || [''])[0].length
      paragraphs.push({
        type: 'orderedList',
        number: parseInt(olMatch[1]),
        text: olMatch[2],
        indent: Math.floor(indent / 2),
        runs: parseInlineFormatting(olMatch[2])
      })
      continue
    }

    // 普通段落
    paragraphs.push({
      type: 'paragraph',
      text: line,
      runs: parseInlineFormatting(line)
    })

    // 每 100 行报告一次进度
    if (i % 100 === 0) {
      self.postMessage({
        taskId: currentTaskId,
        type: 'progress',
        data: { percentage: Math.round((i / total) * 100) }
      })
    }
  }

  // 处理末尾的代码块或表格
  if (codeBlockLines.length > 0) {
    paragraphs.push({
      type: 'codeBlock',
      language: codeLanguage,
      lines: codeBlockLines
    })
  }
  if (tableLines.length > 0) {
    paragraphs.push({
      type: 'table',
      rows: parseTableRows(tableLines)
    })
  }

  return paragraphs
}

/**
 * 解析表格行
 */
function parseTableRows(lines) {
  return lines
    .filter(line => !line.match(/^\|[\s:-]+\|$/)) // 跳过分隔行
    .map(line =>
      line.split('|')
        .filter(cell => cell.trim())
        .map(cell => cell.trim())
    )
}

/**
 * 解析行内格式（粗体、斜体、代码、链接）
 * @returns {Array} 格式化的文本段数组
 */
function parseInlineFormatting(text) {
  const runs = []
  // 简化的行内格式解析
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\)|([^*`\[]+))/g
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // 粗体
      runs.push({ text: match[2], bold: true })
    } else if (match[3]) {
      // 斜体
      runs.push({ text: match[3], italic: true })
    } else if (match[4]) {
      // 行内代码
      runs.push({ text: match[4], code: true })
    } else if (match[5]) {
      // 链接
      runs.push({ text: match[5], link: match[6] })
    } else if (match[7]) {
      // 普通文本
      runs.push({ text: match[7] })
    }
  }

  if (runs.length === 0 && text) {
    runs.push({ text })
  }

  return runs
}

// =========================================================
// Worker 消息处理
// =========================================================

let currentTaskId = null

self.onmessage = function (event) {
  const { taskId, action, ...payload } = event.data
  currentTaskId = taskId

  try {
    let result

    switch (action) {
      case 'parseForDocx': {
        result = parseMarkdownToDocxStructure(payload.markdown, payload.options)
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
