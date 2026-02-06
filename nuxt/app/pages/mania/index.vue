<template>
  <div class="min-h-screen bg-[#0F0F23] text-slate-100">
    <div class="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <p class="text-sm text-slate-400">osu!mania</p>
        <h1 class="text-3xl font-bold">谱面列表</h1>
        <p class="text-slate-400 text-sm">仅显示 osu!mania 谱面</p>
      </div>

      <n-card>
        <n-spin :show="loading">
          <div v-if="!loading && beatmapSets.length === 0" class="text-center py-10 text-slate-400">
            暂无谱面
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="set in beatmapSets"
              :key="set.id"
              class="rounded-xl border border-purple-500/30 p-4 bg-black/30"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-lg font-semibold">{{ set.title }}</p>
                  <p class="text-sm text-slate-400">{{ set.artist }} · {{ set.creator }}</p>
                </div>
                <div class="flex gap-2">
                  <span class="text-xs bg-purple-600/30 text-purple-200 px-2 py-1 rounded">
                    {{ set.difficulties.length }} 个难度
                  </span>
                </div>
              </div>
              <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="diff in set.difficulties"
                  :key="diff.id"
                  class="rounded-lg bg-slate-900/60 p-3 flex flex-col gap-1"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-medium">{{ diff.version }}</span>
                    <span class="text-xs bg-pink-600/30 text-pink-200 px-2 py-1 rounded">{{ diff.columns }}K</span>
                  </div>
                  <p class="text-xs text-slate-400">
                    OD {{ diff.overallDifficulty }}
                    <span v-if="diff.bpm">· BPM {{ Math.round(diff.bpm) }}</span>
                    · Notes {{ diff.noteCount }}
                  </p>
                  <n-button size="small" type="primary" @click="goPlay(diff.id)">开始</n-button>
                </div>
              </div>
            </div>
          </div>
        </n-spin>
      </n-card>
    </div>
  </div>
</template>

<script setup>
import { NCard, NSpin, NButton } from 'naive-ui'

definePageMeta({
  ssr: false
})

const config = useRuntimeConfig()
const baseURL = config.public.apiBase
const loading = ref(true)
const beatmapSets = ref([])

const fetchBeatmaps = async () => {
  loading.value = true
  try {
    const data = await $fetch(`${baseURL}/beatmaps`)
    beatmapSets.value = data || []
  } catch (error) {
    console.error('加载谱面失败:', error)
  } finally {
    loading.value = false
  }
}

const goPlay = (id) => {
  navigateTo(`/mania/${id}`)
}

onMounted(fetchBeatmaps)
</script>
