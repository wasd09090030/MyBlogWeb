<template>
  <div class="search-bar-container">
    <!-- 搜索按钮 - 默认状态 -->
    <button 
      v-if="!isExpanded" 
      class="search-toggle-btn"
      @click="toggleSearchBar"
      title="搜索文章"
    >
      <i class="bi bi-search"></i>
    </button>

    <!-- 展开的搜索栏 -->
    <div 
      v-else 
      class="search-bar-expanded" 
      :class="{ 'animate-expand': isExpanded }"
    >
      <div class="input-group">
        <input 
          ref="searchInput"
          type="text" 
          class="form-control search-input" 
          placeholder="搜索文章..." 
          v-model="searchQuery"
          @keyup.enter="search"
          @keyup.esc="closeSearchBar"
          @blur="onBlur"
        >
        <button 
          class="btn search-btn" 
          type="button" 
          @click="search"
          :class="{ 'searching': isSearching }"
        >
          <i class="bi bi-search"></i>
        </button>
        <button 
          class="btn close-btn" 
          type="button" 
          @click="closeSearchBar"
        >
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');
const isSearching = ref(false);
const isExpanded = ref(false);
const searchInput = ref(null);

// 切换搜索栏展开/收缩
const toggleSearchBar = async () => {
  isExpanded.value = !isExpanded.value;
  
  if (isExpanded.value) {
    // 展开后自动聚焦到输入框
    await nextTick();
    searchInput.value?.focus();
  }
};

// 关闭搜索栏
const closeSearchBar = () => {
  isExpanded.value = false;
  searchQuery.value = '';
};

// 搜索方法
const search = () => {
  if (searchQuery.value.trim()) {
    isSearching.value = true;
    
    setTimeout(() => {
      // 跳转到搜索结果页面，携带搜索关键词
      router.push({
        name: 'ArticleList',
        query: { search: searchQuery.value.trim() }
      });
      isSearching.value = false;
      // 搜索后可以选择保持展开状态或关闭
      // closeSearchBar(); // 取消注释这行可以在搜索后自动关闭
    }, 300);
  }
};

// 失焦事件处理 - 延迟关闭以便点击按钮
const onBlur = () => {
  // 短暂延迟以允许点击搜索或关闭按钮
  setTimeout(() => {
    if (!document.activeElement?.closest('.search-bar-expanded')) {
      closeSearchBar();
    }
  }, 150);
};
</script>

<style scoped>
.search-bar-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 搜索切换按钮样式 */
.search-toggle-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(114, 177, 151, 0.1);
  color: rgba(19, 18, 18, 0.8);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.search-toggle-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.search-toggle-btn:hover {
  background: rgba(27, 42, 54, 0.2);
  color: rgb(0, 0, 0);
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.search-toggle-btn:hover::before {
  left: 100%;
}

.search-toggle-btn:active {
  transform: scale(0.95);
}

/* 展开的搜索栏容器 */
.search-bar-expanded {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  min-width: 300px;
  opacity: 0;
  transform-origin: right center;
}

.search-bar-expanded.animate-expand {
  animation: expandSearchBar 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes expandSearchBar {
  0% {
    opacity: 0;
    transform: translateY(-50%) scaleX(0);
  }
  100% {
    opacity: 1;
    transform: translateY(-50%) scaleX(1);
  }
}

/* 输入组样式 */
.input-group {
  display: flex;
  backdrop-filter: blur(10px);
  border-radius: 25px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 搜索输入框样式 */
.search-input {
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  padding: 8px 16px;
  font-size: 0.9rem;
  min-width: 200px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 1);
  box-shadow: none;
}

.search-input::placeholder {
  color: rgba(0, 0, 0, 0.5);
}

/* 搜索按钮样式 */
.search-btn {
  border: none;
  background: rgba(13, 110, 253, 0.8);
  color: white;
  padding: 8px 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.search-btn:hover {
  background: rgba(13, 110, 253, 1);
  transform: translateY(-1px);
}

.search-btn.searching {
  animation: searchPulse 1s infinite;
}

@keyframes searchPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 关闭按钮样式 */
.close-btn {
  border: none;
  background: rgba(220, 53, 69, 0.8);
  color: white;
  padding: 8px 12px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(220, 53, 69, 1);
  transform: translateY(-1px);
}

/* 亮色主题适配 */
:global(.light-theme) .search-toggle-btn {
  background: rgba(0, 0, 0, 0.1) !important;
  color: rgba(0, 0, 0, 0.7) !important;
}

:global(.light-theme) .search-toggle-btn:hover {
  background: rgba(0, 0, 0, 0.2) !important;
  color: rgba(0, 0, 0, 0.9) !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
}

:global(.light-theme) .input-group {
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
}

:global(.light-theme) .search-input {
  background: rgba(255, 255, 255, 0.95) !important;
  color: #333 !important;
}

:global(.light-theme) .search-input::placeholder {
  color: rgba(0, 0, 0, 0.6) !important;
}

/* 暗色主题适配 */
:global(.dark-theme) .search-toggle-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

:global(.dark-theme) .search-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  color: white !important;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2) !important;
}

:global(.dark-theme) .input-group {
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

:global(.dark-theme) .search-input {
  background: rgba(0, 0, 0, 0.8) !important;
  color: white !important;
}

:global(.dark-theme) .search-input::placeholder {
  color: rgba(255, 255, 255, 0.6) !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-bar-expanded {
    min-width: 250px;
    right: -10px;
  }
  
  .search-input {
    min-width: 150px;
    font-size: 0.85rem;
    padding: 6px 12px;
  }
  
  .search-btn,
  .close-btn {
    padding: 6px 10px;
  }
  
  .search-toggle-btn {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .search-bar-expanded {
    min-width: 200px;
    right: -20px;
  }
  
  .search-input {
    min-width: 120px;
  }
}
</style>
