/**
 * 文章无缝导航 Composable
 *
 * 实现「点击 → Loading 动画 + 后台数据预加载 → 无缝跳转」体验：
 *
 * 1. 点击文章链接时拦截默认导航
 * 2. 手动启动 NuxtLoadingIndicator 进度条动画
 * 3. 后台并行执行：API 数据获取 + Markdown 解析 + 最小动画时间
 * 4. 全部完成后将结果写入预加载缓存
 * 5. 执行 navigateTo，文章页从缓存瞬间读取数据
 *
 * 降级策略：预加载失败时直接跳转，走标准 SSR/CSR 流程
 */

import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { setPreloadedArticle } from '~/utils/articlePreloadCache'

// 防止并发预加载同一篇文章
const pendingNavigations = new Set()

export function useArticleNavigation() {
  const loadingIndicator = useLoadingIndicator()
  const config = useRuntimeConfig()
  const router = useRouter()

  /**
   * 获取 API baseURL
   */
  function getApiBase() {
    const apiBase = config.public.apiBase
    if (apiBase) return apiBase
    return process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'
  }

  /**
   * 获取文章路由路径
   */
  function getArticlePath(article) {
    if (!article?.id || article.id === 'null' || article.id === 'undefined') return '/'
    return article.slug
      ? `/article/${article.id}-${article.slug}`
      : `/article/${article.id}`
  }

  /**
   * 获取文章的 useAsyncData 缓存 key
   * 必须与 [id].vue 中的 key 格式一致: `article-${route.params.id}`
   */
  function getCacheKey(article) {
    if (!article?.id) return null
    // route.params.id 的格式：'77-wsl2-gitconfig-mcprouter' 或 '77'
    const rawId = article.slug ? `${article.id}-${article.slug}` : `${article.id}`
    return `article-${rawId}`
  }

  /**
   * 核心方法：无缝导航到文章
   *
   * @param {Object} article - 文章对象（至少含 id, slug）
   * @param {Object} options - 选项
   * @param {number} options.minAnimationMs - 最小动画持续时间（毫秒），默认 500
   * @param {Object} options.query - 额外的路由 query 参数
   */
  async function navigateToArticle(article, options = {}) {
    const { minAnimationMs = 500, query = {} } = options

    if (!article?.id) {
      await navigateTo('/')
      return
    }

    const articleId = String(article.id)
    const articlePath = getArticlePath(article)
    const cacheKey = getCacheKey(article)

    // 防止并发重复导航
    if (pendingNavigations.has(articleId)) return
    pendingNavigations.add(articleId)

    // 1. 启动 Loading 动画
    loadingIndicator.start({ force: true })

    try {
      // 2. 并行执行：数据加载 + 最小动画时间
      const minAnimation = new Promise(resolve => setTimeout(resolve, minAnimationMs))

      const loadData = async () => {
        // 获取文章 API 数据
        const response = await $fetch(`${getApiBase()}/articles/${articleId}`)

        if (!response) throw new Error('文章不存在')

        // Markdown 预解析（重操作，但在 loading 动画播放期间完成）
        if (response.contentMarkdown) {
          try {
            const ast = await parseMarkdown(response.contentMarkdown, {
              highlight: {
                theme: {
                  default: 'material-theme-lighter',
                  dark: 'material-theme-darker'
                }
              },
              toc: {
                depth: 4,
                searchDepth: 4
              }
            })
            response._mdcAst = ast
            response._mdcToc = ast.toc
          } catch (e) {
            console.warn('[ArticleNav] Markdown 解析失败，页面将回退处理:', e.message)
            // 解析失败不阻塞导航
          }
        }

        return response
      }

      const [articleData] = await Promise.all([loadData(), minAnimation])

      // 3. 写入预加载缓存（供 [id].vue 的 getCachedData 消费）
      if (cacheKey && articleData) {
        setPreloadedArticle(cacheKey, articleData)
      }

      // 4. 进度设到接近完成
      loadingIndicator.set(80)

      // 5. 导航到文章页（useAsyncData 将从缓存读取，瞬间完成）
      await navigateTo({ path: articlePath, query })
    } catch (error) {
      console.warn('[ArticleNav] 预加载失败，降级直跳:', error.message)
      // 降级：直接导航，走标准加载流程
      await navigateTo({ path: articlePath, query })
    } finally {
      pendingNavigations.delete(articleId)
      // 确保 loading 状态结束（navigateTo 完成后 Nuxt 通常会自动 finish，
      // 但万一异步有延迟，兜底清理）
      setTimeout(() => {
        if (loadingIndicator.isLoading.value) {
          loadingIndicator.finish()
        }
      }, 300)
    }
  }

  return {
    navigateToArticle,
    getArticlePath
  }
}
