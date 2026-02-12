import { useAdminArticlesFeature } from '~/features/article-admin/composables/useAdminArticlesFeature'

export const useAdminArticles = () => {
  return useAdminArticlesFeature()
}
