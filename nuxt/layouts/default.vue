<template>
  <div class="app-layout">
    <!-- 导航栏 -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary sticky-top">
      <div class="container">
        <NuxtLink to="/" class="navbar-brand d-flex align-items-center">
          <img src="/icon/IcBaselineLibraryBooks.svg" alt="Logo" width="30" height="30" class="me-2">
          <span>My Blog</span>
        </NuxtLink>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <NuxtLink to="/" class="nav-link">
                <i class="bi bi-house me-1"></i>首页
              </NuxtLink>
            </li>
            <li class="nav-item">
              <NuxtLink to="/gallery" class="nav-link">
                <i class="bi bi-images me-1"></i>画廊
              </NuxtLink>
            </li>
          </ul>

          <!-- 搜索栏 -->
          <SearchBar class="d-none d-lg-block" />

          <!-- 移动端搜索按钮 -->
          <button class="btn btn-outline-light d-lg-none ms-2" @click="showMobileSearch = !showMobileSearch">
            <i class="bi bi-search"></i>
          </button>
        </div>
      </div>

      <!-- 移动端搜索栏 -->
      <div v-if="showMobileSearch" class="mobile-search bg-light p-3 border-top">
        <SearchBar @search="handleMobileSearch" />
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 欢迎区域 - 仅首页显示 -->
      <WelcomeSection v-if="route.path === '/'" class="mb-5" />

      <!-- 页面内容 -->
      <slot />
    </main>

    <!-- 页脚 -->
    <footer class="bg-dark text-light py-4 mt-5">
      <div class="container">
        <div class="row">
          <div class="col-md-6">
            <h5 class="mb-3">My Blog</h5>
            <p class="text-muted">分享技术、生活和思考的个人博客</p>
          </div>
          <div class="col-md-6">
            <h5 class="mb-3">联系方式</h5>
            <div class="d-flex gap-3">
              <a href="#" class="text-light text-decoration-none">
                <i class="bi bi-github fs-5"></i>
              </a>
              <a href="#" class="text-light text-decoration-none">
                <i class="bi bi-envelope fs-5"></i>
              </a>
              <a href="#" class="text-light text-decoration-none">
                <i class="bi bi-twitter fs-5"></i>
              </a>
            </div>
          </div>
        </div>
        <hr class="my-4 border-secondary">
        <div class="text-center text-muted">
          <small>&copy; 2024 My Blog. All rights reserved.</small>
        </div>
      </div>
    </footer>

    <!-- 返回顶部按钮 -->
    <button
      v-if="showBackToTop"
      class="back-to-top btn btn-primary position-fixed bottom-0 end-0 m-3"
      @click="scrollToTop"
    >
      <i class="bi bi-arrow-up"></i>
    </button>

    <!-- 背景音乐播放器 -->
    <MusicPlayer />
  </div>
</template>

<script setup>
import SearchBar from '~/components/SearchBar.vue'
import WelcomeSection from '~/components/WelcomeSection.vue'
import MusicPlayer from '~/components/MusicPlayer.vue'

// 响应式数据
const route = useRoute()
const showMobileSearch = ref(false)
const showBackToTop = ref(false)

// 处理移动端搜索
const handleMobileSearch = (keyword) => {
  showMobileSearch.value = false
  if (keyword) {
    navigateTo({ path: '/', query: { search: keyword } })
  }
}

// 返回顶部
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 监听滚动事件
const handleScroll = () => {
  showBackToTop.value = window.pageYOffset > 300
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)

  // 初始化Bootstrap组件
  if (typeof bootstrap !== 'undefined') {
    // 初始化所有tooltip
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// 页面切换时关闭移动端搜索
watch(() => route.path, () => {
  showMobileSearch.value = false
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 1rem;
}

.navbar-brand {
  font-weight: 600;
  transition: transform 0.3s ease;
}

.navbar-brand:hover {
  transform: scale(1.05);
}

.nav-link {
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  font-weight: 600;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: white;
  border-radius: 2px;
}

.mobile-search {
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-to-top {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
  z-index: 1000;
}

.back-to-top:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

footer a {
  transition: all 0.3s ease;
}

footer a:hover {
  color: #0d6efd !important;
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding-top: 0.5rem;
  }
}
</style>