<template>
  <div class="article-structure" v-if="headings.length > 0">
    <div class="structure-header">
      <h5 class="structure-title">
        <i class="bi bi-list-ul me-2"></i>
        文章目录
      </h5>
      <div class="structure-toggle" @click="toggleCollapse">
        <i :class="['bi', collapsed ? 'bi-chevron-down' : 'bi-chevron-up']"></i>
      </div>
    </div>
    
    <div class="structure-content" :class="{ 'collapsed': collapsed }">
      <nav class="toc-nav">
        <ul class="toc-list">
          <li 
            v-for="heading in headings" 
            :key="heading.id"
            :class="['toc-item', `toc-level-${heading.level}`, { 'active': activeHeading === heading.id }]"
            @click="scrollToHeading(heading.id)"
          >
            <a :href="`#${heading.id}`" class="toc-link" @click.prevent>
              <span class="toc-text">{{ heading.text }}</span>
              <span class="toc-indicator"></span>
            </a>
          </li>
        </ul>
      </nav>
      
      <!-- 阅读进度条 -->
      <div class="reading-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: readingProgress + '%' }"></div>
        </div>
        <small class="progress-text">阅读进度: {{ Math.round(readingProgress) }}%</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';

const props = defineProps({
  articleContent: {
    type: String,
    default: ''
  }
});

const headings = ref([]);
const activeHeading = ref('');
const readingProgress = ref(0);
const collapsed = ref(false);

// 切换折叠状态
const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
};

// 从文章内容中提取标题
const extractHeadings = () => {
  if (!props.articleContent) return;
  
  // 等待DOM更新后再提取标题
  nextTick(() => {
    const articleElement = document.querySelector('.article-content-html');
    if (!articleElement) return;
    
    const headingElements = articleElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const extractedHeadings = [];
    
    headingElements.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent.trim();
      const id = heading.id || `heading-${index}`;
      
      // 如果标题没有id，给它添加一个
      if (!heading.id) {
        heading.id = id;
      }
      
      extractedHeadings.push({
        id,
        text,
        level,
        element: heading
      });
    });
    
    headings.value = extractedHeadings;
  });
};

// 滚动到指定标题
const scrollToHeading = (headingId) => {
  const element = document.getElementById(headingId);
  if (element) {
    const offsetTop = element.offsetTop - 80; // 考虑固定导航栏的高度
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
    
    // 高亮目标标题
    element.classList.add('highlight-heading');
    setTimeout(() => {
      element.classList.remove('highlight-heading');
    }, 2000);
  }
};

// 监听滚动事件，更新当前活跃的标题
const handleScroll = () => {
  if (headings.value.length === 0) return;
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  // 计算阅读进度
  const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
  readingProgress.value = Math.min(Math.max(progress, 0), 100);
  
  // 找到当前可见的标题
  let currentHeading = '';
  
  for (let i = headings.value.length - 1; i >= 0; i--) {
    const heading = headings.value[i];
    const element = document.getElementById(heading.id);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      // 如果标题在视口上方或刚好在视口顶部附近
      if (rect.top <= 100) {
        currentHeading = heading.id;
        break;
      }
    }
  }
  
  activeHeading.value = currentHeading;
};

// 监听窗口大小变化
const handleResize = () => {
  // 在小屏幕上自动折叠
  if (window.innerWidth < 992) {
    collapsed.value = true;
  }
};

// 监听文章内容变化
watch(() => props.articleContent, () => {
  extractHeadings();
}, { immediate: true });

onMounted(() => {
  extractHeadings();
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize);
  handleResize(); // 初始检查
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.article-structure {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
}

.article-structure:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.structure-header {
  padding: 1rem 1.2rem;
  background: linear-gradient(135deg, #a1b2ff 0%, #0a0b6e 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.structure-header:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.structure-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.structure-toggle {
  padding: 0.2rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.structure-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
}

.structure-toggle i {
  font-size: 0.9rem;
  transition: transform 0.3s ease;
}

.structure-content {
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 1rem 0;
}

.structure-content.collapsed {
  max-height: 0;
  padding: 0;
  overflow: hidden;
}

.toc-nav {
  padding: 0 1rem;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc-item {
  margin: 0.3rem 0;
  transition: all 0.2s ease;
  border-radius: 6px;
  overflow: hidden;
}

.toc-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  transform: translateX(4px);
}

.toc-item.active .toc-link {
  color: #667eea;
  font-weight: 600;
}

.toc-item.active .toc-indicator {
  opacity: 1;
  transform: scale(1);
}

.toc-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.8rem;
  color: #4a5568;
  text-decoration: none;
  font-size: 0.85rem;
  line-height: 1.4;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.toc-link:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
  color: #667eea;
  transform: translateX(2px);
  text-decoration: none;
}

.toc-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  transition: width 0.3s ease;
  z-index: 0;
}

.toc-link:hover::before {
  width: 3px;
}

.toc-text {
  flex: 1;
  position: relative;
  z-index: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toc-indicator {
  width: 6px;
  height: 6px;
  background: linear-gradient(135deg, #667eea, #cca7f2);
  border-radius: 50%;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

/* 不同级别的标题样式 */
.toc-level-1 .toc-link {
  font-weight: 600;
  font-size: 0.9rem;
  padding-left: 0.8rem;
}

.toc-level-2 .toc-link {
  font-size: 0.85rem;
  padding-left: 1.2rem;
}

.toc-level-3 .toc-link {
  font-size: 0.8rem;
  padding-left: 1.6rem;
}

.toc-level-4 .toc-link {
  font-size: 0.75rem;
  padding-left: 2rem;
}

.toc-level-5 .toc-link {
  font-size: 0.75rem;
  padding-left: 2.4rem;
}

.toc-level-6 .toc-link {
  font-size: 0.7rem;
  padding-left: 2.8rem;
}

/* 阅读进度 */
.reading-progress {
  margin: 1rem;
  padding: 0.8rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

.progress-text {
  color: #667eea;
  font-weight: 500;
  font-size: 0.75rem;
}

/* 自定义滚动条 */
.structure-content::-webkit-scrollbar {
  width: 4px;
}

.structure-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

.structure-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 2px;
}

.structure-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a6fd8, #6a4190);
}

/* 暗色主题 */
[data-bs-theme="dark"] .article-structure {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

[data-bs-theme="dark"] .structure-header {
  background: linear-gradient(135deg, #4299e1 0%, #9f7aea 100%);
}

[data-bs-theme="dark"] .structure-header:hover {
  background: linear-gradient(135deg, #3182ce 0%, #805ad5 100%);
}

[data-bs-theme="dark"] .toc-link {
  color: #e2e8f0;
}

[data-bs-theme="dark"] .toc-item.active {
  background: linear-gradient(135deg, rgba(66, 153, 225, 0.15), rgba(159, 122, 234, 0.15));
}

[data-bs-theme="dark"] .toc-item.active .toc-link {
  color: #4299e1;
}

[data-bs-theme="dark"] .toc-link:hover {
  background: linear-gradient(135deg, rgba(66, 153, 225, 0.1), rgba(159, 122, 234, 0.1));
  color: #4299e1;
}

[data-bs-theme="dark"] .toc-link::before {
  background: linear-gradient(135deg, #4299e1, #9f7aea);
}

[data-bs-theme="dark"] .toc-indicator {
  background: linear-gradient(135deg, #4299e1, #9f7aea);
}

[data-bs-theme="dark"] .reading-progress {
  background: rgba(66, 153, 225, 0.1);
  border: 1px solid rgba(66, 153, 225, 0.2);
}

[data-bs-theme="dark"] .progress-bar {
  background: rgba(66, 153, 225, 0.2);
}

[data-bs-theme="dark"] .progress-fill {
  background: linear-gradient(90deg, #4299e1, #9f7aea);
}

[data-bs-theme="dark"] .progress-text {
  color: #4299e1;
}

[data-bs-theme="dark"] .structure-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

[data-bs-theme="dark"] .structure-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #4299e1, #9f7aea);
}

[data-bs-theme="dark"] .structure-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #3182ce, #805ad5);
}

/* 动画效果 */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 高亮标题的动画效果 */
:global(.highlight-heading) {
  animation: highlightHeading 2s ease-out;
}

@keyframes highlightHeading {
  0% {
    background-color: rgba(102, 126, 234, 0.2);
    transform: scale(1);
  }
  50% {
    background-color: rgba(102, 126, 234, 0.1);
    transform: scale(1.02);
  }
  100% {
    background-color: transparent;
    transform: scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 1199px) {
  .article-structure {
    position: static;
    margin-bottom: 1rem;
  }
  
  .structure-content {
    max-height: 300px;
  }
}

@media (max-width: 991px) {
  .article-structure {
    margin: 1rem 0;
  }
  
  .structure-content.collapsed {
    max-height: 0;
  }
  
  .structure-header {
    padding: 0.8rem 1rem;
  }
  
  .structure-title {
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .toc-link {
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
  }
  
  .toc-level-1 .toc-link {
    font-size: 0.85rem;
  }
  
  .reading-progress {
    margin: 0.8rem;
    padding: 0.6rem;
  }
}
</style>
