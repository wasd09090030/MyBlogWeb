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
      // Tailwind 暗色模式需要 'dark' 类
      document.documentElement.classList.toggle('dark', isDarkMode.value)
      // 兼容旧的自定义类名
      document.documentElement.classList.toggle('dark-theme', isDarkMode.value)
      document.documentElement.classList.toggle('light-theme', !isDarkMode.value)
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
