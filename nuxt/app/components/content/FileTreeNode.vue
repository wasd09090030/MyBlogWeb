<template>
  <div class="file-tree-node">
    <div 
      class="node-content"
      :style="{ paddingLeft: `${level * 1.5}rem` }"
      @click="toggleExpand"
    >
      <!-- 展开/收起图标 -->
      <span v-if="node.isDirectory" class="expand-icon">
        <Icon 
          :name="isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'"
          class="chevron-icon"
        />
      </span>
      <span v-else class="expand-placeholder"></span>
      
      <!-- 文件/文件夹图标 -->
      <Icon 
        :name="getIcon(node.name, node.isDirectory)"
        :class="getIconColor(node.name, node.isDirectory)"
        class="file-icon"
      />
      
      <!-- 文件/文件夹名称 -->
      <span class="node-name" :class="{ 'is-directory': node.isDirectory }">
        {{ node.name }}
      </span>
    </div>
    
    <!-- 子节点 -->
    <Transition name="expand">
      <div v-if="node.isDirectory && isExpanded" class="node-children">
        <FileTreeNode
          v-for="(child, index) in node.children"
          :key="index"
          :node="child"
          :level="level + 1"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup>
/**
 * FileTreeNode 文件树节点组件（递归组件）
 */

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
})

const isExpanded = ref(props.level < 2) // 默认展开前2层

const toggleExpand = () => {
  if (props.node.isDirectory) {
    isExpanded.value = !isExpanded.value
  }
}

// 根据文件名获取图标
const getIcon = (name, isDirectory) => {
  if (isDirectory) {
    return isExpanded.value ? 'mdi:folder-open' : 'mdi:folder'
  }
  
  // 文件扩展名映射
  const ext = name.split('.').pop()?.toLowerCase()
  const iconMap = {
    // 代码文件
    'js': 'mdi:language-javascript',
    'ts': 'mdi:language-typescript',
    'vue': 'mdi:vuejs',
    'jsx': 'mdi:react',
    'tsx': 'mdi:react',
    'py': 'mdi:language-python',
    'java': 'mdi:language-java',
    'go': 'mdi:language-go',
    'rs': 'mdi:language-rust',
    'php': 'mdi:language-php',
    'rb': 'mdi:language-ruby',
    'swift': 'mdi:language-swift',
    'kt': 'mdi:language-kotlin',
    'dart': 'mdi:language-dart',
    'cs': 'mdi:language-csharp',
    'cpp': 'mdi:language-cpp',
    'c': 'mdi:language-c',
    
    // Web 文件
    'html': 'mdi:language-html5',
    'css': 'mdi:language-css3',
    'scss': 'mdi:sass',
    'sass': 'mdi:sass',
    'less': 'mdi:less',
    
    // 配置文件
    'json': 'mdi:code-json',
    'yaml': 'mdi:file-code',
    'yml': 'mdi:file-code',
    'toml': 'mdi:file-code',
    'xml': 'mdi:xml',
    'env': 'mdi:file-cog',
    'config': 'mdi:file-cog',
    
    // 文档
    'md': 'mdi:language-markdown',
    'txt': 'mdi:file-document-outline',
    'pdf': 'mdi:file-pdf-box',
    'doc': 'mdi:file-word',
    'docx': 'mdi:file-word',
    
    // 图片
    'jpg': 'mdi:file-image',
    'jpeg': 'mdi:file-image',
    'png': 'mdi:file-image',
    'gif': 'mdi:file-image',
    'svg': 'mdi:svg',
    'ico': 'mdi:file-image',
    
    // 其他
    'zip': 'mdi:folder-zip',
    'git': 'mdi:git',
    'sh': 'mdi:bash',
    'sql': 'mdi:database',
  }
  
  // 特殊文件名
  const specialFiles = {
    'package.json': 'mdi:npm',
    'package-lock.json': 'mdi:npm',
    'yarn.lock': 'mdi:yarn',
    'pnpm-lock.yaml': 'mdi:package-variant',
    'Dockerfile': 'mdi:docker',
    'docker-compose.yml': 'mdi:docker',
    '.gitignore': 'mdi:git',
    '.gitattributes': 'mdi:git',
    'README.md': 'mdi:information',
    'LICENSE': 'mdi:scale-balance',
    'Makefile': 'mdi:hammer',
    'tsconfig.json': 'mdi:language-typescript',
    'webpack.config.js': 'mdi:webpack',
    'vite.config.js': 'mdi:lightning-bolt',
    'vite.config.ts': 'mdi:lightning-bolt',
    'nuxt.config.ts': 'mdi:nuxt',
    'tailwind.config.js': 'mdi:tailwind',
    '.eslintrc': 'mdi:eslint',
    '.prettierrc': 'mdi:code-braces',
  }
  
  return specialFiles[name] || iconMap[ext] || 'mdi:file-outline'
}

// 根据文件类型获取图标颜色
const getIconColor = (name, isDirectory) => {
  if (isDirectory) {
    return 'text-blue-500 dark:text-blue-400'
  }
  
  const ext = name.split('.').pop()?.toLowerCase()
  const colorMap = {
    'js': 'text-yellow-500',
    'ts': 'text-blue-600',
    'vue': 'text-green-500',
    'jsx': 'text-cyan-500',
    'tsx': 'text-cyan-600',
    'py': 'text-blue-500',
    'html': 'text-orange-600',
    'css': 'text-blue-500',
    'scss': 'text-pink-500',
    'json': 'text-yellow-600',
    'md': 'text-gray-600 dark:text-gray-400',
    'git': 'text-orange-500',
  }
  
  return colorMap[ext] || 'text-gray-500 dark:text-gray-400'
}
</script>

<style scoped>
.file-tree-node {
  user-select: none;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0;
  cursor: pointer;
  transition: background-color 0.15s;
  border-radius: 0.25rem;
}

.node-content:hover {
  background: rgb(243 244 246);
}

:global(.dark) .node-content:hover {
  background: rgb(31 41 55);
}

.expand-icon {
  display: inline-flex;
  width: 1rem;
  flex-shrink: 0;
}

.expand-placeholder {
  width: 1rem;
  flex-shrink: 0;
}

.chevron-icon {
  width: 1rem;
  height: 1rem;
  color: rgb(107 114 128);
  transition: transform 0.2s;
}

.file-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.node-name {
  color: rgb(55 65 81);
  line-height: 1.5;
}

:global(.dark) .node-name {
  color: rgb(209 213 219);
}

.node-name.is-directory {
  font-weight: 500;
}

.node-children {
  overflow: hidden;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
