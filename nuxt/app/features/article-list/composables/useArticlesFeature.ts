import type { ArticleLike } from '~/utils/workers/types'
import type { ArticleCacheFacade, ArticlesListOptions } from '~/features/article-list/types/article'
import { createArticlesRepository } from '~/features/article-list/services/articles.repository'
import { useArticleCacheFeature } from '~/features/article-list/composables/useArticleCacheFeature'
import { toAppResult } from '~/shared/types/result'
import type { AppResult } from '~/shared/types/result'

export const useArticlesFeature = () => {
  const articleCache = useArticleCacheFeature() as ArticleCacheFacade
  const repository = createArticlesRepository()

  const getFeaturedArticles = async (limit = 5): Promise<ArticleLike[] | null> => {
    return await repository.getFeaturedArticles(limit)
  }

  const searchArticles = async (keyword: string): Promise<ArticleLike[]> => {
    if (articleCache.isCacheValid()) {
      return articleCache.searchArticlesLocal(keyword)
    }
    return await repository.searchArticles(keyword)
  }

  const getArticles = async (options: ArticlesListOptions = {}): Promise<unknown> => {
    return await repository.getArticles(options)
  }

  const getAllArticles = async (forceRefresh = false): Promise<ArticleLike[] | null> => {
    return await articleCache.getAllArticles(forceRefresh)
  }

  const getArticlesByCategory = async (category: string): Promise<ArticleLike[]> => {
    if (articleCache.isCacheValid()) {
      return articleCache.getArticlesByCategory(category)
    }
    return await repository.getArticlesByCategory(category)
  }

  const invalidateCache = (): void => {
    articleCache.invalidateCache()
  }

  const getArticlesResult = async (options: ArticlesListOptions = {}): Promise<AppResult<unknown>> => {
    return await toAppResult(() => getArticles(options), '获取文章列表失败')
  }

  const getAllArticlesResult = async (forceRefresh = false): Promise<AppResult<ArticleLike[] | null>> => {
    return await toAppResult(() => getAllArticles(forceRefresh), '获取文章缓存失败')
  }

  const getFeaturedArticlesResult = async (limit = 5): Promise<AppResult<ArticleLike[] | null>> => {
    return await toAppResult(() => getFeaturedArticles(limit), '获取推荐文章失败')
  }

  return {
    getFeaturedArticles,
    getFeaturedArticlesResult,
    searchArticles,
    getArticles,
    getArticlesResult,
    getAllArticles,
    getAllArticlesResult,
    getArticlesByCategory,
    invalidateCache,
    categoryStats: articleCache.categoryStats,
    monthStats: articleCache.monthStats
  }
}