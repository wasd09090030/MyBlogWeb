// 用户权限状态管理
import { ref, readonly } from 'vue';

// 用户角色枚举
export const UserRoles = {
  GUEST: 'guest',
  ADMIN: 'admin'
};

// 管理员初始密码 (在实际生产环境中，密码应该存储在后端，并使用哈希加密)
const ADMIN_PASSWORD = 'admin123';
// 错误尝试计数
const loginAttempts = ref(0);
const lockoutUntil = ref(0);

// 创建响应式状态
const userRole = ref(UserRoles.GUEST); // 默认为游客
const isAuthenticated = ref(false);  // 认证状态

// 设置用户角色的方法
function setUserRole(role, password = null) {
  // 如果尝试设置为管理员角色，需要验证密码
  if (role === UserRoles.ADMIN) {
    if (!isAuthenticated.value) {
      if (!password) {
        return {
          success: false,
          message: '请输入管理员密码'
        };
      }
      
      // 验证密码
      const verifyResult = verifyAdminPassword(password);
      if (!verifyResult.success) {
        return verifyResult; // 返回验证结果（包含错误信息）
      }
      
      // 验证成功，设置认证状态
      isAuthenticated.value = true;
      localStorage.setItem('isAuthenticated', 'true');
      
      // 记录登录时间（用于会话超时）
      const loginTime = Date.now();
      localStorage.setItem('loginTime', loginTime.toString());
    }
  }
  
  // 更新角色
  if (Object.values(UserRoles).includes(role)) {
    userRole.value = role;
    // 将当前角色保存到本地存储，以便页面刷新后保持状态
    localStorage.setItem('userRole', role);
    return {
      success: true
    };
  }
  
  return {
    success: false,
    message: '无效的用户角色'
  };
}

// 验证管理员密码
function verifyAdminPassword(password) {
  // 检查是否在锁定时间内
  const now = Date.now();
  if (lockoutUntil.value > now) {
    const remainingTimeInSeconds = Math.ceil((lockoutUntil.value - now) / 1000);
    return {
      success: false,
      message: `账户已锁定，请在${remainingTimeInSeconds}秒后重试`
    };
  }
  
  // 验证密码
  const isValid = password === ADMIN_PASSWORD;
  
  if (isValid) {
    // 重置错误尝试次数
    loginAttempts.value = 0;
    return {
      success: true
    };
  } else {
    // 增加错误尝试次数
    loginAttempts.value++;
    
    // 如果连续错误5次，锁定账户1分钟
    if (loginAttempts.value >= 5) {
      lockoutUntil.value = now + (60 * 1000); // 1分钟后解锁
      loginAttempts.value = 0;
      return {
        success: false,
        message: '密码错误5次，账户已锁定1分钟'
      };
    }
    
    return {
      success: false,
      message: `密码错误，还有${5 - loginAttempts.value}次尝试机会`
    };
  }
}

// 检查是否为管理员
function isAdmin() {
  return userRole.value === UserRoles.ADMIN && isAuthenticated.value;
}

// 退出管理员模式
function logout() {
  userRole.value = UserRoles.GUEST;
  isAuthenticated.value = false;
  localStorage.setItem('userRole', UserRoles.GUEST);
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('loginTime');
  loginAttempts.value = 0; // 重置登录尝试次数
  return {
    success: true
  };
}

// 初始化 - 从本地存储中恢复用户角色和认证状态
function initUserRole() {
  const savedRole = localStorage.getItem('userRole');
  const savedAuth = localStorage.getItem('isAuthenticated');
  const savedLoginTime = localStorage.getItem('loginTime');
  
  // 检查会话是否过期（8小时后自动退出）
  const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8小时，单位：毫秒
  const now = Date.now();
  const loginTime = savedLoginTime ? parseInt(savedLoginTime) : 0;
  const isSessionExpired = now - loginTime > SESSION_TIMEOUT;
  
  if (isSessionExpired && savedAuth === 'true') {
    // 会话已过期，重置为游客状态
    isAuthenticated.value = false;
    userRole.value = UserRoles.GUEST;
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('loginTime');
    localStorage.setItem('userRole', UserRoles.GUEST);
    return;
  }
  
  isAuthenticated.value = savedAuth === 'true';
  
  // 如果之前保存的是管理员角色但没有通过认证，则重置为游客
  if (savedRole === UserRoles.ADMIN && !isAuthenticated.value) {
    userRole.value = UserRoles.GUEST;
    localStorage.setItem('userRole', UserRoles.GUEST);
  } 
  // 否则恢复之前保存的角色
  else if (savedRole && Object.values(UserRoles).includes(savedRole)) {
    userRole.value = savedRole;
  }
}

// 导出响应式状态和方法
export default {
  userRole: readonly(userRole), // 只读引用，防止外部直接修改
  isAuthenticated: readonly(isAuthenticated), // 只读的认证状态
  setUserRole,
  isAdmin,
  logout,
  initUserRole,
  verifyAdminPassword
};
