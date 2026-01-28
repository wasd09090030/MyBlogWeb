<template>
  <div class="comment-section-container">
    <!-- 点赞区域 -->
    <div class="like-section">
      <n-button
        class="like-btn"
        :type="isLiked ? 'primary' : 'default'"
        round
        size="large"
        @click="toggleLike"
        :loading="likingInProgress"
      >
        <template #icon>
          <Icon v-if="isHydrated" :name="isLiked ? 'heart-fill' : 'heart'" :solid="isLiked" />
          <Icon v-else name="heart" />
        </template>
        <span class="like-count">{{ likeCount }}</span>
        <span class="like-text">{{ isLiked ? '已点赞' : '点赞' }}</span>
      </n-button>
    </div>

    <n-divider />

    <!-- 评论表单 -->
    <n-card title="发表评论" class="comment-form-card" size="medium">
      <template #header-extra>
        <Icon name="chat-dots" size="md" />
      </template>
      
      <n-alert v-if="submitSuccess" type="success" class="mb-4" closable>
        评论提交成功！正在等待审核...
      </n-alert>

      <n-form ref="formRef" :model="newComment" :rules="rules">
        <n-grid :x-gap="12" :cols="1" responsive="screen" item-responsive>
          <n-grid-item span="0:1 600:1">
             <n-grid :x-gap="12" :cols="2">
                <n-form-item-gi label="姓名" path="author">
                  <n-input v-model:value="newComment.author" placeholder="请输入您的昵称" />
                </n-form-item-gi>
                <n-form-item-gi label="邮箱 (可选)" path="email">
                  <n-input v-model:value="newComment.email" placeholder="用于接收回复通知" />
                </n-form-item-gi>
             </n-grid>
          </n-grid-item>
        </n-grid>
        
        <n-form-item label="评论内容" path="content">
          <n-input
            v-model:value="newComment.content"
            type="textarea"
            placeholder="写下您的想法..."
            :autosize="{ minRows: 4, maxRows: 8 }"
            show-count
            :maxlength="1000"
          />
        </n-form-item>

        <div class="form-actions">
          <n-button
            type="primary"
            size="large"
            :loading="submitting"
            @click="submitComment"
            class="submit-btn"
          >
            <template #icon>
              <Icon name="send" />
            </template>
            发表评论
          </n-button>
        </div>
      </n-form>
    </n-card>

    <!-- 评论列表 -->
    <div class="comments-list mt-5">
      <div class="list-header mb-4">
        <h3>
          <Icon name="chat-left-text" class="me-2" />
          评论列表 <n-tag round type="info" size="small">{{ comments.length }}</n-tag>
        </h3>
      </div>

      <div v-if="loadingComments" class="text-center py-5">
        <n-spin size="large" description="加载评论中..." />
      </div>

      <n-empty v-else-if="comments.length === 0" description="暂无评论，来抢沙发吧！" class="py-5">
        <template #icon>
          <Icon name="chat-square-dots" size="3xl" />
        </template>
      </n-empty>

      <div v-else class="comment-items">
        <n-thing
          v-for="comment in comments"
          :key="comment.id"
          class="comment-item mb-4"
        >
          <template #avatar>
            <n-avatar
              round
              size="medium"
              :src="getAvatarUrl(comment.author)"
              :fallback-src="'https://ui-avatars.com/api/?name=' + comment.author"
            />
          </template>
          
          <template #header>
            <span class="author-name">{{ comment.author }}</span>
            <n-tag v-if="comment.isAdmin" type="error" size="small" round class="ms-2">博主</n-tag>
          </template>
          
          <template #header-extra>
            <span class="comment-time text-muted">
              <Icon name="clock" size="xs" class="me-1" />
              {{ formatDate(comment.createdAt) }}
            </span>
          </template>
          
          <div class="comment-content">
            {{ comment.content }}
          </div>
          
          <template #action>
            <n-space>
              <n-button
                size="small"
                quaternary
                :type="comment.isLiked ? 'error' : 'default'"
                @click="likeComment(comment.id)"
              >
                <template #icon>
                  <Icon v-if="isHydrated" :name="comment.isLiked ? 'heart-fill' : 'heart'" />
                  <Icon v-else name="heart" />
                </template>
                {{ comment.likes || 0 }}
              </n-button>
              <n-button size="small" quaternary v-if="comment.website" tag="a" :href="comment.website" target="_blank">
                <template #icon>
                  <Icon name="link-45deg" />
                </template>
                访问主页
              </n-button>
            </n-space>
          </template>
        </n-thing>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useComments } from '~/composables/useComments'
import { useMessage } from 'naive-ui'

const props = defineProps({
  articleId: {
    type: [Number, String],
    required: true
  }
})

const message = useMessage()

// 响应式数据
const comments = ref([])
const likeCount = ref(0)
const isLiked = ref(false)
const likingInProgress = ref(false)
const submitting = ref(false)
const submitSuccess = ref(false)
const loadingComments = ref(true)
const isHydrated = ref(false)

const newComment = ref({
  author: '',
  email: '',
  content: ''
})

const rules = {
  author: {
    required: true,
    message: '请输入您的昵称',
    trigger: 'blur'
  },
  content: {
    required: true,
    message: '请输入评论内容',
    trigger: 'blur'
  }
}

// API composable
const { getCommentsByArticle, submitComment: submitCommentApi, likeComment: likeCommentApi } = useComments()

// 获取头像
const getAvatarUrl = (name) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
}

// 获取评论列表
const fetchComments = async () => {
  try {
    loadingComments.value = true
    const data = await getCommentsByArticle(props.articleId)
    comments.value = data || []
  } catch (error) {
    console.error('获取评论失败:', error)
    message.error('加载评论失败')
  } finally {
    loadingComments.value = false
  }
}

// 获取点赞状态
const fetchLikeStatus = async () => {
  try {
    const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '{}')
    isLiked.value = likedArticles[props.articleId] || false
    // 模拟点赞数
    likeCount.value = Math.floor(Math.random() * 10) + (isLiked.value ? 1 : 0)
  } catch (error) {
    console.error('获取点赞状态失败:', error)
  }
}

// 切换点赞
const toggleLike = async () => {
  if (likingInProgress.value) return

  likingInProgress.value = true
  try {
    isLiked.value = !isLiked.value
    const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '{}')
    
    if (isLiked.value) {
      likedArticles[props.articleId] = true
      likeCount.value++
      message.success('感谢点赞！')
    } else {
      delete likedArticles[props.articleId]
      likeCount.value = Math.max(0, likeCount.value - 1)
    }
    localStorage.setItem('likedArticles', JSON.stringify(likedArticles))
  } catch (error) {
    console.error('点赞操作失败:', error)
    isLiked.value = !isLiked.value
  } finally {
    likingInProgress.value = false
  }
}

// 提交评论
const submitComment = async () => {
  if (!newComment.value.author || !newComment.value.content) {
    message.warning('请填写完整信息')
    return
  }

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

    newComment.value = {
      author: '',
      email: '',
      content: ''
    }
    submitSuccess.value = true
    message.success('评论提交成功！')
    
    await fetchComments()
  } catch (error) {
    console.error('提交评论失败:', error)
    message.error('提交评论失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 点赞评论
const likeComment = async (commentId) => {
  try {
    await likeCommentApi(commentId)
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) {
      comment.likes = (comment.likes || 0) + 1
      comment.isLiked = true
      message.success('点赞成功')
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

watch(() => props.articleId, (newId, oldId) => {
  if (newId !== oldId) {
    fetchComments()
    fetchLikeStatus()
  }
})

onMounted(() => {
  isHydrated.value = true
  fetchComments()
  fetchLikeStatus()
})
</script>

<style scoped>
.comment-section-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 2rem 0;
}

.like-section {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.like-btn {
  padding: 0 2rem;
  height: 50px;
  font-size: 1.1rem;
}

.like-count {
  margin: 0 0.5rem;
  font-weight: bold;
}

.comment-form-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.submit-btn {
  padding-left: 2rem;
  padding-right: 2rem;
}

.comments-list {
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 16px;
  margin-top: 3rem;
}

.comment-item {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.comment-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.author-name {
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--text-primary);
}

.comment-content {
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
  font-size: 1rem;
}

/* Dark mode adaptations */
:root[class~="dark"] .comment-form-card {
  background-color: #2c2c32;
  border-color: #3c3c42;
}

:root[class~="dark"] .comments-list {
  background-color: #252529;
}

:root[class~="dark"] .comment-item {
  background-color: #2c2c32;
}
</style>
