<template>
  <div class="steps-mdc my-6">
    <n-steps
      :current="currentStep"
      :status="status"
      :vertical="vertical"
      :size="size"
      @update:current="onStepChange"
    >
      <n-step
        v-for="(step, index) in stepsList"
        :key="index"
        :title="step.title"
        :description="step.description"
      />
    </n-steps>
    
    <!-- 控制按钮（可选） -->
    <div v-if="showControls" class="steps-controls" :class="{ 'vertical-controls': vertical }">
      <n-button
        :disabled="currentStep <= 1"
        @click="prevStep"
        secondary
      >
        <template #icon>
          <Icon name="mdi:chevron-left" />
        </template>
        上一步
      </n-button>
      
      <n-button
        v-if="currentStep < stepsList.length"
        :disabled="currentStep >= stepsList.length"
        @click="nextStep"
        type="primary"
      >
        下一步
        <template #icon>
          <Icon name="mdi:chevron-right" />
        </template>
      </n-button>
      
      <n-button
        v-else
        type="success"
        @click="onComplete"
      >
        <template #icon>
          <Icon name="mdi:check" />
        </template>
        完成
      </n-button>
    </div>
  </div>
</template>

<script setup>
/**
 * Steps 步骤条组件 - MDC 语法
 * 
 * 在 Markdown 中使用：
 * ::steps{current="2" status="process"}
 * ---
 * steps:
 *   - title: "第一步"
 *     description: "注册账号"
 *   - title: "第二步"
 *     description: "完善信息"
 *   - title: "第三步"
 *     description: "开始使用"
 * ---
 * ::
 * 
 * 垂直布局带控制按钮：
 * ::steps{current="1" vertical showControls}
 * ---
 * steps:
 *   - title: "安装依赖"
 *     description: "npm install"
 *   - title: "配置文件"
 *     description: "修改 config.js"
 *   - title: "运行项目"
 *     description: "npm run dev"
 * ---
 * ::
 * 
 * 可点击步骤：
 * ::steps{current="2" clickable showControls}
 * ---
 * steps:
 *   - title: "选择模板"
 *   - title: "填写信息"
 *   - title: "确认提交"
 * ---
 * ::
 */

const props = defineProps({
  // 当前步骤（从1开始）
  current: {
    type: [Number, String],
    default: 1
  },
  // 当前步骤状态: process | finish | error | wait
  status: {
    type: String,
    default: 'process',
    validator: (value) => ['process', 'finish', 'error', 'wait'].includes(value)
  },
  // 是否垂直布局
  vertical: {
    type: Boolean,
    default: false
  },
  // 尺寸: small | medium
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium'].includes(value)
  },
  // 步骤列表（从 YAML frontmatter 传入）
  steps: {
    type: Array,
    default: () => []
  },
  // 是否显示控制按钮
  showControls: {
    type: Boolean,
    default: false
  },
  // 是否可点击步骤跳转
  clickable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:current', 'change', 'complete'])

const currentStep = ref(Number(props.current) || 1)

watch(() => props.current, (newVal) => {
  currentStep.value = Number(newVal) || 1
})

const stepsList = computed(() => {
  return props.steps || []
})

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    emit('update:current', currentStep.value)
    emit('change', currentStep.value)
  }
}

const nextStep = () => {
  if (currentStep.value < stepsList.value.length) {
    currentStep.value++
    emit('update:current', currentStep.value)
    emit('change', currentStep.value)
  }
}

const onStepChange = (value) => {
  if (props.clickable) {
    currentStep.value = value
    emit('update:current', value)
    emit('change', value)
  }
}

const onComplete = () => {
  emit('complete')
}
</script>

<style scoped>
.steps-mdc {
  /* 确保在 prose 内正确显示 */
  padding: 1rem;
  background: rgb(249 250 251);
  border-radius: 0.5rem;
  border: 1px solid rgb(229 231 235);
}

:global(.dark) .steps-mdc {
  background: rgb(31 41 55);
  border-color: rgb(55 65 81);
}

.steps-controls {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgb(229 231 235);
}

:global(.dark) .steps-controls {
  border-top-color: rgb(55 65 81);
}

.steps-controls.vertical-controls {
  justify-content: center;
}

@media (max-width: 640px) {
  .steps-controls {
    justify-content: center;
  }
}
</style>
