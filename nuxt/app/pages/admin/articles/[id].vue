<template>
  <div class="article-editor">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
          {{ isEdit ? '编辑文章' : '创建文章' }}
        </h2>
        <div class="flex gap-2">
          <n-button quaternary @click="goBack">
            <template #icon>
              <Icon name="arrow-left" size="sm" />
            </template>
            返回
          </n-button>
          <n-button type="primary" :loading="isSaving" @click="saveArticle">
            <template #icon>
              <Icon name="save" size="sm" />
            </template>
            保存文章
          </n-button>
        </div>
      </div>

      <n-spin :show="loading">
        <div class="editor-layout">
          <!-- 左侧：文章元信息 -->
          <div class="editor-sidebar">
            <n-card title="文章设置" class="sticky top-20">
              <!-- 标题 -->
              <n-form-item label="文章标题" required>
                <n-input
                  v-model:value="articleForm.title"
                  placeholder="输入文章标题..."
                />
              </n-form-item>

              <!-- Slug -->
              <n-form-item label="文章 Slug（英文）">
                <div class="w-full">
                  <n-input
                    v-model:value="articleForm.slug"
                    placeholder="可留空自动生成，例如: nuxt-seo-guide"
                  />
                  <p class="text-xs text-gray-500 mt-1">留空时后台会自动生成英文 slug</p>
                </div>
              </n-form-item>

              <!-- 文章类别 -->
              <n-form-item label="文章类别">
                <n-select
                  v-model:value="articleForm.category"
                  :options="categoryOptions"
                />
              </n-form-item>

              <!-- 封面图URL -->
              <n-form-item label="封面图片">
                <n-input
                  v-model:value="articleForm.coverImage"
                  placeholder="https://example.com/image.jpg"
                />
              </n-form-item>
              
              <!-- 封面图预览 -->
              <div v-if="articleForm.coverImage" class="mb-4">
                <div class="cover-preview rounded-lg overflow-hidden border dark:border-gray-700">
                  <img
                    :src="articleForm.coverImage"
                    alt="封面图预览"
                    class="w-full h-40 object-cover"
                    @error="handleImageError"
                    @load="handleImageLoad"
                  />
                </div>
                <p v-if="!isValidImageUrl" class="text-yellow-500 text-sm mt-1">
                  <Icon name="exclamation-circle" size="xs" />
                  图片预览加载失败
                </p>
              </div>

              <!-- 自定义标签 -->
              <n-form-item label="文章标签">
                <div class="w-full">
                  <n-dynamic-tags v-model:value="articleForm.tags" />
                  <div class="mt-2 text-sm text-gray-500">
                    常用标签：
                    <n-tag
                      v-for="tag in suggestedTags"
                      :key="tag"
                      size="small"
                      class="cursor-pointer mr-1 mb-1"
                      @click="addSuggestedTag(tag)"
                    >
                      {{ tag }}
                    </n-tag>
                  </div>
                </div>
              </n-form-item>

              <!-- AI 概要 -->
              <n-form-item label="AI 概要">
                <div class="w-full">
                  <div class="flex gap-2 mb-2">
                    <n-button
                      size="small"
                      type="info"
                      :loading="isGeneratingAi"
                      :disabled="!articleForm.contentMarkdown"
                      @click="generateAiSummary"
                    >
                      <template #icon>
                        <Icon name="bolt" size="xs" />
                      </template>
                      {{ isGeneratingAi ? '生成中...' : '生成概要' }}
                    </n-button>
                    <n-button
                      size="small"
                      quaternary
                      :disabled="!articleForm.aiSummary"
                      @click="articleForm.aiSummary = ''"
                    >
                      <Icon name="x-mark" size="xs" />
                    </n-button>
                  </div>
                  <n-input
                    v-model:value="articleForm.aiSummary"
                    type="textarea"
                    :rows="3"
                    placeholder="点击上方按钮使用 AI 生成概要，或手动输入..."
                  />
                </div>
              </n-form-item>

              <!-- 统计信息 -->
              <div class="stats-info pt-4 border-t dark:border-gray-700">
                <div class="flex justify-between text-sm text-gray-500 mb-2">
                  <span>字数统计</span>
                  <span>{{ contentStats.chars }} 字符</span>
                </div>
                <div class="flex justify-between text-sm text-gray-500 mb-2">
                  <span>行数</span>
                  <span>{{ contentStats.lines }} 行</span>
                </div>
                <div class="flex justify-between text-sm text-gray-500">
                  <span>预计阅读</span>
                  <span>{{ contentStats.readTime }} 分钟</span>
                </div>
              </div>
            </n-card>
          </div>

          <!-- 右侧：Markdown 编辑器 -->
          <div class="editor-main">
            <n-card>
              <template #header>
                <div class="flex justify-between items-center">
                  <span>
                    <Icon name="file-earmark-text" size="md" class="mr-2" />
                    内容编辑
                  </span>
                  <n-tag size="small" type="info">
                    支持 Markdown 语法和 HTML 标签
                  </n-tag>
                </div>
              </template>
              
              <ClientOnly>
                <MdEditorWrapper
                  v-model="articleForm.contentMarkdown"
                  :height="editorHeight"
                  @save="handleSave"
                  @html-change="handleHtmlChange"
                />
              </ClientOnly>
            </n-card>
          </div>
        </div>
      </n-spin>
    </div>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: 'admin',
  middleware: 'admin-auth'
})

const route = useRoute()
const router = useRouter()
const message = useMessage()
const config = useRuntimeConfig()
const baseURL = config.public.apiBase
const authStore = useAuthStore()
const { getArticle, createArticle, updateArticle, generateAiSummary: generateAiSummaryApi } = useAdminArticles()

// 判断是创建还是编辑模式
const isEdit = computed(() => !!route.params.id)

const loading = ref(false)
const isSaving = ref(false)
const isValidImageUrl = ref(false)
const isGeneratingAi = ref(false)

const articleForm = ref({
  title: '',
  slug: '',
  content: '',
  contentMarkdown: '',
  coverImage: '',
  category: 'study',
  tags: [],
  aiSummary: ''
})

const categoryOptions = [
  { label: '📚 学习', value: 'study' },
  { label: '🎮 游戏', value: 'game' },
  { label: '💼 个人作品', value: 'work' },
  { label: '📦 资源分享', value: 'resource' },
  { label: '📝 其他', value: 'other' }
]

const suggestedTags = ['前端', '后端', 'Vue', 'React', 'JavaScript', 'TypeScript', 'Python', 'CSS', '教程', '分享']

// 编辑器高度
const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 800)
const editorHeight = computed(() => `${Math.max(500, windowHeight.value - 300)}px`)

// 内容统计
const contentStats = computed(() => {
  const content = articleForm.value.contentMarkdown || ''
  const chars = content.length
  const lines = content.split('\n').length
  const readTime = Math.max(1, Math.ceil(chars / 400))
  return { chars, lines, readTime }
})

// 监听窗口大小变化
const handleResize = () => {
  windowHeight.value = window.innerHeight
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (isEdit.value) {
    fetchArticle(route.params.id)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 获取文章详情
const fetchArticle = async (id) => {
  loading.value = true
  try {
    const article = await getArticle(id)
    articleForm.value = {
      title: article.title,
      slug: article.slug || '',
      content: article.content || '',
      contentMarkdown: article.contentMarkdown || article.content,
      coverImage: article.coverImage || '',
      category: article.category || 'study',
      tags: article.tags || [],
      aiSummary: article.aiSummary || ''
    }
    
    if (article.coverImage) {
      setTimeout(() => {
        validateImageUrl(article.coverImage)
      }, 100)
    }
  } catch (error) {
    console.error('获取文章失败:', error)
    message.error('获取文章失败')
    goBack()
  } finally {
    loading.value = false
  }
}

// 保存文章
const saveArticle = async () => {
  if (!articleForm.value.title?.trim()) {
    message.warning('请输入文章标题')
    return
  }
  
  if (!articleForm.value.contentMarkdown?.trim()) {
    message.warning('请输入文章内容')
    return
  }
  
  isSaving.value = true
  
  try {
    const payload = {
      title: articleForm.value.title,
      slug: articleForm.value.slug?.trim() || null,
      content: articleForm.value.content || '',
      contentMarkdown: articleForm.value.contentMarkdown,
      coverImage: articleForm.value.coverImage || null,
      category: articleForm.value.category.toLowerCase(),
      tags: articleForm.value.tags || [],
      aiSummary: articleForm.value.aiSummary || null
    }
    
    if (isEdit.value) {
      await updateArticle(route.params.id, payload)
      message.success('文章已成功更新！')
    } else {
      await createArticle(payload)
      message.success('文章已成功创建！')
    }
    
    router.push('/admin/articles')
  } catch (error) {
    console.error('保存文章失败:', error)
    message.error('保存文章失败: ' + error.message)
  } finally {
    isSaving.value = false
  }
}

// 标签管理
const addSuggestedTag = (tag) => {
  if (!articleForm.value.tags.includes(tag)) {
    articleForm.value.tags.push(tag)
  }
}

// AI 概要生成
const generateAiSummary = async () => {
  if (!articleForm.value.contentMarkdown) {
    message.warning('请先输入文章内容')
    return
  }
  
  isGeneratingAi.value = true
  
  try {
    const response = await $fetch(`${baseURL}/ai/summary`, {
      method: 'POST',
      headers: authStore.authHeaders,
      body: {
        content: articleForm.value.contentMarkdown,
        title: articleForm.value.title || '未命名文章'
      }
    })
    
    articleForm.value.aiSummary = response.summary
    articleForm.value.slug = response.slug || ''
    message.success('AI 概要生成成功')
  } catch (error) {
    console.error('生成 AI 概要失败:', error)
    message.error('生成 AI 概要失败')
  } finally {
    isGeneratingAi.value = false
  }
}

// 图片验证
const validateImageUrl = (url) => {
  if (!url) {
    isValidImageUrl.value = false
    return
  }
  
  const img = new Image()
  img.onload = () => { isValidImageUrl.value = true }
  img.onerror = () => { isValidImageUrl.value = false }
  img.src = url
}

const handleImageLoad = () => { isValidImageUrl.value = true }
const handleImageError = () => { isValidImageUrl.value = false }

// 编辑器保存事件
const handleSave = (text, html) => {
  articleForm.value.contentMarkdown = text
  if (html) {
    articleForm.value.content = html
  }
  console.log('自动保存触发:', { textLength: text.length })
}

const handleHtmlChange = (html) => {
  if (html) {
    articleForm.value.content = html
  }
}

// 返回
const goBack = () => {
  router.push('/admin/articles')
}

// 监听封面图URL变化
watch(() => articleForm.value.coverImage, (newUrl) => {
  if (!newUrl) {
    isValidImageUrl.value = false
  } else {
    setTimeout(() => validateImageUrl(newUrl), 500)
  }
})
</script>

<style scoped>
.editor-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 1024px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }
  
  .editor-sidebar {
    order: 2;
  }
  
  .editor-main {
    order: 1;
  }
}
</style>
