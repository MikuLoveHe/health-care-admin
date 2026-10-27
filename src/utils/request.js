import axios from 'axios'
import { ElMessage } from 'element-plus'
import { mockAdapter } from '@/mock'
import { getToken } from '@/utils/auth'

/**
 * Axios 统一封装
 *
 * 本项目为纯前端演示项目，没有真实后端，因此把 axios 的 adapter 换成了
 * 本地 Mock 适配器（见 @/mock）。这样做的意义是：请求拦截器、响应拦截器、
 * 错误处理等真实项目中的关键链路全部真实生效，将来只要去掉 adapter 这一行、
 * 把 baseURL 指向真实后端即可完成联调，业务代码一行都不用改。
 */
const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
  adapter: mockAdapter, // ← 联调真实后端时删除此行
})

/* ------------------------------ 请求拦截器 ------------------------------ */
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/* ------------------------------ 响应拦截器 ------------------------------ */
service.interceptors.response.use(
  (response) => {
    const res = response.data

    // 后端约定：code === 200 表示业务成功
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      // 401 表示登录态失效，清理后回到登录页
      if (res.code === 401) {
        localStorage.removeItem('health_care_token')
        window.location.hash = '#/login'
      }
      return Promise.reject(new Error(res.message || 'Error'))
    }
    // 直接剥离外层包装，业务代码拿到的就是 data 本身
    return res.data
  },
  (error) => {
    const message = error.response?.status === 404 ? '请求的接口不存在' : error.message || '网络异常'
    ElMessage.error(message)
    return Promise.reject(error)
  },
)

export default service
