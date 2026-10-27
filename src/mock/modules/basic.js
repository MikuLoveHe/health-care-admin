/**
 * 基础管理模块 Mock 接口
 * 覆盖：服务管理、广告管理、用户管理、辖区范围管理
 */
import { fail, ok } from '../index'
import { ads, DISTRICT_FLAT, DISTRICT_TREE, services, users } from '../db'
import { inDateRange, keywordMatch, paginate, placeholderImage } from '../helper'

/** 自增 ID 生成器，保证新增数据不与既有数据冲突 */
function nextId(list) {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

/** 递归查找并删除树节点 */
function removeTreeNode(nodes, id) {
  for (let i = 0; i < nodes.length; i += 1) {
    if (nodes[i].id === id) {
      nodes.splice(i, 1)
      return true
    }
    if (nodes[i].children && removeTreeNode(nodes[i].children, id)) return true
  }
  return false
}

/** 递归查找树节点 */
function findTreeNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findTreeNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

export default {
  /* ------------------------------ 服务管理 ------------------------------ */

  // 服务列表：支持关键字、分类、状态筛选与分页
  'GET /services': ({ query }) => {
    const { keyword, category, status, page, pageSize } = query
    const filtered = services.filter(
      (item) =>
        keywordMatch(item, keyword, ['name', 'provider', 'description']) &&
        (!category || item.category === category) &&
        (!status || item.status === status),
    )
    return ok(paginate(filtered, { page, pageSize }))
  },

  // 服务详情
  'GET /services/:id': ({ params }) => {
    const item = services.find((service) => service.id === Number(params.id))
    return item ? ok(item) : fail('服务不存在', 404)
  },

  // 新增服务
  'POST /services': ({ body }) => {
    const item = {
      ...body,
      id: nextId(services),
      sales: 0,
      rating: 5.0,
      // 未上传封面时用内联 SVG 占位，保证列表不出现裂图
      cover: body.cover || placeholderImage(body.category?.slice(0, 2) || '服务', '#2BA88F'),
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    }
    services.unshift(item)
    return ok(item, '新增成功')
  },

  // 编辑服务
  'PUT /services/:id': ({ params, body }) => {
    const index = services.findIndex((service) => service.id === Number(params.id))
    if (index === -1) return fail('服务不存在', 404)
    services[index] = { ...services[index], ...body, id: services[index].id }
    return ok(services[index], '保存成功')
  },

  // 删除服务
  'DELETE /services/:id': ({ params }) => {
    const index = services.findIndex((service) => service.id === Number(params.id))
    if (index === -1) return fail('服务不存在', 404)
    services.splice(index, 1)
    return ok(null, '删除成功')
  },

  // 上下架状态切换
  'PATCH /services/:id/status': ({ params, body }) => {
    const item = services.find((service) => service.id === Number(params.id))
    if (!item) return fail('服务不存在', 404)
    item.status = body.status
    return ok(item, body.status === '已上架' ? '上架成功' : '下架成功')
  },

  /* ------------------------------ 广告管理 ------------------------------ */

  // 广告列表：支持关键字、广告位、状态筛选与投放时间范围筛选
  'GET /ads': ({ query }) => {
    const { keyword, position, status, dateRange, page, pageSize } = query
    const filtered = ads.filter(
      (item) =>
        keywordMatch(item, keyword, ['title', 'position']) &&
        (!position || item.position === position) &&
        (!status || item.status === status) &&
        inDateRange(item.startTime, dateRange),
    )
    return ok(paginate(filtered, { page, pageSize }))
  },

  // 新增广告
  'POST /ads': ({ body }) => {
    const item = {
      ...body,
      id: nextId(ads),
      clickCount: 0,
      image: body.image || placeholderImage(body.title?.slice(0, 4) || '广告', '#F5A623', 640, 300),
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    }
    ads.unshift(item)
    return ok(item, '新增成功')
  },

  // 编辑广告
  'PUT /ads/:id': ({ params, body }) => {
    const index = ads.findIndex((ad) => ad.id === Number(params.id))
    if (index === -1) return fail('广告不存在', 404)
    ads[index] = { ...ads[index], ...body, id: ads[index].id }
    return ok(ads[index], '保存成功')
  },

  // 删除广告
  'DELETE /ads/:id': ({ params }) => {
    const index = ads.findIndex((ad) => ad.id === Number(params.id))
    if (index === -1) return fail('广告不存在', 404)
    ads.splice(index, 1)
    return ok(null, '删除成功')
  },

  // 广告上下架
  'PATCH /ads/:id/status': ({ params, body }) => {
    const item = ads.find((ad) => ad.id === Number(params.id))
    if (!item) return fail('广告不存在', 404)
    item.status = body.status
    return ok(item, body.status === '投放中' ? '已开始投放' : '已停止投放')
  },

  /* ------------------------------ 用户管理 ------------------------------ */

  // 用户列表：支持关键字、状态、辖区筛选
  'GET /users': ({ query }) => {
    const { keyword, status, districtId, page, pageSize } = query
    const filtered = users.filter(
      (item) =>
        keywordMatch(item, keyword, ['name', 'phone', 'idCard', 'address']) &&
        (!status || item.status === status) &&
        (!districtId || item.districtId === Number(districtId)),
    )
    return ok(paginate(filtered, { page, pageSize }))
  },

  // 用户详情
  'GET /users/:id': ({ params }) => {
    const item = users.find((user) => user.id === Number(params.id))
    return item ? ok(item) : fail('用户不存在', 404)
  },

  // 编辑用户
  'PUT /users/:id': ({ params, body }) => {
    const index = users.findIndex((user) => user.id === Number(params.id))
    if (index === -1) return fail('用户不存在', 404)
    users[index] = { ...users[index], ...body, id: users[index].id }
    return ok(users[index], '保存成功')
  },

  // 禁用 / 启用用户
  'PATCH /users/:id/status': ({ params, body }) => {
    const item = users.find((user) => user.id === Number(params.id))
    if (!item) return fail('用户不存在', 404)
    item.status = body.status
    return ok(item, body.status === '正常' ? '已启用该用户' : '已禁用该用户')
  },

  /* ------------------------------ 辖区范围管理 ------------------------------ */

  // 辖区树形结构
  'GET /districts/tree': () => ok(DISTRICT_TREE),

  // 辖区平铺列表（下拉选择用）
  'GET /districts': () => ok(DISTRICT_FLAT),

  // 新增辖区节点
  'POST /districts': ({ body }) => {
    const { parentId, name } = body
    const node = { id: nextId(DISTRICT_FLAT.map((item) => ({ id: item.id }))), name }
    if (!parentId) {
      DISTRICT_TREE.push({ ...node, children: [] })
    } else {
      const parent = findTreeNode(DISTRICT_TREE, Number(parentId))
      if (!parent) return fail('上级辖区不存在', 404)
      if (!parent.children) parent.children = []
      parent.children.push({ ...node, children: [] })
    }
    // 同步更新平铺数据，保证下拉选择即时可见
    const parentNode = DISTRICT_FLAT.find((item) => item.id === Number(parentId))
    DISTRICT_FLAT.push({
      id: node.id,
      name,
      parentId: Number(parentId) || 0,
      level: parentNode ? parentNode.level + 1 : 1,
      fullName: parentNode ? `${parentNode.fullName} / ${name}` : name,
    })
    return ok(node, '新增成功')
  },

  // 重命名辖区节点
  'PUT /districts/:id': ({ params, body }) => {
    const node = findTreeNode(DISTRICT_TREE, Number(params.id))
    if (!node) return fail('辖区不存在', 404)
    node.name = body.name
    const flat = DISTRICT_FLAT.find((item) => item.id === Number(params.id))
    if (flat) {
      flat.name = body.name
      if (flat.level === 1) flat.fullName = body.name
    }
    return ok(node, '保存成功')
  },

  // 删除辖区节点（同时移除其所有下级）
  'DELETE /districts/:id': ({ params }) => {
    const id = Number(params.id)
    if (!removeTreeNode(DISTRICT_TREE, id)) return fail('辖区不存在', 404)
    // 平铺数据中一并清理该节点及其后代
    const target = DISTRICT_FLAT.find((item) => item.id === id)
    if (target) {
      const prefix = `${target.fullName}`
      for (let i = DISTRICT_FLAT.length - 1; i >= 0; i -= 1) {
        const item = DISTRICT_FLAT[i]
        if (item.id === id || item.fullName.startsWith(prefix)) DISTRICT_FLAT.splice(i, 1)
      }
    }
    return ok(null, '删除成功')
  },
}
