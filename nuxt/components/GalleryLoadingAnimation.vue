<template>
  <div class="initial-loading-overlay">
    <div class="loading-container">
      <div class="loading-animation">
        <div class="loading-circle">
          <div class="circle-inner">
            <Icon name="images" size="2xl" />
          </div>
        </div>
        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
          </div>
          <div class="progress-text">
            正在加载画廊 {{ Math.round(loadingProgress) }}%
          </div>
        </div>
      </div>

      <!-- 预览图片展示 -->
      <div class="preview-images" v-if="previewImages.length > 0">
        <div
          v-for="(img, index) in previewImages.slice(0, 3)"
          :key="index"
          class="preview-item"
          :style="{ animationDelay: index * 0.2 + 's' }"
        >
          <img :src="img.imageUrl" :alt="`预览图片${index + 1}`" />
        </div>
      </div>

      <div class="loading-tip">
        <p>正在为您准备精美的图片画廊...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loadingProgress: {
    type: Number,
    default: 0
  },
  previewImages: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
/* 初始加载动画样式 */
.initial-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #f188d4, #d7d5d6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  overflow: hidden;
  /* 添加退出动画 */
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}

.initial-loading-overlay.fade-out {
  opacity: 0;
  transform: scale(1.02);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  text-align: center;
  max-width: 500px;
  padding: 2rem;
}

.loading-animation {
  margin-bottom: 2rem;
}

.loading-circle {
  width: 120px;
  height: 120px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  position: relative;
  animation: rotateCircle 2s linear infinite;
}

.loading-circle::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 4px solid transparent;
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.circle-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  backdrop-filter: blur(10px);
}

.circle-inner i {
  font-size: 2.5rem;
  color: white;
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-progress {
  width: 300px;
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffffff, #f093fb);
  border-radius: 3px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shimmer 1.5s infinite;
}

.progress-text {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.preview-images {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
  justify-content: center;
}

.preview-item {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.3);
  animation: previewFloat 2s ease-in-out infinite;
  opacity: 0;
  animation: previewFadeIn 0.6s ease-out forwards;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loading-tip {
  margin-top: 1rem;
}

.loading-tip p {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  animation: textPulse 2s ease-in-out infinite;
}

/* 动画效果 */
@keyframes rotateCircle {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes previewFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes previewFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes textPulse {
  0%, 100% {
    opacity: 0.9;
  }
  50% {
    opacity: 0.6;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .loading-container {
    padding: 1rem;
    max-width: 90vw;
  }

  .loading-circle {
    width: 100px;
    height: 100px;
  }

  .circle-inner {
    width: 70px;
    height: 70px;
  }

  .circle-inner i {
    font-size: 2rem;
  }

  .loading-progress {
    width: 250px;
  }

  .progress-text {
    font-size: 1rem;
  }

  .preview-images {
    gap: 0.5rem;
  }

  .preview-item {
    width: 60px;
    height: 60px;
  }

  .loading-tip p {
    font-size: 0.9rem;
  }
}

/* 暗色主题下的初始加载动画 */
:global(.dark-theme) .initial-loading-overlay {
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
}
</style>
