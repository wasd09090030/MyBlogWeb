<template>
  <div class="comment-section-container max-w-full mx-auto py-8 text-gray-900 dark:text-gray-200">
    <!-- 点赞区域 -->
    <div class="like-section flex justify-center mb-8">
      <n-button
        class="like-btn px-8 h-[50px] text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
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
        <span class="like-count mx-2 font-bold">{{ likeCount }}</span>
        <span class="like-text">{{ isLiked ? '已点赞' : '点赞' }}</span>
      </n-button>
    </div>

    <n-divider class="dark-divider" />

    <!-- 评论表单 -->
    <n-card title="发表评论" class="comment-form-card rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-2xl" size="medium">
      <template #header-extra>
        <Icon name="chat-dots" size="md" class="text-gray-500 dark:text-gray-400" />
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

        <div class="form-actions flex justify-end mt-4">
          <n-button
            type="primary"
            size="large"
            :loading="submitting"
            @click="submitComment"
            class="submit-btn px-8"
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
    <div class="comments-list mt-12 bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 relative overflow-hidden">
      <!-- 装饰性光晕 -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-transparent to-transparent dark:from-sky-500/10 dark:via-transparent dark:to-transparent pointer-events-none"></div>
      
      <div class="relative z-10">
        <div class="list-header mb-6">
          <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <Icon name="chat-left-text" class="mr-2" />
            评论列表 <n-tag round type="info" size="small" class="ml-2">{{ comments.length }}</n-tag>
          </h3>
        </div>

        <div v-if="loadingComments" class="text-center py-12">
          <n-spin size="large" description="加载评论中..." />
        </div>

        <n-empty v-else-if="comments.length === 0" description="暂无评论，来抢沙发吧！" class="py-12">
          <template #icon>
            <Icon name="chat-square-dots" size="3xl" />
          </template>
        </n-empty>

        <div v-else class="comment-items space-y-4">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg dark:shadow-xl transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden"
          >
            <!-- 装饰性光晕 -->
            <div class="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent dark:from-sky-500/8 dark:via-transparent dark:to-transparent pointer-events-none"></div>
            
            <!-- 内容区域 -->
            <div class="relative z-10">
              <n-thing>
                <template #avatar>
                  <n-avatar
                    round
                    size="medium"
                    :src="getAvatarUrl(comment.author)"
                    :fallback-src="'https://ui-avatars.com/api/?name=' + comment.author"
                  />
                </template>
                
                <template #header>
                  <span class="author-name font-semibold text-lg text-gray-800 dark:text-gray-200">{{ comment.author }}</span>
                  <n-tag v-if="comment.isAdmin" type="error" size="small" round class="ml-2">博主</n-tag>
                </template>
                
                <template #header-extra>
                  <span class="comment-time text-gray-500 dark:text-gray-400 text-sm">
                    <Icon name="clock" size="xs" class="mr-1" />
                    {{ formatDate(comment.createdAt) }}
                  </span>
                </template>
                
                <div class="comment-content mt-2 mb-4 leading-relaxed text-gray-700 dark:text-gray-300 text-base">
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
/* 基础容器样式保留（Tailwind 已处理大部分） */
.comment-section-container {
  position: relative;
}

/* 暗色模式下点赞按钮的高级样式 */
.dark .like-btn {
  --n-color: rgba(15, 23, 42, 0.6);
  --n-color-hover: rgba(30, 41, 59, 0.75);
  --n-color-pressed: rgba(30, 41, 59, 0.85);
  --n-border: 1px solid rgba(56, 189, 248, 0.25);
  --n-border-hover: 1px solid rgba(56, 189, 248, 0.45);
  --n-border-pressed: 1px solid rgba(56, 189, 248, 0.6);
  --n-text-color: #e2e8f0;
  box-shadow: 0 14px 28px rgba(2, 8, 23, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.14);
}

.dark .like-btn.n-button--primary-type {
  --n-color: rgba(14, 165, 233, 0.18);
  --n-color-hover: rgba(14, 165, 233, 0.26);
  --n-color-pressed: rgba(14, 165, 233, 0.32);
  --n-text-color: #e0f2fe;
  --n-border: 1px solid rgba(56, 189, 248, 0.65);
}

/* 暗色模式下评论表单卡片的高级样式 */
.dark .comment-form-card {
  box-shadow: 0 20px 40px rgba(2, 8, 23, 0.6), inset 0 0 0 1px rgba(125, 211, 252, 0.08);
}

.comment-form-card :deep(.n-card-header) {
  border-bottom: 1px solid rgb(229 231 235);
  padding-bottom: 0.75rem;
}

.dark .comment-form-card :deep(.n-card-header) {
  border-bottom-color: rgb(55 65 81);
}

.comment-form-card :deep(.n-card-header__main) {
  color: rgb(31 41 55);
}

.dark .comment-form-card :deep(.n-card-header__main) {
  color: rgb(226 232 240);
}

.comment-form-card :deep(.n-card-header__extra) {
  color: rgb(107 114 128);
}

.dark .comment-form-card :deep(.n-card-header__extra) {
  color: rgb(156 163 175);
}

/* 暗色模式下评论项的增强悬停效果 */
.dark .comment-item:hover {
  box-shadow: 0 20px 50px rgba(2, 8, 23, 0.7), 0 0 0 1px rgba(56, 189, 248, 0.25);
}

/* Naive UI 组件的暗色模式定制 */
.dark .comment-section-container :deep(.n-divider) {
  --n-color: rgb(55 65 81);
}

.dark .comment-section-container :deep(.n-form-item-label) {
  color: rgb(203 213 225);
}

.dark .comment-section-container :deep(.n-input) {
  --n-color: rgb(17 24 39);
  --n-border: 1px solid rgb(55 65 81);
  --n-border-hover: 1px solid rgba(56, 189, 248, 0.45);
  --n-border-focus: 1px solid rgba(56, 189, 248, 0.65);
  --n-text-color: rgb(226 232 240);
  --n-placeholder-color: rgb(100 116 139);
  --n-box-shadow-focus: 0 0 0 3px rgba(56, 189, 248, 0.2);
}

.dark .comment-section-container :deep(.n-tag) {
  --n-color: rgba(56, 189, 248, 0.15);
  --n-text-color: rgb(186 230 253);
  --n-border: 1px solid rgba(56, 189, 248, 0.35);
}

.dark .comment-section-container :deep(.n-empty__description) {
  color: rgb(148 163 184);
}
</style>
