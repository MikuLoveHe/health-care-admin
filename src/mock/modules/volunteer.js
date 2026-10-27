/**
 * 志愿者管理模块 Mock 接口
 * 覆盖：志愿者申请审核、志愿者列表、资质详情
 */
import { fail, ok } from '../index'
import { COMMUNITY_LIST, volunteerApplications, volunteers } from '../db'
import { inDateRange, keywordMatch, paginate, placeholderImage } from '../helper'

function nextId() {
  return volunteers.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

function now() {
  return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

/** 向审核记录中追加一条时间轴节点 */
function pushAuditRecord(item, node, result, remark) {
  if (!item.auditRecords) item.auditRecords = []
  item.auditRecords.push({ node, operator: '平台管理员', time: now(), result, remark })
}

export default {
  /* ------------------------------ 志愿者申请审核 ------------------------------ */

  // 待审核申请列表
  'GET /volunteer/applications': ({ query }) => {
    const { keyword, dateRange, page, pageSize } = query
    const filtered = volunteerApplications.filter(
      (item) =>
        keywordMatch(item, keyword, ['name', 'phone']) &&
        inDateRange(item.applyTime, dateRange),
    )
    return ok(paginate(filtered, { page, pageSize }))
  },

  // 审核通过 / 驳回
  'POST /volunteer/applications/:id/audit': ({ params, body }) => {
    const { result, remark } = body // result: '已通过' | '已驳回'
    const item = volunteers.find((volunteer) => volunteer.id === Number(params.id))
    if (!item) return fail('志愿者不存在', 404)
    if (item.qualificationStatus !== '待审核') return fail('该申请已审核，请勿重复操作')

    item.qualificationStatus = result
    item.auditTime = now()
    item.auditRemark = remark || ''
    pushAuditRecord(
      item,
      '资质审核',
      result === '已通过' ? '通过' : '驳回',
      remark || (result === '已通过' ? '资质齐全，审核通过' : '资质不符合要求'),
    )

    // 审核通过后移出待审队列
    const index = volunteerApplications.findIndex((app) => app.id === item.id)
    if (index !== -1) volunteerApplications.splice(index, 1)

    return ok(item, result === '已通过' ? '已通过审核' : '已驳回申请')
  },

  /* ------------------------------ 志愿者列表 ------------------------------ */

  // 志愿者列表：支持关键字、资质状态、技能筛选
  'GET /volunteers': ({ query }) => {
    const { keyword, qualificationStatus, skill, page, pageSize } = query
    const filtered = volunteers.filter(
      (item) =>
        keywordMatch(item, keyword, ['name', 'phone']) &&
        (!qualificationStatus || item.qualificationStatus === qualificationStatus) &&
        (!skill || (item.skills || []).includes(skill)),
    )
    return ok(paginate(filtered, { page, pageSize }))
  },

  // 志愿者详情（含证件与审核记录）
  'GET /volunteers/:id': ({ params }) => {
    const item = volunteers.find((volunteer) => volunteer.id === Number(params.id))
    return item ? ok(item) : fail('志愿者不存在', 404)
  },

  // 手动添加志愿者
  'POST /volunteers': ({ body }) => {
    const item = {
      ...body,
      id: nextId(),
      avatar: body.avatar || placeholderImage(body.name?.slice(0, 1) || '志', '#5B8FF9', 120, 120),
      serviceHours: body.serviceHours || 0,
      serviceCount: body.serviceCount || 0,
      // 手动添加的志愿者默认直接通过审核
      qualificationStatus: body.qualificationStatus || '已通过',
      certificates: body.certificates || [],
      applyTime: now(),
      auditTime: now(),
      auditRemark: '管理员手动添加',
      auditRecords: [
        { node: '管理员录入', operator: '平台管理员', time: now(), result: '通过', remark: '管理员手动添加志愿者档案' },
      ],
    }
    volunteers.unshift(item)
    return ok(item, '添加成功')
  },

  // 编辑志愿者
  'PUT /volunteers/:id': ({ params, body }) => {
    const index = volunteers.findIndex((volunteer) => volunteer.id === Number(params.id))
    if (index === -1) return fail('志愿者不存在', 404)
    volunteers[index] = { ...volunteers[index], ...body, id: volunteers[index].id }
    return ok(volunteers[index], '保存成功')
  },

  // 删除志愿者
  'DELETE /volunteers/:id': ({ params }) => {
    const index = volunteers.findIndex((volunteer) => volunteer.id === Number(params.id))
    if (index === -1) return fail('志愿者不存在', 404)
    volunteers.splice(index, 1)
    return ok(null, '删除成功')
  },

  // 修改资质状态（如续期、作废）
  'PATCH /volunteers/:id/status': ({ params, body }) => {
    const item = volunteers.find((volunteer) => volunteer.id === Number(params.id))
    if (!item) return fail('志愿者不存在', 404)
    item.qualificationStatus = body.qualificationStatus
    pushAuditRecord(item, '资质变更', body.qualificationStatus, body.remark || '管理员手动变更资质状态')
    return ok(item, '资质状态已更新')
  },

  /* ------------------------------ 公共字典 ------------------------------ */

  // 社区列表（志愿者归属选择用）
  'GET /volunteer/communities': () => ok(COMMUNITY_LIST),

  // 技能标签
  'GET /volunteer/skills': () =>
    ok(['医疗护理', '心理疏导', '家政服务', '文体活动', '法律咨询', '助餐配送', '康复理疗']),

  // 审核记录时间轴
  'GET /volunteers/:id/records': ({ params }) => {
    const item = volunteers.find((volunteer) => volunteer.id === Number(params.id))
    if (!item) return fail('志愿者不存在', 404)
    return ok(item.auditRecords || [])
  },
}
