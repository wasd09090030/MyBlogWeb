<template>
  <div class="github-card-mdc my-6">
    <div v-if="loading" class="loading-skeleton">
      <div class="skeleton-line w-3/4 h-6 mb-3"></div>
      <div class="skeleton-line w-full h-4 mb-2"></div>
      <div class="skeleton-line w-5/6 h-4"></div>
    </div>
    
    <div v-else-if="repoData" class="github-card">
      <!-- 仓库名称和描述 -->
      <div class="repo-header">
        <a :href="repoData.html_url" target="_blank" rel="noopener" class="repo-name">
          <Icon name="mdi:github" class="inline-block mr-2" />
          {{ repoData.full_name }}
        </a>
        <p v-if="repoData.description" class="repo-description">
          {{ repoData.description }}
        </p>
      </div>
      
      <!-- 统计信息 -->
      <div class="repo-stats">
        <div class="stat-item">
          <Icon name="mdi:star-outline" class="stat-icon" />
          <span>{{ formatNumber(repoData.stargazers_count) }}</span>
        </div>
        <div class="stat-item">
          <Icon name="mdi:source-fork" class="stat-icon" />
          <span>{{ formatNumber(repoData.forks_count) }}</span>
        </div>
        <div v-if="repoData.open_issues_count" class="stat-item">
          <Icon name="mdi:alert-circle-outline" class="stat-icon" />
          <span>{{ formatNumber(repoData.open_issues_count) }}</span>
        </div>
      </div>
      
      <!-- 底部信息 -->
      <div class="repo-footer">
        <div v-if="repoData.language" class="language">
          <span class="language-dot" :style="{ backgroundColor: getLanguageColor(repoData.language) }"></span>
          {{ repoData.language }}
        </div>
        <div v-if="repoData.license" class="license">
          <Icon name="mdi:scale-balance" class="inline-block mr-1" />
          {{ repoData.license.spdx_id }}
        </div>
        <div class="updated">
          更新于 {{ formatDate(repoData.updated_at) }}
        </div>
      </div>
    </div>
    
    <div v-else-if="error" class="error-message">
      <Icon name="mdi:alert-circle" class="inline-block mr-2" />
      {{ error }}
    </div>
  </div>
</template>

<script setup>
/**
 * GithubCard GitHub 仓库卡片组件 - MDC 语法
 * 
 * 在 Markdown 中使用：
 * ::github-card{repo="vuejs/core"}
 * ::
 * 
 * ::github-card{repo="nuxt/nuxt"}
 * ::
 */

const props = defineProps({
  // GitHub 仓库，格式: owner/repo
  repo: {
    type: String,
    required: true
  }
})

const repoData = ref(null)
const loading = ref(true)
const error = ref(null)

// 语言颜色映射（GitHub 官方配色）
const languageColors = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
}

const getLanguageColor = (language) => {
  return languageColors[language] || '#8b949e'
}

const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 30) return `${diffDays} 天前`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 个月前`
  return `${Math.floor(diffDays / 365)} 年前`
}

// 获取仓库数据
const fetchRepoData = async () => {
  if (!props.repo) {
    error.value = '请提供仓库名称'
    loading.value = false
    return
  }
  
  try {
    loading.value = true
    error.value = null
    
    const response = await fetch(`https://api.github.com/repos/${props.repo}`)
    
    if (!response.ok) {
      throw new Error(`GitHub API 错误: ${response.status}`)
    }
    
    repoData.value = await response.json()
  } catch (e) {
    error.value = `加载失败: ${e.message}`
    console.error('GitHub Card Error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRepoData()
})

watch(() => props.repo, () => {
  fetchRepoData()
})
</script>

<style scoped>
.github-card-mdc {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
}

.github-card {
  padding: 1rem;
  background: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  transition: box-shadow 0.2s;
}

.github-card:hover {
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
}

:global(.dark) .github-card {
  background: #0d1117;
  border-color: #30363d;
}

.repo-header {
  margin-bottom: 1rem;
}

.repo-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0969da;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.repo-name:hover {
  text-decoration: underline;
}

:global(.dark) .repo-name {
  color: #58a6ff;
}

.repo-description {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #656d76;
  line-height: 1.5;
}

:global(.dark) .repo-description {
  color: #8b949e;
}

.repo-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #d0d7de;
}

:global(.dark) .repo-stats {
  border-bottom-color: #21262d;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #656d76;
}

:global(.dark) .stat-item {
  color: #8b949e;
}

.stat-icon {
  width: 1rem;
  height: 1rem;
}

.repo-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: #656d76;
  flex-wrap: wrap;
}

:global(.dark) .repo-footer {
  color: #8b949e;
}

.language {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.language-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.license {
  display: flex;
  align-items: center;
}

.loading-skeleton {
  padding: 1rem;
}

.skeleton-line {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

:global(.dark) .skeleton-line {
  background: linear-gradient(90deg, #1f1f1f 25%, #2a2a2a 50%, #1f1f1f 75%);
  background-size: 200% 100%;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.error-message {
  padding: 1rem;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #cf1322;
}

:global(.dark) .error-message {
  background: #2a1215;
  border-color: #58181c;
  color: #ff7875;
}
</style>
