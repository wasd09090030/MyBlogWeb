<template>
  <div class="md-editor-wrapper">
    <!-- MDC 组件快捷工具栏 -->
<<<<<<< HEAD
    <div class="mdc-toolbar bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-lg p-2 flex items-center gap-2">
      <span class="text-xs font-semibold text-gray-600 dark:text-gray-400 mr-2">MDC 组件:</span>
      <n-button-group size="small">
        <n-button @click="insertTemplate('alert')" quaternary title="插入 Alert 提示框">
          💡 Alert
        </n-button>
        <n-button @click="insertTemplate('tabs')" quaternary title="插入 Tabs 标签页">
          📑 Tabs
        </n-button>
        <n-button @click="insertTemplate('collapse')" quaternary title="插入 Collapse 折叠">
          📦 Collapse
        </n-button>
        <n-button @click="insertTemplate('codePlayground')" quaternary title="插入代码演示">
          💻 Code
        </n-button>
        <n-button @click="insertTemplate('imageComparison')" quaternary title="插入图片对比">
          🖼️ Image
        </n-button>
        <n-button @click="insertTemplate('webEmbed')" quaternary title="插入视频嵌入">
          🎬 Video
        </n-button>
        <n-button @click="insertTemplate('starRating')" quaternary title="插入星级评分">
          ⭐ Rating
        </n-button>
      </n-button-group>
=======
    <div class="mdc-toolbar bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-lg p-2">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs font-semibold text-gray-600 dark:text-gray-400 mr-2">MDC 组件:</span>
        <n-button-group size="small">
          <n-button @click="insertTemplate('alert')" quaternary title="插入 Alert 提示框">
            💡 Alert
          </n-button>
          <n-button @click="insertTemplate('tabs')" quaternary title="插入 Tabs 标签页">
            📑 Tabs
          </n-button>
          <n-button @click="insertTemplate('collapse')" quaternary title="插入 Collapse 折叠">
            📦 Collapse
          </n-button>
          <n-button @click="insertTemplate('codePlayground')" quaternary title="插入代码演示">
            💻 Code
          </n-button>
          <n-button @click="insertTemplate('imageComparison')" quaternary title="插入图片对比">
            🖼️ Compare
          </n-button>
          <n-button @click="insertTemplate('webEmbed')" quaternary title="插入视频嵌入">
            🎬 Video
          </n-button>
          <n-button @click="insertTemplate('starRating')" quaternary title="插入星级评分">
            ⭐ Rating
          </n-button>
        </n-button-group>
        <n-button-group size="small">
          <n-button @click="insertTemplate('steps')" quaternary title="插入步骤条">
            🔢 Steps
          </n-button>
          <n-button @click="insertTemplate('githubCard')" quaternary title="插入 GitHub 卡片">
            🐙 GitHub
          </n-button>
          <n-button @click="insertTemplate('imageEnhanced')" quaternary title="插入增强图片">
            🎨 Image+
          </n-button>
          <n-button @click="insertTemplate('fileTree')" quaternary title="插入文件树">
            📁 Tree
          </n-button>
        </n-button-group>
      </div>
>>>>>>> 960c065 (mdc功能模块添加)
    </div>
    
    <!-- Markdown 编辑器 -->
    <MdEditor
      ref="editorRef"
      v-model="localValue"
      :height="height"
      :toolbars="toolbars"
      preview-theme="github"
      code-theme="github"
      language="zh-CN"
      @on-change="handleChange"
      @on-save="handleSave"
      @on-html-changed="handleHtmlChanged"
      @on-upload-img="handleUploadImg"
      :scroll-auto="true"
      :auto-focus="true"
      :auto-detect-code="true"
      :tab-size="2"
      :table-shape="[6, 4]"
      :show-code-row-number="true"
      :no-mermaid="false"
      :no-katex="false"
      :max-length="100000"
      :auto-save="true"
      placeholder="请输入文章内容...支持 Markdown 语法、HTML 标签和 MDC 组件"
    />
  </div>
</template>

<script setup>
import { MdEditor, config } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

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
          htmlPreview: 'HTML源码预览'
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
})

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  height: {
    type: String,
    default: '500px'
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'html-change'])

const editorRef = ref(null)

// 本地状态，解决 v-model 不能直接用在 prop 上的问题
const localValue = ref(props.modelValue)

// 监听父组件传入的值变化
watch(() => props.modelValue, (newVal) => {
  if (newVal !== localValue.value) {
    localValue.value = newVal
  }
})

// 插入 MDC 模板 — 使用 md-editor-v3 的 insert() 暴露方法在光标处插入
const insertTemplate = (templateName) => {
  const template = mdcTemplates[templateName]
  if (!template) return

  // md-editor-v3 的 ExposeParam.insert 接受一个 generator 函数
  // generator 参数为当前选中文本，返回 { targetValue, select, deviationStart, deviationEnd }
  if (editorRef.value?.insert) {
    editorRef.value.insert((_selectedText) => {
      return {
        targetValue: '\n\n' + template + '\n\n',
        select: false,
        deviationStart: 0,
        deviationEnd: 0
      }
    })
  } else {
    // 降级：直接追加到末尾
    localValue.value += '\n\n' + template
    emit('update:modelValue', localValue.value)
  }
}

// MDC 组件模板
const mdcTemplates = {
  alert: `::alert{type="info"}
#title
提示标题
#default
这是提示内容，支持 **Markdown** 格式
::`,
  
  tabs: `::tabs
---
labels: ["选项卡 1", "选项卡 2", "选项卡 3"]
---
#tab-0
第一个标签页的内容

#tab-1
第二个标签页的内容

#tab-2
第三个标签页的内容
::`,
  
  collapse: `::collapse{title="点击展开更多内容"}
这里是折叠的内容，可以包含任何 Markdown 元素
::`,
  
  codePlayground: `::code-playground{lang="javascript" title="JavaScript 示例" editable runnable}
console.log('Hello World!')
const sum = (a, b) => a + b
console.log(sum(2, 3))
::`,
  
  imageComparison: `::image-comparison{before="/img/before.jpg" after="/img/after.jpg" aspectRatio="16/9"}
::`,
  
  webEmbed: `::web-embed{url="https://www.bilibili.com/video/BV1xx411c7mD" aspectRatio="16/9"}
::`,
  
  starRating: `::star-rating{rating="4.5" maxStars="5" label="推荐指数" showScore}
<<<<<<< HEAD
=======
::`,
  
  steps: `::steps{current="2" status="process" showControls clickable}
---
steps:
  - title: "第一步"
    description: "注册账号"
  - title: "第二步"
    description: "完善信息"
  - title: "第三步"
    description: "开始使用"
---
::`,
  
  githubCard: `::github-card{repo="vuejs/core"}
::`,
  
  imageEnhanced: `::image-enhanced{src="/img/photo.jpg" caption="图片说明文字" zoomable shadow rounded}
::`,
  
  fileTree: `::file-tree{title="项目结构"}
src/
  components/
    Button.vue
    Input.vue
  pages/
    index.vue
  App.vue
package.json
README.md
>>>>>>> 960c065 (mdc功能模块添加)
::`
}

// 定义编辑器工具栏
const toolbars = [
  'bold', 'underline', 'italic', 'strikeThrough',
  '-',
  'title', 'sub', 'sup',
  '-',
  'quote', 'unorderedList', 'orderedList', 'task',
  '-',
  'codeRow', 'code',
  '-',
  'link', 'image', 'table',
  '-',
  'mermaid', 'katex',
  '-',
  'revoke', 'next',
  '-',
  'save', 'prettier',
  '-',
  'pageFullscreen', 'fullscreen', 'preview', 'htmlPreview', 'catalog'
]

const handleChange = (text) => {
  localValue.value = text
  emit('update:modelValue', text)
}

const handleSave = async (text, htmlPromise) => {
  const html = await htmlPromise
  emit('save', text, html)
}

const handleHtmlChanged = (html) => {
  emit('html-change', html)
}

const handleUploadImg = async (files, callback) => {
  try {
    console.log('上传图片:', files)
    // 创建本地预览URL
    const urls = files.map((file) => URL.createObjectURL(file))
    callback(urls)
  } catch (error) {
    console.error('图片上传失败:', error)
  }
}
</script>

<style>
/* md-editor-v3 样式覆盖 */
.md-editor {
  --md-bk-color: var(--n-color) !important;
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}

.md-editor-dark {
  --md-bk-color: #1e1e1e !important;
}

.mdc-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .mdc-toolbar {
    font-size: 0.75rem;
  }
}
</style>
