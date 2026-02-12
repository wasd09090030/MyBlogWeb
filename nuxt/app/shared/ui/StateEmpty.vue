<template>
  <div class="empty-state" role="status" aria-live="polite">
    <slot>
      <Icon :name="icon" size="3xl" class="text-muted mb-3" />
      <h3 class="text-muted">{{ title }}</h3>
      <p class="text-muted">{{ description }}</p>
    </slot>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: 'images'
  },
  title: {
    type: String,
    default: '暂无数据'
  },
  description: {
    type: String,
    default: '当前没有可展示的内容'
  }
})
</script>
