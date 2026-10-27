import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import routes from './routes'

/**
 * 路由实例
 * 采用 hash 模式，这样打包后的 dist 直接双击 index.html 也能正常跑，
 * 便于交给老师查看，无需额外配置服务器 rewrite。
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // 切换路由时回到页面顶部
  scrollBehavior: () => ({ top: 0 }),
})

const SITE_TITLE = '健康颐养平台管理端'

/* ------------------------------ 全局前置守卫 ------------------------------ */
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  // 已登录还访问登录页，直接送回首页
  if (to.path === '/login') {
    next(token ? { path: '/' } : undefined)
    return
  }

  if (!token) {
    // 未登录一律跳登录页，并记录来源路径，登录后可跳回
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  next()
})

/* ------------------------------ 全局后置钩子 ------------------------------ */
router.afterEach((to) => {
  document.title = to.meta?.title ? `${to.meta.title} - ${SITE_TITLE}` : SITE_TITLE
})

export default router
