export default defineNuxtConfig({
  devtools: { enabled: true },

  // CSS配置
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    'bootstrap-icons/font/bootstrap-icons.css',
    'github-markdown-css/github-markdown.css',
    'highlight.js/styles/github.css',
    'katex/dist/katex.min.css',
    'swiper/css',
    'swiper/css/navigation',
    'swiper/css/pagination',
    'swiper/css/effect-coverflow',
    'swiper/css/effect-cube',
    '~/assets/css/style.css',
    '~/assets/css/app.css'
  ],

  // 模块配置
  modules: [
    '@pinia/nuxt'
  ],

  // 依赖配置
  build: {
    transpile: ['@popperjs/core', 'bootstrap', 'swiper']
  },

  // Vite配置
  vite: {
    optimizeDeps: {
      include: [
        'bootstrap',
        'bootstrap/dist/js/bootstrap.bundle.min.js',
        '@popperjs/core',
        'highlight.js',
        'markdown-it',
        'swiper',
        'swiper/bundle'
      ]
    },
    define: {
      // 确保Bootstrap在客户端可用
      global: 'globalThis'
    }
  },

  // 运行时配置
  runtimeConfig: {
    // 私有配置（服务器端）
    apiSecret: process.env.API_SECRET,

    // 公共配置（客户端+服务器端）
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },

  // 应用配置
  app: {
    head: {
      title: 'My Blog',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A beautiful blog built with Nuxt 3' },
        { name: 'keywords', content: 'blog, nuxt, vue, frontend' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
        }
      ]
    }
  },

  // 页面配置
  pageTransition: {
    name: 'page',
    mode: 'out-in'
  },

  // 布局配置
  layoutTransition: {
    name: 'layout',
    mode: 'out-in'
  },

  // 实验性功能
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
    viewTransition: true
  },

  // SSR配置
  nitro: {
    preset: 'node-server',
    esbuild: {
      options: {
        target: 'es2020'
      }
    }
  },

  // 兼容性
  compatibility: {
    // Vue 3 兼容性设置
    vue: {
      runtimeCompiler: false
    }
  }
})