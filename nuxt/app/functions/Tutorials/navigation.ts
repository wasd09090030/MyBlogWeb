/**
 * 教程页面的导航和交互函数
 */

import { nextTick, type Ref } from 'vue'

/**
 * 滚动到列表顶部
 * @param containerRef - 容器元素的引用
 * @param offset - 顶部偏移量（默认 100px）
 */
export function scrollToListTop(containerRef: Ref<HTMLElement | null>, offset = 100): void {
  nextTick(() => {
    const element = containerRef.value
    if (!element) return

    // 仅在客户端可用
    if (typeof window === 'undefined') return

    window.scrollTo({
      top: element.offsetTop - offset,
      behavior: 'smooth'
    })
  })
}

/**
 * 处理图片加载错误
 */
export function handleImageError(event: Event): void {
  const target = event.target as HTMLImageElement | null
  if (!target) return

  target.style.display = 'none'
  target.parentElement?.classList.add('image-error-fallback')
}
