import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { consumePreloadedArticle } from '~/utils/articlePreloadCache'
import { createArticleDetailRepository } from '~/features/article-detail/services/articleDetail.repository'
import { logAppError, toNuxtErrorPayload } from '~/shared/errors'

export const useArticleDetailPage = async () => {
  const repository = createArticleDetailRepository()
  const route = useRoute()
  const router = useRouter()
  const config = useRuntimeConfig()

  const rawIdParam = computed(() => String(route.params.id || ''))
  const articleId = computed(() => rawIdParam.value.split('-')[0])
  const routeSlug = computed(() => rawIdParam.value.split('-').slice(1).join('-'))

  const { data: article, pending, error } = await useAsyncData(
    `article-${route.params.id}`,
    async () => {
      const id = articleId.value
      if (!id || !/^\d+$/.test(id)) {
        throw createError(toNuxtErrorPayload({ statusCode: 400, statusMessage: '未提供文章ID' }))
      }

      let response: Record<string, unknown> | null = null
      try {
        response = await repository.getArticleById(id)
      } catch (fetchError) {
        logAppError('article-detail', '加载文章详情', fetchError)
        throw createError(
          toNuxtErrorPayload(fetchError, {
            fallback: '文章加载失败',
            notFound: '文章不存在'
          })
        )
      }

      if (!response) {
        throw createError(toNuxtErrorPayload({ statusCode: 404, statusMessage: '文章不存在' }))
      }

      if (response.contentMarkdown) {
        try {
          const ast = await parseMarkdown(String(response.contentMarkdown), {
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

          if (process.server) {
            console.log('[SSR] Markdown 预解析成功，TOC:', ast.toc?.links?.length || 0, '项')
          } else {
            console.log('[Client] Markdown 解析成功，TOC:', ast.toc?.links?.length || 0, '项')
          }
        } catch (e) {
          const markdownError = e as Error
          console.error('[Markdown] 解析失败:', markdownError.message)
        }
      }

      return response
    },
    {
      watch: [articleId],
      lazy: false,
      getCachedData: (key, nuxtApp, ctx) => {
        if (ctx?.cause === 'refresh:manual') return undefined

        if (import.meta.client) {
          const preloaded = consumePreloadedArticle(key)
          if (preloaded) {
            console.log('[ArticlePage] 命中预加载缓存，跳过 fetch + parseMarkdown')
            return preloaded
          }
        }

        return nuxtApp.payload?.data?.[key] ?? nuxtApp.static?.data?.[key]
      }
    }
  )

  const canonicalPath = computed(() => {
    if (!article.value) return ''
    if (!(article.value as { slug?: string }).slug) return `/article/${(article.value as { id?: string | number }).id}`
    const detail = article.value as { id?: string | number; slug?: string }
    return `/article/${detail.id}-${detail.slug}`
  })

  const baseSiteUrl = computed(() => (config.public.siteUrl || '').replace(/\/$/, ''))
  const canonicalUrl = computed(() => {
    if (!canonicalPath.value) return ''
    return `${baseSiteUrl.value}${canonicalPath.value}`
  })

  const resolveUrl = (value: string | undefined | null): string => {
    if (!value) return ''
    if (/^https?:\/\//i.test(value)) return value
    if (!baseSiteUrl.value) return value
    if (value.startsWith('/')) return `${baseSiteUrl.value}${value}`
    return `${baseSiteUrl.value}/${value}`
  }

  if ((article.value as { slug?: string } | null)?.slug && routeSlug.value !== (article.value as { slug?: string }).slug) {
    await navigateTo({ path: canonicalPath.value, query: route.query }, { redirectCode: 301 })
  }

  if (error.value) {
    throw createError(toNuxtErrorPayload(error.value, { fallback: '文章加载失败' }))
  }

  const headings = ref<unknown[]>([])

  const getDescription = (content: string | undefined | null, maxLength = 160): string => {
    if (!content) return '文章详情'
    const text = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
  }

  useSeoMeta({
    title: () => (article.value as { title?: string } | null)?.title || '文章详情',
    description: () => (article.value as { aiSummary?: string; content?: string } | null)?.aiSummary || getDescription((article.value as { content?: string } | null)?.content),
    ogTitle: () => (article.value as { title?: string } | null)?.title || '文章详情',
    ogDescription: () => (article.value as { aiSummary?: string; content?: string } | null)?.aiSummary || getDescription((article.value as { content?: string } | null)?.content),
    ogImage: () => {
      const image = (article.value as { coverImage?: string } | null)?.coverImage
      return image && image !== 'null' ? image : undefined
    },
    ogUrl: () => canonicalUrl.value || undefined,
    ogType: 'article',
    twitterImage: () => {
      const image = (article.value as { coverImage?: string } | null)?.coverImage
      return image && image !== 'null' ? image : undefined
    }
  })

  useHead(() => ({
    link: canonicalUrl.value ? [{ rel: 'canonical', href: canonicalUrl.value }] : []
  }))

  const schemaGraph = computed(() => {
    if (!article.value) return []

    const detail = article.value as {
      title?: string
      aiSummary?: string
      content?: string
      coverImage?: string
      createdAt?: string
      updatedAt?: string
    }

    const title = detail.title || '文章详情'
    const description = detail.aiSummary || getDescription(detail.content)
    const imageUrl = resolveUrl(detail.coverImage && detail.coverImage !== 'null'
      ? detail.coverImage
      : '/og-default.svg')
    const articleUrl = canonicalUrl.value || resolveUrl(canonicalPath.value)
    const siteUrl = baseSiteUrl.value || resolveUrl('/')

    return [
      {
        '@type': 'Article',
        headline: title,
        description,
        image: imageUrl,
        author: {
          '@type': 'Person',
          name: 'WyrmKk',
          url: siteUrl
        },
        datePublished: detail.createdAt,
        dateModified: detail.updatedAt || detail.createdAt,
        mainEntityOfPage: articleUrl
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: '首页',
            item: siteUrl
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: title,
            item: articleUrl
          }
        ]
      }
    ]
  })

  useSchemaOrg(schemaGraph)

  const goBack = () => {
    if (import.meta.client && window.history.length > 1) {
      router.back()
    } else {
      navigateTo('/')
    }
  }

  const onTocReady = (toc: unknown[]) => {
    headings.value = toc
  }

  return {
    article,
    pending,
    error,
    headings,
    goBack,
    onTocReady
  }
}