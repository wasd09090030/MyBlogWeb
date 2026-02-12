/**
 * 教程页面的筛选和排序函数
 */

type ArticleLike = {
  tags?: string[] | null
  createdAt: string | number | Date
}

/**
 * 提取所有可用标签
 * @param articles - 文章数组
 * @param excludeTag - 需要排除的标签（默认为 '教程'）
 * @returns 排序后的标签数组
 */
export function extractAvailableTags<T extends { tags?: string[] | null }>(
  articles: T[],
  excludeTag = '教程'
): string[] {
  const tags = new Set<string>()
  articles.forEach((article) => {
    if (article.tags && Array.isArray(article.tags)) {
      article.tags.forEach((tag) => {
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
 * @param articles - 文章数组
 * @param selectedTag - 选中的标签
 * @returns 筛选后的文章数组
 */
export function filterArticlesByTag<T extends { tags?: string[] | null }>(
  articles: T[],
  selectedTag: string
): T[] {
  if (selectedTag === 'all') {
    return articles
  }
  return articles.filter((article) =>
    Boolean(article.tags && article.tags.includes(selectedTag))
  )
}

/**
 * 对文章进行排序
 * @param articles - 文章数组
 * @param sortOrder - 排序方式 ('desc' | 'asc')
 * @returns 排序后的文章数组
 */
export function sortArticles<T extends ArticleLike>(
  articles: T[],
  sortOrder: 'desc' | 'asc' = 'desc'
): T[] {
  return [...articles].sort((a, b) => {
    const dateA = new Date(a.createdAt)
    const dateB = new Date(b.createdAt)
    return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime()
  })
}

/**
 * 处理文章列表（筛选 + 排序）
 * @param articles - 原始文章数组
 * @param selectedTag - 选中的标签
 * @param sortOrder - 排序方式
 * @returns 处理后的文章数组
 */
export function processArticles<T extends ArticleLike>(
  articles: T[],
  selectedTag: string,
  sortOrder: 'desc' | 'asc'
): T[] {
  const filtered = filterArticlesByTag(articles, selectedTag)
  return sortArticles(filtered, sortOrder)
}
