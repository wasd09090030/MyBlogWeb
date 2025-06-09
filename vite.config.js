import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    // gzip 压缩
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    // 打包分析（仅在分析模式下启用）
    mode === 'analyze' && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  server: {
    port: 5174, 
  },
  build: {
    // 减少打包体积的配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console.log
        drop_debugger: true // 移除 debugger
      }
    },
    rollupOptions: {
      output: {
        // 代码分割
        manualChunks: {
          // 将 Vue 相关库单独打包
          vue: ['vue', 'vue-router'],
          // 将 UI 库单独打包
          ui: ['bootstrap', '@popperjs/core'],
          // 将编辑器相关库单独打包
          editor: ['@kangc/v-md-editor', 'markdown-it', 'highlight.js', 'md-editor-v3'],
          // 将工具库单独打包
          utils: ['axios']
        }
      }
    },
    // 压缩选项
    chunkSizeWarningLimit: 1000,
    // 启用 gzip 压缩
    reportCompressedSize: true
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'axios',
      '@popperjs/core',
      '@kangc/v-md-editor',
      'markdown-it',
      'highlight.js',
      'md-editor-v3'
    ]
  }
}))
