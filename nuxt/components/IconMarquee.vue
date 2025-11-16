<template>
  <div class="icon-marquee-container">
    <!-- 第一列：从上往下 -->
    <div class="marquee-column marquee-down">
      <div class="marquee-content">
        <div v-for="(icon, index) in iconsColumn1" :key="`down-${index}`" class="icon-item">
          <i :class="icon.class"></i>
        </div>
      </div>
      <div class="marquee-content" aria-hidden="true">
        <div v-for="(icon, index) in iconsColumn1" :key="`down-dup-${index}`" class="icon-item">
          <i :class="icon.class"></i>
        </div>
      </div>
    </div>

    <!-- 第二列：从下往上 -->
    <div class="marquee-column marquee-up">
      <div class="marquee-content">
        <div v-for="(icon, index) in iconsColumn2" :key="`up-${index}`" class="icon-item">
          <i :class="icon.class"></i>
        </div>
      </div>
      <div class="marquee-content" aria-hidden="true">
        <div v-for="(icon, index) in iconsColumn2" :key="`up-dup-${index}`" class="icon-item">
          <i :class="icon.class"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 第一列图标配置
const iconsColumn1 = [
  { class: 'bi bi-file-earmark-code' },
  { class: 'bi bi-terminal' },
  { class: 'bi bi-database' },
  { class: 'bi bi-server' },
  { class: 'bi bi-git' },
  { class: 'bi bi-github' },
  { class: 'bi bi-code-slash' },
  { class: 'bi bi-braces' }
]

// 第二列图标配置
const iconsColumn2 = [
  { class: 'bi bi-cpu' },
  { class: 'bi bi-hdd' },
  { class: 'bi bi-cloud' },
  { class: 'bi bi-shield-check' },
  { class: 'bi bi-graph-up' },
  { class: 'bi bi-layers' },
  { class: 'bi bi-lightning' },
  { class: 'bi bi-gear' }
]
</script>

<style scoped>
.icon-marquee-container {
  display: flex;
  gap: 15px;
  height: 100%;
  max-height: 200px;
  overflow: hidden;
  flex-shrink: 0;
}

.marquee-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.marquee-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  padding-bottom: 20px;
}

/* 向下滚动动画 */
.marquee-down .marquee-content {
  animation-name: scrollDown;
  animation-duration: 20s;
}

/* 向上滚动动画 */
.marquee-up .marquee-content {
  animation-name: scrollUp;
  animation-duration: 18s;
}

.icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.icon-item:hover {
  background: rgba(47, 79, 243, 0.15);
  border-color: rgba(42, 37, 212, 0.3);
}

.icon-item i {
  font-size: 1.8rem;
  color: rgba(255, 255, 255, 0.85);
  transition: color 0.3s ease;
}

.icon-item:hover i {
  color: rgba(255, 255, 255, 1);
}

/* 向下滚动关键帧 */
@keyframes scrollDown {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-100%);
  }
}

/* 向上滚动关键帧 */
@keyframes scrollUp {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(0);
  }
}

/* 暗色主题适配 */
[data-bs-theme="dark"] .icon-item {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-bs-theme="dark"] .icon-item:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}
</style>
