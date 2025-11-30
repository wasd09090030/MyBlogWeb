<template>
  <div class="article-manager">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>文章管理</h2>
      <button class="btn btn-primary" @click="createArticle">
        <i class="bi bi-plus-circle me-2"></i>新建文章
      </button>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label">搜索文章</label>
            <div class="input-group">
              <input 
                type="text" 
                class="form-control" 
                v-model="searchKeyword" 
                placeholder="输入标题关键词..."
                @keyup.enter="handleSearch"
              >
              <button class="btn btn-outline-secondary" @click="handleSearch">
                <i class="bi bi-search"></i>
              </button>
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label">文章类别</label>
            <select class="form-select" v-model="selectedCategory" @change="handleFilterChange">
              <option value="">全部类别</option>
              <option value="study">学习</option>
              <option value="game">游戏</option>
              <option value="work">个人作品</option>
              <option value="resource">资源分享</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">每页显示</label>
            <select class="form-select" v-model.number="pageSize" @change="handlePageSizeChange">
              <option :value="10">10条</option>
              <option :value="20">20条</option>
              <option :value="50">50条</option>
            </select>
          </div>
          <div class="col-md-3 text-end">
            <button class="btn btn-outline-secondary" @click="resetFilters">
              <i class="bi bi-arrow-counterclockwise me-1"></i>重置筛选
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 文章列表 -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
        
        <div v-else-if="filteredArticles.length === 0" class="text-center py-4 text-muted">
          <i class="bi bi-inbox display-4 d-block mb-3"></i>
          {{ searchKeyword || selectedCategory ? '没有找到符合条件的文章' : '暂无文章' }}
        </div>
        
        <div v-else>
          <!-- 统计信息 -->
          <div class="d-flex justify-content-between align-items-center mb-3">
            <small class="text-muted">
              共 {{ totalCount }} 篇文章，当前显示第 {{ currentPage }} 页
            </small>
            <small class="text-muted">
              显示 {{ paginatedArticles.length }} 条
            </small>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th style="width: 60px;">ID</th>
                  <th>标题</th>
                  <th style="width: 100px;">类别</th>
                  <th style="width: 120px;">创建时间</th>
                  <th style="width: 120px;">更新时间</th>
                  <th style="width: 140px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="article in paginatedArticles" :key="article.id" class="article-row">
                  <td><span class="badge bg-secondary">{{ article.id }}</span></td>
                  <td>
                    <div class="article-title-cell">
                      <span class="article-title">{{ article.title }}</span>
                      <small v-if="article.coverImage" class="text-success ms-2" title="有封面图">
                        <i class="bi bi-image"></i>
                      </small>
                    </div>
                  </td>
                  <td>
                    <span :class="getCategoryBadgeClass(article.category)">
                      {{ getCategoryLabel(article.category) }}
                    </span>
                  </td>
                  <td><small>{{ formatDate(article.createdAt) }}</small></td>
                  <td><small>{{ formatDate(article.updatedAt) }}</small></td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" @click="goToEditPage(article)" title="编辑">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-danger" @click="confirmDelete(article)" title="删除">
                        <i class="bi bi-trash"></i>
                      </button>
                      <a :href="`/article/${article.id}`" target="_blank" class="btn btn-outline-info" title="预览">
                        <i class="bi bi-eye"></i>
                      </a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页控件 -->
          <nav v-if="totalPages > 1" aria-label="文章分页">
            <ul class="pagination justify-content-center mb-0">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="goToPage(1)" :disabled="currentPage === 1">
                  <i class="bi bi-chevron-double-left"></i>
                </button>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">
                  <i class="bi bi-chevron-left"></i>
                </button>
              </li>
              
              <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === currentPage }">
                <button class="page-link" @click="goToPage(page)">{{ page }}</button>
              </li>
              
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="goToPage(totalPages)" :disabled="currentPage === totalPages">
                  <i class="bi bi-chevron-double-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- 删除确认模态框 -->
    <ConfirmModal
      :show="showDeleteModal"
      title="确认删除"
      :message="`确定要删除文章《${articleToDelete?.title}》吗？此操作不可恢复。`"
      :loading="deletingArticle"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import ConfirmModal from './ConfirmModal.vue';
import { showToast } from '../../utils/notification.js';
import articleService from '../../services/articleService';

const router = useRouter();
const articles = ref([]);
const loading = ref(true);
const showDeleteModal = ref(false);
const articleToDelete = ref(null);
const deletingArticle = ref(false);

// 分页和筛选状态
const currentPage = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');
const selectedCategory = ref('');

// 类别映射
const categoryLabels = {
  study: '学习',
  game: '游戏',
  work: '个人作品',
  resource: '资源分享',
  other: '其他'
};

const getCategoryLabel = (category) => {
  return categoryLabels[category] || category || '未分类';
};

const getCategoryBadgeClass = (category) => {
  const classes = {
    study: 'badge bg-primary',
    game: 'badge bg-success',
    work: 'badge bg-warning text-dark',
    resource: 'badge bg-info',
    other: 'badge bg-secondary'
  };
  return classes[category] || 'badge bg-secondary';
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('zh-CN');
};

// 筛选后的文章列表
const filteredArticles = computed(() => {
  let result = [...articles.value];
  
  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim();
    result = result.filter(article => 
      article.title.toLowerCase().includes(keyword)
    );
  }
  
  // 按类别筛选
  if (selectedCategory.value) {
    result = result.filter(article => 
      article.category === selectedCategory.value
    );
  }
  
  return result;
});

// 总数
const totalCount = computed(() => filteredArticles.value.length);

// 总页数
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

// 当前页的文章列表
const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredArticles.value.slice(start, end);
});

// 可见的页码列表
const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// 页面跳转
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
};

// 处理筛选变化
const handleFilterChange = () => {
  currentPage.value = 1;
};

// 处理每页显示数量变化
const handlePageSizeChange = () => {
  currentPage.value = 1;
};

// 重置筛选
const resetFilters = () => {
  searchKeyword.value = '';
  selectedCategory.value = '';
  currentPage.value = 1;
};

// 监听筛选变化，自动回到第一页
watch([searchKeyword, selectedCategory], () => {
  currentPage.value = 1;
});

const fetchArticles = async () => {
  loading.value = true;
  try {
    // 管理后台需要完整的文章信息，不使用摘要模式
    const result = await articleService.getArticles({ 
      summary: false, 
      limit: 1000 // 获取所有文章用于前端分页
    });
    articles.value = result.data || result;
  } catch (error) {
    console.error('获取文章列表失败:', error);
    showToast('获取文章列表失败', 'danger');
  } finally {
    loading.value = false;
  }
};

const createArticle = () => {
  router.push({ name: 'ArticleEditor' });
};

const goToEditPage = (article) => {
  router.push({ name: 'ArticleEditorEdit', params: { id: article.id } });
};

const confirmDelete = (article) => {
  articleToDelete.value = article;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  deletingArticle.value = true;
  try {
    await articleService.deleteArticle(articleToDelete.value.id);
    showDeleteModal.value = false;
    articleToDelete.value = null;
    fetchArticles(); // 刷新列表
    showToast('文章已成功删除', 'success');
  } catch (error) {
    console.error('删除文章失败:', error);
    showToast('删除文章失败', 'danger');
  } finally {
    deletingArticle.value = false;
  }
};

onMounted(() => {
  fetchArticles();
});
</script>

<style scoped>
.btn-group {
  white-space: nowrap;
}

.article-row {
  transition: all 0.2s ease;
}

.article-row:hover {
  background-color: rgba(13, 110, 253, 0.05);
}

.article-title-cell {
  display: flex;
  align-items: center;
}

.article-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.pagination .page-link {
  min-width: 40px;
  text-align: center;
}

.pagination .page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.pagination .page-item.disabled .page-link {
  opacity: 0.5;
}

.badge {
  font-weight: 500;
}

.input-group .form-control:focus {
  border-color: #86b7fe;
  box-shadow: none;
}

.input-group .form-control:focus + .btn {
  border-color: #86b7fe;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .article-title {
    max-width: 150px;
  }
  
  .table th, .table td {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
}
</style>
