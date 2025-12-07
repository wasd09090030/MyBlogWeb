<template>
  <section class="gallery-section">
    <div class="accordion-container">
      <div class="accordion-gallery" ref="containerRef">
        <div class="swiper-wrapper">
          <div
            v-for="(gallery, index) in images"
            :key="`accordion-${gallery.id}-${index}`"
            class="swiper-slide accordion-slide"
            :class="{ 'accordion-expanded': index === expandedIndex }"
          >
            <div
              class="accordion-item"
              @click="toggleAccordion(index)"
              @dblclick="$emit('image-click', gallery)"
            >
              <img
                :src="gallery.imageUrl"
                alt="画廊图片"
                class="accordion-image"
              />
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
  }
})

const emit = defineEmits(['image-click'])

// DOM 引用
const containerRef = ref(null)

// Swiper 实例
const swiperInstance = ref(null)

// 展开状态
const expandedIndex = ref(0)

// Swiper 模块
let Swiper, Navigation, Pagination

// 手风琴展开控制
const toggleAccordion = (index) => {
  if (expandedIndex.value === index) {
    expandedIndex.value = 0
  } else {
    expandedIndex.value = index
  }
}

// 动态加载 Swiper
const loadSwiper = async () => {
  try {
    const swiperModule = await import('swiper')
    const modulesModule = await import('swiper/modules')

    Swiper = swiperModule.Swiper
    Navigation = modulesModule.Navigation
    Pagination = modulesModule.Pagination

    return true
  } catch (err) {
    console.error('Failed to load Swiper:', err)
    return false
  }
}

// 初始化 Swiper
const initSwiper = async () => {
  if (!containerRef.value) return

  const loaded = await loadSwiper()
  if (!loaded) return

  await nextTick()

  swiperInstance.value = new Swiper(containerRef.value, {
    modules: [Navigation, Pagination],
    slidesPerView: 5,
    spaceBetween: 0,
    loop: false,
    grabCursor: true,
    breakpoints: {
      320: { slidesPerView: 2 },
      768: { slidesPerView: 3 },
      1024: { slidesPerView: 4 },
      1200: { slidesPerView: 5 }
    }
  })
}

// 销毁 Swiper
const destroySwiper = () => {
  if (swiperInstance.value) {
    swiperInstance.value.destroy(true, true)
    swiperInstance.value = null
  }
}

// 暴露方法给父组件
defineExpose({
  initSwiper,
  destroySwiper
})

onUnmounted(() => {
  destroySwiper()
})
</script>

<style scoped>
.gallery-section {
  margin-bottom: 4rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 手风琴容器样式 */
.accordion-container {
  display: flex;
  gap: 2rem;
  align-items: center;
  height: 80vh;
}

/* 手风琴样式 */
.accordion-gallery {
  height: 80vh;
  overflow: hidden;
  margin: 0;
  flex: 1;
}

.accordion-slide {
  width: 15% !important;
  transition: all 0.5s ease;
  cursor: pointer;
}

/* 只有点击后才展开 */
.accordion-slide.accordion-expanded {
  width: 40% !important;
}

.accordion-item {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 15px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 鼠标悬停时的视觉反馈 */
.accordion-item:hover {
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  transform: translateY(-2px);
}

/* 已展开的项鼠标悬停时的效果 */
.accordion-slide.accordion-expanded .accordion-item:hover {
  transform: translateY(0);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
}

.accordion-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gallery-section {
    margin-bottom: 2rem;
    padding: 1rem;
    border-radius: 15px;
  }

  .accordion-container {
    flex-direction: column;
    height: auto;
    gap: 1rem;
  }

  .accordion-gallery {
    height: 30vh;
  }
}

/* 暗色主题 */
:global(.dark-theme) .gallery-section {
  background: rgba(45, 55, 72, 0.8);
  color: #ffffff;
}
</style>
