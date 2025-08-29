import { galleryService } from './services/articleService.js'

// 测试Gallery服务
async function testGalleryService() {
  try {
    console.log('测试Gallery服务...')
    const result = await galleryService.getGalleries()
    console.log('Gallery服务返回结果:', result)
    console.log('结果类型:', typeof result)
    console.log('是否为数组:', Array.isArray(result))
    if (Array.isArray(result)) {
      console.log('数组长度:', result.length)
      if (result.length > 0) {
        console.log('第一个元素:', result[0])
      }
    }
  } catch (error) {
    console.error('Gallery服务测试失败:', error)
  }
}

testGalleryService()
