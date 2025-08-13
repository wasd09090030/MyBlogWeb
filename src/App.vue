<template>
  <div id="app" :class="['min-vh-100', isDarkMode ? 'dark-theme' : 'light-theme']">
    <!-- 导航栏 -->
    <nav :class="['navbar navbar-expand-lg transition-all', isDarkMode ? 'navbar-dark' : 'navbar-light', navbarClass, navbarAnimationClass]" ref="navbar">
      <div class="container-fluid d-flex align-items-center">
        <router-link to="/" class="navbar-brand">WyrmKk</router-link>
        <router-link to="/" class="nav-link" active-class="active">首页</router-link>
        <!-- 搜索栏 - 真正居中显示 -->
        <div class="navbar-search-center d-none d-lg-flex">
          <SearchBar />
        </div>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <!-- 移动端搜索栏 -->
          <div class="d-lg-none my-3">
            <SearchBar />
          </div>
          
          <ul class="navbar-nav ms-auto align-items-center">
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="categoryDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                文章分类
              </a>
              <ul class="dropdown-menu" aria-labelledby="categoryDropdown">
                <li><a class="dropdown-item" href="#" @click="filterByCategory(null)">全部</a></li>
                <li><a class="dropdown-item" href="#" @click="filterByCategory('study')">学习</a></li>
                <li><a class="dropdown-item" href="#" @click="filterByCategory('game')">游戏</a></li>
                <li><a class="dropdown-item" href="#" @click="filterByCategory('work')">个人作品</a></li>
                <li><a class="dropdown-item" href="#" @click="filterByCategory('resource')">资源分享</a></li>
              </ul>
            </li>
            <li class="nav-item">
              <button class="btn btn-link nav-link border-0 bg-transparent" @click="toggleDarkMode">
                <i :class="isDarkMode ? 'bi bi-sun-fill' : 'bi bi-moon-fill'"></i>
              </button>
            </li>
          </ul>
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
          <div class="col-12 col-lg-8 col-xl-9" :class="{ 'col-lg-12 col-xl-12': isAdminRoute }">
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
          <div class="col-lg-4 col-xl-3 d-none d-lg-block sidebar-animate" v-if="!isAdminRoute">
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
    
    <!-- 移动端个人信息按钮 -->
    <div class="mobile-personal-info d-lg-none" v-if="!isAdminRoute">
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
import { useKeepAliveManager } from './utils/keepAliveManager.js';

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

// 导航栏样式类
const navbarClass = computed(() => {
  return {
    'navbar-transparent': isAtTop.value,
    'navbar-solid': !isAtTop.value
  };
});

// 导航栏动画类
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

onMounted(() => {
  initTheme();
  // 移除滚动和鼠标事件监听器，因为导航栏现在是静态的
  // window.addEventListener('scroll', handleScroll);
  // window.addEventListener('mousemove', handleMouseMove);
  
  // 初始化滚动位置
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
/* 全局body背景 - 与App内容形成对比 */
:global(body) {
  background: linear-gradient(135deg, #667eea 0%, #69686b 100%);
  min-height: 100vh;
  transition: background 0.3s ease;
}

/* 暗色主题的body背景 */
:global(.dark-theme body) {
  background: linear-gradient(135deg, #a8a8c0 0%, #e5e5e7 100%)!important;
}

/* 全局样式 */
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 主题样式 */
.light-theme {
  background-color: #f8f9fa;
  color: #212529;
}

.dark-theme {
  background-color: #96ffda79;
  color: #ffffff;
}

/* 导航栏样式 */
.navbar {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 1030;
  transition: all 0.3s ease-in-out;
  position: fixed; /* 固定定位 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左对齐 */
  right: 0; /* 右对齐，实现全宽 */
  width: 100%; /* 确保全宽 */
  padding: 0.3rem 1rem; /* 减少上下内边距，让导航栏更窄 */
  min-height: 50px; /* 设置最小高度 */
}

.navbar-visible {
  /* 保留类名但移除动画，因为导航栏现在固定显示 */
  opacity: 1;
}

.transition-all {
  transition: all 0.3s ease-in-out;
}

/* 亮色主题导航栏 - 天蓝色 */
.light-theme .navbar-transparent {
  background: linear-gradient(rgb(255, 255, 255), rgb(255, 255, 255));
  box-shadow: none;
}

.light-theme .navbar-solid {
  background: linear-gradient(rgba(69, 85, 210, 0.85), rgba(69, 85, 210, 0.85));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 暗色主题导航栏 */
.dark-theme .navbar-transparent {
  background: linear-gradient(rgba(13, 110, 253, 0.1), rgba(13, 110, 253, 0.05)) !important;
  box-shadow: none;
}

.dark-theme .navbar-solid {
   background: linear-gradient(rgba(13, 110, 253, 0.1), rgba(13, 110, 253, 0.05)) !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar-brand {
  font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #4eaaf6;
  padding-left: 10%;
  padding-top: 0.5rem; /* 调整上内边距 */
  padding-bottom: 0.5rem; /* 调整下内边距 */
  font-size: 1.2rem; /* 稍微减小字体 */
}

.nav-link.active {
  font-weight: bold;
}

.navbar-nav .nav-link {
    font-weight: 500; 
    padding-top: 0.5rem; /* 减少内边距 */
    margin: 0 0.2rem; /* 减少外边距 */
    position: relative;
    font-size: 1.2rem; /* 稍微减小字体 */
    border-radius: 4px; 
}

/* 搜索栏样式 */
.navbar-search-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 400px;
  width: 100%;
}

.navbar-search {
  max-width: 400px;
  width: 100%;
}

/* 下拉菜单样式 */
.dropdown-menu {
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.dropdown-item {
  padding: 0.5rem 1rem;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: rgba(13, 110, 253, 0.1);
}

.welcome-section-container {
  padding-top: 70px;
}

.main-container {
  width: 100%;
  margin: 0 auto;
}
/* 主要内容区域 */
.main-content {
  position: relative;
  z-index: 10;
  background-color: var(--bs-body-bg, #ffffff);
  min-height: 100vh;
  padding: 0;
  margin-top: 0;
  box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.15);
  border-radius: 12px 12px 0 0;
  /* 大屏幕限制宽度为70% */
  max-width: 75%;
  margin-left: auto;
  margin-right: auto;
}

/* Admin页面全宽度样式 */
.main-content.admin-full-width {
  max-width: 100%;
  margin-left: 0;
  margin-right: 0;
  border-radius: 0;
  margin-top: 0;
  box-shadow: none;
  padding: 0;
  background-color: transparent;
}

main {
  padding: 0 15px 60px;
  max-width: 100%;
  margin: 0;
}

/* 侧边栏样式 */
.sidebar-content {
  padding: 1.5rem 1rem;
  position: sticky;
  top: 65px; /* 调整为导航栏高度+间距 */
  height: fit-content;
}

/* MusicPlayer容器样式 */
.music-player-container {
  margin-top: 20px;
}

.mobile-music-player-container {
  margin-top: 15px;
  position: relative;
  z-index: 999;
}

/* 移动端个人信息 */
.mobile-personal-info {
  position: fixed;
  bottom: 50%;
  right: 20px;
  z-index: 1025;
}

/* 移动端音乐播放器 */
.mobile-music-player {
  position: fixed;
  bottom: 75px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1020;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

/* 暗色主题下的移动端音乐播放器 */
:global(.dark-theme) .mobile-music-player {
  background-color: rgba(26, 26, 26, 0.95);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .navbar-search-center {
    position: static;
    transform: none;
    max-width: 100%;
  }
  
  .navbar {
    padding: 0.25rem 0.75rem; /* 移动端进一步减少内边距 */
    min-height: 45px; /* 移动端更小的最小高度 */
  }
  
  .navbar-brand {
    font-size: 1rem; /* 移动端更小的字体 */
  }
  
  .navbar-nav .nav-link {
    padding: 0.4rem 0.6rem; /* 移动端更小的内边距 */
    font-size: 0.95rem; /* 移动端更小的字体 */
  }
  
  .main-container {
    padding-top: 55px; /* 移动端调整顶部间距 */
  }
  
  .main-content {
    padding: 1rem 0;
    margin-top: 0;
    /* 移动端恢复全宽 */
    max-width: 100%;
    margin-left: 0;
    margin-right: 0;
    /* 为底部音乐播放器留出更多空间 */
    padding-bottom: 130px;
  }
  
  main {
    padding: 0 10px 40px;
  }
  
  .sidebar-content {
    display: none;
  }
  
  /* 移动端音乐播放器适配 */
  .mobile-music-player {
    bottom: 60px;
    padding: 6px;
  }
  
  .mobile-personal-info {
    right: 15px;
    bottom: 90px;
  }
}

/* 小屏幕进一步优化 */
@media (max-width: 576px) {
  .mobile-music-player {
    bottom: 50px;
    padding: 5px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .mobile-personal-info {
    right: 15px;
    bottom: 90px;
  }
  
  .main-content {
    padding-bottom: 110px;
  }
}

/* 极小屏幕或横屏手机优化 */
@media (max-width: 480px), (max-height: 600px) {
  .mobile-music-player {
    bottom: 40px;
    padding: 4px;
  }
  
  .mobile-personal-info {
    right: 10px;
    bottom: 50%;
  }
  
  .main-content {
    padding-bottom: 100px;
  }
}

/* 中等屏幕调整 */
@media (min-width: 769px) and (max-width: 1199px) {
  .sidebar-content {
    padding: 1.5rem 0.5rem;
  }
  
  .main-content {
    /* 中等屏幕使用85%宽度 */
    max-width: 85%;
  }
}

/* 亮色主题导航栏文字颜色 - 适配白色背景 */
.light-theme .nav-link {
  color: #333333;
}

.light-theme .nav-link:hover {
  color: #555555;
}

/* 暗色主题下的特殊样式 */
:global(.dark-theme) .main-content {
  background-color: #04407b;
  box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4);
}

:global(.dark-theme) .navbar-transparent {
  background: linear-gradient(rgba(33, 37, 41, 0.1), rgba(33, 37, 41, 0.05)) !important;
}

:global(.dark-theme) .navbar-solid {
  background: linear-gradient(rgba(33, 37, 41, 0.95), rgba(33, 37, 41, 0.9)) !important;
}

:global(.dark-theme) .dropdown-menu {
  background-color: #2d3748;
  border: 1px solid #4a5568;
}

:global(.dark-theme) .dropdown-item {
  color: #e2e8f0;
}

:global(.dark-theme) .dropdown-item:hover {
  background-color: rgba(66, 153, 225, 0.2);
  color: #ffffff;
}

/* 自定义动画类替换animate.css */
.navbar-slide-in {
  animation: slideInDown 0.3s ease-out forwards;
}

.navbar-slide-out {
  animation: slideOutUp 0.3s ease-in forwards;
}

.sidebar-animate {
  animation: fadeInUp 0.8s ease-out;
}

@keyframes slideInDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideOutUp {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
}

@keyframes fadeInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeInDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeInLeft {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
