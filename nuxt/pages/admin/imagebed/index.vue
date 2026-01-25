<template>
  <div class="imagebed-manager">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white">图床管理</h2>
      <n-button type="primary" @click="showConfigModal = true">
        <template #icon>
          <Icon name="cog-6-tooth" size="sm" />
        </template>
        配置设置
      </n-button>
    </div>

    <!-- 配置检查 -->
    <n-alert v-if="!isConfigured" type="warning" class="mb-4">
      <template #icon>
        <Icon name="exclamation-triangle" size="md" />
      </template>
      请先配置图床域名和API Token
    </n-alert>

    <!-- 主功能区 -->
    <n-tabs v-model:value="activeTab" type="card" animated>
      <!-- 上传图片 Tab -->
      <n-tab-pane name="upload" tab="上传图片">
        <div class="py-4">
          <n-upload
            :custom-request="handleUpload"
            :accept="acceptTypes"
            :disabled="!isConfigured"
            :show-file-list="true"
            :max="10"
            multiple
            list-type="image-card"
            @change="handleUploadChange"
            @remove="handleRemoveFromList"
          >
            <n-upload-dragger>
              <div class="flex flex-col items-center py-6">
                <Icon name="arrow-up-tray" size="3xl" class="text-gray-400 mb-4" />
                <p class="text-gray-600 dark:text-gray-400 mb-2">点击或拖拽图片到此处上传</p>
                <p class="text-gray-400 text-sm">支持 JPG、PNG、GIF、WebP、AVIF 格式</p>
              </div>
            </n-upload-dragger>
          </n-upload>

          <!-- 上传目录设置 -->
          <div class="mt-4">
            <n-input
              v-model:value="uploadFolder"
              placeholder="上传目录（可选，如：images/2024）"
              clearable
            >
              <template #prefix>
                <Icon name="folder" size="sm" class="text-gray-400" />
              </template>
            </n-input>
          </div>

          <!-- 已上传文件列表 -->
          <div v-if="uploadedFiles.length > 0" class="mt-6">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-lg font-medium text-gray-800 dark:text-white">
                本次上传成功 ({{ uploadedFiles.length }})
              </h4>
              <n-button size="small" @click="copyAllUrls">
                <template #icon>
                  <Icon name="clipboard-document-list" size="sm" />
                </template>
                复制全部链接
              </n-button>
            </div>
            <n-data-table
              :columns="uploadedColumns"
              :data="uploadedFiles"
              :bordered="false"
              size="small"
            />
          </div>
        </div>
      </n-tab-pane>

      <!-- 文件列表 Tab -->
      <n-tab-pane name="list" tab="文件列表">
        <div class="py-4">
          <!-- 操作栏 -->
          <div class="flex flex-wrap gap-3 mb-4">
            <n-input
              v-model:value="searchKeyword"
              placeholder="搜索文件名"
              clearable
              class="w-64"
              @keyup.enter="fetchFileList"
            >
              <template #prefix>
                <Icon name="magnifying-glass" size="sm" class="text-gray-400" />
              </template>
            </n-input>
            <n-input
              v-model:value="listDir"
              placeholder="指定目录（可选）"
              clearable
              class="w-48"
            >
              <template #prefix>
                <Icon name="folder" size="sm" class="text-gray-400" />
              </template>
            </n-input>
            <n-button type="primary" @click="fetchFileList" :loading="listLoading" :disabled="!isConfigured">
              <template #icon>
                <Icon name="arrow-path" size="sm" />
              </template>
              刷新列表
            </n-button>
            <n-button
              v-if="selectedRowKeys.length > 0"
              type="error"
              @click="confirmBatchDelete"
            >
              <template #icon>
                <Icon name="trash" size="sm" />
              </template>
              批量删除 ({{ selectedRowKeys.length }})
            </n-button>
          </div>

          <!-- 文件列表 -->
          <n-spin :show="listLoading">
            <div v-if="!listLoading && fileList.length === 0" class="text-center py-16 text-gray-400">
              <Icon name="folder-open" size="3xl" class="mb-3 opacity-50" />
              <h4 class="text-xl mb-2">暂无文件</h4>
              <p>点击上方刷新按钮获取文件列表</p>
            </div>
            <template v-else>
              <n-data-table
                :columns="fileColumns"
                :data="fileList"
                :row-key="(row) => row.name"
                :checked-row-keys="selectedRowKeys"
                @update:checked-row-keys="handleCheck"
                :bordered="false"
                :pagination="pagination"
                @update:page="handlePageChange"
              />
              <div class="mt-2 text-sm text-gray-500">
                共 {{ totalCount }} 个文件
              </div>
            </template>
          </n-spin>
        </div>
      </n-tab-pane>

      <!-- 删除文件 Tab -->
      <n-tab-pane name="delete" tab="删除文件">
        <div class="py-4">
          <n-alert type="warning" class="mb-4">
            <template #icon>
              <Icon name="exclamation-triangle" size="md" />
            </template>
            删除操作不可恢复，请谨慎操作
          </n-alert>

          <div class="flex flex-col gap-4">
            <!-- 单文件删除 -->
            <n-card title="单文件删除" size="small">
              <div class="flex gap-3">
                <n-input
                  v-model:value="deleteFilePath"
                  placeholder="输入文件路径，如：images/photo.jpg"
                  clearable
                  class="flex-1"
                />
                <n-button
                  type="error"
                  :loading="deleteLoading"
                  :disabled="!isConfigured || !deleteFilePath"
                  @click="confirmDeleteSingle"
                >
                  删除文件
                </n-button>
              </div>
            </n-card>

            <!-- 文件夹删除 -->
            <n-card title="文件夹删除" size="small">
              <div class="flex gap-3">
                <n-input
                  v-model:value="deleteFolderPath"
                  placeholder="输入文件夹路径，如：images/2024"
                  clearable
                  class="flex-1"
                />
                <n-button
                  type="error"
                  :loading="deleteFolderLoading"
                  :disabled="!isConfigured || !deleteFolderPath"
                  @click="confirmDeleteFolder"
                >
                  删除文件夹
                </n-button>
              </div>
              <p class="text-gray-400 text-sm mt-2">
                注意：将递归删除该文件夹下的所有文件和子文件夹
              </p>
            </n-card>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <!-- 配置模态框 -->
    <n-modal v-model:show="showConfigModal" preset="dialog" title="图床配置">
      <template #icon>
        <Icon name="cog-6-tooth" size="md" />
      </template>
      <n-form
        ref="configFormRef"
        :model="configForm"
        :rules="configRules"
        label-placement="top"
      >
        <n-form-item label="图床域名" path="domain">
          <n-input
            v-model:value="configForm.domain"
            placeholder="https://your-imgbed.example.com"
          />
        </n-form-item>
        <n-form-item label="API Token" path="apiToken">
          <n-input
            v-model:value="configForm.apiToken"
            type="password"
            placeholder="输入你的 API Token"
            show-password-on="click"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showConfigModal = false">取消</n-button>
        <n-button type="primary" @click="saveConfig">保存配置</n-button>
      </template>
    </n-modal>

    <!-- 图片预览模态框 -->
    <n-modal v-model:show="showPreviewModal" preset="card" style="width: auto; max-width: 90vw;">
      <img :src="previewUrl" class="max-h-[80vh] object-contain" />
    </n-modal>
  </div>
</template>

<script setup>
import { useMessage } from 'naive-ui'
import { h } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

const message = useMessage()

// 配置状态
const showConfigModal = ref(false)
const configFormRef = ref(null)
const configForm = ref({
  domain: '',
  apiToken: ''
})

const configRules = {
  domain: { required: true, message: '请输入图床域名', trigger: 'blur' },
  apiToken: { required: true, message: '请输入API Token', trigger: 'blur' }
}

const isConfigured = computed(() => {
  return configForm.value.domain && configForm.value.apiToken
})

// Tab 状态
const activeTab = ref('upload')

// 上传相关
const uploadFolder = ref('')
const uploadedFiles = ref([])
const acceptTypes = 'image/jpeg,image/png,image/gif,image/webp,image/avif'

// 列表相关
const listLoading = ref(false)
const fileList = ref([])
const searchKeyword = ref('')
const listDir = ref('')
const selectedRowKeys = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = 20

const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize,
  itemCount: totalCount.value,
  showSizePicker: false
}))

// 删除相关
const deleteLoading = ref(false)
const deleteFolderLoading = ref(false)
const deleteFilePath = ref('')
const deleteFolderPath = ref('')

// 预览
const showPreviewModal = ref(false)
const previewUrl = ref('')

// 从 localStorage 加载配置
onMounted(() => {
  if (process.client) {
    const savedConfig = localStorage.getItem('imagebedConfig')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        configForm.value = parsed
      } catch (e) {
        console.error('Failed to load imagebed config:', e)
      }
    }
  }
})

// 保存配置
const saveConfig = () => {
  configFormRef.value?.validate((errors) => {
    if (!errors) {
      if (process.client) {
        localStorage.setItem('imagebedConfig', JSON.stringify(configForm.value))
      }
      showConfigModal.value = false
      message.success('配置已保存')
    }
  })
}

// 获取带域名的完整URL
const getFullUrl = (src) => {
  const domain = configForm.value.domain.replace(/\/$/, '')
  const path = src.startsWith('/') ? src : `/${src}`
  return `${domain}${path}`
}

// 上传处理
const handleUpload = async ({ file, onFinish, onError, onProgress }) => {
  const formData = new FormData()
  formData.append('file', file.file)

  const domain = configForm.value.domain.replace(/\/$/, '')
  const params = new URLSearchParams({
    uploadChannel: 'cfr2',
    returnFormat: 'default'
  })
  if (uploadFolder.value) {
    params.append('uploadFolder', uploadFolder.value)
  }

  try {
    const response = await fetch(`${domain}/upload?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${configForm.value.apiToken}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`)
    }

    const result = await response.json()
    
    if (Array.isArray(result) && result.length > 0 && result[0].src) {
      const fullUrl = getFullUrl(result[0].src)
      uploadedFiles.value.push({
        name: file.name,
        url: fullUrl,
        src: result[0].src,
        uploadTime: new Date().toLocaleString()
      })
      message.success(`${file.name} 上传成功`)
      onFinish()
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.error('Upload error:', error)
    message.error(`${file.name} 上传失败: ${error.message}`)
    onError()
  }
}

const handleUploadChange = (data) => {
  // console.log('Upload change:', data)
}

const handleRemoveFromList = ({ file }) => {
  // 从已上传列表中移除
  const index = uploadedFiles.value.findIndex(f => f.name === file.name)
  if (index > -1) {
    uploadedFiles.value.splice(index, 1)
  }
}

// 复制链接
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  } catch (error) {
    message.error('复制失败')
  }
}

const copyAllUrls = async () => {
  const urls = uploadedFiles.value.map(f => f.url).join('\n')
  await copyToClipboard(urls)
}

// 上传成功列表的列定义
const uploadedColumns = [
  { title: '文件名', key: 'name', ellipsis: { tooltip: true } },
  { 
    title: '链接', 
    key: 'url', 
    ellipsis: { tooltip: true },
    render: (row) => h('span', { class: 'text-blue-500 cursor-pointer', onClick: () => copyToClipboard(row.url) }, row.url)
  },
  { title: '上传时间', key: 'uploadTime', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row) => h('div', { class: 'flex gap-2' }, [
      h('n-button', {
        size: 'tiny',
        quaternary: true,
        onClick: () => {
          previewUrl.value = row.url
          showPreviewModal.value = true
        }
      }, { default: () => '预览' }),
      h('n-button', {
        size: 'tiny',
        quaternary: true,
        onClick: () => copyToClipboard(row.url)
      }, { default: () => '复制' })
    ])
  }
]

// 获取文件列表
const fetchFileList = async () => {
  if (!isConfigured.value) {
    message.warning('请先配置图床设置')
    return
  }

  listLoading.value = true
  const domain = configForm.value.domain.replace(/\/$/, '')
  const params = new URLSearchParams({
    start: ((currentPage.value - 1) * pageSize).toString(),
    count: pageSize.toString(),
    channel: 'CloudflareR2',
    fileType: 'image'
  })
  
  if (searchKeyword.value) {
    params.append('search', searchKeyword.value)
  }
  if (listDir.value) {
    params.append('dir', listDir.value)
  }

  try {
    const response = await fetch(`${domain}/api/manage/list?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${configForm.value.apiToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`List failed: ${response.status}`)
    }

    const result = await response.json()
    fileList.value = (result.files || []).map(file => ({
      name: file.name,
      size: formatFileSize(file.metadata?.['File-Size'] || 0),
      type: file.metadata?.['File-Mime'] || 'unknown',
      channel: file.metadata?.Channel || 'unknown',
      time: file.metadata?.TimeStamp ? new Date(parseInt(file.metadata.TimeStamp)).toLocaleString() : '-',
      fullUrl: getFullUrl(`/file/${file.name}`)
    }))
    totalCount.value = result.totalCount || fileList.value.length
  } catch (error) {
    console.error('List error:', error)
    message.error(`获取列表失败: ${error.message}`)
  } finally {
    listLoading.value = false
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchFileList()
}

const handleCheck = (keys) => {
  selectedRowKeys.value = keys
}

// 文件大小格式化
const formatFileSize = (bytes) => {
  bytes = parseInt(bytes) || 0
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 文件列表的列定义
const fileColumns = [
  { type: 'selection' },
  { 
    title: '预览',
    key: 'preview',
    width: 80,
    render: (row) => h('img', {
      src: row.fullUrl,
      class: 'w-12 h-12 object-cover rounded cursor-pointer',
      onClick: () => {
        previewUrl.value = row.fullUrl
        showPreviewModal.value = true
      }
    })
  },
  { 
    title: '文件名', 
    key: 'name', 
    ellipsis: { tooltip: true },
    render: (row) => h('span', {
      class: 'text-blue-500 cursor-pointer hover:underline',
      onClick: () => copyToClipboard(row.fullUrl)
    }, row.name)
  },
  { title: '大小', key: 'size', width: 100 },
  { title: '类型', key: 'type', width: 120, ellipsis: { tooltip: true } },
  { title: '上传时间', key: 'time', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => h('div', { class: 'flex gap-1' }, [
      h('n-button', {
        size: 'tiny',
        quaternary: true,
        onClick: () => copyToClipboard(row.fullUrl)
      }, { default: () => '复制' }),
      h('n-button', {
        size: 'tiny',
        quaternary: true,
        type: 'error',
        onClick: () => confirmDeleteFromList(row)
      }, { default: () => '删除' })
    ])
  }
]

// 删除操作
const deleteFile = async (filePath, isFolder = false) => {
  const domain = configForm.value.domain.replace(/\/$/, '')
  const params = isFolder ? '?folder=true' : ''
  
  const response = await fetch(`${domain}/api/manage/delete/${encodeURIComponent(filePath)}${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${configForm.value.apiToken}`
    }
  })

  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`)
  }

  return await response.json()
}

const confirmDeleteSingle = () => {
  const dialog = window.$dialog || null
  if (dialog) {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除文件 "${deleteFilePath.value}" 吗？`,
      positiveText: '删除',
      negativeText: '取消',
      onPositive: executeSingleDelete
    })
  } else {
    if (confirm(`确定要删除文件 "${deleteFilePath.value}" 吗？`)) {
      executeSingleDelete()
    }
  }
}

const executeSingleDelete = async () => {
  deleteLoading.value = true
  try {
    const result = await deleteFile(deleteFilePath.value, false)
    if (result.success) {
      message.success('文件删除成功')
      deleteFilePath.value = ''
    } else {
      throw new Error(result.error || 'Delete failed')
    }
  } catch (error) {
    message.error(`删除失败: ${error.message}`)
  } finally {
    deleteLoading.value = false
  }
}

const confirmDeleteFolder = () => {
  if (confirm(`确定要删除文件夹 "${deleteFolderPath.value}" 及其所有内容吗？此操作不可恢复！`)) {
    executeFolderDelete()
  }
}

const executeFolderDelete = async () => {
  deleteFolderLoading.value = true
  try {
    const result = await deleteFile(deleteFolderPath.value, true)
    if (result.success) {
      message.success(`文件夹删除成功，共删除 ${result.deleted?.length || 0} 个文件`)
      deleteFolderPath.value = ''
    } else {
      throw new Error(result.error || 'Delete failed')
    }
  } catch (error) {
    message.error(`删除失败: ${error.message}`)
  } finally {
    deleteFolderLoading.value = false
  }
}

const confirmDeleteFromList = (row) => {
  if (confirm(`确定要删除文件 "${row.name}" 吗？`)) {
    executeDeleteFromList(row)
  }
}

const executeDeleteFromList = async (row) => {
  try {
    const result = await deleteFile(row.name, false)
    if (result.success) {
      message.success('文件删除成功')
      // 从列表中移除
      const index = fileList.value.findIndex(f => f.name === row.name)
      if (index > -1) {
        fileList.value.splice(index, 1)
        totalCount.value--
      }
    } else {
      throw new Error(result.error || 'Delete failed')
    }
  } catch (error) {
    message.error(`删除失败: ${error.message}`)
  }
}

const confirmBatchDelete = () => {
  if (confirm(`确定要删除选中的 ${selectedRowKeys.value.length} 个文件吗？此操作不可恢复！`)) {
    executeBatchDelete()
  }
}

const executeBatchDelete = async () => {
  listLoading.value = true
  let successCount = 0
  let failCount = 0

  for (const key of selectedRowKeys.value) {
    try {
      const result = await deleteFile(key, false)
      if (result.success) {
        successCount++
      } else {
        failCount++
      }
    } catch (error) {
      failCount++
    }
  }

  message.info(`删除完成：成功 ${successCount} 个，失败 ${failCount} 个`)
  selectedRowKeys.value = []
  await fetchFileList()
}
</script>

<style scoped>
.imagebed-manager {
  @apply max-w-6xl mx-auto;
}

:deep(.n-upload-dragger) {
  @apply border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg transition-colors;
}

:deep(.n-upload-dragger:hover) {
  @apply border-blue-500;
}

:deep(.n-card) {
  @apply bg-white dark:bg-gray-800;
}

:deep(.n-tabs-nav) {
  @apply bg-white dark:bg-gray-800;
}

:deep(.n-data-table) {
  @apply bg-white dark:bg-gray-800;
}
</style>
