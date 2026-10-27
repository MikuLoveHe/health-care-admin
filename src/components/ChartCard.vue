<script setup>
/**
 * ECharts 图表卡片
 *
 * 封装了三件在真实项目里反复要做的事：
 *   1. 容器尺寸自适应（ResizeObserver + 侧边栏折叠时也要跟着重绘）
 *   2. 主题切换后重新取色并 setOption（ECharts 读不到 CSS 变量，必须用 JS 取）
 *   3. 卸载时销毁实例，避免内存泄漏
 *
 * 用法：
 *   <ChartCard title="订单趋势" :option="option" height="320px" />
 */
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import echarts from '@/utils/echarts'
import { useAppStore } from '@/stores/app'

const props = defineProps({
  title: { type: String, default: '' },
  subTitle: { type: String, default: '' },
  // ECharts option，由父组件传入
  option: { type: Object, required: true },
  height: { type: String, default: '320px' },
  loading: { type: Boolean, default: false },
  // 无数据时展示空状态
  empty: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无数据' },
})

const appStore = useAppStore()
const chartRef = ref(null)
let chart = null
let resizeObserver = null

/** 明暗两套调色板：ECharts 无法读取 CSS 变量，只能在 JS 里各存一份 */
const PALETTE = {
  light: {
    series: ['#2ba88f', '#5b8ff9', '#f5a623', '#7bc6b4', '#ff7875', '#9b8afb'],
    text: '#4e5969',
    textSecondary: '#86909c',
    axis: '#e5e8e6',
    splitLine: '#f0f2f1',
    tooltipBg: '#ffffff',
    tooltipText: '#1f2d3d',
  },
  dark: {
    series: ['#3fc4a8', '#7ba7ff', '#ffb84d', '#6ed0bb', '#ff9c99', '#b3a6fc'],
    text: '#c2cac8',
    textSecondary: '#8b9694',
    axis: '#2e383a',
    splitLine: '#262e30',
    tooltipBg: '#1c2224',
    tooltipText: '#e8eceb',
  },
}

const palette = computed(() => (appStore.isDark ? PALETTE.dark : PALETTE.light))

/**
 * 把主题色注入到 option 中。
 * 只处理通用的轴线、文字、提示框颜色，系列颜色若父组件已显式指定则保留。
 */
function buildOption() {
  const p = palette.value
  const base = JSON.parse(JSON.stringify(props.option))

  const option = {
    // 默认给系列一套主题色，父组件未指定 color 时生效
    color: p.series,
    textStyle: { color: p.text, fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif' },
    tooltip: {
      backgroundColor: p.tooltipBg,
      borderColor: p.axis,
      textStyle: { color: p.tooltipText, fontSize: 12 },
      ...(base.tooltip || {}),
    },
    ...base,
  }

  // 统一处理坐标轴的配色
  const applyAxis = (axis) => {
    if (!axis) return
    const list = Array.isArray(axis) ? axis : [axis]
    const styled = list.map((item) => ({
      ...item,
      axisLine: { lineStyle: { color: p.axis }, ...(item.axisLine || {}) },
      axisLabel: { color: p.textSecondary, ...(item.axisLabel || {}) },
      axisTick: { lineStyle: { color: p.axis }, ...(item.axisTick || {}) },
      splitLine: item.splitLine
        ? { lineStyle: { color: p.splitLine, type: 'dashed' }, ...item.splitLine }
        : { show: false },
      nameTextStyle: { color: p.textSecondary, ...(item.nameTextStyle || {}) },
    }))
    return Array.isArray(axis) ? styled : styled[0]
  }

  if (option.xAxis) option.xAxis = applyAxis(option.xAxis)
  if (option.yAxis) option.yAxis = applyAxis(option.yAxis)

  // 图例文字跟随主题
  if (option.legend) {
    const legends = Array.isArray(option.legend) ? option.legend : [option.legend]
    option.legend = legends.map((item) => ({ textStyle: { color: p.textSecondary }, ...item }))
  }

  // 饼图标签文字跟随主题
  if (option.series) {
    const seriesList = Array.isArray(option.series) ? option.series : [option.series]
    option.series = seriesList.map((item) => {
      if (item.type !== 'pie' || !item.label) return item
      const label = typeof item.label === 'object' ? item.label : {}
      return { ...item, label: { color: p.text, ...label } }
    })
  }

  return option
}

/** 渲染图表 */
function render() {
  if (!chart || props.empty) return
  // notMerge = true，避免旧 option 的残留配置污染新图表
  chart.setOption(buildOption(), true)
}

/** 初始化 */
function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  render()

  // 容器尺寸变化时重绘（侧边栏折叠、窗口缩放、响应式布局都会触发）
  resizeObserver = new ResizeObserver(() => {
    chart?.resize()
  })
  resizeObserver.observe(chartRef.value)
}

onMounted(() => {
  initChart()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.dispose()
  chart = null
})

// option 变化时重新渲染
watch(
  () => props.option,
  () => render(),
  { deep: true },
)

// loading 结束后需要重绘一次，保证数据正确落图
watch(
  () => props.loading,
  (value) => {
    if (value || !chart) return
    nextTick(() => chart?.resize())
  },
)

// 主题切换时用新调色板重绘
watch(
  () => appStore.isDark,
  () => {
    nextTick(() => {
      render()
      chart?.resize()
    })
  },
)
</script>

<template>
  <div class="chart-card app-card">
    <div v-if="title || $slots.extra" class="chart-card__header">
      <div class="chart-card__title-wrap">
        <h3 class="chart-card__title">{{ title }}</h3>
        <span v-if="subTitle" class="chart-card__subtitle">{{ subTitle }}</span>
      </div>
      <div class="chart-card__extra">
        <slot name="extra" />
      </div>
    </div>

    <div v-loading="loading" class="chart-card__body" :style="{ height }">
      <el-empty v-if="empty" :description="emptyText" :image-size="80" class="chart-card__empty" />
      <div v-show="!empty" ref="chartRef" class="chart-card__canvas" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--app-border-light);
}

.chart-card__title-wrap {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.chart-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.chart-card__subtitle {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.chart-card__extra {
  flex-shrink: 0;
}

.chart-card__body {
  position: relative;
  padding: 12px;
  /* 高度由 prop 控制，图表内部自适应 */
}

.chart-card__canvas {
  width: 100%;
  height: 100%;
}

.chart-card__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
