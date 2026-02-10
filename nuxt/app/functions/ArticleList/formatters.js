/**
 * 文章列表页面的格式化函数
 */

/**
 * 格式化日期
 * @param {string} dateString - ISO 日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(dateString) {
  if (!dateString) return '未知日期'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * 获取分类名称
 * @param {string} category - 分类标识
 * @returns {string} 分类显示名称
 */
export function getCategoryName(category) {
  if (!category) return '其他'
  const lowerCategory = category.toLowerCase()
  const categoryMap = {
    'study': '学习笔记',
    'game': '游戏评测',
    'work': '个人作品',
    'resource': '资源分享'
  }
  return categoryMap[lowerCategory] || '其他/杂谈'
}

/**
 * 获取分类样式类名
 * @param {string} category - 分类标识
 * @returns {string} CSS 类名
 */
export function getCategoryClass(category) {
  if (!category) return 'category-other'
  const lowerCategory = category.toLowerCase()
  const categoryClassMap = {
    'study': 'category-study',
    'game': 'category-game',
    'work': 'category-work',
    'resource': 'category-resource'
  }
  return categoryClassMap[lowerCategory] || 'category-other'
}
