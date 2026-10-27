/**
 * 档案管理模块 Mock 接口
 * 覆盖：档案列表、档案录入、批量导入
 */
import { fail, ok } from '../index'
import { archives, COMMUNITY_LIST } from '../db'
import { calcAgeByIdCard } from '@/utils/format'
import { keywordMatch, paginate } from '../helper'

function nextId() {
  return archives.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

function now() {
  return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

/**
 * 校验 18 位身份证号（含末位校验码，依据 GB 11643-1999）
 * 前端表单已做同样校验，但服务端不能依赖前端，此处独立再校验一次。
 */
function isValidIdCard(idCard) {
  if (!/^\d{17}[\dXx]$/.test(idCard || '')) return false
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  const sum = idCard
    .slice(0, 17)
    .split('')
    .reduce((total, char, index) => total + Number(char) * weights[index], 0)
  return codes[sum % 11] === idCard.slice(17).toUpperCase()
}

export default {
  /* ------------------------------ 档案列表 ------------------------------ */

  // 档案列表：支持关键字、辖区、年龄段、健康情况筛选
  'GET /archives': ({ query }) => {
    const { keyword, districtId, ageRange, healthStatus, page, pageSize } = query
    const filtered = archives.filter((item) => {
      if (!keywordMatch(item, keyword, ['name', 'idCard', 'phone', 'address'])) return false
      if (districtId && item.districtId !== Number(districtId)) return false
      if (healthStatus && item.healthStatus !== healthStatus) return false
      // ageRange 形如 [60, 70]，闭区间
      if (ageRange && ageRange.length === 2 && ageRange[0] != null && ageRange[1] != null) {
        if (item.age < ageRange[0] || item.age > ageRange[1]) return false
      }
      return true
    })
    return ok(paginate(filtered, { page, pageSize }))
  },

  // 档案详情
  'GET /archives/:id': ({ params }) => {
    const item = archives.find((archive) => archive.id === Number(params.id))
    return item ? ok(item) : fail('档案不存在', 404)
  },

  // 档案录入
  'POST /archives': ({ body }) => {
    // 身份证格式校验（前端已校验，服务端独立再校验一次）
    if (!isValidIdCard(body.idCard)) {
      return fail('身份证号格式不正确，请核对后重新录入')
    }
    // 身份证唯一性校验
    if (archives.some((item) => item.idCard === body.idCard)) {
      return fail('该身份证号已存在档案，请勿重复录入')
    }
    const community = COMMUNITY_LIST.find((item) => item.id === Number(body.districtId))
    const item = {
      ...body,
      id: nextId(),
      // 年龄以后端根据身份证计算为准，避免前端传入与证件不一致
      age: calcAgeByIdCard(body.idCard) || body.age || 0,
      districtName: community?.fullName || '—',
      createTime: now(),
      updateTime: now(),
    }
    archives.unshift(item)
    return ok(item, '档案录入成功')
  },

  // 编辑档案
  'PUT /archives/:id': ({ params, body }) => {
    const index = archives.findIndex((archive) => archive.id === Number(params.id))
    if (index === -1) return fail('档案不存在', 404)
    // 传入身份证号时必须合法，且不能与其他档案重复
    if (body.idCard) {
      if (!isValidIdCard(body.idCard)) {
        return fail('身份证号格式不正确，请核对后重新提交')
      }
      if (archives.some((item) => item.idCard === body.idCard && item.id !== Number(params.id))) {
        return fail('该身份证号已存在档案，请勿重复录入')
      }
    }
    const community = COMMUNITY_LIST.find((item) => item.id === Number(body.districtId))
    archives[index] = {
      ...archives[index],
      ...body,
      id: archives[index].id,
      age: body.idCard ? calcAgeByIdCard(body.idCard) || archives[index].age : archives[index].age,
      districtName: community?.fullName || archives[index].districtName,
      updateTime: now(),
    }
    return ok(archives[index], '保存成功')
  },

  // 删除档案
  'DELETE /archives/:id': ({ params }) => {
    const index = archives.findIndex((archive) => archive.id === Number(params.id))
    if (index === -1) return fail('档案不存在', 404)
    archives.splice(index, 1)
    return ok(null, '删除成功')
  },

  /* ------------------------------ 批量导入 ------------------------------ */

  /**
   * 批量导入
   * 真实项目中这里会把文件流发给后端解析；本项目在前端模拟解析过程，
   * 依据传入的记录数生成对应数量的档案，并返回成功/失败明细供页面展示。
   */
  'POST /archives/import': ({ body }) => {
    const count = Number(body?.count) || 0
    if (count <= 0) return fail('未解析到有效数据，请检查上传文件')
    if (count > 500) return fail('单次最多导入 500 条，请分批上传')

    const names = ['王秀英', '李建国', '张桂英', '刘志强', '陈玉兰', '杨淑珍', '赵文博', '黄晓峰']
    const imported = []
    for (let i = 0; i < count; i += 1) {
      const year = new Date().getFullYear() - (65 + ((i * 7) % 30))
      const idCard = `110108${year}${String((i % 12) + 1).padStart(2, '0')}${String((i % 28) + 1).padStart(2, '0')}${String(100 + i).padStart(3, '0')}`
      // 已存在的身份证号计入失败明细，模拟真实导入的重复校验
      if (archives.some((item) => item.idCard === idCard)) continue
      const community = COMMUNITY_LIST[i % COMMUNITY_LIST.length]
      imported.push({
        id: nextId() + i,
        name: names[i % names.length],
        gender: i % 2 === 0 ? '男' : '女',
        idCard,
        age: new Date().getFullYear() - year,
        birthDate: `${year}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        phone: `138${String(10000000 + i * 137).slice(0, 8)}`,
        districtId: community.id,
        districtName: community.fullName,
        address: `${community.fullName}${(i % 30) + 1}号楼`,
        healthStatus: '健康',
        diseases: [],
        careLevel: '自理',
        disability: '无',
        guardian: '待补充',
        guardianPhone: '',
        guardianRelation: '子女',
        subsidyType: '无',
        createTime: now(),
        updateTime: now(),
      })
    }
    archives.unshift(...imported)
    return ok(
      { successCount: imported.length, failCount: count - imported.length, list: imported.slice(0, 10) },
      `成功导入 ${imported.length} 条档案`,
    )
  },

  /* ------------------------------ 公共字典 ------------------------------ */

  // 社区列表（录入表单下拉选择用）
  'GET /archives/communities': () => ok(COMMUNITY_LIST),

  // 导入模板下载地址（前端直接生成 CSV，此处返回文件名供页面提示）
  'GET /archives/template': () => ok({ fileName: '老人档案导入模板.csv' }),
}
