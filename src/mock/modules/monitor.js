/**
 * 业务监控模块 Mock 接口
 * 覆盖：数据总览、图表分析、业务报表
 */
import { ok } from '../index'
import {
  archives,
  categoryRatio,
  districtDistribution,
  monthlyTrend,
  orderTrend,
  orders,
  overviewMetrics,
  volunteerRanking,
  volunteers,
} from '../db'
import { SERVICE_CATEGORIES } from '../db'

/** 按周期聚合报表数据 */
function buildReport(period) {
  if (period === 'week') {
    return orderTrend.map((item) => ({
      label: item.date,
      created: item.created,
      finished: item.finished,
      cancelled: item.cancelled,
      amount: Number((item.finished * 86.5).toFixed(2)),
      newUsers: Math.round(item.created * 0.42),
    }))
  }
  if (period === 'year') {
    // 按季度汇总 12 个月的数据
    const quarters = {}
    monthlyTrend.forEach((item, index) => {
      const key = `Q${Math.floor(index / 3) + 1}`
      if (!quarters[key]) quarters[key] = { label: key, created: 0, finished: 0, cancelled: 0, amount: 0, newUsers: 0 }
      quarters[key].created += item.created
      quarters[key].finished += item.finished
      quarters[key].amount += item.amount
      quarters[key].newUsers += item.newUsers
    })
    return Object.values(quarters).map((item) => ({ ...item, amount: Number(item.amount.toFixed(2)) }))
  }
  // 默认按月
  return monthlyTrend.map((item) => ({
    label: item.month,
    created: item.created,
    finished: item.finished,
    cancelled: Math.round(item.created * 0.05),
    amount: item.amount,
    newUsers: item.newUsers,
  }))
}

export default {
  // 数据总览：关键指标卡片
  'GET /monitor/overview': () => ok(overviewMetrics()),

  // 订单趋势（折线图）
  'GET /monitor/order-trend': () => ok(orderTrend),

  // 服务类型占比（饼图）
  'GET /monitor/category-ratio': () => ok(categoryRatio),

  // 各辖区老人分布（柱状图）
  'GET /monitor/district-distribution': () => ok(districtDistribution),

  // 志愿者服务时长排行（横向柱状图）
  'GET /monitor/volunteer-ranking': () => ok(volunteerRanking),

  // 订单状态分布
  'GET /monitor/order-status': () => {
    const result = {}
    orders.forEach((item) => {
      result[item.status] = (result[item.status] || 0) + 1
    })
    return ok(Object.entries(result).map(([name, value]) => ({ name, value })))
  },

  /**
   * 业务报表
   * @param query.period 'week' | 'month' | 'year'
   * @param query.dateRange 自定义时间区间
   */
  'GET /monitor/report': ({ query }) => {
    const period = query.period || 'month'
    const rows = buildReport(period)

    // 汇总行，页面底部合计栏使用
    const summary = rows.reduce(
      (total, item) => ({
        created: total.created + item.created,
        finished: total.finished + item.finished,
        cancelled: total.cancelled + item.cancelled,
        newUsers: total.newUsers + item.newUsers,
        amount: Number((total.amount + item.amount).toFixed(2)),
      }),
      { created: 0, finished: 0, cancelled: 0, newUsers: 0, amount: 0 },
    )
    // 完成率 = 已完成 / 已创建
    summary.finishRate = summary.created ? Number(((summary.finished / summary.created) * 100).toFixed(1)) : 0

    return ok({ period, rows, summary })
  },

  // 报表导出（前端生成 CSV，此处仅返回文件名与数据快照）
  'POST /monitor/report/export': ({ body }) => {
    const period = body?.period || 'month'
    const rows = buildReport(period)
    return ok({ fileName: `业务报表_${period}_${new Date().toISOString().slice(0, 10)}.csv`, rows }, '报表已生成')
  },

  // 平台健康度概况（首页仪表盘用）
  'GET /monitor/health': () => {
    const metrics = overviewMetrics()
    return ok({
      metrics,
      // 待办事项：把各模块的待处理数量聚合起来
      todos: [
        { title: '志愿者资质待审核', count: volunteers.filter((item) => item.qualificationStatus === '待审核').length, path: '/volunteer/audit', type: 'warning' },
        { title: '待接单订单', count: orders.filter((item) => item.status === '待接单').length, path: '/order/list', type: 'primary' },
        { title: '服务中订单', count: orders.filter((item) => item.status === '服务中').length, path: '/order/list', type: 'success' },
        { title: '本月新增档案', count: archives.filter((item) => item.age >= 65).length, path: '/archive/list', type: 'info' },
      ],
      categories: SERVICE_CATEGORIES,
    })
  },
}
