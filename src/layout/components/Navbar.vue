<script setup>
/**
 * 顶部导航栏
 * 包含：折叠按钮、面包屑、全屏、主题切换、用户下拉菜单
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import Breadcrumb from './Breadcrumb.vue'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const collapsed = computed(() => appStore.sidebarCollapsed)
const isDark = computed(() => appStore.isDark)

/* ------------------------------ 全屏 ------------------------------ */
const isFullscreen = ref(false)

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
    isFullscreen.value = false
  } else {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  }
}

/* ------------------------------ 主题 ------------------------------ */
function handleToggleTheme() {
  appStore.toggleTheme()
}

/* ------------------------------ 用户操作 ------------------------------ */
async function handleCommand(command) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '退出提示', {
        confirmButtonText: '确定退出',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      return // 用户取消
    }
    await userStore.logout()
    ElMessage.success('已安全退出')
    router.push('/login')
  }
}
</script>

<template>
  <header class="navbar">
    <!-- 左侧：折叠按钮 + 面包屑 -->
    <div class="navbar__left">
      <el-icon class="navbar__collapse" @click="appStore.toggleSidebar()">
        <Fold v-if="!collapsed" />
        <Expand v-else />
      </el-icon>
      <Breadcrumb />
    </div>

    <!-- 右侧：功能按钮 + 用户信息 -->
    <div class="navbar__right">
      <!-- 主题切换 -->
      <el-tooltip :content="isDark ? '切换到亮色模式' : '切换到暗黑模式'" placement="bottom">
        <el-icon class="navbar__action" @click="handleToggleTheme">
          <Moon v-if="isDark" />
          <Sunny v-else />
        </el-icon>
      </el-tooltip>

      <!-- 全屏 -->
      <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏显示'" placement="bottom">
        <el-icon class="navbar__action" @click="toggleFullscreen">
          <Aim v-if="isFullscreen" />
          <FullScreen v-else />
        </el-icon>
      </el-tooltip>

      <el-divider direction="vertical" />

      <!-- 用户下拉 -->
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="navbar__user">
          <el-avatar :size="30" :src="userStore.avatar" class="navbar__avatar">
            {{ userStore.name.slice(0, 1) }}
          </el-avatar>
          <div class="navbar__user-meta">
            <span class="navbar__user-name">{{ userStore.name }}</span>
            <span class="navbar__user-role">{{ userStore.roleName }}</span>
          </div>
          <el-icon class="navbar__user-arrow"><ArrowDown /></el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled>
              <el-icon><UserFilled /></el-icon>
              当前角色：{{ userStore.roleName }}
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $navbar-height;
  padding: 0 16px;
  flex-shrink: 0;
  background-color: var(--app-bg-navbar);
  border-bottom: 1px solid var(--app-border-light);
  transition: background-color 0.25s ease, border-color 0.25s ease;
}

.navbar__left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.navbar__collapse {
  font-size: 19px;
  color: var(--app-text-regular);
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: var(--app-primary);
  }
}

.navbar__right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.navbar__action {
  padding: 7px;
  font-size: 17px;
  color: var(--app-text-regular);
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--app-primary);
    background-color: var(--app-bg-hover);
  }
}

.navbar__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: $radius-sm;
  cursor: pointer;
  outline: none;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--app-bg-hover);
  }
}

.navbar__avatar {
  background-color: var(--app-primary);
  color: #fff;
  font-size: 13px;
  flex-shrink: 0;
}

.navbar__user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.25;

  /* 窄屏下隐藏文字，只保留头像 */
  @media (max-width: 1200px) {
    display: none;
  }
}

.navbar__user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-primary);
}

.navbar__user-role {
  font-size: 11px;
  color: var(--app-text-secondary);
}

.navbar__user-arrow {
  font-size: 12px;
  color: var(--app-text-secondary);
}
</style>
