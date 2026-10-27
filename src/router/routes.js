import AppLayout from '@/layout/index.vue'

/**
 * 路由表
 *
 * 侧边栏菜单由本表递归生成（见 layout/components/Sidebar.vue），
 * 因此「菜单」与「路由」是同一份数据源，不会出现菜单点了 404 的情况。
 *
 * meta 字段说明：
 *   title   菜单标题 / 面包屑文字
 *   icon    Element Plus 图标组件名（已在 main.js 全局注册）
 *   hidden  为 true 时不在侧边栏显示（详情页、404 等）
 *   activeMenu 隐藏页面高亮的父级菜单路径（如订单详情高亮订单列表）
 */
export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', hidden: true },
  },
]

export const asyncRoutes = [
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页概览', icon: 'HomeFilled' },
      },
    ],
  },
  {
    path: '/basic',
    component: AppLayout,
    redirect: '/basic/service',
    meta: { title: '基础管理', icon: 'Management' },
    children: [
      {
        path: 'service',
        name: 'ServiceManage',
        component: () => import('@/views/basic/service/index.vue'),
        meta: { title: '服务管理', icon: 'Bowl' },
      },
      {
        path: 'ad',
        name: 'AdManage',
        component: () => import('@/views/basic/ad/index.vue'),
        meta: { title: '广告管理', icon: 'PictureFilled' },
      },
      {
        path: 'user',
        name: 'UserManage',
        component: () => import('@/views/basic/user/index.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'district',
        name: 'DistrictManage',
        component: () => import('@/views/basic/district/index.vue'),
        meta: { title: '辖区范围管理', icon: 'MapLocation' },
      },
    ],
  },
  {
    path: '/volunteer',
    component: AppLayout,
    redirect: '/volunteer/audit',
    meta: { title: '志愿者管理', icon: 'Avatar' },
    children: [
      {
        path: 'audit',
        name: 'VolunteerAudit',
        component: () => import('@/views/volunteer/audit/index.vue'),
        meta: { title: '志愿者申请审核', icon: 'DocumentChecked' },
      },
      {
        path: 'list',
        name: 'VolunteerList',
        component: () => import('@/views/volunteer/list/index.vue'),
        meta: { title: '志愿者列表', icon: 'List' },
      },
      {
        path: 'detail/:id',
        name: 'VolunteerDetail',
        component: () => import('@/views/volunteer/detail/index.vue'),
        meta: { title: '资质详情', hidden: true, activeMenu: '/volunteer/list' },
      },
    ],
  },
  {
    path: '/order',
    component: AppLayout,
    redirect: '/order/list',
    meta: { title: '订单管理', icon: 'Tickets' },
    children: [
      {
        path: 'list',
        name: 'OrderList',
        component: () => import('@/views/order/list/index.vue'),
        meta: { title: '订单列表', icon: 'Document' },
      },
      {
        path: 'detail/:id',
        name: 'OrderDetail',
        component: () => import('@/views/order/detail/index.vue'),
        meta: { title: '订单详情', hidden: true, activeMenu: '/order/list' },
      },
    ],
  },
  {
    path: '/archive',
    component: AppLayout,
    redirect: '/archive/list',
    meta: { title: '档案管理', icon: 'Folder' },
    children: [
      {
        path: 'list',
        name: 'ArchiveList',
        component: () => import('@/views/archive/list/index.vue'),
        meta: { title: '档案列表', icon: 'Files' },
      },
      {
        path: 'create',
        name: 'ArchiveCreate',
        component: () => import('@/views/archive/create/index.vue'),
        meta: { title: '档案录入', icon: 'EditPen' },
      },
      {
        path: 'import',
        name: 'ArchiveImport',
        component: () => import('@/views/archive/import/index.vue'),
        meta: { title: '批量导入', icon: 'UploadFilled' },
      },
    ],
  },
  {
    path: '/monitor',
    component: AppLayout,
    redirect: '/monitor/overview',
    meta: { title: '业务监控', icon: 'DataAnalysis' },
    children: [
      {
        path: 'overview',
        name: 'MonitorOverview',
        component: () => import('@/views/monitor/overview/index.vue'),
        meta: { title: '数据总览', icon: 'Odometer' },
      },
      {
        path: 'chart',
        name: 'MonitorChart',
        component: () => import('@/views/monitor/chart/index.vue'),
        meta: { title: '图表分析', icon: 'TrendCharts' },
      },
      {
        path: 'report',
        name: 'MonitorReport',
        component: () => import('@/views/monitor/report/index.vue'),
        meta: { title: '业务报表', icon: 'Memo' },
      },
    ],
  },
]

/** 兜底路由，必须放在最后，匹配不到的路径一律跳 404 */
export const fallbackRoute = {
  path: '/:pathMatch(.*)*',
  redirect: '/404',
  meta: { hidden: true },
}

export const routes = [...constantRoutes, ...asyncRoutes, fallbackRoute]

export default routes
