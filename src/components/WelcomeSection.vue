<template>
  <div class="welcome-section">
    <!-- 左侧幻灯片轮播区域 -->
    <div class="carousel-section">
      <div class="swiper-container" ref="swiperContainer">
        <div class="swiper-wrapper">
          <div 
            v-for="(slide, index) in slides" 
            :key="`slide-${slide.id}-${index}`"
            class="swiper-slide carousel-slide"
            @click="goToArticle(slide.id)"
          >
            <div class="slide-card">
              <div 
                class="slide-background"
                :style="{ backgroundImage: `url(${slide.coverImage})` }"
              ></div>
              <div class="slide-gradient"></div>
              <div class="slide-content">
                <div class="slide-category">{{ getCategoryName(slide.category) }}</div>
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

    <!-- 右侧信息区域 -->
    <div class="info-section">
      <!-- 网站公告 -->
      <div class="announcement-card">
        <div class="announcement-background"></div>
        <div class="announcement-overlay"></div>
        <div class="announcement-text-content">
          <h3 class="announcement-title">一个用于分享知识，资源的个人博客网站</h3>
          <p class="announcement-subtitle">Build with Nest and Vue</p>
        </div>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import articleService from '../services/articleService.js';
// 动态导入Swiper CSS
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const router = useRouter();
const swiperContainer = ref(null);

// 响应式数据
const slides = ref([]);
const articleCount = ref(0);
let swiperInstance = null;

// 动态导入Swiper
let Swiper, Navigation, Pagination, Autoplay;

const loadSwiper = async () => {
  try {
    const swiperModule = await import('swiper');
    const modulesModule = await import('swiper/modules');
    
    Swiper = swiperModule.Swiper;
    Navigation = modulesModule.Navigation;
    Pagination = modulesModule.Pagination;
    Autoplay = modulesModule.Autoplay;
    
    console.log('Swiper modules loaded successfully');
  } catch (err) {
    console.error('Failed to load Swiper:', err);
  }
};

// 获取文章数据
const fetchFeaturedArticles = async () => {
  try {
    const articles = await articleService.getArticles();
    articleCount.value = articles.length; // 设置文章总数
    
    // 获取有封面图的文章，如果没有则使用默认图片
    const articlesWithCover = articles.filter(article => article.coverImage);
    if (articlesWithCover.length > 0) {
      const shuffled = articlesWithCover.sort(() => 0.5 - Math.random());
      slides.value = shuffled.slice(0, Math.min(5, shuffled.length));
    } else {
      slides.value = articles.slice(0, 3).map(article => ({
        ...article,
        coverImage: '/src/assets/BlogPicture/background.webp'
      }));
    }
  } catch (error) {
    console.error('获取推荐文章失败:', error);
    articleCount.value = 0;
    slides.value = [{
      id: 0,
      title: '欢迎访问我的博客',
      category: 'other',
      coverImage: '/src/assets/BlogPicture/background.webp'
    }];
  }
};

// 初始化Swiper
const initSwiper = async () => {
  await loadSwiper();
  await nextTick();
  
  if (swiperContainer.value && Swiper && slides.value.length > 0) {
    swiperInstance = new Swiper(swiperContainer.value, {
      modules: [Navigation, Pagination, Autoplay],
      loop: true, // 启用循环模式
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
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
          console.log('Slide changed to:', this.realIndex);
        }
      }
    });
  }
};

// 跳转到文章详情
const goToArticle = (articleId) => {
  if (articleId && articleId !== 0) {
    router.push(`/article/${articleId}`);
  }
};

// 获取分类名称
const getCategoryName = (category) => {
  const categoryMap = {
    'study': '学习',
    'game': '游戏',
    'work': '个人作品',
    'resource': '资源分享',
    'other': '其他'
  };
  return categoryMap[category] || '其他';
};

// 页面导航功能
const goToArticles = () => {
  // 优先尝试滚动到文章列表容器
  const articleListContainer = document.querySelector('.article-list-page');
  if (articleListContainer) {
    articleListContainer.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
    return;
  }
  
  // 如果找不到文章列表容器，尝试滚动到主内容区域
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
    return;
  }
  
  // 最后的备选方案：滚动到页面适当位置
  window.scrollTo({
    top: window.innerHeight * 0.6,
    behavior: 'smooth'
  });
};

const goToGallery = () => {
  router.push('/gallery');
};

// 销毁Swiper实例
const destroySwiper = () => {
  if (swiperInstance) {
    swiperInstance.destroy(true, true);
    swiperInstance = null;
  }
};

// 生命周期
onMounted(async () => {
  await fetchFeaturedArticles();
  await initSwiper();
});

onUnmounted(() => {
  destroySwiper();
});
</script>

<style scoped>
/* 主容器 */
.welcome-section {
  width: 80%;
  height: 45vh;
  margin: 0 auto; /* 居中显示 */
  display: flex;
  gap: 20px;
  padding: 0;
  overflow: hidden;
}

/* 左侧幻灯片区域 */
.carousel-section {
  flex: 1.5; /* 调整比例，约60%宽度 */
  height: 100%;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.swiper-container {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.swiper-wrapper {
  align-items: center;
}

/* 单个幻灯片 */
.swiper-slide.carousel-slide {
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 卡片容器 */
.slide-card {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.swiper-slide:hover .slide-card {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

/* 背景图片 */
.slide-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.3s ease;
}

.swiper-slide:hover .slide-background {
  transform: scale(1.05);
}

/* 渐变遮罩 */
.slide-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.1) 40%,
    rgba(0, 0, 0, 0.7) 100%
  );
  z-index: 1;
}

/* 内容区域 */
.slide-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px; /* 减少内边距 */
  z-index: 2;
  color: white;
}

.slide-category {
  font-size: 0.7rem; /* 稍微减小字体 */
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #ffd700;
  margin-bottom: 6px; /* 减少下边距 */
  opacity: 0.9;
}

.slide-title {
  font-size: 1.1rem; /* 减小标题字体 */
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 8px 0; /* 减少下边距 */
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 导航按钮样式 */
.carousel-nav-btn {
  width: 40px !important;
  height: 40px !important;
  border: none;
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.9) !important;
  color: #333 !important;
  font-size: 1rem;
  cursor: pointer;
  display: flex !important;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  margin-top: 0 !important;
}

.carousel-nav-btn:hover {
  background: rgba(255, 255, 255, 1) !important;
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.carousel-nav-btn:active {
  transform: scale(0.95);
}

.carousel-nav-btn::after {
  display: none;
}

.carousel-nav-prev {
  left: 15px !important;
}

.carousel-nav-next {
  right: 15px !important;
}

/* Swiper分页器样式 */
:deep(.swiper-pagination) {
  bottom: 15px !important;
}

:deep(.swiper-pagination-bullet) {
  background: rgba(255, 255, 255, 0.5) !important;
  opacity: 1 !important;
  width: 8px;
  height: 8px;
  margin: 0 4px !important;
  transition: all 0.3s ease;
}

:deep(.swiper-pagination-bullet-active) {
  background: #fff !important;
  transform: scale(1.3);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

/* 右侧信息区域 */
.info-section {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 公告卡片 */
.announcement-card {
  flex: 2;
  position: relative;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

.announcement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

/* 背景图片 */
.announcement-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('../assets/Picture/公告.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
}

/* 遮罩层 */
.announcement-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.2) 50%,
    rgba(0, 0, 0, 0.6) 100%
  );
  z-index: 2;
}

/* 文字内容 */
.announcement-text-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  z-index: 3;
  width: 80%;
}

.announcement-title {
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.4;
  margin: 0 0 15px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.5px;
}

.announcement-subtitle {
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
  opacity: 0.9;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 1px;
}

/* 底部卡片容器 */
.bottom-cards {
  flex: 1;
  display: flex;
  gap: 15px;
}

/* 信息卡片 */
.info-card {
  flex: 1;
  position: relative;
  border-radius: 12px;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 卡片背景图片 */
.card-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
}

.articles-bg {
  background-image: url('../assets/Picture/文章.webp');
}

.gallery-bg {
  background-image: url('../assets/Picture/画廊.webp');
}

/* 卡片遮罩层 */
.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.2) 50%,
    rgba(0, 0, 0, 0.6) 100%
  );
  z-index: 2;
}

/* 卡片内容包装器 */
.card-content-wrapper {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
  z-index: 3;
  color: white;
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
  z-index: 4;
}

.info-card:hover::before {
  left: 100%;
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 10px;
  transition: all 0.3s ease;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.info-card:hover .card-icon {
  transform: scale(1.1);
}

.card-content h5 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.card-stats {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.card-arrow {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  z-index: 5;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.info-card:hover .card-arrow {
  transform: translateX(3px);
  color: white;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .welcome-section {
    width: 90%; /* 平板端稍微增加宽度 */
    flex-direction: column;
    height: auto;
    gap: 15px;
  }
  
  .carousel-section {
    height: 35vh;
    flex: none;
  }
  
  .info-section {
    flex: none;
    height: auto;
  }
  
  .bottom-cards {
    flex-direction: row;
  }
}

@media (max-width: 768px) {
  .welcome-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .carousel-section {
    width: 100%;
  }
  
  .sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 10px;
  }
  
  .info-cards {
    flex-direction: row;
    gap: 10px;
    min-width: fit-content;
  }
  
  .info-card {
    min-width: 120px;
    height: 100px;
    padding: 10px;
  }
  
  .card-content-wrapper {
    padding: 10px;
  }
  
  .card-icon {
    font-size: 1.5rem;
    margin-bottom: 5px;
  }
  
  .card-content h5 {
    font-size: 0.9rem;
  }
  
  .card-stats {
    font-size: 0.75rem;
  }
  
  .announcement-card {
    min-width: 200px;
    margin-right: 10px;
    min-height: 200px;
  }
  
  .announcement-bg {
    background-attachment: scroll;
  }
  
  .announcement-title {
    font-size: 1rem;
  }
  
  .announcement-subtitle {
    font-size: 0.8rem;
  }
  
  .carousel-nav-btn {
    width: 35px !important;
    height: 35px !important;
    font-size: 0.9rem;
  }
  
  .carousel-nav-prev {
    left: 10px !important;
  }
  
  .carousel-nav-next {
    right: 10px !important;
  }
  
  .slide-content {
    padding: 12px;
  }
  
  .slide-title {
    font-size: 1rem;
  }
  
  .slide-category {
    font-size: 0.65rem;
  }
}

@media (max-width: 576px) {
  .welcome-container {
    gap: 10px;
  }
  
  .info-card {
    min-width: 100px;
    height: 80px;
  }
  
  .card-content-wrapper {
    padding: 8px;
  }
  
  .card-icon {
    font-size: 1.2rem;
    margin-bottom: 3px;
  }
  
  .card-content h5 {
    font-size: 0.8rem;
  }
  
  .card-stats {
    font-size: 0.7rem;
  }
  
  .announcement-card {
    min-width: 180px;
  }
  
  .carousel-nav-btn {
    width: 30px !important;
    height: 30px !important;
    font-size: 0.8rem;
  }
  
  .carousel-nav-prev {
    left: 8px !important;
  }
  
  .carousel-nav-next {
    right: 8px !important;
  }
}

/* 暗色主题适配 */
[data-bs-theme="dark"] .info-card {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

[data-bs-theme="dark"] .info-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
}

[data-bs-theme="dark"] .announcement-card {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

[data-bs-theme="dark"] .announcement-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
}

[data-bs-theme="dark"] .card-overlay {
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
}

[data-bs-theme="dark"] .announcement-overlay {
  background: linear-gradient(
    145deg,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.6) 30%,
    rgba(0, 0, 0, 0.4) 70%,
    rgba(0, 0, 0, 0.8) 100%
  );
}

/* 暗色主题下的公告遮罩层调整 */
[data-bs-theme="dark"] .announcement-overlay {
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
}

[data-bs-theme="dark"] .carousel-nav-btn {
  background: rgba(26, 26, 26, 0.9) !important;
  color: #ffffff !important;
}

[data-bs-theme="dark"] .carousel-nav-btn:hover {
  background: rgba(26, 26, 26, 1) !important;
}

[data-bs-theme="dark"] :deep(.swiper-pagination-bullet) {
  background: rgba(255, 255, 255, 0.3) !important;
}

[data-bs-theme="dark"] :deep(.swiper-pagination-bullet-active) {
  background: #fff !important;
}

[data-bs-theme="dark"] .slide-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

[data-bs-theme="dark"] .carousel-slide.active .slide-card {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
</style>
