<template>
  <div class="error-overlay" role="alert">
    <slot>
      <div class="alert alert-danger text-center" role="alert">
        {{ message }}
      </div>
    </slot>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: '加载失败，请稍后重试'
  }
})
</script>
