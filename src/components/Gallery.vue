<template>
  <div class="gallery-fullscreen">
    <!-- 进入画廊前的加载动画 -->
    <GalleryLoadingAnimation 
      v-if="isInitialLoading" 
      :loading-progress="loadingProgress"
      :preview-images="previewImages"
    />

    <!-- 原有的加载状态 -->
    <div v-else-if="loading" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-overlay">
      <div class="alert alert-danger text-center" role="alert">
        {{ error }}
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="galleries.length === 0" class="empty-state">
      <i class="bi bi-images display-1 text-muted mb-3"></i>
      <h3 class="text-muted">暂无图片</h3>
      <p class="text-muted">画廊中还没有任何图片</p>
    </div>

    <!-- 有内容时显示所有画廊 -->
    <div v-else-if="!isInitialLoading" class="gallery-content">
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
                    @click="openFullscreen(gallery)"
                    @mouseenter="expandAccordion(index)"
                    @mouseleave="resetAccordion"
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



    <!-- 全屏查看模态框 (使用自定义实现) -->
    <div v-if="showFullscreen" class="fullscreen-modal" @click="closeFullscreen">
      <div class="fullscreen-container">
        <button class="fullscreen-close" @click="closeFullscreen">
          <i class="bi bi-x-lg"></i>
        </button>
        <div class="fullscreen-content" @click.stop>
          <img 
            :src="selectedImage?.imageUrl" 
            alt="画廊图片"
            class="fullscreen-image"
          />
          <div class="fullscreen-info">
            <!-- 移除标题和描述显示 -->
          </div>
        </div>
      </div>
    </div>

    <!-- 返回按钮 - 固定在右下角 -->
    <button 
      @click="goBack" 
      class="return-button"
      title="返回文章区域"
    >
      <i class="bi bi-arrow-left"></i>
    </button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { galleryService } from '../services/articleService.js'
import GalleryLoadingAnimation from './GalleryLoadingAnimation.vue'

// 动态导入Swiper以避免SSR问题
let Swiper, Navigation, Pagination, Autoplay, EffectCoverflow, EffectFade

// 导入Swiper CSS
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import 'swiper/css/effect-fade';

export default {
  name: 'Gallery',
  components: {
    GalleryLoadingAnimation
  },
  setup() {
    const router = useRouter()
    
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
    
    // Swiper 实例
    const accordionSwiper = ref(null)
    const coverflowSwiper = ref(null)
    const loopSwiper = ref(null)
    
    // DOM 引用
    const accordionContainer = ref(null)
    const coverflowContainer = ref(null)
    const loopContainer = ref(null)

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

    // 手风琴展开控制
    const expandAccordion = (index) => {
      expandedAccordionIndex.value = index
    }

    const resetAccordion = () => {
      expandedAccordionIndex.value = 0 // 恢复到第一个展开
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

        // 加载完成，显示画廊
        setTimeout(() => {
          isInitialLoading.value = false
          nextTick(() => {
            initSwipers()
          })
        }, 500)

      } catch (error) {
        console.error('预加载图片失败:', error)
        // 即使失败也要显示画廊
        isInitialLoading.value = false
        nextTick(() => {
          initSwipers()
        })
      }
    }

    let startTime = Date.now()

    // 获取画廊数据
    const fetchGalleries = async () => {
      try {
        startTime = Date.now()
        loading.value = true
        error.value = null
        const response = await galleryService.getGalleries()
        galleries.value = response || []
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
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
        },
      })
    }

    // 初始化所有Swiper
    const initSwipers = async () => {
      await loadSwiper()
      await nextTick()
      
      if (galleries.value.length > 0 && !isInitialLoading.value) {
        setTimeout(() => {
          initAccordionSwiper()
          initCoverflowSwiper()
          initLoopSwiper()
        }, 100)
      }
    }

    // 打开全屏查看
    const openFullscreen = (gallery) => {
      selectedImage.value = gallery
      showFullscreen.value = true
      document.body.style.overflow = 'hidden'
    }

    // 关闭全屏查看
    const closeFullscreen = () => {
      showFullscreen.value = false
      selectedImage.value = null
      document.body.style.overflow = 'auto'
    }

    // 返回文章区域
    const goBack = () => {
      router.push('/')
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
      // 隐藏body滚动条，因为画廊组件自己处理滚动
      document.body.style.overflow = 'hidden'
      await fetchGalleries()
    })

    onUnmounted(() => {
      destroySwipers()
      // 恢复body滚动条
      document.body.style.overflow = 'auto'
    })

    return {
      galleries,
      loading,
      error,
      showFullscreen,
      selectedImage,
      expandedAccordionIndex,
      isInitialLoading,
      loadingProgress,
      previewImages,
      accordionContainer,
      coverflowContainer,
      loopContainer,
      getGallerySlice,
      openFullscreen,
      closeFullscreen,
      expandAccordion,
      resetAccordion,
      goBack
    }
  }
}
</script>

<style scoped>
/* 画廊全屏容器样式 */
.gallery-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1000;
}

.gallery-sections {
  max-width: 100%;
  padding: 2rem 2rem 4rem;
}

.gallery-section {
  margin-bottom: 4rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 3D覆盖流专用容器样式 - 无背景 */
.coverflow-section {
  margin-bottom: 4rem;
  padding: 2rem;
  background: transparent;
}


/* 手风琴容器样式 */
.accordion-container {
  display: flex;
  gap: 2rem;
  align-items: center;
  height: 80vh;
}

/* 手风琴样式 */
.accordion-gallery {
  height: 80vh;
  overflow: hidden;
  margin: 0;
  flex: 1;
}

.accordion-slide {
  width: 15% !important;
  transition: all 0.5s ease;
  cursor: pointer;
}

.accordion-slide:hover,
.accordion-slide.accordion-expanded {
  width: 40% !important;
}

.accordion-item {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 15px;
}

.accordion-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}


.accordion-slide:hover .accordion-overlay,
.accordion-slide.accordion-expanded .accordion-overlay {
  opacity: 1;
}

/* 移除不再需要的标题和描述样式 */


/* 3D 覆盖流样式 */
.coverflow-gallery {
  height: 75vh;
  padding: 50px 0;
  margin: 0 auto;
  max-width: 100%;
  position: relative;
}

.coverflow-slide {
  /* 让Swiper自己控制宽度和高度 */
  background: transparent;
}

.coverflow-item {
  position: relative;
  width: 100%;
  height: calc(75vh - 100px); /* 减去padding */
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
}

.coverflow-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 15px;
  /* 确保图片按3:2比例显示，纵向长方形 */
  aspect-ratio: 2/3;
}

.coverflow-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  color: white;
  padding: 1rem;
  text-align: center;
  border-radius: 0 0 15px 15px;
}

/* 移除不再需要的标题样式 */

/* 淡入淡出幻灯片样式 */
.fade-section {
  position: relative;
  width: 100%;
  height: 95vh;
  margin-bottom: 2rem;
  margin-top: 50px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0;
  overflow: hidden;
}

.fade-gallery {
  height: 100%;
  width: 100%;
  margin: 0;
}

.fade-slide {
  height: 100%;
  width: 100%;
}

.fade-item {
  position: relative;
  height: 100%;
  width: 100%;
  border-radius: 0;
  overflow: hidden;
  cursor: pointer;
}

.fade-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top; 
}

.fade-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, rgba(0,0,0,0.3), transparent 50%, rgba(0,0,0,0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fade-item:hover .fade-overlay {
  opacity: 1;
}

.fade-content {
  /* 保留容器样式，但移除文本相关样式 */
  text-align: center;
  color: white;
  padding: 1rem;
}

/* 状态覆盖层样式 */
.loading-overlay,
.error-overlay,
.empty-state {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  color: white;
  flex-direction: column;
}

/* Swiper自定义样式 */
/* 全屏模态框样式 */
.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.fullscreen-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.fullscreen-close {
  position: absolute;
  top: -50px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  z-index: 10000;
  transition: transform 0.2s ease;
}

.fullscreen-close:hover {
  transform: scale(1.1);
}

.fullscreen-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 90vh;
}

.fullscreen-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
}

.fullscreen-info {
  /* 保留容器但移除内容样式 */
  margin-top: 1rem;
  text-align: center;
  color: white;
  max-width: 500px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  /* 画廊内容移动端适配 */
  .gallery-sections {
    padding: 1rem 1rem 3rem;
  }
  
  .gallery-section {
    margin-bottom: 2rem;
    padding: 1rem;
    border-radius: 15px;
  }
  
  .coverflow-section {
    margin-bottom: 2rem;
    padding: 1rem;
  }
  

  
  .accordion-gallery,
  .coverflow-gallery {
    height: 30vh;
  }
  
  /* 移动端手风琴容器调整 */
  .accordion-container {
    flex-direction: column;
    height: auto;
    gap: 1rem;
  }
  
  .accordion-gallery {
    height: 30vh;
  }
  

  
  .coverflow-gallery {
    padding: 20px 0;
    height: 45vh;
  }
  
  .coverflow-item {
    height: calc(45vh - 40px); /* 移动端减少高度 */
  }
  
  .fade-section {
    height: 62vh;
  }
  
  .fullscreen-close {
    top: -40px;
    font-size: 1.5rem;
  }
}

/* Swiper 自定义样式 */
:deep(.swiper-pagination-bullet) {
  background: #667eea;
  opacity: 0.7;
}

:deep(.swiper-pagination-bullet-active) {
  background: #667eea;
  opacity: 1;
}

:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  color: #667eea;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 40px;
  height: 40px;
}

:deep(.swiper-button-next::after),
:deep(.swiper-button-prev::after) {
  font-size: 16px;
  font-weight: 600;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.empty-state {
  padding: 4rem 2rem;
}

/* 暗色主题适配 */
:global(.dark-theme) .gallery-fullscreen {
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
}

:global(.dark-theme) .gallery-section {
  background: rgba(45, 55, 72, 0.8);
  color: #ffffff;
}

/* 淡入淡出幻灯片暗色主题 */
:global(.dark-theme) .fade-section {
  background: rgba(45, 55, 72, 0.3);
}

/* 返回按钮样式 */
.return-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.return-button:hover {
  transform: translateY(-5px) scale(1.1);
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.6);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.return-button:active {
  transform: translateY(-2px) scale(1.05);
}

.return-button i {
  transition: transform 0.3s ease;
}

.return-button:hover i {
  transform: translateX(-2px);
}

/* 暗色主题下的返回按钮 */
@media (prefers-color-scheme: dark) {
  .return-button {
    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
    box-shadow: 0 8px 25px rgba(74, 85, 104, 0.4);
  }
  
  .return-button:hover {
    background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
    box-shadow: 0 15px 35px rgba(74, 85, 104, 0.6);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .return-button {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
}
</style>
