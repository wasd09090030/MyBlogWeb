// 主题切换 Composable
export const useTheme = () => {
  const isDarkMode = useState('isDarkMode', () => false)

  // 初始化主题
  const initTheme = () => {
    if (process.client) {
      const savedTheme = localStorage.getItem('darkMode')
      if (savedTheme !== null) {
        isDarkMode.value = savedTheme === 'true'
      } else {
        // 检查系统主题偏好
        isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      applyTheme()
    }
  }

  // 应用主题
  const applyTheme = () => {
    if (process.client) {
      document.documentElement.setAttribute('data-bs-theme', isDarkMode.value ? 'dark' : 'light')
    }
  }

  // 切换主题
  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    if (process.client) {
      localStorage.setItem('darkMode', isDarkMode.value.toString())
      applyTheme()
    }
  }

  return {
    isDarkMode,
    initTheme,
    toggleTheme
  }
}
