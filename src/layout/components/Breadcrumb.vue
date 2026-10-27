<script setup>
/**
 * 面包屑
 * 根据当前路由的 matched 链路生成，详情页会带上列表页作为上级。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const items = computed(() => {
  const list = route.matched
    .filter((item) => item.meta?.title)
    .map((item) => ({
      title: item.meta.title,
      path: item.path,
    }))

  // 首页永远作为第一级
  if (list[0]?.path !== '/dashboard') {
    list.unshift({ title: '首页概览', path: '/dashboard' })
  }
  return list
})
</script>

<template>
  <el-breadcrumb separator="/" class="breadcrumb">
    <el-breadcrumb-item v-for="(item, index) in items" :key="item.path">
      <!-- 最后一级不可点击 -->
      <span v-if="index === items.length - 1" class="breadcrumb__current">{{ item.title }}</span>
      <router-link v-else :to="item.path" class="breadcrumb__link">{{ item.title }}</router-link>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<style scoped lang="scss">
.breadcrumb {
  font-size: 13px;
  line-height: 1;
}

.breadcrumb__link {
  color: var(--app-text-secondary);
  transition: color 0.2s;

  &:hover {
    color: var(--app-primary);
  }
}

.breadcrumb__current {
  color: var(--app-text-primary);
  font-weight: 500;
}
</style>
