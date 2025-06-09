<template>
  <div class="position-fixed top-0 end-0 p-3" style="z-index: 1080">
    <transition-group name="toast" tag="div">
      <div 
        v-for="(toast, index) in toasts" 
        :key="toast.id" 
        class="toast show animate__animated animate__fadeInRight" 
        role="alert" 
        aria-live="assertive" 
        aria-atomic="true"
        :class="`bg-${toast.type} text-white`"
      >
        <div class="d-flex">
          <div class="toast-body">
            {{ toast.message }}
          </div>
          <button 
            type="button" 
            class="btn-close btn-close-white me-2 m-auto animate__animated animate__pulse animate__infinite" 
            @click="removeToast(index)"
            aria-label="关闭"
          ></button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

// 创建 Toast 服务的事件总线
export const toastBus = {
  callbacks: [],
  
  on(callback) {
    this.callbacks.push(callback);
  },
  
  emit(data) {
    this.callbacks.forEach(callback => callback(data));
  }
};

// 全局 Toast 辅助函数
export function showToast(message, type = 'primary', duration = 3000) {
  toastBus.emit({
    message,
    type,
    duration
  });
}

export default {
  name: 'Toast',
  setup() {
    const toasts = ref([]);
    const toastTimeouts = ref([]);
    
    function addToast(toast) {
      const id = Date.now();
      toast.id = id;
      toasts.value.push(toast);
      
      // 设置自动关闭定时器
      const timeout = setTimeout(() => {
        removeToastById(id);
      }, toast.duration);
      
      toastTimeouts.value.push({ id, timeout });
    }
    
    function removeToast(index) {
      if (index >= 0 && index < toasts.value.length) {
        const toast = toasts.value[index];
        removeToastById(toast.id);
      }
    }
    
    function removeToastById(id) {
      const index = toasts.value.findIndex(toast => toast.id === id);
      if (index !== -1) {
        // 删除 toast
        toasts.value.splice(index, 1);
        
        // 清除对应的定时器
        const timeoutIndex = toastTimeouts.value.findIndex(t => t.id === id);
        if (timeoutIndex !== -1) {
          clearTimeout(toastTimeouts.value[timeoutIndex].timeout);
          toastTimeouts.value.splice(timeoutIndex, 1);
        }
      }
    }
    
    onMounted(() => {
      // 监听 Toast 事件
      toastBus.on(addToast);
    });
    
    return {
      toasts,
      removeToast
    };
  }
}
</script>

<style scoped>
.toast {
  min-width: 250px;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.toast:hover {
  transform: translateX(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-body {
  font-size: 0.9rem;
}

/* Vue transition-group 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.5s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.5s ease;
}

/* 关闭按钮动画 */
.btn-close:hover {
  transform: scale(1.1) rotate(90deg);
  transition: transform 0.2s ease;
}
</style>
