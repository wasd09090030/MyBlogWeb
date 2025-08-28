<template>
  <div class="welcome-section">
    <!-- 左侧幻灯片轮播区域 -->
    <div class="carousel-section" @mouseenter="stopAutoPlay" @mouseleave="startAutoPlay">
      <div class="carousel-container">
        <!-- 左侧导航按钮 -->
        <button 
          class="carousel-nav-btn carousel-nav-prev" 
          @click="prevSlide"
          aria-label="上一张"
        >
          <i class="bi bi-chevron-left"></i>
        </button>

        <!-- 幻灯片轨道 -->
        <div class="carousel-track" ref="trackRef" :style="trackStyle">
          <div 
            v-for="(slide, index) in slides" 
            :key="index"
            class="carousel-slide"
            :class="{ 'active': index === currentIndex }"
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
              <div class="active-indicator" v-if="index === currentIndex"></div>
            </div>
          </div>
        </div>

        <!-- 右侧导航按钮 -->
        <button 
          class="carousel-nav-btn carousel-nav-next" 
          @click="nextSlide"
          aria-label="下一张"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
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
              <p class="card-stats">即将开放</p>
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import articleService from '../services/articleService.js';

const router = useRouter();
const trackRef = ref(null);

// 响应式数据
const slides = ref([]);
const currentIndex = ref(0);
const isTransitioning = ref(false);
const articleCount = ref(0);
let autoPlayInterval = null;

// 轨道样式
const trackStyle = computed(() => {
  if (slides.value.length === 0) return {};
  
  // 左侧幻灯片区域每个幻灯片占满整个容器宽度
  const slideWidth = 100; // 100% 宽度
  const gap = 0; // 没有间距，因为每次只显示一个
  
  // 计算偏移量，显示当前幻灯片
  const offset = `${-currentIndex.value * slideWidth}%`;
  
  return {
    transform: `translateX(${offset})`,
    transition: isTransitioning.value ? 'transform 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53)' : 'none'
  };
});

// 获取文章数据
const fetchFeaturedArticles = async () => {
  try {
    const articles = await articleService.getArticles();
    articleCount.value = articles.length; // 设置文章总数
    
    const articlesWithCover = articles.filter(article => article.coverImage);
    let originalSlides = [];
    if (articlesWithCover.length > 0) {
      const shuffled = articlesWithCover.sort(() => 0.5 - Math.random());
      originalSlides = shuffled.slice(0, Math.min(5, shuffled.length));
    } else {
      originalSlides = articles.slice(0, 3).map(article => ({
        ...article,
        coverImage: '/src/assets/BlogPicture/background.webp'
      }));
    }

    if (originalSlides.length > 1) {
      // 创建循环数组：[..., last, first, second, ..., last, first, ...]
      const cloneCount = Math.ceil(5 / originalSlides.length) * originalSlides.length; // 确保足够多的克隆
      const clonedSlides = [];
      for (let i = 0; i < cloneCount * 3; i++) {
        clonedSlides.push(originalSlides[i % originalSlides.length]);
      }
      slides.value = clonedSlides;
      currentIndex.value = cloneCount; // 从中间的真实幻灯片开始
    } else {
      slides.value = originalSlides;
      currentIndex.value = 0;
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

// 幻灯片导航
const moveTo = (newIndex, direction) => {
  if (isTransitioning.value || slides.value.length <= 1) return;

  isTransitioning.value = true;
  currentIndex.value = newIndex;

  const transitionEndHandler = () => {
    trackRef.value.removeEventListener('transitionend', transitionEndHandler);
    
    const originalLength = slides.value.length / 3;
    let newCurrentIndex = currentIndex.value;

    if (direction === 'next' && currentIndex.value >= originalLength * 2) {
      newCurrentIndex = currentIndex.value - originalLength;
    } else if (direction === 'prev' && currentIndex.value < originalLength) {
      newCurrentIndex = currentIndex.value + originalLength;
    }
    
    if (newCurrentIndex !== currentIndex.value) {
      isTransitioning.value = false;
      currentIndex.value = newCurrentIndex;
    }
    
    // 确保在下一次渲染后才重新启用过渡
    setTimeout(() => {
      isTransitioning.value = false;
    }, 50);
  };

  trackRef.value.addEventListener('transitionend', transitionEndHandler);
  
  // Fallback in case transitionend doesn't fire
  setTimeout(() => {
    transitionEndHandler();
  }, 850); // 略大于动画时间
};

const nextSlide = () => {
  resetAutoPlay();
  moveTo(currentIndex.value + 1, 'next');
};

const prevSlide = () => {
  resetAutoPlay();
  moveTo(currentIndex.value - 1, 'prev');
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
  // 目前画廊功能未实现，可以显示提示或跳转到计划页面
  alert('画廊功能即将上线，敬请期待！');
};

// 自动播放
const startAutoPlay = () => {
  stopAutoPlay(); // 先停止，防止重复
  autoPlayInterval = setInterval(() => {
    if (slides.value.length > 1 && !isTransitioning.value) {
      nextSlide();
    }
  }, 4000); // 每4秒切换
};

const stopAutoPlay = () => {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
  }
};

const resetAutoPlay = () => {
  stopAutoPlay();
  startAutoPlay();
};

// 生命周期
onMounted(() => {
  fetchFeaturedArticles().then(() => {
    startAutoPlay();
  });
});

onUnmounted(() => {
  stopAutoPlay();
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

.carousel-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
}

/* 幻灯片轨道 */
.carousel-track {
  display: flex;
  gap: 0; /* 移除间距，因为只显示一张 */
  width: 100%;
  height: 100%;
  justify-content: flex-start;
}

/* 单个幻灯片 */
.carousel-slide {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
}

.carousel-slide.active {
  opacity: 1;
  z-index: 2;
}

/* 卡片容器 */
.slide-card {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.carousel-slide.active .slide-card {
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
  transition: transform 0.8s ease;
}

.carousel-slide:hover .slide-background {
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

/* 活跃状态指示器 */
.active-indicator {
  position: absolute;
  top: 12px; /* 调整位置 */
  right: 12px;
  width: 6px; /* 减小大小 */
  height: 6px;
  border-radius: 50%;
  background-color: #00ff88;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.6); /* 减小发光效果 */
  z-index: 3;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.2);
  }
}

/* 导航按钮样式 */
.carousel-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px; /* 减小按钮大小 */
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 1rem; /* 减小图标大小 */
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.carousel-nav-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.carousel-nav-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.carousel-nav-prev {
  left: 15px; /* 减少与边缘的距离 */
}

.carousel-nav-next {
  right: 15px;
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
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }
  
  .carousel-nav-prev {
    left: 10px;
  }
  
  .carousel-nav-next {
    right: 10px;
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
    width: 30px;
    height: 30px;
    font-size: 0.8rem;
  }
  
  .carousel-nav-prev {
    left: 8px;
  }
  
  .carousel-nav-next {
    right: 8px;
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
  background: rgba(26, 26, 26, 0.9);
  color: #ffffff;
}

[data-bs-theme="dark"] .carousel-nav-btn:hover {
  background: rgba(26, 26, 26, 1);
}

[data-bs-theme="dark"] .slide-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

[data-bs-theme="dark"] .carousel-slide.active .slide-card {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
</style>
