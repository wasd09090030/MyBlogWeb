<template>
  <div class="sakura-container">
    <div
      v-for="sakura in sakuras"
      :key="sakura.id"
      class="sakura"
      :style="{
        left: sakura.left,
        animationDelay: sakura.delay,
        animationDuration: sakura.duration,
        opacity: sakura.opacity
      }"
    >
      {{ sakura.symbol }}
    </div>
  </div>
</template>

<script setup>
// 响应式数据
const sakuras = ref([])

// 樱花符号
const sakuraSymbols = ['🌸', '🌺', '🌼', '🌻']

// 生成樱花
const generateSakuras = () => {
  const sakuraArray = []
  const count = 15 // 樱花数量

  for (let i = 0; i < count; i++) {
    sakuraArray.push({
      id: i,
      left: Math.random() * 100 + '%',
      delay: Math.random() * 10 + 's',
      duration: Math.random() * 10 + 10 + 's', // 10-20秒
      opacity: Math.random() * 0.6 + 0.4, // 0.4-1.0
      symbol: sakuraSymbols[Math.floor(Math.random() * sakuraSymbols.length)]
    })
  }

  sakuras.value = sakuraArray
}

// 组件挂载时生成樱花
onMounted(() => {
  generateSakuras()
})
</script>

<style scoped>
.sakura-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.sakura {
  position: absolute;
  top: -20px;
  font-size: 1.5rem;
  user-select: none;
  animation: sakura-fall linear infinite;
  will-change: transform;
}

@keyframes sakura-fall {
  0% {
    transform: translateY(-20px) rotate(0deg) translateX(0);
  }
  10% {
    transform: translateY(10vh) rotate(90deg) translateX(10px);
  }
  20% {
    transform: translateY(20vh) rotate(180deg) translateX(-10px);
  }
  30% {
    transform: translateY(30vh) rotate(270deg) translateX(15px);
  }
  40% {
    transform: translateY(40vh) rotate(360deg) translateX(-15px);
  }
  50% {
    transform: translateY(50vh) rotate(450deg) translateX(20px);
  }
  60% {
    transform: translateY(60vh) rotate(540deg) translateX(-20px);
  }
  70% {
    transform: translateY(70vh) rotate(630deg) translateX(10px);
  }
  80% {
    transform: translateY(80vh) rotate(720deg) translateX(-10px);
  }
  90% {
    transform: translateY(90vh) rotate(810deg) translateX(5px);
  }
  100% {
    transform: translateY(100vh) rotate(900deg) translateX(0);
    opacity: 0;
  }
}

/* 在暗色主题下的特殊样式 */
@media (prefers-color-scheme: dark) {
  .sakura {
    filter: brightness(0.8);
  }
}

/* 性能优化：减少动画在低性能设备上的影响 */
@media (prefers-reduced-motion: reduce) {
  .sakura {
    animation: none;
  }
}

/* 移动设备优化 */
@media (max-width: 768px) {
  .sakura {
    font-size: 1.2rem;
  }
}
</style>