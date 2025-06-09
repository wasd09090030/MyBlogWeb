<template>
  <div class="article-detail-page">
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary animate__animated animate__pulse animate__infinite" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger animate__animated animate__shakeX" role="alert">
      加载文章失败: {{ error.message }}
    </div>    <div v-else-if="article" class="article-container card shadow-sm animate__animated animate__fadeInUp">
      <div class="card-body">        <!-- 封面图片 -->
        <div v-if="article.coverImage && article.coverImage !== 'null'" class="article-cover mb-4 animate__animated animate__fadeIn">
          <img 
            :src="article.coverImage" 
            :alt="article.title" 
            class="cover-image"
            style="height: 400px; aspect-ratio: 16/9; object-fit: cover; width: 100%; border-radius: 0.5rem;"
          />
        </div>
        
        <div class="article-header mb-4 animate__animated animate__fadeInDown">
          <h1 class="article-title">{{ article.title }}</h1>
          <div class="article-meta">
            <span class="badge animate__animated animate__bounceIn animate__delay-0.5s" :class="getCategoryBadgeClass(article.category)">
              {{ getCategoryName(article.category) }}
            </span>
            <span class="badge bg-secondary ms-2 animate__animated animate__bounceIn animate__delay-0.7s">{{ formatDate(article.createdAt) }}</span>
            <span v-if="article.updatedAt && article.updatedAt !== article.createdAt" class="ms-2 text-muted animate__animated animate__fadeIn animate__delay-1s">
              最后更新: {{ formatDate(article.updatedAt) }}
            </span>
          </div>
        </div>          <div class="article-actions mb-4 animate__animated animate__fadeInRight">
          <button @click="goBackToList" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-2"></i>
            返回列表
          </button>
        </div>

        <div class="article-content">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="article.content" class="article-content-html"></div>        </div>        <!-- 评论和点赞区域 -->
        <LazyCommentSection :article-id="article.id" />
          <!-- 底部返回按钮 -->
        <div class="article-bottom-actions mt-5 pt-4 border-top text-center animate__animated animate__fadeInUp">
          <button @click="goBackToList" class="btn btn-primary btn-lg">
            <i class="bi bi-arrow-left me-2"></i>
            返回文章列表
          </button>
        </div>
      </div>
    </div>

    <div v-else class="alert alert-warning" role="alert">
      找不到文章
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LazyCommentSection from './LazyCommentSection.vue';

const route = useRoute();
const router = useRouter();
const article = ref(null);
const loading = ref(true);
const error = ref(null);

// 格式化日期的辅助函数
function formatDate(dateString) {
  if (!dateString) return '未知日期';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 获取分类名称
function getCategoryName(category) {
  const categoryMap = {
    'study': '学习',
    'game': '游戏',
    'work': '个人作品',
    'resource': '资源分享',
    'other': '其他'
  };
  return categoryMap[category] || '未分类';
}

// 获取分类徽章样式
function getCategoryBadgeClass(category) {
  const classMap = {
    'study': 'bg-primary',
    'game': 'bg-warning text-dark',
    'work': 'bg-success',
    'resource': 'bg-info text-dark',
    'other': 'bg-secondary'
  };
  return classMap[category] || 'bg-secondary';
}

async function fetchArticle() {
  const id = route.params.id;
  if (!id) {
    error.value = new Error('未提供文章ID');
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`http://localhost:3000/articles/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    article.value = await response.json();
  } catch (e) {
    error.value = e;
    console.error(`获取文章 ${id} 失败:`, e);
  } finally {
    loading.value = false;  }
}

// 返回文章列表，保持原来的页码和筛选条件
const goBackToList = () => {
  const query = {};
  
  // 获取返回页码
  const returnPage = route.query.returnPage;
  
  // 如果有搜索参数，保持搜索状态
  if (route.query.search) {
    query.search = route.query.search;
  }
  
  // 如果有分类参数，保持分类状态
  if (route.query.category) {
    query.category = route.query.category;
  }
  
  // 构造返回路由
  const returnRoute = {
    name: 'ArticleList',
    query
  };
  
  // 如果有返回页码，需要在跳转后设置页码
  if (returnPage) {
    router.push(returnRoute).then(() => {
      // 通过URL hash来传递页码信息，让ArticleList组件处理
      router.replace({
        ...returnRoute,
        hash: `#page=${returnPage}`
      });
    });
  } else {
    router.push(returnRoute);
  }
};

// 删除功能已经移除

onMounted(() => {
  fetchArticle();
});
</script>

<style scoped>
/* 响应式容器样式 */
.article-container {
  width: 100%;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 0.5rem;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 封面图片样式 */
.article-cover {
  width: 100%;
  max-height: 400px;
  overflow: hidden;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.cover-image:hover {
  transform: scale(1.02);
}

.article-title {
  color: #343a40;
  margin-bottom: 0.5rem;
  font-size: 2rem;
  font-weight: 700;
  transition: color 0.3s ease;
}

.article-meta {
  color: #6c757d;
  margin-bottom: 1.5rem;
  transition: color 0.3s ease;
}

/* 底部操作区域样式 */
.article-bottom-actions {
  border-top: 2px solid #e9ecef;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 0 0 0.5rem 0.5rem;
  margin: 0 -1.25rem -1.25rem -1.25rem;
  padding: 2rem 1.25rem;
}

.article-bottom-actions .btn {
  padding: 0.75rem 2rem;
  font-weight: 600;
  border-radius: 2rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(13, 110, 253, 0.2);
}

.article-bottom-actions .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(13, 110, 253, 0.3);
}

/* 文章内容样式 */
.article-content-html {
  line-height: 1.8;
  font-size: 1.1rem;
  color: #333;
  transition: color 0.3s ease;
}

/* 富文本内容样式 */
.article-content-html ::v-deep(h1),
.article-content-html ::v-deep(h2),
.article-content-html ::v-deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.article-content-html ::v-deep(h1) {
  font-size: 1.75rem;
}

.article-content-html ::v-deep(h2) {
  font-size: 1.5rem;
}

.article-content-html ::v-deep(h3) {
  font-size: 1.25rem;
}

.article-content-html ::v-deep(p) {
  margin-bottom: 1rem;
}

.article-content-html ::v-deep(img) {
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
}

.article-content-html ::v-deep(pre) {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 0.25rem;
  margin: 1rem 0;
  overflow: auto;
}

.article-content-html ::v-deep(blockquote) {
  border-left: 0.25rem solid #adb5bd;
  padding-left: 1rem;
  color: #6c757d;
  margin: 1rem 0;
}

.article-content-html ::v-deep(ul),
.article-content-html ::v-deep(ol) {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.article-content-html ::v-deep(a) {
  color: #0d6efd;
  text-decoration: none;
}

.article-content-html ::v-deep(a:hover) {
  text-decoration: underline;
}

/* 暗色主题支持 */
[data-bs-theme="dark"] .article-container {
  background-color: var(--bs-dark);
  color: #ffffff;
}

[data-bs-theme="dark"] .article-cover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

[data-bs-theme="dark"] .article-title {
  color: #ffffff;
}

[data-bs-theme="dark"] .article-meta {
  color: #adb5bd;
}

[data-bs-theme="dark"] .article-bottom-actions {
  border-top-color: #495057;
  background: linear-gradient(135deg, #2d3748, #1a1a1a);
}

[data-bs-theme="dark"] .article-content-html {
  color: #dee2e6;
}

[data-bs-theme="dark"] .article-content-html ::v-deep(h1),
[data-bs-theme="dark"] .article-content-html ::v-deep(h2),
[data-bs-theme="dark"] .article-content-html ::v-deep(h3) {
  color: #ffffff;
}

[data-bs-theme="dark"] .article-content-html ::v-deep(p) {
  color: #dee2e6;
}

[data-bs-theme="dark"] .article-content-html ::v-deep(pre) {
  background-color: #2d3748;
  color: #e2e8f0;
}

[data-bs-theme="dark"] .article-content-html ::v-deep(blockquote) {
  border-left-color: #6c757d;
  color: #adb5bd;
}

[data-bs-theme="dark"] .article-content-html ::v-deep(a) {
  color: #60a5fa;
}

[data-bs-theme="dark"] .article-content-html ::v-deep(a:hover) {
  color: #93c5fd;
}
</style>