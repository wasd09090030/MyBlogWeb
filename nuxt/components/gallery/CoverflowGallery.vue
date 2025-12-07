<template>
  <section class="coverflow-section mb-5">
    <div class="coverflow-gallery" ref="containerRef">
      <div class="swiper-wrapper">
        <div
          v-for="(gallery, index) in images"
          :key="`coverflow-${gallery.id}-${index}`"
          class="swiper-slide coverflow-slide"
        >
          <div
            class="coverflow-item"
            @click="$emit('image-click', gallery)"
          >
            <img
              :src="gallery.imageUrl"
              alt="画廊图片"
              class="coverflow-image"
            />
            <div class="coverflow-info">
              <!-- 可扩展的信息区域 -->
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
let Swiper, EffectCoverflow

// 动态加载 Swiper
const loadSwiper = async () => {
  try {
    const swiperModule = await import('swiper')
    const modulesModule = await import('swiper/modules')

    Swiper = swiperModule.Swiper
    EffectCoverflow = modulesModule.EffectCoverflow

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
    modules: [EffectCoverflow],
    effect: 'coverflow',
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 3,
    loop: true,
    speed: 600,
    coverflowEffect: {
      rotate: 30,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: true,
    },
    breakpoints: {
      320: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 2,
      },
      1024: {
        slidesPerView: 3,
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
/* 3D覆盖流专用容器样式 */
.coverflow-section {
  margin-bottom: 4rem;
  padding: 2rem;
  background: transparent;
}

/* 3D 覆盖流样式 */
.coverflow-gallery {
  height: 75vh;
  padding: 50px 0;
  margin: 0 auto;
  max-width: 100%;
  position: relative;
}

.coverflow-slide {
  background: transparent;
}

.coverflow-item {
  position: relative;
  width: 100%;
  height: calc(75vh - 100px);
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
}

.coverflow-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 15px;
  aspect-ratio: 2/3;
}

.coverflow-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  color: white;
  padding: 1rem;
  text-align: center;
  border-radius: 0 0 15px 15px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .coverflow-section {
    margin-bottom: 2rem;
    padding: 1rem;
  }

  .coverflow-gallery {
    padding: 20px 0;
    height: 45vh;
  }

  .coverflow-item {
    height: calc(45vh - 40px);
  }
}
</style>
