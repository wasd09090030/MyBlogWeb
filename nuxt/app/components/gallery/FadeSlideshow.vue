<template>
  <section class="fade-section">
    <div class="fade-gallery" ref="containerRef">
      <div class="swiper-wrapper">
        <div
          v-for="(gallery, index) in images"
          :key="`loop-${gallery.id}-${index}`"
          class="swiper-slide fade-slide"
        >
          <div
            class="fade-item"
            @click="$emit('image-click', gallery)"
          >
            <img
              :src="gallery.imageUrl"
              alt="画廊图片"
              class="fade-image"
            />
            <div class="fade-overlay">
              <div class="fade-content">
                <!-- 可扩展的内容区域 -->
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
  }
})

const emit = defineEmits(['image-click'])

// DOM 引用
const containerRef = ref(null)

// Swiper 实例
const swiperInstance = ref(null)

// Swiper 模块
let Swiper, Autoplay, EffectFade

// 动态加载 Swiper
const loadSwiper = async () => {
  try {
    const swiperModule = await import('swiper')
    const modulesModule = await import('swiper/modules')

    Swiper = swiperModule.Swiper
    Autoplay = modulesModule.Autoplay
    EffectFade = modulesModule.EffectFade

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
    modules: [Autoplay, EffectFade],
    effect: 'fade',
    fadeEffect: {
      crossFade: true
    },
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    speed: 800,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
      waitForTransition: true,
    },
    allowTouchMove: true,
    watchSlidesProgress: true,
    observer: true,
    observeParents: true,
    on: {
      init: function() {
        this.el.classList.add('swiper-initialized')
      }
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
/* 淡入淡出幻灯片样式 */
.fade-section {
  position: relative;
  width: 100%;
  height: 95vh;
  margin-bottom: 2rem;
  margin-top: 50px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0;
  overflow: hidden;
}

.fade-gallery {
  height: 100%;
  width: 100%;
  margin: 0;
  opacity: 0;
  transition: opacity 0.5s ease-out;
}

.fade-gallery.swiper-initialized {
  opacity: 1;
}

.fade-slide {
  height: 100%;
  width: 100%;
  opacity: 0;
  transition: opacity 0.5s ease-out;
}

.swiper-initialized .fade-slide {
  opacity: 1;
}

.swiper-initialized .fade-slide:not(.swiper-slide-active) {
  opacity: 0;
}

.fade-item {
  position: relative;
  height: 100%;
  width: 100%;
  border-radius: 0;
  overflow: hidden;
  cursor: pointer;
}

.fade-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}

.fade-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, rgba(0,0,0,0.3), transparent 50%, rgba(0,0,0,0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fade-item:hover .fade-overlay {
  opacity: 1;
}

.fade-content {
  text-align: center;
  color: white;
  padding: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .fade-section {
    height: 62vh;
  }
}

/* 暗色主题 */
:global(.dark-theme) .fade-section {
  background: rgba(45, 55, 72, 0.3);
}
</style>
