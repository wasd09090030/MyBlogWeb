<template>
  <div class="min-h-screen bg-transparent text-slate-100">
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <p class="text-sm text-slate-400">Osu! Mania</p>
        <h1 class="text-3xl font-bold text-gray-600">谱面列表</h1>
        <p class="text-slate-400 text-sm">仅有 Osu! Mania 谱面</p>
      </div>

      <!-- 按键设置 -->
      <div class="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <button
          class="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          @click="showKeySettingsModal = true"
        >
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500 dark:text-slate-400">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
            </svg>
            <span class="text-sm font-medium text-slate-800 dark:text-slate-200">按键设置</span>
          </div>
          <span class="text-xs text-slate-600 dark:text-slate-500">点击设置</span>
        </button>
      </div>

      <ManiaKeyBindingModal v-model:show="showKeySettingsModal" />

      <n-spin :show="loading">
        <div v-if="!loading && beatmapSets.length === 0" class="text-center py-10 text-slate-400">
          暂无谱面
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="set in beatmapSets"
            :key="set.id"
            class="relative group rounded-2xl overflow-hidden bg-gray-900 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ring-1 ring-white/10"
          >
            <!-- 背景图 -->
            <div 
              class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              :style="{ backgroundImage: set.backgroundUrl ? `url(${set.backgroundUrl})` : 'none' }"
            >
              <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30 group-hover:via-black/50 transition-colors duration-300"></div>
            </div>
            
            <!-- 内容区域 -->
            <div class="relative p-6 flex flex-col h-full min-h-[200px] justify-end z-10">
              
              <!-- 顶部信息：标题和作者 -->
              <div class="mb-4 transform transition-transform duration-300 group-hover:-translate-y-1">
                <h3 class="text-xl font-bold text-white mb-1 line-clamp-1 drop-shadow-md" :title="set.title">{{ set.title }}</h3>
                <p class="text-gray-300 text-xs font-medium">{{ set.artist }} <span class="mx-1 opacity-50">/</span> {{ set.creator }}</p>
              </div>

              <!-- 底部操作区 -->
              <div class="flex items-center gap-3">
                <!-- 难度选择 (Popselect) -->
                <div class="flex-1">
                  <n-popselect
                    v-model:value="selectedDifficulties[set.id]"
                    :options="getDifficultyOptions(set)"
                    multiple
                    scrollable
                    trigger="click"
                    placement="top-start"
                    @update:value="(val) => handleDifficultySelect(set.id, val)"
                  >
                    <div 
                      class="cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2.5 flex items-center justify-between transition-all duration-200 group/select"
                    >
                      <div class="flex items-center gap-2">
                        <div class="bg-white/20 p-1 rounded-md">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </div>
                        <span class="text-sm font-medium text-gray-100">
                          {{ selectedDifficulties[set.id]?.length > 0 
                            ? `已选 ${selectedDifficulties[set.id].length} 个难度` 
                            : '选择难度' }}
                        </span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 group-hover/select:text-white transition-colors">
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    </div>
                  </n-popselect>
                </div>

                <!-- 开始按钮 (仅当有选择时显示) -->
                <transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="opacity-0 translate-x-2"
                  enter-to-class="opacity-100 translate-x-0"
                  leave-active-class="transition duration-150 ease-in"
                  leave-from-class="opacity-100 translate-x-0"
                  leave-to-class="opacity-0 translate-x-2"
                >
                  <button
                    v-if="selectedDifficulties[set.id]?.length > 0"
                    @click.stop="startGame(set.id)"
                    class="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 flex-shrink-0"
                    title="开始游戏"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"></path>
                    </svg>
                  </button>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup>
import { NSpin, NPopselect } from 'naive-ui'

definePageMeta({
  ssr: false
})

const config = useRuntimeConfig()
const baseURL = config.public.apiBase
const loading = ref(true)
const beatmapSets = ref([])
const selectedDifficulties = ref({})
const showKeySettingsModal = ref(false)

const fetchBeatmaps = async () => {
  loading.value = true
  try {
    const data = await $fetch(`${baseURL}/beatmaps`)
    const normalized = (data || []).map(set => ({
      ...set,
      backgroundUrl: normalizeAssetUrl(set.backgroundUrl)
    }))
    beatmapSets.value = normalized
    
    // 初始化选中难度状态
    normalized.forEach(set => {
      selectedDifficulties.value[set.id] = []
    })
  } catch (error) {
    console.error('加载谱面失败:', error)
  } finally {
    loading.value = false
  }
}

const getDifficultyOptions = (set) => {
  return set.difficulties.map(diff => ({
    label: `${diff.version} (${diff.columns}K) - OD${diff.overallDifficulty}`,
    value: diff.id
  }))
}

const handleDifficultySelect = (setId, value) => {
  selectedDifficulties.value[setId] = value || []
}

const startGame = (setId) => {
  const selectedIds = selectedDifficulties.value[setId]
  if (!selectedIds || selectedIds.length === 0) {
    return
  }
  
  // 如果选中多个难度，跳转到第一个
  const firstDiffId = selectedIds[0]
  navigateTo(`/mania/${firstDiffId}`)
}

const normalizeAssetUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/api/')) {
    return `${baseURL}${url.replace('/api', '')}`
  }
  return `${baseURL}/${url.replace(/^\/+/, '')}`
}

onMounted(() => {
  fetchBeatmaps()
})
</script>
