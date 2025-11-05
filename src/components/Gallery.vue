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
import './Gallery.styles.css'

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
      // 不需要再次设置 overflow，因为画廊本身已经是全屏且禁用了滚动
    }

    // 关闭全屏查看
    const closeFullscreen = () => {
      showFullscreen.value = false
      selectedImage.value = null
      // 不需要恢复 overflow，保持画廊的滚动设置
    }

    // 返回文章区域
    const goBack = () => {
      // 在路由跳转前恢复 body 滚动
      document.body.style.overflow = ''
      document.body.style.removeProperty('overflow')
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
@import './Gallery.styles.css';
</style>
