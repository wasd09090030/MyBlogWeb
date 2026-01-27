<template>
  <div class="search-bar-container">
    <!-- 搜索栏容器 -->
    <div class="search-bar-wrapper" :class="{ 'expanded': isExpanded }">
      <!-- 搜索按钮 -->
      <button
        class="search-toggle-btn"
        @click="toggleSearchBar"
        title="搜索文章"
        ref="toggleBtn"
      >
        <Icon name="search" size="md" />
      </button>

      <!-- 输入框和按钮组 -->
      <div class="input-section" :class="{ 'visible': isExpanded }">
        <!-- 搜索输入框 -->
        <input
          ref="searchInput"
          type="text"
          class="search-input"
          placeholder="搜索文章..."
          v-model="searchQuery"
          @keyup.enter="search"
          @keyup.esc="closeSearchBar"
          @blur="onBlur"
        />

        <!-- 清空按钮（有输入时显示） -->
        <button
          v-if="searchQuery && !isSearching"
          class="btn clear-btn"
          @click="clearInput"
          title="清空"
        >
          <Icon name="x-lg" size="sm" />
        </button>

        <!-- 搜索执行按钮 -->
        <button
          class="btn search-btn"
          type="button"
          @click="search"
          :class="{ 'searching': isSearching }"
          title="执行搜索"
        >
          <Icon :name="isSearching ? 'arrow-path' : 'search'" size="sm" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const searchQuery = ref('')
const isSearching = ref(false)
const isExpanded = ref(false)
const searchInput = ref(null)
const toggleBtn = ref(null)

// 切换搜索栏展开/收缩
const toggleSearchBar = async () => {
  console.log('Toggle search bar, current expanded:', isExpanded.value)
  isExpanded.value = !isExpanded.value

  if (isExpanded.value) {
    await nextTick()
    console.log('Focusing input')
    searchInput.value?.focus()
  } else {
    searchQuery.value = ''
  }
}

// 关闭搜索栏
const closeSearchBar = () => {
  isExpanded.value = false
  searchQuery.value = ''
}

// 清空输入
const clearInput = (e) => {
  searchQuery.value = ''
  searchInput.value?.focus()
  e.stopPropagation()
}

// 搜索方法
const search = () => {
  const trimmedQuery = searchQuery.value.trim()

  if (!trimmedQuery) {
    // 如果搜索框为空，提示用户
    alert('请输入搜索关键词')
    return
  }

  if (trimmedQuery.length < 2) {
    // 如果关键词太短，提示用户
    alert('搜索关键词至少需要2个字符')
    return
  }

  isSearching.value = true

  // 模拟请求延迟
  setTimeout(() => {
    navigateTo({
      path: '/',
      query: { search: trimmedQuery }
    })
    isSearching.value = false
    // 搜索后保持展开状态，以便用户可以修改搜索词
  }, 300)
}

// 失焦处理：点击外部关闭
const onBlur = (e) => {
  // 延迟执行，确保点击事件先执行
  setTimeout(() => {
    const activeElement = document.activeElement
    const searchWrapper = e.target.closest('.search-bar-wrapper')

    // 如果焦点不在搜索栏内部，则关闭搜索栏
    if (!activeElement?.closest('.search-bar-wrapper') && !searchWrapper?.contains(activeElement)) {
      closeSearchBar()
    }
  }, 150)
}
</script>

<style scoped>
.search-bar-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 搜索栏包装器 */
.search-bar-wrapper {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 40px;
  max-width: 40px;
  height: 40px;
  position: relative;
  flex-shrink: 0;
}

.search-bar-wrapper.expanded {
  max-width: 300px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

/* 搜索切换按钮 */
.search-toggle-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(34, 28, 57, 0.05);
  color: rgba(32, 24, 24, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
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
  transition: left 0.6s ease;
}

.search-toggle-btn:hover::before {
  left: 100%;
}

.search-toggle-btn:hover {
  background: rgba(54, 24, 24, 0.1);
  color: #000;
  transform: scale(1.05);
}

.search-toggle-btn:active {
  transform: scale(0.95);
}

/* 输入区域：使用 visibility 控制显示 */
.input-section {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 4px;
  opacity: 0;
  visibility: hidden;
  transform: translateX(-15px);
  transition: opacity 0.3s ease, visibility 0.3s, transform 0.3s ease;
  padding-right: 4px;
  pointer-events: none; /* 隐藏时禁用点击 */
}

.input-section.visible {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
  pointer-events: auto; /* 显示时启用点击 */
}

/* 搜索输入框 */
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: rgb(26, 22, 22);
  padding: 8px 12px;
  font-size: 0.9rem;
  border-radius: 15px 0 0 15px;
  outline: none;
  transition: background 0.3s ease;
  pointer-events: auto; /* 确保输入框可以点击 */
  z-index: 1; /* 确保在上层 */
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search-input:focus {
  background: rgba(255, 255, 255, 0.1);
}

/* 清空按钮 */
.clear-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 6px 8px;
  border-radius: 50%;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  transform: scale(1.1);
}

/* 搜索执行按钮 */
.search-btn {
  border: none;
  background: transparent;
  color: rgba(13, 110, 253, 0.8);
  padding: 8px 10px;
  border-radius: 0 15px 15px 0;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  min-width: 36px;
  width: 36px;
}

.search-btn:hover {
  background: rgba(13, 110, 253, 0.15);
  color: #0d6efd;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(13, 110, 253, 0.2);
}

.search-btn:active::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200%;
  height: 200%;
  background: rgba(13, 110, 253, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  0% { opacity: 0.8; transform: translate(-50%, -50%) scale(0); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
}

.search-btn.searching {
  pointer-events: none;
  background: rgba(13, 110, 253, 0.8);
  color: white;
}

.search-btn.searching .bi {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 亮色主题适配 */
:global(.light-theme) .search-bar-wrapper {
  background: rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
}

:global(.light-theme) .search-toggle-btn {
  color: rgba(0, 0, 0, 0.7) !important;
}

:global(.light-theme) .search-toggle-btn:hover {
  background: rgba(0, 0, 0, 0.1) !important;
  color: rgba(0, 0, 0, 0.9) !important;
}

:global(.light-theme) .search-input {
  color: #333 !important;
}

:global(.light-theme) .search-input::placeholder {
  color: rgba(0, 0, 0, 0.5) !important;
}

:global(.light-theme) .search-input:focus {
  background: rgba(0, 0, 0, 0.05) !important;
}

:global(.light-theme) .clear-btn {
  color: rgba(0, 0, 0, 0.5) !important;
}

:global(.light-theme) .clear-btn:hover {
  color: rgba(0, 0, 0, 0.8) !important;
}

/* 暗色主题适配 */
:global(.dark-theme .search-bar-wrapper) {
  background: var(--bg-secondary) !important;
  border: 1px solid var(--border-color) !important;
}

:global(.dark-theme .search-toggle-btn) {
  color: var(--accent-primary) !important;
  background: var(--bg-tertiary) !important;
  border: 1px solid var(--border-color-light) !important;
}

:global(.dark-theme .search-toggle-btn:hover) {
  background: var(--bg-hover) !important;
  color: var(--accent-primary-hover) !important;
}

:global(.dark-theme .search-input) {
  color: var(--text-primary) !important;
}

:global(.dark-theme .search-input::placeholder) {
  color: var(--text-muted) !important;
}

:global(.dark-theme .search-input:focus) {
  background: var(--bg-hover) !important;
}

:global(.dark-theme .clear-btn) {
  color: var(--text-muted) !important;
}

:global(.dark-theme .clear-btn:hover) {
  background: var(--bg-hover) !important;
  color: var(--text-primary) !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-bar-wrapper.expanded {
    max-width: 250px;
  }

  .search-input,
  .clear-btn,
  .search-btn {
    padding: 6px 8px;
    font-size: 0.85rem;
  }

  .search-toggle-btn {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }

  .search-bar-wrapper {
    width: 35px;
    max-width: 35px;
    height: 35px;
  }

  .search-btn {
    min-width: 32px;
    width: 32px;
  }
}

@media (max-width: 480px) {
  .search-bar-wrapper.expanded {
    max-width: 200px;
  }

  .search-input {
    padding: 5px 8px;
    font-size: 0.8rem;
  }

  .clear-btn,
  .search-btn {
    padding: 4px 6px;
    font-size: 0.8rem;
  }
}
</style>
