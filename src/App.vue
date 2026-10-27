<script setup>
/**
 * 应用根组件
 * 主题状态由 app store 维护，这里只负责渲染路由出口。
 */
import { useAppStore } from '@/stores/app'

// 引入 store 以触发主题初始化（watch immediate 会把 dark 类同步到 <html>）
useAppStore()
</script>

<template>
  <router-view />
</template>
