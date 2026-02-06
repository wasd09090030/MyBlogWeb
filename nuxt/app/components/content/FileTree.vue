<template>
  <div class="file-tree-mdc my-6">
    <div class="file-tree-header" v-if="title">
      <Icon name="mdi:folder-outline" class="header-icon" />
      <span class="header-title">{{ title }}</span>
    </div>
    
    <div class="file-tree-content">
      <FileTreeNode
        v-for="(node, index) in parsedTree"
        :key="index"
        :node="node"
        :level="0"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * FileTree 文件树组件 - MDC 语法
 * 
 * 在 Markdown 中使用：
 * ::file-tree{title="项目结构"}
 * ```
 * src/
 *   components/
 *     Button.vue
 *     Input.vue
 *   pages/
 *     index.vue
 *   App.vue
 * package.json
 * README.md
 * ```
 * ::
 * 
 * 或从 default slot 读取：
 * ::file-tree
 * src/
 *   App.vue
 * package.json
 * ::
 */

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  tree: {
    type: String,
    default: ''
  }
})

const slots = useSlots()

const normalizeTreeText = (raw) => {
  if (!raw || typeof raw !== 'string') return ''
  const lines = raw.replace(/\r\n/g, '\n').split('\n')

  const trimEmptyLines = () => {
    while (lines.length && !lines[0].trim()) lines.shift()
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  }

  trimEmptyLines()

  if (lines.length && lines[0].trim().startsWith('```')) lines.shift()
  if (lines.length && lines[lines.length - 1].trim().startsWith('```')) lines.pop()

  trimEmptyLines()
  return lines.join('\n')
}

const stripInlineComment = (line) => line.replace(/\s+#.*$/, '').replace(/\s+$/, '')

// 解析文件树结构
const parsedTree = computed(() => {
  // 优先使用 tree prop，否则从 default slot 获取
  let treeText = props.tree || ''
  
  // 如果没有 tree prop，尝试从 slot 获取
  if (!treeText && slots.default) {
    const slotContent = slots.default()
    if (slotContent && slotContent[0]) {
      const children = slotContent[0].children
      // children 可能是字符串或数组
      treeText = typeof children === 'string' ? children : Array.isArray(children) ? children.join('') : ''
    }
  }
  
  treeText = normalizeTreeText(treeText)
  if (!treeText) return []
  
  const lines = treeText.split('\n')
  const tree = []
  const stack = [{ children: tree, level: -1 }]
  let hasExplicitRoot = false
  let sawFirstNode = false
  
  lines.forEach(rawLine => {
    let line = rawLine.replace(/\t/g, '  ')
    line = stripInlineComment(line)
    
    if (!line.trim()) return
    
    const treeMatch = line.match(/^(.*?)(?:├──|└──|\|--|\+--)\s*(.+)$/)
    let level = 0
    let name = ''
    
    if (treeMatch) {
      const prefix = treeMatch[1] || ''
      const matches = prefix.match(/(?:[│|] {3}| {4})/g)
      level = matches ? matches.length : 0
      name = treeMatch[2]?.trim() || ''
    } else {
      // 计算缩进级别（2个空格 = 1级）
      const indent = line.match(/^\s*/)[0].length
      level = Math.floor(indent / 2)
      name = line.trim()
    }
    
    if (!name) return
    
    const isDirectory = name.endsWith('/')
    const cleanName = isDirectory ? name.slice(0, -1) : name
    
    if (!sawFirstNode) {
      if (!treeMatch && level === 0 && isDirectory) {
        hasExplicitRoot = true
      }
      sawFirstNode = true
    }
    
    if (treeMatch && hasExplicitRoot) {
      level += 1
    }
    
    const node = {
      name: cleanName,
      isDirectory,
      level,
      children: []
    }
    
    // 找到正确的父节点
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }
    
    const parent = stack[stack.length - 1]
    parent.children.push(node)
    
    if (isDirectory) {
      stack.push(node)
    }
  })
  
  return tree
})
</script>

<style scoped>
.file-tree-mdc {
  background: rgb(249 250 251);
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  overflow: hidden;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
}

:global(.dark) .file-tree-mdc {
  background: rgb(17 24 39);
  border-color: rgb(55 65 81);
}

.file-tree-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgb(243 244 246);
  border-bottom: 1px solid rgb(229 231 235);
  font-weight: 600;
  color: rgb(55 65 81);
}

:global(.dark) .file-tree-header {
  background: rgb(31 41 55);
  border-bottom-color: rgb(55 65 81);
  color: rgb(209 213 219);
}

.header-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.file-tree-content {
  padding: 1rem;
}
</style>
