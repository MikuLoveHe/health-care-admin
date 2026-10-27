/**
 * 订单管理模块 Mock 接口
 * 覆盖：订单列表（状态/时间/类型筛选、分页）、订单详情（含状态流转记录）
 */
import { fail, ok } from '../index'
import { orders } from '../db'
import { inDateRange, keywordMatch, paginate } from '../helper'

export default {
  // 订单列表：支持关键字、状态、服务类型、时间区间筛选与分页
  'GET /orders': ({ query }) => {
    const { keyword, status, type, dateRange, page, pageSize } = query
    const filtered = orders.filter(
      (item) =>
        keywordMatch(item, keyword, ['orderNo', 'userName', 'volunteerName', 'serviceName']) &&
        (!status || item.status === status) &&
        (!type || item.type === type) &&
        inDateRange(item.orderTime, dateRange),
    )
    // 按下单时间倒序，最新的排在最前
    filtered.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime))
    return ok(paginate(filtered, { page, pageSize }))
  },

  // 订单详情
  'GET /orders/:id': ({ params }) => {
    const item = orders.find((order) => order.id === Number(params.id))
    return item ? ok(item) : fail('订单不存在', 404)
  },

  // 取消订单
  'PATCH /orders/:id/cancel': ({ params, body }) => {
    const item = orders.find((order) => order.id === Number(params.id))
    if (!item) return fail('订单不存在', 404)
    if (['已完成', '已取消'].includes(item.status)) {
      return fail(`订单已${item.status}，无法取消`)
    }
    item.status = '已取消'
    item.statusFlow.push({
      node: '订单取消',
      time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      operator: '平台管理员',
      remark: body?.remark || '管理员手动取消订单，服务费将原路退回',
    })
    return ok(item, '订单已取消')
  },

  // 订单状态分布统计（业务监控页使用）
  'GET /orders/statistics': () => {
    const statistics = {}
    orders.forEach((item) => {
      statistics[item.status] = (statistics[item.status] || 0) + 1
    })
    return ok(statistics)
  },
}
