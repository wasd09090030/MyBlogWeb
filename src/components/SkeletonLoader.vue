<template>
  <div class="skeleton-loader">
    <div v-for="i in count" :key="i" class="skeleton-article-card">
      <!-- 图片区域骨架 -->
      <div class="skeleton-image"></div>
      
      <!-- 内容区域骨架 -->
      <div class="skeleton-content">
        <!-- 标题骨架 -->
        <div class="skeleton-title"></div>
        <div class="skeleton-title-short"></div>
        
        <!-- 元信息骨架 -->
        <div class="skeleton-meta">
          <div class="skeleton-date"></div>
          <div class="skeleton-category"></div>
        </div>
        
        <!-- 摘要骨架 -->
        <div class="skeleton-excerpt">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line-short"></div>
        </div>
        
        <!-- 按钮骨架 -->
        <div class="skeleton-button"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 3
  }
});
</script>

<style scoped>
.skeleton-loader {
  max-width: 100%;
  margin: 0 auto;
}

.skeleton-article-card {
  display: flex;
  background: var(--bs-body-bg, #ffffff);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  min-height: 300px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.skeleton-image {
  flex: 1;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  min-width: 280px;
}

.skeleton-content {
  flex: 1.5;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-title,
.skeleton-title-short,
.skeleton-line,
.skeleton-line-short,
.skeleton-date,
.skeleton-category,
.skeleton-button {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-title {
  height: 24px;
  width: 80%;
  margin-bottom: 0.5rem;
}

.skeleton-title-short {
  height: 24px;
  width: 60%;
}

.skeleton-meta {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

.skeleton-date {
  height: 16px;
  width: 120px;
}

.skeleton-category {
  height: 20px;
  width: 80px;
  border-radius: 10px;
}

.skeleton-excerpt {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-line {
  height: 16px;
  width: 100%;
}

.skeleton-line-short {
  height: 16px;
  width: 70%;
}

.skeleton-button {
  height: 36px;
  width: 120px;
  border-radius: 6px;
  margin-top: auto;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 暗色主题适配 */
[data-bs-theme="dark"] .skeleton-article-card {
  background: var(--bs-body-bg, #212529);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-bs-theme="dark"] .skeleton-image,
[data-bs-theme="dark"] .skeleton-title,
[data-bs-theme="dark"] .skeleton-title-short,
[data-bs-theme="dark"] .skeleton-line,
[data-bs-theme="dark"] .skeleton-line-short,
[data-bs-theme="dark"] .skeleton-date,
[data-bs-theme="dark"] .skeleton-category,
[data-bs-theme="dark"] .skeleton-button {
  background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
  background-size: 200% 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .skeleton-article-card {
    flex-direction: column;
  }
  
  .skeleton-image {
    min-width: auto;
    height: 200px;
  }
  
  .skeleton-content {
    padding: 1rem;
  }
}
</style>
