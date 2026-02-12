/**
 * 教程页面的格式化函数
 */

/**
 * 格式化日期为简短格式
 * @param dateString - ISO 日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

type ArticlePathInput = {
  id?: string | number | null
  slug?: string | null
}

/**
 * 获取文章路径
 * @param article - 文章对象
 * @returns 文章详情页路径
 */
export function getArticlePath(article?: ArticlePathInput | null): string {
  if (!article?.id || article.id === 'null' || article.id === 'undefined') {
    return '/'
  }
  return article.slug ? `/article/${article.id}-${article.slug}` : `/article/${article.id}`
}
