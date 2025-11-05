<template>
  <div id="app" :class="['min-vh-100', isDarkMode ? 'dark-theme' : 'light-theme']">
    <!-- 导航栏 - 在画廊页面隐藏 -->
    <SakuraFalling />
    <nav :class="['navbar navbar-expand-lg transition-all', isDarkMode ? 'navbar-dark' : 'navbar-light', navbarClass, navbarAnimationClass]" ref="navbar">
      <div class="container-fluid d-flex align-items-center">
        <router-link to="/" class="navbar-brand">WyrmKk</router-link>
        
        <!-- 中间导航项 - 居中显示 -->
        <div class="navbar-center-nav d-none d-lg-flex">
          <router-link to="/" class="nav-link" active-class="active">
            <img src="./assets/icon/home.svg" alt="首页" class="nav-icon me-1" width="16" height="16">
            首页
          </router-link>
          <div class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="categoryDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              分类
            </a>
            <ul class="dropdown-menu" aria-labelledby="categoryDropdown">
              <li><a class="dropdown-item" href="#" @click="filterByCategory(null)">全部</a></li>
              <li><a class="dropdown-item" href="#" @click="filterByCategory('study')">学习</a></li>
              <li><a class="dropdown-item" href="#" @click="filterByCategory('game')">游戏</a></li>
              <li><a class="dropdown-item" href="#" @click="filterByCategory('work')">个人作品</a></li>
              <li><a class="dropdown-item" href="#" @click="filterByCategory('resource')">资源分享</a></li>
            </ul>
          </div>
          <router-link to="/gallery" class="nav-link" active-class="active">画廊</router-link>
        </div>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <!-- 移动端导航 -->
          <ul class="navbar-nav d-lg-none">
            <li class="nav-item">
              <router-link to="/" class="nav-link" active-class="active">
                <img src="./assets/icon/home.svg" alt="首页" class="nav-icon me-1" width="16" height="16">
                首页
              </router-link>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="categoryDropdownMobile" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                分类
              </a>
              <ul class="dropdown-menu" aria-labelledby="categoryDropdownMobile">
                <li><a class="dropdown-item" href="#" @click="filterByCategory(null)">全部</a></li>
                <li><a class="dropdown-item" href="#" @click="filterByCategory('study')">学习</a></li>
                <li><a class="dropdown-item" href="#" @click="filterByCategory('game')">游戏</a></li>
                <li><a class="dropdown-item" href="#" @click="filterByCategory('work')">个人作品</a></li>
                <li><a class="dropdown-item" href="#" @click="filterByCategory('resource')">资源分享</a></li>
              </ul>
            </li>
            <li class="nav-item">
              <router-link to="/gallery" class="nav-link" active-class="active">画廊</router-link>
            </li>
            <li class="nav-item">
              <div class="mobile-search-wrapper">
                <SearchBar />
              </div>
            </li>
          </ul>
        </div>
        
        <!-- 右侧按钮组 -->
        <div class="navbar-right-buttons d-none d-lg-flex">
          <button class="btn btn-link nav-link border-0 bg-transparent theme-toggle-btn" @click="toggleDarkMode">
            <i :class="isDarkMode ? 'bi bi-sun-fill' : 'bi bi-moon-fill'"></i>
          </button>
          <SearchBar />
        </div>
      </div>
    </nav>
    
    <!-- 欢迎区域 - 仅在首页和文章列表页显示 -->
     <div class="welcome-section-container" v-if="shouldShowWelcomeSection">
    <WelcomeSection />
    </div>
 
    
    <!-- 主内容区 -->
  <div class="main-container">
    <div class="main-content" :class="{ 'admin-full-width': isAdminRoute }">
      <div class="container-fluid">
        <div class="row">
          <!-- 文章内容区域 -->
          <div class="col-12 col-lg-8 col-xl-9" :class="{ 'col-lg-12 col-xl-12': isAdminRoute || isGalleryRoute || isArticleDetailRoute }">
            <main>
              <!-- 使用 Vue Router 4 推荐的 slot props 语法 -->
              <router-view v-slot="{ Component, route }">
                <KeepAlive :include="cachedComponents">
                  <component :is="Component" :key="getRouteKey(route)" />
                </KeepAlive>
              </router-view>
            </main>
          </div>
          
          <!-- 侧边栏个人信息 - 大屏显示 -->
          <div class="col-lg-4 col-xl-3 d-none d-lg-block sidebar-animate" v-if="!isAdminRoute && !isGalleryRoute && !isArticleDetailRoute">
            <div class="sidebar-content">
              <PersonalInfo />
                <div class="mobile-music-player-container">
                 <MusicPlayer />
             </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    
    <!-- Footer 底部信息 -->
    <footer class="blog-footer" v-if="!isAdminRoute && !isGalleryRoute">
      <div class="footer-content">
        <!-- 底部版权 -->
        <div class="footer-copyright">
          <p class="copyright-text">
            © 2025 WyrmKk Blog. Built with ❤️ using Vue.js & NestJS.
          </p>
          <p class="slogan-text">
            用心分享，共同成长 | 让知识传播得更远
          </p>
        </div>
      </div>
    </footer>
    
    <!-- 移动端个人信息按钮 -->
    <div class="mobile-personal-info d-lg-none" v-if="!isAdminRoute && !isGalleryRoute && !isArticleDetailRoute">
      <PersonalInfo />
    </div>

    <!-- 移动端音乐播放器 - 独立定位 -->
    <div class="mobile-music-player d-lg-none" v-if="!isAdminRoute">
      <MusicPlayer />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SearchBar from './components/SearchBar.vue';
import WelcomeSection from './components/WelcomeSection.vue';
import PersonalInfo from './components/PersonalInfo.vue';
import MusicPlayer from './components/MusicPlayer.vue';
import SakuraFalling from './components/SakuraFalling.vue'; 
import { useKeepAliveManager } from './utils/keepAliveManager.js';
import './App.styles.css'; 

const router = useRouter();
const route = useRoute();

const navbar = ref(null);
const isNavbarVisible = ref(true);
const isAtTop = ref(true);
const mouseAtTop = ref(false);
const lastScrollY = ref(0);
const isDarkMode = ref(false);
const hideTimeout = ref(null);

// 使用 KeepAlive 管理器
const { cachedComponents } = useKeepAliveManager();

// 判断是否为admin路由
const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin');
});

// 判断是否显示WelcomeSection
const shouldShowWelcomeSection = computed(() => {
  // 只在文章列表页（首页）显示，在文章详情页和admin页面不显示
  return route.name === 'ArticleList';
});

// 判断是否为画廊页面
const isGalleryRoute = computed(() => {
  return route.name === 'Gallery';
});

// 判断是否为文章详情页面
const isArticleDetailRoute = computed(() => {
  return route.name === 'ArticleDetail';
});

// 导航栏样式类 - 移除透明/实心切换，始终保持一致样式
const navbarClass = computed(() => {
  return {
    'navbar-fixed': true // 使用固定样式，不再根据滚动位置变化
  };
});

// 导航栏动画类 - 始终可见
const navbarAnimationClass = computed(() => {
  return 'navbar-visible';
});

// 处理滚动事件
const handleScroll = () => {
  const currentScrollY = window.scrollY;
  
  // 检查是否在顶部
  isAtTop.value = currentScrollY < 50;
  
  // 检查滚动方向
  if (currentScrollY > lastScrollY.value && currentScrollY > 100) {
    // 向下滚动，隐藏导航栏
    isNavbarVisible.value = false;
  } else {
    // 向上滚动，显示导航栏
    isNavbarVisible.value = true;
  }
  
  lastScrollY.value = currentScrollY;
};

// 处理鼠标移动事件
const handleMouseMove = (event) => {
  // 扩大响应范围到顶部100px内，并且包括导航栏区域
  const isInTopArea = event.clientY <= 100;
  const navbarElement = navbar.value;
  let isOverNavbar = false;
  
  // 检查鼠标是否在导航栏元素上
  if (navbarElement) {
    const navbarRect = navbarElement.getBoundingClientRect();
    isOverNavbar = event.clientX >= navbarRect.left && 
                   event.clientX <= navbarRect.right && 
                   event.clientY >= navbarRect.top && 
                   event.clientY <= navbarRect.bottom;
  }
  
  // 如果鼠标在顶部区域或导航栏上，显示导航栏
  if (isInTopArea || isOverNavbar) {
    mouseAtTop.value = true;
    // 清除隐藏定时器
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value);
      hideTimeout.value = null;
    }
  } else {
    // 延迟隐藏导航栏，给用户一些缓冲时间
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value);
    }
    hideTimeout.value = setTimeout(() => {
      mouseAtTop.value = false;
      hideTimeout.value = null;
    }, 300); // 300ms延迟
  }
};

// 分类筛选
const filterByCategory = (category) => {
  if (category) {
    router.push({ name: 'ArticleList', query: { category } });
  } else {
    router.push({ name: 'ArticleList' });
  }
};

// 主题切换
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value.toString());
  document.documentElement.setAttribute('data-bs-theme', isDarkMode.value ? 'dark' : 'light');
};

// 获取路由 key，对于需要缓存的组件使用固定 key
const getRouteKey = (route) => {
  // 对于文章列表页面，使用固定的 key 以便缓存
  if (route.name === 'ArticleList') {
    return 'ArticleList';
  }
  // 对于其他页面，使用完整路径作为 key
  return route.fullPath;
};

// 初始化主题
const initTheme = () => {
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme !== null) {
    isDarkMode.value = savedTheme === 'true';
  } else {
    // 检查系统主题偏好
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  document.documentElement.setAttribute('data-bs-theme', isDarkMode.value ? 'dark' : 'light');
};

onMounted(async () => {
  initTheme();
  handleScroll();
});

onUnmounted(() => {
  // 移除滚动和鼠标事件监听器
  // window.removeEventListener('scroll', handleScroll);
  // window.removeEventListener('mousemove', handleMouseMove);
  
  // 清除定时器
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value);
    hideTimeout.value = null;
  }
});
</script>

<style scoped>
@import'./App.styles.css';
</style>
