/**
 * 教程页面的筛选和排序函数
 */

/**
 * 提取所有可用标签
 * @param {Array} articles - 文章数组
 * @param {string} excludeTag - 需要排除的标签（默认为 '教程'）
 * @returns {Array<string>} 排序后的标签数组
 */
export function extractAvailableTags(articles, excludeTag = '教程') {
  const tags = new Set()
  articles.forEach(article => {
    if (article.tags && Array.isArray(article.tags)) {
      article.tags.forEach(tag => {
        if (tag !== excludeTag) {
          tags.add(tag)
        }
      })
    }
  })
  return Array.from(tags).sort()
}

/**
 * 根据标签筛选文章
 * @param {Array} articles - 文章数组
 * @param {string} selectedTag - 选中的标签
 * @returns {Array} 筛选后的文章数组
 */
export function filterArticlesByTag(articles, selectedTag) {
  if (selectedTag === 'all') {
    return articles
  }
  return articles.filter(article => 
    article.tags && article.tags.includes(selectedTag)
  )
}

/**
 * 对文章进行排序
 * @param {Array} articles - 文章数组
 * @param {string} sortOrder - 排序方式 ('desc' | 'asc')
 * @returns {Array} 排序后的文章数组
 */
export function sortArticles(articles, sortOrder = 'desc') {
  return [...articles].sort((a, b) => {
    const dateA = new Date(a.createdAt)
    const dateB = new Date(b.createdAt)
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
  })
}

/**
 * 处理文章列表（筛选 + 排序）
 * @param {Array} articles - 原始文章数组
 * @param {string} selectedTag - 选中的标签
 * @param {string} sortOrder - 排序方式
 * @returns {Array} 处理后的文章数组
 */
export function processArticles(articles, selectedTag, sortOrder) {
  const filtered = filterArticlesByTag(articles, selectedTag)
  return sortArticles(filtered, sortOrder)
}
