/**
 * Mock 适配器
 *
 * 把 axios 的请求转发到本地路由表，返回值结构与真实后端保持一致：
 *   { code: 200, data: {...}, message: 'ok' }
 *
 * 这样 @/utils/request.js 中的拦截器逻辑可以真实生效，
 * 将来切换真实后端时，只需删除 request.js 里的 adapter 配置即可。
 */
import { delay } from './helper'
import authRoutes from './modules/auth'
import basicRoutes from './modules/basic'
import volunteerRoutes from './modules/volunteer'
import orderRoutes from './modules/order'
import archiveRoutes from './modules/archive'
import monitorRoutes from './modules/monitor'

/** 汇总所有模块的路由表，key 格式为 'METHOD /path'，path 支持 :param 占位 */
const routes = {
  ...authRoutes,
  ...basicRoutes,
  ...volunteerRoutes,
  ...orderRoutes,
  ...archiveRoutes,
  ...monitorRoutes,
}

/** 成功响应 */
export function ok(data = null, message = 'ok') {
  return { code: 200, data, message }
}

/** 失败响应 */
export function fail(message = '操作失败', code = 500) {
  return { code, data: null, message }
}

/** 解析请求体（axios 在调用 adapter 前已将对象序列化为 JSON 字符串） */
function parseBody(data) {
  if (!data) return {}
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return {}
    }
  }
  // FormData 场景（文件上传）原样返回
  return data
}

/** 将 '/api/services' 归一化为 '/services' */
function normalizePath(url, baseURL) {
  let path = url || ''
  if (baseURL && path.startsWith(baseURL)) {
    path = path.slice(baseURL.length)
  }
  path = path.split('?')[0]
  if (!path.startsWith('/')) path = `/${path}`
  // 去掉末尾斜杠，便于匹配
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

/** 在路由表中查找匹配项，支持 :id 形式的路径参数 */
function matchRoute(method, path) {
  const directKey = `${method} ${path}`
  if (routes[directKey]) return { handler: routes[directKey], params: {} }

  const pathParts = path.split('/')
  for (const routeKey of Object.keys(routes)) {
    const spaceIndex = routeKey.indexOf(' ')
    const routeMethod = routeKey.slice(0, spaceIndex)
    const pattern = routeKey.slice(spaceIndex + 1)
    if (routeMethod !== method) continue

    const patternParts = pattern.split('/')
    if (patternParts.length !== pathParts.length) continue

    const params = {}
    let matched = true
    for (let i = 0; i < patternParts.length; i += 1) {
      const patternPart = patternParts[i]
      if (patternPart.startsWith(':')) {
        params[patternPart.slice(1)] = decodeURIComponent(pathParts[i])
      } else if (patternPart !== pathParts[i]) {
        matched = false
        break
      }
    }
    if (matched) return { handler: routes[routeKey], params }
  }
  return null
}

/**
 * 自定义 axios adapter
 * @param {import('axios').InternalAxiosRequestConfig} config
 */
export async function mockAdapter(config) {
  const method = (config.method || 'get').toUpperCase()
  const path = normalizePath(config.url, config.baseURL)

  // 模拟网络耗时，让页面 loading 状态可见
  await delay(180 + Math.floor(Math.random() * 220))

  const matched = matchRoute(method, path)

  let payload
  if (!matched) {
    payload = fail(`Mock 接口未定义：${method} ${path}`, 404)
  } else {
    try {
      payload = await matched.handler({
        params: matched.params,
        query: config.params || {},
        body: parseBody(config.data),
        config,
      })
    } catch (error) {
      payload = fail(error?.message || '服务内部错误')
    }
  }

  return {
    data: payload,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
    request: { mock: true },
  }
}

export default routes
