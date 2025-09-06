<template>
  <div class="loading-container" :class="{ 'full-page': fullPage }">
    <div class="loading-spinner">
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
    </div>
    <p class="loading-text" v-if="text">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  // 是否全页面加载
  fullPage: {
    type: Boolean,
    default: false
  },
  // 加载文本
  text: {
    type: String,
    default: '加载中...'
  },
  // 自定义大小
  size: {
    type: String,
    default: 'medium', // small, medium, large
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
});
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 200px;
}

.loading-container.full-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 9999;
  min-height: 100vh;
}

.loading-spinner {
  display: inline-block;
  position: relative;
  width: 64px;
  height: 64px;
}

.spinner-ring {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 51px;
  height: 51px;
  margin: 6px;
  border: 6px solid transparent;
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: var(--bs-primary, #0d6efd) transparent transparent transparent;
}

.spinner-ring:nth-child(1) {
  animation-delay: -0.45s;
}

.spinner-ring:nth-child(2) {
  animation-delay: -0.3s;
}

.spinner-ring:nth-child(3) {
  animation-delay: -0.15s;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 1rem;
  color: var(--bs-secondary, #6c757d);
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* 大小变体 */
.loading-container.small .loading-spinner {
  width: 32px;
  height: 32px;
}

.loading-container.small .spinner-ring {
  width: 26px;
  height: 26px;
  margin: 3px;
  border-width: 3px;
}

.loading-container.small .loading-text {
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.loading-container.large .loading-spinner {
  width: 96px;
  height: 96px;
}

.loading-container.large .spinner-ring {
  width: 77px;
  height: 77px;
  margin: 9px;
  border-width: 8px;
}

.loading-container.large .loading-text {
  font-size: 1.1rem;
  margin-top: 1.5rem;
}

/* 暗色主题适配 */
[data-bs-theme="dark"] .loading-container.full-page {
  background: rgba(26, 26, 26, 0.95);
}

[data-bs-theme="dark"] .spinner-ring {
  border-color: var(--bs-primary, #0d6efd) transparent transparent transparent;
}

[data-bs-theme="dark"] .loading-text {
  color: var(--bs-light, #f8f9fa);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-container {
    padding: 1.5rem;
    min-height: 150px;
  }
  
  .loading-text {
    font-size: 0.9rem;
  }
}

/* 骨架屏效果（可选） */
.skeleton-items {
  width: 100%;
  max-width: 800px;
}

.skeleton-item {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
  height: 120px;
  margin-bottom: 1rem;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

[data-bs-theme="dark"] .skeleton-item {
  background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
  background-size: 200% 100%;
}
</style>
