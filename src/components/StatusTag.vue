<script setup>
/**
 * 状态标签
 * 全站所有状态展示统一走这个组件，保证同一状态在各页面颜色一致。
 */
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: '' },
  // 支持 success / warning / danger / info / primary 五种 Element Plus 预设
  size: { type: String, default: 'default' },
  // 是否显示前置圆点
  dot: { type: Boolean, default: false },
})

/**
 * 状态 -> 颜色的映射表
 * 覆盖全站出现的所有状态文案，新增状态只需在此处补充一行。
 */
const STATUS_MAP = {
  /* 通用 */
  正常: 'success',
  已启用: 'success',
  启用: 'success',
  禁用: 'danger',
  已禁用: 'danger',

  /* 服务 / 广告上下架 */
  已上架: 'success',
  上架: 'success',
  已下架: 'info',
  下架: 'info',
  投放中: 'success',
  待投放: 'warning',
  已停止: 'info',

  /* 志愿者资质 */
  待审核: 'warning',
  已通过: 'success',
  审核通过: 'success',
  已驳回: 'danger',
  驳回: 'danger',
  已过期: 'info',

  /* 订单状态 */
  待支付: 'warning',
  待接单: 'primary',
  服务中: 'primary',
  已完成: 'success',
  已取消: 'info',

  /* 健康情况 */
  健康: 'success',
  慢性病: 'warning',
  半失能: 'warning',
  失能: 'danger',

  /* 护理等级 */
  自理: 'success',
  一级护理: 'danger',
  二级护理: 'warning',

  /* 补贴类型 */
  无: 'info',
  高龄津贴: 'success',
  低保补贴: 'warning',
  失能护理补贴: 'danger',
}

const tagType = computed(() => STATUS_MAP[props.status] || 'info')
</script>

<template>
  <el-tag :type="tagType" :size="size" :effect="dot ? 'light' : 'light'" round>
    <span v-if="dot" class="status-tag__dot" :class="`status-tag__dot--${tagType}`" />
    {{ status || '—' }}
  </el-tag>
</template>

<style scoped lang="scss">
.status-tag__dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  vertical-align: middle;
  background-color: currentColor;
}
</style>
