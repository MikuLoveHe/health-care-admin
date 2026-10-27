import request from '@/utils/request'

/* ------------------------------ 申请审核 ------------------------------ */

export function getApplicationList(params) {
  return request.get('/volunteer/applications', { params })
}

/** 审核申请，result 为 '已通过' 或 '已驳回' */
export function auditApplication(id, data) {
  return request.post(`/volunteer/applications/${id}/audit`, data)
}

/* ------------------------------ 志愿者列表 ------------------------------ */

export function getVolunteerList(params) {
  return request.get('/volunteers', { params })
}

export function getVolunteerDetail(id) {
  return request.get(`/volunteers/${id}`)
}

export function createVolunteer(data) {
  return request.post('/volunteers', data)
}

export function updateVolunteer(id, data) {
  return request.put(`/volunteers/${id}`, data)
}

export function deleteVolunteer(id) {
  return request.delete(`/volunteers/${id}`)
}

export function updateVolunteerStatus(id, data) {
  return request.patch(`/volunteers/${id}/status`, data)
}

/* ------------------------------ 公共字典 ------------------------------ */

export function getCommunityList() {
  return request.get('/volunteer/communities')
}

export function getSkillList() {
  return request.get('/volunteer/skills')
}

export function getAuditRecords(id) {
  return request.get(`/volunteers/${id}/records`)
}
