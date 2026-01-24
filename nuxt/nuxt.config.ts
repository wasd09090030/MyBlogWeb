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
      autoprefixer: {},
      // 生产环境CSS优化
      ...(process.env.NODE_ENV === 'production' ? {
        cssnano: {
          preset: ['default', {
            discardComments: { removeAll: true },
            normalizeWhitespace: true,
            minifyFontValues: true,
            minifyGradients: true
          }]
        }
      } : {})
    }
  },

  // Naive UI 配置
  naiveui: {
    colorModePreference: 'system',
    iconSize: 18,
    themeConfig: {},
    // 确保正确的模块解析
    importStyle: 'css'
  },

  // 依赖配置
  build: {
    transpile: ['swiper'],
    // 优化构建分析
    analyze: false
  },

  // Vite配置 - 深度优化
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
      ],
      // 排除不需要预构建的依赖
      exclude: ['vue-demi']
    },
    define: {
      global: 'globalThis'
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // 生产环境移除 console.log
          drop_debugger: true, // 生产环境移除 debugger
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          passes: 2 // 多次压缩优化
        },
        mangle: {
          safari10: true // Safari 10 兼容
        },
        format: {
          comments: false // 移除注释
        }
      },
      // 代码分割优化 - 简化版避免循环依赖
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 仅分割不会导致循环依赖的大型库
            if (id.includes('node_modules/mermaid')) {
              return 'vendor-markdown';
            }
            if (id.includes('node_modules/swiper')) {
              return 'vendor-swiper';
            }
            // Vue/Naive UI 让 Nuxt 自动处理，避免初始化顺序问题
          }
        }
      },
      // 设置警告阈值
      chunkSizeWarningLimit: 1500,
      // 启用CSS代码分割
      cssCodeSplit: true,
      // 生成sourcemap用于调试（生产环境可关闭）
      sourcemap: false,
      // 目标浏览器
      target: 'es2020'
    },
    // CSS处理优化
    css: {
      devSourcemap: false
    },
    // 服务器优化（开发环境）
    server: {
      warmup: {
        clientFiles: [
          './pages/index.vue',
          './components/SideBar.vue',
          './layouts/default.vue'
        ]
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
    // 页面过渡动画优化
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },

    head: {
      title: 'My Blog',
      htmlAttrs: {
        lang: 'zh-CN'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'A beautiful blog built with Nuxt 3' },
        { name: 'keywords', content: 'blog, nuxt, vue, frontend' },
        { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#1a1a1a', media: '(prefers-color-scheme: dark)' },
        // 性能优化meta
        { 'http-equiv': 'x-dns-prefetch-control', content: 'on' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/icon/Myfavicon.ico' },
        // DNS预解析和预连接
        { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
      ]
    }
  },

  // 页面过渡配置（移到app内部）
  // pageTransition 和 layoutTransition 已移至 app.pageTransition 和 app.layoutTransition

  // 实验性功能
  experimental: {
    payloadExtraction: true,
    renderJsonPayloads: true,
    viewTransition: true,
    // 启用内联路由规则
    inlineRouteRules: true,
    // 组件岛屿（可选）
    componentIslands: false,
    // 异步上下文
    asyncContext: true,
    // 头部优化
    headNext: true,
    // 跨域请求fetch
    crossOriginPrefetch: true,
    // 写早期提示
    writeEarlyHints: true
  },

  // 路由配置优化
  routeRules: {
    // 静态资源使用强缓存（1年）
    '/icon/**': { 
      headers: { 
        'cache-control': 'public, max-age=31536000, immutable',
        'cdn-cache-control': 'max-age=31536000'
      } 
    },
    '/Picture/**': { 
      headers: { 
        'cache-control': 'public, max-age=31536000, immutable',
        'cdn-cache-control': 'max-age=31536000'
      } 
    },
    '/flower/**': {
      headers: {
        'cache-control': 'public, max-age=31536000, immutable'
      }
    },
    '/pointer/**': {
      headers: {
        'cache-control': 'public, max-age=31536000, immutable'
      }
    },
    // API路由配置
    '/api/**': { 
      cors: true,
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate'
      }
    },
    // 首页和文章列表 - SWR缓存策略
    '/': {
      swr: 60, // 60秒重新验证
      cache: {
        maxAge: 60,
        staleMaxAge: 120
      }
    },
    // 文章详情页 - ISR增量静态再生成
    '/article/**': {
      swr: 300, // 5分钟重新验证
      cache: {
        maxAge: 300,
        staleMaxAge: 600
      }
    },
    // 画廊页面
    '/gallery': {
      swr: 600, // 10分钟重新验证
      cache: {
        maxAge: 600,
        staleMaxAge: 1200
      }
    },
    // 关于页面 - 长期缓存
    '/about': {
      swr: 3600,
      cache: {
        maxAge: 3600,
        staleMaxAge: 7200
      }
    }
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
    },
    // 服务器端存储缓存
    storage: {
      cache: {
        driver: 'lruCache',
        max: 500 // 最大缓存500个条目
      }
    },
    // 路由缓存
    routeRules: {
      '/_nuxt/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable'
        }
      }
    },
    // 静态资源处理
    publicAssets: [
      {
        dir: 'public',
        maxAge: 60 * 60 * 24 * 365 // 1年
      }
    ]
  },

  // 兼容性
  compatibility: {
    // Vue 3 兼容性设置
    vue: {
      runtimeCompiler: false
    }
  },

  // 优化Hooks
  hooks: {
    // 构建完成后优化
    'build:done': () => {
      console.log('✅ Build completed with optimizations')
    }
  }
})