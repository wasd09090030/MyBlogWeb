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
      class="tutorials-list"
    >
      <div class="page-header">
        <h3 class="page-title">教程专栏</h3>
        <p class="page-description">技多不压身</p>
      </div>
      <div
        v-for="(article, index) in paginatedArticles"
        :key="article.id"
        class="tutorial-item"
      >
        <!-- 序号 -->
        <div class="tutorial-number">
          <span class="number-text">{{ String(currentIndex + index + 1).padStart(2, '0') }}</span>
        </div>

        <!-- 卡片内容 -->
        <div class="tutorial-card">
          <!-- 左侧图片 -->
          <div class="tutorial-image">
            <img
              v-if="article.coverImage && article.coverImage !== 'null'"
              :src="article.coverImage"
              :alt="article.title"
              loading="lazy"
              @error="handleImageError"
            />
            <div v-else class="image-placeholder">
              <Icon name="image" size="2xl" class="text-muted" />
            </div>
          </div>

          <!-- 右侧内容 -->
          <div class="tutorial-content">
            <div class="tutorial-header">
              <NuxtLink :to="`/article/${article.id}`" class="tutorial-title-link">
                <h3 class="tutorial-title">{{ article.title }}</h3>
              </NuxtLink>
              <span class="tutorial-date">{{ formatDate(article.createdAt) }}</span>
            </div>

            <div class="tutorial-summary">
              {{ getExcerpt(article.content) }}
            </div>
          </div>
        </div>
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
  font-size: 1rem;
  color: var(--text-muted, #6c757d);
  margin: 0;
}

.tutorials-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 15px;
  padding: 2rem;
}

.tutorial-item {
  display: flex;
  flex-direction: row-reverse;
  gap: 1.5rem;
  align-items: stretch;
}

.tutorial-number {
  flex-shrink: 0;
  width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.number-text {
  font-size: 2.5rem;
  font-weight: 400;
  color: #abababea;
  line-height: 1;
}

.tutorial-card {
  flex: 1;
  display: flex;
  gap: 1.5rem;
  border-radius: 12px;
  overflow: visible;
  text-decoration: none;
  color: inherit;
}

.tutorial-image {
  flex-shrink: 0;
  width: 280px;
  height: 180px;
  overflow: hidden;
  background: var(--bg-secondary, #f8f9fa);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.tutorial-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--text-muted, #adb5bd);
}

.tutorial-content {
  flex: 1;
  padding: 1.5rem 1.5rem 1.5rem 0;
  display: flex;
  flex-direction: column;
}

.tutorial-header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.tutorial-title-link {
  flex: 1;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.tutorial-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #2c3e50);
  margin: 0;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.tutorial-title-link:hover .tutorial-title {
  color: #667eea;
}

.tutorial-date {
  flex-shrink: 0;
  color: var(--text-muted, #6c757d);
  font-size: 0.875rem;
  white-space: nowrap;
}

.tutorial-summary {
  font-size: 0.938rem;
  color: var(--text-secondary, #5a6c7d);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

/* 分页样式 */
.pagination-container {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color, #e5e5e5);
}

/* 深色主题 */
.dark-theme .page-header {
  border-bottom-color: var(--border-color-dark, #333);
}

.dark-theme .page-title {
  color: var(--text-primary-dark, #e4e6eb);
}

.dark-theme .page-description {
  color: var(--text-muted-dark, #adb5bd);
}

.dark-theme .tutorials-list {
  background: rgba(26, 26, 26, 0.8);
}

.dark-theme .tutorial-card {
  background: transparent;
}

.dark-theme .tutorial-image {
  background: var(--bg-secondary-dark, #2a2a2a);
}

.dark-theme .number-text {
  color: #4a4a4a;
}

.dark-theme .tutorial-date {
  color: var(--text-muted-dark, #adb5bd);
}

.dark-theme .tutorial-title {
  color: var(--text-primary-dark, #e4e6eb);
}

.dark-theme .tutorial-title-link:hover .tutorial-title {
  color: #8b9bea;
}

.dark-theme .tutorial-summary {
  color: var(--text-secondary-dark, #b8bcc2);
}

.dark-theme .tutorial-tag {
  background: var(--tag-bg-dark, #2a2a2a);
  color: var(--text-secondary-dark, #b8bcc2);
}

.dark-theme .pagination-container {
  border-top-color: var(--border-color-dark, #333);
}

/* 响应式设计 */
@media (max-width: 992px) {
  .tutorial-number {
    width: 50px;
  }
  
  .number-text {
    font-size: 2rem;
  }
  
  .tutorial-image {
    width: 220px;
    height: 150px;
  }
  
  .tutorial-title {
    font-size: 1.125rem;
  }
}

@media (max-width: 768px) {
  .tutorials-page {
    padding: 0;
  }
  
  .tutorials-list {
    padding: 1.5rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .tutorial-item {
    flex-direction: column-reverse;
    gap: 1rem;
  }
  
  .tutorial-number {
    width: 100%;
    justify-content: flex-start;
    padding-left: 0.5rem;
  }
  
  .number-text {
    font-size: 1.75rem;
  }
  
  .tutorial-card {
    flex-direction: column;
    gap: 0;
  }
  
  .tutorial-image {
    width: 100%;
    height: 200px;
  }
  
  .tutorial-content {
    padding: 1.25rem;
  }
  
  .tutorial-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .tutorial-title {
    font-size: 1.125rem;
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  .tutorial-summary {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.75rem;
  }
  
  .page-description {
    font-size: 0.875rem;
  }
  
  .tutorials-list {
    gap: 1.5rem;
    padding: 1rem;
  }
}
</style>
