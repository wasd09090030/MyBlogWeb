<template>
  <div class="code-playground-mdc my-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
    <!-- 头部 -->
    <div class="playground-header flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <Icon name="code-slash" size="md" class="text-gray-600 dark:text-gray-400" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ title }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="editable"
          @click="toggleEdit"
          class="px-3 py-1 text-xs font-medium rounded transition-colors"
          :class="isEditing ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
        >
          {{ isEditing ? '预览' : '编辑' }}
        </button>
        <button
          v-if="runnable"
          @click="runCode"
          class="px-3 py-1 text-xs font-medium bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
        >
          ▶ 运行
        </button>
        <button
          @click="copyCode"
          class="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
        >
          复制
        </button>
      </div>
    </div>
    
    <!-- 代码区域 -->
    <div class="playground-body">
      <div v-if="isEditing" class="p-4">
        <textarea
          v-model="editableCode"
          class="w-full font-mono text-sm bg-transparent border-0 outline-none resize-none"
          :rows="Math.max(5, editableCode.split('\n').length)"
          spellcheck="false"
        />
      </div>
      <div v-else class="p-4 bg-gray-900">
        <pre class="text-sm overflow-x-auto"><code :class="`language-${lang}`">{{ displayCode }}</code></pre>
      </div>
      
      <!-- 输出区域 -->
      <div v-if="output" class="output-panel border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">输出：</div>
        <pre class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{{ output }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * CodePlayground 可交互代码演示组件 - MDC 语法
 * 
 * 在 Markdown 中使用：
 * ::code-playground{lang="javascript" title="JavaScript 示例" editable runnable}
 * console.log('Hello World!')
 * const sum = (a, b) => a + b
 * console.log(sum(2, 3))
 * ::
 */

const props = defineProps({
  lang: {
    type: String,
    default: 'javascript'
  },
  title: {
    type: String,
    default: 'Code Playground'
  },
  editable: {
    type: Boolean,
    default: true
  },
  runnable: {
    type: Boolean,
    default: false
  }
})

const slots = useSlots()
const isEditing = ref(false)
const output = ref('')

// 从 slot 获取初始代码
const initialCode = computed(() => {
  const content = slots.default?.()
  if (!content) return ''
  return content.map(node => {
    if (typeof node.children === 'string') return node.children
    if (Array.isArray(node.children)) {
      return node.children.map(child => 
        typeof child === 'string' ? child : child.children || ''
      ).join('')
    }
    return ''
  }).join('').trim()
})

const editableCode = ref(initialCode.value)
const displayCode = computed(() => isEditing.value ? editableCode.value : initialCode.value)

watch(initialCode, (newCode) => {
  if (!isEditing.value) {
    editableCode.value = newCode
  }
})

const toggleEdit = () => {
  isEditing.value = !isEditing.value
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(displayCode.value)
    // 可以添加提示
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const runCode = () => {
  output.value = ''
  try {
    // 捕获 console.log
    const logs = []
    const originalLog = console.log
    console.log = (...args) => {
      logs.push(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '))
    }
    
    // 执行代码
    const result = eval(editableCode.value)
    
    // 恢复 console.log
    console.log = originalLog
    
    // 显示输出
    if (logs.length > 0) {
      output.value = logs.join('\n')
    } else if (result !== undefined) {
      output.value = String(result)
    } else {
      output.value = '(无输出)'
    }
  } catch (err) {
    output.value = `错误: ${err.message}`
  }
}
</script>

<style scoped>
pre code {
  color: #e5e7eb;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

textarea {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.playground-body {
  max-height: 500px;
  overflow-y: auto;
}
</style>
