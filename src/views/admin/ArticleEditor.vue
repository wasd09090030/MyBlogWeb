<template>
  <div class="article-editor">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>{{ isEdit ? '编辑文章' : '创建文章' }}</h2>
      <button class="btn btn-outline-secondary" @click="goBack">
        <i class="bi bi-arrow-left me-2"></i>返回
      </button>
    </div>

    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
        
        <form v-else @submit.prevent="saveArticle">      
              <div class="mb-3">
            <label for="title" class="form-label">标题</label>
            <input 
              type="text" 
              class="form-control form-input" 
              id="title" 
              v-model="articleForm.title" 
              required
            >
          </div>

          <!-- 添加封面图URL输入 -->
          <div class="mb-3">
            <label for="coverImage" class="form-label">封面图片URL（可选）</label>
            <input 
              type="url" 
              class="form-control" 
              id="coverImage" 
              v-model="articleForm.coverImage" 
              placeholder="https://example.com/image.jpg"
            >
            <div class="form-text">请输入有效的图片URL地址</div>
              <!-- 封面图预览 -->
            <div v-if="articleForm.coverImage" class="mt-2">
              <small class="text-muted">封面图预览:</small>
              <div class="cover-preview mt-1">
                <img 
                  :src="articleForm.coverImage" 
                  alt="封面图预览" 
                  @error="handleImageError"
                  @load="handleImageLoad"
                />
              </div>
              <div v-if="!isValidImageUrl" class="mt-1">
                <small class="text-warning">
                  <i class="bi bi-exclamation-triangle me-1"></i>
                  图片预览加载失败，但这不影响保存文章。可能的原因：
                </small>
                <ul class="small text-muted mt-1 mb-0">
                  <li>图片服务器设置了跨域限制</li>
                  <li>网络连接问题</li>
                  <li>图片URL格式不正确</li>
                </ul>
                <small class="text-info">
                  <i class="bi bi-info-circle me-1"></i>
                  提示：如果图片在浏览器中能正常打开，通常在前端显示时也能正常加载
                </small>
              </div>
            </div>
          </div>
            <!-- 添加文章类别选择 -->
          <div class="mb-3">
            <label for="category" class="form-label">文章类别</label>
            <select 
              class="form-select" 
              id="category" 
              v-model="articleForm.category"
              required
            >
              <option value="study">学习</option>
              <option value="game">游戏</option>
              <option value="work">个人作品</option>
              <option value="resource">资源分享</option>
              <option value="other">其他</option>
            </select>
          </div>
            <div class="mb-3">
            <label class="form-label">内容 (Markdown编辑器)</label>
            <MdEditor
              v-model="articleForm.contentMarkdown"
              height="500px"
              :toolbars="toolbars"
              preview-theme="github"
              code-theme="github"
              language="zh-CN"
              @onChange="handleContentChange"
              :previewCssText="githubMarkdownCss"
              :htmlCopyable="true"
              :mdPreviewClass="'markdown-body'"
              required
            />
          </div>
          
          <div class="d-flex justify-content-between">
            <button type="button" class="btn btn-outline-secondary" @click="goBack">取消</button>
            <button type="submit" class="btn btn-primary action-btn" :disabled="isSaving">
              <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status"></span>
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import articleService from '../../services/articleService';
import MarkdownIt from 'markdown-it';

// 导入 md-editor-v3 编辑器及其样式
import { MdEditor, config } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';

// 设置中文界面
config({
  editorConfig: {
    languageUserDefined: {
      'zh-CN': {
        toolbarTips: {
          bold: '加粗',
          underline: '下划线',
          italic: '斜体',
          strikeThrough: '删除线',
          title: '标题',
          sub: '下标',
          sup: '上标',
          quote: '引用',
          unorderedList: '无序列表',
          orderedList: '有序列表',
          task: '任务列表',
          codeRow: '行内代码',
          code: '块级代码',
          link: '链接',
          image: '图片',
          table: '表格',
          mermaid: 'Mermaid图',
          katex: 'Katex公式',
          revoke: '撤销',
          next: '重做',
          save: '保存',
          prettier: '美化',
          pageFullscreen: '浏览器全屏',
          fullscreen: '全屏',
          catalog: '目录',
          preview: '预览',
          htmlPreview: 'HTML预览',
          github: 'GitHub',
          help: '帮助'
        }
      }
    }
  }
});

const route = useRoute();
const router = useRouter();
const md = new MarkdownIt();

const articleForm = ref({
  title: '',
  contentMarkdown: '',
  coverImage: '', // 封面图URL
  category: 'study', // 默认类别
});

const loading = ref(false);
const isSaving = ref(false);
const isValidImageUrl = ref(false);
const isEdit = computed(() => !!route.params.id);

// GitHub Markdown CSS 样式配置
const githubMarkdownCss = `
  .markdown-body {
    box-sizing: border-box;
    min-width: 200px;
    max-width: 980px;
    margin: 0 auto;
    padding: 45px;
    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji";
    font-size: 16px;
    line-height: 1.5;
    color: #24292f;
    background-color: #ffffff;
  }
  
  .markdown-body h1,
  .markdown-body h2,
  .markdown-body h3,
  .markdown-body h4,
  .markdown-body h5,
  .markdown-body h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
  }
  
  .markdown-body h1 {
    font-size: 2em;
    border-bottom: 1px solid #d0d7de;
    padding-bottom: .3em;
  }
  
  .markdown-body h2 {
    font-size: 1.5em;
    border-bottom: 1px solid #d0d7de;
    padding-bottom: .3em;
  }
  
  .markdown-body h3 {
    font-size: 1.25em;
  }
  
  .markdown-body h4 {
    font-size: 1em;
  }
  
  .markdown-body h5 {
    font-size: .875em;
  }
  
  .markdown-body h6 {
    font-size: .85em;
    color: #656d76;
  }
  
  .markdown-body p {
    margin-top: 0;
    margin-bottom: 16px;
  }
  
  .markdown-body blockquote {
    margin: 0;
    padding: 0 1em;
    color: #656d76;
    border-left: .25em solid #d0d7de;
  }
  
  .markdown-body code {
    padding: .2em .4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(175,184,193,0.2);
    border-radius: 6px;
    font-family: ui-monospace,SFMono-Regular,"SF Mono",Consolas,"Liberation Mono",Menlo,monospace;
  }
  
  .markdown-body pre {
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 6px;
  }
  
  .markdown-body pre code {
    background-color: transparent;
    border: 0;
    display: inline;
    line-height: inherit;
    margin: 0;
    overflow: visible;
    padding: 0;
    word-wrap: normal;
  }
  
  .markdown-body table {
    border-spacing: 0;
    border-collapse: collapse;
    display: block;
    width: max-content;
    max-width: 100%;
    overflow: auto;
  }
  
  .markdown-body table th,
  .markdown-body table td {
    padding: 6px 13px;
    border: 1px solid #d0d7de;
  }
  
  .markdown-body table th {
    font-weight: 600;
    background-color: #f6f8fa;
  }
  
  .markdown-body table tr:nth-child(2n) {
    background-color: #f6f8fa;
  }
  
  .markdown-body ul,
  .markdown-body ol {
    margin-top: 0;
    margin-bottom: 16px;
    padding-left: 2em;
  }
  
  .markdown-body li {
    margin: 0.25em 0;
  }
  
  .markdown-body a {
    color: #0969da;
    text-decoration: none;
  }
  
  .markdown-body a:hover {
    text-decoration: underline;
  }
  
  .markdown-body img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
  }
  
  .markdown-body hr {
    height: .25em;
    padding: 0;
    margin: 24px 0;
    background-color: #d0d7de;
    border: 0;
  }
  
  /* 暗色主题适配 */
  @media (prefers-color-scheme: dark) {
    .markdown-body {
      color: #c9d1d9;
      background-color: #0d1117;
    }
    
    .markdown-body h1,
    .markdown-body h2 {
      border-bottom-color: #21262d;
    }
    
    .markdown-body h6 {
      color: #8b949e;
    }
    
    .markdown-body blockquote {
      color: #8b949e;
      border-left-color: #3d444d;
    }
    
    .markdown-body code {
      background-color: rgba(110,118,129,0.4);
    }
    
    .markdown-body pre {
      background-color: #161b22;
    }
    
    .markdown-body table th,
    .markdown-body table td {
      border-color: #30363d;
    }
    
    .markdown-body table th {
      background-color: #161b22;
    }
    
    .markdown-body table tr:nth-child(2n) {
      background-color: #161b22;
    }
    
    .markdown-body a {
      color: #58a6ff;
    }
    
    .markdown-body hr {
      background-color: #21262d;
    }
  }
`;

// 定义编辑器工具栏
const toolbars = [
  'bold', 'italic', 'strikethrough', 'heading', 'quote', 
  'code', 'link', 'image', 'table', 'list-ordered', 'list-unordered',
  'check', 'line', 'revoke', 'next', 'save', 'prettier',
  'preview', 'htmlPreview', 'fullscreen', 'pageFullscreen', 'catalog', 'help'
];

// 转换Markdown为HTML的计算属性
const htmlPreview = computed(() => {
  return md.render(articleForm.value.contentMarkdown || '');
});

// 处理编辑器内容变化
const handleContentChange = (text) => {
  articleForm.value.contentMarkdown = text;
};

// 验证图片URL是否有效
const validateImageUrl = (url) => {
  if (!url) {
    isValidImageUrl.value = false;
    return;
  }
  
  const img = new Image();
  img.onload = () => {
    isValidImageUrl.value = true;
  };
  img.onerror = () => {
    isValidImageUrl.value = false;
  };
  img.src = url;
};

// 处理图片加载成功
const handleImageLoad = () => {
  isValidImageUrl.value = true;
};

// 处理图片加载失败
const handleImageError = () => {
  isValidImageUrl.value = false;
};

// 监听封面图URL变化，实时验证
watch(() => articleForm.value.coverImage, (newUrl) => {
  if (!newUrl) {
    isValidImageUrl.value = false;
  } else {
    // 延迟验证，避免用户输入时频繁验证
    setTimeout(() => {
      validateImageUrl(newUrl);
    }, 500);
  }
});

// 获取文章详情
const fetchArticle = async (id) => {
  loading.value = true;
  try {
    const article = await articleService.getArticleById(id);
    articleForm.value = {
      title: article.title,
      contentMarkdown: article.contentMarkdown || article.content, // 兼容没有markdown字段的旧数据
      coverImage: article.coverImage || '', // 封面图URL
      category: article.category || 'study', // 兼容没有类别字段的旧数据
    };    // 如果有封面图，检查其有效性
    if (article.coverImage) {
      // 延迟检查图片加载状态
      setTimeout(() => {
        validateImageUrl(article.coverImage);
      }, 100);
    }
  } catch (error) {
    console.error('获取文章失败:', error);
    alert('获取文章失败: ' + error.message);
    goBack();
  } finally {
    loading.value = false;
  }
};

// 保存文章
const saveArticle = async () => {
  isSaving.value = true;
  
  try {
    // 将Markdown转换为HTML
    const htmlContent = md.render(articleForm.value.contentMarkdown);
      const payload = {
      title: articleForm.value.title,
      contentMarkdown: articleForm.value.contentMarkdown,
      content: htmlContent,
      coverImage: articleForm.value.coverImage || null, // 封面图URL，空值时设为null
      category: articleForm.value.category, // 添加类别字段
    };
    
    if (isEdit.value) {
      // 更新现有文章
      await articleService.updateArticle(route.params.id, payload);
      alert('文章已成功更新！');
    } else {
      // 创建新文章
      await articleService.createArticle(payload);
      alert('文章已成功创建！');
    }
    
    // 返回到文章列表
    router.push({ name: 'ArticleManager' });
  } catch (error) {
    console.error('保存文章失败:', error);
    alert('保存文章失败: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};

// 返回上一页
const goBack = () => {
  router.push({ name: 'ArticleManager' });
};

// 当组件加载时，如果是编辑模式则获取文章详情
onMounted(() => {
  if (isEdit.value) {
    fetchArticle(route.params.id);
  }
});
</script>

<style scoped>
/* 表单输入动画 */
.form-input {
  transition: all 0.3s ease;
  border: 2px solid #ced4da;
}

.form-input:focus {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
  border-color: #86b7fe;
}

/* 按钮动画 */
.action-btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.action-btn:hover::before {
  left: 100%;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:active {
  transform: translateY(0) scale(0.98);
}

/* Markdown编辑器容器动画 */
.markdown-editor-container {
  transition: all 0.3s ease;
}

.markdown-editor-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* 封面图预览样式 */
.cover-preview {
  max-width: 300px;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  overflow: hidden;
}

.cover-preview img {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
  display: block;
}

/* 编辑器样式覆盖 */
:deep(.md-editor) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
}

:deep(.md-editor-toolbar) {
  border-bottom: 1px solid #ced4da;
  background-color: #f8f9fa;
}

:deep(.md-editor-preview) {
  padding: 16px;
  font-size: 16px;
  line-height: 1.6;
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji";
}

/* 确保预览区域使用 GitHub 样式 */
:deep(.md-editor-preview-wrapper) {
  padding: 0;
}

:deep(.md-editor-preview .markdown-body) {
  max-width: none;
  margin: 0;
  padding: 16px;
}

:deep(.md-editor-input) {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace !important;
  font-size: 14px;
  line-height: 1.6;
  padding: 16px !important;
}
</style>
