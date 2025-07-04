/**
 * 浏览器原生通知工具
 * 使用浏览器原生的 alert、confirm 等方法替代自定义 Toast 组件
 */

/**
 * 显示成功消息
 * @param {string} message 消息内容
 */
export function showSuccess(message) {
  alert(`✅ ${message}`);
}

/**
 * 显示错误消息
 * @param {string} message 消息内容
 */
export function showError(message) {
  alert(`❌ ${message}`);
}

/**
 * 显示警告消息
 * @param {string} message 消息内容
 */
export function showWarning(message) {
  alert(`⚠️ ${message}`);
}

/**
 * 显示信息消息
 * @param {string} message 消息内容
 */
export function showInfo(message) {
  alert(`ℹ️ ${message}`);
}

/**
 * 显示确认对话框
 * @param {string} message 消息内容
 * @returns {boolean} 用户选择结果
 */
export function showConfirm(message) {
  return confirm(message);
}

/**
 * 兼容原有的 showToast 函数，根据类型调用相应的原生方法
 * @param {string} message 消息内容
 * @param {string} type 消息类型：'success', 'danger', 'warning', 'info', 'primary'
 */
export function showToast(message, type = 'info') {
  switch (type) {
    case 'success':
      showSuccess(message);
      break;
    case 'danger':
    case 'error':
      showError(message);
      break;
    case 'warning':
      showWarning(message);
      break;
    case 'info':
    case 'primary':
    default:
      showInfo(message);
      break;
  }
}
