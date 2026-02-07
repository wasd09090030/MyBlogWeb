<template>
  <div class="file-tree-simple my-6">
    <div v-if="title" class="file-tree-header">
      <Icon name="heroicons:folder" class="header-icon" />
      <span class="header-title">{{ title }}</span>
    </div>

    <ul v-if="items.length" class="file-tree-list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="file-tree-item"
        :style="{ paddingLeft: `${item.level * 1.25}rem` }"
      >
        <Icon
          :name="item.isDirectory ? 'heroicons:folder' : 'heroicons:document'"
          class="item-icon"
        />
        <span class="item-name" :class="{ 'is-directory': item.isDirectory }">
          {{ item.name }}
        </span>
      </li>
    </ul>

    <div v-else class="file-tree-empty">暂无文件结构</div>
  </div>
</template>

<script setup>
/**
 * FileTree 文件树组件 - 简洁版 MDC
 *
 * 在 Markdown 中使用：
 * ::file-tree{title="项目结构"}
 * src/
 *   components/
 *     Button.vue
 *   pages/
 *     index.vue
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

const extractText = (nodes = []) => {
  return nodes.map((node) => {
    if (typeof node === 'string') return node
    if (!node) return ''
    if (node.type === 'br') return '\n'
    const children = node.children
    if (typeof children === 'string') return children
    if (Array.isArray(children)) return extractText(children)
    return ''
  }).join('')
}

const normalizeTreeText = (raw) => {
  if (!raw || typeof raw !== 'string') return ''
  const lines = raw.replace(/\r\n/g, '\n').split('\n')

  const trimEmpty = () => {
    while (lines.length && !lines[0].trim()) lines.shift()
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  }

  trimEmpty()
  if (lines.length && lines[0].trim().startsWith('```')) lines.shift()
  if (lines.length && lines[lines.length - 1].trim().startsWith('```')) lines.pop()
  trimEmpty()

  return lines.join('\n')
}

const parseLine = (rawLine) => {
  let line = rawLine.replace(/\t/g, '  ')
  line = line.replace(/\s+#.*$/, '').replace(/\s+$/, '')
  if (!line.trim()) return null

  const treeMatch = line.match(/^(.*?)(?:├──|└──|├─|└─|├|└|\|--|\+--|\+─|\+-|\|-)\s*(.+)$/)
  let level = 0
  let name = ''

  if (treeMatch) {
    const prefix = treeMatch[1] || ''
    const matches = prefix.match(/(?:[│|]\s{1,3}|\s{4})/g)
    level = matches ? matches.length : 0
    name = treeMatch[2]?.trim() || ''
  } else {
    const indent = line.match(/^\s*/)[0].length
    level = Math.floor(indent / 2)
    name = line.trim()
  }

  if (!name) return null
  const isDirectory = name.endsWith('/')

  return {
    name: isDirectory ? name.slice(0, -1) : name,
    isDirectory,
    level
  }
}

const items = computed(() => {
  let treeText = props.tree || ''

  if (!treeText && slots.default) {
    treeText = extractText(slots.default())
  }

  treeText = normalizeTreeText(treeText)
  if (!treeText) return []

  return treeText.split('\n')
    .map(parseLine)
    .filter(Boolean)
})
</script>

<style scoped>
.file-tree-simple {
  background: rgb(249 250 251);
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  overflow: hidden;
}

:global(.dark) .file-tree-simple {
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

.file-tree-list {
  list-style: none;
  margin: 0;
  padding: 0.75rem 1rem 1rem;
}

.file-tree-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.6;
  padding: 0.125rem 0;
}

.item-icon {
  width: 1rem;
  height: 1rem;
  color: rgb(59 130 246);
  flex-shrink: 0;
}

.item-name {
  color: rgb(55 65 81);
}

:global(.dark) .item-name {
  color: rgb(209 213 219);
}

.item-name.is-directory {
  font-weight: 600;
}

.file-tree-empty {
  padding: 0.75rem 1rem 1rem;
  color: rgb(107 114 128);
}

:global(.dark) .file-tree-empty {
  color: rgb(156 163 175);
}
</style>
