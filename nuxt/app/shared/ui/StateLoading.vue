<template>
  <div class="loading-overlay" role="status" aria-live="polite">
    <slot>
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
    </slot>
  </div>
</template>
