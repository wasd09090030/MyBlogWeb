<template>
  <a 
    :href="url" 
    target="_blank" 
    rel="noopener noreferrer"
    class="link-card-mdc block my-6 no-underline"
  >
    <div class="flex items-center gap-4 px-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer group">
      <!-- 图标 -->
      <div class="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
        <Icon :name="icon" size="xl" class="text-blue-600 dark:text-blue-400" />
      </div>
      
      <!-- 文本 -->
      <div class="flex-1 min-w-0">
        <p class="text-base font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {{ text }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          点击访问
        </p>
      </div>
      
      <!-- 外部链接图标 -->
      <div class="flex-shrink-0">
        <Icon name="arrow-up-right" size="md" class="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
    </div>
  </a>
</template>

<script setup>
/**
 * LinkCard 链接分享组件 - MDC 语法
 * 
 * 在 Markdown 中使用：
 * ::link-card{url="https://example.com" text="查看示例网站" icon="download"}
 * ::
 * 
 * Props:
 * - url: 链接地址（必需）
 * - text: 显示文本（必需）
 * - icon: 图标名称（可选，默认 download）
 */

const props = defineProps({
  url: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'download'
  }
})
</script>

<style scoped>
.link-card-mdc:hover {
  text-decoration: none;
}
</style>
