<template>
  <div class="comment-section">
    <div class="comment-header mb-4">
      <h4 class="mb-3">
        <i class="bi bi-chat-dots me-2"></i>
        评论区
        <span v-if="comments.length" class="badge bg-secondary ms-2">
          {{ comments.length }}
        </span>
      </h4>

      <!-- 评论统计 -->
      <div v-if="comments.length" class="text-muted small mb-3">
        共 {{ comments.length }} 条评论
      </div>
    </div>

    <!-- 发表评论表单 -->
    <div class="comment-form mb-4 p-3 bg-light rounded">
      <h5 class="mb-3">发表评论</h5>
      <form @submit.prevent="submitComment">
        <div class="mb-3">
          <label for="commentName" class="form-label">昵称</label>
          <input
            id="commentName"
            v-model="commentForm.name"
            type="text"
            class="form-control"
            placeholder="请输入您的昵称"
            required
          />
        </div>
        <div class="mb-3">
          <label for="commentEmail" class="form-label">邮箱</label>
          <input
            id="commentEmail"
            v-model="commentForm.email"
            type="email"
            class="form-control"
            placeholder="请输入您的邮箱（不会被公开）"
            required
          />
        </div>
        <div class="mb-3">
          <label for="commentContent" class="form-label">评论内容</label>
          <textarea
            id="commentContent"
            v-model="commentForm.content"
            class="form-control"
            rows="4"
            placeholder="请输入您的评论..."
            required
          ></textarea>
        </div>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="submitting"
        >
          <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
          {{ submitting ? '提交中...' : '发表评论' }}
        </button>
      </form>
    </div>

    <!-- 加载状态 -->
    <LoadingSpinner v-if="loading" text="正在加载评论..." size="small" />

    <!-- 错误状态 -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      加载评论失败: {{ error.message }}
      <button class="btn btn-sm btn-outline-danger ms-3" @click="fetchComments">
        重试
      </button>
    </div>

    <!-- 评论列表 -->
    <div v-else-if="comments.length" class="comment-list">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="comment-item mb-3 p-3 border rounded"
      >
        <div class="comment-header d-flex justify-content-between align-items-start mb-2">
          <div>
            <strong class="comment-author">{{ comment.name }}</strong>
            <span class="comment-date text-muted small ms-2">
              {{ formatDate(comment.createdAt) }}
            </span>
          </div>
          <button
            class="btn btn-sm btn-outline-primary like-btn"
            @click="likeComment(comment.id)"
            :disabled="likingComments.has(comment.id)"
          >
            <i class="bi bi-hand-thumbs-up me-1"></i>
            {{ comment.likes || 0 }}
            <span v-if="likingComments.has(comment.id)" class="spinner-border spinner-border-sm ms-1"></span>
          </button>
        </div>
        <div class="comment-content">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="formatCommentContent(comment.content)"></div>
        </div>
      </div>

      <!-- 无更多评论提示 -->
      <div v-if="!hasMoreComments" class="text-center text-muted mt-4">
        <i class="bi bi-chat-dots me-1"></i>
        没有更多评论了
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="alert alert-info text-center" role="alert">
      <i class="bi bi-chat-dots fs-1 d-block mb-3"></i>
      暂无评论，快来发表第一条评论吧！
    </div>
  </div>
</template>

<script setup>
import { useComments } from '~/composables/useComments'
import LoadingSpinner from '~/components/LoadingSpinner.vue'

const props = defineProps({
  articleId: {
    type: [String, Number],
    required: true
  }
})

// 响应式数据
const comments = ref([])
const loading = ref(false)
const error = ref(null)
const submitting = ref(false)
const likingComments = ref(new Set())

// 评论表单
const commentForm = ref({
  name: '',
  email: '',
  content: ''
})

// API composable
const { getCommentsByArticle, submitComment: submitCommentApi, likeComment: likeCommentApi } = useComments()

// 格式化评论内容（简单的链接和换行处理）
const formatCommentContent = (content) => {
  if (!content) return ''

  // 转换换行符为<br>
  let formatted = content.replace(/\n/g, '<br>')

  // 简单的链接识别
  const urlRegex = /(https?:\/\/[^\s]+)/g
  formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')

  return formatted
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取评论列表
const fetchComments = async () => {
  if (loading.value) return

  loading.value = true
  error.value = null

  try {
    console.log('CommentSection: 开始获取评论，文章ID:', props.articleId)
    const data = await getCommentsByArticle(props.articleId)
    comments.value = data || []
    console.log('CommentSection: 获取评论成功，数量:', comments.value.length)
  } catch (e) {
    error.value = e
    console.error('CommentSection: 获取评论失败:', e)
  } finally {
    loading.value = false
  }
}

// 提交评论
const submitComment = async () => {
  if (submitting.value) return

  submitting.value = true

  try {
    const commentData = {
      articleId: props.articleId,
      name: commentForm.value.name.trim(),
      email: commentForm.value.email.trim(),
      content: commentForm.value.content.trim()
    }

    console.log('CommentSection: 提交评论:', commentData)
    await submitCommentApi(commentData)

    // 重置表单
    commentForm.value = {
      name: '',
      email: '',
      content: ''
    }

    // 重新获取评论列表
    await fetchComments()

    // 显示成功提示
    showToast('评论发表成功！', 'success')

  } catch (e) {
    console.error('CommentSection: 提交评论失败:', e)
    showToast('评论发表失败，请重试', 'error')
  } finally {
    submitting.value = false
  }
}

// 点赞评论
const likeComment = async (commentId) => {
  if (likingComments.value.has(commentId)) return

  likingComments.value.add(commentId)

  try {
    console.log('CommentSection: 点赞评论，ID:', commentId)
    await likeCommentApi(commentId)

    // 更新本地评论的点赞数
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) {
      comment.likes = (comment.likes || 0) + 1
    }

  } catch (e) {
    console.error('CommentSection: 点赞评论失败:', e)
    showToast('点赞失败，请重试', 'error')
  } finally {
    likingComments.value.delete(commentId)
  }
}

// 显示提示消息
const showToast = (message, type = 'info') => {
  const toast = document.createElement('div')
  const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info'

  toast.className = `position-fixed top-0 start-50 translate-middle-x ${bgClass} text-white px-4 py-3 rounded shadow mt-3`
  toast.style.zIndex = '9999'
  toast.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
      ${message}
    </div>
  `

  document.body.appendChild(toast)

  // 添加进入动画
  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease'
    toast.style.transform = 'translate(-50%, 0)'
  }, 10)

  // 3秒后移除
  setTimeout(() => {
    toast.style.transform = 'translate(-50%, -100px)'
    toast.style.opacity = '0'
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 300)
  }, 3000)
}

// 监听文章ID变化
watch(() => props.articleId, (newId, oldId) => {
  if (newId !== oldId) {
    fetchComments()
  }
})

// 组件挂载时获取评论
onMounted(() => {
  fetchComments()
})
</script>

<style scoped>
.comment-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.comment-header h4 {
  color: #212529;
  border-bottom: 2px solid #0d6efd;
  padding-bottom: 0.5rem;
  display: inline-block;
}

.comment-form {
  background: #f8f9fa !important;
  border: 1px solid #dee2e6;
}

.comment-list {
  max-height: 600px;
  overflow-y: auto;
}

.comment-item {
  background: white;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.comment-item:hover {
  border-left-color: #0d6efd;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.comment-author {
  color: #0d6efd;
  font-weight: 600;
}

.comment-date {
  color: #6c757d !important;
}

.comment-content {
  color: #495057;
  line-height: 1.6;
  margin-top: 0.5rem;
}

.like-btn {
  transition: all 0.3s ease;
  border: none;
  background: transparent;
}

.like-btn:hover {
  background: #0d6efd;
  color: white;
  transform: translateY(-1px);
}

.like-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 表单样式 */
.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.btn-primary {
  background: #0d6efd;
  border-color: #0d6efd;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #0b5ed7;
  border-color: #0a58ca;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comment-section {
    padding: 1rem;
  }

  .comment-header h4 {
    font-size: 1.25rem;
  }

  .comment-form {
    padding: 1rem !important;
  }

  .comment-item {
    padding: 1rem !important;
  }
}
</style>