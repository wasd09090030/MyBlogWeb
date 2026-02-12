import { useArticleCacheFeature } from '~/features/article-list/composables/useArticleCacheFeature'

export const useArticleCache = () => {
  return useArticleCacheFeature()
}
