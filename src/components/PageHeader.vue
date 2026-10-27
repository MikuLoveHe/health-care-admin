<script setup>
/**
 * 页面标题栏
 * 统一各业务页面的标题区样式：标题 + 描述 + 右侧操作按钮插槽
 */
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  // 是否显示返回按钮（详情页使用）
  showBack: { type: Boolean, default: false },
})

const emit = defineEmits(['back'])
</script>

<template>
  <div class="page-header">
    <div class="page-header__main">
      <div class="page-header__title-row">
        <el-button v-if="showBack" link class="page-header__back" @click="emit('back')">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-header__title">{{ title }}</h2>
      </div>
      <p v-if="description" class="page-header__desc">{{ description }}</p>
    </div>

    <!-- 右侧操作区 -->
    <div v-if="$slots.extra" class="page-header__extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.page-header__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-header__back {
  color: var(--app-text-secondary);
  font-size: 13px;
  padding: 0;

  &:hover {
    color: var(--app-primary);
  }
}

.page-header__title {
  font-size: 19px;
  font-weight: 600;
  color: var(--app-text-primary);
  line-height: 1.4;
}

.page-header__desc {
  margin-top: 4px;
  font-size: 13px;
  color: var(--app-text-secondary);
  line-height: 1.5;
}

.page-header__extra {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
</style>
