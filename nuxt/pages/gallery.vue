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
      <i class="bi bi-images display-1 text-muted mb-3"></i>
      <h3 class="text-muted">暂无图片</h3>
      <p class="text-muted">画廊中还没有任何图片</p>
    </div>

    <!-- 有内容时显示所有画廊 -->
    <Transition name="gallery-fade" @after-enter="onGalleryVisible">
      <div v-if="!isInitialLoading && !loading && !error && galleries.length > 0" class="gallery-content" :class="{ 'gallery-ready': isGalleryReady }">
      <!-- 淡入淡出幻灯片效果 - 在导航栏下方显示 -->
      <section class="fade-section">
        <div class="fade-gallery" ref="loopContainer">
          <div class="swiper-wrapper">
            <div
              v-for="(gallery, index) in getGallerySlice(0, 5)"
              :key="`loop-${gallery.id}`"
              class="swiper-slide fade-slide"
            >
              <div
                class="fade-item"
                @click="openFullscreen(gallery)"
              >
                <img
                  :src="gallery.imageUrl"
                  alt="画廊图片"
                  class="fade-image"
                />
                <div class="fade-overlay">
                  <div class="fade-content">
                    <!-- 移除标题和描述显示 -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 手风琴和3D覆盖流展示 -->
      <div class="gallery-sections">
        <!-- 第一部分：手风琴横向展示 -->
        <section class="gallery-section">
          <div class="accordion-container">
            <div class="accordion-gallery" ref="accordionContainer">
              <div class="swiper-wrapper">
                <div
                  v-for="(gallery, index) in getGallerySlice(5, 10)"
                  :key="`accordion-${gallery.id}`"
                  class="swiper-slide accordion-slide"
                  :class="{ 'accordion-expanded': index === expandedAccordionIndex }"
                >
                  <div
                    class="accordion-item"
                    @click="toggleAccordion(index)"
                    @dblclick="openFullscreen(gallery)"
                  >
                    <img
                      :src="gallery.imageUrl"
                      alt="画廊图片"
                      class="accordion-image"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 第二部分：3D 覆盖流效果 -->
        <section class="coverflow-section mb-5">
          <div class="coverflow-gallery" ref="coverflowContainer">
            <div class="swiper-wrapper">
              <div
                v-for="(gallery, index) in getGallerySlice(10, 15)"
                :key="`coverflow-${gallery.id}`"
                class="swiper-slide coverflow-slide"
              >
                <div
                  class="coverflow-item"
                  @click="openFullscreen(gallery)"
                >
                  <img
                    :src="gallery.imageUrl"
                    alt="画廊图片"
                    class="coverflow-image"
                  />
                  <div class="coverflow-info">
                    <!-- 移除标题显示 -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
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
              <i class="bi bi-zoom-in"></i>
            </button>
            <button class="control-btn" @click.stop="zoomOut" title="缩小">
              <i class="bi bi-zoom-out"></i>
            </button>
            <button class="control-btn" @click.stop="resetZoom" title="重置">
              <i class="bi bi-arrows-angle-contract"></i>
            </button>
            <button class="control-btn close-btn" @click="closeFullscreen" title="关闭">
              <i class="bi bi-x-lg"></i>
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
import { useGallery } from '~/composables/useGallery'
import GalleryLoadingAnimation from '~/components/GalleryLoadingAnimation.vue'

// 设置页面元数据
useHead({
  title: 'WyrmKk - 图片画廊',
  meta: [
    {
      name: 'description',
      content: '使用 SwiperJS 构建的浏览精美的图片画廊'
    }
  ]
})

// 动态导入Swiper以避免SSR问题
let Swiper, Navigation, Pagination, Autoplay, EffectCoverflow, EffectFade

// 导入Swiper CSS
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-coverflow'
import 'swiper/css/effect-fade'

// 响应式数据
const galleries = ref([])
const loading = ref(true)
const error = ref(null)
const showFullscreen = ref(false)
const selectedImage = ref(null)
const expandedAccordionIndex = ref(0) // 默认第一个展开

// 初始加载状态
const isInitialLoading = ref(true)
const loadingProgress = ref(0)
const previewImages = ref([])
const loadedImagesCount = ref(0)
const totalImagesToLoad = ref(0)
const isGalleryReady = ref(false)

// Swiper 实例
const accordionSwiper = ref(null)
const coverflowSwiper = ref(null)
const loopSwiper = ref(null)

// DOM 引用
const accordionContainer = ref(null)
const coverflowContainer = ref(null)
const loopContainer = ref(null)
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

// 动态加载Swiper
const loadSwiper = async () => {
  try {
    const swiperModule = await import('swiper')
    const modulesModule = await import('swiper/modules')

    Swiper = swiperModule.Swiper
    Navigation = modulesModule.Navigation
    Pagination = modulesModule.Pagination
    Autoplay = modulesModule.Autoplay
    EffectCoverflow = modulesModule.EffectCoverflow
    EffectFade = modulesModule.EffectFade

    console.log('Swiper modules loaded successfully')
  } catch (err) {
    console.error('Failed to load Swiper:', err)
  }
}

// 手风琴展开控制 - 改为点击切换
const toggleAccordion = (index) => {
  // 如果点击的是当前展开的项，则收起（回到默认第一个）
  if (expandedAccordionIndex.value === index) {
    expandedAccordionIndex.value = 0
  } else {
    // 否则展开点击的项
    expandedAccordionIndex.value = index
  }
}

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

  // 设置总数
  totalImagesToLoad.value = galleries.value.length
  loadedImagesCount.value = 0
  loadingProgress.value = 0

  // 选择前几张作为预览
  previewImages.value = galleries.value.slice(0, 3)

  try {
    // 并发加载所有图片，但限制并发数量
    const concurrencyLimit = 5
    const chunks = []

    for (let i = 0; i < galleries.value.length; i += concurrencyLimit) {
      chunks.push(galleries.value.slice(i, i + concurrencyLimit))
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
    
    // 延迟初始化 Swiper，等待画廊内容完全渲染
    setTimeout(() => {
      initSwipers()
    }, 100)

  } catch (error) {
    console.error('预加载图片失败:', error)
    // 即使失败也要显示画廊
    isInitialLoading.value = false
    await nextTick()
    setTimeout(() => {
      initSwipers()
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

// 初始化手风琴效果
const initAccordionSwiper = () => {
  if (!accordionContainer.value || !Swiper) return

  accordionSwiper.value = new Swiper(accordionContainer.value, {
    modules: [Navigation, Pagination],
    slidesPerView: 5,
    spaceBetween: 0,
    loop: false,
    grabCursor: true,
    breakpoints: {
      320: { slidesPerView: 2 },
      768: { slidesPerView: 3 },
      1024: { slidesPerView: 4 },
      1200: { slidesPerView: 5 }
    }
  })
}

// 初始化3D覆盖流效果
const initCoverflowSwiper = () => {
  if (!coverflowContainer.value || !Swiper) return

  coverflowSwiper.value = new Swiper(coverflowContainer.value, {
    modules: [EffectCoverflow],
    effect: 'coverflow',
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 3,
    loop: true,
    speed: 600,
    coverflowEffect: {
      rotate: 30,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: true,
    },
    breakpoints: {
      320: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 2,
      },
      1024: {
        slidesPerView: 3,
      }
    }
  })
}

// 初始化淡入淡出幻灯片效果
const initLoopSwiper = () => {
  if (!loopContainer.value || !Swiper) return

  loopSwiper.value = new Swiper(loopContainer.value, {
    modules: [Autoplay, EffectFade],
    effect: 'fade',
    fadeEffect: {
      crossFade: true
    },
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    speed: 800, // 过渡速度
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
      waitForTransition: true, // 等待过渡完成
    },
    allowTouchMove: true,
    watchSlidesProgress: true,
    observer: true,
    observeParents: true,
    on: {
      init: function() {
        // Swiper 初始化完成后的回调
        this.el.classList.add('swiper-initialized')
      }
    }
  })
}

// 初始化所有Swiper
const initSwipers = async () => {
  await loadSwiper()
  await nextTick()

  if (galleries.value.length > 0 && !isInitialLoading.value) {
    // 使用 requestAnimationFrame 确保 DOM 完全渲染
    requestAnimationFrame(() => {
      setTimeout(() => {
        // 按顺序初始化，先初始化主要的幻灯片
        initLoopSwiper()
        
        // 稍后初始化其他 Swiper
        setTimeout(() => {
          initAccordionSwiper()
          initCoverflowSwiper()
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

// 销毁Swiper实例
const destroySwipers = () => {
  if (accordionSwiper.value) {
    accordionSwiper.value.destroy(true, true)
    accordionSwiper.value = null
  }
  if (coverflowSwiper.value) {
    coverflowSwiper.value.destroy(true, true)
    coverflowSwiper.value = null
  }
  if (loopSwiper.value) {
    loopSwiper.value.destroy(true, true)
    loopSwiper.value = null
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
  destroySwipers()
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
