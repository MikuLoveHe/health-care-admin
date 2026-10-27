/**
 * 登录与用户信息相关 Mock 接口
 */
import { fail, ok } from '../index'
import { placeholderImage } from '../helper'

/** 平台管理员账号（演示用） */
const ADMIN = {
  id: 1,
  username: 'admin',
  password: '123456',
  name: '平台管理员',
  role: 'admin',
  roleName: '超级管理员',
  avatar: placeholderImage('管', '#2BA88F', 120, 120),
  phone: '13800000000',
  email: 'admin@healthcare.com',
  lastLoginTime: '2026-09-25 09:12:33',
}

export default {
  // 登录：校验账号密码
  'POST /login': ({ body }) => {
    const { username, password } = body
    if (!username || !password) {
      return fail('请输入账号和密码')
    }
    if (username !== ADMIN.username || password !== ADMIN.password) {
      return fail('账号或密码错误')
    }
    const { password: _ignored, ...safeUser } = ADMIN
    return ok({
      token: `mock-token-${Date.now()}`,
      user: safeUser,
    })
  },

  // 退出登录
  'POST /logout': () => ok(null, '已退出登录'),

  // 获取当前登录用户信息（用于刷新页面后恢复登录态）
  'GET /user/info': () => {
    const { password: _ignored, ...safeUser } = ADMIN
    return ok(safeUser)
  },
}
