<template>
  <div class="tutorials-page" ref="articleListContainer">
    <n-alert v-if="error" type="error" title="加载失败" class="mb-4">
      加载教程文章失败：{{ error.message }}
    </n-alert>

    <LoadingSpinner
      v-if="loading"
      text="正在加载教程列表..."
      size="medium"
    />

    <div
      v-else-if="paginatedArticles.length"
      class="tutorials-content"
    >
      <div class="page-header">
        <h3 class="page-title">教程专栏</h3>
        <p class="page-description">循序渐进，系统化掌握核心技术</p>
      </div>
      
      <div class="tutorials-grid">
        <NuxtLink
          v-for="(article, index) in paginatedArticles"
          :key="article.id"
          :to="`/article/${article.id}`"
          class="tutorial-card"
        >
          <div class="card-image">
            <img
              v-if="article.coverImage && article.coverImage !== 'null'"
              :src="article.coverImage"
              :alt="article.title"
              loading="lazy"
              @error="handleImageError"
            />
            <div v-else class="image-placeholder">
              <Icon name="image" size="3xl" class="text-muted" />
            </div>
            
            <!-- 序号角标 -->
            <div class="card-index">
              {{ String(currentIndex + index + 1).padStart(2, '0') }}
            </div>
          </div>

          <div class="card-body">
            <h3 class="card-title" :title="article.title">{{ article.title }}</h3>
            <div class="card-meta">
              <Icon name="calendar3" size="xs" class="me-1" />
              {{ formatDate(article.createdAt) }}
            </div>
            <p class="card-summary">{{ getExcerpt(article.content) }}</p>
            
            <div class="card-footer">
              <span class="read-more">阅读全文 <Icon name="arrow-right" size="xs" /></span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <n-empty v-else description="暂无教程文章" class="my-5">
      <template #icon>
        <Icon name="journal-text" size="3xl" />
      </template>
      <template #extra>
        <NuxtLink to="/" class="btn btn-primary">
          返回首页
        </NuxtLink>
      </template>
    </n-empty>

    <div v-if="totalPages > 1" class="pagination-container mt-4">
      <div class="d-flex justify-content-center">
        <n-pagination
          v-model:page="currentPage"
          :page-count="totalPages"
          :page-slot="7"
          @update:page="scrollToListTop"
        />
      </div>

      <div class="text-center text-muted mt-3">
        共 {{ tutorialArticles.length }} 篇教程，当前 {{ currentPage }} / {{ totalPages }} 页
      </div>
    </div>
  </div>
</template>

<script setup>
import { useArticles } from '~/composables/useArticles'

// 设置页面元数据，设置布局为不显示侧边栏
definePageMeta({
  name: 'tutorials',
  keepalive: true,
  key: () => 'tutorials-page',
  layout: 'default'
})

defineOptions({
  name: 'TutorialsPage'
})

useHead({
  title: 'WyrmKk - 教程',
  meta: [
    { name: 'description', content: '系统化的学习资源，带你深入理解各类技术知识' },
    { name: 'keywords', content: '教程,学习,技术教程,编程教程' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/icon/favicon.ico' }
  ]
})

const articleListContainer = ref(null)
const articles = ref([])
const error = ref(null)
const loading = ref(false)

const { getAllArticles } = useArticles()

const currentPage = ref(1)
const articlesPerPage = 10

// 过滤出带有"教程"标签的文章，并按创建时间倒序排列
const tutorialArticles = computed(() => {
  return articles.value
    .filter(article => {
      // 检查文章是否有 tags 属性，并且包含"教程"标签
      if (!article.tags || !Array.isArray(article.tags)) return false
      return article.tags.some(tag => tag === '教程')
    })
    .sort((a, b) => {
      // 按创建时间倒序排列（新的在上）
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return dateB - dateA
    })
})

const totalPages = computed(() => Math.ceil(tutorialArticles.value.length / articlesPerPage))
const currentIndex = computed(() => (currentPage.value - 1) * articlesPerPage)

const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * articlesPerPage
  return tutorialArticles.value.slice(start, start + articlesPerPage)
})

const scrollToListTop = () => {
  nextTick(() => {
    if (articleListContainer.value) {
      articleListContainer.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

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

const getExcerpt = (content) => {
  if (!content) return ''
  // 只移除 HTML 标签，不截取字数，让 CSS line-clamp 控制显示
  return content.replace(/<[^>]*>/g, '').trim()
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

function formatDate(dateString) {
  if (!dateString) return '未知日期'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchArticles = async () => {
  if (loading.value) return

  loading.value = true
  error.value = null

  try {
    console.log('TutorialsPage: 开始获取文章数据...')
    const articlesData = await getAllArticles()
    articles.value = articlesData
    console.log('TutorialsPage: 获取文章成功，总数:', articles.value.length)
    console.log('TutorialsPage: 教程文章数量:', tutorialArticles.value.length)
  } catch (e) {
    error.value = e
    console.error('TutorialsPage: 获取文章失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  console.log('TutorialsPage: 组件挂载')
  await fetchArticles()
})

onActivated(() => {
  console.log('TutorialsPage: 组件被激活（从缓存恢复）')
})

onDeactivated(() => {
  console.log('TutorialsPage: 组件被停用（进入缓存）')
})

// 监听页码变化，确保不超出范围
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal && newTotal > 0) {
    currentPage.value = newTotal
  }
})

const refreshData = async () => {
  console.log('TutorialsPage: 手动刷新数据')
  await fetchArticles()
}

defineExpose({
  refreshData
})
</script>

<style scoped>
.tutorials-page {
  width: 100%;
  margin: 0;
  padding: 0;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid var(--border-color, #e5e5e5);
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary, #2c3e50);
  margin-bottom: 0.5rem;
  background-color: #3b3838;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  font-size: 1.1rem;
  color: var(--text-secondary, #5a6c7d);
  max-width: 600px;
  margin: 0 auto;
}

.tutorials-content {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.tutorials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-top: 2rem;
}

.tutorial-card {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  height: 100%;
}

.tutorial-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
  border-color: rgba(100, 108, 255, 0.3);
}

.card-image {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  background: var(--bg-secondary, #f1f3f5);
  overflow: hidden;
}

.card-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.tutorial-card:hover .card-image img {
  transform: scale(1.05);
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dee2e6;
}

.card-index {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 1px;
  z-index: 2;
}

.card-body {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary, #2d3748);
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tutorial-card:hover .card-title {
  color: #646cff;
}

.card-meta {
  display: flex;
  align-items: center;
  color: var(--text-muted, #9ca3af);
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.card-summary {
  font-size: 0.95rem;
  color: var(--text-secondary, #4a5568);
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
}

.card-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, #f0f0f0);
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.read-more {
  font-size: 0.875rem;
  font-weight: 600;
  color: #646cff;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: gap 0.2s ease;
}

.tutorial-card:hover .read-more {
  gap: 0.5rem;
}

/* 深色主题 */
.dark-theme .page-header {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.dark-theme .page-title {
  color: var(--text-primary-dark, #f3f4f6);
}

.dark-theme .page-description {
  color: var(--text-secondary-dark, #9ca3af);
}

.dark-theme .tutorials-content {
  background: rgba(30, 30, 30, 0.6);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark-theme .tutorial-card {
  background: rgba(40, 40, 40, 0.9);
  border-color: rgba(255, 255, 255, 0.05);
}

.dark-theme .tutorial-card:hover {
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.5);
  border-color: rgba(100, 108, 255, 0.4);
}

.dark-theme .card-image {
  background: #2d3748;
}

.dark-theme .card-title {
  color: #e2e8f0;
}

.dark-theme .tutorial-card:hover .card-title {
  color: #818cf8;
}

.dark-theme .card-summary {
  color: #cbd5e0;
}

.dark-theme .card-footer {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.dark-theme .read-more {
  color: #818cf8;
}

.dark-theme .image-placeholder {
  color: #4a5568;
}


/* 响应式设计 */
@media (max-width: 992px) {
  .tutorials-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .tutorials-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .tutorials-content {
    padding: 1.5rem;
  }

  .card-image {
    height: 200px;
  }
}

@media (max-width: 480px) {
  .tutorials-content {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .card-body {
    padding: 1rem;
  }
}
</style>
