<template>
  <div class="fixed inset-0 bg-[#0F0F23] text-slate-100 overflow-hidden">
    <div class="h-full flex flex-col">
      <!-- 游戏区域 -->
      <div class="flex-1 relative">
        <!-- 背景图 -->
        <div
          v-if="beatmapData.backgroundUrl"
          class="absolute inset-0 bg-center bg-cover bg-no-repeat z-0"
          :style="backgroundStyle"
        />
        <div
          v-if="beatmapData.backgroundUrl"
          class="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0"
        />

        <!-- PixiJS 游戏组件（使用纹理渲染） -->
        <ManiaGameTextured
          ref="gameRef"
          class="relative z-1"
          :notes="beatmapData.notes"
          :columns="beatmapData.columns"
          :scroll-speed="scrollSpeed"
          :is-playing="isPlaying"
          :audio-time="audioTime"
          @note-hit="onNoteHit"
          @note-miss="onNoteMiss"
          @key-press="onKeyPress"
        />

        <!-- 游戏 UI 覆盖层 -->
        <div class="absolute top-4 left-4 right-4 pointer-events-none z-10">
          <div class="flex justify-between items-start">
            <div class="space-y-1">
              <div class="text-4xl font-bold text-white drop-shadow-lg">
                {{ score.toLocaleString() }}
              </div>
              <div class="text-sm text-slate-300">
                准确度: {{ accuracy.toFixed(2) }}%
              </div>
            </div>
            <div v-if="combo > 0" class="text-right">
              <div class="text-5xl font-bold text-cyan-400 drop-shadow-lg">{{ combo }}</div>
              <div class="text-xs text-slate-400">COMBO</div>
            </div>
          </div>
        </div>

        <!-- 判定文本显示 -->
        <div class="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <transition name="judgement">
            <div v-if="currentJudgement" :key="judgementKey" :class="judgementClass" class="text-6xl font-black">
              {{ currentJudgement }}
            </div>
          </transition>
        </div>

        <!-- 开始提示 -->
        <div v-if="!isPlaying && !isLoading && !showResultModal" class="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <div class="text-center space-y-6">
            <div>
              <div class="text-3xl font-bold">{{ songTitleOnly }}</div>
              <div v-if="featuredArtist" class="text-xl text-purple-400 mt-2">feat. {{ featuredArtist }}</div>
            </div>
            <div class="text-slate-400">{{ beatmapData.artist }}</div>
            <div class="text-sm text-slate-500">{{ beatmapData.creator }} · {{ beatmapData.version }}</div>
            <div class="space-y-2">
              <div class="text-sm text-slate-300">按键映射:</div>
              <div class="text-xl font-mono font-bold text-cyan-400">
                {{ keyBindings.join(' · ') }}
              </div>
            </div>
            <n-button type="primary" size="large" @click="startGame">
              开始游戏
            </n-button>
          </div>
        </div>

        <!-- 加载中 -->
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black/70 z-30">
          <div class="text-center space-y-4">
            <div class="text-xl">加载中...</div>
          </div>
        </div>
      </div>

      <!-- 底部控制栏 -->
      <div class="flex-shrink-0 px-4 py-2 flex flex-wrap gap-3 items-center bg-black/50 z-10">
        <n-button v-if="isPlaying" type="error" size="small" @click="stopGame">
          停止
        </n-button>
        <span class="text-xs text-slate-400">速度: {{ scrollSpeed }} px/s</span>
        <span class="text-xs text-slate-400">
          P:{{ stats.perfect }} G:{{ stats.great }} G:{{ stats.good }} B:{{ stats.bad }} M:{{ stats.miss }}
        </span>
        <span class="text-xs text-slate-400 ml-auto">
          最大连击: {{ maxCombo }}
        </span>
      </div>
    </div>

    <!-- 游戏结束弹窗 -->
    <GameResultModal
      :show="showResultModal"
      :score="score"
      :accuracy="accuracy"
      :max-combo="maxCombo"
      :stats="stats"
      :song-title="songTitleOnly"
      :artist="featuredArtist ? `feat. ${featuredArtist}` : beatmapData.artist"
      :creator="beatmapData.creator"
      :version="beatmapData.version"
      @retry="onRetry"
      @back="onBack"
    />
  </div>
</template>

<script setup>
import { NButton } from 'naive-ui'

definePageMeta({
  ssr: false,
  layout: 'blank'
})

const route = useRoute()
const config = useRuntimeConfig()
const baseURL = config.public.apiBase

// 游戏组件引用
const gameRef = ref(null)

// 加载状态
const isLoading = ref(true)
const isPlaying = ref(false)

// 谱面数据
const beatmapData = ref({
  title: 'Loading...',
  artist: '',
  creator: '',
  version: '',
  columns: 4,
  overallDifficulty: 5,
  audioUrl: null,
  backgroundUrl: null,
  audioLeadIn: 0,
  notes: []
})

// 游戏设置
const scrollSpeed = ref(800)

// 音频相关
let audio = null
const audioTime = ref(0)
let audioTimeUpdater = null

// 游戏状态
const score = ref(0)
const combo = ref(0)
const maxCombo = ref(0)
const accuracy = ref(100)
const currentJudgement = ref('')
const judgementKey = ref(0)
const stats = ref({
  perfect: 0,
  great: 0,
  good: 0,
  bad: 0,
  miss: 0
})

const showResultModal = ref(false)
const hasGameEnded = ref(false)

// 计算最后一个音符的时间（用于备用结束判定）
const lastNoteTime = computed(() => {
  const notes = beatmapData.value.notes
  if (!notes.length) return 0
  let maxTime = 0
  for (const note of notes) {
    const t = note.endTime || note.time
    if (t > maxTime) maxTime = t
  }
  return maxTime
})

// 按键配置
const keyBindings = computed(() => {
  const maps = {
    4: ['D', 'F', 'J', 'K'],
    5: ['D', 'F', 'Space', 'J', 'K'],
    6: ['S', 'D', 'F', 'J', 'K', 'L'],
    7: ['S', 'D', 'F', 'Space', 'J', 'K', 'L'],
    8: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';']
  }
  return maps[beatmapData.value.columns] || maps[4]
})

const keyToColumn = computed(() => {
  const mapping = {}
  keyBindings.value.forEach((key, index) => {
    mapping[key.toLowerCase()] = index
    if (key === 'Space') mapping[' '] = index
  })
  return mapping
})

// 拆分歌名中的 feat. 部分
const songTitleOnly = computed(() => {
  const title = beatmapData.value.title
  const featIndex = title.indexOf(' feat. ')
  if (featIndex !== -1) {
    return title.substring(0, featIndex)
  }
  return title
})

const featuredArtist = computed(() => {
  const title = beatmapData.value.title
  const featIndex = title.indexOf(' feat. ')
  if (featIndex !== -1) {
    return title.substring(featIndex + 7) // 7 = ' feat. '.length
  }
  return ''
})

// 判定分数
const JUDGEMENT_SCORES = {
  PERFECT: 300,
  GREAT: 200,
  GOOD: 100,
  BAD: 50,
  MISS: 0
}

// 判定样式
const judgementClass = computed(() => {
  const classes = {
    PERFECT: 'text-yellow-300 drop-shadow-[0_0_20px_rgba(253,224,71,0.8)]',
    GREAT: 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]',
    GOOD: 'text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.8)]',
    BAD: 'text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.8)]',
    MISS: 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]'
  }
  return classes[currentJudgement.value] || ''
})

const backgroundStyle = computed(() => {
  if (!beatmapData.value.backgroundUrl) {
    return {}
  }
  return {
    backgroundImage: `url('${beatmapData.value.backgroundUrl}')`
  }
})

// 加载谱面
const fetchBeatmap = async () => {
  isLoading.value = true
  try {
    const data = await $fetch(`${baseURL}/beatmaps/difficulty/${route.params.id}`)
    beatmapData.value = {
      title: data.title || 'Unknown',
      artist: data.artist || 'Unknown',
      creator: data.creator || 'Unknown',
      version: data.version || 'Normal',
      columns: data.columns || 4,
      overallDifficulty: data.overallDifficulty || 5,
      audioUrl: normalizeAssetUrl(data.audioUrl),
      backgroundUrl: normalizeAssetUrl(data.backgroundUrl),
      audioLeadIn: data.audioLeadIn || 0,
      notes: data.notes || []
    }
    console.log('谱面加载完成:', {
      title: beatmapData.value.title,
      columns: beatmapData.value.columns,
      notes: beatmapData.value.notes.length
    })
  } catch (error) {
    console.error('加载谱面失败:', error)
  } finally {
    isLoading.value = false
  }
}

const normalizeAssetUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/api/')) {
    return `${baseURL}${url.replace('/api', '')}`
  }
  return `${baseURL}/${url.replace(/^\/+/, '')}`
}

// 开始游戏
const startGame = async () => {
  if (isPlaying.value) return
  if (!beatmapData.value.audioUrl) {
    console.warn('没有音频资源')
    return
  }

  // 重置状态
  hasGameEnded.value = false
  showResultModal.value = false
  resetGameState()
  gameRef.value?.reset()

  // 初始化音频
  if (!audio) {
    audio = new Audio(beatmapData.value.audioUrl)
    audio.crossOrigin = 'anonymous'
    audio.addEventListener('ended', onAudioEnded)
  }

  try {
    await audio.play()
    isPlaying.value = true

    // 开始更新音频时间
    audioTimeUpdater = setInterval(() => {
      if (!audio) return
      audioTime.value = Math.max(0, audio.currentTime * 1000 - beatmapData.value.audioLeadIn)
      if (!isPlaying.value || hasGameEnded.value) return
      if (audio.ended) {
        finishGame('ended')
        return
      }
      if (Number.isFinite(audio.duration) && audio.duration > 0 && audio.currentTime >= audio.duration - 0.01) {
        finishGame('duration')
        return
      }
      // 备用结束判定：所有音符已落下并超过判定窗口后，结束游戏
      if (lastNoteTime.value > 0 && audioTime.value > lastNoteTime.value + 2000) {
        finishGame('allNotesDone')
      }
    }, 16) // ~60fps

    // 添加键盘监听
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  } catch (error) {
    console.error('播放失败:', error)
  }
}

// 停止游戏
const stopGame = () => {
  isPlaying.value = false
  if (audio) {
    audio.pause()
    audio.currentTime = 0
  }
  if (audioTimeUpdater) {
    clearInterval(audioTimeUpdater)
    audioTimeUpdater = null
  }
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  audioTime.value = 0
}

const finishGame = (reason) => {
  if (hasGameEnded.value) return
  hasGameEnded.value = true
  isPlaying.value = false
  if (audio && !audio.ended) {
    audio.pause()
  }
  if (audioTimeUpdater) {
    clearInterval(audioTimeUpdater)
    audioTimeUpdater = null
  }
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)

  console.log('游戏结束!', {
    reason,
    score: score.value,
    maxCombo: maxCombo.value,
    accuracy: accuracy.value
  })

  showResultModal.value = true
}

// 重置游戏状态
const resetGameState = () => {
  score.value = 0
  combo.value = 0
  maxCombo.value = 0
  accuracy.value = 100
  currentJudgement.value = ''
  stats.value = { perfect: 0, great: 0, good: 0, bad: 0, miss: 0 }
}

// 音频结束
const onAudioEnded = () => {
  finishGame('ended')
}

// 重新游玩
const onRetry = () => {
  showResultModal.value = false
  if (audio) {
    audio.currentTime = 0
  }
  audioTime.value = 0
  setTimeout(() => {
    startGame()
  }, 100)
}

// 返回选曲界面
const onBack = () => {
  navigateTo('/mania')
}

// 键盘按下事件
const onKeyDown = (e) => {
  const key = e.key.toLowerCase()
  const column = keyToColumn.value[key]
  if (column !== undefined) {
    e.preventDefault()
    gameRef.value?.handleKeyPress(column)
  }
}

// 键盘松开事件
const onKeyUp = (e) => {
  const key = e.key.toLowerCase()
  const column = keyToColumn.value[key]
  if (column !== undefined) {
    e.preventDefault()
    gameRef.value?.handleKeyRelease(column)
  }
}

// 音符击中
const onNoteHit = ({ noteId, judgement, timeDiff, isHoldStart, isHoldEnd, auto }) => {
  // 长按音符开始时不更新统计，只在结束时更新
  if (isHoldStart) {
    // 可以播放开始音效
    return
  }
  
  // 更新统计
  stats.value[judgement.toLowerCase()]++

  // 更新分数
  score.value += JUDGEMENT_SCORES[judgement]

  // 更新连击
  if (judgement === 'BAD') {
    combo.value = 0
  } else {
    combo.value++
    maxCombo.value = Math.max(maxCombo.value, combo.value)
  }

  // 更新准确度
  updateAccuracy()

  // 显示判定
  showJudgement(judgement)
}

// 音符 MISS
const onNoteMiss = ({ noteId }) => {
  stats.value.miss++
  combo.value = 0
  updateAccuracy()
  showJudgement('MISS')
}

// 按键事件
const onKeyPress = (column) => {
  // 可以在这里添加按键音效
}

// 更新准确度
const updateAccuracy = () => {
  const total = Object.values(stats.value).reduce((a, b) => a + b, 0)
  if (total === 0) {
    accuracy.value = 100
    return
  }
  const weighted =
    stats.value.perfect * 100 +
    stats.value.great * 70 +
    stats.value.good * 40 +
    stats.value.bad * 10
  accuracy.value = weighted / total
}

// 显示判定
const showJudgement = (judgement) => {
  currentJudgement.value = judgement
  judgementKey.value++
  setTimeout(() => {
    currentJudgement.value = ''
  }, 400)
}

// 生命周期
onMounted(() => {
  fetchBeatmap()
})

onBeforeUnmount(() => {
  stopGame()
  if (audio) {
    audio.removeEventListener('ended', onAudioEnded)
    audio = null
  }
})
</script>

<style scoped>
.judgement-enter-active {
  animation: judgement-pop 0.4s ease-out;
}

@keyframes judgement-pop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  30% {
    transform: scale(1.3);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
</style>
