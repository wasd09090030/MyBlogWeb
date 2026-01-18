<template>
  <div class="tools-page">
    <div class="page-header">
      <h1 class="page-title">
        <Icon name="puzzle-piece" size="lg" class="me-2" />
        实用工具箱
      </h1>
      <p class="page-description">在线工具集合，提高你的工作效率</p>
    </div>

    <div class="tools-grid">
      <!-- Markdown 转换工具卡片 -->
      <n-card 
        class="tool-card"
        hoverable
        @click="navigateTo('/tools/markdown-converter')"
      >
        <template #header>
          <div class="tool-card-header">
            <Icon name="document-text" size="lg" class="tool-icon" />
            <span>Markdown 转换器</span>
          </div>
        </template>
        <div class="tool-description">
          将 Markdown 文档转换为 PDF 或 DOCX 格式，支持代码高亮、表格和数学公式
        </div>
        <template #footer>
          <div class="tool-tags">
            <n-tag type="info" size="small">PDF</n-tag>
            <n-tag type="success" size="small">DOCX</n-tag>
            <n-tag type="warning" size="small">实时预览</n-tag>
          </div>
        </template>
      </n-card>

      <!-- 预留更多工具卡片 -->
      <n-card 
        class="tool-card tool-card-coming-soon"
        :bordered="false"
      >
        <template #header>
          <div class="tool-card-header">
            <Icon name="three-dots" size="lg" class="tool-icon" />
            <span>更多工具</span>
          </div>
        </template>
        <div class="tool-description">
          更多实用工具正在开发中...
        </div>
        <template #footer>
          <n-tag type="warning" size="small">敬请期待</n-tag>
        </template>
      </n-card>
    </div>
  </div>
</template>

<script setup>

// SEO 优化
useHead({
  title: '实用工具箱',
  meta: [
    { name: 'description', content: '在线工具集合，包括 Markdown 转 PDF/DOCX 等实用功能' }
  ]
})
</script>

<style scoped>
.tools-page {
  padding: 2rem 0;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-description {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.tool-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 16px;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(100, 108, 255, 0.15);
}

.tool-card-coming-soon {
  cursor: default;
  opacity: 0.7;
}

.tool-card-coming-soon:hover {
  transform: none;
  box-shadow: none;
}

.tool-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.tool-icon {
  color: var(--primary-color);
}

.tool-description {
  color: var(--text-secondary);
  line-height: 1.6;
  min-height: 60px;
}

.tool-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
  }
}

/* 深色主题 */
.dark-theme .tool-description {
  color: var(--text-secondary-dark);
}
</style>
