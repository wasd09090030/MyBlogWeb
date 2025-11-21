<template>
  <div class="welcome-section">
    <!-- 左侧幻灯片轮播区域包裹容器 -->
    <div class="carousel-wrapper">
      <div class="carousel-section">
        <div class="swiper-container" ref="swiperContainer">
          <div class="swiper-wrapper">
            <div
              v-for="(slide, index) in slides"
              :key="`slide-${slide.id}-${index}`"
              class="swiper-slide carousel-slide"
              @click="slide.id ? goToArticle(slide.id) : null"
              :style="{ cursor: slide.id ? 'pointer' : 'default' }"
            >
              <div class="slide-card">
                <div
                  class="slide-background"
                  :style="{ backgroundImage: `url(${slide.coverImage})` }"
                ></div>
                <div class="slide-gradient"></div>
                <div class="slide-category-badge">{{ getCategoryName(slide.category) }}</div>
                <div class="slide-content">
                  <h3 class="slide-title">{{ slide.title }}</h3>
                </div>
              </div>
            </div>
          </div>

          <!-- 导航按钮 -->
          <div class="swiper-button-next carousel-nav-btn carousel-nav-next">
            <i class="bi bi-chevron-right"></i>
          </div>
          <div class="swiper-button-prev carousel-nav-btn carousel-nav-prev">
            <i class="bi bi-chevron-left"></i>
          </div>

          <!-- 分页器 -->
          <div class="swiper-pagination"></div>
        </div>
      </div>

      <!-- 随机文章按钮 -->
      <button class="random-article-btn" @click="goToRandomArticle">
        <div class="svg-wrapper-1">
          <div class="svg-wrapper">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path fill="none" d="M0 0h24v24H0z"></path>
              <path
                fill="currentColor"
                d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
              ></path>
            </svg>
          </div>
        </div>
        <span>随机选一篇</span>
      </button>
    </div>

    <!-- 右侧信息区域 -->
    <div class="info-section">
      <!-- 顶部区域：公告 + 图标走马灯统一容器 -->
      <div class="top-section">
        <div class="announcement-text-content">
          <h3 class="announcement-title">简洁、美观、高性能的个人网站</h3>
          <p class="announcement-subtitle">Build with Asp.Net Core8.0 and Nuxt</p>
        </div>
        
        <!-- 图标走马灯 -->
        <IconMarquee class="icon-marquee-wrapper" />
      </div>

      <!-- 底部两个小卡片 -->
      <div class="bottom-cards">
        <!-- 文章卡片 -->
        <div class="info-card articles-card" @click="goToArticles">
          <div class="card-background articles-bg"></div>
          <div class="card-overlay"></div>
          <div class="card-content-wrapper">
            <div class="card-icon">
              <i class="bi bi-file-text"></i>
            </div>
            <div class="card-content">
              <h5 class="card-title">文章</h5>
              <p class="card-stats">{{ articleCount }} 篇</p>
            </div>
            <div class="card-arrow">
              <i class="bi bi-arrow-right"></i>
            </div>
          </div>
        </div>

        <!-- 画廊卡片 -->
        <div class="info-card gallery-card" @click="goToGallery">
          <div class="card-background gallery-bg"></div>
          <div class="card-overlay"></div>
          <div class="card-content-wrapper">
            <div class="card-icon">
              <i class="bi bi-images"></i>
            </div>
            <div class="card-content">
              <h5 class="card-title">画廊</h5>
              <p class="card-stats">精美图片</p>
            </div>
            <div class="card-arrow">
              <i class="bi bi-arrow-right"></i>
            </div>
          </div>
        </div>

        <!-- 关于站长卡片 -->
        <div class="info-card host-card" @click="goToAbout">
          <div class="card-background host-bg"></div>
          <div class="card-overlay"></div>
          <div class="card-content-wrapper">
            <div class="card-icon">
              <i class="bi bi-person-circle"></i>
            </div>
            <div class="card-content">
              <h5 class="card-title">关于站长</h5>
              <p class="card-stats">了解更多</p>
            </div>
            <div class="card-arrow">
              <i class="bi bi-arrow-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useArticles } from '~/composables/useArticles'
// 动态导入Swiper CSS
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import '~/assets/css/components/WelcomeSection.styles.css'

const router = useRouter()
const swiperContainer = ref(null)

// 响应式数据
const slides = ref([])
const articleCount = ref(0)
const loading = ref(false)
let swiperInstance = null

// API composable
const { getFeaturedArticles, getArticles, getAllArticles } = useArticles()

// 获取推荐文章数据 - 专为轮播设计的轻量级API
const fetchFeaturedArticles = async () => {
  if (loading.value) return

  loading.value = true
  try {
    console.log('WelcomeSection: 开始获取推荐文章...')

    // 使用专门的推荐文章API
    const featuredArticles = await getFeaturedArticles(5)
    slides.value = featuredArticles

    // 获取文章总数 - 使用 summary=false 来获取包含 total 的分页数据
    const articlesData = await getArticles({ page: 1, limit: 1, summary: false })
    console.log('WelcomeSection: 获取文章数据响应:', articlesData)
    
    // 从分页数据中提取总数
    if (articlesData && articlesData.total !== undefined) {
      articleCount.value = articlesData.total
      console.log('WelcomeSection: 成功获取文章总数:', articleCount.value)
    } else {
      console.warn('WelcomeSection: 无法从API获取准确的文章总数，使用推荐文章数量作为备选')
      articleCount.value = featuredArticles.length
    }

    console.log('WelcomeSection: 获取推荐文章成功，轮播文章数:', slides.value.length, '总文章数:', articleCount.value)
  } catch (error) {
    console.error('WelcomeSection: 获取推荐文章失败:', error)
    slides.value = []
    articleCount.value = 0
  } finally {
    loading.value = false
  }
}

// 动态导入Swiper
let Swiper, Navigation, Pagination, Autoplay

const loadSwiper = async () => {
  try {
    const swiperModule = await import('swiper')
    const modulesModule = await import('swiper/modules')

    Swiper = swiperModule.Swiper
    Navigation = modulesModule.Navigation
    Pagination = modulesModule.Pagination
    Autoplay = modulesModule.Autoplay

    console.log('Swiper modules loaded successfully')
  } catch (err) {
    console.error('Failed to load Swiper:', err)
  }
}

// 初始化Swiper
const initSwiper = async () => {
  await loadSwiper()
  await nextTick()

  if (swiperContainer.value && Swiper && slides.value.length > 0) {
    // 如果已有实例，先销毁
    if (swiperInstance) {
      swiperInstance.destroy(true, true)
    }

    swiperInstance = new Swiper(swiperContainer.value, {
      modules: [Navigation, Pagination, Autoplay],
      loop: slides.value.length > 1, // 只有多张图片时才启用循环
      autoplay: slides.value.length > 1 ? {
        delay: 4000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      } : false,
      speed: 800,
      effect: 'slide',
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true,
      },
      on: {
        slideChange: function () {
          console.log('Slide changed to:', this.realIndex)
        }
      }
    })

    console.log('WelcomeSection: Swiper初始化完成，幻灯片数量:', slides.value.length)
  }
}

// 跳转到文章详情
const goToArticle = (articleId) => {
  if (articleId && articleId !== 0) {
    console.log('导航到文章:', articleId)
    router.push(`/article/${articleId}`)
  } else {
    console.warn('无效的文章ID:', articleId)
  }
}

// 获取分类名称
const getCategoryName = (category) => {
  const categoryMap = {
    'study': '学习',
    'game': '游戏',
    'work': '个人作品',
    'resource': '资源分享',
    'other': '其他'
  }
  return categoryMap[category] || '其他'
}

// 页面导航功能
const goToArticles = () => {
  // 优先尝试滚动到文章列表容器
  const articleListContainer = document.querySelector('.article-list-page')
  if (articleListContainer) {
    articleListContainer.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
    return
  }

  // 如果找不到文章列表容器，尝试滚动到主内容区域
  const mainContent = document.querySelector('.main-content')
  if (mainContent) {
    mainContent.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
    return
  }

  // 最后的备选方案：滚动到页面适当位置
  window.scrollTo({
    top: window.innerHeight * 0.6,
    behavior: 'smooth'
  })
}

const goToGallery = () => {
  router.push('/gallery')
}

const goToAbout = () => {
  router.push('/about')
}

// 随机跳转文章
const goToRandomArticle = async () => {
  try {
    let articles = []

    // 优先从已加载的轮播文章中随机选择（最快）
    if (slides.value && slides.value.length > 0) {
      articles = slides.value
      console.log('从轮播文章中随机选择，共', articles.length, '篇')
    } else {
      // 如果轮播文章为空，获取所有文章
      console.log('获取所有文章...')
      const allArticles = await getAllArticles()

      if (allArticles && allArticles.length > 0) {
        articles = allArticles
        console.log('成功获取所有文章，共', articles.length, '篇')
      } else {
        console.warn('没有找到可用的文章')
        return
      }
    }

    // 从文章列表中随机选择一篇
    if (articles.length > 0) {
      const randomIndex = Math.floor(Math.random() * articles.length)
      const randomArticle = articles[randomIndex]

      if (randomArticle && randomArticle.id) {
        console.log('随机跳转到文章:', randomArticle.id, '-', randomArticle.title)
        router.push(`/article/${randomArticle.id}`)
      } else {
        console.warn('选中的文章没有有效的ID')
      }
    }
  } catch (error) {
    console.error('获取随机文章失败:', error)
  }
}

// 销毁Swiper实例
const destroySwiper = () => {
  if (swiperInstance) {
    swiperInstance.destroy(true, true)
    swiperInstance = null
  }
}

// 生命周期
onMounted(async () => {
  console.log('WelcomeSection: 组件挂载，开始初始化...')
  await fetchFeaturedArticles()
  await initSwiper()
})

onUnmounted(() => {
  destroySwiper()
})
</script>

<style scoped>
@import '~/assets/css/components/WelcomeSection.styles.css';
</style>
