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
import type { LocationQueryRaw } from 'vue-router'
import { setPreloadedArticle } from '~/utils/articlePreloadCache'

type ArticleNavInput = {
  id?: string | number | null
  slug?: string | null
}

type NavigateToArticleOptions = {
  minAnimationMs?: number
  query?: LocationQueryRaw
}

type ArticleApiResponse = Record<string, unknown> & {
  id?: string | number
  slug?: string | null
  contentMarkdown?: string | null
  _mdcAst?: unknown
  _mdcToc?: unknown
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误'
}

function hasToc(value: unknown): value is { toc: unknown } {
  return typeof value === 'object' && value !== null && 'toc' in value
}

// 防止并发预加载同一篇文章
const pendingNavigations = new Set<string>()

export function useArticleNavigation() {
  const loadingIndicator = useLoadingIndicator()
  const config = useRuntimeConfig()
  const router = useRouter()

  void router // 保留：后续可能用于更精细的导航控制

  /**
   * 获取 API baseURL
   */
  function getApiBase(): string {
    const apiBase = config.public.apiBase
    if (apiBase) return apiBase
    return process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'
  }

  /**
   * 获取文章路由路径
   */
  function getArticlePath(article: ArticleNavInput): string {
    if (!article?.id || article.id === 'null' || article.id === 'undefined') return '/'
    return article.slug
      ? `/article/${article.id}-${article.slug}`
      : `/article/${article.id}`
  }

  /**
   * 获取文章的 useAsyncData 缓存 key
   * 必须与 [id].vue 中的 key 格式一致: `article-${route.params.id}`
   */
  function getCacheKey(article: ArticleNavInput): string | null {
    if (!article?.id) return null
    // route.params.id 的格式：'77-wsl2-gitconfig-mcprouter' 或 '77'
    const rawId = article.slug ? `${article.id}-${article.slug}` : `${article.id}`
    return `article-${rawId}`
  }

  /**
   * 核心方法：无缝导航到文章
   */
  async function navigateToArticle(article: ArticleNavInput, options: NavigateToArticleOptions = {}): Promise<void> {
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
      const minAnimation = new Promise<void>((resolve) => setTimeout(resolve, minAnimationMs))

      const loadData = async (): Promise<ArticleApiResponse> => {
        // 获取文章 API 数据
        const response = await $fetch<ArticleApiResponse>(`${getApiBase()}/articles/${articleId}`)

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
            response._mdcAst = ast as unknown
            response._mdcToc = hasToc(ast) ? ast.toc : undefined
          } catch (e: unknown) {
            console.warn('[ArticleNav] Markdown 解析失败，页面将回退处理:', getErrorMessage(e))
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
    } catch (error: unknown) {
      console.warn('[ArticleNav] 预加载失败，降级直跳:', getErrorMessage(error))
      // 降级：直接导航，走标准加载流程
      await navigateTo({ path: articlePath, query })
    } finally {
      pendingNavigations.delete(articleId)
      // 确保 loading 状态结束
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
