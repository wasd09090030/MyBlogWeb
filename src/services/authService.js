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
      const response = await fetch(`${baseURL}${import.meta.env.PROD ? '/auth/login' : '/auth/login'}`, {
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

  // 刷新 Token
  async refreshToken(refreshToken) {
    try {
      const response = await fetch(`${baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken
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
      console.error('Refresh token error:', error)
      return {
        success: false,
        message: error.message || 'Token 刷新失败'
      }
    }
  },

  // 登出
  async logout(token) {
    try {
      const response = await fetch(`${baseURL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      return {
        success: true
      }
    } catch (error) {
      console.error('Logout error:', error)
      return {
        success: false,
        message: error.message || '登出失败'
      }
    }
  },

  // 验证 Token
  async verifyToken(token) {
    try {
      const response = await fetch(`${baseURL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        return { success: false }
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Verify token error:', error)
      return {
        success: false
      }
    }
  },

  // 修改密码
  async changePassword(currentPassword, newPassword, token) {
    try {
      const response = await fetch(`${baseURL}${import.meta.env.PROD ? '/auth/change-password' : '/auth/change-password'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
