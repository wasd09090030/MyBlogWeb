// Bootstrap 客户端插件
export default defineNuxtPlugin(() => {
  if (process.client) {
    // 动态导入 Bootstrap JavaScript
    import('bootstrap/dist/js/bootstrap.bundle.min.js').then((bootstrap) => {
      // 将 Bootstrap 暴露到全局作用域
      window.bootstrap = bootstrap
    })
  }
})
