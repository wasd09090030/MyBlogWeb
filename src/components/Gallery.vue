<template>
  <div class="gallery-fullscreen">
    <!-- 进入画廊前的加载动画 -->
    <div v-if="isInitialLoading" class="initial-loading-overlay">
      <div class="loading-container">
        <div class="loading-animation">
          <div class="loading-circle">
            <div class="circle-inner">
              <i class="bi bi-images"></i>
            </div>
          </div>
          <div class="loading-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
            </div>
            <div class="progress-text">
              正在加载画廊 {{ Math.round(loadingProgress) }}%
            </div>
          </div>
        </div>
        
        <!-- 预览图片展示 -->
        <div class="preview-images" v-if="previewImages.length > 0">
          <div 
            v-for="(img, index) in previewImages.slice(0, 3)" 
            :key="index"
            class="preview-item"
            :style="{ animationDelay: index * 0.2 + 's' }"
          >
            <img :src="img.imageUrl" :alt="`预览图片${index + 1}`" />
          </div>
        </div>
        
        <div class="loading-tip">
          <p>正在为您准备精美的图片画廊...</p>
        </div>
      </div>
    </div>

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
              v-for="(gallery, index) in getGallerySlice(0, 4)" 
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
          <div class="swiper-pagination"></div>
        </div>
      </section>

      <!-- 手风琴和3D覆盖流展示 -->
      <div class="gallery-sections">
        <!-- 第一部分：手风琴横向展示 -->
        <section class="gallery-section">
          <h2 class="section-title">立绘</h2>
          <div class="accordion-container">
            <div class="accordion-gallery" ref="accordionContainer">
              <div class="swiper-wrapper">
                <div 
                  v-for="(gallery, index) in getGallerySlice(5, 9)" 
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
            <div class="fixed-image-container">
              <img 
                :src="LinImage" 
                alt="立绘图片"
                class="fixed-side-image"
              />
            </div>
          </div>
        </section>

        <!-- 第二部分：3D 覆盖流效果 -->
        <section class="gallery-section mb-5">
          <h2 class="section-title">绘景图</h2>
          <div class="coverflow-gallery" ref="coverflowContainer">
            <div class="swiper-wrapper">
              <div 
                v-for="(gallery, index) in getGallerySlice(10, 14)" 
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
            <div class="swiper-pagination"></div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>
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
// 导入静态图片
import LinImage from '@/assets/Picture/LIN.webp'

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
        modules: [Navigation, Pagination, EffectCoverflow],
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
        pagination: {
          el: '.coverflow-gallery .swiper-pagination',
          clickable: true,
        },
        navigation: {
          nextEl: '.coverflow-gallery .swiper-button-next',
          prevEl: '.coverflow-gallery .swiper-button-prev',
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
        modules: [Navigation, Pagination, Autoplay, EffectFade],
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
        pagination: {
          el: '.fade-gallery .swiper-pagination',
          clickable: true,
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
      await fetchGalleries()
    })

    onUnmounted(() => {
      destroySwipers()
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
      LinImage,
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
/* 初始加载动画样式 */
.initial-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  text-align: center;
  max-width: 500px;
  padding: 2rem;
}

.loading-animation {
  margin-bottom: 2rem;
}

.loading-circle {
  width: 120px;
  height: 120px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  position: relative;
  animation: rotateCircle 2s linear infinite;
}

.loading-circle::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 4px solid transparent;
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.circle-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  backdrop-filter: blur(10px);
}

.circle-inner i {
  font-size: 2.5rem;
  color: white;
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-progress {
  width: 300px;
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffffff, #f093fb);
  border-radius: 3px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shimmer 1.5s infinite;
}

.progress-text {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.preview-images {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
  justify-content: center;
}

.preview-item {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.3);
  animation: previewFloat 2s ease-in-out infinite;
  opacity: 0;
  animation: previewFadeIn 0.6s ease-out forwards;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loading-tip {
  margin-top: 1rem;
}

.loading-tip p {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  animation: textPulse 2s ease-in-out infinite;
}

/* 动画效果 */
@keyframes rotateCircle {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes previewFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes previewFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes textPulse {
  0%, 100% {
    opacity: 0.9;
  }
  50% {
    opacity: 0.6;
  }
}

/* 暗色主题下的初始加载动画 */
:global(.dark-theme) .initial-loading-overlay {
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
}

/* 画廊全屏容器样式 */
.gallery-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1;
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

.section-title {
  text-align: center;
  font-size: 1.8rem;
  font-weight: 600;
  color: #34495e;
  margin-bottom: 2rem;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
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
  max-width: calc(100% - 300px); /* 为右侧图片预留空间 */
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
  transition: transform 0.5s ease;
}

.accordion-slide:hover .accordion-image,
.accordion-slide.accordion-expanded .accordion-image {
  transform: scale(1.1);
}


.accordion-slide:hover .accordion-overlay,
.accordion-slide.accordion-expanded .accordion-overlay {
  opacity: 1;
}

/* 移除不再需要的标题和描述样式 */

/* 固定图片容器样式 */
.fixed-image-container {
  flex-shrink: 0;
  width: 280px;
  height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fixed-side-image {
  width: 100%;
  height: 80vh;
  object-fit: cover;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.fixed-side-image:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

/* 3D 覆盖流样式 */
.coverflow-gallery {
  height: 400px;
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
  height: 350px;
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  /* 移除自定义的变换和阴影，让Swiper处理 */
}

.coverflow-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 15px;
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
  height: 90vh;
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
  z-index: 10;
  color: white;
  flex-direction: column;
}

/* Swiper自定义样式 */
.coverflow-gallery .swiper-button-next,
.coverflow-gallery .swiper-button-prev {
  color: #667eea;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin-top: -20px;
}

.coverflow-gallery .swiper-button-next::after,
.coverflow-gallery .swiper-button-prev::after {
  font-size: 16px;
  font-weight: 600;
}

.coverflow-gallery .swiper-pagination {
  bottom: 10px !important;
}

.coverflow-gallery .swiper-pagination-bullet {
  background: #667eea;
  opacity: 0.7;
}

.coverflow-gallery .swiper-pagination-bullet-active {
  background: #667eea;
  opacity: 1;
}

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
  /* 初始加载动画移动端适配 */
  .initial-loading-overlay .loading-container {
    padding: 1rem;
    max-width: 90vw;
  }
  
  .loading-circle {
    width: 100px;
    height: 100px;
  }
  
  .circle-inner {
    width: 70px;
    height: 70px;
  }
  
  .circle-inner i {
    font-size: 2rem;
  }
  
  .loading-progress {
    width: 250px;
  }
  
  .progress-text {
    font-size: 1rem;
  }
  
  .preview-images {
    gap: 0.5rem;
  }
  
  .preview-item {
    width: 60px;
    height: 60px;
  }
  
  .loading-tip p {
    font-size: 0.9rem;
  }
  
  /* 画廊内容移动端适配 */
  .gallery-sections {
    padding: 1rem 1rem 3rem;
  }
  
  .gallery-section {
    margin-bottom: 2rem;
    padding: 1rem;
    border-radius: 15px;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .accordion-gallery,
  .coverflow-gallery {
    height: 250px;
  }
  
  /* 移动端手风琴容器调整 */
  .accordion-container {
    flex-direction: column;
    height: auto;
    gap: 1rem;
  }
  
  .accordion-gallery {
    max-width: 100%;
    height: 250px;
  }
  
  .fixed-image-container {
    width: 100%;
    height: 250px;
  }
  
  .fixed-side-image {
    height: 250px;
  }
  
  .coverflow-gallery {
    padding: 20px 0;
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

:global(.dark-theme) .section-title {
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
