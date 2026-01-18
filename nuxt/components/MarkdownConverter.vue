<template>
  <div class="markdown-converter">
    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab-pane name="editor" tab="编辑器">
        <div class="converter-layout">
          <div class="editor-section">
            <div class="section-header">
              <h3>Markdown 输入</h3>
              <n-button-group size="small">
                <n-button @click="loadExample">
                  <template #icon>
                    <Icon name="lightbulb" size="sm" />
                  </template>
                  示例
                </n-button>
                <n-button @click="clearContent">
                  <template #icon>
                    <Icon name="trash" size="sm" />
                  </template>
                  清空
                </n-button>
              </n-button-group>
            </div>
            <n-input
              v-model:value="markdownContent"
              type="textarea"
              placeholder="在此输入 Markdown 内容..."
              :rows="20"
              :autosize="{ minRows: 20, maxRows: 30 }"
              class="markdown-input"
            />
          </div>

          <div class="preview-section">
            <div class="section-header">
              <h3>实时预览</h3>
            </div>
            <div class="preview-container" ref="previewRef">
              <MarkdownRenderer 
                v-if="markdownContent" 
                :markdown="markdownContent"
              />
              <div v-else class="empty-preview">
                <Icon name="eye" size="xl" />
                <p>预览区域将显示渲染后的内容</p>
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="settings" tab="导出设置">
        <div class="settings-panel">
          <n-form label-placement="left" label-width="120">
            <n-form-item label="文档标题">
              <n-input 
                v-model:value="exportSettings.title" 
                placeholder="我的文档"
              />
            </n-form-item>
            
            <n-form-item label="作者">
              <n-input 
                v-model:value="exportSettings.author" 
                placeholder="作者名称"
              />
            </n-form-item>

            <n-form-item label="页面大小">
              <n-select 
                v-model:value="exportSettings.pageSize" 
                :options="pageSizeOptions"
              />
            </n-form-item>

            <n-form-item label="页边距">
              <n-select 
                v-model:value="exportSettings.margin" 
                :options="marginOptions"
              />
            </n-form-item>

            <n-form-item label="包含目录">
              <n-switch v-model:value="exportSettings.includeToc" />
            </n-form-item>
          </n-form>
        </div>
      </n-tab-pane>
    </n-tabs>

    <div class="export-actions">
      <n-space justify="center" size="large">
        <n-button
          type="primary"
          size="large"
          :loading="isExporting"
          :disabled="!markdownContent"
          @click="exportToPDF"
        >
          <template #icon>
            <Icon name="file-pdf" size="md" />
          </template>
          导出为 PDF
        </n-button>
        
        <n-button
          type="success"
          size="large"
          :loading="isExporting"
          :disabled="!markdownContent"
          @click="exportToDOCX"
        >
          <template #icon>
            <Icon name="file-word" size="md" />
          </template>
          导出为 DOCX
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup>
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'

const message = useMessage()
const activeTab = ref('editor')
const markdownContent = ref('')
const isExporting = ref(false)
const previewRef = ref(null)

// 动态导入 html2pdf（仅客户端）
let html2pdf = null
if (process.client) {
  import('html2pdf.js').then(module => {
    html2pdf = module.default
  })
}

const exportSettings = ref({
  title: '我的文档',
  author: '',
  pageSize: 'a4',
  margin: 'normal',
  includeToc: false
})

const pageSizeOptions = [
  { label: 'A4', value: 'a4' },
  { label: 'A3', value: 'a3' },
  { label: 'Letter', value: 'letter' },
  { label: 'Legal', value: 'legal' }
]

const marginOptions = [
  { label: '正常 (2cm)', value: 'normal' },
  { label: '窄 (1cm)', value: 'narrow' },
  { label: '宽 (3cm)', value: 'wide' }
]

const marginMap = {
  normal: [20, 20, 20, 20],
  narrow: [10, 10, 10, 10],
  wide: [30, 30, 30, 30]
}

// 加载示例内容
const loadExample = () => {
  markdownContent.value = `# Markdown 转换示例

## 这是一个二级标题

这是一段普通文本。支持 **粗体**、*斜体*、\`行内代码\`。

### 代码块示例

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`)
}

greet('World')
\`\`\`

### 列表示例

**无序列表：**
- 项目一
- 项目二
  - 子项目 2.1
  - 子项目 2.2
- 项目三

**有序列表：**
1. 第一步
2. 第二步
3. 第三步

### 表格示例

| 功能 | 支持 | 备注 |
|------|------|------|
| PDF导出 | ✅ | 高质量输出 |
| DOCX导出 | ✅ | 兼容Office |
| 代码高亮 | ✅ | 多语言支持 |

### 引用

> 这是一段引用文本
> 可以包含多行内容

### 数学公式（如果支持）

行内公式：$E = mc^2$

块级公式：
$$
\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$

### 链接和图片

[访问我的博客](https://example.com)

---

*生成时间：${new Date().toLocaleString()}*
`
}

// 清空内容
const clearContent = () => {
  markdownContent.value = ''
}

// 导出为 PDF
const exportToPDF = async () => {
  if (!markdownContent.value) {
    message.warning('请先输入 Markdown 内容')
    return
  }

  if (!html2pdf) {
    message.error('PDF 导出功能加载中，请稍后重试')
    return
  }

  isExporting.value = true
  
  try {
    // 等待 DOM 更新
    await nextTick()
    
    // 额外等待一小段时间确保 Markdown 渲染完成
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 获取预览容器
    const container = previewRef.value
    if (!container) {
      throw new Error('无法获取预览容器')
    }
    
    // 查找渲染后的内容
    let previewElement = container.querySelector('.markdown-renderer')
    
    // 检查是否有实际内容
    if (!previewElement || !previewElement.querySelector('article, .prose, p, h1, h2, h3')) {
      // 尝试其他选择器
      previewElement = container.querySelector('article') || container
    }
    
    // 确保有内容
    if (!previewElement.innerHTML.trim()) {
      throw new Error('预览内容为空，请先输入 Markdown')
    }

    // 克隆元素以避免影响页面显示
    const clonedElement = previewElement.cloneNode(true)
    
    // 移除骨架屏等加载状态元素
    clonedElement.querySelectorAll('.animate-pulse, .skeleton').forEach(el => el.remove())
    
    // 设置导出选项
    const opt = {
      margin: marginMap[exportSettings.value.margin],
      filename: `${exportSettings.value.title || 'document'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: exportSettings.value.pageSize, 
        orientation: 'portrait' 
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }

    // 生成 PDF
    await html2pdf().set(opt).from(clonedElement).save()
    
    message.success('PDF 导出成功！')
  } catch (error) {
    console.error('PDF 导出失败:', error)
    message.error(`PDF 导出失败: ${error.message}`)
  } finally {
    isExporting.value = false
  }
}

// 导出为 DOCX
const exportToDOCX = async () => {
  if (!markdownContent.value) {
    message.warning('请先输入 Markdown 内容')
    return
  }

  isExporting.value = true
  
  try {
    // 解析 Markdown 内容
    const lines = markdownContent.value.split('\n')
    const docChildren = []
    let inCodeBlock = false
    let codeBlockLines = []
    let codeLanguage = ''
    let inTable = false
    let tableLines = []

    const addCodeBlock = () => {
      if (codeBlockLines.length > 0) {
        // 代码块标题
        docChildren.push(new Paragraph({
          children: [new TextRun({
            text: `代码块${codeLanguage ? ` (${codeLanguage})` : ''}`,
            bold: true,
            color: '666666'
          })],
          spacing: { before: 200, after: 100 }
        }))
        
        // 代码内容 - 使用等宽字体和背景色效果
        codeBlockLines.forEach(line => {
          docChildren.push(new Paragraph({
            children: [new TextRun({
              text: line || ' ',
              font: 'Courier New',
              size: 20,
              color: '333333'
            })],
            shading: {
              fill: 'F5F5F5'
            },
            spacing: { before: 0, after: 0 },
            indent: { left: 360 }
          }))
        })
        
        docChildren.push(new Paragraph({ text: '' }))
        codeBlockLines = []
        codeLanguage = ''
      }
    }

    const addTable = () => {
      if (tableLines.length > 0) {
        const rows = tableLines.filter(line => !line.match(/^\|[\s:-]+\|$/)) // 过滤分隔行
        
        if (rows.length > 0) {
          const tableRows = rows.map((row, rowIndex) => {
            const cells = row.split('|').filter(cell => cell.trim()).map(cell => cell.trim())
            
            return new TableRow({
              children: cells.map(cellText => new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: cellText,
                    bold: rowIndex === 0,
                    size: 20
                  })]
                })],
                shading: rowIndex === 0 ? { fill: 'E8E8E8' } : undefined,
                margins: {
                  top: 100,
                  bottom: 100,
                  left: 100,
                  right: 100
                }
              }))
            })
          })

          docChildren.push(new Table({
            rows: tableRows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
            }
          }))

          docChildren.push(new Paragraph({ text: '', spacing: { after: 200 } }))
        }
        
        tableLines = []
        inTable = false
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // 处理代码块
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true
          codeLanguage = line.substring(3).trim()
        } else {
          addCodeBlock()
          inCodeBlock = false
        }
        continue
      }

      if (inCodeBlock) {
        codeBlockLines.push(line)
        continue
      }

      // 处理表格
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        if (!inTable) {
          inTable = true
        }
        tableLines.push(line)
        continue
      } else if (inTable) {
        addTable()
      }

      if (!line.trim()) {
        docChildren.push(new Paragraph({ text: '' }))
        continue
      }

      // 标题
      if (line.startsWith('# ')) {
        docChildren.push(new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }))
      } else if (line.startsWith('## ')) {
        docChildren.push(new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 }
        }))
      } else if (line.startsWith('### ')) {
        docChildren.push(new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        }))
      } else if (line.startsWith('#### ')) {
        docChildren.push(new Paragraph({
          text: line.substring(5),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 200, after: 100 }
        }))
      }
      // 列表项
      else if (line.match(/^[-*+]\s/)) {
        const text = line.replace(/^[-*+]\s/, '')
        docChildren.push(new Paragraph({
          text: '• ' + text,
          spacing: { before: 50, after: 50 },
          indent: { left: 360 }
        }))
      } else if (line.match(/^\d+\.\s/)) {
        docChildren.push(new Paragraph({
          text: line,
          spacing: { before: 50, after: 50 },
          indent: { left: 360 }
        }))
      }
      // 引用
      else if (line.startsWith('> ')) {
        docChildren.push(new Paragraph({
          children: [new TextRun({
            text: line.substring(2),
            italics: true,
            color: '666666'
          })],
          indent: { left: 720 },
          spacing: { before: 100, after: 100 },
          border: {
            left: {
              color: 'CCCCCC',
              space: 8,
              value: BorderStyle.SINGLE,
              size: 24
            }
          }
        }))
      }
      // 数学公式（简化处理，保留原文）
      else if (line.includes('$$') || line.includes('$')) {
        const formulaText = line.replace(/\$\$/g, '').replace(/\$/g, '')
        docChildren.push(new Paragraph({
          children: [new TextRun({
            text: `[公式] ${formulaText}`,
            italics: true,
            color: '0066CC',
            font: 'Cambria Math'
          })],
          spacing: { before: 100, after: 100 },
          alignment: line.includes('$$') ? AlignmentType.CENTER : AlignmentType.LEFT
        }))
      }
      // 分隔线
      else if (line.match(/^[-*_]{3,}$/)) {
        docChildren.push(new Paragraph({
          border: {
            bottom: {
              color: 'CCCCCC',
              space: 1,
              value: BorderStyle.SINGLE,
              size: 6
            }
          },
          spacing: { before: 200, after: 200 }
        }))
      }
      // 普通段落
      else {
        // 处理行内格式
        const textRuns = []
        let currentText = line
        
        // 移除 Markdown 标记但保留文本
        currentText = currentText
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')

        docChildren.push(new Paragraph({
          children: [new TextRun({ 
            text: currentText,
            size: 22
          })],
          spacing: { after: 120 }
        }))
      }
    }

    // 处理未闭合的代码块或表格
    if (inCodeBlock) {
      addCodeBlock()
    }
    if (inTable) {
      addTable()
    }

    // 创建文档
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: docChildren
      }],
      creator: exportSettings.value.author || 'Markdown Converter',
      title: exportSettings.value.title || '我的文档',
      description: '由 Markdown 转换器生成',
      styles: {
        default: {
          document: {
            run: {
              font: 'Microsoft YaHei',
              size: 22
            },
            paragraph: {
              spacing: {
                line: 360,
                before: 0,
                after: 0
              }
            }
          }
        }
      }
    })

    // 生成 Blob
    const blob = await Packer.toBlob(doc)
    
    // 保存文件
    saveAs(blob, `${exportSettings.value.title || 'document'}.docx`)
    
    message.success('DOCX 导出成功！')
  } catch (error) {
    console.error('DOCX 导出失败:', error)
    message.error('DOCX 导出失败，请稍后重试')
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
.markdown-converter {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.converter-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;
}

.editor-section,
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.markdown-input {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
}

.preview-container {
  border: 1px solid var(--border-color, #e5e5e5);
  border-radius: 8px;
  padding: 1.5rem;
  background: var(--card-bg, #fff);
  max-height: 600px;
  overflow-y: auto;
}

.dark-theme .preview-container {
  border-color: var(--border-color-dark, #333);
  background: var(--card-bg-dark, #1a1a1a);
}

.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-tertiary);
  gap: 1rem;
}

.settings-panel {
  padding: 1.5rem;
  max-width: 600px;
}

.export-actions {
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, #e5e5e5);
}

.dark-theme .export-actions {
  border-top-color: var(--border-color-dark, #333);
}

/* 响应式设计 */
@media (max-width: 992px) {
  .converter-layout {
    grid-template-columns: 1fr;
  }
}

/* 打印样式优化 */
:deep(.markdown-renderer) {
  font-size: 14px;
  line-height: 1.6;
}

:deep(.markdown-renderer h1) {
  font-size: 2em;
  margin-top: 0;
}

:deep(.markdown-renderer h2) {
  font-size: 1.5em;
}

:deep(.markdown-renderer code) {
  font-size: 0.9em;
}
</style>
