<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">谱面管理</h2>
        <p class="text-gray-500 dark:text-gray-400">仅支持 osu!mania，上传 .osz 后自动解析</p>
      </div>
    </div>

    <n-card>
      <template #header>
        <div class="flex items-center gap-2">
          <Icon name="cloud-arrow-up" size="md" />
          上传谱面
        </div>
      </template>
      <n-upload
        :custom-request="handleUpload"
        accept=".osz"
        :max="1"
        :show-file-list="false"
      >
        <n-upload-dragger class="!p-10 !rounded-xl !border-2 hover:!border-purple-500 !transition-colors">
          <div class="flex flex-col items-center gap-2">
            <Icon name="cloud-arrow-up" size="2xl" class="text-purple-500" />
            <p class="text-base font-medium">拖拽 .osz 到这里，或点击上传</p>
            <p class="text-sm text-gray-400">仅解析 osu!mania，其他模式将被忽略</p>
          </div>
        </n-upload-dragger>
      </n-upload>
    </n-card>

    <n-card title="谱面列表">
      <n-spin :show="loading">
        <div v-if="!loading && beatmapSets.length === 0" class="text-center py-8 text-gray-400">
          <Icon name="inbox" size="3xl" class="mb-3 opacity-50" />
          <p>暂无谱面，请先上传 .osz</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="set in beatmapSets"
            :key="set.id"
            class="rounded-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-lg font-semibold text-gray-800 dark:text-white">{{ set.title }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ set.artist }} · {{ set.creator }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <n-tag v-if="set.previewTime !== null && set.previewTime !== undefined" type="info" size="small">
                  Preview {{ set.previewTime }}ms
                </n-tag>
                <n-tag type="success" size="small">共 {{ set.difficulties.length }} 个难度</n-tag>
              </div>
            </div>
            <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="diff in set.difficulties"
                :key="diff.id"
                class="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 flex flex-col gap-1"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium text-gray-700 dark:text-gray-200">{{ diff.version }}</span>
                  <n-tag size="small" type="warning">{{ diff.columns }}K</n-tag>
                </div>
                <p class="text-xs text-gray-500">OD {{ diff.overallDifficulty }} · Notes {{ diff.noteCount }}</p>
                <n-button size="small" secondary @click="goPlay(diff.id)">
                  进入试玩
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </n-spin>
    </n-card>
  </div>
</template>

<script setup>
import { NCard, NUpload, NUploadDragger, NSpin, NTag, NButton, useMessage } from 'naive-ui'

definePageMeta({
  ssr: false,
  layout: 'admin',
  middleware: 'admin-auth'
})

const message = useMessage()
const config = useRuntimeConfig()
const baseURL = config.public.apiBase
const authStore = useAuthStore()

const loading = ref(false)
const beatmapSets = ref([])

const fetchBeatmaps = async () => {
  loading.value = true
  try {
    const data = await $fetch(`${baseURL}/beatmaps`)
    beatmapSets.value = data || []
  } catch (error) {
    console.error('加载谱面失败:', error)
    message.error('加载谱面失败')
  } finally {
    loading.value = false
  }
}

const handleUpload = async ({ file, onError, onFinish }) => {
  if (!file?.file) {
    onError?.()
    return
  }

  const formData = new FormData()
  formData.append('file', file.file)

  try {
    loading.value = true
    await $fetch(`${baseURL}/beatmaps/upload`, {
      method: 'POST',
      headers: authStore.authHeaders,
      body: formData
    })
    message.success('上传成功，已解析 osu!mania 谱面')
    await fetchBeatmaps()
    onFinish?.()
  } catch (error) {
    console.error('上传失败:', error)
    message.error(error?.data?.error || '上传失败')
    onError?.()
  } finally {
    loading.value = false
  }
}

const goPlay = (difficultyId) => {
  navigateTo(`/mania/${difficultyId}`)
}

onMounted(fetchBeatmaps)
</script>
