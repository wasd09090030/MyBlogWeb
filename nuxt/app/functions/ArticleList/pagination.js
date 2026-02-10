/**
 * 分页逻辑函数
 */

/**
 * 构建页码数组
 * @param {number} total - 总页数
 * @param {number} current - 当前页码
 * @returns {Array<number|string>} 页码数组，包含数字和 '...' 占位符
 */
export function buildPageNumbers(total, current) {
  const pages = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
    return pages
  }

  pages.push(1)
  if (current > 4) {
    pages.push('...')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 3) {
    pages.push('...')
  }

  pages.push(total)
  return pages
}

/**
 * 从 URL 查询参数同步页码
 * @param {string|number} pageParam - URL 中的页码参数
 * @param {boolean} isFilteredMode - 是否为筛选模式
 * @param {Object} refs - 包含页码和总页数的响应式引用对象
 */
export function syncPageFromQuery(pageParam, isFilteredMode, refs) {
  const pageNum = parseInt(pageParam)
  if (isNaN(pageNum) || pageNum <= 0) {
    return
  }

  if (isFilteredMode) {
    if (pageNum <= refs.totalFilteredPages.value) {
      refs.currentFilteredPage.value = pageNum
    }
  } else if (pageNum <= refs.totalPages.value) {
    refs.currentPage.value = pageNum
  }
}
