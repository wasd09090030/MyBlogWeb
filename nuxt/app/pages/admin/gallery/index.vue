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

      <!-- Cloudflare 缩略图配置 -->
      <n-card class="mb-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Icon name="cog-6-tooth" size="sm" class="text-gray-500" />
            <span class="font-semibold text-gray-700 dark:text-gray-200">缩略图设置（Cloudflare）</span>
            <n-tag :type="cfConfigForm.isEnabled ? 'success' : 'default'" size="small">
              {{ cfConfigForm.isEnabled ? '已启用' : '未启用' }}
            </n-tag>
          </div>
          <div class="flex gap-2">
            <n-button size="small" quaternary :loading="isLoadingCfConfig" @click="loadCfConfig">
              <template #icon>
                <Icon name="arrow-path" size="sm" />
              </template>
              刷新
            </n-button>
            <n-button size="small" type="primary" :loading="isSavingCfConfig" @click="saveCfConfig">
              保存设置
            </n-button>
          </div>
        </div>

        <n-spin :show="isLoadingCfConfig">
          <n-form :model="cfConfigForm" label-placement="left" label-width="120">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <n-form-item label="启用缩略图">
                <n-switch v-model:value="cfConfigForm.isEnabled" />
              </n-form-item>
              <n-form-item label="使用 Worker">
                <n-switch v-model:value="cfConfigForm.useWorker" />
              </n-form-item>
              <n-form-item label="强制 HTTPS">
                <n-switch v-model:value="cfConfigForm.useHttps" />
              </n-form-item>
              <n-form-item label="Zone 域名">
                <n-input
                  v-model:value="cfConfigForm.zoneDomain"
                  placeholder="imgbed.test.test 或 https://imgbed.test.test"
                />
              </n-form-item>
              <n-form-item v-if="cfConfigForm.useWorker" label="Worker 域名">
                <n-input
                  v-model:value="cfConfigForm.workerBaseUrl"
                  placeholder="https://imgworker.wasd09090030.top"
                />
              </n-form-item>
              <n-form-item v-if="cfConfigForm.useWorker" label="签名有效期(秒)">
                <n-input-number v-model:value="cfConfigForm.tokenTtlSeconds" :min="60" />
              </n-form-item>
              <n-form-item label="缩放模式">
                <n-select
                  v-model:value="cfConfigForm.fit"
                  :options="fitOptions"
                  filterable
                />
              </n-form-item>
              <n-form-item label="缩略图宽度">
                <n-input-number v-model:value="cfConfigForm.width" :min="0" />
              </n-form-item>
              <n-form-item label="图片质量">
                <n-input-number v-model:value="cfConfigForm.quality" :min="0" :max="100" />
              </n-form-item>
              <n-form-item label="输出格式">
                <n-select
                  v-model:value="cfConfigForm.format"
                  :options="formatOptions"
                  filterable
                />
              </n-form-item>
              <n-form-item label="签名参数名">
                <n-input v-model:value="cfConfigForm.signatureParam" placeholder="sig" />
              </n-form-item>
              <n-form-item label="签名 Token">
                <n-input v-model:value="cfConfigForm.signatureToken" placeholder="与 WAF 规则匹配的 token" />
              </n-form-item>
              <n-form-item label="签名 Secret">
                <n-input
                  v-model:value="cfConfigForm.signatureSecret"
                  type="password"
                  show-password-on="click"
                  placeholder="可选 HMAC 密钥"
                />
              </n-form-item>
            </div>
          </n-form>
          <p class="text-xs text-gray-500 mt-3">
            提示：使用 Worker 时必须配置“签名 Secret”并设置有效期；仅用 Token 只用于 WAF 规则匹配，不具备验签安全性。
          </p>
        </n-spin>
      </n-card>

      <!-- 加载状态 -->
      <n-spin :show="loading">
        <div v-if="!loading && galleries.length === 0" class="text-center py-16 text-gray-400">
          <Icon name="images" size="3xl" class="mb-3 opacity-50" />
          <h4 class="text-xl mb-2">暂无图片</h4>
          <p>点击上方按钮添加第一张图片</p>
        </div>

        <template v-else>
          <!-- 过滤和排序控制栏 -->
          <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
            <n-tabs v-model:value="activeTab" type="segment" animated>
              <n-tab-pane name="all" tab="全部">
                <template #tab>
                  <div class="flex items-center gap-2">
                    <Icon name="squares-2x2" size="sm" />
                    <span>全部 ({{ galleries.length }})</span>
                  </div>
                </template>
              </n-tab-pane>
              <n-tab-pane name="game" tab="游戏截图">
                <template #tab>
                  <div class="flex items-center gap-2">
                    <Icon name="puzzle-piece" size="sm" />
                    <span>游戏截图 ({{ gameCount }})</span>
                  </div>
                </template>
              </n-tab-pane>
              <n-tab-pane name="artwork" tab="艺术作品">
                <template #tab>
                  <div class="flex items-center gap-2">
                    <Icon name="paint-brush" size="sm" />
                    <span>艺术作品 ({{ artworkCount }})</span>
                  </div>
                </template>
              </n-tab-pane>
            </n-tabs>

            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">排序方式:</span>
              <n-select
                v-model:value="sortBy"
                :options="sortOptions"
                style="width: 180px"
                size="small"
              />
            </div>
          </div>

          <n-alert type="info" class="mb-4">
            <template #icon>
              <Icon name="information-circle" size="md" />
            </template>
            提示：拖动图片卡片可以调整排序，松开后自动保存（仅在"手动排序"模式下生效）
          </n-alert>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div
              v-for="gallery in filteredAndSortedGalleries"
              :key="gallery.id"
              class="gallery-card"
              :draggable="sortBy === 'manual'"
              @dragstart="handleDragStart($event, gallery)"
              @dragover.prevent="handleDragOver($event)"
              @drop="handleDrop($event, gallery)"
              @dragend="handleDragEnd"
            >
              <n-card
                :class="{ 'opacity-50': draggedGallery?.id === gallery.id }"
                hoverable
              >
                <!-- 拖动手柄（仅在手动排序模式下显示） -->
                <div v-if="sortBy === 'manual'" class="drag-handle absolute top-2 left-2 z-10 cursor-move opacity-60 hover:opacity-100">
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

          <n-form-item label="类型">
            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-500">艺术作品</span>
              <n-switch
                v-model:value="galleryForm.tag"
                checked-value="game"
                unchecked-value="artwork"
              >
                <template #checked>游戏截屏</template>
                <template #unchecked>艺术作品</template>
              </n-switch>
              <span class="text-sm text-gray-500">游戏截屏</span>
            </div>
          </n-form-item>

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

          <n-form-item label="类型">
            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-500">艺术作品</span>
              <n-switch
                v-model:value="batchImportTag"
                checked-value="game"
                unchecked-value="artwork"
              >
                <template #checked>游戏截屏</template>
                <template #unchecked>艺术作品</template>
              </n-switch>
              <span class="text-sm text-gray-500">游戏截屏</span>
            </div>
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
import { useAdminGalleryFeature } from '~/features/gallery-admin/composables/useAdminGalleryFeature'

definePageMeta({
  ssr: false,
  layout: 'admin',
  middleware: 'admin-auth'
})

const message = useMessage()
const { getAllGalleries, createGallery, updateGallery, deleteGallery, toggleActive: toggleActiveApi, batchImport, updateSort, refreshDimensions } = useAdminGalleryFeature()
const cfConfigApi = useCfImageConfig()

const galleries = ref([])
const loading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)
const isBatchImporting = ref(false)
const isRefreshingDimensions = ref(false)
const isLoadingCfConfig = ref(false)
const isSavingCfConfig = ref(false)
const isEdit = ref(false)
const galleryToDelete = ref(null)
const isValidPreview = ref(true)
const draggedGallery = ref(null)
const dragOverGallery = ref(null)

// 过滤和排序状态
const activeTab = ref('all')
const sortBy = ref('manual')

// 模态框显示状态
const showGalleryModal = ref(false)
const showDeleteModal = ref(false)
const showBatchImportModal = ref(false)

// 批量导入相关
const batchImportUrls = ref('')
const batchImportActive = ref(true)
const batchImportTag = ref('artwork')

const defaultCfConfig = {
  isEnabled: true,
  zoneDomain: '',
  useHttps: true,
  fit: 'scale-down',
  width: 300,
  quality: 50,
  format: 'webp',
  signatureParam: 'sig',
  useWorker: false,
  workerBaseUrl: '',
  tokenTtlSeconds: 3600,
  signatureToken: '',
  signatureSecret: ''
}

const cfConfigForm = ref({ ...defaultCfConfig })

const fitOptions = [
  { label: 'scale-down', value: 'scale-down' },
  { label: 'cover', value: 'cover' },
  { label: 'contain', value: 'contain' },
  { label: 'fill', value: 'fill' },
  { label: 'crop', value: 'crop' },
  { label: 'pad', value: 'pad' }
]

const formatOptions = [
  { label: 'webp', value: 'webp' },
  { label: 'avif', value: 'avif' },
  { label: 'jpeg', value: 'jpeg' },
  { label: 'png', value: 'png' },
  { label: 'auto', value: 'auto' }
]

const sortOptions = [
  { label: '手动排序', value: 'manual' },
  { label: '最新上传', value: 'newest' },
  { label: '最早上传', value: 'oldest' }
]

const galleryForm = ref({
  id: null,
  imageUrl: '',
  isActive: true,
  tag: 'artwork'
})
// 统计数量
const gameCount = computed(() => {
  return galleries.value.filter(g => g.tag === 'game').length
})

const artworkCount = computed(() => {
  return galleries.value.filter(g => g.tag === 'artwork').length
})

// 过滤和排序后的画廊列表
const filteredAndSortedGalleries = computed(() => {
  let filtered = [...galleries.value]
  
  // 根据标签过滤
  if (activeTab.value === 'game') {
    filtered = filtered.filter(g => g.tag === 'game')
  } else if (activeTab.value === 'artwork') {
    filtered = filtered.filter(g => g.tag === 'artwork')
  }
  
  // 根据排序方式排序
  if (sortBy.value === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } else if (sortBy.value === 'oldest') {
    filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  } else {
    // 手动排序，按 sortOrder
    filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  }
  
  return filtered
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
  galleryForm.value = { id: null, imageUrl: '', isActive: true, tag: 'artwork' }
  isValidPreview.value = true
  showGalleryModal.value = true
}

// 编辑画廊
const editGallery = (gallery) => {
  isEdit.value = true
  galleryForm.value = {
    id: gallery.id,
    imageUrl: gallery.imageUrl,
    isActive: gallery.isActive,
    tag: gallery.tag || 'artwork'
  }
  isValidPreview.value = true
  showGalleryModal.value = true
}

// 关闭画廊模态框
const closeGalleryModal = () => {
  showGalleryModal.value = false
  galleryForm.value = { id: null, imageUrl: '', isActive: true, tag: 'artwork' }
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
      isActive: galleryForm.value.isActive,
      tag: galleryForm.value.tag
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
    await batchImport({
      imageUrls: batchPreviewUrls.value,
      isActive: batchImportActive.value,
      tag: batchImportTag.value
    })
    showBatchImportModal.value = false
    batchImportUrls.value = ''
    batchImportTag.value = 'artwork'
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
  if (sortBy.value !== 'manual') {
    message.warning('请切换到"手动排序"模式才能拖拽调整顺序')
    return
  }

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

const loadCfConfig = async () => {
  isLoadingCfConfig.value = true
  try {
    const config = await cfConfigApi.getConfig()
    cfConfigForm.value = {
      ...defaultCfConfig,
      ...config
    }
  } catch (error) {
    console.error('获取缩略图配置失败:', error)
    message.error('获取缩略图配置失败')
  } finally {
    isLoadingCfConfig.value = false
  }
}

const saveCfConfig = async () => {
  isSavingCfConfig.value = true
  try {
    const payload = {
      ...cfConfigForm.value,
      width: cfConfigForm.value.width ?? 0,
      quality: cfConfigForm.value.quality ?? 0,
      tokenTtlSeconds: cfConfigForm.value.tokenTtlSeconds ?? 3600
    }
    await cfConfigApi.saveConfig(payload)
    message.success('缩略图配置已保存')
  } catch (error) {
    console.error('保存缩略图配置失败:', error)
    message.error('保存缩略图配置失败')
  } finally {
    isSavingCfConfig.value = false
  }
}

onMounted(() => {
  fetchGalleries()
  loadCfConfig()
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
