<template>
  <div class="music-player" :class="{ 'player-expanded': isExpanded }">
    <!-- 播放器按钮 -->
    <button
      class="player-toggle"
      @click="togglePlayer"
      :title="isExpanded ? '收起音乐播放器' : '展开音乐播放器'"
    >
      <i class="bi" :class="isPlaying ? 'bi-pause-fill' : 'bi-music-note'"></i>
      <span v-if="currentTrack.name" class="music-indicator"></span>
    </button>

    <!-- 播放器面板 -->
    <div v-if="isExpanded" class="player-panel">
      <div class="player-header">
        <h6 class="mb-0">
          <i class="bi bi-music-note-beamed me-2"></i>
          背景音乐
        </h6>
        <button class="btn-close" @click="togglePlayer"></button>
      </div>

      <div class="player-content">
        <!-- 当前播放信息 -->
        <div class="current-track">
          <div class="track-info">
            <div class="track-name">{{ currentTrack.name || '未选择音乐' }}</div>
            <div class="track-artist">{{ currentTrack.artist || '' }}</div>
          </div>
        </div>

        <!-- 播放进度 -->
        <div class="progress-section">
          <div class="progress">
            <div
              class="progress-bar"
              role="progressbar"
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
          <div class="time-info">
            <span class="current-time">{{ formatTime(currentTime) }}</span>
            <span class="total-time">{{ formatTime(duration) }}</span>
          </div>
        </div>

        <!-- 播放控制 -->
        <div class="player-controls">
          <button class="control-btn" @click="previousTrack" :disabled="!hasTracks">
            <i class="bi bi-skip-start-fill"></i>
          </button>
          <button class="control-btn play-btn" @click="togglePlay" :disabled="!hasTracks">
            <i class="bi" :class="isPlaying ? 'bi-pause-fill' : 'bi-play-fill'"></i>
          </button>
          <button class="control-btn" @click="nextTrack" :disabled="!hasTracks">
            <i class="bi bi-skip-end-fill"></i>
          </button>
          <button class="control-btn volume-btn" @click="toggleMute" :disabled="!hasTracks">
            <i class="bi" :class="isMuted ? 'bi-volume-mute-fill' : 'bi-volume-up-fill'"></i>
          </button>
        </div>

        <!-- 播放列表 -->
        <div class="playlist">
          <div class="playlist-header">
            <small>播放列表</small>
          </div>
          <div class="playlist-items">
            <div
              v-for="(track, index) in playlist"
              :key="track.id"
              class="playlist-item"
              :class="{ active: currentTrackIndex === index }"
              @click="selectTrack(index)"
            >
              <div class="track-item-info">
                <div class="track-item-name">{{ track.name }}</div>
                <div class="track-item-artist">{{ track.artist }}</div>
              </div>
              <div class="track-item-duration">{{ track.duration || '0:00' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 响应式数据
const isExpanded = ref(false)
const isPlaying = ref(false)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const currentTrackIndex = ref(0)
const volume = ref(0.7)

// 模拟播放列表
const playlist = ref([
  {
    id: 1,
    name: 'Summer Breeze',
    artist: 'Artist Name',
    url: '/music/summer-breeze.mp3',
    duration: '3:45'
  },
  {
    id: 2,
    name: 'Ocean Waves',
    artist: 'Nature Sounds',
    url: '/music/ocean-waves.mp3',
    duration: '4:20'
  },
  {
    id: 3,
    name: 'Forest Rain',
    artist: 'Ambient',
    url: '/music/forest-rain.mp3',
    duration: '5:10'
  }
])

// 计算属性
const currentTrack = computed(() => {
  return playlist.value[currentTrackIndex.value] || {}
})

const hasTracks = computed(() => playlist.value.length > 0)

const progressPercentage = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// 方法
const togglePlayer = () => {
  isExpanded.value = !isExpanded.value
}

const togglePlay = () => {
  isPlaying.value = !isPlaying.value

  if (isPlaying.value) {
    // 模拟播放开始
    simulateProgress()
  }
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  volume.value = isMuted.value ? 0 : 0.7
}

const selectTrack = (index) => {
  currentTrackIndex.value = index
  currentTime.value = 0
  isPlaying.value = true
  simulateProgress()
}

const previousTrack = () => {
  if (currentTrackIndex.value > 0) {
    currentTrackIndex.value--
    currentTime.value = 0
    if (isPlaying.value) {
      simulateProgress()
    }
  }
}

const nextTrack = () => {
  if (currentTrackIndex.value < playlist.value.length - 1) {
    currentTrackIndex.value++
    currentTime.value = 0
    if (isPlaying.value) {
      simulateProgress()
    }
  }
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 模拟播放进度
let progressInterval = null

const simulateProgress = () => {
  // 清除之前的定时器
  if (progressInterval) {
    clearInterval(progressInterval)
  }

  // 重置进度
  currentTime.value = 0
  duration.value = 240 // 模拟4分钟的歌曲

  // 开始进度更新
  progressInterval = setInterval(() => {
    if (isPlaying.value && currentTime.value < duration.value) {
      currentTime.value += 1
    } else if (currentTime.value >= duration.value) {
      // 歌曲播放完毕，播放下一首
      nextTrack()
    }
  }, 1000)
}

// 监听播放状态变化
watch(isPlaying, (playing) => {
  if (!playing && progressInterval) {
    clearInterval(progressInterval)
  }
})

// 组件卸载时清理
onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
})
</script>

<style scoped>
.music-player {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.player-toggle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.player-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(0,0,0,0.3);
}

.music-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #28a745;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.player-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 320px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.player-header {
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.player-content {
  padding: 1.25rem;
}

.current-track {
  margin-bottom: 1rem;
  text-align: center;
}

.track-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.track-artist {
  font-size: 0.875rem;
  color: #666;
}

.progress-section {
  margin-bottom: 1rem;
}

.progress {
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.time-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #666;
}

.player-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #f8f9fa;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover:not(:disabled) {
  background: #e9ecef;
  color: #333;
  transform: translateY(-2px);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.play-btn {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.play-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.playlist {
  border-top: 1px solid #dee2e6;
  padding-top: 1rem;
}

.playlist-header {
  margin-bottom: 0.75rem;
  color: #666;
  font-weight: 600;
}

.playlist-items {
  max-height: 200px;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.playlist-item:hover {
  background: #f8f9fa;
}

.playlist-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-left: 3px solid #667eea;
}

.track-item-name {
  font-size: 0.875rem;
  color: #333;
  font-weight: 500;
}

.track-item-artist {
  font-size: 0.75rem;
  color: #666;
}

.track-item-duration {
  font-size: 0.75rem;
  color: #666;
}

/* 滚动条样式 */
.playlist-items::-webkit-scrollbar {
  width: 4px;
}

.playlist-items::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.playlist-items::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.playlist-items::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(40, 167, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .player-panel {
    width: 280px;
    right: -10px;
  }

  .player-content {
    padding: 1rem;
  }

  .control-btn {
    width: 36px;
    height: 36px;
  }

  .play-btn {
    width: 44px;
    height: 44px;
  }
}
</style>