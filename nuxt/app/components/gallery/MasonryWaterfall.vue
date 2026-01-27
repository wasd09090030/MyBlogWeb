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
      <div
        v-for="(column, colIndex) in virtualColumns" 
        :key="colIndex" 
        class="waterfall-column"
        :style="{ paddingTop: `${column.paddingTop}px`, paddingBottom: `${column.paddingBottom}px` }"
      >
        <Motion
          v-for="(item, itemIndex) in column.items"
          :key="`${colIndex}-${item.id}-${itemIndex}`"
          class="waterfall-item"
          :class="[`size-${item.sizeClass}`]"
          :initial="{ opacity: 0, scale: 0.9 }"
          :in-view="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.3 }"
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
          </div>
        </Motion>
      </div>
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
import { useWindowScroll, useWindowSize } from '@vueuse/core'

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

// 响应式列数
const actualColumnCount = ref(props.columnCount)
const columnWidth = ref(300) // 默认列宽，会动态计算

// 窗口滚动和大小
const { y: scrollY } = useWindowScroll()
const { height: windowHeight } = useWindowSize()

// 是否已挂载（用于 SSR 兼容）
const isMounted = ref(false)

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

// 尺寸类别对应的宽高比 (width / height)
// 注意：CSS aspect-ratio 是 width / height
// 计算高度时：height = width / aspectRatio
const aspectRatios = {
  small: 1,      // 1:1
  medium: 4/3,   // 4:3
  large: 3/4,    // 3:4
  tall: 2/3,     // 2:3
  wide: 16/9     // 16:9
}

// 为图片分配随机尺寸类别
const getRandomSizeClass = (index) => {
  // 使用索引来确保每次渲染结果一致
  const seed = index * 7 + 3
  return sizeClasses[seed % sizeClasses.length]
}

// 计算所有图片的布局信息（分列 + 高度 + Y坐标）
const columnsLayout = computed(() => {
  const cols = Array.from({ length: actualColumnCount.value }, () => [])
  const colHeights = new Array(actualColumnCount.value).fill(0)
  const gap = 16 // 1rem = 16px
  
  if (displayedImages.value.length === 0) return cols

  displayedImages.value.forEach((image, index) => {
    // 找到最短的列
    const shortestColIndex = colHeights.indexOf(Math.min(...colHeights))
    
    // 分配尺寸类别
    const sizeClass = getRandomSizeClass(index)
    const ratio = aspectRatios[sizeClass] || 1
    
    // 计算图片高度
    const imgHeight = columnWidth.value / ratio
    
    // 当前Y坐标（相对于容器顶部）
    const y = colHeights[shortestColIndex]
    
    // 添加到该列
    cols[shortestColIndex].push({
      ...image,
      sizeClass,
      y, // 顶部位置
      height: imgHeight, // 图片高度
      totalHeight: imgHeight + gap // 占用总高度（含间距）
    })
    
    // 更新列高度
    colHeights[shortestColIndex] += (imgHeight + gap)
  })
  
  return cols
})

// 虚拟滚动：计算可视区域内的图片
const virtualColumns = computed(() => {
  // SSR 或未挂载时，显示所有图片（不做虚拟化）
  if (!isMounted.value || !containerRef.value) {
    return columnsLayout.value.map(colItems => ({
      items: colItems,
      paddingTop: 0,
      paddingBottom: 0
    }))
  }

  // 容器距离页面顶部的距离
  const containerTop = containerRef.value?.getBoundingClientRect().top + scrollY.value || 0
  // 缓冲区大小（像素）
  const buffer = 1000 
  
  // 可视区域范围（相对于容器）
  const viewTop = Math.max(0, scrollY.value - containerTop - buffer)
  const viewBottom = scrollY.value - containerTop + windowHeight.value + buffer

  return columnsLayout.value.map(colItems => {
    // 如果列为空，直接返回
    if (colItems.length === 0) {
      return { items: [], paddingTop: 0, paddingBottom: 0 }
    }

    // 找到可视范围内的第一个和最后一个索引
    let startIndex = 0
    let endIndex = colItems.length
    
    // 简单的线性查找（因为是有序的，可以用二分优化，但这里数量级不大，线性够用）
    for (let i = 0; i < colItems.length; i++) {
      const item = colItems[i]
      const itemBottom = item.y + item.totalHeight
      
      if (itemBottom < viewTop) {
        startIndex = i + 1
      }
      
      if (item.y > viewBottom) {
        endIndex = i
        break
      }
    }
    
    // 修正边界
    startIndex = Math.max(0, startIndex)
    endIndex = Math.min(colItems.length, endIndex)
    
    // 计算 padding
    let paddingTop = 0
    for (let i = 0; i < startIndex; i++) {
      paddingTop += colItems[i].totalHeight
    }
    
    let paddingBottom = 0
    for (let i = endIndex; i < colItems.length; i++) {
      paddingBottom += colItems[i].totalHeight
    }
    
    return {
      items: colItems.slice(startIndex, endIndex),
      paddingTop,
      paddingBottom
    }
  })
})

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

// 更新列宽
const updateColumnWidth = () => {
  if (containerRef.value) {
    // 获取第一列的宽度（如果有）或者估算
    const firstCol = containerRef.value.querySelector('.waterfall-column')
    if (firstCol) {
      columnWidth.value = firstCol.clientWidth
    } else {
      // 估算：(容器宽度 - 间隙总宽) / 列数
      const containerWidth = containerRef.value.clientWidth
      const gap = 16
      columnWidth.value = (containerWidth - (actualColumnCount.value - 1) * gap) / actualColumnCount.value
    }
  }
}

// 响应式调整列数
const updateColumnCount = () => {
  const width = window.innerWidth
  if (width < 576) {
    actualColumnCount.value = 2
  } else if (width < 992) {
    actualColumnCount.value = 3
  } else {
    // 大屏幕下保持3-4列，让图片更大
    actualColumnCount.value = width > 1600 ? 4 : 3
  }
  
  // 更新列宽
  nextTick(updateColumnWidth)
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
  isMounted.value = true
  updateColumnCount()
  window.addEventListener('resize', updateColumnCount)
  window.addEventListener('resize', updateColumnWidth)
  
  // 延迟设置无限滚动，确保DOM已渲染
  nextTick(() => {
    setupInfiniteScroll()
    updateColumnWidth()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateColumnCount)
  window.removeEventListener('resize', updateColumnWidth)
  destroySwiper()
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
  width: 100%;
  max-width: 100%; /* 移除最大宽度限制，让图片占据更多空间 */
  margin: 0 auto;
  padding: 0 1rem;
  box-sizing: border-box;
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
