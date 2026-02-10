/**
 * 教程页面的格式化函数
 */

/**
 * 格式化日期为简短格式
 * @param {string} dateString - ISO 日期字符串
 * @returns {string} 格式化后的日期字符串 (YYYY-MM-DD)
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * 获取文章路径
 * @param {Object} article - 文章对象
 * @returns {string} 文章详情页路径
 */
export function getArticlePath(article) {
  if (!article?.id || article.id === 'null' || article.id === 'undefined') {
    return '/'
  }
  return article.slug ? `/article/${article.id}-${article.slug}` : `/article/${article.id}`
}
