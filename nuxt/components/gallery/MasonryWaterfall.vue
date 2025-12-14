<template>
  <section class="waterfall-section">
    <h2 class="section-title">
      <Icon name="grid-3x3-gap-fill" size="lg" />
      <span>瀑布流画廊</span>
    </h2>
    
    <div class="waterfall-container" ref="containerRef">
      <!-- 多列瀑布流 -->
      <div 
        v-for="(column, colIndex) in columns" 
        :key="colIndex" 
        class="waterfall-column"
        :style="{ animationDelay: `${colIndex * 0.1}s` }"
      >
        <div
          v-for="(item, itemIndex) in column"
          :key="`${colIndex}-${item.id}-${itemIndex}`"
          class="waterfall-item"
          :class="[`size-${item.sizeClass}`]"
          :style="{ animationDelay: `${(colIndex * column.length + itemIndex) * 0.05}s` }"
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
        </div>
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
  }
})

const emit = defineEmits(['image-click'])

// DOM 引用
const containerRef = ref(null)

// 响应式列数
const actualColumnCount = ref(props.columnCount)

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
  
  if (props.images.length === 0) return cols
  
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
  
  props.images.forEach((image, index) => {
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
  // 瀑布流不需要 Swiper，但保持接口一致
}

// 销毁
const destroySwiper = () => {
  // 瀑布流不需要 Swiper
}

// 暴露方法给父组件
defineExpose({
  initSwiper,
  destroySwiper
})

// 监听窗口大小变化
onMounted(() => {
  updateColumnCount()
  window.addEventListener('resize', updateColumnCount)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateColumnCount)
})
</script>

<style scoped>
.waterfall-section {
  padding: 2rem;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.5) 100%);
  border-radius: 30px 30px 0 0;
  margin-top: -20px;
}

.section-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.section-title i {
  color: #667eea;
  font-size: 1.3rem;
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
  animation: columnFadeIn 0.6s ease-out forwards;
  opacity: 0;
}

@keyframes columnFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.waterfall-item {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  animation: itemFadeIn 0.5s ease-out forwards;
  opacity: 0;
  transform-origin: center;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.4s ease;
}

@keyframes itemFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.waterfall-item:hover {
  transform: scale(1.03) translateY(-5px);
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

.overlay-content i {
  font-size: 2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* 响应式设计 */
@media (max-width: 768px) {
  .waterfall-section {
    padding: 1.5rem 1rem;
    border-radius: 20px 20px 0 0;
  }

  .section-title {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
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

  .overlay-content i {
    font-size: 1.5rem;
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
}

/* 暗色主题 */
:global(.dark-theme) .waterfall-section {
  background: linear-gradient(180deg, transparent 0%, rgba(45, 55, 72, 0.5) 100%);
}

:global(.dark-theme) .section-title {
  color: #e2e8f0;
}

:global(.dark-theme) .section-title i {
  color: #a78bfa;
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
</style>
