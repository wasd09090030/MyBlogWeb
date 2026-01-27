<template>
  <div class="loading-spinner" :class="sizeClass">
    <div class="spinner-container">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p v-if="text" class="loading-text mt-3">{{ text }}</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  text: {
    type: String,
    default: '加载中...'
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

const sizeClass = computed(() => `loading-spinner-${props.size}`)
</script>

<style scoped>
.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.loading-spinner-small {
  padding: 1rem;
}

.loading-spinner-small .spinner-border {
  width: 1rem;
  height: 1rem;
}

.loading-spinner-medium {
  padding: 2rem;
}

.loading-spinner-medium .spinner-border {
  width: 2rem;
  height: 2rem;
}

.loading-spinner-large {
  padding: 3rem;
}

.loading-spinner-large .spinner-border {
  width: 3rem;
  height: 3rem;
}

.spinner-container {
  text-align: center;
}

.loading-text {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
}
</style>