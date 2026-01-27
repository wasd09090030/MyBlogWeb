<template>
  <div class="md-editor-wrapper">
    <MdEditor
      v-model="localValue"
      :height="height"
      :toolbars="toolbars"
      preview-theme="github"
      code-theme="github"
      language="zh-CN"
      @on-change="handleChange"
      @on-save="handleSave"
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
      placeholder="请输入文章内容...支持 Markdown 语法和 HTML 标签"
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

const emit = defineEmits(['update:modelValue', 'save'])

// 本地状态，解决 v-model 不能直接用在 prop 上的问题
const localValue = ref(props.modelValue)

// 监听父组件传入的值变化
watch(() => props.modelValue, (newVal) => {
  if (newVal !== localValue.value) {
    localValue.value = newVal
  }
})

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

const handleSave = (text, html) => {
  emit('save', text, html)
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
}

.md-editor-dark {
  --md-bk-color: #1e1e1e !important;
}
</style>
