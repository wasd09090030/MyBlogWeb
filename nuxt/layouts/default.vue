<template>
  <div id="app" :class="['min-vh-100', isDarkMode ? 'dark-theme' : 'light-theme']">
    <SakuraFalling />
    <nav ref="navbar" :class="['navbar navbar-expand-lg transition-all', isDarkMode ? 'navbar-dark' : 'navbar-light', navbarAnimationClass]">
      <div class="container-fluid d-flex align-items-center">
        <NuxtLink to="/" class="navbar-brand">WyrmKk</NuxtLink>
        <div class="navbar-center-nav d-none d-lg-flex">
          <NuxtLink to="/" class="nav-link"><i class="bi bi-house me-1"></i>首页</NuxtLink>
          <div class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="categoryDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">分类</a>
            <ul class="dropdown-menu" aria-labelledby="categoryDropdown">
              <li><a class="dropdown-item" href="#" @click.prevent="filterByCategory(null)">全部</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="filterByCategory('study')">学习</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="filterByCategory('game')">游戏</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="filterByCategory('work')">个人作品</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="filterByCategory('resource')">资源分享</a></li>
            </ul>
          </div>
          <NuxtLink to="/gallery" class="nav-link">画廊</NuxtLink>
        </div>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav d-lg-none">
            <li class="nav-item"><NuxtLink to="/" class="nav-link"><i class="bi bi-house me-1"></i>首页</NuxtLink></li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="categoryDropdownMobile" role="button" data-bs-toggle="dropdown">分类</a>
              <ul class="dropdown-menu" aria-labelledby="categoryDropdownMobile">
                <li><a class="dropdown-item" href="#" @click.prevent="filterByCategory(null)">全部</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="filterByCategory('study')">学习</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="filterByCategory('game')">游戏</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="filterByCategory('work')">个人作品</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="filterByCategory('resource')">资源分享</a></li>
              </ul>
            </li>
            <li class="nav-item"><NuxtLink to="/gallery" class="nav-link">画廊</NuxtLink></li>
            <li class="nav-item"><div class="mobile-search-wrapper"><SearchBar /></div></li>
          </ul>
        </div>
        <div class="navbar-right-buttons d-none d-lg-flex">
          <button class="btn btn-link nav-link border-0 bg-transparent theme-toggle-btn" @click="toggleTheme">
            <i :class="isDarkMode ? 'bi bi-sun-fill' : 'bi bi-moon-fill'"></i>
          </button>
          <SearchBar />
        </div>
      </div>
    </nav>
    <div v-if="shouldShowWelcomeSection" class="welcome-section-container"><WelcomeSection /></div>
    <div class="main-container">
      <div class="main-content">
        <div class="container-fluid">
          <div class="row">
            <div class="col-12" :class="{ 'col-lg-8 col-xl-9': showSidebar, 'col-lg-12 col-xl-12': !showSidebar }">
              <main><slot /></main>
            </div>
            <div v-if="showSidebar" class="col-lg-4 col-xl-3 d-none d-lg-block sidebar-animate">
              <div class="sidebar-content">
                <PersonalInfo />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <footer v-if="!isGalleryRoute" class="blog-footer">
      <div class="footer-content">
        <div class="footer-copyright">
          <p class="copyright-text">© 2025 WyrmKk Blog. Built with ❤️ using Nuxt.js & Asp.Net Core</p>
          <p class="slogan-text">用心分享，共同成长 | 让知识传播得更远</p>
        </div>
      </div>
    </footer>
    <div v-if="showSidebar" class="mobile-personal-info d-lg-none"><PersonalInfo /></div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()
const { isDarkMode, initTheme, toggleTheme } = useTheme()
const navbar = ref(null)
const isNavbarVisible = ref(true)
const lastScrollY = ref(0)
const mouseAtTop = ref(false)
const hideTimeout = ref(null)
const shouldShowWelcomeSection = computed(() => route.path === '/' && !route.query.search && !route.query.category)
const isGalleryRoute = computed(() => route.path === '/gallery')
const isArticleDetailRoute = computed(() => route.path.startsWith('/article/'))
const showSidebar = computed(() => !isGalleryRoute.value && !isArticleDetailRoute.value)
const navbarAnimationClass = computed(() => (isNavbarVisible.value || mouseAtTop.value) ? 'navbar-visible' : '')
const handleScroll = () => {
  const currentScrollY = window.scrollY
  if (currentScrollY > lastScrollY.value && currentScrollY > 100) {
    isNavbarVisible.value = false
  } else {
    isNavbarVisible.value = true
  }
  lastScrollY.value = currentScrollY
}
const handleMouseMove = (event) => {
  const isInTopArea = event.clientY <= 100
  const navbarElement = navbar.value
  let isOverNavbar = false
  if (navbarElement) {
    const navbarRect = navbarElement.getBoundingClientRect()
    isOverNavbar = event.clientX >= navbarRect.left && event.clientX <= navbarRect.right && event.clientY >= navbarRect.top && event.clientY <= navbarRect.bottom
  }
  if (isInTopArea || isOverNavbar) {
    mouseAtTop.value = true
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value)
      hideTimeout.value = null
    }
  } else {
    if (hideTimeout.value) clearTimeout(hideTimeout.value)
    hideTimeout.value = setTimeout(() => {
      mouseAtTop.value = false
      hideTimeout.value = null
    }, 300)
  }
}
const filterByCategory = (category) => {
  if (category) {
    router.push({ path: '/', query: { category } })
  } else {
    router.push({ path: '/' })
  }
}
onMounted(() => {
  initTheme()
  handleScroll()
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('mousemove', handleMouseMove)
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('mousemove', handleMouseMove)
  if (hideTimeout.value) clearTimeout(hideTimeout.value)
})
</script>

<style scoped>
/* 主题背景 */
.light-theme {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.dark-theme {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

#app {
  transition: background-color 0.3s ease, color 0.3s ease;
}


</style>
