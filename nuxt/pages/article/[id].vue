<template>
  <div class="article-detail-page">
    <div v-if="loading" class="text-center my-5">
      <n-spin size="large" />
      <p class="mt-3 text-muted">加载中...</p>
    </div>

    <n-alert v-else-if="error" type="error" title="加载失败" class="my-4">
      加载文章失败: {{ error.message }}
    </n-alert>

    <n-card v-else-if="article" class="article-container">
      <div class="article-layout-wrapper">
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

          <div class="article-header header-fade-in">
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="article-meta">
              <n-tag :type="getCategoryTagType(article.category)" round>
                <template #icon>
                  <Icon name="folder2-open" size="sm" />
                </template>
                {{ getCategoryName(article.category) }}
              </n-tag>
              <n-tag type="default" round>
                <template #icon>
                  <Icon name="calendar3" size="sm" />
                </template>
                {{ formatDate(article.createdAt) }}
              </n-tag>
              <span v-if="article.updatedAt && article.updatedAt !== article.createdAt" class="text-muted d-inline-flex align-items-center small">
                <Icon name="pencil-square" size="sm" class="me-1" />更新: {{ formatDate(article.updatedAt) }}
              </span>
            </div>
            
            <!-- AI 摘要 -->
            <div v-if="article.aiSummary" class="ai-summary-container">
              <div class="ai-summary-header">
                <Icon name="robot" size="md" />
                <span>AI 摘要</span>
              </div>
              <p class="ai-summary-content" ref="aiSummaryRef">{{ displayedSummary }}</p>
            </div>
          </div>

          <div class="article-actions mb-4">
            <n-button @click="goBackToList" secondary>
              <template #icon>
                <Icon name="arrow-left" size="md" />
              </template>
              返回上页
            </n-button>
          </div>

          <div class="article-content">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-html="article.content" class="article-content-html markdown-body"></div>
          </div>

          <!-- 评论和点赞区域 -->
          <CommentSection :article-id="article.id" />

          <!-- 底部返回按钮 -->
          <div class="article-bottom-actions mt-5 pt-4 border-top text-center">
            <n-button @click="goBackToList" type="primary" size="large">
              <template #icon>
                <Icon name="arrow-left" size="md" />
              </template>
              返回上页
            </n-button>
          </div>
        </div>
      </div>
    </n-card>

    <n-empty v-else description="找不到文章" class="my-5">
      <template #icon>
        <Icon name="file-earmark-x" size="3xl" />
      </template>
      <template #extra>
        <n-button @click="goBackToList">返回首页</n-button>
      </template>
    </n-empty>
  </div>
</template>

<script setup>
import { useArticles } from '~/composables/useArticles'
import ArticleStructure from '~/components/ArticleStructure.vue'
import CommentSection from '~/components/CommentSection.vue'
import '~/assets/css/components/ArticleDetail.styles.css'

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

// AI 摘要打字机效果相关
const displayedSummary = ref('')
const aiSummaryRef = ref(null)
let typingTimer = null

// API composable
const { getArticleById } = useArticles()

// 生成文章描述（从内容中提取纯文本摘要）
const getArticleDescription = (content, maxLength = 160) => {
  if (!content) return ''
  // 移除HTML标签
  const text = content.replace(/<[^>]+>/g, '')
  // 移除多余空格和换行
  const cleaned = text.replace(/\s+/g, ' ').trim()
  // 截取指定长度
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned
}

// 设置页面SEO元数据
useSeoMeta({
  title: () => article.value?.title || '文章详情',
  description: () => article.value?.aiSummary || (article.value ? getArticleDescription(article.value.content) : '文章详情'),
  ogTitle: () => article.value?.title || '文章详情',
  ogDescription: () => article.value?.aiSummary || (article.value ? getArticleDescription(article.value.content) : '文章详情'),
  ogImage: () => article.value?.coverImage && article.value.coverImage !== 'null' ? article.value.coverImage : '',
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: () => article.value?.title || '文章详情',
  twitterDescription: () => article.value?.aiSummary || (article.value ? getArticleDescription(article.value.content) : '文章详情'),
  twitterImage: () => article.value?.coverImage && article.value.coverImage !== 'null' ? article.value.coverImage : '',
  articlePublishedTime: () => article.value?.createdAt || '',
  articleModifiedTime: () => article.value?.updatedAt || '',
  articleAuthor: () => article.value?.author || 'Wasd09090030',
  articleTag: () => article.value?.category || '',
})

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
  if (!category) return '其他'
  const lowerCategory = category.toLowerCase()
  const categoryMap = {
    'study': '学习',
    'game': '游戏',
    'work': '个人作品',
    'resource': '资源分享'
  }
  return categoryMap[lowerCategory] || '未分类'
}

// 获取分类徽章样式
function getCategoryBadgeClass(category) {
  if (!category) return 'bg-secondary'
  const lowerCategory = category.toLowerCase()
  const classMap = {
    'study': 'bg-primary',
    'game': 'bg-warning text-dark',
    'work': 'bg-success',
    'resource': 'bg-info text-dark'
  }
  return classMap[lowerCategory] || 'bg-secondary'
}

// 获取分类标签类型 (Naive UI)
function getCategoryTagType(category) {
  if (!category) return 'default'
  const lowerCategory = category.toLowerCase()
  const typeMap = {
    'study': 'info',
    'game': 'warning',
    'work': 'success',
    'resource': 'primary'
  }
  return typeMap[lowerCategory] || 'default'
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
      // 开始 AI 摘要打字机效果
      if (article.value?.aiSummary) {
        startTypingEffect(article.value.aiSummary)
      }
    })
  } catch (e) {
    error.value = e
    console.error(`获取文章 ${id} 失败:`, e)
  } finally {
    loading.value = false
  }
}

// AI 摘要打字机效果
const startTypingEffect = (fullText) => {
  if (!fullText) return
  
  // 清除之前的定时器
  if (typingTimer) {
    clearInterval(typingTimer)
  }
  
  displayedSummary.value = ''
  let currentIndex = 0
  const typingSpeed = 30 // 每个字符的打字速度（毫秒）
  
  typingTimer = setInterval(() => {
    if (currentIndex < fullText.length) {
      displayedSummary.value += fullText[currentIndex]
      currentIndex++
    } else {
      clearInterval(typingTimer)
      typingTimer = null
    }
  }, typingSpeed)
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (typingTimer) {
    clearInterval(typingTimer)
    typingTimer = null
  }
})

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

// 高亮代码块并添加折叠功能
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

        // 为代码块添加折叠功能
        addCodeBlockToggle(block, index)
      } catch (e) {
        console.warn(`代码块 ${index} 高亮失败:`, e)
      }
    })

    console.log('代码高亮处理完成')
  })
}

// 为代码块添加折叠/展开功能
const addCodeBlockToggle = (codeBlock, index) => {
  const preElement = codeBlock.parentElement
  if (!preElement || preElement.tagName !== 'PRE') return

  // 如果已经添加过按钮，跳过
  if (preElement.parentElement.classList.contains('code-block-wrapper')) return

  // 创建包装器
  const wrapper = document.createElement('div')
  wrapper.className = 'code-block-wrapper'
  wrapper.setAttribute('data-index', index)

  // 创建头部容器
  const header = document.createElement('div')
  header.className = 'code-block-header'

  // 创建语言标签 - 统一显示"代码"
  const langLabel = document.createElement('span')
  langLabel.className = 'code-language-label'
  langLabel.textContent = '代码'

  // 创建折叠按钮
  const toggleBtn = document.createElement('button')
  toggleBtn.className = 'code-toggle-btn'
  toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:1rem;height:1rem;vertical-align:middle"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg> 收起'
  toggleBtn.setAttribute('aria-label', '折叠代码块')
  toggleBtn.setAttribute('data-expanded', 'true')

  // 添加点击事件
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    const isExpanded = toggleBtn.getAttribute('data-expanded') === 'true'

    if (isExpanded) {
      // 收起 - 完全隐藏
      preElement.style.maxHeight = '0'
      preElement.style.padding = '0'
      preElement.style.border = 'none'
      preElement.style.overflow = 'hidden'
      preElement.style.margin = '0'
      toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:1rem;height:1rem;vertical-align:middle"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg> 展开'
      toggleBtn.setAttribute('data-expanded', 'false')
      wrapper.classList.add('collapsed')
    } else {
      // 展开
      preElement.style.maxHeight = 'none'
      preElement.style.padding = ''
      preElement.style.border = ''
      preElement.style.overflow = 'auto'
      preElement.style.margin = ''
      toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:1rem;height:1rem;vertical-align:middle"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg> 收起'
      toggleBtn.setAttribute('data-expanded', 'true')
      wrapper.classList.remove('collapsed')
    }
  })

  // 组装头部
  header.appendChild(langLabel)
  header.appendChild(toggleBtn)

  // 插入包装器
  preElement.parentNode.insertBefore(wrapper, preElement)
  wrapper.appendChild(header)
  wrapper.appendChild(preElement)

  // 添加过渡效果
  preElement.style.transition = 'max-height 0.3s ease, padding 0.3s ease, margin 0.3s ease'
}

onMounted(() => {
  fetchArticle()
})
</script>

<style scoped>
@import '~/assets/css/components/ArticleDetail.styles.css';

/* AI 摘要容器 */
.ai-summary-container {
  margin-top: 1.5rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-left: 4px solid #0ea5e9;
  border-radius: 0 0.5rem 0.5rem 0;
  position: relative;
  overflow: hidden;
  animation: slideIn 0.5s ease-out;
}

.dark-theme .ai-summary-container {
  background: linear-gradient(135deg, #0c4a6e20 0%, #075985 15%);
  border-left-color: #38bdf8;
}

/* 摘要头部 */
.ai-summary-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0369a1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dark-theme .ai-summary-header {
  color: #7dd3fc;
}

.ai-summary-header i {
  font-size: 1rem;
  animation: pulse 2s infinite;
}

/* 摘要内容 - 使用不同字体 */
.ai-summary-content {
  margin: 0;
  font-family: 'Georgia', 'Noto Serif SC', serif;
  font-size: 0.95rem;
  line-height: 1.7;
  color: #334155;
  font-style: italic;
  position: relative;
}

.dark-theme .ai-summary-content {
  color: #cbd5e1;
}

/* 打字机光标效果 */
.ai-summary-content::after {
  content: '|';
  font-weight: 100;
  animation: blink 0.8s infinite;
  color: #0ea5e9;
}

/* 动画定义 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}
</style>

<style>
/* 代码块折叠功能样式 */
.code-block-wrapper {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e1e4e8;
  transition: all 0.3s ease;
}

.dark-theme .code-block-wrapper {
  border-color: #30363d;
}

.code-block-wrapper.collapsed {
  border-color: #d1d5da;
}

.dark-theme .code-block-wrapper.collapsed {
  border-color: #21262d;
}

.code-block-wrapper.collapsed .code-block-header {
  border-bottom: none;
}

.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
}

.dark-theme .code-block-header {
  background-color: #161b22;
  border-bottom-color: #30363d;
}

.code-language-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0366d6;
  letter-spacing: 0.5px;
}

.dark-theme .code-language-label {
  color: #58a6ff;
}

.code-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  color: #0366d6;
  background-color: transparent;
  border: 1px solid #0366d6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.code-toggle-btn:hover {
  background-color: #0366d6;
  color: white;
}

.dark-theme .code-toggle-btn {
  color: #58a6ff;
  border-color: #58a6ff;
}

.dark-theme .code-toggle-btn:hover {
  background-color: #58a6ff;
  color: #0d1117;
}

.code-toggle-btn i {
  font-size: 1rem;
  transition: transform 0.3s ease;
}

.code-block-wrapper pre {
  margin: 0 !important;
  border-radius: 0 !important;
  border: none !important;
}

/* 暗色主题下的代码块样式 - 全局样式以覆盖 highlight.js */
.dark-theme .article-detail-page .markdown-body pre,
.dark-theme .article-container pre,
.dark-theme pre.hljs {
  background-color: #161b22 !important;
  color: #e6edf3 !important;
}

.dark-theme .article-detail-page .markdown-body pre code,
.dark-theme .article-container pre code,
.dark-theme pre code.hljs {
  background-color: transparent !important;
  color: inherit !important;
}

.dark-theme .markdown-body code {
  background-color: rgba(110,118,129,0.4) !important;
  color: #e6edf3 !important;
}

/* 确保 highlight.js 的语法高亮在暗色主题下可见 - 增强对比度 */
/* 关键字、选择器 - 鲜红色 */
.dark-theme .hljs-keyword,
.dark-theme .hljs-selector-tag,
.dark-theme .hljs-literal,
.dark-theme .hljs-section,
.dark-theme .hljs-link,
.dark-theme .hljs-selector-class,
.dark-theme .hljs-selector-id {
  color: #ff7b72 !important;
  font-weight: 500;
}

/* 字符串、标题 - 亮蓝色 */
.dark-theme .hljs-string,
.dark-theme .hljs-title,
.dark-theme .hljs-name,
.dark-theme .hljs-type,
.dark-theme .hljs-attribute,
.dark-theme .hljs-symbol,
.dark-theme .hljs-bullet,
.dark-theme .hljs-addition,
.dark-theme .hljs-built_in {
  color: #a5d6ff !important;
}

/* 注释 - 中灰色 */
.dark-theme .hljs-comment,
.dark-theme .hljs-quote,
.dark-theme .hljs-deletion,
.dark-theme .hljs-meta {
  color: #8b949e !important;
  font-style: italic;
}

/* 数字、正则 - 天蓝色 */
.dark-theme .hljs-number,
.dark-theme .hljs-regexp,
.dark-theme .hljs-tag,
.dark-theme .hljs-template-tag {
  color: #79c0ff !important;
}

/* 变量、属性 - 橙色 */
.dark-theme .hljs-variable,
.dark-theme .hljs-template-variable,
.dark-theme .hljs-attr,
.dark-theme .hljs-params {
  color: #ffa657 !important;
}

/* 函数名 - 紫色 */
.dark-theme .hljs-function,
.dark-theme .hljs-title.function_,
.dark-theme .hljs-title.class_,
.dark-theme .hljs-class .hljs-title {
  color: #d2a8ff !important;
  font-weight: 500;
}

/* 运算符、标点 - 浅灰色 */
.dark-theme .hljs-operator,
.dark-theme .hljs-punctuation {
  color: #c9d1d9 !important;
}

/* 特殊关键字（如 import, export） - 绿色 */
.dark-theme .hljs-keyword.hljs-import,
.dark-theme .hljs-keyword.hljs-export,
.dark-theme .hljs-keyword.hljs-from {
  color: #7ee787 !important;
}

/* 装饰器 - 黄色 */
.dark-theme .hljs-meta .hljs-keyword,
.dark-theme .hljs-decorator,
.dark-theme .hljs-annotation {
  color: #f0b72f !important;
}

/* 暗色主题下的表格样式 - 使用更高优先级 */
.dark-theme .article-detail-page table,
.dark-theme .article-content-html table,
.dark-theme .markdown-body table {
  border-collapse: collapse !important;
}

.dark-theme .article-detail-page table th,
.dark-theme .article-detail-page table td,
.dark-theme .article-content-html table th,
.dark-theme .article-content-html table td,
.dark-theme .markdown-body table th,
.dark-theme .markdown-body table td {
  border: 1px solid #30363d !important;
  color: #c9d1d9 !important;
}

.dark-theme .article-detail-page table th,
.dark-theme .article-content-html table th,
.dark-theme .markdown-body table th {
  background-color: #161b22 !important;
  color: #f0f6fc !important;
}

.dark-theme .article-detail-page table td,
.dark-theme .article-content-html table td,
.dark-theme .markdown-body table td {
  background-color: #0d1117 !important;
}

.dark-theme .article-detail-page table tr:nth-child(2n) td,
.dark-theme .article-content-html table tr:nth-child(2n) td,
.dark-theme .markdown-body table tr:nth-child(2n) td {
  background-color: #161b22 !important;
}
</style>
