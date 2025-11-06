<template>
  <section class="welcome-section">
    <div class="container">
      <div class="row align-items-center">
        <!-- 左侧个人信息 -->
        <div class="col-lg-6 mb-4 mb-lg-0">
          <PersonalInfo />
        </div>

        <!-- 右侧轮播图 -->
        <div class="col-lg-6">
          <div class="featured-articles">
            <h3 class="section-title mb-4">
              <i class="bi bi-star-fill me-2 text-warning"></i>
              推荐文章
            </h3>

            <!-- 加载状态 -->
            <LoadingSpinner v-if="loading" text="正在加载推荐文章..." size="small" />

            <!-- 错误状态 -->
            <div v-else-if="error" class="alert alert-warning" role="alert">
              <i class="bi bi-exclamation-triangle me-2"></i>
              加载推荐文章失败
            </div>

            <!-- 轮播内容 -->
            <div v-else-if="featuredArticles.length" class="carousel-container">
              <div
                id="featuredArticlesCarousel"
                class="carousel slide"
                data-bs-ride="carousel"
                data-bs-interval="5000"
              >
                <!-- 轮播指示器 -->
                <div class="carousel-indicators">
                  <button
                    v-for="(article, index) in featuredArticles"
                    :key="index"
                    type="button"
                    data-bs-target="#featuredArticlesCarousel"
                    :data-bs-slide-to="index"
                    :class="{ active: index === 0 }"
                    :aria-current="index === 0"
                  ></button>
                </div>

                <!-- 轮播内容 -->
                <div class="carousel-inner">
                  <div
                    v-for="(article, index) in featuredArticles"
                    :key="article.id"
                    class="carousel-item"
                    :class="{ active: index === 0 }"
                  >
                    <div class="featured-article-card">
                      <div v-if="article.coverImage && article.coverImage !== 'null'" class="featured-image">
                        <img
                          :src="article.coverImage"
                          :alt="article.title"
                          class="img-fluid"
                          @error="handleImageError"
                        />
                      </div>
                      <div class="featured-content">
                        <div class="article-meta mb-2">
                          <span class="article-date">{{ formatDate(article.createdAt) }}</span>
                          <span :class="['article-category', getCategoryClass(article.category)]">
                            {{ getCategoryName(article.category) }}
                          </span>
                        </div>
                        <h4 class="featured-title">
                          <NuxtLink :to="`/article/${article.id}`" class="text-decoration-none">
                            {{ article.title }}
                          </NuxtLink>
                        </h4>
                        <p class="featured-excerpt">{{ getExcerpt(article.content) }}</p>
                        <NuxtLink :to="`/article/${article.id}`" class="btn btn-primary">
                          阅读更多
                          <i class="bi bi-arrow-right ms-1"></i>
                        </NuxtLink>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 轮播控制按钮 -->
                <button
                  class="carousel-control-prev"
                  type="button"
                  data-bs-target="#featuredArticlesCarousel"
                  data-bs-slide="prev"
                >
                  <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Previous</span>
                </button>
                <button
                  class="carousel-control-next"
                  type="button"
                  data-bs-target="#featuredArticlesCarousel"
                  data-bs-slide="next"
                >
                  <span class="carousel-control-next-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Next</span>
                </button>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="alert alert-info text-center" role="alert">
              <i class="bi bi-star fs-1 d-block mb-3"></i>
              暂无推荐文章
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 装饰性樱花效果 -->
    <SakuraFalling />
  </section>
</template>

<script setup>
import { useArticles } from '~/composables/useArticles'
import PersonalInfo from '~/components/PersonalInfo.vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import SakuraFalling from '~/components/SakuraFalling.vue'

// 响应式数据
const featuredArticles = ref([])
const loading = ref(false)
const error = ref(null)

// API composable
const { getFeaturedArticles } = useArticles()

// 获取分类中文名称
const getCategoryName = (category) => {
  if (!category) return '其他'
  const lowerCategory = category.toLowerCase()
  const categoryMap = {
    'study': '学习',
    'game': '游戏',
    'work': '个人作品',
    'resource': '资源分享'
  }
  return categoryMap[lowerCategory] || '其他'
}

// 获取分类样式类
const getCategoryClass = (category) => {
  if (!category) return 'category-other'
  const lowerCategory = category.toLowerCase()
  const categoryClassMap = {
    'study': 'category-study',
    'game': 'category-game',
    'work': 'category-work',
    'resource': 'category-resource'
  }
  return categoryClassMap[lowerCategory] || 'category-other'
}

// 获取文章摘要
const getExcerpt = (content) => {
  if (!content) return ''
  const plainText = content.replace(/<[^>]*>/g, '')
  return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知日期'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// 获取推荐文章
const fetchFeaturedArticles = async () => {
  if (loading.value) return

  loading.value = true
  error.value = null

  try {
    console.log('WelcomeSection: 开始获取推荐文章...')
    const data = await getFeaturedArticles(5)
    featuredArticles.value = data || []
    console.log('WelcomeSection: 获取推荐文章成功，数量:', featuredArticles.value.length)
  } catch (e) {
    error.value = e
    console.error('WelcomeSection: 获取推荐文章失败:', e)
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchFeaturedArticles()
})
</script>

<style scoped>
.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4rem 0;
  position: relative;
  overflow: hidden;
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.15"/><circle cx="10" cy="50" r="0.5" fill="white" opacity="0.15"/><circle cx="90" cy="50" r="0.5" fill="white" opacity="0.15"/><circle cx="50" cy="90" r="0.5" fill="white" opacity="0.15"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.section-title {
  color: white;
  font-weight: 600;
  text-align: center;
  margin-bottom: 2rem;
}

.featured-articles {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.carousel-container {
  position: relative;
}

.featured-article-card {
  background: rgba(255,255,255,0.95);
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.featured-article-card:hover {
  transform: translateY(-4px);
}

.featured-image {
  height: 200px;
  overflow: hidden;
}

.featured-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.featured-article-card:hover .featured-image img {
  transform: scale(1.05);
}

.featured-content {
  padding: 1.5rem;
  color: #333;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
}

.article-date {
  color: #6c757d;
}

.article-category {
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.category-study {
  background: #e3f2fd;
  color: #1976d2;
}

.category-game {
  background: #fce4ec;
  color: #c2185b;
}

.category-work {
  background: #e8f5e8;
  color: #388e3c;
}

.category-resource {
  background: #fff3e0;
  color: #f57c00;
}

.category-other {
  background: #f5f5f5;
  color: #616161;
}

.featured-title {
  margin: 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
}

.featured-title a {
  color: #212529;
  transition: color 0.3s ease;
}

.featured-title a:hover {
  color: #0d6efd;
}

.featured-excerpt {
  color: #6c757d;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

/* 轮播指示器样式 */
:deep(.carousel-indicators) {
  bottom: -3rem;
}

:deep(.carousel-indicators button) {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  border: 2px solid white;
}

:deep(.carousel-indicators button.active) {
  background: white;
}

/* 轮播控制按钮样式 */
:deep(.carousel-control-prev),
:deep(.carousel-control-next) {
  width: 40px;
  height: 40px;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  top: 50%;
  transform: translateY(-50%);
  backdrop-filter: blur(10px);
}

:deep(.carousel-control-prev-icon),
:deep(.carousel-control-next-icon) {
  width: 20px;
  height: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-section {
    padding: 2rem 0;
  }

  .featured-articles {
    padding: 1rem;
  }

  .featured-content {
    padding: 1rem;
  }

  .featured-title {
    font-size: 1.1rem;
  }

  :deep(.carousel-control-prev),
  :deep(.carousel-control-next) {
    width: 30px;
    height: 30px;
  }
}
</style>