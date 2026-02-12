import type {
  AdminGallery,
  ApiOperationResult,
  AuthFetchLike,
  BatchImportGalleryPayload,
  BatchImportGalleryResult,
  CreateGalleryPayload,
  GalleryRefreshResult,
  UpdateGalleryPayload,
  UpdateSortOrderPayload
} from '~/types/api'
import { withApiError } from '~/shared/api/client'
import { toAppResult } from '~/shared/types/result'
import type { AppResult } from '~/shared/types/result'

export const useAdminGalleryFeature = () => {
  const authStore = useAuthStore() as AuthFetchLike

  const getAllGalleries = async (): Promise<AdminGallery[]> => {
    return await withApiError('AdminGallery', '获取画廊', async () => {
      return await authStore.authFetch<AdminGallery[]>('/gallery/admin')
    })
  }

  const createGallery = async (galleryData: CreateGalleryPayload): Promise<AdminGallery> => {
    return await withApiError('AdminGallery', '创建画廊', async () => {
      return await authStore.authFetch<AdminGallery>('/gallery', {
        method: 'POST',
        body: galleryData
      })
    })
  }

  const updateGallery = async (
    id: string | number,
    galleryData: UpdateGalleryPayload
  ): Promise<AdminGallery> => {
    return await withApiError('AdminGallery', '更新画廊', async () => {
      return await authStore.authFetch<AdminGallery>(`/gallery/${id}`, {
        method: 'PATCH',
        body: galleryData
      })
    })
  }

  const deleteGallery = async (id: string | number): Promise<void> => {
    return await withApiError('AdminGallery', '删除画廊', async () => {
      await authStore.authFetch<void>(`/gallery/${id}`, {
        method: 'DELETE'
      })
    })
  }

  const toggleActive = async (id: string | number): Promise<AdminGallery> => {
    return await withApiError('AdminGallery', '切换显示状态', async () => {
      return await authStore.authFetch<AdminGallery>(`/gallery/${id}/toggle-active`, {
        method: 'PATCH'
      })
    })
  }

  const batchImport = async (data: BatchImportGalleryPayload): Promise<BatchImportGalleryResult> => {
    return await withApiError('AdminGallery', '批量导入', async () => {
      return await authStore.authFetch<BatchImportGalleryResult>('/gallery/batch/import', {
        method: 'POST',
        body: data
      })
    })
  }

  const updateSort = async (sortData: UpdateSortOrderPayload): Promise<ApiOperationResult> => {
    return await withApiError('AdminGallery', '更新排序', async () => {
      return await authStore.authFetch<ApiOperationResult>('/gallery/batch/sort-order', {
        method: 'PATCH',
        body: sortData
      })
    })
  }

  const refreshDimensions = async (): Promise<GalleryRefreshResult> => {
    return await withApiError('AdminGallery', '刷新图片宽高', async () => {
      return await authStore.authFetch<GalleryRefreshResult>('/gallery/refresh-dimensions', {
        method: 'POST'
      })
    })
  }

  const getAllGalleriesResult = async (): Promise<AppResult<AdminGallery[]>> => {
    return await toAppResult(() => getAllGalleries(), '获取画廊失败')
  }

  const createGalleryResult = async (galleryData: CreateGalleryPayload): Promise<AppResult<AdminGallery>> => {
    return await toAppResult(() => createGallery(galleryData), '创建画廊失败')
  }

  const updateGalleryResult = async (
    id: string | number,
    galleryData: UpdateGalleryPayload
  ): Promise<AppResult<AdminGallery>> => {
    return await toAppResult(() => updateGallery(id, galleryData), '更新画廊失败')
  }

  const deleteGalleryResult = async (id: string | number): Promise<AppResult<void>> => {
    return await toAppResult(() => deleteGallery(id), '删除画廊失败')
  }

  return {
    getAllGalleries,
    getAllGalleriesResult,
    createGallery,
    createGalleryResult,
    updateGallery,
    updateGalleryResult,
    deleteGallery,
    deleteGalleryResult,
    toggleActive,
    batchImport,
    updateSort,
    refreshDimensions
  }
}