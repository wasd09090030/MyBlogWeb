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
        <div 
          v-if="article.coverImage && article.coverImage !== 'null'" 
          class="w-full h-64 md:h-80 lg:h-96 overflow-hidden"
        >
          <img
            :src="article.coverImage"
            :alt="article.title"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- 文章主体内容 -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <!-- 文章头部 -->
          <header class="mb-8">
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ article.title }}
            </h1>
            
            <!-- 元信息 -->
            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-6">
              <n-tag :type="getCategoryTagType(article.category)" round size="small">
                {{ getCategoryName(article.category) }}
              </n-tag>
              <span class="flex items-center gap-1">
                <Icon name="calendar3" size="sm" />
                {{ formatDate(article.createdAt) }}
              </span>
              <span v-if="article.updatedAt && article.updatedAt !== article.createdAt" class="flex items-center gap-1">
                <Icon name="pencil-square" size="sm" />
                更新于 {{ formatDate(article.updatedAt) }}
              </span>
            </div>

            <!-- AI 摘要 -->
            <div v-if="article.aiSummary" class="bg-sky-50 dark:bg-sky-900/20 border-l-4 border-sky-500 rounded-r-lg p-4 mb-6">
              <div class="flex items-center gap-2 text-sky-700 dark:text-sky-300 font-semibold text-sm mb-2">
                <Icon name="robot" size="sm" />
                <span>AI 摘要</span>
              </div>
              <p class="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                {{ displayedSummary }}<span class="animate-pulse text-sky-500">|</span>
              </p>
            </div>

            <!-- 返回按钮 -->
            <n-button @click="goBack" quaternary strong secondary type="success">
              <template #icon>
                <Icon name="arrow-left" size="sm" />
              </template>
              返回
            </n-button>
          </header>

          <!-- 文章内容 - Markdown 渲染 -->
          <div class="article-content">
            <MarkdownRenderer
              :markdown="article.contentMarkdown"
              :html="article.content"
              size="lg"
              @toc-ready="onTocReady"
            />
          </div>

          <!-- 评论区 - 无缝衔接 -->
          <section class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <CommentSection :article-id="article.id" />
          </section>

          <!-- 底部返回按钮 -->
          <div class="mt-10 mb-4 text-center">
            <n-button @click="goBack" type="primary" size="large" round>
              <template #icon>
                <Icon name="arrow-left" size="md" />
              </template>
              返回上页
            </n-button>
          </div>
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
    <aside 
      v-if="article" 
      class="hidden lg:block w-72 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 rounded-r-xl"
    >
      <div class="sticky top-16 p-4 h-[calc(100vh-4rem)] overflow-y-auto">
        <!-- 目录加载中骨架屏 -->
        <div v-if="headings.length === 0 && pending" class="animate-pulse space-y-3">
          <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div class="space-y-2 px-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/5 ml-4"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 ml-4"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
        <!-- 实际目录 -->
        <ArticleToc v-else-if="headings.length > 0" :headings="headings" />
        <!-- 无目录提示 -->
        <div v-else class="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
          <Icon name="list-ul" size="lg" class="mb-2 opacity-50" />
          <p>暂无目录</p>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { useArticles } from '~/composables/useArticles'
import CommentSection from '~/components/CommentSection.vue'
import MarkdownRenderer from '~/components/MarkdownRenderer.vue'
import ArticleToc from '~/components/ArticleToc.vue'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

// SSR 预取文章数据
const { data: article, pending, error } = await useAsyncData(
  `article-${route.params.id}`,
  async () => {
    const id = route.params.id
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '未提供文章ID'
      })
    }
    
    const response = await $fetch(`${config.public.apiBase}/articles/${id}`)
    
    if (!response) {
      throw createError({
        statusCode: 404,
        statusMessage: '文章不存在'
      })
    }
    
    return response
  },
  {
    // 客户端导航时重新获取
    watch: [() => route.params.id]
  }
)

// 处理 404 错误
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || '文章加载失败'
  })
}

// 目录数据
const headings = ref([])

// AI 摘要打字机效果
const displayedSummary = ref('')
let typingTimer = null

// SEO 元数据
useSeoMeta({
  title: () => article.value?.title || '文章详情',
  description: () => article.value?.aiSummary || getDescription(article.value?.content),
  ogTitle: () => article.value?.title || '文章详情',
  ogDescription: () => article.value?.aiSummary || getDescription(article.value?.content),
  ogImage: () => article.value?.coverImage !== 'null' ? article.value?.coverImage : '',
  ogType: 'article',
})

// 辅助函数
function getDescription(content, maxLength = 160) {
  if (!content) return '文章详情'
  const text = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getCategoryName(category) {
  const map = { study: '学习', game: '游戏', work: '作品', resource: '资源' }
  return map[category?.toLowerCase()] || '其他'
}

function getCategoryTagType(category) {
  const map = { study: 'info', game: 'warning', work: 'success', resource: 'primary' }
  return map[category?.toLowerCase()] || 'default'
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    navigateTo('/')
  }
}

// 打字机效果
function startTyping(text) {
  if (!text) return
  displayedSummary.value = ''
  let i = 0
  typingTimer = setInterval(() => {
    if (i < text.length) {
      displayedSummary.value += text[i]
      i++
    } else {
      clearInterval(typingTimer)
    }
  }, 30)
}

// 从渲染后的内容中提取标题 - 仅用于 HTML 回退模式
function extractHeadingsFromDOM() {
  nextTick(() => {
    // 如果已经从 AST 获取了目录，跳过 DOM 提取
    if (headings.value.length > 0) return
    
    const container = document.querySelector('.article-content')
    if (!container) return
    
    const elements = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const extracted = []
    
    elements.forEach((el, index) => {
      const level = parseInt(el.tagName[1])
      const text = el.textContent?.trim() || ''
      const id = el.id || `heading-${index}`
      
      // 确保每个标题都有 ID
      if (!el.id) {
        el.id = id
      }
      
      extracted.push({ id, text, level })
    })
    
    headings.value = extracted
  })
}

// 从 MarkdownRenderer 接收 TOC 数据（来自 AST，更快）
function onTocReady(toc) {
  if (toc?.links?.length > 0) {
    // 将 MDC 的 toc 格式转换为我们的格式
    const convertLinks = (links, level = 2) => {
      const result = []
      for (const link of links) {
        result.push({
          id: link.id,
          text: link.text,
          level
        })
        if (link.children?.length > 0) {
          result.push(...convertLinks(link.children, level + 1))
        }
      }
      return result
    }
    headings.value = convertLinks(toc.links)
  }
}

// 初始化客户端效果
onMounted(() => {
  // 开始 AI 摘要打字机效果
  if (article.value?.aiSummary) {
    startTyping(article.value.aiSummary)
  }
  // 仅当使用 HTML 回退时从 DOM 提取标题
  if (article.value && !article.value.contentMarkdown) {
    extractHeadingsFromDOM()
  }
})

onUnmounted(() => {
  if (typingTimer) {
    clearInterval(typingTimer)
  }
})
</script>
