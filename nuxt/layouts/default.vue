<template>
  <n-config-provider :theme="isDarkMode ? darkTheme : null" :theme-overrides="themeOverrides">
    <n-message-provider>
      <div id="app" :class="['min-vh-100', isDarkMode ? 'dark-theme' : 'light-theme']">
        <SakuraFalling />
        <!-- 导航�?-->
        <header class="app-navbar">
          <div class="navbar-container">
            <!-- Logo -->
            <NuxtLink to="/" class="navbar-brand">WyrmKk</NuxtLink>
            
            <!-- 桌面端导�?-->
            <nav class="navbar-center-nav d-none d-lg-flex">
              <NuxtLink to="/" class="nav-link">
                <i class="bi bi-house me-1"></i>首页
              </NuxtLink>
              <n-dropdown :options="categoryOptions" @select="handleCategorySelect">
                <a class="nav-link nav-link-dropdown">
                  分类 <i class="bi bi-chevron-down ms-1"></i>
                </a>
              </n-dropdown>
              <NuxtLink to="/gallery" class="nav-link">画廊</NuxtLink>
            </nav>
            
            <!-- 移动端菜单按�?-->
            <n-button quaternary circle class="mobile-menu-btn d-lg-none" @click="showMobileMenu = true">
              <template #icon>
                <i class="bi bi-list fs-4"></i>
              </template>
            </n-button>
            
            <!-- 桌面端右侧按�?-->
            <div class="navbar-right-buttons d-none d-lg-flex">
              <n-button quaternary circle @click="toggleTheme" class="theme-toggle-btn">
                <template #icon>
                  <i :class="isDarkMode ? 'bi bi-sun-fill' : 'bi bi-moon-fill'"></i>
                </template>
              </n-button>
              <SearchBar />
            </div>
          </div>
        </header>
        
        <!-- 移动端抽屉菜�?-->
        <n-drawer v-model:show="showMobileMenu" :width="280" placement="left">
          <n-drawer-content title="导航菜单" closable>
            <n-menu
              :options="mobileMenuOptions"
              @update:value="handleMobileMenuSelect"
            />
            <template #footer>
              <div class="mobile-drawer-footer">
                <n-button block @click="toggleTheme">
                  <template #icon>
                    <i :class="isDarkMode ? 'bi bi-sun-fill' : 'bi bi-moon-fill'"></i>
                  </template>
                  {{ isDarkMode ? '浅色模式' : '深色模式' }}
                </n-button>
              </div>
            </template>
          </n-drawer-content>
        </n-drawer>
        
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
                    <SideBar />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <footer v-if="!isGalleryRoute" class="blog-footer">
          <div class="footer-content">
            <div class="footer-copyright">
              <p class="copyright-text">© 2025 WyrmKk Blog. Built with ❤️ using Nuxt.js & Asp.Net Core8.0</p>
              <p class="slogan-text">用心分享，共同成�?| 让知识传播得更远</p>
            </div>
          </div>
        </footer>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { darkTheme } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const { isDarkMode, initTheme, toggleTheme } = useTheme()

// 移动端菜单状�?
const showMobileMenu = ref(false)

// Naive UI 主题覆盖配置
const themeOverrides = computed(() => ({
  common: {
    primaryColor: '#646cff',
    primaryColorHover: '#747bff',
    primaryColorPressed: '#535bf2'
  }
}))

// 分类下拉菜单选项
const categoryOptions = [
  { label: '全部', key: 'all' },
  { label: '学习', key: 'study' },
  { label: '游戏', key: 'game' },
  { label: '个人作品', key: 'work' },
  { label: '资源分享', key: 'resource' }
]

// 移动端菜单选项
const mobileMenuOptions = computed(() => [
  {
    label: '首页',
    key: 'home',
    icon: () => h('i', { class: 'bi bi-house' })
  },
  {
    label: '分类',
    key: 'category',
    icon: () => h('i', { class: 'bi bi-folder' }),
    children: [
      { label: '全部', key: 'category-all' },
      { label: '学习', key: 'category-study' },
      { label: '游戏', key: 'category-game' },
      { label: '个人作品', key: 'category-work' },
      { label: '资源分享', key: 'category-resource' }
    ]
  },
  {
    label: '画廊',
    key: 'gallery',
    icon: () => h('i', { class: 'bi bi-images' })
  }
])

// 处理分类选择
const handleCategorySelect = (key) => {
  if (key === 'all') {
    router.push({ path: '/' })
  } else {
    router.push({ path: '/', query: { category: key } })
  }
}

// 处理移动端菜单选择
const handleMobileMenuSelect = (key) => {
  showMobileMenu.value = false
  
  if (key === 'home') {
    router.push('/')
  } else if (key === 'gallery') {
    router.push('/gallery')
  } else if (key.startsWith('category-')) {
    const category = key.replace('category-', '')
    if (category === 'all') {
      router.push({ path: '/' })
    } else {
      router.push({ path: '/', query: { category } })
    }
  }
}

const shouldShowWelcomeSection = computed(() => route.path === '/' && !route.query.search && !route.query.category)
const isGalleryRoute = computed(() => route.path === '/gallery')
const isArticleDetailRoute = computed(() => route.path.startsWith('/article/'))
const isAboutRoute = computed(() => route.path === '/about')
const showSidebar = computed(() => !isGalleryRoute.value && !isArticleDetailRoute.value && !isAboutRoute.value)

onMounted(() => {
  initTheme()
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

/* 导航栏样�?*/
.app-navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--navbar-bg, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color, #e5e5e5);
  padding: 0.5rem 1rem;
  transition: all 0.3s ease;
}

.dark-theme .app-navbar {
  background: var(--navbar-bg-dark, rgba(30, 30, 30, 0.95));
  border-bottom-color: var(--border-color-dark, #333);
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color, #646cff);
  text-decoration: none;
  transition: color 0.2s;
}

.navbar-brand:hover {
  color: var(--primary-color-hover, #747bff);
}

.navbar-center-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-link:hover {
  background: var(--hover-bg, rgba(0, 0, 0, 0.05));
  color: var(--primary-color, #646cff);
}

.dark-theme .nav-link:hover {
  background: var(--hover-bg-dark, rgba(255, 255, 255, 0.1));
}

.nav-link-dropdown {
  cursor: pointer;
}

.navbar-right-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-toggle-btn {
  font-size: 1.1rem;
}

.mobile-menu-btn {
  font-size: 1.5rem;
}

.mobile-drawer-footer {
  padding: 1rem;
}

/* 响应式隐藏类 */
@media (min-width: 992px) {
  .d-lg-none {
    display: none !important;
  }
}

@media (max-width: 991.98px) {
  .d-none.d-lg-flex {
    display: none !important;
  }
}
</style>

