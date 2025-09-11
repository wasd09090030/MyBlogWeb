<template>
  <div class="music-player">
    <button @click="playPrevTrack" class="music-button" title="上一首">
      <i class="bi bi-skip-backward-circle"></i>
    </button>
    <button @click="togglePlay" class="music-button main-button" :class="{ 'playing': isPlaying }" :title="isPlaying ? '暂停音乐' : '播放音乐'">
      <i class="bi" :class="isPlaying ? 'bi-pause-circle' : 'bi-play-circle'"></i>
    </button>
    <button @click="playNextTrack" class="music-button" title="下一首">
      <i class="bi bi-skip-forward-circle"></i>
    </button>
    <audio ref="audioPlayer" @ended="playNextTrack"></audio>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';

// 音频播放器引用
const audioPlayer = ref(null);
const isPlaying = ref(false);

// 音乐曲目列表 - 使用相对路径
const tracks = reactive([
  { src: new URL('../assets/music/Flower Dance.mp3', import.meta.url).href, name: 'Flower Dance' },
  { src: new URL('../assets/music/Mirage.mp3', import.meta.url).href, name: 'Mirage' },
  { src: new URL('../assets/music/Nightfall.mp3', import.meta.url).href, name: 'Nightfall' }
]);

// 当前曲目索引
const currentTrackIndex = ref(0);
const currentTrack = reactive(tracks[0]);

// 切换播放/暂停
const togglePlay = () => {
  if (!audioPlayer.value) return;
  
  if (isPlaying.value) {
    audioPlayer.value.pause();
  } else {
    audioPlayer.value.play().catch(error => {
      console.error('播放音乐失败:', error);
    });
  }
  
  isPlaying.value = !isPlaying.value;
};

// 播放下一曲
const playNextTrack = () => {
  currentTrackIndex.value = (currentTrackIndex.value + 1) % tracks.length;
  loadAndPlayTrack(tracks[currentTrackIndex.value]);
};

// 播放上一曲
const playPrevTrack = () => {
  currentTrackIndex.value = (currentTrackIndex.value - 1 + tracks.length) % tracks.length;
  loadAndPlayTrack(tracks[currentTrackIndex.value]);
};

// 加载并播放曲目
const loadAndPlayTrack = (track) => {
  if (!audioPlayer.value) return;
  
  // 更新当前曲目
  Object.assign(currentTrack, track);
  
  // 设置音频源
  audioPlayer.value.src = track.src;
  audioPlayer.value.load();
  
  // 播放音频
  if (isPlaying.value) {
    audioPlayer.value.play().catch(error => {
      console.error('播放音乐失败:', error);
      isPlaying.value = false;
    });
  }
};

// 组件挂载时初始化音频播放器
onMounted(() => {
  if (audioPlayer.value) {
    loadAndPlayTrack(tracks[currentTrackIndex.value]);
  }
});
</script>

<style scoped>
.music-player {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 25px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: fit-content;
  margin: 0 auto;
  gap: 4px;
}

.music-player:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.music-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #0d6efd;
  padding: 4px;
  margin: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.music-button:hover {
  color: #0a58ca;
  transform: scale(1.1);
  background-color: rgba(13, 110, 253, 0.1);
}

.music-button:active {
  transform: scale(0.95);
}

.music-button.main-button {
  font-size: 1.2rem;
  width: 32px;
  height: 32px;
  margin: 0 4px;
}

.music-button.main-button.playing {
  animation: musicPulse 2s infinite;
  color: #28a745;
}

@keyframes musicPulse {
  0% { 
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4);
  }
  50% { 
    transform: scale(1.05);
    box-shadow: 0 0 0 4px rgba(40, 167, 69, 0);
  }
  100% { 
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
  }
}

/* 暗色主题支持 */
:global(.dark-theme) .music-player {
  background-color: #1a1a1a;
  border-color: #333;
}

:global(.dark-theme) .music-button {
  color: #87ceeb;
}

:global(.dark-theme) .music-button:hover {
  color: #b8e6ff;
  background-color: rgba(135, 206, 235, 0.1);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .music-player {
    padding: 6px 10px;
    gap: 2px;
  }
  
  .music-button {
    font-size: 0.9rem;
    width: 26px;
    height: 26px;
  }
  
  .music-button.main-button {
    font-size: 1.1rem;
    width: 30px;
    height: 30px;
    margin: 0 2px;
  }
}

@media (max-width: 576px) {
  .music-player {
    padding: 4px 8px;
    gap: 1px;
  }
  
  .music-button {
    font-size: 0.85rem;
    width: 24px;
    height: 24px;
  }
  
  .music-button.main-button {
    font-size: 1rem;
    width: 28px;
    height: 28px;
    margin: 0 1px;
  }
}
</style>
