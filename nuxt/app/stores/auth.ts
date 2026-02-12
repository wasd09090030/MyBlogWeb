import { defineStore } from 'pinia'
import type { Ref } from 'vue'

// 用户角色枚举
export const UserRoles = {
  GUEST: 'guest',
  ADMIN: 'admin'
} as const

export type UserRole = typeof UserRoles[keyof typeof UserRoles]

type AuthHeaders = Record<string, string>

type AuthState = {
  userRole: UserRole
  isAuthenticated: boolean
  loginAttempts: number
  lockoutUntil: number
  token: string | null
  refreshToken: string | null
  tokenExpiresAt: string | null
  tokenRefreshTimer: ReturnType<typeof setInterval> | null
}

type AuthApiResponse = {
  success: boolean
  message?: string
  token?: string
  refreshToken?: string
  expiresAt?: string
}

type LogoutResponse = {
  success: boolean
  message?: string
}

type ChangePasswordResponse = {
  success: boolean
  message?: string
}

type CookieRef = Ref<string | null>

type AuthCookies = {
  token: CookieRef
  refreshToken: CookieRef
  tokenExpires: CookieRef
  userRole: CookieRef
  isAuthenticated: CookieRef
  loginTime: CookieRef
}

type AuthFetchOptions = {
} & NonNullable<Parameters<typeof $fetch>[1]>

type FetchErrorLike = {
  response?: { status?: number }
  data?: { message?: string }
}

function getErrorMessage(error: unknown, fallback = '请求失败'): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

function isFetchErrorLike(error: unknown): error is FetchErrorLike {
  return typeof error === 'object' && error !== null
}

// Cookie 键名
const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'
const TOKEN_EXPIRES_KEY = 'auth_token_expires'
const USER_ROLE_KEY = 'user_role'
const IS_AUTHENTICATED_KEY = 'is_authenticated'
const LOGIN_TIME_KEY = 'login_time'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    userRole: UserRoles.GUEST,
    isAuthenticated: false,
    loginAttempts: 0,
    lockoutUntil: 0,
    token: null,
    refreshToken: null,
    tokenExpiresAt: null,
    tokenRefreshTimer: null // 后台定时器
  }),

  getters: {
    isAdmin: (state): boolean => state.userRole === UserRoles.ADMIN && state.isAuthenticated,
    isGuest: (state): boolean => state.userRole === UserRoles.GUEST,
    isLocked: (state): boolean => state.lockoutUntil > Date.now(),
    // 获取认证头
    authHeaders: (state): AuthHeaders => {
      if (state.token) {
        return { Authorization: `Bearer ${state.token}` }
      }
      return {}
    },
    // 检查 Token 是否即将过期（30分钟内）
    isTokenExpiringSoon: (state): boolean => {
      if (!state.tokenExpiresAt) return false
      return new Date(state.tokenExpiresAt).getTime() - Date.now() < 30 * 60 * 1000
    },
    // 检查 Token 是否已过期
    isTokenExpired: (state): boolean => {
      if (!state.tokenExpiresAt) return true
      return new Date(state.tokenExpiresAt).getTime() < Date.now()
    }
  },

  actions: {
    // 获取 Cookie 实例
    _getCookies(): AuthCookies | null {
      if (!import.meta.client) return null
      // 注意：禁用自动 decode，避免 destr 将字符串转换为其他类型
      const cookieOpts = (maxAge: number) => ({ maxAge, decode: (v: string) => v, encode: (v: string) => v })
      return {
        token: useCookie(TOKEN_KEY, cookieOpts(60 * 60 * 24 * 7)),
        refreshToken: useCookie(REFRESH_TOKEN_KEY, cookieOpts(60 * 60 * 24 * 30)),
        tokenExpires: useCookie(TOKEN_EXPIRES_KEY, cookieOpts(60 * 60 * 24 * 7)),
        userRole: useCookie(USER_ROLE_KEY, cookieOpts(60 * 60 * 24 * 7)),
        isAuthenticated: useCookie(IS_AUTHENTICATED_KEY, cookieOpts(60 * 60 * 24 * 7)),
        loginTime: useCookie(LOGIN_TIME_KEY, cookieOpts(60 * 60 * 24 * 7))
      }
    },

    // 验证管理员密码 - 通过API调用
    async verifyAdminPassword(password: string): Promise<{ success: boolean; message?: string }> {
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
        const result = await $fetch<AuthApiResponse>(`${baseURL}/auth/login`, {
          method: 'POST',
          body: { username: 'admin', password }
        })

        if (result.success) {
          // 重置错误尝试次数
          this.loginAttempts = 0

          // 存储 Token
          this.token = result.token ?? null
          this.refreshToken = result.refreshToken ?? null
          this.tokenExpiresAt = result.expiresAt ?? null

          // 使用 Cookie 存储
          if (import.meta.client) {
            const cookies = this._getCookies()
            cookies.token.value = result.token
            cookies.refreshToken.value = result.refreshToken
            cookies.tokenExpires.value = result.expiresAt
          }

          // 启动后台定时器
          this.startTokenRefreshTimer()

          return {
            success: true
          }
        }

        // 增加错误尝试次数
        this.loginAttempts++

        // 如果连续错误5次，锁定账户1分钟
        if (this.loginAttempts >= 5) {
          this.lockoutUntil = now + 60 * 1000 // 1分钟后解锁
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
      } catch (error: unknown) {
        console.error('登录验证失败:', error)
        return {
          success: false,
          message: '登录验证失败，请重试'
        }
      }
    },

    // 刷新 Token
    async refreshAccessToken(): Promise<boolean> {
      if (!this.refreshToken) {
        console.log('[Auth] 没有 RefreshToken，无法刷新')
        return false
      }

      const config = useRuntimeConfig()
      const baseURL = config.public.apiBase

      try {
        console.log('[Auth] 正在刷新 Token...')
        const result = await $fetch<AuthApiResponse>(`${baseURL}/auth/refresh`, {
          method: 'POST',
          body: { refreshToken: this.refreshToken }
        })

        if (result.success) {
          console.log('[Auth] Token 刷新成功，新过期时间:', result.expiresAt)
          this.token = result.token ?? null
          this.refreshToken = result.refreshToken ?? null
          this.tokenExpiresAt = result.expiresAt ?? null

          if (import.meta.client) {
            const cookies = this._getCookies()
            cookies.token.value = result.token
            cookies.refreshToken.value = result.refreshToken
            cookies.tokenExpires.value = result.expiresAt
          }
          return true
        }
        console.log('[Auth] Token 刷新失败:', result.message)
        return false
      } catch (error: unknown) {
        console.error('[Auth] Token 刷新失败:', error)
        // 如果是 401 错误，说明 RefreshToken 也过期了，需要重新登录
        if (isFetchErrorLike(error) && error.response?.status === 401) {
          await this.logout()
        }
        return false
      }
    },

    // 启动后台 Token 检查定时器
    startTokenRefreshTimer(): void {
      if (!import.meta.client) return

      // 清除旧的定时器
      this.stopTokenRefreshTimer()

      // 每 10 分钟检查一次 Token 状态
      this.tokenRefreshTimer = setInterval(async () => {
        if (!this.isAuthenticated || !this.token) {
          this.stopTokenRefreshTimer()
          return
        }

        // 如果 Token 已过期，尝试刷新
        if (this.isTokenExpired) {
          console.log('[Auth] Token 已过期，尝试刷新...')
          const success = await this.refreshAccessToken()
          if (!success) {
            console.log('[Auth] Token 刷新失败，退出登录')
            await this.logout()
          }
        }
        // 如果 Token 即将过期（30分钟内），主动刷新
        else if (this.isTokenExpiringSoon) {
          console.log('[Auth] Token 即将过期，主动刷新...')
          await this.refreshAccessToken()
        }
      }, 10 * 60 * 1000) // 10 分钟

      console.log('[Auth] Token 刷新定时器已启动')
    },

    // 停止后台定时器
    stopTokenRefreshTimer(): void {
      if (this.tokenRefreshTimer) {
        clearInterval(this.tokenRefreshTimer)
        this.tokenRefreshTimer = null
        console.log('[Auth] Token 刷新定时器已停止')
      }
    },

    // 带认证的 fetch 请求（自动处理 Token 刷新）
    async authFetch<T = unknown>(url: string, options: AuthFetchOptions = {}): Promise<T> {
      const config = useRuntimeConfig()
      const baseURL = config.public.apiBase
      const request = $fetch as <R>(requestUrl: string, requestOptions?: AuthFetchOptions) => Promise<R>

      // 如果 Token 已过期，先刷新
      if (this.isTokenExpired && this.refreshToken) {
        console.log('[Auth] Token 已过期，请求前先刷新')
        const refreshed = await this.refreshAccessToken()
        if (!refreshed) {
          throw new Error('Token 已过期且刷新失败，请重新登录')
        }
      }
      // 如果 Token 即将过期，也先刷新
      else if (this.isTokenExpiringSoon && this.refreshToken) {
        console.log('[Auth] Token 即将过期，请求前先刷新')
        await this.refreshAccessToken()
      }

      const fetchOptions: AuthFetchOptions = {
        ...options,
        headers: {
          ...options.headers,
          ...this.authHeaders
        }
      }

      try {
        return await request<T>(`${baseURL}${url}`, fetchOptions)
      } catch (error: unknown) {
        // 如果是 401 错误，尝试刷新 Token 并重试一次
        if (isFetchErrorLike(error) && error.response?.status === 401 && this.refreshToken) {
          console.log('[Auth] 收到 401 错误，尝试刷新 Token 并重试')
          const refreshed = await this.refreshAccessToken()
          if (refreshed) {
            // 更新请求头
            fetchOptions.headers = {
              ...options.headers,
              ...this.authHeaders
            }
            // 重试请求
            try {
              return await request<T>(`${baseURL}${url}`, fetchOptions)
            } catch (retryError) {
              console.error('[Auth] 重试后仍然失败:', retryError)
              throw retryError
            }
          }
          console.error('[Auth] Token 刷新失败，需要重新登录')
          await this.logout()
          throw new Error('Token 已失效，请重新登录')
        }
        throw error
      }
    },

    // 设置用户角色
    async setUserRole(role: UserRole, password: string | null = null): Promise<{ success: boolean; message?: string }> {
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

          // 启动后台定时器
          this.startTokenRefreshTimer()
        }
      }

      // 更新角色
      if ((Object.values(UserRoles) as string[]).includes(role)) {
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
    async login(username: string, password: string): Promise<{ success: boolean; message?: string }> {
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
    async logout(): Promise<LogoutResponse> {
      const config = useRuntimeConfig()
      const baseURL = config.public.apiBase

      // 停止后台定时器
      this.stopTokenRefreshTimer()

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
    async changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
      const config = useRuntimeConfig()
      const baseURL = config.public.apiBase

      try {
        const result = await $fetch<ChangePasswordResponse>(`${baseURL}/auth/change-password`, {
          method: 'POST',
          headers: this.authHeaders,
          body: { currentPassword, newPassword }
        })

        return result
      } catch (error: unknown) {
        console.error('修改密码失败:', error)
        return {
          success: false,
          message: isFetchErrorLike(error)
            ? (error.data?.message || '修改密码失败，请重试')
            : getErrorMessage(error, '修改密码失败，请重试')
        }
      }
    },

    // 初始化认证状态（从 Cookie 恢复）
    async initialize(): Promise<void> {
      if (!import.meta.client) return

      const cookies = this._getCookies()

      const savedRole = cookies.userRole.value as string | null
      const savedAuth = cookies.isAuthenticated.value as string | null
      const savedLoginTime = cookies.loginTime.value as string | null
      const savedToken = cookies.token.value as string | null
      const savedRefreshToken = cookies.refreshToken.value as string | null
      const savedTokenExpires = cookies.tokenExpires.value as string | null

      // 恢复 Token
      if (savedToken) {
        this.token = savedToken
        this.refreshToken = savedRefreshToken
        this.tokenExpiresAt = savedTokenExpires
      }

      // 检查会话是否过期（8小时后自动退出）
      const SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8小时，单位：毫秒
      const now = Date.now()
      const loginTime = savedLoginTime ? parseInt(savedLoginTime, 10) : 0
      const isSessionExpired = now - loginTime > SESSION_TIMEOUT

      // 检查 Token 是否过期
      const isTokenExpired = savedTokenExpires && new Date(savedTokenExpires).getTime() < now

      if ((isSessionExpired || isTokenExpired) && savedAuth === 'true') {
        // 尝试使用 RefreshToken 刷新
        if (savedRefreshToken && !isSessionExpired) {
          console.log('[Auth] Token 过期，尝试自动刷新...')
          const success = await this.refreshAccessToken()
          if (!success) {
            console.log('[Auth] 刷新失败，需要重新登录')
            await this.logout()
            return
          }
          console.log('[Auth] Token 刷新成功，状态已恢复')
        } else {
          // 会话已过期，重置为游客状态
          console.log('[Auth] 会话已过期，需要重新登录')
          await this.logout()
          return
        }
      }

      // 恢复认证状态
      this.isAuthenticated = savedAuth === 'true'

      // 如果之前保存的是管理员角色但没有通过认证，则重置为游客
      if (savedRole === UserRoles.ADMIN && !this.isAuthenticated) {
        this.userRole = UserRoles.GUEST
        const cookies2 = this._getCookies()
        cookies2.userRole.value = UserRoles.GUEST
      }
      // 否则恢复之前保存的角色
      else if (savedRole && (Object.values(UserRoles) as string[]).includes(savedRole)) {
        this.userRole = savedRole as UserRole
      }

      // 如果已认证，启动后台定时器
      if (this.isAuthenticated && this.token) {
        console.log('[Auth] 认证状态已恢复，启动后台定时器')
        this.startTokenRefreshTimer()
      }
    }
  }
})
