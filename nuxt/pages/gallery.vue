<template>
  <div class="gallery-page">
    <div class="container">
      <!-- 页面标题 -->
      <div class="d-flex align-items-center mb-4 pb-2 border-bottom pagetitle">
        <i class="bi bi-images" style="font-size: 28px;"></i>
        <h3 class="mb-0 ms-2">图片画廊</h3>
      </div>

      <!-- 加载状态 -->
      <LoadingSpinner v-if="loading" text="正在加载画廊..." :size="'large'" />

      <!-- 错误状态 -->
      <div v-else-if="error" class="alert alert-danger" role="alert">
        <i class="bi bi-exclamation-triangle me-2"></i>
        加载画廊失败: {{ error.message }}
        <button class="btn btn-sm btn-outline-danger ms-3" @click="fetchGallery">
          重试
        </button>
      </div>

      <!-- 画廊内容 -->
      <div v-else-if="galleryItems.length" class="gallery-content">
        <!-- 画廊统计 -->
        <div class="gallery-stats mb-4">
          <div class="alert alert-info">
            <i class="bi bi-images me-2"></i>
            共 {{ galleryItems.length }} 张图片
          </div>
        </div>

        <!-- 图片网格 -->
        <div class="gallery-grid">
          <div
            v-for="(item, index) in galleryItems"
            :key="item.id"
            class="gallery-item"
            @click="openLightbox(index)"
          >
            <div class="gallery-image-wrapper">
              <img
                :src="item.imageUrl"
                :alt="item.description || `图片 ${index + 1}`"
                class="gallery-image"
                loading="lazy"
                @error="handleImageError"
              />
              <div class="gallery-overlay">
                <div class="gallery-overlay-content">
                  <i class="bi bi-zoom-in"></i>
                  <p v-if="item.description" class="mb-0">{{ item.description }}</p>
                </div>
              </div>
            </div>
            <div v-if="item.description" class="gallery-item-caption">
              <small class="text-muted">{{ item.description }}</small>
            </div>
          </div>
        </div>

        <!-- 图片灯箱 -->
        <div v-if="lightboxOpen" class="lightbox" @click="closeLightbox">
          <div class="lightbox-content" @click.stop>
            <!-- 关闭按钮 -->
            <button class="lightbox-close" @click="closeLightbox">
              <i class="bi bi-x-lg"></i>
            </button>

            <!-- 图片导航 -->
            <button
              v-if="currentIndex > 0"
              class="lightbox-nav lightbox-prev"
              @click="prevImage"
            >
              <i class="bi bi-chevron-left"></i>
            </button>
            <button
              v-if="currentIndex < galleryItems.length - 1"
              class="lightbox-nav lightbox-next"
              @click="nextImage"
            >
              <i class="bi bi-chevron-right"></i>
            </button>

            <!-- 当前图片 -->
            <div class="lightbox-image-container">
              <img
                :src="currentImage?.imageUrl"
                :alt="currentImage?.description || `图片 ${currentIndex + 1}`"
                class="lightbox-image"
                @error="handleImageError"
              />
              <div v-if="currentImage?.description" class="lightbox-caption">
                {{ currentImage.description }}
              </div>
            </div>

            <!-- 图片计数器 -->
            <div class="lightbox-counter">
              {{ currentIndex + 1 }} / {{ galleryItems.length }}
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="alert alert-info text-center" role="alert">
        <i class="bi bi-image fs-1 d-block mb-3"></i>
        暂无图片
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGallery } from '~/composables/useGallery'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import '~/assets/css/components/Gallery.styles.css'

// 设置页面元数据
useHead({
  title: '图片画廊',
  meta: [
    {
      name: 'description',
      content: '浏览精美的图片画廊'
    }
  ]
})

// 响应式数据
const galleryItems = ref([])
const error = ref(null)
const loading = ref(false)
const lightboxOpen = ref(false)
const currentIndex = ref(0)

// API composable
const { getGalleries } = useGallery()

// 计算当前显示的图片
const currentImage = computed(() => {
  return galleryItems.value[currentIndex.value]
})

// 获取画廊数据
const fetchGallery = async () => {
  if (loading.value) return

  loading.value = true
  error.value = null

  try {
    console.log('Gallery: 开始获取画廊数据...')
    const data = await getGalleries()
    galleryItems.value = data || []
    console.log('Gallery: 获取画廊数据成功，数量:', galleryItems.value.length)
  } catch (e) {
    error.value = e
    console.error('Gallery: 获取画廊失败:', e)
  } finally {
    loading.value = false
  }
}

// 打开灯箱
const openLightbox = (index) => {
  currentIndex.value = index
  lightboxOpen.value = true

  // 禁止背景滚动
  document.body.style.overflow = 'hidden'
}

// 关闭灯箱
const closeLightbox = () => {
  lightboxOpen.value = false

  // 恢复背景滚动
  document.body.style.overflow = ''
}

// 上一张图片
const prevImage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

// 下一张图片
const nextImage = () => {
  if (currentIndex.value < galleryItems.value.length - 1) {
    currentIndex.value++
  }
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (!lightboxOpen.value) return

  switch (event.key) {
    case 'Escape':
      closeLightbox()
      break
    case 'ArrowLeft':
      prevImage()
      break
    case 'ArrowRight':
      nextImage()
      break
  }
}

// 组件挂载
onMounted(() => {
  fetchGallery()
  document.addEventListener('keydown', handleKeydown)
})

// 组件卸载
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  // 确保恢复滚动
  document.body.style.overflow = ''
})

// 页面离开时关闭灯箱
onBeforeRouteLeave(() => {
  closeLightbox()
})
</script>

<style scoped>
.gallery-page {
  min-height: 100vh;
  padding: 2rem 0;
}

.gallery-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 2rem;
}

.gallery-stats {
  text-align: center;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.gallery-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.gallery-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.gallery-image-wrapper {
  position: relative;
  padding-top: 75%; /* 4:3 宽高比 */
  overflow: hidden;
}

.gallery-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gallery-item:hover .gallery-overlay {
  opacity: 1;
}

.gallery-item:hover .gallery-image {
  transform: scale(1.1);
}

.gallery-overlay-content {
  text-align: center;
  color: white;
}

.gallery-overlay-content i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: block;
}

.gallery-item-caption {
  padding: 0.75rem;
  background: #f8f9fa;
  text-align: center;
}

/* 灯箱样式 */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: transform 0.3s ease;
}

.lightbox-close:hover {
  transform: scale(1.1);
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 1rem;
  border-radius: 50%;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.lightbox-nav:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-50%) scale(1.1);
}

.lightbox-prev {
  left: -60px;
}

.lightbox-next {
  right: -60px;
}

.lightbox-image-container {
  position: relative;
  max-width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightbox-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 4px;
}

.lightbox-caption {
  color: white;
  text-align: center;
  margin-top: 1rem;
  font-size: 1.1rem;
  max-width: 800px;
}

.lightbox-counter {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  background: rgba(0,0,0,0.5);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gallery-page {
    padding: 1rem 0;
  }

  .gallery-content {
    padding: 1rem;
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .lightbox-nav {
    font-size: 1.5rem;
    padding: 0.75rem;
  }

  .lightbox-prev {
    left: 1rem;
  }

  .lightbox-next {
    right: 1rem;
  }

  .lightbox-close {
    top: 1rem;
    right: 1rem;
  }

  .lightbox-caption {
    font-size: 1rem;
    padding: 0 1rem;
  }

  .lightbox-counter {
    bottom: 1rem;
  }
}

@media (max-width: 480px) {
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .lightbox-content {
    max-width: 95vw;
    max-height: 95vh;
  }
}
</style>