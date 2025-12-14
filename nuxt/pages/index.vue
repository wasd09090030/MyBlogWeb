<template>
  <div class="article-list-page" ref="articleListContainer">
    <div class="page-header">
      <div class="page-header__title">
        <div class="page-header__icon">
          <img src="/icon/IcBaselineLibraryBooks.svg" alt="文章列表图标" />
        </div>
        <div class="page-header__title-text">
          <h1 class="page-header__heading">{{ pageTitle }}</h1>
          <p class="page-header__subtitle">{{ pageDescription }}</p>
        </div>
      </div>

      <div class="page-header__actions" role="group" aria-label="视图切换">
        <button
          type="button"
          class="view-toggle-btn"
          :class="{ active: isListView }"
          @click="setViewMode('list')"
          :aria-pressed="isListView"
        >
          <Icon name="view-stacked" size="sm" class="me-1" />列表视图
        </button>
        <button
          type="button"
          class="view-toggle-btn"
          :class="{ active: isGridView }"
          @click="setViewMode('grid')"
          :aria-pressed="isGridView"
        >
          <Icon name="grid-3x3-gap-fill" size="sm" class="me-1" />网格视图
        </button>
      </div>
    </div>

    <n-alert v-if="error" type="error" title="加载失败" class="mb-4">
      加载或操作文章失败：{{ error.message }}
    </n-alert>

    <n-alert v-if="route.query.search || route.query.category" type="info" class="mb-4" closable @close="clearSearch">
      <template #header>
        <div class="d-flex flex-wrap align-items-center gap-3">
          <span v-if="route.query.search">搜索结果："{{ route.query.search }}"</span>
          <span v-if="route.query.category">分类筛选：{{ getCategoryName(route.query.category) }}</span>
        </div>
      </template>
    </n-alert>

    <SkeletonLoader
      v-if="loading && useSkeletonLoader"
      :count="4"
    />
    <LoadingSpinner
      v-else-if="loading"
      :text="loadingText"
      size="medium"
    />

    <TransitionGroup
      v-else-if="listContext.articles.length"
      tag="div"
      name="layout-fade"
      :class="articlesContainerClasses"
    >
      <div
        v-for="(article, index) in listContext.articles"
        :key="article.id"
        v-memo="[article.id, article.title, article.coverImage, article.createdAt, article.category, listContext.currentPage, effectiveViewMode]"
        :class="[
          'article-card',
          {
            'article-card-reverse': isListView && (listContext.indexOffset + index + 1) % 2 === 0,
            'article-card-grid': isGridView
          }
        ]"
      >
        <!-- 封面图片区域 -->
        <div class="article-image-section">
          <img
            v-if="article.coverImage && article.coverImage !== 'null'"
            :src="article.coverImage"
            :alt="article.title"
            class="article-image lazy-image"
            style="height: 300px; aspect-ratio: 16/9; object-fit: cover; width: 100%;"
            @error="handleImageError"
            @load="handleImageLoad"
            loading="lazy"
          />
          <div v-else class="article-image-placeholder">
            <Icon name="image" size="3xl" class="text-muted" />
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="article-content-section">
          <div class="article-meta mb-2">
            <span class="article-date">{{ formatDate(article.createdAt) }}</span>
            <span :class="['article-category', getCategoryClass(article.category)]">
              {{ getCategoryName(article.category) }}
            </span>
          </div>

          <NuxtLink :to="getArticleDetailRoute(article.id)" class="article-title-link">
            <h3 class="article-title">{{ article.title }}</h3>
          </NuxtLink>

          <div class="article-excerpt">
            <div v-html="getExcerpt(article.content)" class="article-content-preview"></div>
          </div>

          <!-- 文章标签 -->
          <div v-if="article.tags && article.tags.length > 0" class="article-tags">
            <span v-for="tag in article.tags" :key="tag" class="article-tag">
              {{ tag }}
            </span>
          </div>

          <NuxtLink :to="getArticleDetailRoute(article.id)" class="learn-more learn-more-sm">
            <span class="circle" aria-hidden="true">
              <span class="icon arrow"></span>
            </span>
            <span class="button-text">阅读全文</span>
          </NuxtLink>
        </div>
      </div>
    </TransitionGroup>

    <n-empty v-else :description="listContext.emptyText" class="my-5">
      <template #icon>
        <Icon name="journal-text" size="3xl" />
      </template>
    </n-empty>

    <div v-if="listContext.totalPages > 1" class="pagination-container mt-4">
      <div class="d-flex justify-content-center">
        <n-pagination
          v-model:page="paginationPage"
          :page-count="listContext.totalPages"
          :page-slot="7"
        />
      </div>

      <div class="text-center text-muted mt-3">
        共 {{ listContext.totalCount }} 篇文章，当前 {{ listContext.currentPage }} / {{ listContext.totalPages }} 页
      </div>
    </div>
  </div>
</template>

<script setup>
import { useArticles } from '~/composables/useArticles'
import '~/assets/css/components/ArticleList.styles.css'

// 设置页面元数据，启用 keepalive
definePageMeta({
  name: 'index',
  keepalive: true,
  key: () => 'index-page'
})

// 定义组件名称，方便 keep-alive 缓存命中
defineOptions({
  name: 'ArticleListPage'
})

const route = useRoute()
const viewMode = ref('list')
const isSwitchingView = ref(false)
const isMobile = ref(false)
let viewSwitchTimer = null

// 检测是否为移动端
const checkMobile = () => {
  if (import.meta.client) {
    isMobile.value = window.innerWidth <= 768
  }
}

// 实际使用的视图模式（移动端强制网格视图）
const effectiveViewMode = computed(() => {
  return isMobile.value ? 'grid' : viewMode.value
})

const pageTitle = computed(() => {
  if (route.query.search) return '搜索结果'
  if (route.query.category === 'study') return '学习'
  if (route.query.category === 'game') return '游戏'
  if (route.query.category === 'work') return '个人作品'
  if (route.query.category === 'resource') return '资源分享'
  return '首页'
})

const pageDescription = computed(() => {
  if (route.query.search) return '根据关键词实时筛选出的相关文章'
  const categoryDescriptions = {
    'study': '记录学习心得和技术沉淀',
    'game': '游戏体验与创意灵感',
    'work': '个人作品与项目总结',
    'resource': '精选资源与效率工具'
  }
  if (route.query.category) {
    const key = route.query.category.toLowerCase()
    return categoryDescriptions[key] || '精选文章与阅读灵感'
  }
  return '精选文章与最新动态，欢迎随时探索更多内容'
})

useHead(() => ({
  title: `WyrmKk - ${pageTitle.value}`,
  meta: [
    { name: 'description', content: '欢迎来到我的个人博客，分享技术文章和生活感悟' },
    { name: 'keywords', content: '博客,文章,技术分享,个人网站' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/icon/favicon.ico' }
  ]
}))

const articleListContainer = ref(null)
const articles = ref([])
const error = ref(null)
const loading = ref(false)
const savedScrollPosition = ref(0)

const { getAllArticles, getArticlesByCategory, searchArticles } = useArticles()

const currentPage = ref(1)
const currentFilteredPage = ref(1)
const articlesPerPage = 8
const useSkeletonLoader = ref(true)

// Naive UI 分页组件需要的响应式变量
const paginationPage = computed({
  get: () => isFilteredMode.value ? currentFilteredPage.value : currentPage.value,
  set: (val) => {
    if (isFilteredMode.value) {
      goToFilteredPage(val)
    } else {
      goToPage(val)
    }
  }
})

const isFilteredMode = computed(() => Boolean(route.query.search || route.query.category))
const isListView = computed(() => effectiveViewMode.value === 'list')
const isGridView = computed(() => effectiveViewMode.value === 'grid')
const articlesContainerClasses = computed(() => [
  'articles-container',
  {
    'grid-mode': isGridView.value,
    'list-mode': isListView.value,
    'view-switching': isSwitchingView.value
  }
])

const loadingText = computed(() => {
  if (route.query.search) return '正在搜索文章...'
  if (route.query.category) return '正在筛选文章...'
  return '正在加载文章列表...'
})

const emptyMessage = computed(() => {
  if (route.query.search) return '没有找到匹配搜索条件的文章'
  if (route.query.category) return '该分类暂时没有文章'
  return '暂无文章'
})

const filteredArticles = computed(() => {
  if (route.query.search) {
    return articles.value
  }
  if (route.query.category) {
    const queryCategory = route.query.category.toLowerCase()
    return articles.value.filter(article =>
      article.category && article.category.toLowerCase() === queryCategory
    )
  }
  return articles.value
})

const totalPages = computed(() => Math.ceil(articles.value.length / articlesPerPage))
const totalFilteredPages = computed(() => Math.ceil(filteredArticles.value.length / articlesPerPage))

const currentIndex = computed(() => (currentPage.value - 1) * articlesPerPage)
const currentFilteredIndex = computed(() => (currentFilteredPage.value - 1) * articlesPerPage)

const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * articlesPerPage
  return articles.value.slice(start, start + articlesPerPage)
})

const paginatedFilteredArticles = computed(() => {
  const start = (currentFilteredPage.value - 1) * articlesPerPage
  return filteredArticles.value.slice(start, start + articlesPerPage)
})

const scrollToListTop = () => {
  nextTick(() => {
    if (articleListContainer.value) {
      articleListContainer.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

const updatePageState = (targetPage, totalRef, pageRef) => {
  if (targetPage >= 1 && targetPage <= totalRef.value) {
    pageRef.value = targetPage
    scrollToListTop()
  }
}

const goToPage = (page) => updatePageState(page, totalPages, currentPage)
const goToFilteredPage = (page) => updatePageState(page, totalFilteredPages, currentFilteredPage)

const buildPageNumbers = (total, current) => {
  const pages = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
    return pages
  }

  pages.push(1)
  if (current > 4) {
    pages.push('...')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 3) {
    pages.push('...')
  }

  pages.push(total)
  return pages
}

const getPageNumbers = () => buildPageNumbers(totalPages.value, currentPage.value)
const getFilteredPageNumbers = () => buildPageNumbers(totalFilteredPages.value, currentFilteredPage.value)

// 统一封装模板所需的分页上下文，避免模板重复逻辑
const listContext = computed(() => {
  if (isFilteredMode.value) {
    return {
      articles: paginatedFilteredArticles.value,
      totalPages: totalFilteredPages.value,
      totalCount: filteredArticles.value.length,
      currentPage: currentFilteredPage.value,
      pageNumbers: getFilteredPageNumbers(),
      goToPage: goToFilteredPage,
      indexOffset: currentFilteredIndex.value,
      paginationLabel: '筛选结果分页',
      emptyText: emptyMessage.value
    }
  }

  return {
    articles: paginatedArticles.value,
    totalPages: totalPages.value,
    totalCount: articles.value.length,
    currentPage: currentPage.value,
    pageNumbers: getPageNumbers(),
    goToPage,
    indexOffset: currentIndex.value,
    paginationLabel: '文章分页',
    emptyText: emptyMessage.value
  }
})

const articleRoutesMap = computed(() => {
  const query = {}
  if (route.query.search) {
    query.search = route.query.search
  }
  if (route.query.category) {
    query.category = route.query.category
  }

  const routesMap = new Map()
  listContext.value.articles.forEach(article => {
    routesMap.set(article.id, {
      path: `/article/${article.id}`,
      query: { ...query }
    })
  })

  return routesMap
})

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
  const plainText = content.replace(/<[^>]*>/g, '')
  return plainText.length > 150 ? `${plainText.substring(0, 150)}...` : plainText
}

const clearSearch = () => {
  navigateTo({ path: '/' })
}

const triggerViewSwitchAnimation = () => {
  isSwitchingView.value = true
  if (viewSwitchTimer) {
    clearTimeout(viewSwitchTimer)
  }
  viewSwitchTimer = setTimeout(() => {
    isSwitchingView.value = false
    viewSwitchTimer = null
  }, 480)
}

const setViewMode = (mode) => {
  if (mode !== 'list' && mode !== 'grid') return
  if (viewMode.value === mode) return
  viewMode.value = mode
  triggerViewSwitchAnimation()
}

const getArticleDetailRoute = (articleId) => {
  if (!articleId || articleId === 'null' || articleId === 'undefined') {
    console.warn('ArticleList: 无效的 articleId:', articleId)
    return { path: '/' }
  }
  return articleRoutesMap.value.get(articleId) || { path: `/article/${articleId}`, query: {} }
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const handleImageLoad = (event) => {
  event.target.classList.add('lazy-loaded')
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

const syncPageFromQuery = (pageParam) => {
  const pageNum = parseInt(pageParam)
  if (isNaN(pageNum) || pageNum <= 0) {
    return
  }

  if (isFilteredMode.value) {
    if (pageNum <= totalFilteredPages.value) {
      currentFilteredPage.value = pageNum
    }
  } else if (pageNum <= totalPages.value) {
    currentPage.value = pageNum
  }
}

watch(
  () => [route.query.search, route.query.category],
  async ([newSearch, newCategory], [oldSearch, oldCategory]) => {
    if (newSearch === oldSearch && newCategory === oldCategory) return
    currentPage.value = 1
    currentFilteredPage.value = 1
    await fetchArticles()
    syncPageFromQuery(route.query.page)
  }
)

const fetchArticles = async () => {
  if (loading.value) return

  loading.value = true
  error.value = null

  try {
    console.log('ArticleList: 开始获取文章数据...')

    if (route.query.search) {
      console.log('ArticleList: 执行搜索，关键词:', route.query.search)
      const searchResults = await searchArticles(route.query.search)
      articles.value = searchResults
      console.log('ArticleList: 搜索完成，结果数量:', articles.value.length)
    } else if (route.query.category) {
      const fetchedArticles = await getArticlesByCategory(route.query.category)
      articles.value = fetchedArticles.sort((a, b) => {
        const idA = parseInt(a.id) || 0
        const idB = parseInt(b.id) || 0
        return idB - idA
      })
    } else {
      const articlesData = await getAllArticles()
      articles.value = articlesData
    }

    console.log('ArticleList: 获取文章数据成功，总数:', articles.value.length)
  } catch (e) {
    error.value = e
    console.error('ArticleList: 获取文章失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  console.log('ArticleList: 组件挂载，开始获取文章数据...')
  
  // 检测移动端并监听窗口大小变化
  checkMobile()
  if (import.meta.client) {
    window.addEventListener('resize', checkMobile)
  }
  
  await fetchArticles()
  syncPageFromQuery(route.query.page)
})

onActivated(() => {
  console.log('ArticleList: 组件被激活（从缓存恢复）')
})

onDeactivated(() => {
  console.log('ArticleList: 组件被停用（进入缓存）')
  savedScrollPosition.value = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
  console.log('ArticleList: 保存滚动位置:', savedScrollPosition.value)
  console.log('ArticleList: 当前页码:', currentPage.value)
  console.log('ArticleList: 当前筛选页码:', currentFilteredPage.value)
})

onBeforeUnmount(() => {
  if (viewSwitchTimer) {
    clearTimeout(viewSwitchTimer)
  }
  // 移除窗口大小监听
  if (import.meta.client) {
    window.removeEventListener('resize', checkMobile)
  }
})

const refreshData = async () => {
  console.log('ArticleList: 手动刷新文章数据')
  await fetchArticles()
}

defineExpose({
  refreshData
})
</script>

<style scoped>
@import '~/assets/css/components/ArticleList.styles.css';
</style>
