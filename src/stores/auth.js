import { defineStore } from 'pinia'

// 用户角色枚举
export const UserRoles = {
  GUEST: 'guest',
  ADMIN: 'admin'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userRole: UserRoles.GUEST,
    isAuthenticated: false,
    loginAttempts: 0,
    lockoutUntil: 0
  }),

  getters: {
    isAdmin: (state) => state.userRole === UserRoles.ADMIN && state.isAuthenticated,
    isGuest: (state) => state.userRole === UserRoles.GUEST,
    isLocked: (state) => state.lockoutUntil > Date.now()
  },

  actions: {
    // 验证管理员密码
    verifyAdminPassword(password) {
      const ADMIN_PASSWORD = 'admin123'
      
      // 检查是否在锁定时间内
      const now = Date.now()
      if (this.lockoutUntil > now) {
        const remainingTimeInSeconds = Math.ceil((this.lockoutUntil - now) / 1000)
        return {
          success: false,
          message: `账户已锁定，请在${remainingTimeInSeconds}秒后重试`
        }
      }
      
      // 验证密码
      const isValid = password === ADMIN_PASSWORD
      
      if (isValid) {
        // 重置错误尝试次数
        this.loginAttempts = 0
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
          message: `密码错误，还有${5 - this.loginAttempts}次尝试机会`
        }
      }
    },

    // 设置用户角色
    setUserRole(role, password = null) {
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
          const verifyResult = this.verifyAdminPassword(password)
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
    login(username, password) {
      // 简单验证用户名
      if (username !== 'admin') {
        return {
          success: false,
          message: '用户名错误'
        }
      }

      const result = this.setUserRole(UserRoles.ADMIN, password)
      return result
    },

    // 退出登录
    logout() {
      this.userRole = UserRoles.GUEST
      this.isAuthenticated = false
      this.loginAttempts = 0
      this.lockoutUntil = 0
      
      localStorage.setItem('userRole', UserRoles.GUEST)
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('loginTime')
      
      return {
        success: true
      }
    },

    // 初始化状态
    initialize() {
      const savedRole = localStorage.getItem('userRole')
      const savedAuth = localStorage.getItem('isAuthenticated')
      const savedLoginTime = localStorage.getItem('loginTime')
      
      // 检查会话是否过期（8小时后自动退出）
      const SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8小时，单位：毫秒
      const now = Date.now()
      const loginTime = savedLoginTime ? parseInt(savedLoginTime) : 0
      const isSessionExpired = now - loginTime > SESSION_TIMEOUT
      
      if (isSessionExpired && savedAuth === 'true') {
        // 会话已过期，重置为游客状态
        this.logout()
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
