<template>
  <div class="infinite-scroll-container">
    <!-- 内容插槽 -->
    <slot :items="visibleItems" :loading="loading" />
    
    <!-- 加载更多触发器 -->
    <div 
      ref="loadMoreTrigger" 
      class="load-more-trigger"
      v-show="hasMore && !loading"
    >
      <div class="load-more-content">
        <div class="load-more-spinner">
          <div class="spinner"></div>
        </div>
        <div class="load-more-text">滚动加载更多...</div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-more">
      <div class="loading-spinner">
        <div class="spinner active"></div>
      </div>
      <div class="loading-text">正在加载更多内容...</div>
    </div>
    
    <!-- 没有更多内容 -->
    <div v-if="!hasMore && visibleItems.length > 0" class="no-more-content">
      <i class="bi bi-check-circle text-success me-2"></i>
      已加载全部内容
    </div>
    
    <!-- 空状态 -->
    <div v-if="!loading && visibleItems.length === 0" class="empty-state">
      <slot name="empty">
        <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
        <p class="text-muted">暂无内容</p>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { throttle, debounce } from '../utils/lazyLoad.js';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  pageSize: {
    type: Number,
    default: 10
  },
  threshold: {
    type: Number,
    default: 200
  },
  autoLoad: {
    type: Boolean,
    default: true
  },
  preloadOffset: {
    type: Number,
    default: 3
  }
});

const emit = defineEmits(['load-more', 'visible-change']);

const loadMoreTrigger = ref(null);
const currentPage = ref(1);
const loading = ref(false);
const observer = ref(null);

// 计算可见项目
const visibleItems = computed(() => {
  const endIndex = currentPage.value * props.pageSize;
  return props.items.slice(0, endIndex);
});

// 是否还有更多内容
const hasMore = computed(() => {
  return visibleItems.value.length < props.items.length;
});

// 加载更多内容
const loadMore = debounce(() => {
  if (loading.value || !hasMore.value) return;
  
  loading.value = true;
  
  // 模拟异步加载
  setTimeout(() => {
    currentPage.value++;
    loading.value = false;
    emit('load-more', {
      page: currentPage.value,
      pageSize: props.pageSize
    });
  }, 300);
}, 300);

// 检查是否需要预加载
const checkPreload = throttle(() => {
  const remaining = props.items.length - visibleItems.value.length;
  if (remaining <= props.preloadOffset && hasMore.value) {
    emit('load-more', {
      page: currentPage.value + 1,
      pageSize: props.pageSize,
      preload: true
    });
  }
}, 500);

// 创建 Intersection Observer
const createObserver = () => {
  if ('IntersectionObserver' in window) {
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && props.autoLoad) {
            loadMore();
          }
        });
      },
      {
        rootMargin: `${props.threshold}px`,
        threshold: 0.1
      }
    );

    if (loadMoreTrigger.value) {
      observer.value.observe(loadMoreTrigger.value);
    }
  }
};

// 重置滚动状态
const reset = () => {
  currentPage.value = 1;
  loading.value = false;
};

// 手动触发加载更多
const triggerLoadMore = () => {
  loadMore();
};

// 监听项目变化
watch(() => props.items.length, (newLength, oldLength) => {
  if (newLength > oldLength) {
    checkPreload();
  }
});

// 监听可见项目变化
watch(visibleItems, (newItems) => {
  emit('visible-change', newItems);
}, { deep: true });

onMounted(() => {
  createObserver();
});

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});

// 暴露方法给父组件
defineExpose({
  reset,
  loadMore: triggerLoadMore,
  hasMore,
  loading
});
</script>

<style scoped>
.infinite-scroll-container {
  width: 100%;
}

.load-more-trigger {
  padding: 2rem 0;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.load-more-trigger:hover {
  opacity: 1;
}

.load-more-content,
.loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: #6c757d;
}

.load-more-spinner,
.loading-spinner {
  margin-bottom: 0.5rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e9ecef;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.spinner.active {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.load-more-text,
.loading-text {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.no-more-content {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-size: 0.9rem;
  border-top: 1px solid #e9ecef;
  margin-top: 2rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
}

/* 加载动画效果 */
.loading-more {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 0.5rem;
  margin: 1rem 0;
  border: 1px solid #e9ecef;
}

/* 深色主题适配 */
[data-bs-theme="dark"] .load-more-content,
[data-bs-theme="dark"] .loading-more {
  color: #a0aec0;
}

[data-bs-theme="dark"] .spinner {
  border-color: #4a5568;
  border-top-color: #4299e1;
}

[data-bs-theme="dark"] .loading-more {
  background: linear-gradient(135deg, #2d3748, #1a202c);
  border-color: #4a5568;
}

[data-bs-theme="dark"] .no-more-content {
  color: #a0aec0;
  border-top-color: #4a5568;
}

[data-bs-theme="dark"] .empty-state {
  color: #a0aec0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .load-more-trigger,
  .loading-more {
    padding: 1rem 0;
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border-width: 2px;
  }
  
  .load-more-text,
  .loading-text {
    font-size: 0.8rem;
  }
  
  .empty-state {
    padding: 2rem 1rem;
  }
}

/* 平滑滚动 */
@media (prefers-reduced-motion: no-preference) {
  .infinite-scroll-container {
    scroll-behavior: smooth;
  }
}
</style>
