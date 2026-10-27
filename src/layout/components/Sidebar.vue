<script setup>
/**
 * 侧边栏
 * 菜单结构完全由路由表生成，与 router/routes.js 保持单一数据源。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { asyncRoutes } from '@/router/routes'
import { useAppStore } from '@/stores/app'
import SidebarItem from './SidebarItem.vue'

const route = useRoute()
const appStore = useAppStore()

const collapsed = computed(() => appStore.sidebarCollapsed)

/**
 * 顶层菜单：去掉 path 为 '/' 的首页（首页单独放在最上方），
 * 并过滤 hidden 项。
 */
const menuList = computed(() =>
  asyncRoutes
    .filter((item) => item.path !== '/' && !item.meta?.hidden)
    .map((item) => ({
      ...item,
      // 顶层模块的 basePath 即自身 path
      basePath: item.path,
    })),
)

/** 当前激活的菜单项，详情页通过 meta.activeMenu 指回列表页 */
const activeMenu = computed(() => route.meta?.activeMenu || route.path)

/** 侧边栏背景色跟随主题（亮色白底 / 暗色深底） */
const sidebarStyle = computed(() => ({
  width: collapsed.value ? '64px' : '220px',
}))
</script>

<template>
  <aside class="sidebar" :style="sidebarStyle">
    <!-- 品牌区 -->
    <div class="sidebar__logo">
      <div class="sidebar__logo-mark">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l8.84 8.84 8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
      <transition name="fade">
        <span v-show="!collapsed" class="sidebar__logo-text">健康颐养平台</span>
      </transition>
    </div>

    <!-- 菜单区 -->
    <el-scrollbar class="sidebar__scroll">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        unique-opened
        router
        class="sidebar__menu"
      >
        <!-- 首页固定在第一项 -->
        <el-menu-item index="/dashboard" class="sidebar-item">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页概览</template>
        </el-menu-item>

        <SidebarItem
          v-for="item in menuList"
          :key="item.path"
          :item="item"
          :base-path="item.path"
        />
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--app-bg-sidebar);
  border-right: 1px solid var(--app-border-light);
  transition: width 0.25s ease, background-color 0.25s ease;
  overflow: hidden;
}

.sidebar__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  height: $navbar-height;
  padding: 0 16px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--app-border-light);
  overflow: hidden;
  white-space: nowrap;
}

.sidebar__logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: $radius-sm;
  color: #fff;
  background: linear-gradient(135deg, var(--app-primary), var(--app-primary-light));
}

.sidebar__logo-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.sidebar__scroll {
  flex: 1;
  min-height: 0;
}

.sidebar__menu {
  border-right: none;
  background-color: transparent;
  padding: 8px;

  /* 折叠态下收紧内边距，让图标居中 */
  &:not(.el-menu--collapse) {
    width: 100%;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
/**
 * 菜单配色需要穿透到 Element Plus 内部结构，因此放在非 scoped 样式中，
 * 通过 .sidebar 作用域限定，不会影响页面其他区域的菜单。
 */
.sidebar {
  .el-menu-item,
  .el-sub-menu__title {
    height: 44px;
    line-height: 44px;
    margin-bottom: 4px;
    border-radius: 6px;
    color: var(--app-menu-text);
    background-color: transparent;

    &:hover {
      background-color: var(--app-menu-hover-bg);
      color: var(--app-menu-active-text);
    }

    .el-icon {
      color: inherit;
      font-size: 17px;
    }
  }

  /* 激活项：主色文字 + 浅主色底 */
  .el-menu-item.is-active {
    color: var(--app-menu-active-text);
    background-color: var(--app-menu-active-bg);
    font-weight: 600;
  }

  /* 展开的子菜单标题也跟随主题色 */
  .el-sub-menu.is-active > .el-sub-menu__title {
    color: var(--app-menu-active-text);
  }

  /* 子菜单项缩进后字号略小，层次更清晰 */
  .el-menu--inline .el-menu-item {
    font-size: 13px;
    min-width: auto;
  }
}
</style>
