<template>
  <div class="markdown-renderer">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center gap-3 py-8 text-gray-500">
      <n-spin size="medium" />
      <span>渲染内容中...</span>
    </div>

    <!-- 渲染错误 -->
    <n-alert v-else-if="error" type="error" title="渲染失败" class="my-4">
      {{ error }}
    </n-alert>

    <!-- MDC 渲染结果 -->
    <article
      v-else-if="ast"
      :class="proseClasses"
    >
      <MDCRenderer
        :body="ast.body"
        :data="ast.data"
      />
    </article>

    <!-- 回退：直接渲染 HTML（兼容旧数据） -->
    <article
      v-else-if="htmlContent"
      :class="proseClasses"
      v-html="htmlContent"
    />

    <!-- 无内容 -->
    <n-empty v-else description="暂无内容" />
  </div>
</template>

<script setup>
import { parseMarkdown } from '@nuxtjs/mdc/runtime'

const props = defineProps({
  markdown: {
    type: String,
    default: ''
  },
  html: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'lg',
    validator: (value) => ['sm', 'base', 'lg', 'xl', '2xl'].includes(value)
  },
  customClass: {
    type: String,
    default: ''
  }
})

// 暴露 TOC 供父组件使用
const emit = defineEmits(['toc-ready'])

const ast = ref(null)
const loading = ref(false)
const error = ref(null)

const htmlContent = computed(() => {
  if (!props.markdown && props.html) {
    return props.html
  }
  return null
})

const proseClasses = computed(() => {
  return [
    'prose',
    `prose-${props.size}`,
    'prose-pink',
    'max-w-none',
    'dark:prose-invert',
    props.customClass
  ].filter(Boolean).join(' ')
})

const parseContent = async () => {
  if (!props.markdown) {
    ast.value = null
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await parseMarkdown(props.markdown)
    ast.value = result
    
    // 向父组件发送 TOC 数据
    if (result.toc) {
      emit('toc-ready', result.toc)
    }
  } catch (e) {
    console.error('Markdown 解析失败:', e)
    error.value = e.message || '内容解析失败'
    ast.value = null
  } finally {
    loading.value = false
  }
}

watch(() => props.markdown, () => {
  parseContent()
}, { immediate: true })

onMounted(() => {
  if (props.markdown && !ast.value) {
    parseContent()
  }
})
</script>

<style scoped>
.markdown-renderer {
  width: 100%;
}
</style>
