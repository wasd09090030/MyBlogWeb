// KeepAlive 缓存管理工具
import { ref, computed } from 'vue'

// 需要缓存的组件列表
const cachedComponents = ref(['ArticleList', 'WelcomeSection', 'Gallery'])

// 临时排除的组件（用于强制刷新）
const excludedComponents = ref([])

export const useKeepAliveManager = () => {
  // 获取当前缓存的组件列表 - 返回响应式的计算属性
  const getCachedComponents = computed(() => {
    return cachedComponents.value.filter(name => !excludedComponents.value.includes(name))
  })

  // 添加组件到缓存列表
  const addToCache = (componentName) => {
    if (!cachedComponents.value.includes(componentName)) {
      cachedComponents.value.push(componentName)
    }
    // 从排除列表中移除（如果存在）
    const excludeIndex = excludedComponents.value.indexOf(componentName)
    if (excludeIndex > -1) {
      excludedComponents.value.splice(excludeIndex, 1)
    }
  }

  // 从缓存列表中移除组件
  const removeFromCache = (componentName) => {
    const index = cachedComponents.value.indexOf(componentName)
    if (index > -1) {
      cachedComponents.value.splice(index, 1)
    }
  }

  // 临时排除组件（用于强制刷新一次）
  const excludeTemporarily = (componentName) => {
    if (!excludedComponents.value.includes(componentName)) {
      excludedComponents.value.push(componentName)
    }
  }

  // 清除临时排除状态
  const clearTemporaryExclusion = (componentName) => {
    const index = excludedComponents.value.indexOf(componentName)
    if (index > -1) {
      excludedComponents.value.splice(index, 1)
    }
  }

  // 强制刷新组件（临时从缓存中移除然后再加回来）
  const forceRefresh = (componentName) => {
    excludeTemporarily(componentName)
    
    // 下一个 tick 后重新加入缓存
    setTimeout(() => {
      clearTemporaryExclusion(componentName)
    }, 100)
  }

  // 清除所有缓存
  const clearAllCache = () => {
    cachedComponents.value = []
    excludedComponents.value = []
  }

  return {
    cachedComponents: getCachedComponents,
    addToCache,
    removeFromCache,
    excludeTemporarily,
    clearTemporaryExclusion,
    forceRefresh,
    clearAllCache
  }
}
