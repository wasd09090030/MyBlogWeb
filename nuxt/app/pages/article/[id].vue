<template>
  <div class="min-h-screen flex">
    <!-- 左侧：文章主体 -->
    <div class="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden lg:rounded-l-xl lg:rounded-r-none">
      <!-- 加载状态 -->
      <div v-if="pending" class="flex flex-col items-center justify-center min-h-[60vh]">
        <n-spin size="large" />
        <p class="mt-4 text-gray-500 dark:text-gray-400">加载中...</p>
      </div>

      <!-- 错误状态 -->
      <n-alert v-else-if="error" type="error" title="加载失败" class="max-w-4xl mx-auto my-8">
        加载文章失败: {{ error.message }}
      </n-alert>

      <!-- 文章内容 -->
      <article v-else-if="article" class="relative">
        <!-- 封面图片 - 全宽无间距 -->
        <ArticleDetailCoverImage :article="article" />

        <!-- 文章主体内容 -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <!-- 文章头部 -->
          <ArticleDetailHeader :article="article" @go-back="goBack" />

          <!-- 文章内容、评论、底部按钮 -->
          <ArticleDetailContent :article="article" @toc-ready="onTocReady" @go-back="goBack" />
        </div>
      </article>

      <!-- 文章不存在 -->
      <n-empty v-else description="找不到文章" class="py-20">
        <template #icon>
          <Icon name="file-earmark-x" size="3xl" />
        </template>
        <template #extra>
          <n-button @click="goBack">返回首页</n-button>
        </template>
      </n-empty>
    </div>

    <!-- 右侧：文章目录侧边栏 -->
    <ArticleDetailSidebar :article="article" :headings="headings" :pending="pending" />
  </div>
</template>

<script setup>
import { parseMarkdown } from '@nuxtjs/mdc/runtime'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const rawIdParam = computed(() => String(route.params.id || ''))
const articleId = computed(() => rawIdParam.value.split('-')[0])
const routeSlug = computed(() => rawIdParam.value.split('-').slice(1).join('-'))

const getApiBase = () => {
  const apiBase = config.public.apiBase
  if (apiBase) {
    if (process.server && apiBase.startsWith('/')) {
      return `http://127.0.0.1:5000${apiBase}`
    }
    return apiBase
  }
  return process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:5000/api'
}

// SSR 预取文章数据 + 服务端 Markdown 解析 + SWR 缓存
const { data: article, pending, error } = await useAsyncData(
  `article-${route.params.id}`,
  async () => {
    const id = articleId.value
    if (!id || !/^\d+$/.test(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: '未提供文章ID'
      })
    }
    
    const response = await $fetch(`${getApiBase()}/articles/${id}`)
    
    if (!response) {
      throw createError({
        statusCode: 404,
        statusMessage: '文章不存在'
      })
    }
    
    // 🔥 Markdown 预解析（SSR 优先，客户端回退）
    if (response.contentMarkdown) {
      try {
        const ast = await parseMarkdown(response.contentMarkdown, {
          highlight: {
            theme: {
              default: 'material-theme-lighter',
              dark: 'material-theme-darker'
            }
          },
          toc: {
            depth: 4,
            searchDepth: 4
          }
        })
        
        // 附加预解析的 AST 和 TOC 到响应数据
        response._mdcAst = ast
        response._mdcToc = ast.toc
        
        if (process.server) {
          console.log('[SSR] Markdown 预解析成功，TOC:', ast.toc?.links?.length || 0, '项')
        } else {
          console.log('[Client] Markdown 解析成功，TOC:', ast.toc?.links?.length || 0, '项')
        }
      } catch (e) {
        console.error('[Markdown] 解析失败:', e.message)
        // 解析失败不影响页面渲染，组件会使用 HTML 回退
      }
    }
    
    return response
  },
  {
    // 客户端导航时重新验证
    watch: [articleId],
    // 立即加载，不延迟
    lazy: false
  }
)

const canonicalPath = computed(() => {
  if (!article.value) return ''
  if (!article.value.slug) return `/article/${article.value.id}`
  return `/article/${article.value.id}-${article.value.slug}`
})

const baseSiteUrl = computed(() => (config.public.siteUrl || '').replace(/\/$/, ''))
const canonicalUrl = computed(() => {
  if (!canonicalPath.value) return ''
  return `${baseSiteUrl.value}${canonicalPath.value}`
})

const resolveUrl = (value) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (!baseSiteUrl.value) return value
  if (value.startsWith('/')) return `${baseSiteUrl.value}${value}`
  return `${baseSiteUrl.value}/${value}`
}

if (article.value?.slug && routeSlug.value !== article.value.slug) {
  await navigateTo({ path: canonicalPath.value, query: route.query }, { redirectCode: 301 })
}

// 处理 404 错误
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || '文章加载失败'
  })
}

// 目录数据
const headings = ref([])

// SEO 元数据
useSeoMeta({
  title: () => article.value?.title || '文章详情',
  description: () => article.value?.aiSummary || getDescription(article.value?.content),
  ogTitle: () => article.value?.title || '文章详情',
  ogDescription: () => article.value?.aiSummary || getDescription(article.value?.content),
  ogImage: () => {
    const image = article.value?.coverImage
    return image && image !== 'null' ? image : undefined
  },
  ogUrl: () => canonicalUrl.value || undefined,
  ogType: 'article',
  twitterImage: () => {
    const image = article.value?.coverImage
    return image && image !== 'null' ? image : undefined
  }
})

useHead(() => ({
  link: canonicalUrl.value ? [{ rel: 'canonical', href: canonicalUrl.value }] : []
}))

const schemaGraph = computed(() => {
  if (!article.value) return []

  const title = article.value?.title || '文章详情'
  const description = article.value?.aiSummary || getDescription(article.value?.content)
  const imageUrl = resolveUrl(article.value?.coverImage && article.value?.coverImage !== 'null'
    ? article.value.coverImage
    : '/og-default.svg')
  const articleUrl = canonicalUrl.value || resolveUrl(canonicalPath.value)
  const siteUrl = baseSiteUrl.value || resolveUrl('/')

  return [
    {
      '@type': 'Article',
      headline: title,
      description,
      image: imageUrl,
      author: {
        '@type': 'Person',
        name: 'WyrmKk',
        url: siteUrl
      },
      datePublished: article.value?.createdAt,
      dateModified: article.value?.updatedAt || article.value?.createdAt,
      mainEntityOfPage: articleUrl
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: '首页',
          item: siteUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: title,
          item: articleUrl
        }
      ]
    }
  ]
})

useSchemaOrg(schemaGraph)

// 辅助函数
function getDescription(content, maxLength = 160) {
  if (!content) return '文章详情'
  const text = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    navigateTo('/')
  }
}

// 从 Content 组件接收 TOC 数据
function onTocReady(toc) {
  headings.value = toc
}
</script>
