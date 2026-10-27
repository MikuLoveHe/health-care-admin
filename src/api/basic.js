import request from '@/utils/request'

/* ------------------------------ 服务管理 ------------------------------ */

export function getServiceList(params) {
  return request.get('/services', { params })
}

export function getServiceDetail(id) {
  return request.get(`/services/${id}`)
}

export function createService(data) {
  return request.post('/services', data)
}

export function updateService(id, data) {
  return request.put(`/services/${id}`, data)
}

export function deleteService(id) {
  return request.delete(`/services/${id}`)
}

export function updateServiceStatus(id, status) {
  return request.patch(`/services/${id}/status`, { status })
}

/* ------------------------------ 广告管理 ------------------------------ */

export function getAdList(params) {
  return request.get('/ads', { params })
}

export function createAd(data) {
  return request.post('/ads', data)
}

export function updateAd(id, data) {
  return request.put(`/ads/${id}`, data)
}

export function deleteAd(id) {
  return request.delete(`/ads/${id}`)
}

export function updateAdStatus(id, status) {
  return request.patch(`/ads/${id}/status`, { status })
}

/* ------------------------------ 用户管理 ------------------------------ */

export function getUserList(params) {
  return request.get('/users', { params })
}

export function getUserDetail(id) {
  return request.get(`/users/${id}`)
}

export function updateUser(id, data) {
  return request.put(`/users/${id}`, data)
}

export function updateUserStatus(id, status) {
  return request.patch(`/users/${id}/status`, { status })
}

/* ------------------------------ 辖区范围管理 ------------------------------ */

export function getDistrictTree() {
  return request.get('/districts/tree')
}

export function getDistrictList() {
  return request.get('/districts')
}

export function createDistrict(data) {
  return request.post('/districts', data)
}

export function updateDistrict(id, data) {
  return request.put(`/districts/${id}`, data)
}

export function deleteDistrict(id) {
  return request.delete(`/districts/${id}`)
}
