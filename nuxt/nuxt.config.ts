export default defineNuxtConfig({
  compatibilityDate: '2025-11-09',
  devtools: { enabled: true },

  // CSS配置 - 使用 Tailwind Typography
  css: [
      '~/assets/css/theme-variables.css', 
    '~/assets/css/tailwind.css', // Tailwind CSS 入口文件
    'katex/dist/katex.min.css', // KaTeX 数学公式样式
    'swiper/css',
    'swiper/css/navigation',
    'swiper/css/pagination',
    'swiper/css/effect-coverflow',
    'swiper/css/effect-cube',
    '~/assets/css/components/prose-custom.css', // 自定义 prose 样式
    '~/assets/css/layout.css', // 自定义布局工具类
    '~/assets/css/style.css',
    '~/assets/css/app.css',
  ],

  // 模块配置
  modules: [
    '@pinia/nuxt',
    'motion-v/nuxt',
    '@bg-dev/nuxt-naiveui', // Naive UI 模块
    '@nuxtjs/mdc' // MDC Markdown 渲染模块
  ],

  // MDC 模块配置
  mdc: {
    highlight: {
      theme: {
        default: 'material-theme-lighter',
        dark: 'material-theme-darker'
      },
      lines: true,
      langs: [
        'javascript',
        'typescript',
        'vue',
        'vue-html',
        'html',
        'css',
        'scss',
        'json',
        'yaml',
        'markdown',
        'bash',
        'shell',
        'python',
        'java',
        'csharp',
        'cpp',
        'c',
        'sql',
        'dockerfile',
        'nginx',
        'xml',
        'diff',
        'dart',
        'rust',
        'go',
        'mermaid'
      ]
    },
    // 数学公式支持
    remarkPlugins: {
      'remark-math': {
        src: 'remark-math',
        options: {
          singleDollarTextMath: true
        }
      }
    },
    rehypePlugins: {
      'rehype-katex': {
        src: 'rehype-katex',
        options: {}
      }
    },
    // 标题锚点链接
    headings: {
      anchorLinks: {
        h1: false,
        h2: true,
        h3: true,
        h4: true,
        h5: false,
        h6: false
      }
    }
  },

  // PostCSS 配置
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  // Naive UI 配置
  naiveui: {
    colorModePreference: 'system',
    iconSize: 18,
    themeConfig: {}
  },

  // 依赖配置
  build: {
    transpile: ['swiper']
  },

  // Vite配置
  vite: {
    optimizeDeps: {
      include: [
        'vue',
        'swiper',
        'swiper/bundle',
        'naive-ui',
        '@heroicons/vue/24/outline',
        '@heroicons/vue/24/solid',
        'katex',
        'motion-v',
        '@vueuse/core',
        'mermaid',
        'remark-math',
        'rehype-katex'
      ]
    },
    define: {
      global: 'globalThis'
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // 生产环境移除 console.log
          drop_debugger: true // 生产环境移除 debugger
        }
      }
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
    // 启用 KeepAlive 以缓存页面状态
    // keepalive: true,

    head: {
      title: 'My Blog',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A beautiful blog built with Nuxt 3' },
        { name: 'keywords', content: 'blog, nuxt, vue, frontend' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/icon/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' }
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
    payloadExtraction: true,
    renderJsonPayloads: true,
    viewTransition: true,
    // 启用内联路由规则
    inlineRouteRules: true
  },

  // 路由配置优化
  routeRules: {
    // 静态资源使用强缓存
    '/icon/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/Picture/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    // API路由配置
    '/api/**': { cors: true }
  },

  // SSR配置
  nitro: {
    preset: 'node-server',
    esbuild: {
      options: {
        target: 'es2020'
      }
    },
    // 启用压缩
    compressPublicAssets: {
      gzip: true,
      brotli: true
    },
    // 优化服务器输出
    minify: true,
    // 禁用预渲染（避免 Nuxt 3.20+ 的 styles.mjs 模块解析问题）
    prerender: {
      crawlLinks: false,
      routes: []
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