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
            <div class="editor-info mb-2">
              <small class="text-info">
                <i class="bi bi-info-circle me-1"></i>
                支持 Markdown 语法和 HTML 标签混合使用，例如：
                <code>&lt;div style="color: red;"&gt;红色文字&lt;/div&gt;</code>
              </small>
            </div>
            <MdEditor
              v-model="articleForm.contentMarkdown"
              height="500px"
              :toolbars="toolbars"
              preview-theme="github"
              code-theme="github"
              language="zh-CN"
              @onChange="handleContentChange"
              @onSave="handleSave"
              @onUploadImg="handleUploadImg"
              :previewCssText="githubMarkdownCss"
              :htmlCopyable="true"
              :mdPreviewClass="'markdown-body'"
              :scrollAuto="true"
              :autoFocus="true"
              :autoDetectCode="true"
              :noPrettier="false"
              :tabSize="2"
              :tableShape="[6, 4]"
              :showCodeRowNumber="true"
              :previewOnly="false"
              :editorId="'article-editor'"
              :noMermaid="false"
              :noKatex="false"
              :sanitize="sanitizeHtml"
              :maxLength="100000"
              :autoSave="true"
              :placeholder="'请输入文章内容...支持 Markdown 语法和 HTML 标签'"
              :sanitizeHtml="false"
              :htmlMode="true"
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
          mermaid: 'Mermaid图表',
          katex: 'KaTeX数学公式',
          revoke: '撤销',
          next: '重做',
          save: '保存',
          prettier: '美化代码',
          pageFullscreen: '页面全屏',
          fullscreen: '编辑器全屏',
          catalog: '目录导航',
          preview: '预览模式',
          htmlPreview: 'HTML源码预览',
          github: 'GitHub',
          help: '帮助文档'
        },
        titleItem: {
          h1: '一级标题',
          h2: '二级标题',
          h3: '三级标题',
          h4: '四级标题',
          h5: '五级标题',
          h6: '六级标题'
        },
        imgTitleItem: {
          link: '添加链接',
          upload: '上传图片',
          clip2upload: '剪贴板上传'
        },
        linkModalTips: {
          linkTitle: '添加链接',
          imageTitle: '添加图片',
          descLabel: '链接描述：',
          descLabelPlaceHolder: '请输入描述...',
          urlLabel: '链接地址：',
          urlLabelPlaceHolder: '请输入链接地址...',
          buttonOK: '确定',
          buttonCancel: '取消'
        },
        clipModalTips: {
          title: '剪贴板图片上传',
          buttonUpload: '上传'
        },
        copyCode: {
          text: '复制代码',
          successTips: '已复制！',
          failTips: '复制失败！'
        },
        mermaid: {
          flow: '流程图',
          sequence: '时序图',
          gantt: '甘特图',
          class: '类图',
          state: '状态图',
          pie: '饼图',
          relationship: '关系图',
          journey: '旅程图'
        },
        katex: {
          inline: '行内公式',
          block: '块级公式'
        },
        footer: {
          markdownTotal: '字数',
          scrollAuto: '同步滚动'
        }
      }
    }
  }
});

const route = useRoute();
const router = useRouter();

// 配置 MarkdownIt 支持 HTML 标签和更多功能
const md = new MarkdownIt({
  html: true,        // 启用HTML标签
  xhtmlOut: false,   // 使用HTML5标准
  breaks: true,      // 支持换行符转换
  linkify: true,     // 自动识别链接
  typographer: true, // 启用排版增强
});

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
    font-size: 19.2px; /* 16px * 1.2 */
    line-height: 1.6;
    color: #24292f;
    background-color: #ffffff;
  }
  
  .markdown-body h1,
  .markdown-body h2,
  .markdown-body h3,
  .markdown-body h4,
  .markdown-body h5,
  .markdown-body h6 {
    margin-top: 28px;
    margin-bottom: 18px;
    font-weight: 600;
    line-height: 1.3;
  }
  
  .markdown-body h1 {
    font-size: 2.4em; /* 增大标题 */
    border-bottom: 1px solid #d0d7de;
    padding-bottom: .4em;
  }
  
  .markdown-body h2 {
    font-size: 1.8em; /* 增大标题 */
    border-bottom: 1px solid #d0d7de;
    padding-bottom: .4em;
  }
  
  .markdown-body h3 {
    font-size: 1.5em; /* 增大标题 */
  }
  
  .markdown-body h4 {
    font-size: 1.2em; /* 增大标题 */
  }
  
  .markdown-body h5 {
    font-size: 1.05em; /* 增大标题 */
  }
  
  .markdown-body h6 {
    font-size: 1em; /* 增大标题 */
    color: #656d76;
  }
  
  .markdown-body p {
    margin-top: 0;
    margin-bottom: 18px; /* 增加段落间距 */
    font-size: 19.2px; /* 确保正文大小 */
    line-height: 1.6;
  }
  
  .markdown-body blockquote {
    margin: 0;
    padding: 0 1.2em; /* 增加引用内边距 */
    color: #656d76;
    border-left: .3em solid #d0d7de; /* 增粗引用线 */
    font-size: 18px; /* 引用字体稍小 */
    line-height: 1.5;
  }
  
  .markdown-body code {
    padding: .3em .5em; /* 增加代码内边距 */
    margin: 0;
    font-size: 16px; /* 代码字体稍小但保持可读性 */
    background-color: rgba(175,184,193,0.2);
    border-radius: 6px;
    font-family: ui-monospace,SFMono-Regular,"SF Mono",Consolas,"Liberation Mono",Menlo,monospace;
  }
  
  .markdown-body pre {
    padding: 20px; /* 增加代码块内边距 */
    overflow: auto;
    font-size: 16px; /* 代码块字体大小 */
    line-height: 1.5;
    background-color: #f6f8fa;
    border-radius: 8px; /* 增大圆角 */
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
    font-size: 16px; /* 保持代码字体大小 */
  }
  
  .markdown-body table {
    border-spacing: 0;
    border-collapse: collapse;
    display: block;
    width: max-content;
    max-width: 100%;
    overflow: auto;
    font-size: 18px; /* 表格字体 */
  }
  
  .markdown-body table th,
  .markdown-body table td {
    padding: 8px 16px; /* 增加表格单元格内边距 */
    border: 1px solid #d0d7de;
  }
  
  .markdown-body table th {
    font-weight: 600;
    background-color: #f6f8fa;
    font-size: 18px; /* 表头字体 */
  }
  
  .markdown-body table tr:nth-child(2n) {
    background-color: #f6f8fa;
  }
  
  .markdown-body ul,
  .markdown-body ol {
    margin-top: 0;
    margin-bottom: 18px; /* 增加列表间距 */
    padding-left: 2.4em; /* 增加列表缩进 */
    font-size: 19.2px; /* 列表字体大小 */
    line-height: 1.6;
  }
  
  .markdown-body li {
    margin: 0.4em 0; /* 增加列表项间距 */
  }
  
  .markdown-body a {
    color: #0969da;
    text-decoration: none;
    font-size: inherit; /* 继承父元素字体大小 */
  }
  
  .markdown-body a:hover {
    text-decoration: underline;
  }
  
  .markdown-body img {
    max-width: 100%;
    height: auto;
    border-radius: 8px; /* 增大图片圆角 */
  }
  
  .markdown-body hr {
    height: .3em; /* 增粗分割线 */
    padding: 0;
    margin: 28px 0; /* 增加分割线间距 */
    background-color: #d0d7de;
    border: 0;
  }
  
  /* 支持自定义HTML标签样式 */
  .markdown-body div,
  .markdown-body span {
    font-size: inherit;
    line-height: inherit;
    color: inherit;
  }
  
  .markdown-body center {
    text-align: center;
    margin: 16px 0;
  }
  
  .markdown-body mark {
    background-color: #fff3cd;
    padding: 0.2em 0.4em;
    border-radius: 3px;
  }
  
  .markdown-body small {
    font-size: 0.875em;
    color: #6c757d;
  }
  
  .markdown-body kbd {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 3px;
    padding: 0.2em 0.4em;
    font-size: 0.875em;
    font-family: ui-monospace,SFMono-Regular,"SF Mono",Consolas,"Liberation Mono",Menlo,monospace;
  }
  
  /* 支持常用的内联样式 */
  .markdown-body [style*="color"] {
    /* 保持用户自定义颜色 */
  }
  
  .markdown-body [style*="background"] {
    /* 保持用户自定义背景 */
  }
  
  .markdown-body [style*="text-align"] {
    /* 保持用户自定义对齐方式 */
  }
  
  /* 暗色主题适配 */
  @media (prefers-color-scheme: dark) {
    .markdown-body {
      color: #c9d1d9;
      background-color: #0d1117;
      font-size: 19.2px; /* 保持大字体 */
      line-height: 1.6;
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
      font-size: 18px; /* 保持引用字体大小 */
    }
    
    .markdown-body code {
      background-color: rgba(110,118,129,0.4);
      font-size: 16px; /* 保持代码字体大小 */
    }
    
    .markdown-body pre {
      background-color: #161b22;
      font-size: 16px; /* 保持代码块字体大小 */
    }
    
    .markdown-body pre code {
      font-size: 16px; /* 保持代码字体大小 */
    }
    
    .markdown-body table {
      font-size: 18px; /* 保持表格字体大小 */
    }
    
    .markdown-body table th {
      font-size: 18px; /* 保持表头字体大小 */
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
    
    .markdown-body ul,
    .markdown-body ol {
      font-size: 19.2px; /* 保持列表字体大小 */
      line-height: 1.6;
    }
    
    .markdown-body p {
      font-size: 19.2px; /* 保持正文字体大小 */
      line-height: 1.6;
    }
    
    .markdown-body a {
      color: #58a6ff;
    }
    
    .markdown-body hr {
      background-color: #21262d;
    }
    
    /* 暗色主题下的自定义HTML标签支持 */
    .markdown-body mark {
      background-color: #ffc107;
      color: #000;
    }
    
    .markdown-body small {
      color: #8b949e;
    }
    
    .markdown-body kbd {
      background-color: #21262d;
      border-color: #30363d;
      color: #e6edf3;
    }
  }
`;

// 定义编辑器工具栏 - 完整配置
const toolbars = [
  // 文本格式化
  'bold', 'underline', 'italic', 'strikeThrough',
  '-', // 分隔符
  // 标题
  'title', 'sub', 'sup',
  '-',
  // 引用和列表
  'quote', 'unorderedList', 'orderedList', 'task',
  '-',
  // 代码
  'codeRow', 'code',
  '-',
  // 链接和媒体
  'link', 'image', 'table',
  '-',
  // 高级功能
  'mermaid', 'katex',
  '-',
  // 操作
  'revoke', 'next',
  '-',
  // 工具
  'save', 'prettier',
  '-',
  // 视图
  'pageFullscreen', 'fullscreen', 'preview', 'htmlPreview', 'catalog'
];

// 转换Markdown为HTML的计算属性
const htmlPreview = computed(() => {
  return md.render(articleForm.value.contentMarkdown || '');
});

// 处理编辑器内容变化
const handleContentChange = (text) => {
  articleForm.value.contentMarkdown = text;
};

// 处理编辑器保存事件
const handleSave = (text, html) => {
  articleForm.value.contentMarkdown = text;
  console.log('自动保存触发:', { textLength: text.length, htmlLength: html.length });
};

// 处理编辑器上传图片事件
const handleUploadImg = async (files, callback) => {
  try {
    // 这里可以实现图片上传到服务器的逻辑
    // 目前只是一个示例，实际需要根据后端API来实现
    console.log('上传图片:', files);
    
    // 模拟上传成功，返回图片URL
    // 实际项目中需要调用真实的上传API
    const urls = files.map((file, index) => {
      // 创建本地预览URL（仅用于演示）
      return URL.createObjectURL(file);
    });
    
    callback(urls);
  } catch (error) {
    console.error('图片上传失败:', error);
    alert('图片上传失败，请稍后重试');
  }
};

// HTML 内容净化函数 - 允许更多安全的HTML标签
const sanitizeHtml = (html) => {
  // 定义允许的HTML标签和属性
  const allowedTags = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr', 'div', 'span',
    'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'blockquote', 'pre', 'code', 'kbd', 'samp', 'var',
    'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'details', 'summary',
    'sub', 'sup', 'small', 'mark',
    'abbr', 'acronym', 'cite', 'q', 'time',
    'center', 'align', // 支持一些常用的布局标签
  ];
  
  const allowedAttributes = [
    'href', 'src', 'alt', 'title', 'class', 'id', 'style',
    'target', 'rel', 'width', 'height', 'align', 'valign',
    'border', 'cellpadding', 'cellspacing', 'colspan', 'rowspan',
    'data-*', 'aria-*' // 支持数据属性和无障碍属性
  ];
  
  // 只移除明显危险的内容，保留大部分HTML功能
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // 移除script标签
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '') // 移除iframe（可选，根据需要调整）
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // 移除事件处理器
    .replace(/javascript\s*:/gi, '') // 移除javascript协议
    .replace(/vbscript\s*:/gi, '') // 移除vbscript协议
    .replace(/data\s*:/gi, 'unsafe-data:') // 处理data协议（可选）
    // 保留其他HTML标签和属性
    ;
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
      category: article.category ? article.category.toLowerCase() : 'study', // 将后端的大写枚举转换为小写
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
      category: articleForm.value.category.charAt(0).toUpperCase() + articleForm.value.category.slice(1), // 转换为首字母大写
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
  padding: 8px 16px;
  flex-wrap: wrap;
}

:deep(.md-editor-toolbar-item) {
  margin: 2px 1px;
  transition: all 0.2s ease;
}

:deep(.md-editor-toolbar-item:hover) {
  background-color: rgba(13, 110, 253, 0.1);
  border-radius: 4px;
}

:deep(.md-editor-toolbar .toolbar-separator) {
  margin: 0 4px;
  border-left: 1px solid #dee2e6;
  height: 20px;
}

:deep(.md-editor-preview) {
  padding: 20px; /* 增加内边距 */
  font-size: 19.2px; /* 与正文保持一致 */
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
  padding: 20px; /* 增加内边距 */
  font-size: 19.2px; /* 确保字体大小 */
  line-height: 1.6;
}

:deep(.md-editor-input) {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace !important;
  font-size: 16px; /* 编辑区字体稍小，便于编辑 */
  line-height: 1.6;
  padding: 20px !important; /* 增加内边距 */
}

/* Mermaid 图表样式 */
:deep(.md-editor-preview .mermaid) {
  text-align: center;
  margin: 16px 0;
}

/* KaTeX 数学公式样式 */
:deep(.md-editor-preview .katex) {
  font-size: 1.1em;
}

:deep(.md-editor-preview .katex-display) {
  margin: 16px 0;
  text-align: center;
}

/* 代码块样式增强 */
:deep(.md-editor-preview pre) {
  position: relative;
  border-radius: 6px;
  background-color: #f6f8fa;
}

:deep(.md-editor-preview pre code) {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

/* 表格样式增强 */
:deep(.md-editor-preview table) {
  margin: 16px 0;
  border-radius: 6px;
  overflow: hidden;
}

/* 任务列表样式 */
:deep(.md-editor-preview .task-list-item) {
  list-style: none;
  margin: 4px 0;
}

:deep(.md-editor-preview .task-list-item input[type="checkbox"]) {
  margin-right: 8px;
}

/* 引用块样式增强 */
:deep(.md-editor-preview blockquote) {
  border-left: 4px solid #0969da;
  background-color: rgba(9, 105, 218, 0.05);
  border-radius: 0 6px 6px 0;
  margin: 16px 0;
}

/* 链接样式增强 */
:deep(.md-editor-preview a) {
  position: relative;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

:deep(.md-editor-preview a:hover) {
  border-bottom-color: #0969da;
}
</style>
