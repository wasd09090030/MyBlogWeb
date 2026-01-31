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
            <button class="gallery-option is-active" type="button" role="tab" aria-selected="true">
              Awesome artwork
            </button>
            <button class="gallery-option" type="button" role="tab" aria-selected="false">
              game screenshot
            </button>
          </div>

          <!-- 淡入淡出幻灯片效果 -->
          <FadeSlideshow
            ref="fadeSlideshowRef"
            :images="getGallerySlice(0, 5)"
            @image-click="openFullscreen"
          />
        </div>

        <!-- 手风琴和3D覆盖流展示 -->
        <div class="gallery-sections">
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
          ref="masonryWaterfallRef"
          :images="getGallerySlice(0, galleries.length)"
          :column-count="4"
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
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const lastPosition = ref({ x: 0, y: 0 })

// 计算图片变换样式
const imageTransformStyle = computed(() => ({
  transform: `translate(${imagePosition.value.x}px, ${imagePosition.value.y}px) scale(${imageScale.value})`,
  cursor: imageScale.value > 1 ? (isDragging.value ? 'grabbing' : 'grab') : 'default'
}))

// API composable
const { getGalleries } = useGallery()

// 预加载图片
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      loadedImagesCount.value++
      loadingProgress.value = (loadedImagesCount.value / totalImagesToLoad.value) * 100
      resolve(img)
    }
    img.onerror = reject
    img.src = src
  })
}

// 预加载所有图片
const preloadAllImages = async () => {
  if (galleries.value.length === 0) return

  // 只预加载前15张图片（用于 FadeSlideshow, AccordionGallery, CoverflowGallery）
  // 瀑布流的图片使用浏览器原生懒加载
  const imagesToPreload = galleries.value.slice(0, 15)
  
  // 设置总数（只计算需要预加载的图片）
  totalImagesToLoad.value = imagesToPreload.length
  loadedImagesCount.value = 0
  loadingProgress.value = 0

  // 选择前几张作为预览
  previewImages.value = galleries.value.slice(0, 3)

  try {
    // 并发加载图片，但限制并发数量
    const concurrencyLimit = 5
    const chunks = []

    for (let i = 0; i < imagesToPreload.length; i += concurrencyLimit) {
      chunks.push(imagesToPreload.slice(i, i + concurrencyLimit))
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(gallery => preloadImage(gallery.imageUrl))
      )
    }

    // 确保至少显示2秒的加载动画
    const minLoadingTime = 2000
    const elapsedTime = Date.now() - startTime
    if (elapsedTime < minLoadingTime) {
      await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime))
    }

    // 等待进度条到达100%的视觉效果
    loadingProgress.value = 100
    await new Promise(resolve => setTimeout(resolve, 300))

    // 加载完成，先标记加载完成，让 Transition 处理过渡
    isInitialLoading.value = false
    
    // 等待 Vue 更新 DOM 和过渡动画开始
    await nextTick()
    
    // 延迟初始化 Slider，等待画廊内容完全渲染
    setTimeout(() => {
      initSliders()
    }, 100)

  } catch (error) {
    console.error('预加载图片失败:', error)
    // 即使失败也要显示画廊
    isInitialLoading.value = false
    await nextTick()
    setTimeout(() => {
      initSliders()
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
      await preloadAllImages()
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

// 获取指定范围的图片
const getGallerySlice = (start, end) => {
  const allGalleries = galleries.value
  if (allGalleries.length === 0) return []

  // 如果图片不够，重复使用现有图片
  const result = []
  for (let i = start; i < end; i++) {
    const index = i % allGalleries.length
    result.push(allGalleries[index])
  }
  return result
}

// 初始化所有子组件的 Slider
const initSliders = async () => {
  await nextTick()

  if (galleries.value.length > 0 && !isInitialLoading.value) {
    // 使用 requestAnimationFrame 确保 DOM 完全渲染
    requestAnimationFrame(() => {
      setTimeout(async () => {
        // 按顺序初始化，先初始化主要的幻灯片
        if (fadeSlideshowRef.value) {
          await fadeSlideshowRef.value.initSlider()
        }
        
        // 稍后初始化其他 Slider
        setTimeout(async () => {
          if (accordionGalleryRef.value) {
            await accordionGalleryRef.value.initSlider()
          }
          if (coverflowGalleryRef.value) {
            await coverflowGalleryRef.value.initSlider()
          }
          // 初始化瀑布流
          if (masonryWaterfallRef.value) {
            await masonryWaterfallRef.value.initLayout()
          }
        }, 200)
      }, 150)
    })
  }
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
const zoomIn = () => {
  if (imageScale.value < 3) {
    imageScale.value = Math.min(3, imageScale.value + 0.25)
  }
}

const zoomOut = () => {
  if (imageScale.value > 0.5) {
    imageScale.value = Math.max(0.5, imageScale.value - 0.25)
    // 缩小时逐渐回到中心
    if (imageScale.value <= 1) {
      imagePosition.value = { x: 0, y: 0 }
    }
  }
}

const resetZoom = () => {
  imageScale.value = 1
  imagePosition.value = { x: 0, y: 0 }
}

// 滚轮缩放
const handleWheel = (e) => {
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(0.5, Math.min(3, imageScale.value + delta))
  imageScale.value = newScale
  
  if (newScale <= 1) {
    imagePosition.value = { x: 0, y: 0 }
  }
}

// 拖拽相关方法
const startDrag = (e) => {
  if (imageScale.value <= 1) return
  
  isDragging.value = true
  const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
  const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
  
  dragStart.value = { x: clientX, y: clientY }
  lastPosition.value = { ...imagePosition.value }
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return
  
  const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
  const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
  
  const deltaX = clientX - dragStart.value.x
  const deltaY = clientY - dragStart.value.y
  
  imagePosition.value = {
    x: lastPosition.value.x + deltaX,
    y: lastPosition.value.y + deltaY
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

// 返回文章区域
const goBack = () => {
  // 在路由跳转前恢复 body 滚动
  document.body.style.overflow = ''
  document.body.style.removeProperty('overflow')
  navigateTo('/')
}

// 销毁所有子组件的 Slider 实例
const destroySliders = () => {
  if (fadeSlideshowRef.value) {
    fadeSlideshowRef.value.destroySlider()
  }
  if (accordionGalleryRef.value) {
    accordionGalleryRef.value.destroySlider()
  }
  if (coverflowGalleryRef.value) {
    coverflowGalleryRef.value.destroySlider()
  }
  if (masonryWaterfallRef.value) {
    masonryWaterfallRef.value.destroyLayout()
  }
}

// 生命周期钩子
onMounted(async () => {
  // 保存原始的 overflow 值
  const originalOverflow = document.body.style.overflow
  // 隐藏body滚动条，因为画廊组件自己处理滚动
  document.body.style.overflow = 'hidden'

  // 保存原始值到组件实例，以便恢复
  if (!window.__galleryOriginalOverflow) {
    window.__galleryOriginalOverflow = originalOverflow || ''
  }

  await fetchGalleries()
})

onUnmounted(() => {
  destroySliders()
  // 恢复body滚动条 - 使用多种方式确保恢复
  document.body.style.overflow = window.__galleryOriginalOverflow || ''
  if (!window.__galleryOriginalOverflow) {
    document.body.style.removeProperty('overflow')
  }
  // 清理标记
  delete window.__galleryOriginalOverflow
})
</script>

<style scoped>
@import '~/assets/css/components/Gallery.styles.css';
</style>
