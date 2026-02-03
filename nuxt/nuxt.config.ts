export default defineNuxtConfig({
  compatibilityDate: '2026-01-09',
  devtools: { enabled: true },
  // 通过 NUXT_SOURCEMAP=true 按需开启 sourcemap
  sourcemap: process.env.NUXT_SOURCEMAP === 'true',

  // 优化自动导入，减少重复代码
  imports: {
    autoImport: true,
    // 仅导入使用的内容
    presets: [
      {
        from: 'vue',
        imports: ['ref', 'computed', 'watch', 'onMounted', 'onUnmounted', 'nextTick']
      }
    ]
  },

  // CSS配置 - 使用 Tailwind Typography
  css: [
    '~/assets/css/theme-variables.css',
    '~/assets/css/tailwind.css', // Tailwind CSS 入口文件
    'katex/dist/katex.min.css', // KaTeX 数学公式样式
    'keen-slider/keen-slider.min.css',
    '~/assets/css/components/prose-custom.css', // 自定义 prose 样式
    '~/assets/css/layout.css', // 自定义布局工具类
    '~/assets/css/app.css',
  ],

  // 模块配置
  modules: [
    '@pinia/nuxt',
    '@nuxt/icon', // Nuxt Icon 模块
    '@nuxt/fonts', // Nuxt Fonts 模块
    '@bg-dev/nuxt-naiveui', // Naive UI 模块
    '@nuxtjs/mdc', // MDC Markdown 渲染模块
    '@nuxtjs/seo' // Nuxt SEO 模块
  ],

  // 字体配置（本地化）
  fonts: {
    // 仅使用本地字体提供者，避免任何外部请求
    provider: 'local',
    defaults: {
      weights: [400],
      styles: ['normal', 'italic'],
      subsets: ['latin']
    },
    families: [
      {
        name: 'Open Sans',
        provider: 'local',
        global: true
      }
    ]
  },

  pinia: {
    // Nuxt 4 使用 app/ 目录，需要明确指定 store 目录
    storesDirs: ['./app/stores']
  },

  // MDC 模块配置
  mdc: {
    highlight: {
      theme: {
        default: 'material-theme-lighter',
        dark: 'material-theme-darker'
      },
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

  // Nuxt Icon 配置
  icon: {
    // 修改 API 前缀，避免与 /api/ 冲突
    serverBundle: {
      collections: ['heroicons']
    },
    // 自定义图标 API 路径前缀（不使用 /api/ 以避免与后端 API 冲突）
    provider: 'server',
    serverKnownCssClasses: ['nuxt-icon']
  },

  // Naive UI 配置
  naiveui: {
    colorModePreference: 'system',
    iconSize: 18,
    themeConfig: {}
  },

  // 依赖配置
  build: {
    // 优化构建分析
    analyze: process.env.ANALYZE === 'true',
    // 提升构建性能 - 仅 transpile 必要的库
    transpile: [
      process.env.NODE_ENV === 'production' ? 'naive-ui' : '',
      process.env.NODE_ENV === 'production' ? '@vueuse/core' : ''
    ].filter(Boolean)
  },

  // Vite配置 - 深度优化
  vite: {
    optimizeDeps: {
      include: [
        'vue',
        // 仅包含首屏必需的最小依赖
      ],
      // 排除不需要预构建的依赖 - 减少首屏加载
      exclude: [
        'vue-demi',
        'mermaid',
        'katex',
        'md-editor-v3',
        'browser-image-compression',
        'keen-slider',
        'docx',
        'file-saver',
        'html2pdf.js',
        '@vueuse/core',
        'naive-ui'
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
          drop_debugger: true, // 生产环境移除 debugger
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          passes: 2, // 多次压缩优化
          unsafe_arrows: true, // 优化箭头函数
          unsafe_methods: true, // 优化方法调用
          dead_code: true, // 移除死代码
          collapse_vars: true, // 折叠变量
          reduce_vars: true // 减少变量
        },
        mangle: {
          safari10: true // Safari 10 兼容
        },
        format: {
          comments: false // 移除注释
        }
      },
      // 代码分割优化 - 合理分包策略，避免循环依赖
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 只分离真正大的、客户端使用的库
            
            // Naive UI 组件库（大型UI库）
            if (id.includes('node_modules/naive-ui')) {
              return 'naive-ui';
            }
            
            // Markdown 编辑器（仅管理页面使用，可以独立加载）
            if (id.includes('node_modules/md-editor-v3')) {
              return 'md-editor';
            }
            
            // Mermaid 图表库（大型库，文章页按需加载）
            if (id.includes('node_modules/mermaid') || id.includes('node_modules/d3-')) {
              return 'mermaid';
            }
            
            // KaTeX 数学公式（文章页按需加载）
            if (id.includes('node_modules/katex')) {
              return 'katex';
            }
            
            // 图片处理库（工具页面使用）
            if (id.includes('node_modules/browser-image-compression')) {
              return 'image-tools';
            }
            
            // 文档处理库（工具页面使用）
            if (id.includes('node_modules/docx') || 
                id.includes('node_modules/file-saver') || 
                id.includes('node_modules/html2pdf')) {
              return 'doc-tools';
            }
            
            // Keen Slider（画廊页面使用）
            if (id.includes('node_modules/keen-slider')) {
              return 'keen-slider';
            }
            
            // VueUse 工具库
            if (id.includes('node_modules/@vueuse')) {
              return 'vueuse';
            }
            
            // 其他 node_modules 统一放到 vendor
            // 不再细分，避免循环依赖和空chunk
            if (id.includes('node_modules/')) {
              return 'vendor';
            }
          }
        }
      },
      // 设置合理的chunk大小警告阈值
      chunkSizeWarningLimit: 800,
      // 启用CSS代码分割
      cssCodeSplit: true,
      // 通过 NUXT_SOURCEMAP=true 按需开启 sourcemap
      sourcemap: process.env.NUXT_SOURCEMAP === 'true',
      // 目标浏览器
      target: 'es2020'
    },
    // CSS处理优化
    css: {
      devSourcemap: false
    },
    // 性能优化
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    },
    // 服务器优化（开发环境）
    server: {
      warmup: {
        clientFiles: [
          './pages/index.vue',
          './components/SideBar.vue',
          './layouts/default.vue'
        ]
      },
      // 预热关键模块
      preTransformRequests: true
    },
    // 生产构建优化
    ssr: {
      noExternal: process.env.NODE_ENV === 'production' ? ['naive-ui', '@vueuse/core'] : []
    }
  },

  // 运行时配置
  runtimeConfig: {
    // 私有配置（服务器端）
    apiSecret: process.env.API_SECRET,

    // 公共配置（客户端+服务器端）
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL
        || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'),
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },

  // 站点信息（供 SEO 模块使用）
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://wasd09090030.top',
    name: 'WyrmKk',
    description: '分享技术、生活与创作的个人博客',
    defaultLocale: 'zh-CN'
  },

  robots: {
    // 使用 public/robots.txt，避免第三方注入非标准指令导致校验报错
    robotsTxt: false,
    disallow: process.env.NODE_ENV !== 'production'
      ? ['/']
      : ['/admin/**', '/api/**']
  },

  sitemap: {
    exclude: ['/admin/**', '/api/**'],
    sources: ['/api/__sitemap__/urls']
  },

  schemaOrg: {
    identity: {
      type: 'Person',
      name: 'WyrmKk',
      url: process.env.NUXT_PUBLIC_SITE_URL || 'https://wasd09090030.top',
      sameAs: [
        process.env.NUXT_PUBLIC_TWITTER_URL || 'https://x.com/wyrmwyrm1',
        process.env.NUXT_PUBLIC_GITHUB_URL || 'https://github.com/wasd09090030'
      ].filter(Boolean)
    },
    reactive: true
  },

  // 应用配置
  app: {
    // 页面过渡动画优化
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },

    head: {
      title: 'WyrmKk',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#1a1a1a', media: '(prefers-color-scheme: dark)' },
        // 性能优化meta
        { 'http-equiv': 'x-dns-prefetch-control', content: 'on' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/icon/Myfavicon.ico' },
        // DNS 预解析 - 加速外部资源加载
        { rel: 'dns-prefetch', href: 'https://cfimg.wasd09090030.top' },
        { rel: 'dns-prefetch', href: 'https://s41.ax1x.com' },
        { rel: 'dns-prefetch', href: 'https://static.cloudflareinsights.com' },
        // 预连接关键 CDN
        { rel: 'preconnect', href: 'https://cfimg.wasd09090030.top', crossorigin: 'anonymous' },
        // 关键图片预加载 - 提升 LCP
        { 
          rel: 'preload', 
          as: 'image', 
          href: 'https://cfimg.wasd09090030.top/file/websource/1770102705913_20251214_14133.webp',
          type: 'image/webp',
          fetchpriority: 'high'
        },
        // 首页 Hero 图片预加载
        { 
          rel: 'preload', 
          as: 'image', 
          href: 'https://cfimg.wasd09090030.top/file/websource/1770012440985_logo.webp',
          type: 'image/webp',
          fetchpriority: 'high'
        }
      ]
    }
  },

  // 页面过渡配置（移到app内部）
  // pageTransition 和 layoutTransition 已移至 app.pageTransition 和 app.layoutTransition

  // 实验性功能
  experimental: {
    // SSR 动态站点不需要 payload 提取（避免 404 警告）
    payloadExtraction: false,
    renderJsonPayloads: false,
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
    writeEarlyHints: true,
    // 启用增量静态再生（ISR）
    // 减少不必要的 SSR 调用
    defaults: {
      useAsyncData: {
        deep: false // 禁用深度响应式以提升性能
      }
    }
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
    // 首页 SWR 缓存（1分钟，后台可重验证 5 分钟）
    '/': {
      ssr: true,
      headers: {
        'cache-control': 'public, max-age=60, stale-while-revalidate=300'
      }
    },
    // 🔥 文章页面 SWR 缓存（5分钟，后台可重验证 1 小时）
    '/article/**': {
      ssr: true,
      headers: {
        'cache-control': 'public, max-age=300, stale-while-revalidate=3600',
        'cdn-cache-control': 'public, max-age=300, stale-while-revalidate=3600'
      }
    },
    // 画廊页面 SWR 缓存（3分钟）
    '/gallery': {
      ssr: true,
      headers: {
        'cache-control': 'public, max-age=180, stale-while-revalidate=600'
      }
    },
    // 关于页面较长缓存（10分钟）
    '/about': {
      ssr: true,
      headers: {
        'cache-control': 'public, max-age=600, stale-while-revalidate=1800'
      }
    },
    // 教程页面 SWR 缓存
    '/tutorials': {
      ssr: true,
      headers: {
        'cache-control': 'public, max-age=300, stale-while-revalidate=3600'
      }
    }
  },

  // SSR配置
  nitro: {
    preset: 'node-server',
    esbuild: {
      options: {
        target: 'es2020',
        treeShaking: true // 启用tree-shaking
      }
    },
    // 启用压缩
    compressPublicAssets: {
      gzip: true,
      brotli: true
    },
    // 优化服务器输出
    minify: true,
    // 移除未使用的代码
    replace: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    },
    // 仅预渲染首页，避免全站 crawl
    prerender: {
      crawlLinks: false,
      routes: [],
      // 忽略 payload.json 的 404 错误（SSR模式下正常）
      failOnError: false
    },
    // 服务端端存储缓存（增强版）
    storage: {
      cache: {
        driver: 'lruCache',
        max: 1000,          // 增加到 1000 个条目
        ttl: 300            // 5 分钟过期
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
