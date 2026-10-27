/**
 * Mock 层公共工具
 */

/** 固定种子的伪随机数，保证每次刷新页面得到的 Mock 数据一致，便于演示与截图 */
let seed = 20240926
export function resetSeed(value = 20240926) {
  seed = value
}
function random() {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

export function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min
}

export function pick(list) {
  return list[randomInt(0, list.length - 1)]
}

export function pickSome(list, count) {
  const pool = [...list]
  const result = []
  for (let i = 0; i < count && pool.length; i += 1) {
    result.push(...pool.splice(randomInt(0, pool.length - 1), 1))
  }
  return result
}

/** 按天数偏移生成时间字符串 */
export function daysAgo(days, withTime = true) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const pad = (n) => String(n).padStart(2, '0')
  const d = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  if (!withTime) return d
  return `${d} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/**
 * 生成内联 SVG 占位图（data URI）。
 * 用内联 SVG 而不是外链图片，是为了保证断网环境下演示也不会有图片裂图。
 */
export function placeholderImage(text, color = '#2BA88F', width = 480, height = 320) {
  const fontSize = Math.round(Math.min(width, height) / 8)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${color}" stop-opacity="0.95"/>` +
    `<stop offset="100%" stop-color="${color}" stop-opacity="0.65"/>` +
    `</linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#g)"/>` +
    `<text x="50%" y="50%" font-size="${fontSize}" fill="#ffffff" text-anchor="middle" ` +
    `dominant-baseline="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif">${text}</text>` +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** 通用分页 */
export function paginate(list, query = {}) {
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const start = (page - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize,
  }
}

/** 关键字模糊匹配（忽略大小写，任一字段命中即可） */
export function keywordMatch(item, keyword, fields) {
  if (!keyword) return true
  const kw = String(keyword).toLowerCase()
  return fields.some((field) => String(item[field] ?? '').toLowerCase().includes(kw))
}

/** 时间区间匹配，range 形如 ['2026-01-01', '2026-01-31'] */
export function inDateRange(value, range) {
  if (!range || !range.length || !range[0] || !range[1]) return true
  const time = new Date(value).getTime()
  const start = new Date(`${range[0]} 00:00:00`).getTime()
  const end = new Date(`${range[1]} 23:59:59`).getTime()
  return time >= start && time <= end
}

/** 延迟，模拟真实网络耗时，让 loading 动效可见 */
export function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
