<script setup>
/**
 * 后台管理布局
 * 经典三段式：左侧菜单 + 顶部导航 + 右侧内容区（<router-view>）
 */
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
</script>

<template>
  <div class="layout">
    <Sidebar />

    <div class="layout__main">
      <Navbar />

      <main class="layout__content">
        <router-view v-slot="{ Component }">
          <!-- 路由切换淡入淡出；mode=out-in 避免前后两个页面重叠 -->
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: var(--app-bg-page);
}

.layout__main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0; /* 关键：允许内部表格横向滚动而不撑破布局 */
}

.layout__content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 路由切换动效 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
