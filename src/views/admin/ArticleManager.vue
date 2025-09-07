<template>
  <div class="article-manager">    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>文章管理</h2>
      <button class="btn btn-primary" @click="createArticle">
        <i class="bi bi-plus-circle me-2"></i>新建文章
      </button>
    </div>

    <!-- 文章列表 -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
        
        <div v-else-if="articles.length === 0" class="text-center py-4 text-muted">
          暂无文章
        </div>
        
        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>创建时间</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="article in articles" :key="article.id">
                <td>{{ article.id }}</td>
                <td>{{ article.title }}</td>
                <td>{{ formatDate(article.createdAt) }}</td>
                <td>{{ formatDate(article.updatedAt) }}</td>
                <td>                  <div class="btn-group btn-group-sm">
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
import { ref, onMounted } from 'vue';
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

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('zh-CN');
};

const fetchArticles = async () => {
  loading.value = true;
  try {
    // 管理后台需要完整的文章信息，不使用摘要模式
    const result = await articleService.getArticles({ 
      summary: false, 
      limit: 100 // 管理后台显示更多文章
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

// 已经不需要模态框相关的处理函数

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
</style>
