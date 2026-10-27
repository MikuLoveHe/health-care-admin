import request from '@/utils/request'

export function getArchiveList(params) {
  return request.get('/archives', { params })
}

export function getArchiveDetail(id) {
  return request.get(`/archives/${id}`)
}

export function createArchive(data) {
  return request.post('/archives', data)
}

export function updateArchive(id, data) {
  return request.put(`/archives/${id}`, data)
}

export function deleteArchive(id) {
  return request.delete(`/archives/${id}`)
}

/** 批量导入，data 形如 { count: 20 } */
export function importArchives(data) {
  return request.post('/archives/import', data)
}

export function getCommunityList() {
  return request.get('/archives/communities')
}

export function getTemplateInfo() {
  return request.get('/archives/template')
}
