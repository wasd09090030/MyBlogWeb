<template>
  <div class="article-detail-page">
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      加载文章失败: {{ error.message }}
    </div>

    <div v-else-if="article" class="article-container card shadow-sm">
      <div class="card-body">
        <!-- 文章结构组件 - 在大屏幕上固定在右侧，在小屏幕上显示在顶部 -->
        <div class="article-structure-wrapper">
          <ArticleStructure :article-content="article.content" />
        </div>

        <!-- 文章主要内容 -->
        <div class="article-main-content">
          <!-- 封面图片 -->
          <div v-if="article.coverImage && article.coverImage !== 'null'" class="article-cover mb-4">
            <img
              :src="article.coverImage"
              :alt="article.title"
              class="cover-image"
              style="height: 400px; aspect-ratio: 16/9; object-fit: cover; width: 100%; border-radius: 0.5rem;"
            />
          </div>

          <div class="article-header mb-4 header-fade-in">
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="article-meta">
              <span class="badge" :class="getCategoryBadgeClass(article.category)">
                {{ getCategoryName(article.category) }}
              </span>
              <span class="badge bg-secondary ms-2">{{ formatDate(article.createdAt) }}</span>
              <span v-if="article.updatedAt && article.updatedAt !== article.createdAt" class="ms-2 text-muted">
                最后更新: {{ formatDate(article.updatedAt) }}
              </span>
            </div>
          </div>

          <div class="article-actions mb-4">
            <button @click="goBackToList" class="btn btn-outline-secondary">
              <i class="bi bi-arrow-left me-2"></i>
              返回上页
            </button>
          </div>

          <div class="article-content">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-html="article.content" class="article-content-html markdown-body"></div>
          </div>

          <!-- 评论和点赞区域 -->
          <CommentSection :article-id="article.id" />

          <!-- 底部返回按钮 -->
          <div class="article-bottom-actions mt-5 pt-4 border-top text-center">
            <button @click="goBackToList" class="btn btn-primary btn-lg">
              <i class="bi bi-arrow-left me-2"></i>
              返回上页
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="alert alert-warning" role="alert">
      找不到文章
    </div>
  </div>
</template>

<script setup>
import { useArticles } from '~/composables/useArticles'
import ArticleStructure from '~/components/ArticleStructure.vue'
import CommentSection from '~/components/CommentSection.vue'

// 动态导入 highlight.js 和 katex
let hljs = null
let katex = null

// 客户端导入
if (process.client) {
  import('highlight.js').then(module => {
    hljs = module.default
  })
  import('katex').then(module => {
    katex = module.default
  })
}

const route = useRoute()
const router = useRouter()
const article = ref(null)
const loading = ref(true)
const error = ref(null)

// API composable
const { getArticleById } = useArticles()

// 设置页面元数据
useHead(() => ({
  title: article.value?.title || '文章详情',
  meta: [
    {
      name: 'description',
      content: article.value ? article.value.title : '文章详情'
    },
    {
      property: 'og:title',
      content: article.value?.title || '文章详情'
    }
  ]
}))

// 格式化日期的辅助函数
function formatDate(dateString) {
  if (!dateString) return '未知日期'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取分类名称
function getCategoryName(category) {
  const categoryMap = {
    'study': '学习',
    'game': '游戏',
    'work': '个人作品',
    'resource': '资源分享',
    'other': '其他'
  }
  return categoryMap[category] || '未分类'
}

// 获取分类徽章样式
function getCategoryBadgeClass(category) {
  const classMap = {
    'study': 'bg-primary',
    'game': 'bg-warning text-dark',
    'work': 'bg-success',
    'resource': 'bg-info text-dark',
    'other': 'bg-secondary'
  }
  return classMap[category] || 'bg-secondary'
}

async function fetchArticle() {
  const id = route.params.id
  if (!id) {
    error.value = new Error('未提供文章ID')
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    article.value = await getArticleById(id)

    // 在文章内容渲染后，处理代码高亮和数学公式
    nextTick(() => {
      processArticleContent()
    })
  } catch (e) {
    error.value = e
    console.error(`获取文章 ${id} 失败:`, e)
  } finally {
    loading.value = false
  }
}

// 返回上一页，使用浏览器历史记录
const goBackToList = () => {
  console.log('使用浏览器后退功能返回上一页')

  // 检查是否有历史记录可以返回
  if (window.history.length > 1) {
    // 使用 router.back() 返回上一页
    router.back()
  } else {
    // 如果没有历史记录，则回到首页
    console.log('没有历史记录，返回首页')
    navigateTo('/')
  }
}

// 处理文章内容（包括数学公式和代码高亮）
const processArticleContent = () => {
  nextTick(() => {
    const articleContent = document.querySelector('.article-content-html')
    if (!articleContent) {
      console.warn('未找到文章内容容器')
      return
    }

    console.log('开始处理文章内容')

    // 首先清理之前的处理结果
    const existingKatex = articleContent.querySelectorAll('.katex')
    existingKatex.forEach(el => {
      // 如果有原始的数学公式文本，恢复它
      if (el.hasAttribute('data-original')) {
        const original = el.getAttribute('data-original')
        el.outerHTML = original
      }
    })

    // 然后依次处理
    setTimeout(() => {
      highlightCode()
      setTimeout(() => {
        renderKatex()
      }, 200)
    }, 100)
  })
}

// 渲染 KaTeX 数学公式 - 简化版本
const renderKatex = () => {
  if (!katex) {
    console.warn('KaTeX 未加载')
    return
  }

  nextTick(() => {
    const articleContent = document.querySelector('.article-content-html')
    if (!articleContent) return

    // 找到所有文本节点，只在文本节点中处理数学公式
    const walker = document.createTreeWalker(
      articleContent,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // 跳过代码块和已处理的 KaTeX 元素内的文本
          const parent = node.parentElement
          if (parent && (
            parent.tagName === 'CODE' ||
            parent.tagName === 'PRE' ||
            parent.classList.contains('katex') ||
            parent.closest('pre, code, .katex')
          )) {
            return NodeFilter.FILTER_REJECT
          }
          return NodeFilter.FILTER_ACCEPT
        }
      }
    )

    const textNodes = []
    let node
    while (node = walker.nextNode()) {
      textNodes.push(node)
    }

    textNodes.forEach(textNode => {
      let content = textNode.textContent
      let hasChanges = false

      // 处理块级公式 $$...$$
      content = content.replace(/\$\$([^$\n]+(?:\n[^$\n]*)*?[^$\n]+)\$\$/g, (match, formula) => {
        try {
          hasChanges = true
          return katex.renderToString(formula.trim(), {
            throwOnError: false,
            displayMode: true
          })
        } catch (e) {
          console.warn('KaTeX block render error:', e)
          return match
        }
      })

      // 处理行内公式 $...$
      content = content.replace(/\$([^$\n\s][^$\n]*[^$\n\s])\$/g, (match, formula) => {
        try {
          hasChanges = true
          return katex.renderToString(formula.trim(), {
            throwOnError: false,
            displayMode: false
          })
        } catch (e) {
          console.warn('KaTeX inline render error:', e)
          return match
        }
      })

      if (hasChanges) {
        // 创建一个临时容器来解析 HTML
        const temp = document.createElement('div')
        temp.innerHTML = content

        // 替换文本节点
        const parent = textNode.parentNode
        while (temp.firstChild) {
          parent.insertBefore(temp.firstChild, textNode)
        }
        parent.removeChild(textNode)
      }
    })

    console.log('KaTeX 处理完成')
  })
}

// 高亮代码块
const highlightCode = () => {
  if (!hljs) {
    console.warn('highlight.js 未加载')
    return
  }

  nextTick(() => {
    const codeBlocks = document.querySelectorAll('.article-content-html pre code')
    console.log(`开始处理代码高亮，找到 ${codeBlocks.length} 个代码块`)

    codeBlocks.forEach((block, index) => {
      // 跳过已经被 KaTeX 处理过的元素
      if (block.classList.contains('katex') ||
          block.parentElement.classList.contains('katex') ||
          block.innerHTML.includes('katex')) {
        console.log(`跳过代码块 ${index}：包含 KaTeX`)
        return
      }

      // 跳过已经高亮过的代码块
      if (block.classList.contains('hljs')) {
        console.log(`跳过代码块 ${index}：已经高亮`)
        return
      }

      try {
        hljs.highlightElement(block)
        console.log(`代码块 ${index} 高亮成功`)
      } catch (e) {
        console.warn(`代码块 ${index} 高亮失败:`, e)
      }
    })

    console.log('代码高亮处理完成')
  })
}

onMounted(() => {
  fetchArticle()
})
</script>

<style scoped>
@import '~/assets/css/components/ArticleDetail.styles.css';
</style>
