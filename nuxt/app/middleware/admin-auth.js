// Admin 认证中间件
export default defineNuxtRouteMiddleware(async (to, from) => {
  // 仅在客户端执行
  if (!import.meta.client) return

  const authStore = useAuthStore()
  
  // 确保认证状态已初始化（异步等待）
  if (!authStore.isAuthenticated || !authStore.token) {
    await authStore.initialize()
  }

  // 如果未登录且不是登录页，跳转到登录页
  if (!authStore.isAdmin && to.path !== '/admin/login') {
    console.log('[Admin Auth] 未认证，重定向到登录页')
    return navigateTo('/admin/login')
  }

  // 如果已登录且访问登录页，跳转到仪表板
  if (authStore.isAdmin && to.path === '/admin/login') {
    console.log('[Admin Auth] 已认证，重定向到管理后台')
    return navigateTo('/admin')
  }
})
