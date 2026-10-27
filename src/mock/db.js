/**
 * Mock 数据库
 *
 * 所有业务数据集中在此处生成并保存在内存中，增删改查直接操作这些数组。
 * 组件内通过 @/api 下的接口函数访问，接口内部再经 axios -> mockAdapter 转发到这里，
 * 因此业务代码的写法与调用真实后端完全一致。
 */
import { daysAgo, pick, pickSome, placeholderImage, randomInt } from './helper'

/* ============================== 基础字典 ============================== */

export const SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴',
  '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗',
]
export const GIVEN_NAMES = [
  '秀英', '伟', '芳', '敏', '静', '丽', '强', '磊', '洋', '艳',
  '勇', '军', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平',
  '刚', '桂英', '建国', '志强', '玉兰', '建华', '淑珍', '文博', '晓峰', '雪梅',
]

/** 服务分类 */
export const SERVICE_CATEGORIES = ['助餐服务', '助浴服务', '助医服务', '助洁服务', '助行服务', '助娱服务']

/** 订单状态流转：待支付 -> 待接单 -> 服务中 -> 已完成 / 已取消 */
export const ORDER_STATUS = ['待支付', '待接单', '服务中', '已完成', '已取消']

/** 志愿者资质状态 */
export const QUALIFICATION_STATUS = ['待审核', '已通过', '已驳回', '已过期']

/** 健康情况 */
export const HEALTH_STATUS = ['健康', '慢性病', '半失能', '失能']

/** 辖区树（三级：区 - 街道 - 社区） */
export const DISTRICT_TREE = [
  {
    id: 1,
    name: '海淀区',
    children: [
      {
        id: 11,
        name: '中关村街道',
        children: [
          { id: 111, name: '科育社区' },
          { id: 112, name: '航天社区' },
        ],
      },
      {
        id: 12,
        name: '学院路街道',
        children: [
          { id: 121, name: '二里庄社区' },
          { id: 122, name: '六道口社区' },
        ],
      },
      {
        id: 13,
        name: '万寿路街道',
        children: [{ id: 131, name: '万寿路社区' }],
      },
    ],
  },
  {
    id: 2,
    name: '朝阳区',
    children: [
      {
        id: 21,
        name: '望京街道',
        children: [
          { id: 211, name: '花家地社区' },
          { id: 212, name: '望京西园社区' },
        ],
      },
      {
        id: 22,
        name: '劲松街道',
        children: [{ id: 221, name: '劲松北社区' }],
      },
      {
        id: 23,
        name: '三里屯街道',
        children: [{ id: 231, name: '幸福村社区' }],
      },
    ],
  },
  {
    id: 3,
    name: '西城区',
    children: [
      {
        id: 31,
        name: '金融街街道',
        children: [{ id: 311, name: '丰汇园社区' }],
      },
      {
        id: 32,
        name: '月坛街道',
        children: [{ id: 321, name: '月坛社区' }],
      },
    ],
  },
  {
    id: 4,
    name: '东城区',
    children: [
      {
        id: 41,
        name: '东华门街道',
        children: [{ id: 411, name: '南池子社区' }],
      },
    ],
  },
]

/** 摊平辖区，便于按 id 快速取名称、做下拉选择 */
export const DISTRICT_FLAT = (() => {
  const result = []
  const walk = (nodes, parent) => {
    nodes.forEach((node) => {
      const item = {
        id: node.id,
        name: node.name,
        parentId: parent ? parent.id : 0,
        level: parent ? parent.level + 1 : 1,
        fullName: parent ? `${parent.fullName} / ${node.name}` : node.name,
      }
      result.push(item)
      if (node.children) walk(node.children, item)
    })
  }
  walk(DISTRICT_TREE, null)
  return result
})()

/** 只取第三级（社区），档案与用户归属到社区这一层 */
export const COMMUNITY_LIST = DISTRICT_FLAT.filter((item) => item.level === 3)

export function districtName(id) {
  return DISTRICT_FLAT.find((item) => item.id === id)?.fullName || '—'
}

function randomName() {
  return pick(SURNAMES) + pick(GIVEN_NAMES)
}

function randomPhone() {
  const prefix = pick(['138', '139', '136', '150', '158', '186', '188', '177'])
  return prefix + String(randomInt(10000000, 99999999))
}

/** 生成 18 位身份证号（含末位校验码，格式合法） */
function randomIdCard(birthYear) {
  const districtCode = pick(['110108', '110105', '110102', '110101', '110106'])
  const month = String(randomInt(1, 12)).padStart(2, '0')
  const day = String(randomInt(1, 28)).padStart(2, '0')
  const seq = String(randomInt(1, 999)).padStart(3, '0')
  const body = `${districtCode}${birthYear}${month}${day}${seq}`
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  const sum = body.split('').reduce((total, char, index) => total + Number(char) * weights[index], 0)
  return body + codes[sum % 11]
}

function currentYear() {
  return new Date().getFullYear()
}

/* ============================== 1. 用户 ============================== */

export const users = Array.from({ length: 48 }, (_, index) => {
  const birthYear = randomInt(currentYear() - 88, currentYear() - 60)
  const community = pick(COMMUNITY_LIST)
  const disabled = index % 11 === 0
  return {
    id: index + 1,
    name: randomName(),
    gender: pick(['男', '女']),
    age: currentYear() - birthYear,
    phone: randomPhone(),
    idCard: randomIdCard(birthYear),
    avatar: placeholderImage(randomName().slice(0, 1), '#7BC6B4', 120, 120),
    districtId: community.id,
    districtName: community.fullName,
    address: `${community.fullName}${randomInt(1, 30)}号楼${randomInt(1, 6)}单元${randomInt(101, 605)}室`,
    status: disabled ? '已禁用' : '正常',
    orderCount: randomInt(0, 46),
    registerTime: daysAgo(randomInt(1, 720)),
    lastLoginTime: daysAgo(randomInt(0, 30)),
  }
})

/* ============================== 2. 服务 ============================== */

const SERVICE_SEED = [
  ['长者营养午餐配送', '助餐服务', 25, 30],
  ['上门做饭服务', '助餐服务', 60, 90],
  ['社区老年食堂助餐', '助餐服务', 15, 20],
  ['上门助浴服务', '助浴服务', 120, 45],
  ['社区浴室陪同助浴', '助浴服务', 80, 60],
  ['陪同就医服务', '助医服务', 150, 120],
  ['上门健康监测', '助医服务', 50, 40],
  ['代取药品服务', '助医服务', 30, 35],
  ['居家保洁服务', '助洁服务', 90, 150],
  ['衣物清洗服务', '助洁服务', 40, 60],
  ['陪同出行服务', '助行服务', 100, 90],
  ['无障碍接送服务', '助行服务', 70, 75],
  ['社区文娱活动组织', '助娱服务', 0, 180],
  ['老年大学课程陪读', '助娱服务', 45, 90],
  ['康复训练指导', '助医服务', 160, 60],
  ['心理关怀陪聊', '助娱服务', 35, 50],
]

export const services = SERVICE_SEED.map(([name, category, price, duration], index) => ({
  id: index + 1,
  name,
  category,
  price,
  duration,
  unit: pick(['次', '小时', '次', '次']),
  cover: placeholderImage(category.slice(0, 2), pick(['#2BA88F', '#3FB6A0', '#F5A623', '#5B8FF9'])),
  description: `${name}，由平台认证服务人员上门提供，服务时长约 ${duration} 分钟，全程可追溯。`,
  provider: pick(['颐养社区服务中心', '康乐居家养老服务站', '安馨护理服务中心', '夕阳红助老服务队']),
  sales: randomInt(12, 860),
  rating: Number((randomInt(40, 50) / 10).toFixed(1)),
  status: index % 5 === 4 ? '已下架' : '已上架',
  createTime: daysAgo(randomInt(10, 500)),
}))

/* ============================== 3. 广告 ============================== */

const AD_SEED = [
  ['新春助老服务月钜惠', '首页轮播位'],
  ['免费健康体检进社区', '首页轮播位'],
  ['长者食堂新店开业', '首页弹窗位'],
  ['志愿者招募中', '首页轮播位'],
  ['适老化改造补贴申请', '侧边栏广告位'],
  ['老年大学春季招生', '首页轮播位'],
  ['家庭医生签约服务', '侧边栏广告位'],
  ['重阳节敬老活动', '首页弹窗位'],
]

export const ads = AD_SEED.map(([title, position], index) => ({
  id: index + 1,
  title,
  position,
  image: placeholderImage(title.slice(0, 4), pick(['#2BA88F', '#F5A623', '#5B8FF9', '#FF7875']), 640, 300),
  linkUrl: `https://example.com/activity/${index + 1}`,
  sort: index + 1,
  startTime: daysAgo(randomInt(30, 120), false),
  endTime: daysAgo(randomInt(-90, -10), false),
  status: index % 4 === 3 ? '已下架' : (index % 5 === 2 ? '待投放' : '投放中'),
  clickCount: randomInt(120, 9800),
  createTime: daysAgo(randomInt(20, 200)),
}))

/* ============================== 4. 志愿者 ============================== */

export const VOLUNTEER_SKILLS = ['医疗护理', '心理疏导', '家政服务', '文体活动', '法律咨询', '助餐配送', '康复理疗']

function buildVolunteer(index, status) {
  const name = randomName()
  const applyTime = daysAgo(randomInt(1, 300))
  return {
    id: index + 1,
    name,
    gender: pick(['男', '女']),
    age: randomInt(20, 62),
    phone: randomPhone(),
    avatar: placeholderImage(name.slice(0, 1), '#5B8FF9', 120, 120),
    community: pick(COMMUNITY_LIST),
    skills: pickSome(VOLUNTEER_SKILLS, randomInt(1, 3)),
    serviceHours: randomInt(0, 460),
    serviceCount: randomInt(0, 120),
    qualificationStatus: status,
    // 证件照：身份证正反面 + 资质证明
    certificates: [
      { name: '身份证正面', url: placeholderImage('身份证正面', '#5B8FF9', 480, 300), type: '身份证' },
      { name: '身份证反面', url: placeholderImage('身份证反面', '#5B8FF9', 480, 300), type: '身份证' },
      { name: '健康证', url: placeholderImage('健康证', '#2BA88F', 480, 300), type: '健康证' },
      { name: '护理技能证书', url: placeholderImage('护理技能证书', '#F5A623', 480, 300), type: '资质证书' },
    ],
    applyTime,
    auditTime: status === '待审核' ? '' : daysAgo(randomInt(0, 200)),
    auditRemark: status === '已驳回' ? pick(['健康证已过有效期，请重新提交', '资质证书照片模糊，无法辨认']) : '',
    // 审核记录，用于资质详情页的时间轴
    auditRecords: [
      { node: '提交申请', operator: name, time: applyTime, result: '待审核', remark: '志愿者通过用户端提交资质申请' },
      { node: '资料初审', operator: '平台管理员', time: daysAgo(randomInt(0, 180)), result: status === '待审核' ? '待审核' : '通过', remark: '核对身份信息与证件完整性' },
    ],
  }
}

export const volunteers = Array.from({ length: 26 }, (_, index) => {
  const status = pick(['已通过', '已通过', '已通过', '待审核', '已驳回', '已过期'])
  return buildVolunteer(index, status)
})

/** 待审核申请列表（志愿者申请审核页使用） */
export const volunteerApplications = volunteers.filter((item) => item.qualificationStatus === '待审核')

/* ============================== 5. 订单 ============================== */

export const orders = Array.from({ length: 72 }, (_, index) => {
  const service = pick(services)
  const user = pick(users)
  const status = pick(['已完成', '已完成', '已完成', '待接单', '服务中', '待支付', '已取消'])
  const orderTime = daysAgo(randomInt(0, 90))
  const quantity = randomInt(1, 3)
  const amount = Number((service.price * quantity).toFixed(2))
  const volunteer = pick(volunteers.filter((v) => v.qualificationStatus === '已通过'))

  return {
    id: index + 1,
    orderNo: `HL${daysAgo(randomInt(1, 90), false).replace(/-/g, '')}${String(index + 1).padStart(4, '0')}`,
    type: service.category,
    serviceId: service.id,
    serviceName: service.name,
    servicePrice: service.price,
    quantity,
    amount,
    status,
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    userAddress: user.address,
    districtName: user.districtName,
    volunteerId: status === '待支付' ? null : volunteer.id,
    volunteerName: status === '待支付' ? '' : volunteer.name,
    volunteerPhone: status === '待支付' ? '' : volunteer.phone,
    appointmentTime: daysAgo(randomInt(-7, 10)),
    orderTime,
    finishTime: status === '已完成' ? daysAgo(randomInt(0, 5)) : '',
    payMethod: pick(['微信支付', '支付宝', '余额支付']),
    remark: pick(['请提前电话联系', '老人行动不便，请上门服务', '无需备注', '需要带助行器', '']),
    // 状态流转记录，订单详情页时间轴使用
    statusFlow: [
      { node: '提交订单', time: orderTime, operator: user.name, remark: '用户端下单成功' },
      { node: '支付完成', time: orderTime, operator: user.name, remark: `通过${pick(['微信支付', '支付宝', '余额支付'])}支付 ¥${amount}` },
      { node: '平台派单', time: orderTime, operator: '系统', remark: '按辖区自动匹配志愿者' },
    ]
      .concat(status === '待支付' ? [] : [{ node: '志愿者接单', time: daysAgo(randomInt(0, 60)), operator: volunteer.name, remark: '已确认接单，将按约定时间上门' }])
      .concat(['已完成', '服务中'].includes(status) ? [{ node: '开始服务', time: daysAgo(randomInt(0, 30)), operator: volunteer.name, remark: '已到达服务地点，服务开始' }] : [])
      .concat(status === '已完成' ? [{ node: '服务完成', time: daysAgo(randomInt(0, 5)), operator: volunteer.name, remark: '服务已完成，等待用户评价' }] : [])
      .concat(status === '已取消' ? [{ node: '订单取消', time: daysAgo(randomInt(0, 20)), operator: user.name, remark: '用户主动取消订单，已原路退款' }] : []),
  }
})

/* ============================== 6. 档案 ============================== */

export const archives = Array.from({ length: 56 }, (_, index) => {
  const birthYear = randomInt(currentYear() - 95, currentYear() - 65)
  const community = pick(COMMUNITY_LIST)
  const health = pick(HEALTH_STATUS)
  return {
    id: index + 1,
    name: randomName(),
    gender: pick(['男', '女']),
    idCard: randomIdCard(birthYear),
    age: currentYear() - birthYear,
    birthDate: `${birthYear}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
    phone: randomPhone(),
    districtId: community.id,
    districtName: community.fullName,
    address: `${community.fullName}${randomInt(1, 30)}号楼${randomInt(1, 6)}单元${randomInt(101, 605)}室`,
    healthStatus: health,
    // 慢病标签
    diseases: health === '健康' ? [] : pickSome(['高血压', '糖尿病', '冠心病', '关节炎', '白内障', '阿尔茨海默症'], randomInt(1, 3)),
    careLevel: health === '失能' ? '一级护理' : health === '半失能' ? '二级护理' : '自理',
    disability: pick(['无', '无', '无', '肢体残疾', '视力残疾', '听力残疾']),
    guardian: randomName(),
    guardianPhone: randomPhone(),
    guardianRelation: pick(['子女', '配偶', '亲属', '社区工作人员']),
    subsidyType: pick(['无', '高龄津贴', '低保补贴', '失能护理补贴']),
    createTime: daysAgo(randomInt(1, 900)),
    updateTime: daysAgo(randomInt(0, 60)),
  }
})

/* ============================== 7. 业务监控 ============================== */

/** 近 7 天订单趋势 */
export const orderTrend = Array.from({ length: 7 }, (_, index) => {
  const day = daysAgo(6 - index, false)
  const created = randomInt(28, 96)
  return {
    date: day.slice(5),
    fullDate: day,
    created,
    finished: Math.round(created * (randomInt(70, 95) / 100)),
    cancelled: randomInt(1, 9),
  }
})

/** 近 12 个月订单趋势（业务报表用） */
export const monthlyTrend = Array.from({ length: 12 }, (_, index) => {
  const date = new Date()
  date.setMonth(date.getMonth() - (11 - index))
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const created = randomInt(620, 1680)
  return {
    month,
    created,
    finished: Math.round(created * (randomInt(78, 94) / 100)),
    amount: Number((created * randomInt(45, 130)).toFixed(2)),
    newUsers: randomInt(30, 160),
  }
})

/** 服务类型占比 */
export const categoryRatio = SERVICE_CATEGORIES.map((name) => ({
  name,
  value: randomInt(120, 860),
}))

/** 各辖区老人分布（柱状图） */
export const districtDistribution = DISTRICT_TREE.map((district) => ({
  name: district.name,
  archiveCount: randomInt(120, 980),
  userCount: randomInt(200, 1600),
  volunteerCount: randomInt(10, 120),
}))

/** 志愿者服务时长排行 */
export const volunteerRanking = [...volunteers]
  .filter((item) => item.qualificationStatus === '已通过')
  .sort((a, b) => b.serviceHours - a.serviceHours)
  .slice(0, 8)
  .map((item) => ({ name: item.name, hours: item.serviceHours, count: item.serviceCount }))

/** 关键指标卡片 */
export function overviewMetrics() {
  const finished = orders.filter((item) => item.status === '已完成')
  return {
    userTotal: users.length * 27, // 演示用放大系数，贴近真实平台量级
    orderTotal: orders.length * 19,
    volunteerTotal: volunteers.filter((item) => item.qualificationStatus === '已通过').length * 3,
    archiveTotal: archives.length * 11,
    todayOrder: orderTrend[orderTrend.length - 1].created,
    pendingAudit: volunteerApplications.length,
    finishedAmount: Number(finished.reduce((total, item) => total + item.amount, 0).toFixed(2)),
    // 环比增长
    userGrowth: 12.6,
    orderGrowth: 8.3,
    volunteerGrowth: -2.1,
    archiveGrowth: 5.4,
  }
}
