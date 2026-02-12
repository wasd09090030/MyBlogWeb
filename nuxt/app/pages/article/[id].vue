<template>
  <div class="min-h-screen flex">
    <!-- 左侧：文章主体 -->
    <div class="flex-1 bg-white dark:bg-gray-900 rounded-xl overflow-hidden lg:rounded-l-xl lg:rounded-r-none">
      <!-- 加载状态 -->
      <div v-if="pending" class="flex flex-col items-center justify-center min-h-[60vh]">
        <n-spin size="large" />
        <p class="mt-4 text-gray-500 dark:text-gray-400">加载中...</p>
      </div>

      <!-- 错误状态 -->
      <n-alert v-else-if="error" type="error" title="加载失败" class="max-w-4xl mx-auto my-8">
        加载文章失败: {{ error.message }}
      </n-alert>

      <!-- 文章内容 -->
      <article v-else-if="article" class="relative">
        <!-- 封面图片 - 全宽无间距 -->
        <ArticleDetailCoverImage :article="article" />

        <!-- 文章主体内容 -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <!-- 文章头部 -->
          <ArticleDetailHeader :article="article" @go-back="goBack" />

          <!-- 文章内容、评论、底部按钮 -->
          <ArticleDetailContent :article="article" @toc-ready="onTocReady" @go-back="goBack" />
        </div>
      </article>

      <!-- 文章不存在 -->
      <n-empty v-else description="找不到文章" class="py-20">
        <template #icon>
          <Icon name="file-earmark-x" size="3xl" />
        </template>
        <template #extra>
          <n-button @click="goBack">返回首页</n-button>
        </template>
      </n-empty>
    </div>

    <!-- 右侧：文章目录侧边栏 -->
    <ArticleDetailSidebar :article="article" :headings="headings" :pending="pending" />
  </div>
</template>

<script setup>
import ArticleDetailCoverImage from '~/features/article-detail/components/CoverImage.vue'
import ArticleDetailHeader from '~/features/article-detail/components/Header.vue'
import ArticleDetailContent from '~/features/article-detail/components/Content.vue'
import ArticleDetailSidebar from '~/features/article-detail/components/Sidebar.vue'
import { useArticleDetailPage } from '~/features/article-detail/composables/useArticleDetailPage'

const {
  article,
  pending,
  error,
  headings,
  goBack,
  onTocReady
} = await useArticleDetailPage()
</script>
