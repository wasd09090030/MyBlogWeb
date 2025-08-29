<template>
  <div class="gallery-container container-fluid">
    <!-- 页面标题 -->
    <div class="gallery-header text-center mb-5">
      <h1 class="gallery-title">图片画廊</h1>
      <p class="gallery-subtitle text-muted">三种精美展示效果</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="alert alert-danger text-center" role="alert">
      {{ error }}
    </div>

    <!-- 画廊内容 -->
    <div v-else-if="galleries.length > 0" class="gallery-sections">
      
      <!-- 第一部分：手风琴横向展示 -->
      <section class="gallery-section mb-5">
        <h2 class="section-title">手风琴展示</h2>
        <div class="accordion-gallery" ref="accordionContainer">
          <div class="swiper-wrapper">
            <div 
              v-for="(gallery, index) in getGallerySlice(0, 5)" 
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
                  :alt="gallery.title"
                  class="accordion-image"
                />
                <div class="accordion-overlay">
                  <h3 class="accordion-title">{{ gallery.title }}</h3>
                  <p class="accordion-description">{{ gallery.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 第二部分：3D 覆盖流效果 -->
      <section class="gallery-section mb-5">
        <h2 class="section-title">3D 覆盖流</h2>
        <div class="coverflow-gallery" ref="coverflowContainer">
          <div class="swiper-wrapper">
            <div 
              v-for="(gallery, index) in getGallerySlice(5, 10)" 
              :key="`coverflow-${gallery.id}`" 
              class="swiper-slide coverflow-slide"
            >
              <div 
                class="coverflow-item"
                @click="openFullscreen(gallery)"
              >
                <img 
                  :src="gallery.imageUrl" 
                  :alt="gallery.title"
                  class="coverflow-image"
                />
                <div class="coverflow-info">
                  <h3>{{ gallery.title }}</h3>
                </div>
              </div>
            </div>
          </div>
          <div class="swiper-pagination"></div>
          <div class="swiper-button-next"></div>
          <div class="swiper-button-prev"></div>
        </div>
      </section>

      <!-- 第三部分：循环幻灯片效果 -->
      <section class="gallery-section mb-5">
        <h2 class="section-title">循环幻灯片</h2>
        <div class="loop-gallery" ref="loopContainer">
          <div class="swiper-wrapper">
            <div 
              v-for="(gallery, index) in getGallerySlice(10, 15)" 
              :key="`loop-${gallery.id}`" 
              class="swiper-slide loop-slide"
            >
              <div 
                class="loop-item"
                @click="openFullscreen(gallery)"
              >
                <img 
                  :src="gallery.imageUrl" 
                  :alt="gallery.title"
                  class="loop-image"
                />
                <div class="loop-overlay">
                  <div class="loop-content">
                    <h3>{{ gallery.title }}</h3>
                    <p>{{ gallery.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="swiper-pagination"></div>
        </div>
      </section>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state text-center py-5">
      <i class="bi bi-images display-1 text-muted mb-3"></i>
      <h3 class="text-muted">暂无图片</h3>
      <p class="text-muted">画廊中还没有任何图片</p>
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
            :alt="selectedImage?.title"
            class="fullscreen-image"
          />
          <div class="fullscreen-info">
            <h3>{{ selectedImage?.title }}</h3>
            <p v-if="selectedImage?.description">{{ selectedImage?.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { galleryService } from '../services/articleService.js'

// 动态导入Swiper以避免SSR问题
let Swiper, Navigation, Pagination, Autoplay, EffectCoverflow

export default {
  name: 'Gallery',
  setup() {
    const galleries = ref([])
    const loading = ref(true)
    const error = ref(null)
    const showFullscreen = ref(false)
    const selectedImage = ref(null)
    const expandedAccordionIndex = ref(0) // 默认第一个展开
    
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

    // 获取画廊数据
    const fetchGalleries = async () => {
      try {
        loading.value = true
        error.value = null
        const response = await galleryService.getGalleries()
        galleries.value = response || []  // 直接使用response，不是response.data
        console.log('Gallery data loaded:', galleries.value)
      } catch (err) {
        console.error('获取画廊数据失败:', err)
        error.value = '获取画廊数据失败，请稍后重试'
      } finally {
        loading.value = false
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
        slidesPerView: 'auto',
        loop: true,
        coverflowEffect: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
      })
    }

    // 初始化循环幻灯片效果
    const initLoopSwiper = () => {
      if (!loopContainer.value || !Swiper) return
      
      loopSwiper.value = new Swiper(loopContainer.value, {
        modules: [Navigation, Pagination, Autoplay],
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
      })
    }

    // 初始化所有Swiper
    const initSwipers = async () => {
      await loadSwiper()
      await nextTick()
      
      if (galleries.value.length > 0) {
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
      await initSwipers()
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
      accordionContainer,
      coverflowContainer,
      loopContainer,
      getGallerySlice,
      openFullscreen,
      closeFullscreen,
      expandAccordion,
      resetAccordion
    }
  }
}
</script>

<style scoped>
/* 画廊容器样式 */
.gallery-container {
  padding: 1rem 1rem 2rem;
  min-height: calc(100vh - 200px);
  max-width: 100%;
  overflow-x: hidden;
}

.gallery-header {
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.gallery-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.gallery-subtitle {
  font-size: 1.2rem;
}

.gallery-sections {
  max-width: 100%;
  padding: 0 1rem;
}

.gallery-section {
  margin-bottom: 3rem;
  padding: 0 0.5rem;
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

/* 手风琴样式 */
.accordion-gallery {
  height: 350px;
  overflow: hidden;
  margin: 0 auto;
  max-width: 100%;
}

.accordion-slide {
  width: 20% !important;
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

.accordion-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  color: white;
  padding: 2rem 1rem 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.accordion-slide:hover .accordion-overlay,
.accordion-slide.accordion-expanded .accordion-overlay {
  opacity: 1;
}

.accordion-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.accordion-description {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* 3D 覆盖流样式 */
.coverflow-gallery {
  height: 350px;
  padding: 30px 0;
  margin: 0 auto;
  max-width: 100%;
}

.coverflow-slide {
  width: 300px !important;
  height: 300px !important;
}

.coverflow-item {
  position: relative;
  height: 100%;
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  transition: transform 0.3s ease;
}

.coverflow-item:hover {
  transform: translateY(-10px);
}

.coverflow-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
}

.coverflow-info h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

/* 循环幻灯片样式 */
.loop-gallery {
  height: 350px;
  margin: 0 auto;
  max-width: 100%;
}

.loop-slide {
  height: 100%;
}

.loop-item {
  position: relative;
  height: 100%;
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
}

.loop-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.loop-item:hover .loop-image {
  transform: scale(1.05);
}

.loop-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, rgba(0,0,0,0.3), transparent 50%, rgba(0,0,0,0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.loop-item:hover .loop-overlay {
  opacity: 1;
}

.loop-content {
  text-align: center;
  color: white;
  padding: 1rem;
}

.loop-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.loop-content p {
  font-size: 1rem;
  opacity: 0.9;
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
  margin-top: 1rem;
  text-align: center;
  color: white;
  max-width: 500px;
}

.fullscreen-info h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.fullscreen-info p {
  font-size: 1rem;
  opacity: 0.9;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gallery-container {
    padding: 0.5rem;
  }
  
  .gallery-header {
    margin-bottom: 1.5rem;
    padding: 0 0.5rem;
  }
  
  .gallery-title {
    font-size: 2rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .gallery-sections {
    padding: 0;
  }
  
  .gallery-section {
    margin-bottom: 2rem;
    padding: 0;
  }
  
  .accordion-gallery,
  .coverflow-gallery,
  .loop-gallery {
    height: 250px;
  }
  
  .coverflow-gallery {
    padding: 20px 0;
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
</style>
