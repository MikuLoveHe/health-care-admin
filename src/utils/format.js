/**
 * 通用格式化工具函数
 */

/** 补零：pad(3) -> '03' */
export function pad(n, len = 2) {
  return String(n).padStart(len, '0')
}

/**
 * 格式化日期
 * @param {Date|string|number} value 时间
 * @param {string} pattern 形如 'YYYY-MM-DD HH:mm:ss'
 */
export function formatDate(value, pattern = 'YYYY-MM-DD HH:mm:ss') {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const map = {
    YYYY: date.getFullYear(),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  }
  return pattern.replace(/YYYY|MM|DD|HH|mm|ss/g, (key) => map[key])
}

/** 金额格式化：1280 -> '¥1,280.00' */
export function formatMoney(value, symbol = '¥') {
  if (value === null || value === undefined || value === '') return `${symbol}0.00`
  const num = Number(value)
  if (Number.isNaN(num)) return `${symbol}0.00`
  return symbol + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 手机号脱敏：13812345678 -> '138****5678' */
export function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone || ''
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}

/** 身份证脱敏：110101195001011234 -> '110101********1234' */
export function maskIdCard(idCard) {
  if (!idCard || idCard.length < 10) return idCard || ''
  return idCard.slice(0, 6) + '********' + idCard.slice(-4)
}

/** 根据身份证号计算年龄 */
export function calcAgeByIdCard(idCard) {
  if (!idCard || idCard.length !== 18) return 0
  const year = Number(idCard.slice(6, 10))
  const month = Number(idCard.slice(10, 12))
  const day = Number(idCard.slice(12, 14))
  const today = new Date()
  let age = today.getFullYear() - year
  // 生日未到则减一岁
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age -= 1
  }
  return age
}

/** 金额汇总，保留两位小数，避免浮点误差 */
export function sumMoney(list, key) {
  return Number(list.reduce((total, item) => total + Number(item[key] || 0), 0).toFixed(2))
}

/** 深拷贝（数据均为纯 JSON，用结构化克隆足够） */
export function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

/** 生成唯一 ID */
export function uid(prefix = 'ID') {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`
}
