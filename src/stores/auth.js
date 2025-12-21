import { defineStore } from 'pinia'
import { authAPI } from '../services/authService'

// 用户角色枚举
export const UserRoles = {
  GUEST: 'guest',
  ADMIN: 'admin'
}

// Token 存储键名
const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'
const TOKEN_EXPIRES_KEY = 'auth_token_expires'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userRole: UserRoles.GUEST,
    isAuthenticated: false,
    loginAttempts: 0,
    lockoutUntil: 0,
    token: null,
    refreshToken: null,
    tokenExpiresAt: null
  }),

  getters: {
    isAdmin: (state) => state.userRole === UserRoles.ADMIN && state.isAuthenticated,
    isGuest: (state) => state.userRole === UserRoles.GUEST,
    isLocked: (state) => state.lockoutUntil > Date.now(),
    // 获取认证头
    authHeaders: (state) => {
      if (state.token) {
        return { Authorization: `Bearer ${state.token}` }
      }
      return {}
    },
    // 检查 Token 是否即将过期（5分钟内）
    isTokenExpiringSoon: (state) => {
      if (!state.tokenExpiresAt) return false
      return new Date(state.tokenExpiresAt).getTime() - Date.now() < 5 * 60 * 1000
    }
  },

  actions: {
    // 验证管理员密码 - 现在通过API调用
    async verifyAdminPassword(password) {
      // 检查是否在锁定时间内
      const now = Date.now()
      if (this.lockoutUntil > now) {
        const remainingTimeInSeconds = Math.ceil((this.lockoutUntil - now) / 1000)
        return {
          success: false,
          message: `账户已锁定，请在${remainingTimeInSeconds}秒后重试`
        }
      }
      
      // 通过API验证密码
      const result = await authAPI.login('admin', password)
      
      if (result.success) {
        // 重置错误尝试次数
        this.loginAttempts = 0
        
        // 存储 Token
        if (result.data) {
          this.token = result.data.token
          this.refreshToken = result.data.refreshToken
          this.tokenExpiresAt = result.data.expiresAt
          
          localStorage.setItem(TOKEN_KEY, result.data.token)
          localStorage.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken)
          localStorage.setItem(TOKEN_EXPIRES_KEY, result.data.expiresAt)
        }
        
        return {
          success: true
        }
      } else {
        // 增加错误尝试次数
        this.loginAttempts++
        
        // 如果连续错误5次，锁定账户1分钟
        if (this.loginAttempts >= 5) {
          this.lockoutUntil = now + (60 * 1000) // 1分钟后解锁
          this.loginAttempts = 0
          return {
            success: false,
            message: '密码错误5次，账户已锁定1分钟'
          }
        }
        
        return {
          success: false,
          message: result.message || `密码错误，还有${5 - this.loginAttempts}次尝试机会`
        }
      }
    },

    // 刷新 Token
    async refreshAccessToken() {
      if (!this.refreshToken) return false
      
      const result = await authAPI.refreshToken(this.refreshToken)
      
      if (result.success && result.data) {
        this.token = result.data.token
        this.refreshToken = result.data.refreshToken
        this.tokenExpiresAt = result.data.expiresAt
        
        localStorage.setItem(TOKEN_KEY, result.data.token)
        localStorage.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken)
        localStorage.setItem(TOKEN_EXPIRES_KEY, result.data.expiresAt)
        return true
      }
      return false
    },

    // 设置用户角色
    async setUserRole(role, password = null) {
      // 如果尝试设置为管理员角色，需要验证密码
      if (role === UserRoles.ADMIN) {
        if (!this.isAuthenticated) {
          if (!password) {
            return {
              success: false,
              message: '请输入管理员密码'
            }
          }
          
          // 验证密码 - 现在是异步的
          const verifyResult = await this.verifyAdminPassword(password)
          if (!verifyResult.success) {
            return verifyResult // 返回验证结果（包含错误信息）
          }
          
          // 验证成功，设置认证状态
          this.isAuthenticated = true
          localStorage.setItem('isAuthenticated', 'true')
          
          // 记录登录时间（用于会话超时）
          const loginTime = Date.now()
          localStorage.setItem('loginTime', loginTime.toString())
        }
      }
      
      // 更新角色
      if (Object.values(UserRoles).includes(role)) {
        this.userRole = role
        // 将当前角色保存到本地存储，以便页面刷新后保持状态
        localStorage.setItem('userRole', role)
        return {
          success: true
        }
      }
      
      return {
        success: false,
        message: '无效的用户角色'
      }
    },

    // 管理员登录
    async login(username, password) {
      // 简单验证用户名
      if (username !== 'admin') {
        return {
          success: false,
          message: '用户名错误'
        }
      }

      const result = await this.setUserRole(UserRoles.ADMIN, password)
      return result
    },

    // 退出登录
    async logout() {
      // 调用后端登出接口
      if (this.token) {
        await authAPI.logout(this.token)
      }
      
      this.userRole = UserRoles.GUEST
      this.isAuthenticated = false
      this.loginAttempts = 0
      this.lockoutUntil = 0
      this.token = null
      this.refreshToken = null
      this.tokenExpiresAt = null
      
      localStorage.setItem('userRole', UserRoles.GUEST)
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('loginTime')
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(TOKEN_EXPIRES_KEY)
      
      return {
        success: true
      }
    },

    // 初始化状态
    initialize() {
      const savedRole = localStorage.getItem('userRole')
      const savedAuth = localStorage.getItem('isAuthenticated')
      const savedLoginTime = localStorage.getItem('loginTime')
      const savedToken = localStorage.getItem(TOKEN_KEY)
      const savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      const savedTokenExpires = localStorage.getItem(TOKEN_EXPIRES_KEY)
      
      // 恢复 Token
      if (savedToken) {
        this.token = savedToken
        this.refreshToken = savedRefreshToken
        this.tokenExpiresAt = savedTokenExpires
      }
      
      // 检查会话是否过期（8小时后自动退出）
      const SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8小时，单位：毫秒
      const now = Date.now()
      const loginTime = savedLoginTime ? parseInt(savedLoginTime) : 0
      const isSessionExpired = now - loginTime > SESSION_TIMEOUT
      
      // 检查 Token 是否过期
      const isTokenExpired = savedTokenExpires && new Date(savedTokenExpires).getTime() < now
      
      if ((isSessionExpired || isTokenExpired) && savedAuth === 'true') {
        // 尝试使用 RefreshToken 刷新
        if (savedRefreshToken && !isSessionExpired) {
          this.refreshAccessToken().then(success => {
            if (!success) {
              this.logout()
            }
          })
        } else {
          // 会话已过期，重置为游客状态
          this.logout()
        }
        return
      }
      
      this.isAuthenticated = savedAuth === 'true'
      
      // 如果之前保存的是管理员角色但没有通过认证，则重置为游客
      if (savedRole === UserRoles.ADMIN && !this.isAuthenticated) {
        this.userRole = UserRoles.GUEST
        localStorage.setItem('userRole', UserRoles.GUEST)
      } 
      // 否则恢复之前保存的角色
      else if (savedRole && Object.values(UserRoles).includes(savedRole)) {
        this.userRole = savedRole
      }
    }
  }
})
