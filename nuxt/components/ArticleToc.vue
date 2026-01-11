<template>
  <div v-if="headings.length > 0" class="h-full flex flex-col">
    <!-- 头部 -->
    <div 
      class="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      @click="toggleCollapse"
    >
      <h6 class="flex items-center gap-2 text-sm font-semibold m-0 text-gray-800 dark:text-gray-100">
        <Icon name="list-ul" size="sm" class="text-pink-500 dark:text-pink-400" />
        文章目录
      </h6>
      <Icon 
        :name="isCollapsed ? 'chevron-down' : 'chevron-up'" 
        size="sm"
        class="text-gray-500 dark:text-gray-400 transition-transform duration-200"
      />
    </div>

    <!-- 目录内容 -->
    <div 
      class="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
      :class="isCollapsed ? 'max-h-0' : 'max-h-full'"
    >
      <!-- 目录列表 -->
      <nav class="flex-1 py-3 overflow-y-auto custom-scrollbar">
        <ul class="space-y-0.5 px-2">
          <li 
            v-for="heading in headings" 
            :key="heading.id"
            :class="getTocItemClass(heading.level)"
          >
            <a 
              :href="`#${heading.id}`"
              class="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200"
              :class="[
                activeHeading === heading.id 
                  ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-300 font-medium shadow-sm dark:shadow-pink-500/10' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-pink-600 dark:hover:text-pink-400'
              ]"
              @click.prevent="scrollToHeading(heading.id)"
            >
              <span 
                class="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200"
                :class="activeHeading === heading.id ? 'bg-pink-500 dark:bg-pink-400 scale-125' : 'bg-gray-400 dark:bg-gray-500'"
              />
              <span class="truncate">{{ heading.text }}</span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- 阅读进度 -->
      <div class="px-3 py-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/30">
        <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-2">
          <span class="flex items-center gap-1">
            <Icon name="book" size="sm" class="text-gray-500 dark:text-gray-400" />
            阅读进度
          </span>
          <span class="font-semibold text-pink-600 dark:text-pink-400">{{ Math.round(progress) }}%</span>
        </div>
        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div 
            class="h-full bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-400 dark:to-rose-400 rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  headings: {
    type: Array,
    default: () => []
  }
})

const isCollapsed = ref(false)
const activeHeading = ref('')
const progress = ref(0)

// 切换折叠
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

// 获取目录项缩进类
function getTocItemClass(level) {
  const indentMap = {
    1: 'pl-0',
    2: 'pl-0',
    3: 'pl-4',
    4: 'pl-8',
    5: 'pl-12',
    6: 'pl-16'
  }
  return indentMap[level] || 'pl-0'
}

// 滚动到指定标题
function scrollToHeading(id) {
  const element = document.getElementById(id)
  if (!element) return
  
  const navbarHeight = 80
  const top = element.offsetTop - navbarHeight
  
  window.scrollTo({
    top,
    behavior: 'smooth'
  })
  
  // 高亮效果
  element.classList.add('heading-highlight')
  setTimeout(() => {
    element.classList.remove('heading-highlight')
  }, 2000)
}

// 监听滚动更新进度和活动标题
function handleScroll() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  // 计算进度
  const maxScroll = documentHeight - windowHeight
  progress.value = maxScroll > 0 ? Math.min((scrollTop / maxScroll) * 100, 100) : 0
}

// 使用 IntersectionObserver 检测活动标题
let observer = null

function setupObserver() {
  if (observer) observer.disconnect()
  
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          activeHeading.value = entry.target.id
        }
      })
    },
    {
      rootMargin: '-80px 0px -80% 0px',
      threshold: 0
    }
  )
  
  props.headings.forEach(heading => {
    const el = document.getElementById(heading.id)
    if (el) observer.observe(el)
  })
}

// 监听 headings 变化
watch(() => props.headings, (newHeadings) => {
  if (newHeadings.length > 0) {
    nextTick(() => {
      setTimeout(setupObserver, 100)
    })
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (observer) observer.disconnect()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 暗色模式滚动条 - 使用 :global 确保匹配根元素的 dark 类 */
:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4b5563;
}

:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>

<style>
/* 标题高亮动画 - 全局样式 */
.heading-highlight {
  animation: highlight-flash 2s ease-out;
}

@keyframes highlight-flash {
  0% {
    background-color: rgb(236 72 153 / 0.2);
    border-radius: 0.25rem;
  }
  100% {
    background-color: transparent;
  }
}
</style>
