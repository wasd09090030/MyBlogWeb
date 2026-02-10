/**
 * 画廊 Slider 管理函数
 */

import { nextTick } from 'vue'

/**
 * 初始化所有画廊子组件的 Slider
 * @param {Object} refs - 包含所有子组件引用的对象
 * @param {string} activeTag - 当前激活的标签
 * @param {number} artworkCount - artwork 类型的图片数量
 * @param {boolean} isInitialLoading - 是否正在初始加载
 */
export async function initSliders(refs, activeTag, artworkCount, isInitialLoading) {
  await nextTick()

  if (activeTag === 'artwork' && artworkCount > 0 && !isInitialLoading) {
    requestAnimationFrame(() => {
      setTimeout(async () => {
        // 先初始化主要的幻灯片
        if (refs.fadeSlideshowRef?.value) {
          await refs.fadeSlideshowRef.value.initSlider()
        }
        
        // 稍后初始化其他 Slider
        setTimeout(async () => {
          if (refs.accordionGalleryRef?.value) {
            await refs.accordionGalleryRef.value.initSlider()
          }
          if (refs.coverflowGalleryRef?.value) {
            await refs.coverflowGalleryRef.value.initSlider()
          }
          if (refs.masonryWaterfallRef?.value) {
            await refs.masonryWaterfallRef.value.initLayout()
          }
        }, 200)
      }, 150)
    })
  }
}

/**
 * 销毁所有子组件的 Slider 实例
 * @param {Object} refs - 包含所有子组件引用的对象
 */
export function destroySliders(refs) {
  if (refs.fadeSlideshowRef?.value) {
    refs.fadeSlideshowRef.value.destroySlider()
  }
  if (refs.accordionGalleryRef?.value) {
    refs.accordionGalleryRef.value.destroySlider()
  }
  if (refs.coverflowGalleryRef?.value) {
    refs.coverflowGalleryRef.value.destroySlider()
  }
  if (refs.masonryWaterfallRef?.value) {
    refs.masonryWaterfallRef.value.destroyLayout()
  }
}

/**
 * 获取指定范围的图片切片
 * @param {Array} allGalleries - 所有画廊图片
 * @param {number} start - 起始索引
 * @param {number} end - 结束索引
 * @returns {Array} 图片切片数组
 */
export function getGallerySlice(allGalleries, start, end) {
  if (allGalleries.length === 0) return []

  const result = []
  for (let i = start; i < end; i++) {
    const index = i % allGalleries.length
    result.push(allGalleries[index])
  }
  return result
}
