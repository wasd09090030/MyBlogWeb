<template>
  <div 
    v-if="article.coverImage && article.coverImage !== 'null'"
    class="w-full h-64 md:h-80 lg:h-96 overflow-hidden"
  >
    <img
      :src="article.coverImage"
      :alt="article.title"
      class="w-full h-full object-cover"
    />
  </div>
</template>

<script setup>
defineProps({
  article: {
    type: Object,
    required: true
  }
})
</script>
