import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { login as loginApi, logout as logoutApi, getUserInfo } from '@/api/auth'
import { getStoredUser, getToken, removeToken, setStoredUser, setToken } from '@/utils/auth'

/**
 * 登录态与用户信息
 * token 与用户信息同时写入 localStorage，刷新页面后可直接恢复登录态，
 * 避免每次刷新都要重新登录（登录页仍然保留，用于演示账号密码校验）。
 */
export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const userInfo = ref(getStoredUser())

  const isLoggedIn = computed(() => Boolean(token.value))
  const name = computed(() => userInfo.value?.name || '未登录')
  const avatar = computed(() => userInfo.value?.avatar || '')
  const roleName = computed(() => userInfo.value?.roleName || '')

  /** 登录：成功后写入 token 与用户信息 */
  async function login(payload) {
    const data = await loginApi(payload)
    token.value = data.token
    userInfo.value = data.user
    setToken(data.token)
    setStoredUser(data.user)
    return data
  }

  /** 拉取当前用户信息（刷新页面后用于校验登录态是否仍有效） */
  async function fetchUserInfo() {
    const data = await getUserInfo()
    userInfo.value = data
    setStoredUser(data)
    return data
  }

  /** 退出登录：无论接口是否成功，本地登录态都要清干净 */
  async function logout() {
    try {
      await logoutApi()
    } finally {
      token.value = ''
      userInfo.value = null
      removeToken()
    }
  }

  /** 仅清理本地状态（token 失效时由拦截器触发） */
  function resetState() {
    token.value = ''
    userInfo.value = null
    removeToken()
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    name,
    avatar,
    roleName,
    login,
    logout,
    fetchUserInfo,
    resetState,
  }
})
