<template>
  <div class="article-list-page" ref="articleListContainer">
    <div class="d-flex align-items-center mb-4 pb-2 border-bottom pagetitle">
      <img src="../assets/icon/IcBaselineLibraryBooks.svg" alt="icon" style="height: 28px;" />
      <h3 class="mb-0 ms-2">{{ pageTitle }}</h3>
    </div>
    
    <div v-if="error" class="alert alert-danger" role="alert">
      加载或操作文章失败: {{ error.message }}
    </div>
    
    <div v-if="route.query.search" class="mb-4">
      <div class="alert alert-info">
        搜索结果： "{{ route.query.search }}"
        <button class="btn btn-sm btn-outline-secondary ms-3" @click="clearSearch">
          <i class="bi bi-x-circle me-1"></i>清除搜索
        </button>
      </div>
    </div>    
    <!-- 显示筛选结果 -->
    <template v-if="route.query.search || route.query.category">
      <!-- 加载状态 - 根据偏好选择加载动画类型 -->
      <SkeletonLoader 
        v-if="loading && useSkeletonLoader" 
        :count="4"
      />
      <LoadingSpinner 
        v-else-if="loading" 
        text="正在搜索文章..." 
        :size="'medium'"
      />
      
      <div v-else-if="paginatedFilteredArticles.length" class="articles-container">
        <div 
          v-for="(article, index) in paginatedFilteredArticles" 
          :key="article.id" 
          v-memo="[article.id, article.title, article.coverImage, article.createdAt, article.category, currentFilteredPage, route.query.search, route.query.category]"
          :class="['article-card',  { 'article-card-reverse': (currentFilteredIndex + index + 1) % 2 === 0 }]"
        ><!-- 封面图片区域 -->
          <div class="article-image-section">
            <img
              v-if="article.coverImage && article.coverImage !== 'null'"
              v-lazy="article.coverImage"
              :alt="article.title"
              class="article-image lazy-image"
              style="height: 300px; aspect-ratio: 16/9; object-fit: cover; width: 100%;"
              @error="handleImageError"
            />
            <div v-else class="article-image-placeholder">
              <i class="bi bi-image fs-1 text-muted"></i>
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

            <router-link :to="getArticleDetailRoute(article.id)" class="article-title-link">
              <h3 class="article-title">{{ article.title }}</h3>
            </router-link>

            <div class="article-excerpt">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-html="getExcerpt(article.content)" class="article-content-preview"></div>
            </div>

            <router-link :to="getArticleDetailRoute(article.id)" class="read-more-btn">
              阅读全文
              <i class="bi bi-arrow-right ms-1"></i>
            </router-link>
          </div>
        </div>      </div>
      
      <!-- 分页控件 - 筛选结果 -->
      <div v-if="totalFilteredPages > 1" class="pagination-container mt-4">
        <nav aria-label="筛选结果分页">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentFilteredPage === 1 }">
              <button class="page-link" @click="goToFilteredPage(currentFilteredPage - 1)" :disabled="currentFilteredPage === 1">
                <i class="bi bi-chevron-left"></i>
              </button>
            </li>
            
            <li v-for="page in getFilteredPageNumbers()" :key="page" class="page-item" :class="{ active: page === currentFilteredPage }">
              <button v-if="page === '...'" class="page-link disabled">...</button>
              <button v-else class="page-link" @click="goToFilteredPage(page)">{{ page }}</button>
            </li>
            
            <li class="page-item" :class="{ disabled: currentFilteredPage === totalFilteredPages }">
              <button class="page-link" @click="goToFilteredPage(currentFilteredPage + 1)" :disabled="currentFilteredPage === totalFilteredPages">
                <i class="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
        
        <div class="text-center text-muted mt-2">
          共 {{ filteredArticles.length }} 篇文章，第 {{ currentFilteredPage }} / {{ totalFilteredPages }} 页
        </div>
      </div>
    </template>
    
    <!-- 默认显示所有文章 -->
    <template v-else>
      <!-- 加载状态 - 根据偏好选择加载动画类型 -->
      <SkeletonLoader 
        v-if="loading && useSkeletonLoader" 
        :count="4"
      />
      <LoadingSpinner 
        v-else-if="loading" 
        text="正在加载文章列表..." 
        :size="'medium'"
      />
      
      <div v-else-if="paginatedArticles.length" class="articles-container">
        <div 
          v-for="(article, index) in paginatedArticles" 
          :key="article.id" 
          v-memo="[article.id, article.title, article.coverImage, article.createdAt, article.category, currentPage]"
          :class="['article-card', { 'article-card-reverse': (currentIndex + index + 1) % 2 === 0 }]"
        ><!-- 封面图片区域 -->
          <div class="article-image-section">
            <img
              v-if="article.coverImage && article.coverImage !== 'null'"
              v-lazy="article.coverImage"
              :alt="article.title"
              class="article-image lazy-image"
              style="height: 300px; aspect-ratio: 16/9; object-fit: cover; width: 100%;"
              @error="handleImageError"
            />
            <div v-else class="article-image-placeholder">
              <i class="bi bi-image fs-1 text-muted"></i>
            </div>
          </div>

          <!-- 内容区域 -->
          <div class="article-content-section"><div class="article-meta mb-2">
              <span class="article-date">{{ formatDate(article.createdAt) }}</span>
              <span :class="['article-category', getCategoryClass(article.category)]">
                {{ getCategoryName(article.category) }}
              </span>
            </div>

            <router-link :to="getArticleDetailRoute(article.id)" class="article-title-link">
              <h3 class="article-title">{{ article.title }}</h3>
            </router-link>

            <div class="article-excerpt">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-html="getExcerpt(article.content)" class="article-content-preview"></div>
            </div>

            <router-link :to="getArticleDetailRoute(article.id)" class="read-more-btn">
              阅读全文
              <i class="bi bi-arrow-right ms-1"></i>
            </router-link>
          </div>
        </div>      </div>
        <!-- 分页控件 - 所有文章 -->
      <div v-if="totalPages > 1" class="pagination-container mt-4">
        <nav aria-label="文章分页">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link page-btn" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">
                <i class="bi bi-chevron-left"></i>
              </button>
            </li>
            
            <li v-for="page in getPageNumbers()" :key="page" class="page-item" :class="{ active: page === currentPage }">
              <button v-if="page === '...'" class="page-link disabled">...</button>
              <button v-else class="page-link page-btn" @click="goToPage(page)">{{ page }}</button>
            </li>
            
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link page-btn" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
                <i class="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
        
        <div class="text-center text-muted mt-2">
          共 {{ articles.length }} 篇文章，第 {{ currentPage }} / {{ totalPages }} 页
        </div>
      </div>
      
      <!-- 无文章时的显示 -->
      <div v-else-if="!loading" class="alert alert-info text-center" role="alert">
        暂无文章
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onActivated, onDeactivated, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import articleService from '../services/articleService.js';
import LoadingSpinner from './LoadingSpinner.vue';
import SkeletonLoader from './SkeletonLoader.vue';
import './ArticleList.styles.css';

// 定义组件名称以便 KeepAlive 识别
defineOptions({
  name: 'ArticleList'
});

// 创建ref来引用ArticleList容器
const articleListContainer = ref(null);
const articles = ref([]);
const error = ref(null);
const loading = ref(false);
const route = useRoute();
const router = useRouter();

// 分页相关变量
const currentPage = ref(1);
const currentFilteredPage = ref(1);
const articlesPerPage = 8;

// 加载样式偏好设置
const useSkeletonLoader = ref(true); // 可以根据用户偏好或设备性能调整

// 根据路由参数计算页面标题
const pageTitle = computed(() => {
  if (route.query.search) return '搜索结果';
  if (route.query.category === 'study') return '学习';
  if (route.query.category === 'game') return '游戏';
  if (route.query.category === 'work') return '个人作品';
  if (route.query.category === 'resource') return '资源分享';
  return '文章列表';
});

// 根据搜索关键词或分类筛选文章
const filteredArticles = computed(() => {
  if (route.query.search) {
    const searchTerm = route.query.search.toLowerCase();
    return articles.value.filter(article => {
      return article.title.toLowerCase().includes(searchTerm) ||
             (article.contentMarkdown && article.contentMarkdown.toLowerCase().includes(searchTerm)) ||
             article.content.toLowerCase().includes(searchTerm);
    });
  } else if (route.query.category) {
    // 直接使用路由参数中的category值过滤文章
    return articles.value.filter(article => article.category === route.query.category);
  }
  return articles.value;
});

// 分页计算
const totalPages = computed(() => Math.ceil(articles.value.length / articlesPerPage));
const totalFilteredPages = computed(() => Math.ceil(filteredArticles.value.length / articlesPerPage));

// 当前页的文章
const currentIndex = computed(() => (currentPage.value - 1) * articlesPerPage);
const currentFilteredIndex = computed(() => (currentFilteredPage.value - 1) * articlesPerPage);

const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  return articles.value.slice(start, end);
});

const paginatedFilteredArticles = computed(() => {
  const start = (currentFilteredPage.value - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  return filteredArticles.value.slice(start, end);
});

// 获取分类中文名称
const getCategoryName = (category) => {
  const categoryMap = {
    'study': '学习',
    'game': '游戏',
    'work': '个人作品',
    'resource': '资源分享'
  };
  return categoryMap[category] || '其他';
};

// 获取分类样式类
const getCategoryClass = (category) => {
  const categoryClassMap = {
    'study': 'category-study',
    'game': 'category-game', 
    'work': 'category-work',
    'resource': 'category-resource'
  };
  return categoryClassMap[category] || 'category-other';
};

// 获取文章摘要
const getExcerpt = (content) => {
  if (!content) return '';
  // 移除HTML标签并限制字数
  const plainText = content.replace(/<[^>]*>/g, '');
  return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
};

// 清除搜索
const clearSearch = () => {
  router.push({ name: 'ArticleList' });
};

// 计算属性：为当前页面的文章预先生成路由对象，避免重复计算
const articleRoutesMap = computed(() => {
  const query = {};
  
  // 保持原有的搜索和分类参数
  if (route.query.search) {
    query.search = route.query.search;
  }
  if (route.query.category) {
    query.category = route.query.category;
  }
  
  // 为当前页面的所有文章生成路由映射
  const routesMap = new Map();
  const currentArticles = route.query.search || route.query.category 
    ? paginatedFilteredArticles.value 
    : paginatedArticles.value;
    
  currentArticles.forEach(article => {
    routesMap.set(article.id, {
      path: `/article/${article.id}`,
      query: { ...query }
    });
  });
  
  return routesMap;
});

// 生成文章详情路由的简化函数
const getArticleDetailRoute = (articleId) => {
  return articleRoutesMap.value.get(articleId) || {
    path: `/article/${articleId}`,
    query: {}
  };
};

// 分页方法
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    // 滚动到ArticleList容器的顶部而不是页面顶部
    if (articleListContainer.value) {
      articleListContainer.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

const goToFilteredPage = (page) => {
  if (page >= 1 && page <= totalFilteredPages.value) {
    currentFilteredPage.value = page;
    // 滚动到ArticleList容器的顶部而不是页面顶部
    if (articleListContainer.value) {
      articleListContainer.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

// 获取页码数组（智能省略）
const getPageNumbers = () => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    
    if (current > 4) {
      pages.push('...');
    }
    
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (current < total - 3) {
      pages.push('...');
    }
    
    pages.push(total);
  }
  
  return pages;
};

const getFilteredPageNumbers = () => {
  const total = totalFilteredPages.value;
  const current = currentFilteredPage.value;
  const pages = [];
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    
    if (current > 4) {
      pages.push('...');
    }
    
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (current < total - 3) {
      pages.push('...');
    }
    
    pages.push(total);
  }
  
  return pages;
};

// 处理图片加载错误
const handleImageError = (event) => {
  // 隐藏加载失败的图片
  event.target.style.display = 'none';
};

// 格式化日期的辅助函数
function formatDate(dateString) {
  if (!dateString) return '未知日期';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
}

// 监听路由变化，重新获取文章
watch(() => route.query, (newQuery, oldQuery) => {
  const newSearch = newQuery.search;
  const oldSearch = oldQuery?.search;
  const newCategory = newQuery.category;
  const oldCategory = oldQuery?.category;
  
  if (newSearch !== oldSearch || newCategory !== oldCategory) {
    currentPage.value = 1;
    currentFilteredPage.value = 1;
    fetchArticles();
  }
}, { deep: true });

// 获取文章数据
const fetchArticles = async () => {
  if (loading.value) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    console.log('ArticleList: 开始获取文章数据...');
    
    if (route.query.category) {
      // 如果有分类筛选，使用原来的分类API
      const fetchedArticles = await articleService.getArticlesByCategory(route.query.category);
      articles.value = fetchedArticles.sort((a, b) => {
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idB - idA;
      });
    } else {
      // 否则使用新的分页API获取所有文章摘要
      const articlesData = await articleService.getAllArticles();
      articles.value = articlesData;
    }
    
    console.log('ArticleList: 获取文章数据成功，总数:', articles.value.length);
  } catch (e) {
    error.value = e;
    console.error("ArticleList: 获取文章失败:", e);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  console.log('ArticleList: 组件挂载，开始获取文章数据...');
  await fetchArticles();
  
  // 检查URL query中是否有页码信息
  const pageFromQuery = route.query.page;
  if (pageFromQuery) {
    const pageNum = parseInt(pageFromQuery);
    console.log('从URL query恢复页码:', pageNum);
    
    if (!isNaN(pageNum) && pageNum > 0) {
      await new Promise(resolve => setTimeout(resolve, 150));
      
      if (route.query.search || route.query.category) {
        console.log('设置筛选页码:', pageNum, '总页数:', totalFilteredPages.value);
        if (pageNum <= totalFilteredPages.value) {
          currentFilteredPage.value = pageNum;
        }
      } else {
        console.log('设置普通页码:', pageNum, '总页数:', totalPages.value);
        if (pageNum <= totalPages.value) {
          currentPage.value = pageNum;
        }
      }
    }
  }
});

// KeepAlive 生命周期钩子
onActivated(async () => {
  console.log('ArticleList 组件被激活');
  
  const shouldRefresh = route.meta?.refreshOnActivated || false;
  if (shouldRefresh) {
    console.log('检测到需要刷新数据，重新获取文章列表');
    await fetchArticles();
    if (route.meta) {
      route.meta.refreshOnActivated = false;
    }
  }
});

onDeactivated(() => {
  console.log('ArticleList 组件被缓存');
});

// 添加一个手动刷新方法，可以从外部调用
const refreshData = async () => {
  console.log('手动刷新文章数据');
  await fetchArticles();
};

// 暴露刷新方法给父组件使用
defineExpose({
  refreshData
});
</script>
