<template>
  <div class="article-detail-page">
    <div class="container">
      <!-- 返回按钮 -->
      <div class="mb-4">
        <NuxtLink to="/" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-2"></i>返回文章列表
        </NuxtLink>
      </div>

      <!-- 加载状态 -->
      <LoadingSpinner v-if="loading" text="正在加载文章..." :size="'large'" />

      <!-- 错误状态 -->
      <div v-else-if="error" class="alert alert-danger" role="alert">
        <i class="bi bi-exclamation-triangle me-2"></i>
        加载文章失败: {{ error.message }}
        <button class="btn btn-sm btn-outline-danger ms-3" @click="fetchArticle">
          重试
        </button>
      </div>

      <!-- 文章内容 -->
      <article v-else-if="article" class="article-content">
        <!-- 文章头部 -->
        <header class="article-header mb-4">
          <div class="article-meta mb-3">
            <span class="article-date">
              <i class="bi bi-calendar3 me-1"></i>
              {{ formatDate(article.createdAt) }}
            </span>
            <span :class="['article-category', getCategoryClass(article.category)]">
              {{ getCategoryName(article.category) }}
            </span>
          </div>

          <h1 class="article-title">{{ article.title }}</h1>

          <!-- 文章封面图 -->
          <div v-if="article.coverImage && article.coverImage !== 'null'" class="article-cover-image mb-4">
            <img
              :src="article.coverImage"
              :alt="article.title"
              class="img-fluid rounded shadow"
              @error="handleImageError"
            />
          </div>
        </header>

        <!-- 文章正文 -->
        <div class="article-body markdown-body">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="article.content"></div>
        </div>

        <!-- 文章底部 -->
        <footer class="article-footer mt-5 pt-4 border-top">
          <div class="d-flex justify-content-between align-items-center">
            <div class="article-tags">
              <span v-if="article.tags" class="text-muted">
                <i class="bi bi-tags me-1"></i>
                {{ article.tags }}
              </span>
            </div>
            <div class="article-actions">
              <button class="btn btn-sm btn-outline-primary me-2" @click="shareArticle">
                <i class="bi bi-share me-1"></i>分享
              </button>
              <button class="btn btn-sm btn-outline-secondary" @click="copyLink">
                <i class="bi bi-link-45deg me-1"></i>复制链接
              </button>
            </div>
          </div>
        </footer>
      </article>

      <!-- 评论区域 -->
      <CommentSection v-if="article" :article-id="article.id" class="mt-5" />

      <!-- 相关文章推荐 -->
      <section v-if="relatedArticles.length" class="related-articles mt-5">
        <h3 class="mb-4">相关文章</h3>
        <div class="row">
          <div v-for="related in relatedArticles" :key="related.id" class="col-md-6 col-lg-4 mb-3">
            <div class="card h-100">
              <div v-if="related.coverImage && related.coverImage !== 'null'" class="card-img-top">
                <img
                  :src="related.coverImage"
                  :alt="related.title"
                  class="img-fluid"
                  style="height: 200px; object-fit: cover; width: 100%;"
                  @error="handleImageError"
                />
              </div>
              <div class="card-body">
                <div class="card-text small text-muted mb-2">
                  {{ formatDate(related.createdAt) }}
                </div>
                <h5 class="card-title">
                  <NuxtLink :to="`/article/${related.id}`" class="text-decoration-none">
                    {{ related.title }}
                  </NuxtLink>
                </h5>
                <div class="card-text">
                  <div v-html="getExcerpt(related.content)" class="text-muted small"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { useArticles } from '~/composables/useArticles'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import CommentSection from '~/components/CommentSection.vue'
import '~/assets/css/components/ArticleDetail.styles.css'

// 获取路由参数
const route = useRoute()
const router = useRouter()

// 响应式数据
const article = ref(null)
const relatedArticles = ref([])
const error = ref(null)
const loading = ref(false)

// API composable
const { getArticleById, getAllArticles } = useArticles()

// 设置页面元数据
useHead(() => ({
  title: article.value?.title || '文章详情',
  meta: [
    {
      name: 'description',
      content: article.value ? getExcerpt(article.value.content).replace('...', '') : '文章详情'
    },
    {
      property: 'og:title',
      content: article.value?.title || '文章详情'
    },
    {
      property: 'og:description',
      content: article.value ? getExcerpt(article.value.content).replace('...', '') : '文章详情'
    },
    ...(article.value?.coverImage ? [{
      property: 'og:image',
      content: article.value.coverImage
    }] : [])
  ]
}))

// 获取分类中文名称
const getCategoryName = (category) => {
  if (!category) return '其他'
  const lowerCategory = category.toLowerCase()
  const categoryMap = {
    'study': '学习',
    'game': '游戏',
    'work': '个人作品',
    'resource': '资源分享'
  }
  return categoryMap[lowerCategory] || '其他'
}

// 获取分类样式类
const getCategoryClass = (category) => {
  if (!category) return 'category-other'
  const lowerCategory = category.toLowerCase()
  const categoryClassMap = {
    'study': 'category-study',
    'game': 'category-game',
    'work': 'category-work',
    'resource': 'category-resource'
  }
  return categoryClassMap[lowerCategory] || 'category-other'
}

// 获取文章摘要
const getExcerpt = (content) => {
  if (!content) return ''
  const plainText = content.replace(/<[^>]*>/g, '')
  return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知日期'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// 获取文章数据
const fetchArticle = async () => {
  if (loading.value) return

  loading.value = true
  error.value = null

  try {
    console.log('ArticleDetail: 开始获取文章数据，ID:', route.params.id)
    const articleData = await getArticleById(route.params.id)
    article.value = articleData
    console.log('ArticleDetail: 获取文章数据成功')

    // 获取相关文章（同分类的其他文章）
    if (article.value.category) {
      await fetchRelatedArticles()
    }
  } catch (e) {
    error.value = e
    console.error('ArticleDetail: 获取文章失败:', e)

    // 如果是404错误，抛出以便Nuxt处理
    if (e.response?.status === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: '文章不存在'
      })
    }
  } finally {
    loading.value = false
  }
}

// 获取相关文章
const fetchRelatedArticles = async () => {
  try {
    const allArticles = await getAllArticles()

    // 筛选同分类的文章，排除当前文章
    relatedArticles.value = allArticles
      .filter(a =>
        a.category === article.value.category &&
        a.id !== article.value.id
      )
      .slice(0, 6) // 最多显示6篇相关文章
  } catch (e) {
    console.error('获取相关文章失败:', e)
  }
}

// 分享文章
const shareArticle = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: article.value.title,
        text: getExcerpt(article.value.content),
        url: window.location.href
      })
    } catch (err) {
      console.log('分享取消或失败')
    }
  } else {
    // 如果不支持原生分享，复制链接
    copyLink()
  }
}

// 复制链接
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)

    // 显示成功提示
    const toast = document.createElement('div')
    toast.className = 'position-fixed top-50 start-50 translate-middle bg-success text-white px-3 py-2 rounded shadow'
    toast.textContent = '链接已复制到剪贴板'
    toast.style.zIndex = '9999'
    document.body.appendChild(toast)

    setTimeout(() => {
      document.body.removeChild(toast)
    }, 2000)
  } catch (err) {
    console.error('复制链接失败:', err)
  }
}

// 监听路由参数变化
watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId) {
    fetchArticle()
  }
})

// 组件挂载时获取数据
onMounted(() => {
  fetchArticle()
})
</script>

<style scoped>
.article-detail-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.article-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 2rem;
}

.article-header {
  text-align: center;
}

.article-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.article-date {
  color: #6c757d;
  font-size: 0.9rem;
}

.article-category {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.category-study {
  background: #e3f2fd;
  color: #1976d2;
}

.category-game {
  background: #fce4ec;
  color: #c2185b;
}

.category-work {
  background: #e8f5e8;
  color: #388e3c;
}

.category-resource {
  background: #fff3e0;
  color: #f57c00;
}

.category-other {
  background: #f5f5f5;
  color: #616161;
}

.article-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #212529;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.article-cover-image img {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
}

.article-body {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  text-align: left;
}

/* Markdown内容样式 */
:deep(.markdown-body) {
  background: transparent;
  padding: 0;
}

:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3),
:deep(.markdown-body h4),
:deep(.markdown-body h5),
:deep(.markdown-body h6) {
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #212529;
}

:deep(.markdown-body h1) {
  font-size: 2rem;
  border-bottom: 2px solid #dee2e6;
  padding-bottom: 0.5rem;
}

:deep(.markdown-body h2) {
  font-size: 1.75rem;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 0.5rem;
}

:deep(.markdown-body h3) {
  font-size: 1.5rem;
}

:deep(.markdown-body p) {
  margin-bottom: 1.5rem;
}

:deep(.markdown-body blockquote) {
  border-left: 4px solid #0d6efd;
  padding-left: 1rem;
  margin: 1.5rem 0;
  color: #6c757d;
  font-style: italic;
}

:deep(.markdown-body pre) {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}

:deep(.markdown-body code) {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.9rem;
}

:deep(.markdown-body pre code) {
  background: transparent;
  padding: 0;
}

:deep(.markdown-body img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1rem 0;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  margin-bottom: 1.5rem;
  padding-left: 2rem;
}

:deep(.markdown-body li) {
  margin-bottom: 0.5rem;
}

:deep(.markdown-body table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

:deep(.markdown-body th),
:deep(.markdown-body td) {
  border: 1px solid #dee2e6;
  padding: 0.75rem;
  text-align: left;
}

:deep(.markdown-body th) {
  background: #f8f9fa;
  font-weight: 600;
}

.article-footer {
  color: #6c757d;
}

.article-actions .btn {
  transition: all 0.3s ease;
}

.article-actions .btn:hover {
  transform: translateY(-1px);
}

.related-articles {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 2rem;
}

.related-articles h3 {
  color: #212529;
  border-bottom: 2px solid #0d6efd;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.related-articles .card {
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.related-articles .card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.related-articles .card-title a {
  color: #212529;
  font-size: 1.1rem;
  font-weight: 600;
}

.related-articles .card-title a:hover {
  color: #0d6efd;
}

@media (max-width: 768px) {
  .article-detail-page {
    padding: 1rem 0.5rem;
  }

  .article-content {
    padding: 1rem;
  }

  .article-title {
    font-size: 1.75rem;
  }

  .article-body {
    font-size: 1rem;
  }

  .related-articles {
    padding: 1rem;
  }
}
</style>