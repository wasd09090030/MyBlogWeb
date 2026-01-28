import { defineEventHandler } from 'h3'

type ArticleSummary = {
  id: number
  slug?: string | null
  createdAt?: string
  updatedAt?: string
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const apiBase = (config.public.apiBase || '').replace(/\/$/, '')
  if (!apiBase) {
    return []
  }

  try {
    const response = await $fetch<{
      data?: ArticleSummary[]
    } | ArticleSummary[]>(`${apiBase}/articles`, {
      query: { summary: true }
    })

    const articles = Array.isArray(response) ? response : response?.data || []

    return articles.map((article) => {
      const slugSuffix = article.slug ? `-${article.slug}` : ''
      return {
        loc: `/article/${article.id}${slugSuffix}`,
        lastmod: article.updatedAt || article.createdAt,
        changefreq: 'weekly',
        priority: 0.8
      }
    })
  } catch (error) {
    console.warn('[sitemap] Failed to fetch article list', error)
    return []
  }
})
