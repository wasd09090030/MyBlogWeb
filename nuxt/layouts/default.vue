<template>
  <n-config-provider :theme="isDarkMode ? darkTheme : null" :theme-overrides="themeOverrides">
    <n-message-provider>
      <div id="app" :class="['min-vh-100', isDarkMode ? 'dark-theme' : 'light-theme']">
        <SakuraFalling />
        <header class="app-navbar" :class="{ 'navbar-hidden': isNavbarHidden, 'navbar-scrolled': hasScrolled }">
          <div class="navbar-container">
            <NuxtLink to="/" class="navbar-brand">WyrmKk</NuxtLink>
            <nav class="navbar-center-nav d-none d-lg-flex">
              <NuxtLink to="/" class="nav-link">
                <Icon name="house" size="sm" class="me-1" />首页
              </NuxtLink>
              <NuxtLink to="/tutorials" class="nav-link">
                <Icon name="book" size="sm" class="me-1" />教程
              </NuxtLink>
              <NuxtLink to="/about" class="nav-link">
                <Icon name="person-circle" size="sm" class="me-1" />关于站长
              </NuxtLink>
            </nav>
            <n-button 
              quaternary 
              circle 
              class="mobile-menu-btn d-lg-none" 
              @click="showMobileMenu = true"
              aria-label="打开导航菜单"
            >
              <template #icon>
                <Icon name="list" size="lg" />
              </template>
            </n-button>
            <div class="navbar-right-buttons d-none d-lg-flex">
              <n-button 
                quaternary 
                circle 
                @click="toggleTheme" 
                class="theme-toggle-btn"
                :aria-label="isDarkMode ? '切换到浅色模式' : '切换到深色模式'"
              >
                <template #icon>
                  <Icon :name="isDarkMode ? 'sun-fill' : 'moon-fill'" size="md" :solid="true" />
                </template>
              </n-button>
              <SearchBar />
            </div>
          </div>
        </header>
        <n-drawer v-model:show="showMobileMenu" :width="280" placement="left">
          <n-drawer-content title="导航菜单" closable>
            <n-menu :options="mobileMenuOptions" @update:value="handleMobileMenuSelect" />
            <template #footer>
              <div class="mobile-drawer-footer">
                <n-button block @click="toggleTheme">
                  <template #icon>
                    <Icon :name="isDarkMode ? 'sun-fill' : 'moon-fill'" size="md" :solid="true" />
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
                  <div class="sidebar-content"><SideBar /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <footer v-if="!isGalleryRoute" class="blog-footer">
          <div class="footer-content">
            <div class="footer-links">
              <a href="https://www.naiveui.com/" target="_blank" rel="noopener noreferrer" class="footer-link" title="Naive UI">
                <!-- Naive UI Logo -->
                <svg class="footer-icon" viewBox="0 0 128 128" fill="currentColor">
                  <path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64 64-28.7 64-64S99.3 0 64 0zm0 16c26.5 0 48 21.5 48 48S90.5 112 64 112 16 90.5 16 64 37.5 16 64 16zm0 16c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm0 16c8.8 0 16 7.2 16 16s-7.2 16-16 16-16-7.2-16-16 7.2-16 16-16z"/>
                </svg>
                <span class="footer-link-text">Naive UI</span>
              </a>
              <span class="footer-divider">·</span>
              <a href="https://nuxt.com/" target="_blank" rel="noopener noreferrer" class="footer-link" title="Nuxt">
                <!-- Nuxt Logo -->
                <svg class="footer-icon" viewBox="0 0 400 400" fill="currentColor">
                  <path d="M227.92 376H387.24C392.398 375.997 397.44 374.58 401.802 371.908C406.163 369.236 409.678 365.413 412 360.87C414.35 356.29 415.472 351.153 415.252 345.988C415.033 340.824 413.48 335.806 410.75 331.45L316.36 170.55C314.053 166.039 310.57 162.249 306.258 159.59C301.946 156.931 297.001 155.511 291.95 155.511C286.899 155.511 281.954 156.931 277.642 159.59C273.33 162.249 269.847 166.039 267.54 170.55L227.92 239.63L150.4 105.13C148.062 100.633 144.557 96.8614 140.232 94.2179C135.906 91.5743 130.929 90.1584 125.85 90.1584C120.77 90.1584 115.794 91.5743 111.468 94.2179C107.143 96.8614 103.638 100.633 101.3 105.13L4.25002 331.45C1.52009 335.806 -0.0328073 340.824 -0.25222 345.988C-0.471633 351.153 0.650403 356.29 3.00002 360.87C5.32166 365.413 8.83682 369.236 13.1982 371.908C17.5596 374.58 22.6025 375.997 27.76 376H116.68C152.24 376 178.57 359.4 196.97 327.17L266.71 205.71L291.92 163.75L365.71 289.5H266.71L227.92 376ZM115.2 289.44L49.75 289.5L125.86 156.32L164.06 223.83L115.2 289.44Z"/>
                </svg>
                <span class="footer-link-text">Nuxt</span>
              </a>
              <span class="footer-divider">·</span>
              <a href="https://github.com/" target="_blank" rel="noopener noreferrer" class="footer-link" title="GitHub">
                <!-- GitHub Logo -->
                <svg class="footer-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
            <div class="footer-copyright">
              © {{ new Date().getFullYear() }} WyrmKk · Built with ❤️
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

const showMobileMenu = ref(false)

// 导航栏滚动隐藏/显示逻辑
const isNavbarHidden = ref(false)
const hasScrolled = ref(false)
const lastScrollY = ref(0)
const scrollThreshold = 60 // 滚动超过此值才触发隐藏

const handleScroll = () => {
  const currentScrollY = window.scrollY
  
  // 是否已滚动（用于添加阴影效果）
  hasScrolled.value = currentScrollY > 10
  
  // 在页面顶部时始终显示
  if (currentScrollY < scrollThreshold) {
    isNavbarHidden.value = false
    lastScrollY.value = currentScrollY
    return
  }
  
  // 计算滚动差值
  const scrollDiff = currentScrollY - lastScrollY.value
  
  // 向下滚动超过阈值时隐藏
  if (scrollDiff > 5) {
    isNavbarHidden.value = true
  }
  // 向上滚动时显示
  else if (scrollDiff < -5) {
    isNavbarHidden.value = false
  }
  
  lastScrollY.value = currentScrollY
}

const themeOverrides = computed(() => ({
  common: {
    primaryColor: '#646cff',
    primaryColorHover: '#747bff',
    primaryColorPressed: '#535bf2'
  },
  Dropdown: {
    borderRadius: '12px',
    padding: '6px',
    optionBorderRadius: '8px'
  }
}))

const categoryOptions = [
  { label: '全部', key: 'all' },
  { label: '学习', key: 'study' },
  { label: '游戏', key: 'game' },
  { label: '个人作品', key: 'work' },
  { label: '资源分享', key: 'resource' }
]

const mobileMenuOptions = computed(() => [
  {
    label: '首页',
    key: 'home',
    icon: () => h(resolveComponent('Icon'), { name: 'house', size: 'sm' })
  },
  {
    label: '教程',
    key: 'tutorials',
    icon: () => h(resolveComponent('Icon'), { name: 'book', size: 'sm' })
  },
  {
    label: '关于站长',
    key: 'about',
    icon: () => h(resolveComponent('Icon'), { name: 'person-circle', size: 'sm' })
  }
])

const handleCategorySelect = (key) => {
  if (key === 'all') {
    router.push({ path: '/' })
  } else {
    router.push({ path: '/', query: { category: key } })
  }
}

const handleMobileMenuSelect = (key) => {
  showMobileMenu.value = false
  if (key === 'home') {
    router.push('/')
  } else if (key === 'tutorials') {
    router.push('/tutorials')
  } else if (key === 'about') {
    router.push('/about')
  }
}

const shouldShowWelcomeSection = computed(() => route.path === '/' && !route.query.search && !route.query.category)
const isGalleryRoute = computed(() => route.path === '/gallery')
const isArticleDetailRoute = computed(() => route.path.startsWith('/article/'))
const isAboutRoute = computed(() => route.path === '/about')
const isTutorialsRoute = computed(() => route.path === '/tutorials')
const showSidebar = computed(() => !isGalleryRoute.value && !isArticleDetailRoute.value && !isAboutRoute.value)

onMounted(() => {
  initTheme()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
<style scoped>

.dark-theme {
  background-color: rgba(89, 101, 172, 0.05);
  color: var(--text-primary);
}
#app {
  transition: background-color 0.3s ease, color 0.3s ease;
}
.app-navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--navbar-bg, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color, #e5e5e5);
  padding: 0.2rem 1rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              background-color 0.3s ease, 
              box-shadow 0.3s ease;
}

.app-navbar.navbar-hidden {
  transform: translateY(-100%);
}

.app-navbar.navbar-scrolled {
  /* box-shadow removed */
}

.dark-theme .app-navbar.navbar-scrolled {
  /* box-shadow removed */
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
  position: relative;
}
.navbar-brand {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color, #0099ff);
  text-decoration: none;
  transition: color 0.2s;
}
.navbar-brand:hover {
  color: var(--primary-color-hover, #3456ff);
}
.navbar-center-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1.25rem;
  color: var(--text-primary, #374151);
  text-decoration: none;
  border-radius: 0.625rem;
  font-weight: 500;
  font-size: 1.1rem;
  background: transparent;
  border: none;
  font-family: inherit;
  line-height: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: rgba(100, 108, 255, 0.08);
  color: var(--primary-color, #3456ff);
}

.nav-link:active {
  background: rgba(100, 108, 255, 0.12);
}

/* 焦点样式 */
.nav-link:focus-visible {
  outline: 2px solid var(--primary-color, #3456ff);
  outline-offset: 3px;
  border-radius: 0.625rem;
}

/* 深色主题 */
.dark-theme .nav-link {
  color: var(--text-primary-dark, #e5e7eb);
}

.dark-theme .nav-link:hover {
  background: rgba(100, 108, 255, 0.15);
  color: var(--primary-color-hover, #1d33ff);
}

.dark-theme .nav-link:active {
  background: rgba(100, 108, 255, 0.2);
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

/* Main Container */
.main-container {
  margin-bottom: 3rem;
}

/* Footer Styles */
.blog-footer {
  margin-top: auto;
  padding: 1.5rem 1rem;
  border-top: 1px solid var(--border-color, #e5e5e5);
  background: var(--footer-bg, rgba(249, 250, 251, 0.8));
  backdrop-filter: blur(8px);
  position: relative;
  z-index: 10;
}

.dark-theme .blog-footer {
  border-top-color: var(--border-color-dark, #333);
  background: var(--footer-bg-dark, rgba(30, 30, 30, 0.8));
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--text-secondary, #6b7280);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.footer-link:hover {
  color: var(--primary-color, #646cff);
  background-color: rgba(100, 108, 255, 0.1);
}

.footer-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

.dark-theme .footer-link {
  color: var(--text-secondary-dark, #9ca3af);
}

.dark-theme .footer-link:hover {
  color: var(--primary-color, #646cff);
  background-color: rgba(100, 108, 255, 0.15);
}

.footer-link-icon {
  font-size: 1.125rem;
}

.footer-divider {
  color: var(--text-tertiary, #9ca3af);
  font-size: 0.875rem;
  user-select: none;
}

.dark-theme .footer-divider {
  color: var(--text-tertiary-dark, #6b7280);
}

.footer-copyright {
  font-size: 0.8125rem;
  color: var(--text-tertiary, #9ca3af);
  letter-spacing: 0.01em;
}

.dark-theme .footer-copyright {
  color: var(--text-tertiary-dark, #6b7280);
}

@media (max-width: 576px) {
  .footer-links {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>