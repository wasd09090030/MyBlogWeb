<template>
  <div class="article-structure-container" v-if="headings.length > 0">
    <div class="article-structure">
      <!-- 结构标题 -->
      <div class="structure-header" @click="toggleCollapse">
        <h6 class="structure-title">
          <i class="bi bi-list-ul me-2"></i>
          文章目录
        </h6>
        <button class="collapse-btn" :class="{ 'collapsed': isCollapsed }">
          <i class="bi bi-chevron-up"></i>
        </button>
      </div>
      
      <!-- 目录内容 -->
      <div class="structure-content" :class="{ 'collapsed': isCollapsed }">
        <nav class="toc-navigation">
          <ul class="toc-list">
            <li 
              v-for="heading in headings" 
              :key="heading.id"
              :class="[
                'toc-item', 
                `toc-level-${heading.level}`,
                { 'active': activeHeading === heading.id }
              ]"
            >
              <a 
                :href="`#${heading.id}`"
                class="toc-link"
                @click.prevent="scrollToHeading(heading.id)"
              >
                <span class="toc-bullet"></span>
                <span class="toc-text">{{ heading.text }}</span>
              </a>
            </li>
          </ul>
        </nav>
        
        <!-- 阅读进度 -->
        <div class="reading-progress-section">
          <div class="progress-label">
            <i class="bi bi-book me-1"></i>
            <span>阅读进度</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: readingProgress + '%' }"
            ></div>
          </div>
          <div class="progress-percentage">{{ Math.round(readingProgress) }}%</div>
        </div>
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

// 响应式数据
const headings = ref([]);
const activeHeading = ref('');
const readingProgress = ref(0);
const isCollapsed = ref(false);

// 切换折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('articleStructureCollapsed', isCollapsed.value.toString());
};

// 从文章内容中提取标题
const extractHeadings = () => {
  if (!props.articleContent) return;
  
  nextTick(() => {
    const articleElement = document.querySelector('.article-content-html');
    if (!articleElement) return;
    
    const headingElements = articleElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const extractedHeadings = [];
    
    headingElements.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent.trim();
      let id = heading.id || `heading-${index}-${text.toLowerCase().replace(/[^\w\u4e00-\u9fff]/g, '-')}`;
      
      // 确保 ID 唯一
      let finalId = id;
      let counter = 1;
      while (document.getElementById(finalId) && document.getElementById(finalId) !== heading) {
        finalId = `${id}-${counter}`;
        counter++;
      }
      
      // 设置标题的 ID
      if (!heading.id || heading.id !== finalId) {
        heading.id = finalId;
      }
      
      extractedHeadings.push({
        id: finalId,
        text,
        level,
        element: heading
      });
    });
    
    headings.value = extractedHeadings;
  });
};

// 平滑滚动到指定标题
const scrollToHeading = (headingId) => {
  const targetElement = document.getElementById(headingId);
  if (!targetElement) return;
  
  // 计算目标位置（考虑固定导航栏的高度）
  const navbarHeight = 70;
  const targetTop = targetElement.offsetTop - navbarHeight;
  
  // 平滑滚动
  window.scrollTo({
    top: targetTop,
    behavior: 'smooth'
  });
  
  // 添加高亮效果
  targetElement.classList.add('heading-highlight');
  setTimeout(() => {
    targetElement.classList.remove('heading-highlight');
  }, 2000);
};

// 处理滚动事件 - 仅用于阅读进度
const handleScroll = () => {
  if (headings.value.length === 0) return;
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  // 计算阅读进度
  const maxScroll = documentHeight - windowHeight;
  const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
  readingProgress.value = Math.min(Math.max(progress, 0), 100);
};

// 使用 IntersectionObserver 优化标题高亮
let observer = null;

const setupIntersectionObserver = () => {
  if (observer) observer.disconnect();
  
  const options = {
    root: null,
    rootMargin: '-70px 0px -80% 0px', // 调整触发区域，使其更符合阅读习惯
    threshold: 0
  };
  
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeHeading.value = entry.target.id;
      }
    });
  }, options);
  
  headings.value.forEach(heading => {
    const element = document.getElementById(heading.id);
    if (element) observer.observe(element);
  });
};

// 初始化折叠状态
const initializeCollapseState = () => {
  const saved = localStorage.getItem('articleStructureCollapsed');
  if (saved !== null) {
    isCollapsed.value = saved === 'true';
  } else {
    // 在小屏幕上默认折叠
    isCollapsed.value = window.innerWidth < 992;
  }
};

// 监听窗口大小变化
const handleResize = () => {
  // 小屏幕自动折叠
  if (window.innerWidth < 992 && !isCollapsed.value) {
    isCollapsed.value = true;
  }
};

// 监听文章内容变化
watch(() => props.articleContent, () => {
  if (props.articleContent) {
    setTimeout(() => {
      extractHeadings();
    }, 100);
  }
}, { immediate: true });

onMounted(() => {
  initializeCollapseState();
  extractHeadings();
  
  // 添加事件监听器
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  
  // 初始调用
  handleScroll();
  handleResize();
  
  // 设置观察器
  setTimeout(setupIntersectionObserver, 500);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', handleResize);
  if (observer) observer.disconnect();
});
</script>

<style scoped>
.article-structure-container {
  position: sticky;
  top: 80px;
  z-index: 1000;
  max-height: calc(100vh - 100px);
}

.article-structure {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.article-structure:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* 结构标题 */
.structure-header {
  background: linear-gradient(135deg,  #6176ff 0%, #2460e3 100%);
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.structure-header:hover {
  background: linear-gradient(135deg, #5b60f0 0%, #8250f5 100%);
}

.structure-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.collapse-btn {
  background: none;
  border: none;
  color: white;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.collapse-btn i {
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.collapse-btn.collapsed i {
  transform: rotate(180deg);
}

/* 结构内容 */
.structure-content {
  max-height: calc(100vh - 160px);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.structure-content.collapsed {
  max-height: 0;
}

.toc-navigation {
  padding: 16px 0;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

/* 目录列表 */
.toc-list {
  list-style: none;
  margin: 0;
  padding: 0 16px;
}

.toc-item {
  margin: 2px 0;
  transition: all 0.2s ease;
}

.toc-link {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  color: #64748b;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.85rem;
  line-height: 1.4;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.toc-link:hover {
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
  transform: translateX(4px);
}

.toc-item.active .toc-link {
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
  font-weight: 600;
}

.toc-item.active .toc-bullet {
  background: #6366f1;
  transform: scale(1.2);
}

/* 目录项圆点 */
.toc-bullet {
  width: 6px;
  height: 6px;
  background: #cbd5e1;
  border-radius: 50%;
  margin-right: 10px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toc-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 不同级别的标题缩进 */
.toc-level-1 .toc-link {
  padding-left: 12px;
  font-weight: 600;
  font-size: 0.9rem;
}

.toc-level-2 .toc-link {
  padding-left: 24px;
  font-size: 0.85rem;
}

.toc-level-3 .toc-link {
  padding-left: 36px;
  font-size: 0.8rem;
}

.toc-level-4 .toc-link {
  padding-left: 48px;
  font-size: 0.8rem;
}

.toc-level-5 .toc-link {
  padding-left: 60px;
  font-size: 0.75rem;
}

.toc-level-6 .toc-link {
  padding-left: 72px;
  font-size: 0.75rem;
}

/* 阅读进度区域 */
.reading-progress-section {
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(99, 102, 241, 0.04);
}

.progress-label {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: #6366f1;
  font-weight: 600;
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
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
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: progressShimmer 2s infinite;
}

.progress-percentage {
  font-size: 0.75rem;
  color: #6366f1;
  font-weight: 600;
  text-align: center;
}

/* 自定义滚动条 */
.toc-navigation::-webkit-scrollbar {
  width: 4px;
}

.toc-navigation::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
}

.toc-navigation::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.3);
  border-radius: 2px;
}

.toc-navigation::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.5);
}

/* 暗色主题支持 */
[data-bs-theme="dark"] .article-structure {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(148, 163, 184, 0.2);
}

[data-bs-theme="dark"] .structure-header {
  background: linear-gradient(135deg, #2a46ff 0%, #0000db 100%);
}

[data-bs-theme="dark"] .structure-header:hover {
  background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
}

[data-bs-theme="dark"] .toc-link {
  color: #cbd5e1;
}

[data-bs-theme="dark"] .toc-link:hover {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
}

[data-bs-theme="dark"] .toc-item.active .toc-link {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

[data-bs-theme="dark"] .toc-item.active .toc-bullet {
  background: #a5b4fc;
}

[data-bs-theme="dark"] .toc-bullet {
  background: #64748b;
}

[data-bs-theme="dark"] .reading-progress-section {
  border-top-color: rgba(148, 163, 184, 0.2);
  background: rgba(99, 102, 241, 0.08);
}

[data-bs-theme="dark"] .progress-label {
  color: #a5b4fc;
}

[data-bs-theme="dark"] .progress-bar {
  background: rgba(99, 102, 241, 0.3);
}

[data-bs-theme="dark"] .progress-percentage {
  color: #a5b4fc;
}

/* 高亮标题动画 */
:global(.heading-highlight) {
  animation: headingHighlight 2s ease-out;
}

@keyframes headingHighlight {
  0% {
    background-color: rgba(99, 102, 241, 0.2);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
  50% {
    background-color: rgba(99, 102, 241, 0.1);
    box-shadow: 0 0 0 8px rgba(99, 102, 241, 0.05);
  }
  100% {
    background-color: transparent;
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

@keyframes progressShimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 响应式设计 */
@media (max-width: 1199px) {
  .article-structure-container {
    position: static;
    top: auto;
    margin-bottom: 1rem;
    max-height: none;
  }
  
  .article-structure {
    max-height: 400px;
  }
  
  .structure-content {
    max-height: 350px;
  }
  
  .toc-navigation {
    max-height: 280px;
  }
}

@media (max-width: 991px) {
  .article-structure-container {
    margin: 1rem 0;
  }
  
  .structure-header {
    padding: 10px 14px;
  }
  
  .structure-title {
    font-size: 0.85rem;
  }
  
  .toc-link {
    font-size: 0.8rem;
    padding: 6px 10px;
  }
  
  .toc-level-1 .toc-link {
    font-size: 0.85rem;
  }
}

@media (max-width: 768px) {
  .article-structure {
    border-radius: 8px;
  }
  
  .structure-header {
    padding: 8px 12px;
  }
  
  .toc-navigation {
    padding: 12px 0;
  }
  
  .toc-list {
    padding: 0 12px;
  }
  
  .reading-progress-section {
    padding: 12px;
  }
}

@media (max-width: 576px) {
  .toc-link {
    font-size: 0.75rem;
    padding: 5px 8px;
  }
  
  .toc-level-2 .toc-link,
  .toc-level-3 .toc-link,
  .toc-level-4 .toc-link,
  .toc-level-5 .toc-link,
  .toc-level-6 .toc-link {
    padding-left: 20px;
  }
  
  .progress-label {
    font-size: 0.75rem;
  }
  
  .progress-percentage {
    font-size: 0.7rem;
  }
}
</style>
