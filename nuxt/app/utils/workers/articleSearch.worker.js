/**
 * 文章搜索与过滤 Worker
 *
 * 在 Worker 线程中执行以避免阻塞主线程：
 * 1. 全文模糊搜索（标题/摘要/标签）
 * 2. 分类/标签过滤
 * 3. 排序（日期/热度）
 * 4. 倒排索引构建（加速后续搜索）
 */

// =========================================================
// 倒排索引
// =========================================================

let invertedIndex = null
let indexedArticles = null

/**
 * 构建倒排索引
 * @param {Array} articles - 文章数组
 */
function buildIndex(articles) {
  const index = new Map()

  articles.forEach((article, idx) => {
    const tokens = tokenize(
      `${article.title || ''} ${article.summary || ''} ${(article.tags || []).join(' ')}`
    )

    tokens.forEach(token => {
      if (!index.has(token)) {
        index.set(token, new Set())
      }
      index.get(token).add(idx)
    })
  })

  invertedIndex = index
  indexedArticles = articles
  return { tokenCount: index.size, articleCount: articles.length }
}

/**
 * 简单分词（中文按字、英文按词）
 */
function tokenize(text) {
  if (!text) return []

  const tokens = new Set()
  const lower = text.toLowerCase()

  // 英文单词
  const words = lower.match(/[a-z0-9]+/g) || []
  words.forEach(w => {
    if (w.length >= 2) tokens.add(w)
  })

  // 中文字符（单字 + 双字组合）
  const cjk = lower.match(/[\u4e00-\u9fff]/g) || []
  cjk.forEach(c => tokens.add(c))

  // 双字组合（bigram）
  for (let i = 0; i < cjk.length - 1; i++) {
    tokens.add(cjk[i] + cjk[i + 1])
  }

  return Array.from(tokens)
}

// =========================================================
// 搜索函数
// =========================================================

/**
 * 使用倒排索引进行搜索
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 匹配的文章索引及得分
 */
function searchWithIndex(keyword) {
  if (!invertedIndex || !indexedArticles) return []

  const tokens = tokenize(keyword)
  if (tokens.length === 0) return []

  // 计算每篇文章的匹配得分
  const scores = new Map()

  tokens.forEach(token => {
    // 精确匹配
    const exact = invertedIndex.get(token)
    if (exact) {
      exact.forEach(idx => {
        scores.set(idx, (scores.get(idx) || 0) + 2)
      })
    }

    // 前缀匹配
    for (const [indexToken, articleIndices] of invertedIndex) {
      if (indexToken !== token && indexToken.startsWith(token)) {
        articleIndices.forEach(idx => {
          scores.set(idx, (scores.get(idx) || 0) + 1)
        })
      }
    }
  })

  // 按得分降序排列
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([idx, score]) => ({
      article: indexedArticles[idx],
      score
    }))
}

/**
 * 简单关键词搜索（无索引回退版）
 * @param {Array} articles - 文章数组
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 匹配的文章
 */
function simpleSearch(articles, keyword) {
  if (!articles || !keyword) return []

  const lower = keyword.toLowerCase()

  return articles.filter(article =>
    article.title?.toLowerCase().includes(lower) ||
    article.summary?.toLowerCase().includes(lower) ||
    article.tags?.some(tag => tag.toLowerCase().includes(lower))
  )
}

// =========================================================
// 过滤与排序
// =========================================================

/**
 * 按分类过滤文章
 */
function filterByCategory(articles, category) {
  if (!category || category === 'all') return articles
  return articles.filter(a => a.category === category)
}

/**
 * 按标签过滤文章
 */
function filterByTag(articles, tag) {
  if (!tag) return articles
  const lower = tag.toLowerCase()
  return articles.filter(a =>
    a.tags?.some(t => t.toLowerCase() === lower)
  )
}

/**
 * 排序文章
 */
function sortArticles(articles, sortBy = 'date', order = 'desc') {
  const sorted = [...articles]

  switch (sortBy) {
    case 'date':
      sorted.sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime()
        const db = new Date(b.createdAt || 0).getTime()
        return order === 'desc' ? db - da : da - db
      })
      break
    case 'title':
      sorted.sort((a, b) => {
        const cmp = (a.title || '').localeCompare(b.title || '', 'zh-CN')
        return order === 'desc' ? -cmp : cmp
      })
      break
    case 'id':
      sorted.sort((a, b) => {
        const ia = parseInt(a.id) || 0
        const ib = parseInt(b.id) || 0
        return order === 'desc' ? ib - ia : ia - ib
      })
      break
  }

  return sorted
}

/**
 * 组合查询（搜索 + 过滤 + 排序）
 */
function combinedQuery(articles, options = {}) {
  const { keyword, category, tag, sortBy = 'date', order = 'desc' } = options

  let result = articles

  // 搜索
  if (keyword) {
    if (invertedIndex && indexedArticles === articles) {
      // 使用倒排索引
      const searchResults = searchWithIndex(keyword)
      result = searchResults.map(r => r.article)
    } else {
      result = simpleSearch(result, keyword)
    }
  }

  // 过滤
  result = filterByCategory(result, category)
  result = filterByTag(result, tag)

  // 排序（如果有搜索关键词，默认按相关性排序，否则按时间）
  if (!keyword) {
    result = sortArticles(result, sortBy, order)
  }

  return result
}

// =========================================================
// Worker 消息处理
// =========================================================

self.onmessage = function (event) {
  const { taskId, action, ...payload } = event.data

  try {
    let result

    switch (action) {
      case 'buildIndex': {
        result = buildIndex(payload.articles)
        break
      }

      case 'search': {
        const { articles, keyword } = payload
        if (invertedIndex) {
          const searchResults = searchWithIndex(keyword)
          result = searchResults.map(r => r.article)
        } else {
          result = simpleSearch(articles, keyword)
        }
        break
      }

      case 'filter': {
        const { articles, category, tag } = payload
        let filtered = filterByCategory(articles, category)
        filtered = filterByTag(filtered, tag)
        result = filtered
        break
      }

      case 'sort': {
        const { articles, sortBy, order } = payload
        result = sortArticles(articles, sortBy, order)
        break
      }

      case 'query': {
        result = combinedQuery(payload.articles, payload.options)
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
