<template>
  <div class="search-bar-container animate__animated animate__fadeIn">
    <div class="input-group">
      <input 
        type="text" 
        class="form-control search-input" 
        placeholder="搜索文章..." 
        v-model="searchQuery"
        @keyup.enter="search"
        @focus="onFocus"
        @blur="onBlur"
      >
      <button 
        class="btn btn-outline-light search-btn" 
        type="button" 
        @click="search"
        :class="{ 'animate__animated animate__pulse': isSearching }"
      >
        <i class="bi bi-search"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');
const isSearching = ref(false);

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
    }, 300);
  }
};

// 焦点事件处理
const onFocus = (event) => {
  event.target.parentElement.classList.add('focused');
};

const onBlur = (event) => {
  event.target.parentElement.classList.remove('focused');
};
</script>

<style scoped>
.search-bar-container {
  width: 100%;
  max-width: 100%;
  position: relative;
}

.input-group {
  transition: all 0.3s ease;
}

.input-group.focused {
  transform: scale(1.02);
}

/* 暗色主题和默认样式（导航栏为深色时） */
.search-input {
  border-radius: 20px 0 0 20px;
  border: 1px solid rgba(147, 147, 147, 0.3);
  background-color: rgba(255, 255, 255, 0.1);
  color: rgb(84, 81, 81);
  padding-left: 16px;
  box-shadow: none;
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: rgba(44, 44, 44, 0.7);
  transition: all 0.3s ease;
}

.search-input:focus {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(168, 168, 168, 0.5);
  color: rgb(151, 151, 151);
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.search-btn {
  border-radius: 0 20px 20px 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-left: none;
  background-color: rgba(52, 44, 44, 0.1);
  color: rgb(86, 85, 85);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.search-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.search-btn:hover::before {
  left: 100%;
}

.search-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  color: rgb(125, 125, 125);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-btn:active {
  transform: translateY(0) scale(0.98);
}

.search-btn:focus {
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25);
}

/* 亮色主题适配 - 统一使用 .light-theme 选择器 */
:global(.light-theme) .search-input {
  background-color: #ffffff !important;
  border-color: rgba(0, 0, 0, 0.4) !important;
  color: #333333 !important;
}

:global(.light-theme) .search-input::placeholder {
  color: rgba(0, 0, 0, 0.6) !important;
}

:global(.light-theme) .search-input:focus {
  background-color: #ffffff !important;
  border-color: rgba(0, 0, 0, 0.6) !important;
  color: #333333 !important;
  box-shadow: 0 0 0 0.2rem rgba(69, 85, 210, 0.25) !important;
}

:global(.light-theme) .search-btn {
  background-color: #ffffff !important;
  border-color: rgba(0, 0, 0, 0.4) !important;
  color: #333333 !important;
}

:global(.light-theme) .search-btn:hover {
  background-color: #f8f9fa !important;
  border-color: rgba(0, 0, 0, 0.6) !important;
  color: #333333 !important;
}

:global(.light-theme) .search-btn:focus {
  box-shadow: 0 0 0 0.2rem rgba(69, 85, 210, 0.25) !important;
}

/* 暗色主题适配 - 统一使用 .dark-theme 选择器 */
:global(.dark-theme) .search-input {
  background-color: rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .search-input::placeholder {
  color: rgba(255, 255, 255, 0.6) !important;
}

:global(.dark-theme) .search-input:focus {
  background-color: rgba(0, 0, 0, 0.4) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  color: #ffffff !important;
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25) !important;
}

:global(.dark-theme) .search-btn {
  background-color: rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .search-btn:hover {
  background-color: rgba(0, 0, 0, 0.4) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .search-btn:focus {
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25) !important;
}
</style>
