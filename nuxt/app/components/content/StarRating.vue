<template>
  <div class="star-rating-mdc inline-flex items-center gap-3 my-4">
    <n-rate
      v-model:value="currentRating"
      :count="Number(maxStars)"
      :size="rateSize"
      :readonly="readonly"
      :allow-half="true"
      color="#facc15"
    />
    
    <span v-if="showScore" class="text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ displayRating }} / {{ maxStars }}
    </span>
    
    <span v-if="label" class="text-sm text-gray-600 dark:text-gray-400">
      {{ label }}
    </span>
  </div>
</template>

<script setup>
/**
 * StarRating 星级评分组件 - MDC 语法
 * 
 * 在 Markdown 中使用：
 * ::star-rating{rating="4.5" maxStars="5" label="推荐指数" showScore}
 * ::
 * 
 * ::star-rating{rating="5" readonly}
 * 满分推荐！
 * ::
 */

const props = defineProps({
  rating: {
    type: [Number, String],
    default: 0
  },
  maxStars: {
    type: [Number, String],
    default: 5
  },
  size: {
    type: String,
    default: 'medium', // 'small' | 'medium' | 'large'
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  readonly: {
    type: Boolean,
    default: true
  },
  showScore: {
    type: Boolean,
    default: true
  },
  label: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:rating'])

const currentRating = ref(Number(props.rating) || 0)

watch(() => props.rating, (newRating) => {
  currentRating.value = Number(newRating) || 0
})

watch(currentRating, (newValue) => {
  if (!props.readonly) {
    emit('update:rating', newValue)
  }
})

const displayRating = computed(() => {
  return currentRating.value.toFixed(1)
})

// 映射 size 到 n-rate 的尺寸
const rateSize = computed(() => {
  const sizeMap = {
    small: 18,
    medium: 24,
    large: 28
  }
  return sizeMap[props.size] || 24
})
</script>

<style scoped>
.star-rating-mdc {
  /* 确保组件在 prose 内正确显示 */
  display: inline-flex;
}
</style>
