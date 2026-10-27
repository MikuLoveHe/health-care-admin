/**
 * 全局业务字典
 *
 * 各页面的下拉选项、筛选条件统一从这里取，避免同一个状态在不同页面写得不一样。
 * 状态值与 Mock 数据中的取值必须保持一致。
 */

/** 服务分类 */
export const SERVICE_CATEGORIES = ['助餐服务', '助浴服务', '助医服务', '助洁服务', '助行服务', '助娱服务']

/** 上架状态 */
export const SHELF_STATUS = ['已上架', '已下架']

/** 广告位 */
export const AD_POSITIONS = ['首页轮播位', '首页弹窗位', '侧边栏广告位']

/** 广告投放状态 */
export const AD_STATUS = ['投放中', '待投放', '已下架']

/** 用户状态 */
export const USER_STATUS = ['正常', '已禁用']

/** 性别 */
export const GENDERS = ['男', '女']

/** 志愿者资质状态 */
export const QUALIFICATION_STATUS = ['待审核', '已通过', '已驳回', '已过期']

/** 志愿者技能标签 */
export const VOLUNTEER_SKILLS = [
  '医疗护理',
  '心理疏导',
  '家政服务',
  '文体活动',
  '法律咨询',
  '助餐配送',
  '康复理疗',
]

/** 订单状态（按业务流程顺序排列） */
export const ORDER_STATUS = ['待支付', '待接单', '服务中', '已完成', '已取消']

/** 支付方式 */
export const PAY_METHODS = ['微信支付', '支付宝', '余额支付']

/** 健康情况 */
export const HEALTH_STATUS = ['健康', '慢性病', '半失能', '失能']

/** 常见慢病 */
export const DISEASES = ['高血压', '糖尿病', '冠心病', '关节炎', '白内障', '阿尔茨海默症']

/** 残疾情况 */
export const DISABILITIES = ['无', '肢体残疾', '视力残疾', '听力残疾']

/** 护理等级 */
export const CARE_LEVELS = ['自理', '二级护理', '一级护理']

/** 补贴类型 */
export const SUBSIDY_TYPES = ['无', '高龄津贴', '低保补贴', '失能护理补贴']

/** 与老人关系 */
export const RELATIONS = ['子女', '配偶', '亲属', '社区工作人员']

/** 报表周期 */
export const REPORT_PERIODS = [
  { label: '按周统计', value: 'week' },
  { label: '按月统计', value: 'month' },
  { label: '按季度统计', value: 'year' },
]

/** 年龄区间快捷选项（档案筛选用） */
export const AGE_RANGES = [
  { label: '65-70 岁', value: [65, 70] },
  { label: '71-80 岁', value: [71, 80] },
  { label: '81-90 岁', value: [81, 90] },
  { label: '90 岁以上', value: [91, 120] },
]

/** 分页可选项 */
export const PAGE_SIZES = [10, 20, 50, 100]
