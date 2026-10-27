<script setup>
/**
 * 搜索栏容器
 * 统一各列表页筛选区的卡片样式、表单排布与按钮位置，
 * 通过默认插槽放入具体的表单项。
 *
 * 用法：
 *   <SearchBar @search="handleSearch" @reset="handleReset">
 *     <el-form-item label="名称"><el-input v-model="query.name" /></el-form-item>
 *   </SearchBar>
 */
defineProps({
  // 查询按钮 loading
  loading: { type: Boolean, default: false },
  // 查询按钮文字
  searchText: { type: String, default: '查询' },
  // 是否显示重置按钮
  showReset: { type: Boolean, default: true },
})

const emit = defineEmits(['search', 'reset'])
</script>

<template>
  <div class="app-card search-bar">
    <el-form :inline="true" class="search-bar__form" @submit.prevent="emit('search')">
      <slot />

      <el-form-item class="search-bar__actions">
        <el-button type="primary" :loading="loading" @click="emit('search')">
          <el-icon><Search /></el-icon>
          {{ searchText }}
        </el-button>
        <el-button v-if="showReset" @click="emit('reset')">
          <el-icon><RefreshLeft /></el-icon>
          重置
        </el-button>
        <slot name="actions" />
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.search-bar {
  padding: 16px 16px 0;
  margin-bottom: 16px;
}

.search-bar__form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;

  /* 表单项统一底部间距，保证换行后行距一致 */
  :deep(.el-form-item) {
    margin-bottom: 16px;
    margin-right: 16px;
  }

  /* 日期选择器等控件宽度收敛，避免过宽 */
  :deep(.el-input),
  :deep(.el-select) {
    width: 180px;
  }

  :deep(.el-date-editor) {
    width: 260px;
  }
}

/* 操作按钮推到最右侧 */
.search-bar__actions {
  margin-left: auto;
  margin-right: 0 !important;
}

@media (max-width: 1200px) {
  .search-bar {
    padding: 12px 12px 0;
  }

  .search-bar__actions {
    margin-left: 0;
  }
}
</style>
