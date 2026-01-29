<template>
  <div class="gallery-manager">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">画廊管理</h2>
        <div class="flex gap-2">
          <n-button type="warning" :loading="isRefreshingDimensions" @click="refreshAllDimensions">
            <template #icon>
              <Icon name="arrow-path" size="sm" />
            </template>
            刷新宽高
          </n-button>
          <n-button type="success" @click="showBatchImportModal = true">
            <template #icon>
              <Icon name="arrow-up-tray" size="sm" />
            </template>
            批量导入
          </n-button>
          <n-button type="primary" @click="showCreateModal">
            <template #icon>
              <Icon name="plus-circle" size="sm" />
            </template>
            添加图片
          </n-button>
        </div>
      </div>

      <!-- 加载状态 -->
      <n-spin :show="loading">
        <div v-if="!loading && galleries.length === 0" class="text-center py-16 text-gray-400">
          <Icon name="images" size="3xl" class="mb-3 opacity-50" />
          <h4 class="text-xl mb-2">暂无图片</h4>
          <p>点击上方按钮添加第一张图片</p>
        </div>

        <template v-else>
          <n-alert type="info" class="mb-4">
            <template #icon>
              <Icon name="information-circle" size="md" />
            </template>
            提示：拖动图片卡片可以调整排序，松开后自动保存
          </n-alert>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div
              v-for="gallery in galleries"
              :key="gallery.id"
              class="gallery-card"
              draggable="true"
              @dragstart="handleDragStart($event, gallery)"
              @dragover.prevent="handleDragOver($event)"
              @drop="handleDrop($event, gallery)"
              @dragend="handleDragEnd"
            >
              <n-card
                :class="{ 'opacity-50': draggedGallery?.id === gallery.id }"
                hoverable
              >
                <!-- 拖动手柄 -->
                <div class="drag-handle absolute top-2 left-2 z-10 cursor-move opacity-60 hover:opacity-100">
                  <Icon name="bars-3" size="md" class="text-white drop-shadow-lg" />
                </div>

                <!-- 图片容器 -->
                <div class="image-container relative group">
                  <img
                    :src="gallery.imageUrl"
                    :alt="`图片 ${gallery.id}`"
                    class="w-full h-48 object-cover rounded-t-lg"
                    @error="handleImageError"
                  />

                  <!-- 悬浮操作层 -->
                  <div class="image-overlay absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <n-button
                      circle
                      quaternary
                      size="small"
                      class="text-white"
                      @click="editGallery(gallery)"
                    >
                      <Icon name="pencil-square" size="md" />
                    </n-button>
                    <n-button
                      circle
                      quaternary
                      size="small"
                      class="text-white"
                      @click="toggleActive(gallery)"
                    >
                      <Icon :name="gallery.isActive ? 'eye' : 'eye'" size="md" />
                    </n-button>
                    <n-button
                      circle
                      quaternary
                      size="small"
                      class="text-red-400"
                      @click="confirmDelete(gallery)"
                    >
                      <Icon name="trash" size="md" />
                    </n-button>
                  </div>

                  <!-- 状态徽章 -->
                  <div class="absolute top-2 right-2">
                    <n-tag :type="gallery.isActive ? 'success' : 'default'" size="small">
                      {{ gallery.isActive ? '显示' : '隐藏' }}
                    </n-tag>
                  </div>
                </div>

                <!-- 卡片底部信息 -->
                <div class="grid grid-cols-3 items-center p-3 text-xs text-gray-500">
                  <span>#{{ gallery.sortOrder }}</span>
                  <span class="text-center">{{ formatDimensions(gallery) }}</span>
                  <span class="text-right">{{ formatDate(gallery.createdAt) }}</span>
                </div>
              </n-card>
            </div>
          </div>
        </template>
      </n-spin>

      <!-- 创建/编辑模态框 -->
      <n-modal v-model:show="showGalleryModal" preset="card" :title="isEdit ? '编辑图片' : '添加图片'" style="width: 500px;">
        <n-form ref="formRef" :model="galleryForm">
          <n-form-item label="图片URL" required>
            <n-input
              v-model:value="galleryForm.imageUrl"
              placeholder="https://example.com/image.jpg"
            />
          </n-form-item>

          <!-- 图片预览 -->
          <div v-if="galleryForm.imageUrl" class="mb-4">
            <n-form-item label="预览">
              <div class="w-full">
                <img
                  :src="galleryForm.imageUrl"
                  alt="预览图片"
                  class="max-w-full h-48 object-contain rounded border"
                  @error="isValidPreview = false"
                  @load="isValidPreview = true"
                />
                <p v-if="!isValidPreview" class="text-yellow-500 text-sm mt-1">
                  <Icon name="exclamation-circle" size="xs" />
                  图片预览加载失败，请检查URL是否正确
                </p>
              </div>
            </n-form-item>
          </div>

          <n-form-item>
            <n-checkbox v-model:checked="galleryForm.isActive">
              在前端显示此图片
            </n-checkbox>
          </n-form-item>
        </n-form>

        <template #footer>
          <div class="flex justify-end gap-2">
            <n-button @click="closeGalleryModal">取消</n-button>
            <n-button type="primary" :loading="isSaving" @click="saveGallery">
              {{ isEdit ? '更新' : '创建' }}
            </n-button>
          </div>
        </template>
      </n-modal>

      <!-- 删除确认模态框 -->
      <n-modal v-model:show="showDeleteModal" preset="dialog" type="warning" title="确认删除">
        <template #default>
          <p>确定要删除这张图片吗？</p>
          <p class="text-gray-500 text-sm">此操作无法撤销。</p>
        </template>
        <template #action>
          <n-button @click="showDeleteModal = false">取消</n-button>
          <n-button type="error" :loading="isDeleting" @click="deleteGalleryItem">删除</n-button>
        </template>
      </n-modal>

      <!-- 批量导入模态框 -->
      <n-modal v-model:show="showBatchImportModal" preset="card" title="批量导入图片" style="width: 600px;">
        <n-form>
          <n-form-item label="图片URL列表">
            <n-input
              v-model:value="batchImportUrls"
              type="textarea"
              :rows="10"
              placeholder="每行一个图片URL，例如：
https://example.com/image1.jpg
https://example.com/image2.jpg
https://example.com/image3.jpg"
            />
          </n-form-item>

          <n-form-item>
            <n-checkbox v-model:checked="batchImportActive">
              导入后立即在前端显示
            </n-checkbox>
          </n-form-item>

          <n-alert v-if="batchPreviewUrls.length > 0" type="info">
            将导入 {{ batchPreviewUrls.length }} 张图片
          </n-alert>
        </n-form>

        <template #footer>
          <div class="flex justify-end gap-2">
            <n-button @click="showBatchImportModal = false">取消</n-button>
            <n-button
              type="success"
              :loading="isBatchImporting"
              :disabled="batchPreviewUrls.length === 0"
              @click="handleBatchImport"
            >
              导入 {{ batchPreviewUrls.length }} 张图片
            </n-button>
          </div>
        </template>
      </n-modal>
    </div>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: 'admin',
  middleware: 'admin-auth'
})

const message = useMessage()
const { getAllGalleries, createGallery, updateGallery, deleteGallery, toggleActive: toggleActiveApi, batchImport, updateSort, refreshDimensions } = useAdminGallery()

const galleries = ref([])
const loading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)
const isBatchImporting = ref(false)
const isRefreshingDimensions = ref(false)
const isEdit = ref(false)
const galleryToDelete = ref(null)
const isValidPreview = ref(true)
const draggedGallery = ref(null)
const dragOverGallery = ref(null)

// 模态框显示状态
const showGalleryModal = ref(false)
const showDeleteModal = ref(false)
const showBatchImportModal = ref(false)

// 批量导入相关
const batchImportUrls = ref('')
const batchImportActive = ref(true)

const galleryForm = ref({
  id: null,
  imageUrl: '',
  isActive: true
})

// 计算批量导入的URL数组
const batchPreviewUrls = computed(() => {
  if (!batchImportUrls.value) return []
  return batchImportUrls.value
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0)
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDimensions = (gallery) => {
  if (!gallery) return '-'
  if (gallery.imageWidth && gallery.imageHeight) {
    return `${gallery.imageWidth}x${gallery.imageHeight}`
  }
  return '-'
}

// 获取画廊列表
const fetchGalleries = async () => {
  loading.value = true
  try {
    galleries.value = await getAllGalleries()
  } catch (error) {
    console.error('获取画廊失败:', error)
    message.error('获取画廊失败')
  } finally {
    loading.value = false
  }
}

// 显示创建模态框
const showCreateModal = () => {
  isEdit.value = false
  galleryForm.value = { id: null, imageUrl: '', isActive: true }
  isValidPreview.value = true
  showGalleryModal.value = true
}

// 编辑画廊
const editGallery = (gallery) => {
  isEdit.value = true
  galleryForm.value = {
    id: gallery.id,
    imageUrl: gallery.imageUrl,
    isActive: gallery.isActive
  }
  isValidPreview.value = true
  showGalleryModal.value = true
}

// 关闭画廊模态框
const closeGalleryModal = () => {
  showGalleryModal.value = false
  galleryForm.value = { id: null, imageUrl: '', isActive: true }
}

// 保存画廊
const saveGallery = async () => {
  if (!galleryForm.value.imageUrl?.trim()) {
    message.warning('请输入图片URL')
    return
  }
  
  isSaving.value = true
  try {
    const payload = {
      imageUrl: galleryForm.value.imageUrl,
      isActive: galleryForm.value.isActive
    }

    if (isEdit.value) {
      await updateGallery(galleryForm.value.id, payload)
      message.success('图片更新成功！')
    } else {
      await createGallery(payload)
      message.success('图片创建成功！')
    }

    closeGalleryModal()
    fetchGalleries()
  } catch (error) {
    console.error('保存画廊失败:', error)
    message.error('保存失败: ' + error.message)
  } finally {
    isSaving.value = false
  }
}

// 切换显示状态
const toggleActive = async (gallery) => {
  try {
    await toggleActiveApi(gallery.id, !gallery.isActive)
    gallery.isActive = !gallery.isActive
    message.success(gallery.isActive ? '图片已显示' : '图片已隐藏')
  } catch (error) {
    console.error('切换状态失败:', error)
    message.error('操作失败')
  }
}

// 确认删除
const confirmDelete = (gallery) => {
  galleryToDelete.value = gallery
  showDeleteModal.value = true
}

// 删除画廊
const deleteGalleryItem = async () => {
  if (!galleryToDelete.value) return
  
  isDeleting.value = true
  try {
    await deleteGallery(galleryToDelete.value.id)
    showDeleteModal.value = false
    galleryToDelete.value = null
    fetchGalleries()
    message.success('图片已删除')
  } catch (error) {
    console.error('删除画廊失败:', error)
    message.error('删除失败')
  } finally {
    isDeleting.value = false
  }
}

// 批量导入
const handleBatchImport = async () => {
  if (batchPreviewUrls.value.length === 0) return
  
  isBatchImporting.value = true
  try {
    await batchImport(batchPreviewUrls.value, batchImportActive.value)
    showBatchImportModal.value = false
    batchImportUrls.value = ''
    fetchGalleries()
    message.success(`成功导入 ${batchPreviewUrls.value.length} 张图片`)
  } catch (error) {
    console.error('批量导入失败:', error)
    message.error('批量导入失败')
  } finally {
    isBatchImporting.value = false
  }
}

// 刷新宽高
const refreshAllDimensions = async () => {
  isRefreshingDimensions.value = true
  try {
    const result = await refreshDimensions()
    await fetchGalleries()
    message.success(`刷新完成：成功 ${result.updated} / ${result.total}，失败 ${result.failed}`)
  } catch (error) {
    console.error('刷新宽高失败:', error)
    message.error('刷新宽高失败')
  } finally {
    isRefreshingDimensions.value = false
  }
}

// 拖拽排序
const handleDragStart = (event, gallery) => {
  draggedGallery.value = gallery
  event.dataTransfer.effectAllowed = 'move'
}

const handleDragOver = (event) => {
  event.dataTransfer.dropEffect = 'move'
}

const handleDrop = async (event, targetGallery) => {
  if (!draggedGallery.value || draggedGallery.value.id === targetGallery.id) return

  const draggedIndex = galleries.value.findIndex(g => g.id === draggedGallery.value.id)
  const targetIndex = galleries.value.findIndex(g => g.id === targetGallery.id)

  // 重新排列
  const newGalleries = [...galleries.value]
  const [removed] = newGalleries.splice(draggedIndex, 1)
  newGalleries.splice(targetIndex, 0, removed)
  galleries.value = newGalleries

  // 更新排序到服务器
  try {
    const sortData = newGalleries.map((g, index) => ({
      id: g.id,
      sortOrder: index + 1
    }))
    await updateSort(sortData)
    message.success('排序已更新')
  } catch (error) {
    console.error('更新排序失败:', error)
    message.error('更新排序失败')
    fetchGalleries() // 恢复原始顺序
  }
}

const handleDragEnd = () => {
  draggedGallery.value = null
  dragOverGallery.value = null
}

const handleImageError = (event) => {
  event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23eee" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3E加载失败%3C/text%3E%3C/svg%3E'
}

onMounted(() => {
  fetchGalleries()
})
</script>

<style scoped>
.gallery-card {
  transition: transform 0.2s ease;
}

.gallery-card:hover {
  transform: translateY(-4px);
}

.drag-handle {
  transition: opacity 0.2s;
}
</style>
