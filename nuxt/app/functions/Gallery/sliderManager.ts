/**
 * 画廊 Slider 管理函数
 */

import { nextTick, type Ref } from 'vue'

type SliderLike = {
  initSlider?: () => Promise<void> | void
  destroySlider?: () => void
}

type LayoutLike = {
  initLayout?: () => Promise<void> | void
  destroyLayout?: () => void
}

type GalleryRefs = {
  fadeSlideshowRef?: Ref<SliderLike | null>
  accordionGalleryRef?: Ref<SliderLike | null>
  coverflowGalleryRef?: Ref<SliderLike | null>
  masonryWaterfallRef?: Ref<LayoutLike | null>
}

export async function initSliders(
  refs: GalleryRefs,
  activeTag: string,
  artworkCount: number,
  isInitialLoading: boolean
): Promise<void> {
  await nextTick()

  if (activeTag === 'artwork' && artworkCount > 0 && !isInitialLoading) {
    requestAnimationFrame(() => {
      setTimeout(async () => {
        if (refs.fadeSlideshowRef?.value?.initSlider) {
          await refs.fadeSlideshowRef.value.initSlider()
        }

        setTimeout(async () => {
          if (refs.accordionGalleryRef?.value?.initSlider) {
            await refs.accordionGalleryRef.value.initSlider()
          }
          if (refs.coverflowGalleryRef?.value?.initSlider) {
            await refs.coverflowGalleryRef.value.initSlider()
          }
          if (refs.masonryWaterfallRef?.value?.initLayout) {
            await refs.masonryWaterfallRef.value.initLayout()
          }
        }, 200)
      }, 150)
    })
  }
}

export function destroySliders(refs: GalleryRefs): void {
  refs.fadeSlideshowRef?.value?.destroySlider?.()
  refs.accordionGalleryRef?.value?.destroySlider?.()
  refs.coverflowGalleryRef?.value?.destroySlider?.()
  refs.masonryWaterfallRef?.value?.destroyLayout?.()
}

export function getGallerySlice<T>(allGalleries: T[], start: number, end: number): T[] {
  if (allGalleries.length === 0) return []

  const result: T[] = []
  for (let i = start; i < end; i++) {
    const index = i % allGalleries.length
    result.push(allGalleries[index])
  }
  return result
}
