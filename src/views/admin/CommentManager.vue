<template>
  <div class="comment-manager">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>评论管理</h2>
      <div class="btn-group" role="group">
        <button 
          type="button" 
          class="btn btn-outline-primary"
          :class="{ active: currentTab === 'pending' }"
          @click="currentTab = 'pending'"
        >
          待审核 <span class="badge bg-warning ms-1">{{ pendingCount }}</span>
        </button>
        <button 
          type="button" 
          class="btn btn-outline-primary"
          :class="{ active: currentTab === 'all' }"
          @click="currentTab = 'all'"
        >
          全部评论
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
    </div>

    <!-- 评论列表 -->
    <div v-else>
      <div v-if="comments.length === 0" class="text-center py-5 text-muted">
        <i class="bi bi-chat-square-dots fs-1 mb-3"></i>
        <p>{{ currentTab === 'pending' ? '暂无待审核评论' : '暂无评论' }}</p>
      </div>

      <div v-else class="row">
        <div 
          v-for="comment in comments" 
          :key="comment.id"
          class="col-12 mb-3"
        >
          <div class="card comment-card">
            <div class="card-body">
              <div class="row">
                <div class="col-md-8">
                  <div class="comment-info">
                    <h6 class="card-title mb-2">
                      <i class="bi bi-person-circle me-2"></i>
                      {{ comment.author }}
                      <span class="badge ms-2" :class="getStatusBadgeClass(comment.status)">
                        {{ getStatusText(comment.status) }}
                      </span>
                    </h6>
                    <p class="card-text mb-2">{{ comment.content }}</p>
                    <div class="comment-meta">
                      <small class="text-muted">
                        <i class="bi bi-calendar3 me-1"></i>
                        {{ formatDate(comment.createdAt) }}
                      </small>
                      <small class="text-muted ms-3" v-if="comment.email">
                        <i class="bi bi-envelope me-1"></i>
                        {{ comment.email }}
                      </small>
                      <small class="text-muted ms-3" v-if="comment.website">
                        <i class="bi bi-link-45deg me-1"></i>
                        <a :href="comment.website" target="_blank" class="text-decoration-none">
                          {{ comment.website }}
                        </a>
                      </small>
                      <small class="text-muted ms-3" v-if="comment.userIp">
                        <i class="bi bi-geo-alt me-1"></i>
                        IP: {{ comment.userIp }}
                      </small>
                    </div>
                    <div class="article-info mt-2" v-if="comment.article">
                      <small class="text-primary">
                        <i class="bi bi-file-text me-1"></i>
                        文章: {{ comment.article.title }}
                      </small>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="comment-actions d-flex flex-column gap-2">
                    <div class="btn-group" v-if="comment.status === 'pending'">
                      <button 
                        class="btn btn-success btn-sm"
                        @click="updateCommentStatus(comment.id, 'approved')"
                        :disabled="updating"
                      >
                        <i class="bi bi-check-circle me-1"></i>
                        通过
                      </button>
                      <button 
                        class="btn btn-warning btn-sm"
                        @click="updateCommentStatus(comment.id, 'rejected')"
                        :disabled="updating"
                      >
                        <i class="bi bi-x-circle me-1"></i>
                        拒绝
                      </button>
                    </div>
                    <div v-else class="btn-group">
                      <button 
                        v-if="comment.status === 'approved'"
                        class="btn btn-warning btn-sm"
                        @click="updateCommentStatus(comment.id, 'rejected')"
                        :disabled="updating"
                      >
                        <i class="bi bi-eye-slash me-1"></i>
                        隐藏
                      </button>
                      <button 
                        v-if="comment.status === 'rejected'"
                        class="btn btn-success btn-sm"
                        @click="updateCommentStatus(comment.id, 'approved')"
                        :disabled="updating"
                      >
                        <i class="bi bi-eye me-1"></i>
                        显示
                      </button>
                    </div>
                    <button 
                      class="btn btn-danger btn-sm"
                      @click="confirmDelete(comment)"
                      :disabled="updating"
                    >
                      <i class="bi bi-trash me-1"></i>
                      删除
                    </button>
                    <div class="like-info text-center mt-2">
                      <small class="text-muted">
                        <i class="bi bi-heart-fill text-danger me-1"></i>
                        {{ comment.likes }} 个赞
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>    <!-- 删除确认模态框 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-dialog" @click.stop>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">确认删除</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>确定要删除这条评论吗？此操作不可撤销。</p>
            <div v-if="commentToDelete" class="alert alert-light">
              <strong>{{ commentToDelete.author }}</strong>: {{ commentToDelete.content }}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">取消</button>
            <button 
              type="button" 
              class="btn btn-danger"
              @click="deleteComment"
              :disabled="deleting"
            >
              <span v-if="deleting" class="spinner-border spinner-border-sm me-2"></span>
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { getApiUrl, API_CONFIG } from '../../config/api.js'

const comments = ref([])
const loading = ref(true)
const updating = ref(false)
const deleting = ref(false)
const currentTab = ref('pending')
const commentToDelete = ref(null)
const showDeleteModal = ref(false)

const pendingCount = computed(() => {
  return comments.value.filter(comment => comment.status === 'pending').length
})

// 获取评论列表
const fetchComments = async () => {
  loading.value = true
  try {
    const endpoint = currentTab.value === 'pending' 
      ? getApiUrl(API_CONFIG.ENDPOINTS.COMMENTS_ADMIN_PENDING)
      : getApiUrl(API_CONFIG.ENDPOINTS.COMMENTS_ADMIN_ALL)
    
    const response = await fetch(endpoint)
    if (response.ok) {
      comments.value = await response.json()
    }
  } catch (error) {
    console.error('获取评论失败:', error)
  } finally {
    loading.value = false
  }
}

// 更新评论状态
const updateCommentStatus = async (commentId, status) => {
  updating.value = true
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.COMMENT_ADMIN_STATUS(commentId)), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
    
    if (response.ok) {
      await fetchComments()
    }
  } catch (error) {
    console.error('更新评论状态失败:', error)
  } finally {
    updating.value = false
  }
}

// 确认删除
const confirmDelete = (comment) => {
  commentToDelete.value = comment
  showDeleteModal.value = true
}

// 删除评论
const deleteComment = async () => {
  if (!commentToDelete.value) return
  
  deleting.value = true
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.COMMENT_DELETE(commentToDelete.value.id)), {
      method: 'DELETE',
    })
      if (response.ok) {
      showDeleteModal.value = false
      commentToDelete.value = null
      await fetchComments()
    }
  } catch (error) {
    console.error('删除评论失败:', error)
  } finally {
    deleting.value = false
  }
}

// 获取状态徽章样式
const getStatusBadgeClass = (status) => {
  const classMap = {
    'pending': 'bg-warning',
    'approved': 'bg-success',
    'rejected': 'bg-danger'
  }
  return classMap[status] || 'bg-secondary'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '待审核',
    'approved': '已通过',
    'rejected': '已拒绝'
  }
  return textMap[status] || '未知'
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 监听标签页切换
watch(currentTab, () => {
  fetchComments()
})

onMounted(() => {
  fetchComments()
})
</script>

<style scoped>
.comment-manager {
  padding: 1rem;
}

.comment-card {
  border-left: 4px solid #dee2e6;
  transition: all 0.3s ease;
}

.comment-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.comment-card .card-body {
  padding: 1.5rem;
}

.comment-info h6 {
  color: #495057;
  margin-bottom: 0.5rem;
}

.comment-meta {
  border-top: 1px solid #e9ecef;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}

.article-info {
  background-color: #f8f9fa;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border-left: 3px solid #007bff;
}

.comment-actions {
  height: fit-content;
}

.btn-group .btn {
  border-radius: 0.25rem;
}

.like-info {
  background-color: #f8f9fa;
  padding: 0.5rem;
  border-radius: 0.25rem;
}

/* 状态特定的卡片样式 */
.comment-card:has(.badge.bg-warning) {
  border-left-color: #ffc107;
}

.comment-card:has(.badge.bg-success) {
  border-left-color: #28a745;
}

.comment-card:has(.badge.bg-danger) {
  border-left-color: #dc3545;
}

/* 暗色主题支持 */
[data-bs-theme="dark"] .comment-card {
  background-color: var(--bs-dark);
  border-color: var(--bs-border-color-translucent);
}

[data-bs-theme="dark"] .article-info,
[data-bs-theme="dark"] .like-info {
  background-color: var(--bs-gray-800);
}

[data-bs-theme="dark"] .comment-info h6 {
  color: #fff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comment-actions {
    margin-top: 1rem;
  }
  
  .btn-group {
    width: 100%;
  }
  
  .btn-group .btn {
    flex: 1;
  }
}

/* 自定义模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  animation: fadeIn 0.15s ease-out;
}

.modal-dialog {
  background: white;
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.15s ease-out;
}

.modal-content {
  border: none;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.15s ease;
}

.btn-close:hover {
  opacity: 1;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* 暗色主题模态框 */
[data-bs-theme="dark"] .modal-dialog {
  background: var(--bs-dark);
  color: #fff;
}

[data-bs-theme="dark"] .modal-header,
[data-bs-theme="dark"] .modal-footer {
  border-color: var(--bs-border-color-translucent);
}

[data-bs-theme="dark"] .btn-close {
  color: #fff;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to { 
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
