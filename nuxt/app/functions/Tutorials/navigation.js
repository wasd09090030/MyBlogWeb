/**
 * 教程页面的导航和交互函数
 */

import { nextTick } from 'vue'

/**
 * 滚动到列表顶部
 * @param {Ref} containerRef - 容器元素的引用
 * @param {number} offset - 顶部偏移量（默认 100px）
 */
export function scrollToListTop(containerRef, offset = 100) {
  nextTick(() => {
    if (containerRef.value) {
      window.scrollTo({
        top: containerRef.value.offsetTop - offset,
        behavior: 'smooth'
      })
    }
  })
}

/**
 * 处理图片加载错误
 * @param {Event} event - 图片错误事件
 */
export function handleImageError(event) {
  event.target.style.display = 'none'
  event.target.parentElement?.classList.add('image-error-fallback')
}
