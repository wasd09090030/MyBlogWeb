<template>
  <div class="code-playground-mdc my-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
    <!-- 隐藏的原始内容容器 -->
    <div ref="slotContainer" style="display: none;">
      <slot />
    </div>
    
    <!-- 头部 -->
    <div class="playground-header flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <Icon name="code-slash" size="md" class="text-gray-600 dark:text-gray-400" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ title }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="runnable"
          @click="runCode"
          class="px-3 py-1 text-xs font-medium bg-green-500 hover:bg-green-600 text-white rounded transition-colors flex items-center gap-1"
        >
          <Icon name="arrow-path" size="sm" />
          运行
        </button>
        <button
          @click="copyCode"
          class="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors flex items-center gap-1"
        >
          <Icon name="copy" size="sm" />
          复制
        </button>
      </div>
    </div>
    
    <!-- 代码区域 -->
    <div class="playground-body">
      <div class="p-4 bg-gray-900 dark:bg-gray-950">
        <pre class="text-sm overflow-x-auto"><code :class="`language-${lang}`" class="text-gray-100">{{ displayCode }}</code></pre>
      </div>
      
      <!-- 输出区域 -->
      <div v-if="output" class="output-panel border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center gap-2 mb-2">
          <Icon name="arrow-right" size="sm" class="text-gray-500 dark:text-gray-400" />
          <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">输出结果</span>
        </div>
        <pre class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-white dark:bg-gray-900 p-3 rounded border">{{ output }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * CodePlayground 代码演示组件 - MDC 语法
 * 
 * 在 Markdown 中使用：
 * ::code-playground{lang="javascript" title="JavaScript 示例" runnable}
 * console.log('Hello World!')
 * const sum = (a, b) => a + b
 * console.log(sum(2, 3))
 * ::
 * 
 * 只读模式（仅复制）：
 * ::code-playground{lang="python" title="Python 示例"}
 * def hello():
 *     print("Hello World")
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
  runnable: {
    type: Boolean,
    default: true
  }
})

const slotContainer = ref(null)
const output = ref('')
const displayCode = ref('')

// 在组件挂载后从 DOM 读取代码内容
onMounted(() => {
  if (slotContainer.value) {
    displayCode.value = slotContainer.value.textContent?.trim() || ''
  }
})

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(displayCode.value)
    // TODO: 可以添加复制成功提示
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const runCode = () => {
  output.value = ''
  
  // 只支持 JavaScript 运行
  if (props.lang !== 'javascript' && props.lang !== 'js') {
    output.value = `错误: 只支持运行 JavaScript 代码`
    return
  }
  
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
    const result = eval(displayCode.value)
    
    // 恢复 console.log
    console.log = originalLog
    
    // 显示输出
    if (logs.length > 0) {
      output.value = logs.join('\n')
    } else if (result !== undefined) {
      output.value = String(result)
    } else {
      output.value = '✓ 代码执行成功（无输出）'
    }
  } catch (err) {
    output.value = `❌ 错误: ${err.message}\n\n${err.stack || ''}`
  }
}
</script>

<style scoped>
.code-playground-mdc pre {
  margin: 0;
}

.code-playground-mdc code {
  color: #e5e7eb;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  display: block;
}

.playground-body {
  max-height: 600px;
  overflow-y: auto;
}

/* 确保输出文字可见 */
.output-panel pre {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.5;
}

/* 滚动条美化 */
.playground-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.playground-body::-webkit-scrollbar-track {
  background: rgb(31 41 55);
}

.playground-body::-webkit-scrollbar-thumb {
  background: rgb(75 85 99);
  border-radius: 4px;
}

.playground-body::-webkit-scrollbar-thumb:hover {
  background: rgb(107 114 128);
}
</style>
