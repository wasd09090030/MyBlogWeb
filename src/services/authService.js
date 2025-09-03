import { API_CONFIG } from '../config/api.js'

// 获取API基础URL
const baseURL = API_CONFIG.BASE_URL

/**
 * 管理员登录API
 */
export const authAPI = {
  // 管理员登录
  async login(username, password) {
    try {
      const response = await fetch(`${baseURL}${import.meta.env.PROD ? '/api/auth/login' : '/auth/login'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: error.message || '登录失败，请检查网络连接'
      }
    }
  },

  // 修改密码
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await fetch(`${baseURL}${import.meta.env.PROD ? '/api/auth/change-password' : '/auth/change-password'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Change password error:', error)
      return {
        success: false,
        message: error.message || '密码修改失败，请检查网络连接'
      }
    }
  }
}
