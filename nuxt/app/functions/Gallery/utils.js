/**
 * 画廊工具函数
 */

/**
 * 标准化标签名称
 * @param {string} tag - 原始标签
 * @returns {string} 标准化后的标签
 */
export function normalizeTag(tag) {
  if (!tag) return 'artwork'
  return String(tag).trim().toLowerCase()
}

/**
 * 管理 body 滚动状态
 */
export const bodyScrollManager = {
  /**
   * 禁用 body 滚动
   */
  disable() {
    if (!import.meta.client) return
    
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    
    if (!window.__galleryOriginalOverflow) {
      window.__galleryOriginalOverflow = originalOverflow || ''
    }
  },

  /**
   * 恢复 body 滚动
   */
  restore() {
    if (!import.meta.client) return
    
    document.body.style.overflow = window.__galleryOriginalOverflow || ''
    if (!window.__galleryOriginalOverflow) {
      document.body.style.removeProperty('overflow')
    }
    delete window.__galleryOriginalOverflow
  }
}
