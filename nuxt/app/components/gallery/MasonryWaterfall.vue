<template>
  <section class="waterfall-section" ref="sectionRef">
    <!-- 标题区域 -->
    <div class="section-header fade-up"></div>
    
    <div class="waterfall-container" ref="containerRef" :style="gridStyle">
      <div
        v-for="(item, index) in layoutItems"
        :key="`${item.id ?? 'img'}-${index}`"
        class="waterfall-item fade-scale"
        :style="item.style"
        @click="$emit('image-click', item)"
      >
        <div class="item-inner">
          <img
            :src="item.imageUrl"
            :alt="item.title || '画廊图片'"
            class="waterfall-image"
            loading="lazy"
          />
        </div>
      </div>
    </div>

    <!-- 无限滚动触发器 -->
    <div ref="infiniteScrollTrigger" class="infinite-scroll-trigger">
      <div v-if="isLoadingMore" class="loading-indicator fade-in">
        <div class="loading-spinner"></div>
        <span>加载更多图片...</span>
      </div>
      <div v-else-if="!hasMore && displayedCount > 0" class="end-message fade-in">
        <Icon name="check-circle" size="md" />
        <span>已加载全部 {{ displayedCount }} 张图片</span>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  columnCount: {
    type: Number,
    default: 4
  },
  // 无限滚动相关配置
  initialLoadCount: {
    type: Number,
    default: 20  // 初始加载数量
  },
  loadMoreCount: {
    type: Number,
    default: 10   // 每次加载更多的数量
  }
})

const emit = defineEmits(['image-click', 'load-more'])

// DOM 引用
const containerRef = ref(null)
const sectionRef = ref(null)
const infiniteScrollTrigger = ref(null)

// 布局参数
const gridGap = 16
const gridRowHeight = 8
const minWidthPercent = 15
const maxWidthPercent = 45

const gridColumns = ref(Math.max(8, props.columnCount * 4))
const containerWidth = ref(0)

// 是否已挂载（用于 SSR 兼容）
const isMounted = ref(false)

// 无限滚动状态
const displayedCount = ref(props.initialLoadCount)
const isLoadingMore = ref(false)
const hasMore = computed(() => displayedCount.value < props.images.length)

// 稳定随机（用于打乱和宽度分配）
const hashString = (value) => {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash >>> 0
}

const randomFromHash = (value) => {
  const hash = hashString(value)
  return (hash % 10000) / 10000
}

const getBaseKey = (image, index) => {
  if (image?.id != null) return `${image.id}`
  if (image?.imageUrl) return image.imageUrl
  return `${index}`
}

const shuffledImages = computed(() => {
  return [...props.images]
    .map((image, index) => ({
      image,
      order: randomFromHash(`order:${getBaseKey(image, index)}`)
    }))
    .sort((a, b) => a.order - b.order)
    .map(entry => entry.image)
})

// 当前显示的图片
const displayedImages = computed(() => {
  return shuffledImages.value.slice(0, displayedCount.value)
})

const getImageRatio = (image) => {
  const width = Number(image?.imageWidth || image?.width || 0)
  const height = Number(image?.imageHeight || image?.height || 0)
  if (width > 0 && height > 0) {
    return Math.max(0.2, Math.min(5, width / height))
  }
  return 1
}

const getAspectRatioStyle = (image) => {
  const width = Number(image?.imageWidth || image?.width || 0)
  const height = Number(image?.imageHeight || image?.height || 0)
  if (width > 0 && height > 0) {
    return `${width} / ${height}`
  }
  return '1 / 1'
}

const getColumnSpan = (image, index) => {
  const baseKey = getBaseKey(image, index)
  const rand = randomFromHash(`width:${baseKey}`)
  const widthPercent = minWidthPercent + (maxWidthPercent - minWidthPercent) * rand
  const span = Math.round((gridColumns.value * widthPercent) / 100)
  return Math.max(1, Math.min(gridColumns.value, span))
}

const layoutItems = computed(() => {
  const cols = Math.max(1, gridColumns.value)
  const width = containerWidth.value
  const gap = gridGap
  const rowHeight = gridRowHeight
  const safeWidth = width > 0 ? width : (isMounted.value ? window.innerWidth : 0)
  const colWidth = safeWidth > 0
    ? Math.max(1, (safeWidth - (cols - 1) * gap) / cols)
    : 1

  return displayedImages.value.map((image, index) => {
    const ratio = getImageRatio(image)
    const colSpan = getColumnSpan(image, index)
    const itemWidth = colWidth * colSpan + gap * (colSpan - 1)
    const itemHeight = ratio > 0 ? itemWidth / ratio : itemWidth
    const rowSpan = Math.max(1, Math.ceil((itemHeight + gap) / (rowHeight + gap)))

    return {
      ...image,
      style: {
        gridColumn: `span ${colSpan}`,
        gridRowEnd: `span ${rowSpan}`,
        aspectRatio: getAspectRatioStyle(image)
      }
    }
  })
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gridColumns.value}, minmax(0, 1fr))`,
  gap: `${gridGap}px`,
  '--grid-row-height': `${gridRowHeight}px`
}))

// 加载更多图片
const loadMore = async () => {
  if (isLoadingMore.value || !hasMore.value) return
  
  isLoadingMore.value = true
  
  // 模拟加载延迟，让用户看到加载动画
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 增加显示数量
  displayedCount.value = Math.min(
    displayedCount.value + props.loadMoreCount,
    props.images.length
  )
  
  isLoadingMore.value = false
  emit('load-more', displayedCount.value)
}

// Intersection Observer 用于无限滚动
let observer = null

const setupInfiniteScroll = () => {
  if (!infiniteScrollTrigger.value) return
  
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore.value && !isLoadingMore.value) {
          loadMore()
        }
      })
    },
    {
      root: null,
      rootMargin: '400px', // 提前触发加载
      threshold: 0
    }
  )
  
  observer.observe(infiniteScrollTrigger.value)
}

const updateContainerWidth = () => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
  }
}

// 响应式调整网格列数
const updateGridColumns = () => {
  const width = window.innerWidth
  let columns = 16
  if (width < 576) {
    columns = 8
  } else if (width < 992) {
    columns = 12
  } else if (width < 1400) {
    columns = 16
  } else {
    columns = 20
  }

  const baseColumns = Math.max(8, props.columnCount * 4)
  gridColumns.value = Math.max(baseColumns, columns)
  nextTick(updateContainerWidth)
}

// 初始化
const initLayout = async () => {
  updateGridColumns()
  setupInfiniteScroll()
}

// 销毁
const destroyLayout = () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

// 重置显示数量（当图片数据变化时）
watch(() => props.images, () => {
  displayedCount.value = Math.min(props.initialLoadCount, props.images.length)
}, { deep: true })

// 暴露方法给父组件
defineExpose({
  initLayout,
  destroyLayout,
  loadMore
})

// 监听窗口大小变化
onMounted(() => {
  isMounted.value = true
  updateGridColumns()
  window.addEventListener('resize', updateGridColumns)
  window.addEventListener('resize', updateContainerWidth)
  
  // 延迟设置无限滚动，确保DOM已渲染
  nextTick(() => {
    setupInfiniteScroll()
    updateContainerWidth()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateGridColumns)
  window.removeEventListener('resize', updateContainerWidth)
  destroyLayout()
})
</script>

<style scoped>
.waterfall-section {
  padding: 2rem 1rem;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.5) 100%);
  border-radius: 30px 30px 0 0;
  margin-top: -20px;
  width: 100%;
}

.section-header {
  text-align: center;
  margin-bottom: 2rem;
}

.fade-up {
  animation: fade-up 0.5s ease both;
}

.fade-scale {
  animation: fade-scale 0.4s ease both;
}

.fade-in {
  animation: fade-in 0.4s ease both;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-scale {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .fade-up,
  .fade-scale,
  .fade-in {
    animation: none;
  }
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.title-icon {
  color: #667eea;
}

.section-subtitle {
  font-size: 0.95rem;
  color: #718096;
  margin: 0;
}

.waterfall-container {
  display: grid;
  grid-auto-flow: dense;
  grid-auto-rows: var(--grid-row-height, 8px);
  gap: 1rem;
  width: 100%;
  max-width: 100%; /* 移除最大宽度限制，让图片占据更多空间 */
  margin: 0 auto;
  padding: 0 1rem;
  box-sizing: border-box;
}

.waterfall-item {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transform-origin: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.4s ease, transform 0.2s ease;
}

.waterfall-item:active {
  transform: scale(0.98);
}

.item-inner {
  position: relative;
  width: 100%;
  height: 100%;
}

.waterfall-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1),
              filter 0.4s ease;
}

/* 无限滚动触发器样式 */
.infinite-scroll-trigger {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  min-height: 80px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #667eea;
  font-size: 0.95rem;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.end-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #48bb78;
  font-size: 0.9rem;
  padding: 0.75rem 1.5rem;
  background: rgba(72, 187, 120, 0.1);
  border-radius: 25px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .waterfall-section {
    padding: 1.5rem 1rem;
    border-radius: 20px 20px 0 0;
  }

  .section-title {
    font-size: 1.2rem;
  }

  .section-subtitle {
    font-size: 0.85rem;
  }

  .waterfall-container {
    gap: 0.75rem;
    padding: 0;
  }

  .waterfall-item {
    border-radius: 12px;
  }
}

@media (max-width: 576px) {
  .waterfall-section {
    padding: 1rem 0.5rem;
  }

  .waterfall-container {
    gap: 0.5rem;
  }

  .waterfall-item {
    border-radius: 10px;
  }

  .infinite-scroll-trigger {
    padding: 1.5rem;
  }
}

/* 暗色主题 */
:global(.dark-theme) .waterfall-section {
  background: linear-gradient(180deg, transparent 0%, rgba(45, 55, 72, 0.5) 100%);
}

:global(.dark-theme) .section-title {
  color: #e2e8f0;
}

:global(.dark-theme) .title-icon {
  color: #a78bfa;
}

:global(.dark-theme) .section-subtitle {
  color: #a0aec0;
}

:global(.dark-theme) .waterfall-item {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

:global(.dark-theme) .waterfall-item:hover {
  box-shadow: 0 20px 40px rgba(167, 139, 250, 0.25);
}

:global(.dark-theme) .item-overlay {
  background: linear-gradient(
    135deg,
    rgba(167, 139, 250, 0.7) 0%,
    rgba(139, 92, 246, 0.7) 100%
  );
}

:global(.dark-theme) .loading-indicator {
  color: #a78bfa;
}

:global(.dark-theme) .loading-spinner {
  border-color: rgba(167, 139, 250, 0.2);
  border-top-color: #a78bfa;
}

:global(.dark-theme) .end-message {
  color: #68d391;
  background: rgba(104, 211, 145, 0.1);
}
</style>
