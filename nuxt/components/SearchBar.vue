<template>
  <div class="search-bar">
    <form @submit.prevent="handleSearch" class="search-form">
      <div class="input-group">
        <input
          v-model="searchQuery"
          type="text"
          class="form-control"
          :placeholder="placeholder"
          :aria-label="placeholder"
        />
        <button class="btn btn-outline-light" type="submit" :disabled="!searchQuery.trim()">
          <i class="bi bi-search"></i>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
const props = defineProps({
  placeholder: {
    type: String,
    default: '搜索文章...'
  }
})

const emit = defineEmits(['search'])

const searchQuery = ref('')

const handleSearch = () => {
  const keyword = searchQuery.value.trim()
  if (keyword) {
    emit('search', keyword)
    searchQuery.value = ''
  }
}

// 监听回车键
const handleKeydown = (event) => {
  if (event.key === 'Enter') {
    handleSearch()
  }
}

onMounted(() => {
  // 如果需要键盘事件监听
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.search-bar {
  max-width: 300px;
}

.search-form {
  width: 100%;
}

.input-group {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-radius: 0.375rem;
  overflow: hidden;
}

.form-control {
  border: none;
  background: rgba(255,255,255,0.1);
  color: white;
  transition: all 0.3s ease;
}

.form-control::placeholder {
  color: rgba(255,255,255,0.7);
}

.form-control:focus {
  background: rgba(255,255,255,0.15);
  box-shadow: none;
  color: white;
}

.btn-outline-light {
  border-color: rgba(255,255,255,0.3);
  color: white;
  transition: all 0.3s ease;
}

.btn-outline-light:hover {
  background: rgba(255,255,255,0.1);
  border-color: white;
  color: white;
  transform: translateY(-1px);
}

.btn-outline-light:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .search-bar {
    max-width: 100%;
  }
}
</style>