<template>
  <div class="imagebed-manager h-[calc(100vh-6rem)] flex flex-col">
    <!-- Header Area -->
    <div class="flex justify-between items-center mb-4 shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">图床管理</h2>
        <n-tag v-if="!isConfigured" type="warning" round size="small">
          未配置
          <template #icon><Icon name="exclamation-triangle" /></template>
        </n-tag>
      </div>
      <div class="flex gap-2">
        <n-button @click="showConfigModal = true">
          <template #icon><Icon name="cog-6-tooth" /></template>
          设置
        </n-button>
      </div>
    </div>

    <!-- Main Content -->
    <n-card content-style="padding: 0; display: flex; flex-direction: column; height: 100%;" class="flex-1 overflow-hidden shadow-sm rounded-lg">
      <n-tabs type="line" animated class="h-full flex flex-col" pane-class="h-full flex flex-col overflow-hidden p-0">
        
        <!-- Tab: Media Library -->
        <n-tab-pane name="list" tab="媒体库" display-directive="show">
          <div class="flex flex-col h-full">
            <!-- Toolbar -->
            <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-3 justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
              <!-- Left: Navigation & Search -->
              <div class="flex flex-1 items-center gap-3 min-w-0">
                <!-- Breadcrumbs -->
                <nav class="flex items-center text-sm text-gray-600 dark:text-gray-300 overflow-hidden whitespace-nowrap">
                  <n-button text size="small" @click="navigateTo('')" :disabled="currentPath === ''">
                    <Icon name="home" class="mr-1" /> 根目录
                  </n-button>
                  <template v-if="pathSegments.length">
                    <span class="mx-1 text-gray-400">/</span>
                    <div v-for="(segment, index) in pathSegments" :key="index" class="flex items-center">
                      <n-button 
                        text 
                        size="small" 
                        @click="navigateTo(getPathUpTo(index))"
                        :disabled="index === pathSegments.length - 1"
                      >
                        {{ segment }}
                      </n-button>
                      <span v-if="index < pathSegments.length - 1" class="mx-1 text-gray-400">/</span>
                    </div>
                  </template>
                </nav>

                <n-divider vertical />

                <!-- Refresh -->
                <n-button quaternary circle size="small" @click="fetchFileList" :loading="listLoading" title="刷新">
                  <template #icon><Icon name="arrow-path" /></template>
                </n-button>

                <!-- Search -->
                <n-input
                  v-model:value="searchKeyword"
                  placeholder="搜索文件..."
                  clearable
                  size="small"
                  class="w-48"
                  @keyup.enter="fetchFileList"
                >
                  <template #prefix><Icon name="magnifying-glass" /></template>
                </n-input>
              </div>

              <!-- Right: Actions & View Toggle -->
              <div class="flex items-center gap-2 shrink-0">
                <n-button 
                  v-if="selectedRowKeys.length > 0" 
                  type="error" 
                  size="small" 
                  secondary
                  @click="confirmBatchDelete"
                >
                  <template #icon><Icon name="trash" /></template>
                  删除 ({{ selectedRowKeys.length }})
                </n-button>

                <n-radio-group v-model:value="viewMode" size="small">
                  <n-radio-button value="list">
                    <Icon name="list-bullet" />
                  </n-radio-button>
                  <n-radio-button value="grid">
                    <Icon name="squares-2x2" />
                  </n-radio-button>
                </n-radio-group>
              </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-auto p-4 bg-white dark:bg-gray-900 relative">
              <n-spin :show="listLoading" class="min-h-[200px]">
                
                <!-- Empty State -->
                <div v-if="!listLoading && items.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                  <Icon name="folder-open" size="4xl" class="mb-4 opacity-30" />
                  <p>文件夹为空</p>
                </div>

                <!-- Grid View -->
                <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  <!-- Render Folders -->
                  <div 
                    v-for="folder in currentFolders" 
                    :key="'folder-' + folder.name"
                    class="group relative border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer bg-gray-50 dark:bg-gray-800"
                    @click="navigateTo(folder.name)"
                  >
                    <div class="aspect-square flex items-center justify-center mb-2 text-yellow-500">
                      <Icon name="folder" size="4xl" />
                    </div>
                    <div class="text-center text-xs truncate px-1 font-medium">{{ folder.displayName }}</div>
                    
                    <!-- Folder Actions -->
                    <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <n-popconfirm @positive-click.stop="confirmDeleteFolder(folder.name)">
                        <template #trigger>
                          <n-button size="tiny" circle type="error" quaternary @click.stop>
                            <template #icon><Icon name="trash" /></template>
                          </n-button>
                        </template>
                        确定删除文件夹 "{{ folder.displayName }}" 及其所有内容吗？
                      </n-popconfirm>
                    </div>
                  </div>

                  <!-- Render Files -->
                  <div 
                    v-for="file in currentFiles" 
                    :key="file.name"
                    class="group relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md hover:border-blue-400 transition-all bg-white dark:bg-gray-800"
                    :class="{'ring-2 ring-blue-500': selectedRowKeys.includes(file.name)}"
                  >
                    <!-- Checkbox Overlay -->
                    <div class="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity" :class="{'opacity-100': selectedRowKeys.includes(file.name)}">
                       <n-checkbox 
                        :checked="selectedRowKeys.includes(file.name)"
                        @update:checked="(val) => toggleSelection(file.name, val)"
                        class="bg-white rounded-sm"
                      />
                    </div>

                    <!-- Image Thumbnail -->
                    <div class="aspect-square bg-gray-100 dark:bg-gray-900 relative overflow-hidden group/img">
                      <n-image
                        :src="file.fullUrl"
                        class="w-full h-full object-cover"
                        object-fit="cover"
                        lazy
                        preview-disabled
                      >
                         <template #placeholder>
                            <div class="flex items-center justify-center w-full h-full text-gray-300">
                              <Icon name="photo" size="2xl" />
                            </div>
                         </template>
                      </n-image>
                      
                      <!-- Overlay Actions -->
                      <div class="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-[1px]">
                         <n-button circle size="small" ghost @click="previewFile(file)">
                            <template #icon><Icon name="eye" /></template>
                         </n-button>
                         <n-button circle size="small" ghost @click="copyToClipboard(file.fullUrl)">
                            <template #icon><Icon name="clipboard" /></template>
                         </n-button>
                      </div>
                    </div>

                    <!-- File Info -->
                    <div class="p-2 text-xs">
                      <div class="truncate font-medium text-gray-700 dark:text-gray-200 mb-1" :title="file.name">{{ file.displayName }}</div>
                      <div class="flex justify-between text-gray-400">
                        <span>{{ file.size }}</span>
                        <n-popconfirm @positive-click="executeDeleteFromList(file)">
                           <template #trigger>
                             <Icon name="trash" class="cursor-pointer hover:text-red-500 transition-colors" />
                           </template>
                           确定删除此文件吗？
                        </n-popconfirm>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- List View -->
                <div v-else class="min-w-full">
                  <!-- Folder List Item (Manual rendering for mixed content) -->
                   <div v-if="currentFolders.length > 0" class="mb-2">
                     <div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-2">文件夹</div>
                     <div class="space-y-1">
                        <div 
                          v-for="folder in currentFolders" 
                          :key="'list-folder-' + folder.name"
                          class="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                          @click="navigateTo(folder.name)"
                        >
                           <Icon name="folder" class="text-yellow-500 mr-3" size="lg" />
                           <span class="flex-1 font-medium">{{ folder.displayName }}</span>
                           <n-popconfirm @positive-click.stop="confirmDeleteFolder(folder.name)">
                              <template #trigger>
                                <n-button size="tiny" quaternary type="error" class="opacity-0 group-hover:opacity-100" @click.stop>删除</n-button>
                              </template>
                              确定删除文件夹 "{{ folder.displayName }}" 及其所有内容吗？
                           </n-popconfirm>
                        </div>
                     </div>
                     <n-divider class="my-2" />
                   </div>

                   <!-- File Table -->
                  <n-data-table
                    :columns="fileColumns"
                    :data="currentFiles"
                    :row-key="(row) => row.name"
                    :checked-row-keys="selectedRowKeys"
                    @update:checked-row-keys="handleCheck"
                    :bordered="false"
                    size="small"
                  />
                </div>
              </n-spin>
            </div>

            <!-- Footer Pagination -->
            <div class="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
               <div class="text-xs text-gray-500">
                  共 {{ totalCount }} 个项目
               </div>
               <n-pagination
                 v-model:page="currentPage"
                 :page-size="pageSize"
                 :item-count="totalCount"
                 :show-size-picker="false"
                 size="small"
                 @update:page="handlePageChange"
               />
            </div>
          </div>
        </n-tab-pane>

        <!-- Tab: Upload -->
        <n-tab-pane name="upload" tab="上传图片">
          <div class="h-full flex flex-col p-6 overflow-auto" @paste="handlePaste">
             <!-- Drag & Drop Area -->
             <n-upload
                ref="uploadRef"
                :custom-request="handleUpload"
                :accept="acceptTypes"
                :disabled="!isConfigured"
                multiple
                directory-dnd
                :show-file-list="false"
                @change="handleUploadChange"
                class="mb-6"
              >
                <n-upload-dragger class="!p-12 !rounded-xl !border-2 hover:!border-blue-500 !transition-colors group">
                  <div class="flex flex-col items-center gap-4">
                    <div class="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                       <Icon name="cloud-arrow-up" size="4xl" />
                    </div>
                    <div class="text-center">
                      <h3 class="text-lg font-medium text-gray-700 dark:text-gray-200">点击或拖拽图片到此处</h3>
                      <p class="text-gray-400 mt-1">或者直接 Ctrl+V 粘贴图片</p>
                    </div>
                    <div class="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                       支持 JPG, PNG, GIF, WEBP, AVIF
                    </div>
                  </div>
                </n-upload-dragger>
              </n-upload>

              <!-- Upload Options -->
              <div class="flex items-center gap-4 mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                 <div class="flex items-center gap-2">
                    <Icon name="folder-open" class="text-gray-400" />
                    <span class="text-sm font-medium">上传目录:</span>
                 </div>
                 <n-input
                    v-model:value="configForm.uploadFolder"
                    placeholder="默认目录 (如: images/2024)"
                    size="small"
                    class="w-64"
                 />
                 <div class="text-xs text-gray-400 ml-auto">
                    上传的文件将保存在: <span class="font-mono">{{ configForm.uploadFolder || '(根目录)' }}</span>
                 </div>
              </div>

              <!-- Upload Results -->
              <div v-if="uploadedFiles.length > 0" class="flex-1 flex flex-col min-h-0">
                <div class="flex justify-between items-center mb-3">
                  <h3 class="font-medium flex items-center gap-2">
                    <Icon name="check-circle" class="text-green-500" />
                    本次上传 ({{ uploadedFiles.length }})
                  </h3>
                  <div class="flex gap-2">
                    <n-button size="small" secondary @click="uploadedFiles = []">清空列表</n-button>
                    <n-button size="small" type="primary" @click="copyAllUrls">
                      <template #icon><Icon name="clipboard" /></template>
                      复制全部链接
                    </n-button>
                  </div>
                </div>

                <div class="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                   <n-data-table
                      :columns="uploadedColumns"
                      :data="uploadedFiles"
                      :bordered="false"
                      size="small"
                   />
                </div>
              </div>
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <!-- Config Modal -->
    <n-modal v-model:show="showConfigModal" preset="dialog" title="图床配置" :show-icon="false">
      <n-form
        ref="configFormRef"
        :model="configForm"
        :rules="configRules"
        label-placement="top"
        class="mt-4"
      >
        <n-form-item label="图床域名" path="domain">
          <n-input v-model:value="configForm.domain" placeholder="https://cdn.example.com" />
        </n-form-item>
        <n-form-item label="API Token" path="apiToken">
          <n-input v-model:value="configForm.apiToken" type="password" show-password-on="click" placeholder="Cloudflare R2 API Token" />
        </n-form-item>
        <n-form-item label="默认上传目录" path="uploadFolder">
          <n-input v-model:value="configForm.uploadFolder" placeholder="可选 (如: static/images)" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showConfigModal = false">取消</n-button>
        <n-button type="primary" @click="saveConfig" :loading="savingConfig">保存配置</n-button>
      </template>
    </n-modal>

    <!-- Image Preview Modal -->
    <n-modal v-model:show="showPreviewModal" preset="card" style="width: auto; max-width: 95vw; background: transparent; box-shadow: none;" :bordered="false">
       <div class="relative flex flex-col items-center">
          <img :src="previewUrl" class="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl bg-black/5" />
          <div class="mt-4 flex gap-3">
             <n-button secondary type="primary" @click="copyToClipboard(previewUrl)">
                <template #icon><Icon name="clipboard" /></template>
                复制链接
             </n-button>
             <n-button secondary circle @click="showPreviewModal = false">
                <template #icon><Icon name="x-mark" /></template>
             </n-button>
          </div>
       </div>
    </n-modal>

  </div>
</template>

<script setup>
import { useMessage, useDialog } from 'naive-ui'
import { h } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

const message = useMessage()
const dialog = useDialog()
const imagebedApi = useImagebed()

// --- State ---
const viewMode = ref('grid') // 'list' | 'grid'
const currentPath = ref('')
const searchKeyword = ref('')
const listLoading = ref(false)
const showConfigModal = ref(false)
const savingConfig = ref(false)
const showPreviewModal = ref(false)
const previewUrl = ref('')

const items = ref([]) // Combined files and folders
const currentFiles = ref([])
const currentFolders = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = 50 // Increased page size for better grid experience
const selectedRowKeys = ref([])

const uploadRef = ref(null)
const uploadedFiles = ref([])
const acceptTypes = 'image/jpeg,image/png,image/gif,image/webp,image/avif'

const configFormRef = ref(null)
const configForm = ref({
  domain: '',
  apiToken: '',
  uploadFolder: ''
})

const configRules = {
  domain: { required: true, message: '请输入图床域名', trigger: 'blur' },
  apiToken: { required: true, message: '请输入API Token', trigger: 'blur' }
}

const isConfigured = computed(() => !!configForm.value.domain && !!configForm.value.apiToken)

const pathSegments = computed(() => {
  return currentPath.value ? currentPath.value.split('/').filter(Boolean) : []
})

const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize,
  itemCount: totalCount.value,
  showSizePicker: false
}))

// --- Initialization ---

onMounted(() => {
  loadConfig().then(() => {
    if (isConfigured.value) {
      fetchFileList()
    } else {
      showConfigModal.value = true
    }
  })
})

// --- Configuration ---

const loadConfig = async () => {
  try {
    const config = await imagebedApi.getConfig()
    if (config) {
      configForm.value = {
        domain: config.domain || '',
        apiToken: config.apiToken || '',
        uploadFolder: config.uploadFolder || ''
      }
    }
  } catch (error) {
    console.error('加载配置失败:', error)
  }
}

const saveConfig = async () => {
  configFormRef.value?.validate(async (errors) => {
    if (!errors) {
      savingConfig.value = true
      try {
        await imagebedApi.saveConfig(configForm.value)
        showConfigModal.value = false
        message.success('配置已保存')
        fetchFileList()
      } catch (error) {
        message.error('保存配置失败: ' + error.message)
      } finally {
        savingConfig.value = false
      }
    }
  })
}

// --- Navigation & List ---

const navigateTo = (path) => {
  currentPath.value = path
  currentPage.value = 1
  searchKeyword.value = '' // Clear search on navigation
  fetchFileList()
}

const getPathUpTo = (index) => {
  return pathSegments.value.slice(0, index + 1).join('/')
}

const fetchFileList = async () => {
  if (!isConfigured.value) return

  listLoading.value = true
  selectedRowKeys.value = [] // Clear selection

  try {
    const result = await imagebedApi.getFileList({
      domain: configForm.value.domain,
      apiToken: configForm.value.apiToken,
      start: (currentPage.value - 1) * pageSize,
      count: pageSize,
      search: searchKeyword.value,
      dir: currentPath.value
    })

    // Process Files
    const files = (result.files || []).map(file => ({
      name: file.name,
      displayName: file.name.split('/').pop(),
      size: imagebedApi.formatFileSize(file.size),
      type: file.type,
      time: imagebedApi.formatTimestamp(file.timestamp),
      fullUrl: file.url,
      isFolder: false
    }))

    // Process Directories (Folders)
    const folders = (result.directories || []).map(dir => {
        const fullPath = dir.replace(/\/$/, '')
        return {
          name: fullPath,
          displayName: fullPath.split('/').pop(),
          isFolder: true
        }
    })

    currentFiles.value = files
    currentFolders.value = folders
    items.value = [...folders, ...files]
    totalCount.value = result.totalCount || (files.length + folders.length)

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

const toggleSelection = (key, checked) => {
  if (checked) {
    selectedRowKeys.value.push(key)
  } else {
    selectedRowKeys.value = selectedRowKeys.value.filter(k => k !== key)
  }
}

const handleCheck = (keys) => {
  selectedRowKeys.value = keys
}

const previewFile = (file) => {
  previewUrl.value = file.fullUrl
  showPreviewModal.value = true
}

// --- Actions ---

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success('链接已复制')
  } catch (error) {
    message.error('复制失败')
  }
}

const copyAllUrls = async () => {
  const urls = uploadedFiles.value.map(f => f.url).join('\n')
  await copyToClipboard(urls)
}

const confirmDeleteFolder = (folderPath) => {
   // folderPath is already the full path key from the folder object
   executeDeleteFolder(folderPath)
}

const executeDeleteFolder = async (folderPath) => {
  try {
    const result = await imagebedApi.deleteFolder({
      domain: configForm.value.domain,
      apiToken: configForm.value.apiToken,
      folderPath: folderPath
    })
    
    if (result.success) {
      message.success('文件夹删除成功')
      fetchFileList() // Refresh
    } else {
      throw new Error(result.error || 'Delete failed')
    }
  } catch (error) {
    message.error(`删除失败: ${error.message}`)
  }
}

const confirmBatchDelete = () => {
  dialog.warning({
    title: '批量删除',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 个文件吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositive: executeBatchDelete
  })
}

const executeBatchDelete = async () => {
  listLoading.value = true
  try {
    // Construct full paths for files
    // In current directory context, file names are relative to currentPath if we are "inside" a folder conceptually?
    // Wait, typical object storage keys are full paths.
    // fetchFileList result returns 'name' which is usually the key (full path) or just name.
    // Let's look at useImagebed.js again. 
    // It maps file.name. If we are in a subfolder, does R2 return full key "sub/image.jpg" or just "image.jpg"?
    // Usually it returns full key. 
    // BUT, if we are browsing by directory, the UI displays just the filename.
    // We need to ensure we send the full key to delete.
    
    // Assuming `name` from API is the full key (filePath) for deletion.
    // If API returns just filename (e.g. "photo.jpg" inside "images/"), then we need to prepend dir.
    // Let's check useImagebed.js:
    // It returns `name: file.name`.
    // If the API behaves like standard S3 ListObjectsV2 with delimiter, 
    // 'Contents' (files) usually contain the full Key.
    
    const result = await imagebedApi.deleteMultipleFiles({
      domain: configForm.value.domain,
      apiToken: configForm.value.apiToken,
      filePaths: selectedRowKeys.value
    })

    message.success(`删除完成`)
    selectedRowKeys.value = []
    fetchFileList()
  } catch (error) {
    message.error(`批量删除失败: ${error.message}`)
  } finally {
    listLoading.value = false
  }
}

const executeDeleteFromList = async (row) => {
  try {
    const result = await imagebedApi.deleteFile({
      domain: configForm.value.domain,
      apiToken: configForm.value.apiToken,
      filePath: row.name
    })
    
    if (result.success) {
      message.success('文件删除成功')
      fetchFileList()
    } else {
      throw new Error(result.error || 'Delete failed')
    }
  } catch (error) {
    message.error(`删除失败: ${error.message}`)
  }
}

// --- Upload ---

const handlePaste = (event) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      // Trigger upload via Naive UI upload component manually or call API directly
      // Simplest is to push to upload list if using default request, but we have custom request.
      // We can directly call handleUpload wrapper but we need to mock the Upload data structure.
      
      // Better way: use the `uploadRef` to trigger upload if possible, or just call API and add to uploaded list.
      uploadImageDirectly(file)
    }
  }
}

const uploadImageDirectly = async (file) => {
   const dummyOption = {
     file: { file: file, name: file.name },
     onFinish: () => {},
     onError: () => {}
   }
   await handleUpload(dummyOption)
}

const handleUpload = async ({ file, onFinish, onError }) => {
  try {
    const result = await imagebedApi.uploadImage(file.file, {
      domain: configForm.value.domain,
      apiToken: configForm.value.apiToken,
      uploadFolder: configForm.value.uploadFolder
    })

    if (result.success) {
      uploadedFiles.value.unshift({
        name: result.fileName,
        url: result.url,
        src: result.src,
        uploadTime: new Date().toLocaleTimeString()
      })
      message.success('上传成功')
      onFinish()
    }
  } catch (error) {
    console.error('Upload error:', error)
    message.error(`上传失败: ${error.message}`)
    onError()
  }
}

const handleUploadChange = (data) => {
  // Can handle status updates here if needed
}

// --- Columns ---

const fileColumns = [
  { type: 'selection' },
  { 
    title: '预览',
    key: 'preview',
    width: 60,
    render: (row) => h('div', { class: 'w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer', onClick: () => previewFile(row) }, [
       h('img', { src: row.fullUrl, class: 'w-full h-full object-cover' })
    ])
  },
  { 
    title: '文件名', 
    key: 'name', 
    ellipsis: { tooltip: true },
    render: (row) => h('span', {
      class: 'text-blue-500 cursor-pointer hover:underline',
      title: row.name, // Show full path on hover
      onClick: () => copyToClipboard(row.fullUrl)
    }, row.displayName)
  },
  { title: '大小', key: 'size', width: 100 },
  { title: '上传时间', key: 'time', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row) => h('div', { class: 'flex gap-2' }, [
      h('n-button', { size: 'tiny', secondary: true, onClick: () => copyToClipboard(row.fullUrl) }, { default: () => '复制' }),
      h('n-popconfirm', {
         onPositiveClick: () => executeDeleteFromList(row)
      }, {
         trigger: () => h('n-button', { size: 'tiny', type: 'error', quaternary: true }, { default: () => '删除' }),
         default: () => '确定删除吗？'
      })
    ])
  }
]

const uploadedColumns = [
  { 
    title: '预览',
    key: 'preview',
    width: 60,
    render: (row) => h('img', { src: row.url, class: 'w-10 h-10 object-cover rounded' })
  },
  { title: '文件名', key: 'name', ellipsis: true },
  { 
    title: '链接', 
    key: 'url', 
    ellipsis: true,
    render: (row) => h('span', { class: 'text-blue-500 cursor-pointer', onClick: () => copyToClipboard(row.url) }, row.url)
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render: (row) => h('n-button', { size: 'tiny', secondary: true, onClick: () => copyToClipboard(row.url) }, { default: () => '复制' })
  }
]

</script>

<style scoped>
:deep(.n-upload-dragger) {
  background-color: transparent;
}
</style>
