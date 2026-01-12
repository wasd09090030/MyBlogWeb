<template>
  <div class="markdown-renderer" ref="containerRef">
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
const containerRef = ref(null)

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

// 渲染 Mermaid 图表
async function renderMermaidDiagrams() {
  if (!process.client || !containerRef.value) return
  
  // 找到所有 mermaid 代码块
  const mermaidBlocks = containerRef.value.querySelectorAll('pre code.language-mermaid, pre.language-mermaid code')
  if (mermaidBlocks.length === 0) return
  
  try {
    // 动态导入 mermaid
    const mermaid = (await import('mermaid')).default
    
    // 检测暗色模式
    const isDark = document.documentElement.classList.contains('dark')
    
    // 初始化 mermaid - 使用自定义主题变量以获得更好的暗色适配
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      themeVariables: isDark ? {
        // 暗色主题变量
        primaryColor: '#1e3a5f',
        primaryTextColor: '#f3f4f6',
        primaryBorderColor: '#60a5fa',
        lineColor: '#9ca3af',
        secondaryColor: '#374151',
        tertiaryColor: '#1f2937',
        background: '#111827',
        mainBkg: '#1f2937',
        secondBkg: '#374151',
        nodeBorder: '#60a5fa',
        clusterBkg: '#1f2937',
        clusterBorder: '#4b5563',
        titleColor: '#f9fafb',
        edgeLabelBackground: '#374151',
        textColor: '#e5e7eb',
        nodeTextColor: '#f3f4f6',
        actorTextColor: '#f3f4f6',
        actorBkg: '#1e3a5f',
        actorBorder: '#60a5fa',
        actorLineColor: '#6b7280',
        signalColor: '#9ca3af',
        signalTextColor: '#e5e7eb',
        labelBoxBkgColor: '#374151',
        labelBoxBorderColor: '#4b5563',
        labelTextColor: '#e5e7eb',
        loopTextColor: '#e5e7eb',
        noteBkgColor: '#374151',
        noteBorderColor: '#60a5fa',
        noteTextColor: '#e5e7eb',
        activationBkgColor: '#1e3a5f',
        activationBorderColor: '#60a5fa',
        sequenceNumberColor: '#f3f4f6'
      } : {
        // 亮色主题变量
        primaryColor: '#dbeafe',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#3b82f6',
        lineColor: '#6b7280',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#e5e7eb',
        background: '#ffffff',
        mainBkg: '#f9fafb',
        secondBkg: '#f3f4f6',
        nodeBorder: '#3b82f6',
        clusterBkg: '#f9fafb',
        clusterBorder: '#d1d5db',
        titleColor: '#111827',
        edgeLabelBackground: '#ffffff',
        textColor: '#374151',
        nodeTextColor: '#1f2937',
        actorTextColor: '#1f2937',
        actorBkg: '#dbeafe',
        actorBorder: '#3b82f6',
        actorLineColor: '#9ca3af',
        signalColor: '#6b7280',
        signalTextColor: '#374151',
        labelBoxBkgColor: '#f9fafb',
        labelBoxBorderColor: '#d1d5db',
        labelTextColor: '#374151',
        loopTextColor: '#374151',
        noteBkgColor: '#fef3c7',
        noteBorderColor: '#f59e0b',
        noteTextColor: '#1f2937',
        activationBkgColor: '#dbeafe',
        activationBorderColor: '#3b82f6',
        sequenceNumberColor: '#1f2937'
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      sequence: {
        useMaxWidth: true,
        wrap: true,
        mirrorActors: false
      },
      gantt: {
        useMaxWidth: true
      }
    })
    
    // 渲染每个 mermaid 代码块
    for (let i = 0; i < mermaidBlocks.length; i++) {
      const codeBlock = mermaidBlocks[i]
      const preElement = codeBlock.closest('pre')
      if (!preElement) continue
      
      const code = codeBlock.textContent?.trim()
      if (!code) continue
      
      try {
        const diagramId = `mermaid-diagram-${Date.now()}-${i}`
        const { svg } = await mermaid.render(diagramId, code)
        
        // 创建容器替换原来的 pre 元素
        const container = document.createElement('div')
        container.className = 'mermaid-diagram my-6 flex justify-center overflow-x-auto p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'
        container.innerHTML = svg
        
        preElement.replaceWith(container)
      } catch (err) {
        console.error('Mermaid 渲染失败:', err)
        // 显示错误信息
        const errorContainer = document.createElement('div')
        errorContainer.className = 'mermaid-error my-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl'
        errorContainer.innerHTML = `
          <p class="text-red-600 dark:text-red-400 text-sm mb-2">Mermaid 图表渲染失败: ${err.message}</p>
          <details class="text-xs">
            <summary class="text-gray-500 cursor-pointer">查看源码</summary>
            <pre class="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">${code}</pre>
          </details>
        `
        preElement.replaceWith(errorContainer)
      }
    }
  } catch (err) {
    console.error('加载 Mermaid 库失败:', err)
  }
}

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
    
    // 等待 DOM 更新后渲染 Mermaid
    nextTick(() => {
      setTimeout(renderMermaidDiagrams, 100)
    })
  } catch (e) {
    console.error('Markdown 解析失败:', e)
    error.value = e.message || '内容解析失败'
    ast.value = null
  } finally {
    loading.value = false
  }
}

// 监听主题变化重新渲染 Mermaid
let themeObserver = null

watch(() => props.markdown, () => {
  parseContent()
}, { immediate: true })

onMounted(() => {
  if (props.markdown && !ast.value) {
    parseContent()
  }
  
  // 监听主题变化
  if (process.client) {
    themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          // 主题变化时重新渲染 mermaid
          nextTick(() => {
            setTimeout(renderMermaidDiagrams, 100)
          })
        }
      })
    })
    
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
  }
})

onUnmounted(() => {
  if (themeObserver) {
    themeObserver.disconnect()
  }
})
</script>

<style scoped>
.markdown-renderer {
  width: 100%;
}
</style>

<style>
/* Mermaid 图表样式 */
.mermaid-diagram svg {
  max-width: 100%;
  height: auto;
}

/* 暗色模式下的 Mermaid 样式增强 */
.dark .mermaid-diagram text {
  fill: #e5e7eb !important;
}

.dark .mermaid-diagram .nodeLabel,
.dark .mermaid-diagram .label {
  color: #f3f4f6 !important;
  fill: #f3f4f6 !important;
}

.dark .mermaid-diagram .edgeLabel {
  color: #e5e7eb !important;
  background-color: #374151 !important;
}

.dark .mermaid-diagram .edgePath .path {
  stroke: #9ca3af !important;
}

.dark .mermaid-diagram .arrowheadPath {
  fill: #9ca3af !important;
}

.dark .mermaid-diagram .node rect,
.dark .mermaid-diagram .node circle,
.dark .mermaid-diagram .node polygon {
  stroke: #60a5fa !important;
}

.dark .mermaid-diagram .cluster rect {
  fill: #1f2937 !important;
  stroke: #4b5563 !important;
}

.dark .mermaid-diagram .actor {
  fill: #1e3a5f !important;
  stroke: #60a5fa !important;
}

.dark .mermaid-diagram .actor-line {
  stroke: #6b7280 !important;
}

.dark .mermaid-diagram .messageLine0,
.dark .mermaid-diagram .messageLine1 {
  stroke: #9ca3af !important;
}

.dark .mermaid-diagram .messageText {
  fill: #e5e7eb !important;
}

.dark .mermaid-diagram .loopText,
.dark .mermaid-diagram .loopText > tspan {
  fill: #e5e7eb !important;
}

.dark .mermaid-diagram .loopLine {
  stroke: #4b5563 !important;
}

.dark .mermaid-diagram .labelBox {
  fill: #374151 !important;
  stroke: #4b5563 !important;
}

.dark .mermaid-diagram .note {
  fill: #374151 !important;
  stroke: #60a5fa !important;
}

.dark .mermaid-diagram .noteText {
  fill: #e5e7eb !important;
}

.dark .mermaid-diagram .activation0,
.dark .mermaid-diagram .activation1,
.dark .mermaid-diagram .activation2 {
  fill: #1e3a5f !important;
  stroke: #60a5fa !important;
}

.dark .mermaid-diagram .sequenceNumber {
  fill: #f3f4f6 !important;
}
</style>
