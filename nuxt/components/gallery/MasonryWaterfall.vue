<template>
  <section class="waterfall-section" ref="sectionRef">
    <!-- 标题区域 -->
    <Motion
      class="section-header"
      :initial="{ opacity: 0, y: 30 }"
      :in-view="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.6 }"
    >

    </Motion>
    
    <div class="waterfall-container" ref="containerRef">
      <!-- 多列瀑布流 -->
      <Motion
        v-for="(column, colIndex) in columns" 
        :key="colIndex" 
        class="waterfall-column"
        :initial="{ opacity: 0, y: 40 }"
        :in-view="{ opacity: 1, y: 0 }"
        :transition="{ delay: colIndex * 0.1, duration: 0.5, type: 'spring' }"
      >
        <Motion
          v-for="(item, itemIndex) in column"
          :key="`${colIndex}-${item.id}-${itemIndex}`"
          class="waterfall-item"
          :class="[`size-${item.sizeClass}`]"
          :initial="{ opacity: 0, scale: 0.8 }"
          :in-view="{ opacity: 1, scale: 1 }"
          :transition="{ delay: itemIndex * 0.05, duration: 0.4, type: 'spring' }"
          :hover="{ scale: 1.03, y: -5 }"
          :tap="{ scale: 0.98 }"
          @click="$emit('image-click', item)"
        >
          <div class="item-inner">
            <img
              :src="item.imageUrl"
              :alt="item.title || '画廊图片'"
              class="waterfall-image"
              loading="lazy"
            />
            <div class="item-overlay">
              <div class="overlay-content">
                <Icon name="arrows-angle-contract" size="lg" />
              </div>
            </div>
          </div>
        </Motion>
      </Motion>
    </div>

    <!-- 无限滚动触发器 -->
    <div ref="infiniteScrollTrigger" class="infinite-scroll-trigger">
      <Motion
        v-if="isLoadingMore"
        class="loading-indicator"
        :initial="{ opacity: 0, scale: 0.8 }"
        :animate="{ opacity: 1, scale: 1 }"
        :transition="{ duration: 0.3 }"
      >
        <div class="loading-spinner"></div>
        <span>加载更多图片...</span>
      </Motion>
      <Motion
        v-else-if="!hasMore && displayedCount > 0"
        class="end-message"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :transition="{ duration: 0.5 }"
      >
        <Icon name="check-circle" size="md" />
        <span>已加载全部 {{ displayedCount }} 张图片</span>
      </Motion>
    </div>
  </section>
</template>

<script setup>
import { Motion } from 'motion-v'

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
    default: 16  // 初始加载数量
  },
  loadMoreCount: {
    type: Number,
    default: 8   // 每次加载更多的数量
  }
})

const emit = defineEmits(['image-click', 'load-more'])

// DOM 引用
const containerRef = ref(null)
const sectionRef = ref(null)
const infiniteScrollTrigger = ref(null)

// 响应式列数
const actualColumnCount = ref(props.columnCount)

// 无限滚动状态
const displayedCount = ref(props.initialLoadCount)
const isLoadingMore = ref(false)
const hasMore = computed(() => displayedCount.value < props.images.length)

// 当前显示的图片
const displayedImages = computed(() => {
  return props.images.slice(0, displayedCount.value)
})

// 尺寸类别，用于创建不规则效果
const sizeClasses = ['small', 'medium', 'large', 'tall', 'wide']

// 为图片分配随机尺寸类别
const getRandomSizeClass = (index) => {
  // 使用索引来确保每次渲染结果一致
  const seed = index * 7 + 3
  return sizeClasses[seed % sizeClasses.length]
}

// 将图片分配到各列（瀑布流算法）
const columns = computed(() => {
  const cols = Array.from({ length: actualColumnCount.value }, () => [])
  
  if (displayedImages.value.length === 0) return cols
  
  // 跟踪每列的"高度"（用于平衡分配）
  const columnHeights = new Array(actualColumnCount.value).fill(0)
  
  // 尺寸类别对应的权重
  const sizeWeights = {
    small: 1,
    medium: 1.5,
    large: 2,
    tall: 2.5,
    wide: 1.3
  }
  
  displayedImages.value.forEach((image, index) => {
    // 找到最短的列
    const shortestColIndex = columnHeights.indexOf(Math.min(...columnHeights))
    
    // 分配尺寸类别
    const sizeClass = getRandomSizeClass(index)
    
    // 添加到该列
    cols[shortestColIndex].push({
      ...image,
      sizeClass
    })
    
    // 更新列高度
    columnHeights[shortestColIndex] += sizeWeights[sizeClass]
  })
  
  return cols
})

// 加载更多图片
const loadMore = async () => {
  if (isLoadingMore.value || !hasMore.value) return
  
  isLoadingMore.value = true
  
  // 模拟加载延迟，让用户看到加载动画
  await new Promise(resolve => setTimeout(resolve, 500))
  
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
      rootMargin: '200px', // 提前200px触发加载
      threshold: 0
    }
  )
  
  observer.observe(infiniteScrollTrigger.value)
}

// 响应式调整列数
const updateColumnCount = () => {
  const width = window.innerWidth
  if (width < 576) {
    actualColumnCount.value = 2
  } else if (width < 768) {
    actualColumnCount.value = 3
  } else if (width < 1200) {
    actualColumnCount.value = 4
  } else {
    actualColumnCount.value = props.columnCount
  }
}

// 初始化
const initSwiper = async () => {
  updateColumnCount()
  setupInfiniteScroll()
}

// 销毁
const destroySwiper = () => {
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
  initSwiper,
  destroySwiper,
  loadMore
})

// 监听窗口大小变化
onMounted(() => {
  updateColumnCount()
  window.addEventListener('resize', updateColumnCount)
  
  // 延迟设置无限滚动，确保DOM已渲染
  nextTick(() => {
    setupInfiniteScroll()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateColumnCount)
  destroySwiper()
})
</script>

<style scoped>
.waterfall-section {
  padding: 2rem;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.5) 100%);
  border-radius: 30px 30px 0 0;
  margin-top: -20px;
}

.section-header {
  text-align: center;
  margin-bottom: 2rem;
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
  display: flex;
  gap: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

.waterfall-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.waterfall-item {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transform-origin: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.4s ease;
}

.waterfall-item:hover {
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.25);
  z-index: 10;
}

/* 不同尺寸类别 */
.waterfall-item.size-small {
  aspect-ratio: 1 / 1;
}

.waterfall-item.size-medium {
  aspect-ratio: 4 / 3;
}

.waterfall-item.size-large {
  aspect-ratio: 3 / 4;
}

.waterfall-item.size-tall {
  aspect-ratio: 2 / 3;
}

.waterfall-item.size-wide {
  aspect-ratio: 16 / 9;
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

.waterfall-item:hover .waterfall-image {
  transform: scale(1.1);
  filter: brightness(0.85);
}

.item-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.7) 0%,
    rgba(118, 75, 162, 0.7) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.waterfall-item:hover .item-overlay {
  opacity: 1;
}

.overlay-content {
  text-align: center;
  color: white;
  transform: translateY(20px);
  transition: transform 0.3s ease;
}

.waterfall-item:hover .overlay-content {
  transform: translateY(0);
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

  .waterfall-column {
    gap: 0.75rem;
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

  .waterfall-column {
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
