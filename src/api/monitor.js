import request from '@/utils/request'

export function getOverview() {
  return request.get('/monitor/overview')
}

export function getOrderTrend() {
  return request.get('/monitor/order-trend')
}

export function getCategoryRatio() {
  return request.get('/monitor/category-ratio')
}

export function getDistrictDistribution() {
  return request.get('/monitor/district-distribution')
}

export function getVolunteerRanking() {
  return request.get('/monitor/volunteer-ranking')
}

export function getOrderStatus() {
  return request.get('/monitor/order-status')
}

export function getReport(params) {
  return request.get('/monitor/report', { params })
}

export function exportReport(data) {
  return request.post('/monitor/report/export', data)
}

export function getHealthOverview() {
  return request.get('/monitor/health')
}
