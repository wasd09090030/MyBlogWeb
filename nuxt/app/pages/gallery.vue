<template>
  <div class="gallery-fullscreen">
    <!-- 进入画廊前的加载动画 -->
    <Transition name="loading-fade" mode="out-in">
      <GalleryLoadingAnimation
        v-if="isInitialLoading"
        :loading-progress="loadingProgress"
        :preview-images="previewImages"
      />
    </Transition>

    <!-- 原有的加载状态 -->
    <div v-if="!isInitialLoading && loading" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-if="!isInitialLoading && !loading && error" class="error-overlay">
      <div class="alert alert-danger text-center" role="alert">
        {{ error }}
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!isInitialLoading && !loading && !error && galleries.length === 0" class="empty-state">
      <Icon name="images" size="3xl" class="text-muted mb-3" />
      <h3 class="text-muted">暂无图片</h3>
      <p class="text-muted">画廊中还没有任何图片</p>
    </div>

    <!-- 有内容时显示所有画廊 -->
    <Transition name="gallery-fade" @after-enter="onGalleryVisible">
      <div v-if="!isInitialLoading && !loading && !error && galleries.length > 0" class="gallery-content" :class="{ 'gallery-ready': isGalleryReady }">

        <div class="gallery-top">
          <div class="gallery-options" role="tablist" aria-label="Gallery categories">
            <button
              class="gallery-option"
              :class="{ 'is-active': activeTag === 'artwork' }"
              type="button"
              role="tab"
              :aria-selected="activeTag === 'artwork'"
              @click="setActiveTag('artwork')"
            >
              Awesome artwork
            </button>
            <button
              class="gallery-option"
              :class="{ 'is-active': activeTag === 'game' }"
              type="button"
              role="tab"
              :aria-selected="activeTag === 'game'"
              @click="setActiveTag('game')"
            >
              game screenshot
            </button>
          </div>

          <!-- 淡入淡出幻灯片效果 -->
          <FadeSlideshow
            v-if="activeTag === 'artwork' && artworkGalleries.length > 0"
            ref="fadeSlideshowRef"
            :images="getGallerySlice(0, 5)"
            @image-click="openFullscreen"
          />
        </div>

        <!-- 手风琴和3D覆盖流展示 -->
        <div v-if="activeTag === 'artwork' && artworkGalleries.length > 0" class="gallery-sections">
          <!-- 手风琴横向展示 -->
          <AccordionGallery
            ref="accordionGalleryRef"
            :images="getGallerySlice(5, 10)"
            @image-click="openFullscreen"
          />

          <!-- 3D 覆盖流效果 -->
          <CoverflowGallery
            ref="coverflowGalleryRef"
            :images="getGallerySlice(10, 15)"
            @image-click="openFullscreen"
          />
        </div>

        <!-- 瀑布流画廊 -->
        <MasonryWaterfall
          v-if="activeTag === 'artwork' && artworkGalleries.length > 0"
          ref="masonryWaterfallRef"
          :images="getGallerySlice(0, artworkGalleries.length)"
          :column-count="4"
          @image-click="openFullscreen"
        />

        <GameGallerySection
          v-if="activeTag === 'game'"
          :images="gameGalleries"
          @image-click="openFullscreen"
        />
      </div>
    </Transition>

    <!-- 全屏查看模态框 (使用自定义实现) -->
    <Teleport to="body">
      <Transition name="fullscreen-fade">
        <div v-if="showFullscreen" class="fullscreen-modal" @click="closeFullscreen">
          <div class="fullscreen-backdrop"></div>
          
          <!-- 控制按钮组 -->
          <div class="fullscreen-controls">
            <button class="control-btn" @click.stop="zoomIn" title="放大">
              <Icon name="zoom-in" size="lg" />
            </button>
            <button class="control-btn" @click.stop="zoomOut" title="缩小">
              <Icon name="zoom-out" size="lg" />
            </button>
            <button class="control-btn" @click.stop="resetZoom" title="重置">
              <Icon name="arrows-angle-contract" size="lg" />
            </button>
            <button class="control-btn close-btn" @click="closeFullscreen" title="关闭">
              <Icon name="x-lg" size="lg" />
            </button>
          </div>
          
          <!-- 图片容器 -->
          <div 
            class="fullscreen-content" 
            @click.stop
            @wheel.prevent="handleWheel"
            ref="fullscreenContent"
          >
            <Transition name="image-zoom">
              <div 
                v-if="selectedImage"
                class="image-wrapper"
                :style="imageTransformStyle"
                @mousedown="startDrag"
                @touchstart="startDrag"
              >
                <img
                  :src="selectedImage?.imageUrl"
                  alt="画廊图片"
                  class="fullscreen-image"
                  :class="{ 'is-dragging': isDragging }"
                  @load="onImageLoad"
                />
              </div>
            </Transition>
          </div>
          
          <!-- 缩放提示 -->
          <div class="zoom-indicator" v-if="imageScale !== 1">
            {{ Math.round(imageScale * 100) }}%
          </div>
          
          <!-- 操作提示 -->
          <div class="fullscreen-hint">
            <span>滚轮缩放 · 拖拽移动 · 点击背景关闭</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import FadeSlideshow from '../components/gallery/FadeSlideshow.vue'
import AccordionGallery from '../components/gallery/AccordionGallery.vue'
import CoverflowGallery from '../components/gallery/CoverflowGallery.vue'
import MasonryWaterfall from '../components/gallery/MasonryWaterfall.vue'
import GameGallerySection from '../components/gallery/GameGallerySection.vue'
import { preloadAllImages, preloadAllImagesWithWorker, ensureMinLoadingTime } from '~/functions/Gallery/imageLoader'
import { zoomIn as zoomInFn, zoomOut as zoomOutFn, resetZoom as resetZoomFn, handleWheel as handleWheelFn, createDragHandler } from '~/functions/Gallery/zoomAndDrag'
import { initSliders, destroySliders, getGallerySlice as getSlice } from '~/functions/Gallery/sliderManager'
import { normalizeTag, bodyScrollManager } from '~/functions/Gallery/utils'

// 设置页面元数据
useHead({
  title: 'WyrmKk - 图片画廊',
  meta: [
    {
      name: 'description',
      content: '高性能、支持 SSR 的图片画廊'
    }
  ]
})

// 响应式数据
const galleries = ref([])
const loading = ref(true)
const error = ref(null)
const showFullscreen = ref(false)
const selectedImage = ref(null)
const activeTag = ref('artwork')

// 初始加载状态
const isInitialLoading = ref(true)
const loadingProgress = ref(0)
const previewImages = ref([])
const loadedImagesCount = ref(0)
const totalImagesToLoad = ref(0)
const isGalleryReady = ref(false)

// 组件引用
const fadeSlideshowRef = ref(null)
const accordionGalleryRef = ref(null)
const coverflowGalleryRef = ref(null)
const masonryWaterfallRef = ref(null)
const fullscreenContent = ref(null)

// 全屏查看相关状态
const imageScale = ref(1)
const imagePosition = ref({ x: 0, y: 0 })

// 使用拖拽处理器
const dragHandler = createDragHandler()
const { isDragging } = dragHandler

// 计算图片变换样式
const imageTransformStyle = computed(() => ({
  transform: `translate(${imagePosition.value.x}px, ${imagePosition.value.y}px) scale(${imageScale.value})`,
  cursor: imageScale.value > 1 ? (isDragging.value ? 'grabbing' : 'grab') : 'default'
}))

// API composable
const { getGalleries } = useGallery()

const artworkGalleries = computed(() => galleries.value.filter(gallery => normalizeTag(gallery.tag) === 'artwork'))
const gameGalleries = computed(() => galleries.value.filter(gallery => normalizeTag(gallery.tag) === 'game'))

const setActiveTag = (tag) => {
  if (activeTag.value === tag) return
  activeTag.value = tag
}

// 预加载所有图片（优先使用 Web Worker）
const preloadAllImagesHandler = async () => {
  if (galleries.value.length === 0) return

  const loadingState = {
    loadedImagesCount,
    totalImagesToLoad
  }

  try {
    // 🔥 优先使用 Worker 并行预加载（在独立线程中 fetch + decode）
    await preloadAllImagesWithWorker(
      galleries.value,
      loadingState,
      loadingProgress,
      previewImages,
      15, // 预加载数量
      5   // 并发限制
    )

    // 最小展示时间从 2000ms 降低到 800ms，Worker 模式加载更快
    await ensureMinLoadingTime(startTime, 800)

    isInitialLoading.value = false
    await nextTick()
    setTimeout(() => {
      initGallerySliders()
    }, 100)
  } catch (error) {
    console.error('预加载图片失败:', error)
    isInitialLoading.value = false
    await nextTick()
    setTimeout(() => {
      initGallerySliders()
    }, 100)
  }
}

let startTime = Date.now()

// 获取画廊数据
const fetchGalleries = async () => {
  try {
    startTime = Date.now()
    loading.value = true
    error.value = null
    const data = await getGalleries()
    galleries.value = data || []
    console.log('Gallery data loaded:', galleries.value)

    if (galleries.value.length > 0) {
      loading.value = false
      await preloadAllImagesHandler()
    } else {
      loading.value = false
      isInitialLoading.value = false
    }
  } catch (err) {
    console.error('获取画廊数据失败:', err)
    error.value = '获取画廊数据失败，请稍后重试'
    loading.value = false
    isInitialLoading.value = false
  }
}

// 获取指定范围的图片（包装函数）
const getGallerySlice = (start, end) => {
  return getSlice(artworkGalleries.value, start, end)
}

// 初始化所有子组件的 Slider
const initGallerySliders = async () => {
  const refs = {
    fadeSlideshowRef,
    accordionGalleryRef,
    coverflowGalleryRef,
    masonryWaterfallRef
  }
  await initSliders(refs, activeTag.value, artworkGalleries.value.length, isInitialLoading.value)
}

// 打开全屏查看
const openFullscreen = (gallery) => {
  selectedImage.value = gallery
  showFullscreen.value = true
  // 重置缩放和位置
  resetZoom()
}

// 关闭全屏查看
const closeFullscreen = () => {
  showFullscreen.value = false
  selectedImage.value = null
  resetZoom()
}

// 图片加载完成
const onImageLoad = () => {
  // 可以在这里添加加载完成后的动画
}

// 画廊内容显示完成后的回调
const onGalleryVisible = () => {
  // 等待 DOM 完全渲染后再标记为准备就绪
  setTimeout(() => {
    isGalleryReady.value = true
  }, 100)
}

// 缩放相关方法
const zoomIn = () => zoomInFn(imageScale)
const zoomOut = () => zoomOutFn(imageScale, imagePosition)
const resetZoom = () => resetZoomFn(imageScale, imagePosition)
const handleWheel = (e) => handleWheelFn(e, imageScale, imagePosition)

// 拖拽相关方法
const startDrag = (e) => dragHandler.startDrag(e, imageScale, imagePosition)

// 返回文章区域
const goBack = () => {
  bodyScrollManager.restore()
  navigateTo('/')
}

// 销毁所有子组件的 Slider 实例
const destroyGallerySliders = () => {
  const refs = {
    fadeSlideshowRef,
    accordionGalleryRef,
    coverflowGalleryRef,
    masonryWaterfallRef
  }
  destroySliders(refs)
}

watch(activeTag, async (tag) => {
  if (isInitialLoading.value || galleries.value.length === 0) return
  if (tag === 'artwork') {
    await nextTick()
    initGallerySliders()
    return
  }
  destroyGallerySliders()
})

// 生命周期钩子
onMounted(async () => {
  bodyScrollManager.disable()
  await fetchGalleries()
})

onUnmounted(() => {
  destroyGallerySliders()
  bodyScrollManager.restore()
})
</script>

<style scoped>
@import '~/assets/css/components/Gallery.styles.css';
</style>
