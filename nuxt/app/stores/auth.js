import { defineStore } from 'pinia'

// 用户角色枚举
export const UserRoles = {
  GUEST: 'guest',
  ADMIN: 'admin'
}

// Cookie 键名
const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'
const TOKEN_EXPIRES_KEY = 'auth_token_expires'
const USER_ROLE_KEY = 'user_role'
const IS_AUTHENTICATED_KEY = 'is_authenticated'
const LOGIN_TIME_KEY = 'login_time'

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
    // 获取 Cookie 实例
    _getCookies() {
      if (!import.meta.client) return {}
      return {
        token: useCookie(TOKEN_KEY, { maxAge: 60 * 60 * 24 * 7 }), // 7天
        refreshToken: useCookie(REFRESH_TOKEN_KEY, { maxAge: 60 * 60 * 24 * 30 }), // 30天
        tokenExpires: useCookie(TOKEN_EXPIRES_KEY, { maxAge: 60 * 60 * 24 * 7 }),
        userRole: useCookie(USER_ROLE_KEY, { maxAge: 60 * 60 * 24 * 7 }),
        isAuthenticated: useCookie(IS_AUTHENTICATED_KEY, { maxAge: 60 * 60 * 24 * 7 }),
        loginTime: useCookie(LOGIN_TIME_KEY, { maxAge: 60 * 60 * 24 * 7 })
      }
    },

    // 验证管理员密码 - 通过API调用
    async verifyAdminPassword(password) {
      const config = useRuntimeConfig()
      const baseURL = config.public.apiBase

      // 检查是否在锁定时间内
      const now = Date.now()
      if (this.lockoutUntil > now) {
        const remainingTimeInSeconds = Math.ceil((this.lockoutUntil - now) / 1000)
        return {
          success: false,
          message: `账户已锁定，请在${remainingTimeInSeconds}秒后重试`
        }
      }

      try {
        // 通过API验证密码
        const result = await $fetch(`${baseURL}/auth/login`, {
          method: 'POST',
          body: { username: 'admin', password }
        })

        if (result.success) {
          // 重置错误尝试次数
          this.loginAttempts = 0
          
          // 存储 Token
          this.token = result.token
          this.refreshToken = result.refreshToken
          this.tokenExpiresAt = result.expiresAt
          
          // 使用 Cookie 存储
          if (import.meta.client) {
            const cookies = this._getCookies()
            cookies.token.value = result.token
            cookies.refreshToken.value = result.refreshToken
            cookies.tokenExpires.value = result.expiresAt
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
      } catch (error) {
        console.error('登录验证失败:', error)
        return {
          success: false,
          message: '登录验证失败，请重试'
        }
      }
    },

    // 刷新 Token
    async refreshAccessToken() {
      if (!this.refreshToken) return false
      
      const config = useRuntimeConfig()
      const baseURL = config.public.apiBase
      
      try {
        const result = await $fetch(`${baseURL}/auth/refresh`, {
          method: 'POST',
          body: { refreshToken: this.refreshToken }
        })
        
        if (result.success) {
          this.token = result.token
          this.refreshToken = result.refreshToken
          this.tokenExpiresAt = result.expiresAt
          
          if (import.meta.client) {
            const cookies = this._getCookies()
            cookies.token.value = result.token
            cookies.refreshToken.value = result.refreshToken
            cookies.tokenExpires.value = result.expiresAt
          }
          return true
        }
        return false
      } catch (error) {
        console.error('Token 刷新失败:', error)
        return false
      }
    },

    // 带认证的 fetch 请求
    async authFetch(url, options = {}) {
      const config = useRuntimeConfig()
      const baseURL = config.public.apiBase
      
      // 如果 Token 即将过期，先刷新
      if (this.isTokenExpiringSoon && this.refreshToken) {
        await this.refreshAccessToken()
      }
      
      const fetchOptions = {
        ...options,
        headers: {
          ...options.headers,
          ...this.authHeaders
        }
      }
      
      try {
        return await $fetch(`${baseURL}${url}`, fetchOptions)
      } catch (error) {
        // 如果是 401 错误，尝试刷新 Token 并重试
        if (error.response?.status === 401 && this.refreshToken) {
          const refreshed = await this.refreshAccessToken()
          if (refreshed) {
            fetchOptions.headers = {
              ...options.headers,
              ...this.authHeaders
            }
            return await $fetch(`${baseURL}${url}`, fetchOptions)
          }
        }
        throw error
      }
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

          // 验证密码
          const verifyResult = await this.verifyAdminPassword(password)
          if (!verifyResult.success) {
            return verifyResult
          }

          // 验证成功，设置认证状态
          this.isAuthenticated = true
          if (import.meta.client) {
            const cookies = this._getCookies()
            cookies.isAuthenticated.value = 'true'
            cookies.loginTime.value = Date.now().toString()
          }
        }
      }

      // 更新角色
      if (Object.values(UserRoles).includes(role)) {
        this.userRole = role
        if (import.meta.client) {
          const cookies = this._getCookies()
          cookies.userRole.value = role
        }
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
      const config = useRuntimeConfig()
      const baseURL = config.public.apiBase
      
      // 调用后端登出接口（使 RefreshToken 失效）
      if (this.token) {
        try {
          await $fetch(`${baseURL}/auth/logout`, {
            method: 'POST',
            headers: this.authHeaders
          })
        } catch (error) {
          console.error('登出请求失败:', error)
        }
      }
      
      this.userRole = UserRoles.GUEST
      this.isAuthenticated = false
      this.loginAttempts = 0
      this.lockoutUntil = 0
      this.token = null
      this.refreshToken = null
      this.tokenExpiresAt = null

      if (import.meta.client) {
        const cookies = this._getCookies()
        cookies.userRole.value = UserRoles.GUEST
        cookies.isAuthenticated.value = null
        cookies.loginTime.value = null
        cookies.token.value = null
        cookies.refreshToken.value = null
        cookies.tokenExpires.value = null
      }

      return {
        success: true
      }
    },

    // 修改密码
    async changePassword(currentPassword, newPassword) {
      const config = useRuntimeConfig()
      const baseURL = config.public.apiBase

      try {
        const result = await $fetch(`${baseURL}/auth/change-password`, {
          method: 'POST',
          headers: this.authHeaders,
          body: { currentPassword, newPassword }
        })

        return result
      } catch (error) {
        console.error('修改密码失败:', error)
        return {
          success: false,
          message: error.data?.message || '修改密码失败，请重试'
        }
      }
    },

    // 初始化状态
    initialize() {
      if (!import.meta.client) return

      const cookies = this._getCookies()
      
      const savedRole = cookies.userRole.value
      const savedAuth = cookies.isAuthenticated.value
      const savedLoginTime = cookies.loginTime.value
      const savedToken = cookies.token.value
      const savedRefreshToken = cookies.refreshToken.value
      const savedTokenExpires = cookies.tokenExpires.value

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
        const cookies = this._getCookies()
        cookies.userRole.value = UserRoles.GUEST
      }
      // 否则恢复之前保存的角色
      else if (savedRole && Object.values(UserRoles).includes(savedRole)) {
        this.userRole = savedRole
      }
    }
  }
})