<template>
  <div 
    ref="commentContainer" 
    class="lazy-comment-section"
  >
    <!-- 加载占位符 -->
    <div v-if="!isLoaded" class="comment-placeholder">
      <div class="placeholder-header">
        <div class="placeholder-title"></div>
        <div class="placeholder-count"></div>
      </div>
      <div class="placeholder-form">
        <div class="placeholder-input"></div>
        <div class="placeholder-textarea"></div>
        <div class="placeholder-button"></div>
      </div>
      <div class="placeholder-comments">
        <div v-for="i in 3" :key="i" class="placeholder-comment">
          <div class="placeholder-avatar"></div>
          <div class="placeholder-content">
            <div class="placeholder-name"></div>
            <div class="placeholder-text"></div>
          </div>
        </div>
      </div>
      <div class="loading-text">
        <div class="spinner"></div>
        评论区加载中...
      </div>
    </div>
    
    <!-- 实际评论组件 -->
    <component 
      v-if="isLoaded"
      :is="CommentSection"
      v-bind="$attrs"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue';

// 懒加载评论组件
const CommentSection = defineAsyncComponent({
  loader: () => import('./CommentSection.vue'),
  loadingComponent: {
    template: '<div class="loading-comments">评论组件加载中...</div>'
  },
  errorComponent: {
    template: '<div class="error-comments">评论组件加载失败</div>'
  },
  delay: 300,
  timeout: 5000
});

const commentContainer = ref(null);
const isLoaded = ref(false);

// 创建 Intersection Observer
const createObserver = () => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 延迟加载评论组件，因为它通常在页面底部
            setTimeout(() => {
              isLoaded.value = true;
            }, 500);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    if (commentContainer.value) {
      observer.observe(commentContainer.value);
    }
  } else {
    // 兼容性处理
    setTimeout(() => {
      isLoaded.value = true;
    }, 2000);
  }
};

onMounted(() => {
  createObserver();
});
</script>

<style scoped>
.lazy-comment-section {
  min-height: 400px;
  transition: all 0.3s ease;
}

.comment-placeholder {
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
  border: 1px solid #e9ecef;
}

/* 占位符动画 */
.placeholder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.placeholder-title {
  width: 150px;
  height: 24px;
  background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.placeholder-count {
  width: 80px;
  height: 20px;
  background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.placeholder-form {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e9ecef;
}

.placeholder-input {
  width: 100%;
  height: 40px;
  background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.placeholder-textarea {
  width: 100%;
  height: 100px;
  background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.placeholder-button {
  width: 100px;
  height: 40px;
  background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-left: auto;
}


.placeholder-comment {
  display: flex;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e9ecef;
  margin-bottom: 1rem;
}

.placeholder-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 50%;
  margin-right: 1rem;
  flex-shrink: 0;
}

.placeholder-content {
  flex: 1;
}

.placeholder-name {
  width: 120px;
  height: 16px;
  background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.placeholder-text {
  width: 100%;
  height: 60px;
  background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e9ecef;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-comments,
.error-comments {
  padding: 2rem;
  text-align: center;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.loading-comments {
  background-color: #e3f2fd;
  color: #1976d2;
}

.error-comments {
  background-color: #ffebee;
  color: #d32f2f;
}

/* 深色主题适配 */
[data-bs-theme="dark"] .comment-placeholder {
  background: #2d3748;
  border-color: #4a5568;
}

[data-bs-theme="dark"] .placeholder-form,
[data-bs-theme="dark"] .placeholder-comment {
  background: #1a202c;
  border-color: #4a5568;
}

[data-bs-theme="dark"] .placeholder-title,
[data-bs-theme="dark"] .placeholder-count,
[data-bs-theme="dark"] .placeholder-input,
[data-bs-theme="dark"] .placeholder-textarea,
[data-bs-theme="dark"] .placeholder-button,
[data-bs-theme="dark"] .placeholder-avatar,
[data-bs-theme="dark"] .placeholder-name,
[data-bs-theme="dark"] .placeholder-text {
  background: linear-gradient(90deg, #4a5568 25%, #2d3748 50%, #4a5568 75%);
  background-size: 200% 100%;
}

[data-bs-theme="dark"] .spinner {
  border-color: #4a5568;
  border-top-color: #4299e1;
}

[data-bs-theme="dark"] .loading-text {
  color: #a0aec0;
}

[data-bs-theme="dark"] .loading-comments {
  background-color: #1e3a8a;
  color: #bfdbfe;
}

[data-bs-theme="dark"] .error-comments {
  background-color: #7f1d1d;
  color: #fecaca;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comment-placeholder {
    padding: 1rem;
  }
  
  .placeholder-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .placeholder-form {
    padding: 1rem;
  }
  
  .placeholder-comment {
    padding: 0.75rem;
  }
  
  .placeholder-avatar {
    width: 40px;
    height: 40px;
  }
}
</style>
