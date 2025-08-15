<template>
  <div 
    class="carousel-section" 
    @mouseenter="stopAutoPlay" 
    @mouseleave="startAutoPlay"
  >
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
let autoPlayInterval = null;

// 轨道样式
const trackStyle = computed(() => {
  if (slides.value.length === 0) return {};
  
  const slideWidthVW = window.innerWidth >= 768 ? 40 : 90;
  const gap = 10; // in pixels
  
  // 计算偏移量，使当前幻灯片居中
  const offset = `calc(50% - ${currentIndex.value * slideWidthVW}vw - ${currentIndex.value * gap}px - ${slideWidthVW / 2}vw)`;
  
  return {
    transform: `translateX(${offset})`,
    transition: isTransitioning.value ? 'transform 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53)' : 'none'
  };
});

// 获取文章数据
const fetchFeaturedArticles = async () => {
  try {
    const articles = await articleService.getArticles();
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
.carousel-section {
  width: 100%;
  padding: 0;
  position: relative;
  height: 45vh;
  overflow: hidden;
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
  gap: 20px; /* 统一10px间距 */
  width: 100%;
  height: 100%;
  justify-content: flex-start;
}

/* 单个幻灯片 */
.carousel-slide {
  flex-shrink: 0;
  width: 40vw; /* 大屏幕40%屏幕宽度 */
  height: 100%;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1; /* 所有幻灯片都保持完全不透明 */
}

.carousel-slide.active {
  opacity: 1;
  z-index: 2;
}

/* 卡片容器 */
.slide-card {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
  transition: transform 0.6s ease;
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
  padding: 20px;
  z-index: 2;
  color: white;
}

.slide-category {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #ffd700;
  margin-bottom: 8px;
  opacity: 0.9;
}

.slide-title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 12px 0;
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
  top: 15px;
  right: 15px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(0, 255, 136, 0.6);
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
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 1.2rem;
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
  left: 20px;
}

.carousel-nav-next {
  right: 20px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .carousel-slide {
    width: 40vw;
  }
}

@media (max-width: 768px) {
  .carousel-section {
    height: 35vh;
  }
  
  .carousel-slide {
    width: 90vw; /* 小屏幕90%宽度，留点边距 */
  }
  
  .slide-content {
    padding: 15px;
  }
  
  .slide-title {
    font-size: 1.1rem;
  }
  
  .slide-category {
    font-size: 0.7rem;
  }
  
  /* 移动端导航按钮调整 */
  .carousel-nav-btn {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .carousel-nav-prev {
    left: 10px;
  }
  
  .carousel-nav-next {
    right: 10px;
  }
}

@media (max-width: 480px) {
  .carousel-section {
    height: 30vh;
  }
  
  .carousel-slide {
    width: 90vw;
  }
  
  .slide-content {
    padding: 12px;
  }
  
  .slide-title {
    font-size: 1rem;
  }
  
  /* 超小屏幕导航按钮进一步调整 */
  .carousel-nav-btn {
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }
  
  .carousel-nav-prev {
    left: 8px;
  }
  
  .carousel-nav-next {
    right: 8px;
  }
}

/* 暗色主题适配 */
:global(.dark-theme) .slide-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

:global(.dark-theme) .carousel-slide.active .slide-card {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

:global(.dark-theme) .carousel-nav-btn {
  background: rgba(26, 26, 26, 0.9);
  color: #ffffff;
}

:global(.dark-theme) .carousel-nav-btn:hover {
  background: rgba(26, 26, 26, 1);
}
</style>
