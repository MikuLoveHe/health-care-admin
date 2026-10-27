import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const THEME_KEY = 'health_care_theme'

/**
 * 全局应用状态
 * 负责侧边栏折叠与主题（含暗黑模式）切换。
 */
export const useAppStore = defineStore('app', () => {
  /* ---------------------------- 侧边栏折叠 ---------------------------- */
  const sidebarCollapsed = ref(localStorage.getItem('health_care_sidebar') === 'collapsed')

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('health_care_sidebar', sidebarCollapsed.value ? 'collapsed' : 'expanded')
  }

  /* ---------------------------- 主题切换 ---------------------------- */
  // 首次进入时读取本地记录，未记录过则跟随操作系统的深色偏好
  const theme = ref(
    localStorage.getItem(THEME_KEY) ||
      (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  )

  const isDark = ref(theme.value === 'dark')

  /** 把主题同步到 <html> 的 class 上，Element Plus 的暗黑样式依赖这个类 */
  function applyTheme(value) {
    const html = document.documentElement
    if (value === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    isDark.value = value === 'dark'
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  // 主题变化时同步 DOM 与本地存储
  watch(
    theme,
    (value) => {
      applyTheme(value)
      localStorage.setItem(THEME_KEY, value)
    },
    { immediate: true },
  )

  return {
    sidebarCollapsed,
    toggleSidebar,
    theme,
    isDark,
    toggleTheme,
    applyTheme,
  }
})
