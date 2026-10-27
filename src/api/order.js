import request from '@/utils/request'

export function getOrderList(params) {
  return request.get('/orders', { params })
}

export function getOrderDetail(id) {
  return request.get(`/orders/${id}`)
}

export function cancelOrder(id, data) {
  return request.patch(`/orders/${id}/cancel`, data)
}

export function getOrderStatistics() {
  return request.get('/orders/statistics')
}
