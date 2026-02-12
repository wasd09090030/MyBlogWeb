import { useAdminCommentsFeature } from '~/features/article-admin/composables/useAdminCommentsFeature'

export const useAdminComments = () => {
  return useAdminCommentsFeature()
}
