<template>
  <div class="admin-dashboard">
    <!-- 欢迎标题 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-1">仪表板</h2>
        <p class="text-muted mb-0">欢迎回来！以下是您博客的概览。</p>
      </div>
      <button class="btn btn-primary" @click="createArticle">
        <i class="bi bi-plus-circle me-2"></i>新建文章
      </button>
    </div>
    
    <!-- 统计卡片区域 -->
    <div class="row g-4 mb-4">
      <!-- 文章统计卡片 -->
      <div class="col-sm-6 col-lg-3">
        <div class="stat-card card h-100 border-0 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-primary bg-opacity-10 text-primary">
                <i class="bi bi-file-earmark-text"></i>
              </div>
              <div class="ms-3">
                <h6 class="text-muted mb-1">文章总数</h6>
                <div v-if="loading" class="placeholder-glow">
                  <span class="placeholder col-6"></span>
                </div>
                <h3 v-else class="mb-0 fw-bold">{{ articleCount }}</h3>
              </div>
            </div>
            <router-link to="/admin/articles" class="stretched-link"></router-link>
          </div>
        </div>
      </div>

      <!-- 评论统计卡片 -->
      <div class="col-sm-6 col-lg-3">
        <div class="stat-card card h-100 border-0 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-success bg-opacity-10 text-success">
                <i class="bi bi-chat-dots"></i>
              </div>
              <div class="ms-3">
                <h6 class="text-muted mb-1">评论总数</h6>
                <div v-if="loading" class="placeholder-glow">
                  <span class="placeholder col-6"></span>
                </div>
                <h3 v-else class="mb-0 fw-bold">{{ commentStats.total }}</h3>
              </div>
            </div>
            <router-link to="/admin/comments" class="stretched-link"></router-link>
          </div>
        </div>
      </div>

      <!-- 待审核评论卡片 -->
      <div class="col-sm-6 col-lg-3">
        <div class="stat-card card h-100 border-0 shadow-sm" :class="{ 'border-warning': commentStats.pending > 0 }">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="stat-icon" :class="commentStats.pending > 0 ? 'bg-warning bg-opacity-10 text-warning' : 'bg-secondary bg-opacity-10 text-secondary'">
                <i class="bi bi-exclamation-circle"></i>
              </div>
              <div class="ms-3">
                <h6 class="text-muted mb-1">待审核</h6>
                <div v-if="loading" class="placeholder-glow">
                  <span class="placeholder col-6"></span>
                </div>
                <h3 v-else class="mb-0 fw-bold" :class="{ 'text-warning': commentStats.pending > 0 }">
                  {{ commentStats.pending }}
                </h3>
              </div>
            </div>
            <router-link to="/admin/comments" class="stretched-link"></router-link>
          </div>
        </div>
      </div>

      <!-- 画廊管理卡片 -->
      <div class="col-sm-6 col-lg-3">
        <div class="stat-card card h-100 border-0 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-info bg-opacity-10 text-info">
                <i class="bi bi-images"></i>
              </div>
              <div class="ms-3">
                <h6 class="text-muted mb-1">画廊管理</h6>
                <p class="mb-0 small text-muted">管理图片</p>
              </div>
            </div>
            <router-link to="/admin/gallery" class="stretched-link"></router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="row g-4">
      <!-- 最近文章 -->
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="bi bi-clock-history me-2 text-primary"></i>最近文章
            </h5>
            <router-link to="/admin/articles" class="btn btn-sm btn-outline-primary">
              查看全部
            </router-link>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
            </div>
            <div v-else-if="latestArticles.length === 0" class="text-center py-5 text-muted">
              <i class="bi bi-inbox display-4 d-block mb-3"></i>
              <p>暂无文章，点击上方按钮创建第一篇文章吧！</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>标题</th>
                    <th style="width: 100px;">类别</th>
                    <th style="width: 120px;">创建时间</th>
                    <th style="width: 80px;">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="article in latestArticles" :key="article.id">
                    <td>
                      <a :href="`/article/${article.id}`" target="_blank" class="text-decoration-none">
                        {{ article.title }}
                      </a>
                    </td>
                    <td>
                      <span :class="getCategoryBadgeClass(article.category)">
                        {{ getCategoryLabel(article.category) }}
                      </span>
                    </td>
                    <td><small class="text-muted">{{ formatDate(article.createdAt) }}</small></td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary" @click="editArticle(article.id)" title="编辑">
                        <i class="bi bi-pencil"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0">
            <h5 class="mb-0">
              <i class="bi bi-lightning me-2 text-warning"></i>快捷操作
            </h5>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <button class="quick-action-btn btn btn-light text-start" @click="createArticle">
                <i class="bi bi-plus-circle text-primary me-3"></i>
                <span>创建新文章</span>
              </button>
              <button class="quick-action-btn btn btn-light text-start" @click="$router.push('/admin/articles')">
                <i class="bi bi-list-ul text-success me-3"></i>
                <span>管理所有文章</span>
              </button>
              <button class="quick-action-btn btn btn-light text-start" @click="$router.push('/admin/comments')">
                <i class="bi bi-chat-left-text text-info me-3"></i>
                <span>审核评论</span>
              </button>
              <button class="quick-action-btn btn btn-light text-start" @click="$router.push('/admin/gallery')">
                <i class="bi bi-images text-secondary me-3"></i>
                <span>管理画廊</span>
              </button>
              <button class="quick-action-btn btn btn-light text-start" @click="$router.push('/admin/password')">
                <i class="bi bi-shield-lock text-danger me-3"></i>
                <span>修改密码</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getApiUrl, API_CONFIG } from '../../config/api.js';
import articleService from '../../services/articleService';

const router = useRouter();
const loading = ref(true);
const articleCount = ref(0);
const latestArticles = ref([]);
const commentStats = ref({ total: 0, pending: 0 });

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

const createArticle = () => {
  router.push({ name: 'ArticleEditor' });
};

const editArticle = (id) => {
  router.push({ name: 'ArticleEditorEdit', params: { id } });
};

const fetchDashboardData = async () => {
  loading.value = true;
  try {
    // 获取文章统计 - 使用分页API获取第一页来获取总数
    const articlesResponse = await articleService.getArticles({ 
      summary: false, 
      page: 1, 
      limit: 10 
    });
    
    if (articlesResponse) {
      // 处理分页响应结构
      if (articlesResponse.data) {
        // 新的分页API返回格式：{ data: [], total, page, limit, totalPages }
        articleCount.value = articlesResponse.total || 0;
        latestArticles.value = articlesResponse.data.slice(0, 5) || [];
      } else if (Array.isArray(articlesResponse)) {
        // 兼容旧的直接返回数组的格式
        articleCount.value = articlesResponse.length;
        latestArticles.value = articlesResponse.slice(0, 5);
      }
    }

    // 获取评论统计
    await fetchCommentStats();
  } catch (error) {
    console.error('获取仪表板数据失败:', error);
    // 设置默认值
    articleCount.value = 0;
    latestArticles.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchCommentStats = async () => {
  try {
    // 获取所有评论
    const allCommentsResponse = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.COMMENTS_ADMIN_ALL), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (allCommentsResponse.ok) {
      const allComments = await allCommentsResponse.json();
      commentStats.value.total = Array.isArray(allComments) ? allComments.length : 0;
    } else {
      console.warn('获取所有评论失败，状态码:', allCommentsResponse.status);
    }

    // 获取待审核评论
    const pendingCommentsResponse = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.COMMENTS_ADMIN_PENDING), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (pendingCommentsResponse.ok) {
      const pendingComments = await pendingCommentsResponse.json();
      commentStats.value.pending = Array.isArray(pendingComments) ? pendingComments.length : 0;
    } else {
      console.warn('获取待审核评论失败，状态码:', pendingCommentsResponse.status);
    }
  } catch (error) {
    console.error('获取评论统计失败:', error);
    // 设置默认值
    commentStats.value = { total: 0, pending: 0 };
  }
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
/* 统计卡片样式 */
.stat-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

/* 快捷操作按钮样式 */
.quick-action-btn {
  padding: 0.875rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid #e9ecef;
}

.quick-action-btn:hover {
  background-color: #f8f9fa;
  transform: translateX(4px);
  border-color: #dee2e6;
}

.quick-action-btn i {
  font-size: 1.25rem;
}

/* 表格行悬停效果 */
.table tbody tr {
  transition: background-color 0.2s ease;
}

.table tbody tr:hover {
  background-color: rgba(13, 110, 253, 0.05);
}

/* 卡片头部样式 */
.card-header {
  padding: 1rem 1.25rem;
}

.card-header h5 {
  font-size: 1rem;
  font-weight: 600;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }
  
  .quick-action-btn {
    padding: 0.75rem;
  }
}
</style>
