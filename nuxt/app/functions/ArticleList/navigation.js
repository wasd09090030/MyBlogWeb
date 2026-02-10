/**
 * 导航和滚动相关函数
 */

import { nextTick } from 'vue'

/**
 * 滚动到列表顶部
 * @param {Ref} containerRef - 文章列表容器的引用
 */
export function scrollToListTop(containerRef) {
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

/**
 * 更新页面状态（页码切换）
 * @param {number} targetPage - 目标页码
 * @param {Ref} totalRef - 总页数的响应式引用
 * @param {Ref} pageRef - 当前页码的响应式引用
 * @param {Ref} containerRef - 容器引用（可选，用于滚动）
 */
export function updatePageState(targetPage, totalRef, pageRef, containerRef = null) {
  if (targetPage >= 1 && targetPage <= totalRef.value) {
    pageRef.value = targetPage
    if (containerRef) {
      scrollToListTop(containerRef)
    }
  }
}

/**
 * 触发视图切换动画
 * @param {Ref} isSwitchingRef - 切换状态的响应式引用
 * @param {Object} timerRef - 定时器引用对象
 * @param {number} duration - 动画持续时间（毫秒）
 */
export function triggerViewSwitchAnimation(isSwitchingRef, timerRef, duration = 480) {
  isSwitchingRef.value = true
  if (timerRef.timer) {
    clearTimeout(timerRef.timer)
  }
  timerRef.timer = setTimeout(() => {
    isSwitchingRef.value = false
    timerRef.timer = null
  }, duration)
}
