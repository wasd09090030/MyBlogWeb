<template>
  <div class="tutorials-page min-vh-100">
    <!-- 头部区域：包含标题和筛选器 -->
    <div class="page-hero">
      <div class="container-fluid">
        <div class="hero-content text-center">
          <h1 class="page-title animate-in-up">教程专栏</h1>
          <p class="page-description animate-in-up delay-1">
            循序渐进，系统化掌握核心技术
          </p>
          
          <!-- 筛选与排序工具栏 -->
          <div class="toolbar animate-in-up delay-2">
            <div class="filter-scroll-container">
              <button 
                class="filter-chip" 
                :class="{ active: selectedTag === 'all' }"
                @click="selectTag('all')"
              >
                全部
              </button>
              <button 
                v-for="tag in availableTags" 
                :key="tag"
                class="filter-chip"
                :class="{ active: selectedTag === tag }"
                @click="selectTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
            
            <div class="sort-control">
              <button 
                class="sort-btn" 
                @click="toggleSort" 
                :title="sortOrder === 'desc' ? '切换为最早发布' : '切换为最新发布'"
              >
                <Icon name="arrow-down-up" size="sm" class="me-1" />
                {{ sortOrder === 'desc' ? '最新发布' : '最早发布' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="container-fluid content-container" ref="articleListContainer">
      <!-- 错误提示 -->
      <n-alert v-if="error" type="error" title="加载失败" class="mb-4 animate-in-fade">
        加载教程文章失败：{{ error.message }}
      </n-alert>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <LoadingSpinner text="正在整理教程资源..." size="large" />
      </div>

      <!-- 文章列表 -->
      <div v-else-if="paginatedArticles.length" class="tutorials-grid">
        <TransitionGroup name="list-stagger">
          <NuxtLink
            v-for="(article, index) in paginatedArticles"
            :key="article.id"
            :to="`/article/${article.id}`"
            class="tutorial-card glass-panel"
            :style="{ '--delay': `${index * 0.05}s` }"
          >
            <!-- 卡片封面 -->
            <div class="card-image-wrapper">
              <img
                v-if="article.coverImage && article.coverImage !== 'null'"
                :src="article.coverImage"
                :alt="article.title"
                class="card-img"
                loading="lazy"
                @error="handleImageError"
              />
              <div v-else class="image-placeholder gradient-soft">
                <Icon name="journal-code" size="3xl" class="opacity-50" />
              </div>
              
              <!-- 悬浮覆盖层 -->
              <div class="image-overlay">
                <span class="read-btn">
                  开始学习 <Icon name="arrow-right" size="sm" />
                </span>
              </div>
            </div>

            <!-- 卡片内容 -->
            <div class="card-content">
              <div class="card-meta">
                <span class="date">
                  <Icon name="calendar3" size="xs" class="me-1" />
                  {{ formatDate(article.createdAt) }}
                </span>
                <div v-if="article.tags && article.tags.length" class="tags-mini">
                  <span v-for="tag in article.tags.slice(0, 2)" :key="tag" class="tag-dot">#{{ tag }}</span>
                </div>
              </div>

              <h3 class="card-title" :title="article.title">{{ article.title }}</h3>
              
              <p class="card-excerpt">{{ getExcerpt(article.content) }}</p>
            </div>
          </NuxtLink>
        </TransitionGroup>
      </div>

      <!-- 空状态 -->
      <n-empty v-else description="暂无符合条件的教程" class="my-5 animate-in-fade">
        <template #icon>
          <Icon name="journal-x" size="4xl" />
        </template>
        <template #extra>
          <button class="btn-reset" @click="resetFilters">重置筛选</button>
        </template>
      </n-empty>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination-wrapper animate-in-up delay-3">
        <n-pagination
          v-model:page="currentPage"
          :page-count="totalPages"
          :page-slot="5"
          size="medium"
          @update:page="scrollToListTop"
        />
        <div class="pagination-info">
          第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useArticles } from '~/composables/useArticles'

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
  title: '教程专栏 - 系统化学习资源',
  meta: [
    { name: 'description', content: '精心编排的开发教程，涵盖前端、后端、设计等多个领域，助你系统化掌握核心技术。' },
    { name: 'keywords', content: '编程教程,Web开发,Vue3,Nuxt,设计系统,UI/UX' }
  ]
})

// 状态管理
const articleListContainer = ref(null)
const articles = ref([])
const error = ref(null)
const loading = ref(true)
const { getAllArticles } = useArticles()

// 筛选与排序状态
const currentPage = ref(1)
const articlesPerPage = 9 // 3x3 grid
const selectedTag = ref('all')
const sortOrder = ref('desc') // 'desc' | 'asc'

// 获取所有基础文章数据
const fetchArticles = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await getAllArticles()
    articles.value = data || []
  } catch (e) {
    error.value = e
    console.error('获取教程失败:', e)
  } finally {
    loading.value = false
  }
}

// 1. 过滤出所有教程类的文章
const allTutorialArticles = computed(() => {
  return articles.value.filter(article => {
    if (!article.tags || !Array.isArray(article.tags)) return false
    return article.tags.includes('教程')
  })
})

// 2. 提取所有可用标签（排除'教程'本身，因为它在所有文章中都存在）
const availableTags = computed(() => {
  const tags = new Set()
  allTutorialArticles.value.forEach(article => {
    article.tags.forEach(tag => {
      if (tag !== '教程') tags.add(tag)
    })
  })
  return Array.from(tags).sort()
})

// 3. 根据用户选择进行筛选和排序
const processedArticles = computed(() => {
  let result = [...allTutorialArticles.value]

  // 标签筛选
  if (selectedTag.value !== 'all') {
    result = result.filter(article => article.tags.includes(selectedTag.value))
  }

  // 排序
  result.sort((a, b) => {
    const dateA = new Date(a.createdAt)
    const dateB = new Date(b.createdAt)
    return sortOrder.value === 'desc' ? dateB - dateA : dateA - dateB
  })

  return result
})

// 4. 分页逻辑
const totalPages = computed(() => Math.ceil(processedArticles.value.length / articlesPerPage))
const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * articlesPerPage
  return processedArticles.value.slice(start, start + articlesPerPage)
})

// 交互方法
const selectTag = (tag) => {
  selectedTag.value = tag
  currentPage.value = 1 // 重置页码
}

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  currentPage.value = 1
}

const resetFilters = () => {
  selectedTag.value = 'all'
  sortOrder.value = 'desc'
  currentPage.value = 1
}

const scrollToListTop = () => {
  nextTick(() => {
    if (articleListContainer.value) {
      window.scrollTo({
        top: articleListContainer.value.offsetTop - 100,
        behavior: 'smooth'
      })
    }
  })
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
  event.target.parentElement.classList.add('image-error-fallback')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const getExcerpt = (content) => {
  if (!content) return ''
  return content.replace(/<[^>]*>/g, '').trim().substring(0, 100) + '...'
}

// 生命周期
onMounted(() => {
  fetchArticles()
})

// 监听筛选条件变化，如果当前页超过总页数，重置为第1页
watch([selectedTag, sortOrder], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = 1
  }
})

defineExpose({ refreshData: fetchArticles })
</script>

<style scoped>
/* 页面容器 */
.tutorials-page {
  padding-bottom: 4rem;
}

/* Hero Section */
.page-hero {
  padding: 2rem 1rem 1.5rem;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.page-description {
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto 2rem;
}

/* 筛选工具栏 */
.toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  max-width: 900px;
  margin: 0 auto;
  padding: 0.5rem;
}

.filter-scroll-container {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.25rem 0.5rem;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  max-width: 100%;
}

.filter-scroll-container::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  padding: 0.4rem 1rem;
  border-radius: 2rem;
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}

.filter-chip:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  transform: translateY(-1px);
}

.filter-chip.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--accent-primary), transparent 75%);
}

.sort-btn {
  display: flex;
  align-items: center;
  padding: 0.4rem 1rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: color 0.2s;
}

.sort-btn:hover {
  color: var(--accent-primary);
}

.btn-reset {
  background: var(--accent-primary);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 2rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: var(--accent-primary-hover, #0b5ed7);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 列表网格 */
.tutorials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  padding: 0 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* 卡片样式 */
.tutorial-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
}

.dark-theme .tutorial-card {
  background: rgba(30, 30, 30, 0.6);
  border-color: rgba(255, 255, 255, 0.05);
}

.tutorial-card:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
  border-color: var(--accent-primary);
  z-index: 10;
}

.dark-theme .tutorial-card:hover {
  background: rgba(40, 40, 40, 0.8);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3);
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 */
  overflow: hidden;
}

.card-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.tutorial-card:hover .card-img {
  transform: scale(1.08);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(2px);
}

.tutorial-card:hover .image-overlay {
  opacity: 1;
}

.read-btn {
  color: white;
  font-weight: 600;
  padding: 0.5rem 1.2rem;
  border-radius: 2rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(4px);
  transform: translateY(10px);
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tutorial-card:hover .read-btn {
  transform: translateY(0);
}

.card-content {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.tags-mini {
  display: flex;
  gap: 0.5rem;
}

.tag-dot {
  color: var(--accent-primary);
  font-weight: 500;
  background: color-mix(in srgb, var(--accent-primary), transparent 90%);
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
}

.card-title {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin-bottom: 0.75rem;

}

.card-excerpt {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 0;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.pagination-info {
  color: var(--text-tertiary);
  font-size: 0.9rem;
}

/* 动画 */
.animate-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.animate-in-fade {
  animation: fadeIn 0.6s ease forwards;
  opacity: 0;
}

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  to { opacity: 1; }
}

/* 列表交错动画 Vue Transition Group */
.list-stagger-enter-active,
.list-stagger-leave-active {
  transition: all 0.4s ease;
  transition-delay: var(--delay);
}
.list-stagger-enter-from,
.list-stagger-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .tutorials-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .sort-control {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
