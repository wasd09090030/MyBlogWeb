<template>
  <NuxtLayout>
    <NuxtPage :keepalive="true" :page-key="getPageKey" />
  </NuxtLayout>
</template>

<script setup>
const route = useRoute()

// 获取页面 key - 对于首页使用固定 key 以启用缓存
const getPageKey = (route) => {
  console.log('getPageKey 被调用, route.name:', route.name, 'route.path:', route.path, 'route.fullPath:', route.fullPath)

  // 对于首页（index 页面），使用固定的 key 以便缓存
  if (route.name === 'index') {
    console.log('→ 返回固定 key: index-page')
    return 'index-page'
  }

  // 对于其他页面，使用完整路径作为 key
  console.log('→ 返回动态 key:', route.fullPath)
  return route.fullPath
}

// 应用全局配置
useHead({
  htmlAttrs: {
    lang: 'zh-CN'
  },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'format-detection', content: 'telephone=no' },
    { name: 'description', content: '一个分享技术、生活和资源的个人网站' },
    { name: 'keywords', content: '博客,技术,前端,后端,Vue,JavaScript,Python,动漫资源' },
    { name: 'author', content: 'WASD09090030' },

    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'WyrmKk' },
    { property: 'og:title', content: 'WyrmKk - 个人网站' },
    { property: 'og:description', content: '分享技术、生活和思考的个人博客' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'WyrmKk - 个人技术博客' },
    { name: 'twitter:description', content: '分享技术、生活和思考的个人博客' }
  ],

  // 全局样式
  link: [
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com'
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
    }
  ]
})

// 初始化认证状态
const authStore = useAuthStore()
onMounted(() => {
  authStore.initialize()
})

// 添加路由守卫，处理从 gallery 页面离开时恢复滚动
const router = useRouter()
router.afterEach((to, from) => {
  // 当从 gallery 路由离开时，确保恢复 body 滚动
  if (from.name === 'gallery' && to.name !== 'gallery') {
    document.body.style.overflow = ''
    document.body.style.removeProperty('overflow')
    // 清理可能遗留的标记
    if (window.__galleryOriginalOverflow !== undefined) {
      delete window.__galleryOriginalOverflow
    }
  }
})
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-secondary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 全局动画类 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 自定义选择文本颜色 */
::selection {
  background: #0d6efd;
  color: white;
}

::-moz-selection {
  background: #0d6efd;
  color: white;
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* 图片优化 */
img {
  max-width: 100%;
  height: auto;
}

/* 链接样式 */
a {
  color: #0d6efd;
  text-decoration: none;
  transition: color 0.3s ease;
}

a:hover {
  color: #0a58ca;
}

/* 按钮基础样式 */
.btn {
  transition: all 0.3s ease;
}

.btn:active {
  transform: scale(0.98);
}

/* 卡片阴影效果 */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

/* 表单样式 */
.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* 工具类 */
.text-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

.shadow-custom {
  box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important;
}

/* 响应式隐藏类 */
@media (max-width: 576px) {
  .hide-mobile {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .hide-tablet {
    display: none !important;
  }
}

@media (max-width: 992px) {
  .hide-desktop {
    display: none !important;
  }
}

/* 加载状态 */
.loading {
  pointer-events: none;
  opacity: 0.6;
}

/* 错误状态 */
.error {
  color: #dc3545;
}

/* 成功状态 */
.success {
  color: #198754;
}

/* 警告状态 */
.warning {
  color: #ffc107;
}

/* 信息状态 */
.info {
  color: #0dcaf0;
}

/* 打印样式 */
@media print {
  .no-print {
    display: none !important;
  }

  body {
    background: white !important;
    color: black !important;
  }

  a {
    color: black !important;
    text-decoration: underline !important;
  }
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .btn {
    border-width: 2px !important;
  }

  .card {
    border-width: 2px !important;
  }
}
</style>