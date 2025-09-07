<template>
  <div class="article-detail-page">
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      加载文章失败: {{ error.message }}
    </div>    
    
    <div v-else-if="article" class="article-container card shadow-sm">
      <div class="card-body">        
        <!-- 文章结构组件 - 在大屏幕上固定在右侧，在小屏幕上显示在顶部 -->
        <div class="article-structure-wrapper">
          <ArticleStructure :article-content="article.content" />
        </div>
        
        <!-- 文章主要内容 -->
        <div class="article-main-content">
          <!-- 封面图片 -->
          <div v-if="article.coverImage && article.coverImage !== 'null'" class="article-cover mb-4">
            <img 
              :src="article.coverImage" 
              :alt="article.title" 
              class="cover-image"
              style="height: 400px; aspect-ratio: 16/9; object-fit: cover; width: 100%; border-radius: 0.5rem;"
            />
          </div>
        
        <div class="article-header mb-4 header-fade-in">
          <h1 class="article-title">{{ article.title }}</h1>
          <div class="article-meta">
            <span class="badge" :class="getCategoryBadgeClass(article.category)">
              {{ getCategoryName(article.category) }}
            </span>
            <span class="badge bg-secondary ms-2">{{ formatDate(article.createdAt) }}</span>
            <span v-if="article.updatedAt && article.updatedAt !== article.createdAt" class="ms-2 text-muted">
              最后更新: {{ formatDate(article.updatedAt) }}
            </span>
          </div>
        </div>          <div class="article-actions mb-4">
          <button @click="goBackToList" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-2"></i>
            返回上页
          </button>
        </div>

        <div class="article-content">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="article.content" class="article-content-html markdown-body"></div>        </div>        <!-- 评论和点赞区域 -->
        <LazyCommentSection :article-id="article.id" />
          <!-- 底部返回按钮 -->
        <div class="article-bottom-actions mt-5 pt-4 border-top text-center">
          <button @click="goBackToList" class="btn btn-primary btn-lg">
            <i class="bi bi-arrow-left me-2"></i>
            返回上页
          </button>
        </div>
        </div>
      </div>
    </div>

    <div v-else class="alert alert-warning" role="alert">
      找不到文章
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { getApiUrl, API_CONFIG } from '../config/api.js';
import { useRoute, useRouter } from 'vue-router';
import LazyCommentSection from './LazyCommentSection.vue';
import ArticleStructure from './ArticleStructure.vue';
import hljs from 'highlight.js';
import katex from 'katex';

const route = useRoute();
const router = useRouter();
const article = ref(null);
const loading = ref(true);
const error = ref(null);

// 格式化日期的辅助函数
function formatDate(dateString) {
  if (!dateString) return '未知日期';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 获取分类名称
function getCategoryName(category) {
  const categoryMap = {
    'study': '学习',
    'game': '游戏',
    'work': '个人作品',
    'resource': '资源分享',
    'other': '其他'
  };
  return categoryMap[category] || '未分类';
}

// 获取分类徽章样式
function getCategoryBadgeClass(category) {
  const classMap = {
    'study': 'bg-primary',
    'game': 'bg-warning text-dark',
    'work': 'bg-success',
    'resource': 'bg-info text-dark',
    'other': 'bg-secondary'
  };
  return classMap[category] || 'bg-secondary';
}

async function fetchArticle() {
  const id = route.params.id;
  if (!id) {
    error.value = new Error('未提供文章ID');
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ARTICLE_BY_ID(id)));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    article.value = await response.json();
    
    // 在文章内容渲染后，处理数学公式和代码高亮
    nextTick(() => {
      setTimeout(() => {
        renderKatex();
        setTimeout(() => {
          highlightCode();
        }, 100);
      }, 100);
    });
  } catch (e) {
    error.value = e;
    console.error(`获取文章 ${id} 失败:`, e);
  } finally {
    loading.value = false;
  }
}

// 返回上一页，使用浏览器历史记录
const goBackToList = () => {
  console.log('使用浏览器后退功能返回上一页');
  
  // 检查是否有历史记录可以返回
  if (window.history.length > 1) {
    // 使用浏览器的后退功能
    router.go(-1);
  } else {
    // 如果没有历史记录，则回到首页
    console.log('没有历史记录，返回首页');
    router.push({ name: 'ArticleList' });
  }
};

// 渲染 KaTeX 数学公式
const renderKatex = () => {
  nextTick(() => {
    const articleContent = document.querySelector('.article-content-html');
    if (!articleContent) return;

    // 处理 $...$ 行内公式
    let content = articleContent.innerHTML;
    
    // 处理块级公式 $$...$$
    content = content.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, {
          throwOnError: false,
          displayMode: true
        });
      } catch (e) {
        console.warn('KaTeX block render error:', e);
        return match;
      }
    });
    
    // 处理行内公式 $...$
    content = content.replace(/\$([^$]+)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, {
          throwOnError: false,
          displayMode: false
        });
      } catch (e) {
        console.warn('KaTeX inline render error:', e);
        return match;
      }
    });
    
    articleContent.innerHTML = content;
  });
};

// 高亮代码块
const highlightCode = () => {
  nextTick(() => {
    const codeBlocks = document.querySelectorAll('.article-content-html pre code');
    codeBlocks.forEach((block) => {
      // 跳过已经被 KaTeX 处理过的元素
      if (block.className.includes('katex') || block.parentElement.className.includes('katex')) {
        return;
      }
      
      // 跳过数学公式
      const text = block.textContent;
      if ((text.startsWith('$') && text.endsWith('$')) || 
          (text.startsWith('$$') && text.endsWith('$$'))) {
        return;
      }
      
      hljs.highlightElement(block);
    });
  });
};

// 删除功能已经移除

onMounted(() => {
  fetchArticle();
});
</script>

<style scoped>
/* 文章主要内容区域 */
.article-main-content {
  max-width: 100%;
}

/* 大屏幕上为文章结构组件留出空间 */
@media (min-width: 1200px) {
  .article-main-content {
    margin-right: 300px; /* 为右侧固定的文章结构组件留出空间 */
  }
}

/* 文章结构组件样式 */
.article-structure-wrapper {
  position: fixed;
  top: 50%;
  right: 12%;
  transform: translateY(-50%);
  width: 280px;
  z-index: 1025;
  transition: all 0.3s ease;
}

/* 响应式调整 */
@media (max-width: 1399px) {
  .article-structure-wrapper {
    width: 260px;
    right: 15px;
  }
}

@media (max-width: 1199px) {
  .article-structure-wrapper {
    position: static;
    width: 100%;
    margin: 1rem 0;
    transform: none;
    right: auto;
    top: auto;
  }
}

@media (max-width: 991px) {
  .article-structure-wrapper {
    margin: 0.8rem 0;
  }
}

@media (max-width: 768px) {
  .article-structure-wrapper {
    margin: 0.5rem 0;
  }
}

/* 响应式容器样式 */
.article-container {
  width: 100%;
  padding-top: 70px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 0.5rem;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 封面图片样式 */
.article-cover {
  width: 100%;
  max-height: 400px;
  overflow: hidden;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.cover-image:hover {
  transform: scale(1.02);
}

.article-title {
  color: #343a40;
  margin-bottom: 0.5rem;
  font-size: 2rem;
  font-weight: 700;
  transition: color 0.3s ease;
}

.article-meta {
  color: #6c757d;
  margin-bottom: 1.5rem;
  transition: color 0.3s ease;
}

/* 底部操作区域样式 */
.article-bottom-actions {
  border-top: 2px solid #e9ecef;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 0 0 0.5rem 0.5rem;
  margin: 0 -1.25rem -1.25rem -1.25rem;
  padding: 2rem 1.25rem;
}

.article-bottom-actions .btn {
  padding: 0.75rem 2rem;
  font-weight: 600;
  border-radius: 2rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(13, 110, 253, 0.2);
}

.article-bottom-actions .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(13, 110, 253, 0.3);
}

/* 文章内容样式 - 基于 GitHub Markdown */
.article-content-html {
  line-height: 1.6;
  font-size: 18px !important;
  color: #24292f;
  transition: color 0.3s ease;
}

/* GitHub Markdown 样式覆盖 */
.article-content-html.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: none;
  margin: 0;
  padding: 0;
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji" !important;
  font-size: 18px !important;
  line-height: 1.5;
  background-color: transparent;
}

/* KaTeX 数学公式样式 */
.article-content-html .katex {
  font-size: 1.1em !important;
}

.article-content-html .katex-display {
  margin: 16px 0 !important;
  text-align: center;
}

.article-content-html .katex-html {
  display: inline !important;
}

.article-content-html .katex-display .katex-html {
  display: block !important;
}

.article-content-html.markdown-body h1,
.article-content-html.markdown-body h2,
.article-content-html.markdown-body h3,
.article-content-html.markdown-body h4,
.article-content-html.markdown-body h5,
.article-content-html.markdown-body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.article-content-html.markdown-body h1 {
  font-size: 2.1em !important;
  border-bottom: 1px solid #d0d7de;
  padding-bottom: .3em;
}

.article-content-html.markdown-body h2 {
  font-size: 1.6em !important;
  border-bottom: 1px solid #d0d7de;
  padding-bottom: .3em;
}

.article-content-html.markdown-body h3 {
  font-size: 1.4em !important;
}

.article-content-html.markdown-body h4 {
  font-size: 1.2em !important;
}

.article-content-html.markdown-body h5 {
  font-size: 1.05em !important;
}

.article-content-html.markdown-body h6 {
  font-size: 1em !important;
  color: #656d76;
}

.article-content-html.markdown-body p {
  margin-top: 0;
  margin-bottom: 18px;
  font-size: 19.2px !important;
}

.article-content-html.markdown-body blockquote {
  margin: 0;
  padding: 0 1em;
  color: #656d76;
  border-left: .25em solid #d0d7de;
  font-size: 19.2px !important;
}

.article-content-html.markdown-body code {
  padding: .2em .4em;
  margin: 0;
  font-size: 16px !important;
  background-color: rgba(175,184,193,0.2);
  border-radius: 6px;
  font-family: ui-monospace,SFMono-Regular,"SF Mono",Consolas,"Liberation Mono",Menlo,monospace;
}

.article-content-html.markdown-body pre {
  padding: 16px;
  overflow: auto;
  font-size: 16px !important;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 6px;
  margin: 16px 0;
  position: relative;
}

.article-content-html.markdown-body pre code {
  background-color: transparent;
  border: 0;
  display: inline;
  line-height: inherit;
  margin: 0;
  overflow: visible;
  padding: 0;
  word-wrap: normal;
}

/* 代码高亮样式增强 */
.article-content-html.markdown-body pre code.hljs {
  background-color: transparent !important;
  padding: 0 !important;
}

/* 确保代码块中的文本不会被 KaTeX 处理 */
.article-content-html.markdown-body pre code .katex {
  display: none;
}

.article-content-html.markdown-body table {
  border-spacing: 0;
  border-collapse: collapse;
  display: block;
  width: max-content;
  max-width: 100%;
  overflow: auto;
  margin: 16px 0;
}

.article-content-html.markdown-body table th,
.article-content-html.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid #d0d7de;
  font-size: 18px !important;
}

.article-content-html.markdown-body table th {
  font-weight: 600;
  background-color: #f6f8fa;
}

.article-content-html.markdown-body table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

.article-content-html.markdown-body ul,
.article-content-html.markdown-body ol {
  margin-top: 0;
  margin-bottom: 16px;
  padding-left: 2em;
  font-size: 19.2px !important;
}

.article-content-html.markdown-body li {
  margin: 0.25em 0;
  font-size: 19.2px !important;
}

.article-content-html.markdown-body a {
  color: #0969da;
  text-decoration: none;
}

.article-content-html.markdown-body a:hover {
  text-decoration: underline;
}

.article-content-html.markdown-body img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 16px 0;
}

.article-content-html.markdown-body hr {
  height: .25em;
  padding: 0;
  margin: 24px 0;
  background-color: #d0d7de;
  border: 0;
}

/* 暗色主题支持 - GitHub 风格 */
[data-bs-theme="dark"] .article-container {
  background-color: var(--bs-dark);
  color: #ffffff;
}

[data-bs-theme="dark"] .article-cover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

[data-bs-theme="dark"] .article-title {
  color: #ffffff;
}

[data-bs-theme="dark"] .article-meta {
  color: #adb5bd;
}

[data-bs-theme="dark"] .article-bottom-actions {
  border-top-color: #495057;
  background: linear-gradient(135deg, #2d3748, #1a1a1a);
}

[data-bs-theme="dark"] .article-content-html {
  color: #c9d1d9;
  font-size: 19.2px !important;
}

[data-bs-theme="dark"] .article-content-html.markdown-body h1,
[data-bs-theme="dark"] .article-content-html.markdown-body h2 {
  border-bottom-color: #21262d;
  color: #f0f6fc;
}

[data-bs-theme="dark"] .article-content-html.markdown-body h3,
[data-bs-theme="dark"] .article-content-html.markdown-body h4,
[data-bs-theme="dark"] .article-content-html.markdown-body h5 {
  color: #f0f6fc;
}

[data-bs-theme="dark"] .article-content-html.markdown-body h6 {
  color: #8b949e;
}

[data-bs-theme="dark"] .article-content-html.markdown-body p {
  color: #c9d1d9;
  font-size: 19.2px !important;
}

[data-bs-theme="dark"] .article-content-html.markdown-body blockquote {
  color: #8b949e;
  border-left-color: #3d444d;
  font-size: 19.2px !important;
}

[data-bs-theme="dark"] .article-content-html.markdown-body code {
  background-color: rgba(110,118,129,0.4);
  color: #e6edf3;
  font-size: 16px !important;
}

[data-bs-theme="dark"] .article-content-html.markdown-body pre {
  background-color: #161b22;
  color: #e6edf3;
  font-size: 16px !important;
}

[data-bs-theme="dark"] .article-content-html.markdown-body pre code {
  background-color: transparent;
  color: #e6edf3;
  font-size: 16px !important;
}

/* 暗色主题下的 KaTeX 样式 */
[data-bs-theme="dark"] .article-content-html .katex {
  color: #c9d1d9 !important;
}

[data-bs-theme="dark"] .article-content-html .katex-display {
  color: #c9d1d9 !important;
}

[data-bs-theme="dark"] .article-content-html.markdown-body table th,
[data-bs-theme="dark"] .article-content-html.markdown-body table td {
  border-color: #30363d;
  font-size: 18px !important;
}

[data-bs-theme="dark"] .article-content-html.markdown-body table th {
  background-color: #161b22;
  color: #f0f6fc;
}

[data-bs-theme="dark"] .article-content-html.markdown-body table tr:nth-child(2n) {
  background-color: #161b22;
}

[data-bs-theme="dark"] .article-content-html.markdown-body ul,
[data-bs-theme="dark"] .article-content-html.markdown-body ol {
  font-size: 19.2px !important;
}

[data-bs-theme="dark"] .article-content-html.markdown-body li {
  font-size: 19.2px !important;
}

[data-bs-theme="dark"] .article-content-html.markdown-body a {
  color: #58a6ff;
}

[data-bs-theme="dark"] .article-content-html.markdown-body a:hover {
  color: #79c0ff;
}

[data-bs-theme="dark"] .article-content-html.markdown-body hr {
  background-color: #21262d;
}

/* 自定义动画类 */
.header-fade-in {
  animation: fadeInDown 0.6s ease-out;
}
</style>