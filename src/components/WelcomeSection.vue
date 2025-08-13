<template>
  <div class="carousel-section">
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
      <div class="carousel-track" :style="{ transform: `translateX(${centerOffset})` }" :class="{ 'no-transition': !isTransitioning }">
        <!-- 克隆最后一张（放在开头） -->
        <div 
          v-if="originalSlides.length > 0"
          class="carousel-slide clone-slide"
          @click="goToArticle(originalSlides[originalSlides.length - 1].id)"
        >
          <div class="slide-card">
            <div 
              class="slide-background"
              :style="{ backgroundImage: `url(${originalSlides[originalSlides.length - 1].coverImage})` }"
            ></div>
            <div class="slide-gradient"></div>
            <div class="slide-content">
              <div class="slide-category">{{ getCategoryName(originalSlides[originalSlides.length - 1].category) }}</div>
              <h3 class="slide-title">{{ originalSlides[originalSlides.length - 1].title }}</h3>
            </div>
          </div>
        </div>
        
        <!-- 原始幻灯片 -->
        <div 
          v-for="(slide, index) in originalSlides" 
          :key="slide.id"
          class="carousel-slide"
          :class="{
            'active': index === currentSlide - 1 && !isTransitioning
          }"
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
            <div class="active-indicator" v-if="index === currentSlide - 1 && !isTransitioning"></div>
          </div>
        </div>
        
        <!-- 克隆第一张（放在末尾） -->
        <div 
          v-if="originalSlides.length > 0"
          class="carousel-slide clone-slide"
          @click="goToArticle(originalSlides[0].id)"
        >
          <div class="slide-card">
            <div 
              class="slide-background"
              :style="{ backgroundImage: `url(${originalSlides[0].coverImage})` }"
            ></div>
            <div class="slide-gradient"></div>
            <div class="slide-content">
              <div class="slide-category">{{ getCategoryName(originalSlides[0].category) }}</div>
              <h3 class="slide-title">{{ originalSlides[0].title }}</h3>
            </div>
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

// 响应式数据
const slides = ref([]);
const originalSlides = ref([]); // 存储原始幻灯片数据
const currentSlide = ref(0);
const isTransitioning = ref(false); // 是否正在过渡中
let autoPlayInterval = null;

// 计算幻灯片宽度
const slideWidth = computed(() => {
  // 大屏幕：40% 屏幕宽度，小屏幕：90% 屏幕宽度
  if (typeof window !== 'undefined') {
    if (window.innerWidth >= 768) {
      return window.innerWidth * 0.4; // 40% 屏幕宽度
    }
    return window.innerWidth * 0.9; // 小屏幕90%宽度
  }
  return 400; // 默认值
});

// 计算居中偏移
const centerOffset = computed(() => {
  if (typeof window !== 'undefined' && originalSlides.value.length > 0) {
    if (window.innerWidth >= 768) {
      // 大屏幕：每张幻灯片40vw + 10px间距
      // currentSlide从1开始（因为索引0是克隆的最后一张）
      return `calc(50% - ${currentSlide.value * 40}vw - ${(currentSlide.value - 0.5) * 10}px)`;
    } else {
      // 小屏幕：每张幻灯片90vw + 10px间距
      return `calc(50% - ${currentSlide.value * 90}vw - ${(currentSlide.value - 0.5) * 10}px)`;
    }
  }
  return 'translateX(0)';
});

// 获取文章数据
const fetchFeaturedArticles = async () => {
  try {
    const articles = await articleService.getArticles();
    // 过滤有封面图的文章，随机选择5篇
    const articlesWithCover = articles.filter(article => article.coverImage);
    if (articlesWithCover.length > 0) {
      // 随机打乱并取前5个
      const shuffled = articlesWithCover.sort(() => 0.5 - Math.random());
      originalSlides.value = shuffled.slice(0, Math.min(5, shuffled.length));
    } else {
      // 如果没有封面图，使用默认背景
      originalSlides.value = articles.slice(0, 3).map(article => ({
        ...article,
        coverImage: '/src/assets/BlogPicture/background.webp'
      }));
    }
    // 初始化当前幻灯片索引（从1开始，因为0是克隆的最后一张）
    currentSlide.value = 1;
  } catch (error) {
    console.error('获取推荐文章失败:', error);
    // 设置默认幻灯片
    originalSlides.value = [{
      id: 0,
      title: '欢迎访问我的博客',
      category: 'other',
      coverImage: '/src/assets/BlogPicture/background.webp'
    }];
    currentSlide.value = 1;
  }
};

// 幻灯片导航
const nextSlide = () => {
  if (originalSlides.value.length === 0 || isTransitioning.value) return;
  
  isTransitioning.value = true;
  currentSlide.value++;
  
  // 如果到达克隆的第一张（在末尾），瞬间重置到真正的第一张
  if (currentSlide.value > originalSlides.value.length) {
    setTimeout(() => {
      const track = document.querySelector('.carousel-track');
      if (track) {
        track.classList.add('no-transition');
        currentSlide.value = 1;
        setTimeout(() => {
          track.classList.remove('no-transition');
          isTransitioning.value = false;
        }, 50);
      }
    }, 600);
  } else {
    setTimeout(() => {
      isTransitioning.value = false;
    }, 600);
  }
};

const prevSlide = () => {
  if (originalSlides.value.length === 0 || isTransitioning.value) return;
  
  isTransitioning.value = true;
  currentSlide.value--;
  
  // 如果到达克隆的最后一张（在开头），瞬间重置到真正的最后一张
  if (currentSlide.value < 1) {
    setTimeout(() => {
      const track = document.querySelector('.carousel-track');
      if (track) {
        track.classList.add('no-transition');
        currentSlide.value = originalSlides.value.length;
        setTimeout(() => {
          track.classList.remove('no-transition');
          isTransitioning.value = false;
        }, 50);
      }
    }, 600);
  } else {
    setTimeout(() => {
      isTransitioning.value = false;
    }, 600);
  }
};

const goToSlide = (index) => {
  if (originalSlides.value.length === 0) return;
  isTransitioning.value = true;
  currentSlide.value = index + 1; // 加1是因为索引0是克隆的最后一张
  setTimeout(() => {
    isTransitioning.value = false;
  }, 600);
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
  autoPlayInterval = setInterval(() => {
    if (originalSlides.value.length > 0 && !isTransitioning.value) {
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
  gap: 10px; /* 统一10px间距 */
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  height: 100%;
  justify-content: flex-start;
}

.carousel-track.no-transition {
  transition: none;
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

.carousel-slide.prev,
.carousel-slide.next {
  opacity: 1; /* 移除透明度差异 */
}

/* 克隆幻灯片样式 */
.carousel-slide.clone-slide {
  opacity: 1; /* 克隆幻灯片也保持完全不透明 */
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
