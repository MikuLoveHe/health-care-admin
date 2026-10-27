<script setup>
/**
 * 登录页
 * 实现账号密码校验：前端先做必填与长度校验，再调用 Mock 接口核对账号密码。
 */
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()

const formRef = ref(null)
const loading = ref(false)
const isDark = ref(appStore.isDark)

const form = reactive({
  username: '',
  password: '',
  remember: true,
})

/** 表单校验规则 */
const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '账号长度为 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为 6 到 20 个字符', trigger: 'blur' },
  ],
}

/** 提交登录 */
async function handleLogin() {
  if (!formRef.value) return

  // 先过前端校验，不通过直接返回
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login({ username: form.username, password: form.password })
    ElMessage.success('登录成功，欢迎回来')
    // 有 redirect 参数则跳回原页面，否则进首页
    router.push(route.query.redirect || '/')
  } catch {
    // 错误提示已由 axios 响应拦截器统一处理，这里无需重复提示
  } finally {
    loading.value = false
  }
}

/** 一键填充演示账号，方便演示与老师查看 */
function fillDemoAccount() {
  form.username = 'admin'
  form.password = '123456'
  ElMessage.info('已填入演示账号，点击登录即可')
}

function toggleTheme() {
  appStore.toggleTheme()
  isDark.value = appStore.isDark
}

onMounted(() => {
  // 每次进入登录页清空密码，避免浏览器自动填充带来的困扰
  form.password = ''
})
</script>

<template>
  <div class="login">
    <!-- 左侧品牌介绍区 -->
    <div class="login__brand">
      <div class="login__brand-inner">
        <div class="login__logo">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l8.84 8.84 8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <h1 class="login__brand-title">健康颐养平台</h1>
        <p class="login__brand-subtitle">社区养老 · 智慧管理</p>

        <ul class="login__feature-list">
          <li>
            <el-icon><CircleCheckFilled /></el-icon>
            服务与广告统一上架管理
          </li>
          <li>
            <el-icon><CircleCheckFilled /></el-icon>
            志愿者资质全流程审核
          </li>
          <li>
            <el-icon><CircleCheckFilled /></el-icon>
            辖区老人档案数字化归档
          </li>
          <li>
            <el-icon><CircleCheckFilled /></el-icon>
            业务数据可视化监控
          </li>
        </ul>
      </div>
    </div>

    <!-- 右侧登录表单区 -->
    <div class="login__panel">
      <div class="login__theme-toggle" @click="toggleTheme">
        <el-icon>
          <Moon v-if="isDark" />
          <Sunny v-else />
        </el-icon>
      </div>

      <div class="login__form-wrap">
        <h2 class="login__title">管理端登录</h2>
        <p class="login__desc">请输入管理员账号密码</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          size="large"
          class="login__form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="请输入账号" clearable>
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
              clearable
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <div class="login__options">
            <el-checkbox v-model="form.remember">记住我</el-checkbox>
            <el-button link type="primary" @click="fillDemoAccount">填入演示账号</el-button>
          </div>

          <el-button type="primary" :loading="loading" class="login__submit" @click="handleLogin">
            {{ loading ? '登录中…' : '登 录' }}
          </el-button>
        </el-form>

        <div class="login__tip">
          <el-icon><InfoFilled /></el-icon>
          演示账号：admin　密码：123456
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.login {
  display: flex;
  height: 100vh;
  background-color: var(--app-bg-page);
}

/* ------------------------------ 左侧品牌区 ------------------------------ */
.login__brand {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1.15;
  padding: 40px;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(140deg, #1f8a74 0%, #2ba88f 45%, #3fb6a0 100%);

  /* 装饰性光斑，让整块渐变不显得单调 */
  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
  }

  &::before {
    width: 420px;
    height: 420px;
    top: -140px;
    right: -120px;
  }

  &::after {
    width: 300px;
    height: 300px;
    bottom: -100px;
    left: -80px;
  }

  @media (max-width: 900px) {
    display: none;
  }
}

.login__brand-inner {
  position: relative;
  z-index: 1;
  max-width: 380px;
  width: 100%;
}

.login__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 24px;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(4px);
}

.login__brand-title {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: 2px;
}

.login__brand-subtitle {
  margin-top: 8px;
  font-size: 14px;
  letter-spacing: 4px;
  opacity: 0.85;
}

.login__feature-list {
  margin-top: 40px;

  li {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 16px;
    font-size: 14px;
    opacity: 0.92;

    .el-icon {
      font-size: 16px;
      opacity: 0.9;
    }
  }
}

/* ------------------------------ 右侧表单区 ------------------------------ */
.login__panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px 24px;
  background-color: var(--app-bg-card);
  transition: background-color 0.25s ease;
}

.login__theme-toggle {
  position: absolute;
  top: 24px;
  right: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 18px;
  color: var(--app-text-secondary);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--app-primary);
    background-color: var(--app-bg-hover);
  }
}

.login__form-wrap {
  width: 100%;
  max-width: 340px;
}

.login__title {
  font-size: 24px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.login__desc {
  margin-top: 6px;
  margin-bottom: 28px;
  font-size: 13px;
  color: var(--app-text-secondary);
}

.login__form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-input__wrapper) {
    border-radius: $radius-sm;
  }
}

.login__options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.login__submit {
  width: 100%;
  height: 44px;
  font-size: 15px;
  letter-spacing: 4px;
  border-radius: $radius-sm;
}

.login__tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 22px;
  padding: 10px;
  font-size: 12px;
  color: var(--app-text-secondary);
  background-color: var(--app-bg-hover);
  border-radius: $radius-sm;
}
</style>
