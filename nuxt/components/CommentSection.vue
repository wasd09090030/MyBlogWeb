<template>
  <div class="comment-section mt-5">
    <!-- 点赞区域 -->
    <div class="like-section mb-4 text-center">
      <button
        @click="toggleLike"
        :class="['btn', 'like-btn', { 'liked': isLiked }]"
        :disabled="likingInProgress"
      >
        <i class="bi" :class="isLiked ? 'bi-heart-fill' : 'bi-heart'"></i>
        <span class="like-count ms-2">{{ likeCount }}</span>
        <span class="like-text ms-1">{{ isLiked ? '已点赞' : '点赞' }}</span>
      </button>
    </div>

    <!-- 评论表单 -->
    <div class="comment-form card mb-4">
      <div class="card-body">
        <h5 class="card-title">
          <i class="bi bi-chat-dots me-2"></i>
          发表评论
        </h5>
        <div v-if="submitSuccess" class="alert alert-success">
          <i class="bi bi-check-circle me-2"></i>
          评论提交成功！正在等待审核...
        </div>
        <form @submit.prevent="submitComment">
          <div class="row mb-3">
            <div class="col-md-6">
              <input
                v-model="newComment.author"
                type="text"
                class="form-control"
                placeholder="姓名 *"
                required
                maxlength="50"
              >
            </div>
            <div class="col-md-6">
              <input
                v-model="newComment.email"
                type="email"
                class="form-control"
                placeholder="邮箱（可选）"
                maxlength="100"
              >
            </div>
          </div>
          <div class="mb-3">
            <textarea
              v-model="newComment.content"
              class="form-control"
              rows="4"
              placeholder="写下您的评论... *"
              required
              maxlength="1000"
            ></textarea>
            <div class="form-text">{{ newComment.content.length }}/1000</div>
          </div>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="submitting"
          >
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            <i class="bi bi-send me-2"></i>
            发表评论
          </button>
        </form>
      </div>
    </div>

    <!-- 评论列表 -->
    <div class="comments-list">
      <h5 class="mb-4">
        <i class="bi bi-chat-left-text me-2"></i>
        评论 ({{ comments.length }})
      </h5>
      <div v-if="loadingComments" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">加载中...</span>
        </div>
      </div>
      <div v-else-if="comments.length === 0" class="text-muted text-center py-4">
        <i class="bi bi-chat-square-dots fs-1 mb-3 d-block"></i>
        暂无评论，来发表第一条评论吧！
      </div>
      <div v-else>
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-item card mb-3"
        >
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="comment-author">
                <strong class="author-name">
                  <i class="bi bi-person-circle me-1"></i>
                  {{ comment.author }}
                </strong>
                <small class="text-muted ms-2">{{ formatDate(comment.createdAt) }}</small>
                <span v-if="comment.website && comment.website.trim()" class="ms-2">
                  <a :href="comment.website" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                    <i class="bi bi-link-45deg"></i>
                  </a>
                </span>
              </div>
              <button
                @click="likeComment(comment.id)"
                class="btn btn-sm btn-outline-danger comment-like-btn"
                :class="{ 'active': comment.isLiked }"
              >
                <i class="bi bi-heart"></i>
                <span v-if="comment.likes > 0" class="ms-1">{{ comment.likes }}</span>
              </button>
            </div>
            <div class="comment-content">
              {{ comment.content }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useComments } from '~/composables/useComments'

const props = defineProps({
  articleId: {
    type: [Number, String],
    required: true
  }
})

// 响应式数据
const comments = ref([])
const likeCount = ref(0)
const isLiked = ref(false)
const likingInProgress = ref(false)
const submitting = ref(false)
const submitSuccess = ref(false)
const loadingComments = ref(true)

const newComment = ref({
  author: '',
  email: '',
  content: ''
})

// API composable
const { getCommentsByArticle, submitComment: submitCommentApi, likeComment: likeCommentApi } = useComments()

// 获取评论列表
const fetchComments = async () => {
  try {
    loadingComments.value = true
    const data = await getCommentsByArticle(props.articleId)
    comments.value = data || []
  } catch (error) {
    console.error('获取评论失败:', error)
  } finally {
    loadingComments.value = false
  }
}

// 获取点赞状态（简化版本，可以根据实际API调整）
const fetchLikeStatus = async () => {
  try {
    // 这里可以添加获取文章点赞状态的API调用
    // 暂时使用本地存储
    const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '{}')
    isLiked.value = likedArticles[props.articleId] || false

    // 这里可以从API获取实际的点赞数
    likeCount.value = 0
  } catch (error) {
    console.error('获取点赞状态失败:', error)
  }
}

// 切换点赞
const toggleLike = async () => {
  if (likingInProgress.value) return

  likingInProgress.value = true
  try {
    // 切换点赞状态
    isLiked.value = !isLiked.value

    // 更新本地存储
    const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '{}')
    if (isLiked.value) {
      likedArticles[props.articleId] = true
      likeCount.value++
    } else {
      delete likedArticles[props.articleId]
      likeCount.value = Math.max(0, likeCount.value - 1)
    }
    localStorage.setItem('likedArticles', JSON.stringify(likedArticles))

    // 这里可以调用实际的点赞API
    // await likeArticleApi(props.articleId)
  } catch (error) {
    console.error('点赞操作失败:', error)
    // 如果失败，恢复状态
    isLiked.value = !isLiked.value
  } finally {
    likingInProgress.value = false
  }
}

// 提交评论
const submitComment = async () => {
  if (submitting.value) return

  submitting.value = true
  submitSuccess.value = false

  try {
    const commentData = {
      articleId: props.articleId,
      author: newComment.value.author.trim(),
      email: newComment.value.email.trim(),
      content: newComment.value.content.trim()
    }

    await submitCommentApi(commentData)

    // 重置表单
    newComment.value = {
      author: '',
      email: '',
      content: ''
    }
    submitSuccess.value = true

    // 3秒后隐藏成功消息
    setTimeout(() => {
      submitSuccess.value = false
    }, 3000)

    // 重新加载评论
    await fetchComments()
  } catch (error) {
    console.error('提交评论失败:', error)
    alert('提交评论失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 点赞评论
const likeComment = async (commentId) => {
  try {
    await likeCommentApi(commentId)

    // 更新本地评论的点赞数
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) {
      comment.likes = (comment.likes || 0) + 1
      comment.isLiked = true
    }
  } catch (error) {
    console.error('点赞评论失败:', error)
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听文章ID变化
watch(() => props.articleId, (newId, oldId) => {
  if (newId !== oldId) {
    fetchComments()
    fetchLikeStatus()
  }
})

onMounted(() => {
  fetchComments()
  fetchLikeStatus()
})
</script>

<style scoped>
/* 点赞按钮样式 */
.like-btn {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  position: relative;
  overflow: hidden;
}

.like-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.like-btn:hover::before {
  left: 100%;
}

.like-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
}

.like-btn.liked {
  background: linear-gradient(135deg, #e55039, #c44569);
  animation: heartbeat 0.6s ease-in-out;
}

.like-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

@keyframes heartbeat {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* 评论表单样式 */
.comment-form {
  border: 2px solid #e9ecef;
  border-radius: 15px;
  transition: all 0.3s ease;
}

.comment-form:hover {
  border-color: #007bff;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.1);
}

.comment-form .card-title {
  color: #495057;
  font-weight: 600;
}

.comment-form .form-control {
  border-radius: 8px;
  border: 1px solid #ced4da;
  transition: all 0.3s ease;
}

.comment-form .form-control:focus {
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  border-color: #80bdff;
}

/* 评论项样式 */
.comment-item {
  border-left: 4px solid #007bff;
  border-radius: 10px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
}

.comment-item:hover {
  transform: translateX(5px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.author-name {
  color: #495057;
  font-size: 1rem;
}

.comment-content {
  line-height: 1.7;
  color: #333;
  margin: 0.8rem 0;
  padding: 0.5rem 0;
  font-size: 1rem;
  word-wrap: break-word;
}

.comment-like-btn {
  border-radius: 20px;
  transition: all 0.3s ease;
}

.comment-like-btn:hover {
  transform: scale(1.1);
}

.comment-like-btn.active {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}

/* 暗色主题支持 */
.dark-theme .comment-form,
.dark-theme .comment-item {
  background: linear-gradient(135deg, var(--bs-dark), #2c2c2c);
  border-color: var(--bs-border-color-translucent);
}

.dark-theme .comment-form .card-title {
  color: #fff;
}

.dark-theme .author-name {
  color: #fff;
}

.dark-theme .comment-content {
  color: #dee2e6;
}

.dark-theme .like-btn {
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .like-btn {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
  }

  .comment-item {
    margin-bottom: 1rem;
  }

  .comment-form .row > div {
    margin-bottom: 0.5rem;
  }
}

@media (max-width: 576px) {
  .like-btn {
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
  }

  .like-text {
    display: none;
  }

  .author-name {
    font-size: 0.9rem;
  }

  .comment-content {
    font-size: 0.95rem;
  }
}
</style>
