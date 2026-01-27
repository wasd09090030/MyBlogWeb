// Admin 认证中间件
export default defineNuxtRouteMiddleware((to, from) => {
  // 仅在客户端执行
  if (!import.meta.client) return

  const authStore = useAuthStore()
  
  // 初始化认证状态
  if (!authStore.isAuthenticated) {
    authStore.initialize()
  }

  // 如果未登录且不是登录页，跳转到登录页
  if (!authStore.isAdmin && to.path !== '/admin/login') {
    return navigateTo('/admin/login')
  }

  // 如果已登录且访问登录页，跳转到仪表板
  if (authStore.isAdmin && to.path === '/admin/login') {
    return navigateTo('/admin')
  }
})
