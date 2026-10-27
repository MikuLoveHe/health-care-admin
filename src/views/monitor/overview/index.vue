<script setup>
/**
 * 业务监控 - 数据总览
 * 功能：关键指标卡片（用户数、订单数、志愿者数、档案数）+ 状态分布 + 排行
 */
import { computed, onMounted, ref } from 'vue'
import {
  getCategoryRatio,
  getDistrictDistribution,
  getOrderStatus,
  getOverview,
  getVolunteerRanking,
} from '@/api/monitor'
import { formatMoney } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import ChartCard from '@/components/ChartCard.vue'

const loading = ref(false)
const metrics = ref({})
const orderStatus = ref([])
const categoryRatio = ref([])
const districtDistribution = ref([])
const volunteerRanking = ref([])

/* ------------------------------ 顶部指标卡片 ------------------------------ */
const metricCards = computed(() => [
  {
    label: '平台用户总数',
    value: metrics.value.userTotal,
    growth: metrics.value.userGrowth,
    icon: 'User',
    color: '#2ba88f',
    suffix: '人',
  },
  {
    label: '累计订单总数',
    value: metrics.value.orderTotal,
    growth: metrics.value.orderGrowth,
    icon: 'Tickets',
    color: '#5b8ff9',
    suffix: '单',
  },
  {
    label: '在册志愿者',
    value: metrics.value.volunteerTotal,
    growth: metrics.value.volunteerGrowth,
    icon: 'Avatar',
    color: '#f5a623',
    suffix: '人',
  },
  {
    label: '老人档案总数',
    value: metrics.value.archiveTotal,
    growth: metrics.value.archiveGrowth,
    icon: 'Folder',
    color: '#9b8afb',
    suffix: '份',
  },
])

/** 次级指标：今日订单、待审核、完成金额 */
const subMetrics = computed(() => [
  {
    label: '今日新增订单',
    value: metrics.value.todayOrder || 0,
    icon: 'TrendCharts',
    color: '#2ba88f',
  },
  {
    label: '待审核申请',
    value: metrics.value.pendingAudit || 0,
    icon: 'Bell',
    color: '#f5a623',
  },
  {
    label: '已完成订单金额',
    value: formatMoney(metrics.value.finishedAmount || 0),
    icon: 'Wallet',
    color: '#5b8ff9',
    isMoney: true,
  },
])

/* ------------------------------ 图表配置 ------------------------------ */

/** 订单状态分布 - 环形图 */
const orderStatusOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}：{c} 单（{d}%）' },
  legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  series: [
    {
      type: 'pie',
      radius: ['48%', '70%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: 'transparent', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 600, formatter: '{b}\n{c} 单' },
      },
      data: orderStatus.value,
    },
  ],
}))

/** 服务类型占比 - 玫瑰图 */
const categoryOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}：{c} 单（{d}%）' },
  legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  series: [
    {
      type: 'pie',
      radius: ['20%', '68%'],
      center: ['50%', '44%'],
      roseType: 'radius',
      itemStyle: { borderRadius: 4 },
      label: { fontSize: 11, formatter: '{b}\n{d}%' },
      labelLine: { length: 6, length2: 8 },
      data: categoryRatio.value,
    },
  ],
}))

/** 各辖区档案分布 - 柱状图 */
const districtOption = computed(() => ({
  grid: { left: 10, right: 20, top: 40, bottom: 10, containLabel: true },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { right: 0, top: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  xAxis: {
    type: 'category',
    data: districtDistribution.value.map((item) => item.name),
    axisLabel: { interval: 0 },
  },
  yAxis: { type: 'value', name: '数量' },
  series: [
    {
      name: '档案数',
      type: 'bar',
      barWidth: 16,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: districtDistribution.value.map((item) => item.archiveCount),
    },
    {
      name: '用户数',
      type: 'bar',
      barWidth: 16,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: districtDistribution.value.map((item) => item.userCount),
    },
  ],
}))

/** 志愿者服务时长排行 - 横向柱状图 */
const rankingOption = computed(() => {
  // 横向柱状图数据需倒序，最长的一根显示在最上方
  const sorted = [...volunteerRanking.value].reverse()
  return {
    grid: { left: 10, right: 40, top: 10, bottom: 10, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}：{c} 小时' },
    xAxis: { type: 'value', name: '小时' },
    yAxis: { type: 'category', data: sorted.map((item) => item.name) },
    series: [
      {
        type: 'bar',
        barWidth: 14,
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', formatter: '{c} h', fontSize: 11 },
        data: sorted.map((item) => item.hours),
      },
    ],
  }
})

async function loadData() {
  loading.value = true
  try {
    // 五个接口互相独立，并行请求缩短首屏时间
    const [overview, status, category, district, ranking] = await Promise.all([
      getOverview(),
      getOrderStatus(),
      getCategoryRatio(),
      getDistrictDistribution(),
      getVolunteerRanking(),
    ])
    metrics.value = overview
    orderStatus.value = status
    categoryRatio.value = category
    districtDistribution.value = district
    volunteerRanking.value = ranking
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <PageHeader title="数据总览" description="平台核心业务指标一览，数据每次进入页面时刷新" />

    <!-- 主指标卡片 -->
    <div v-loading="loading" class="overview-metrics">
      <div v-for="card in metricCards" :key="card.label" class="metric-card app-card">
        <div class="metric-card__top">
          <div class="metric-card__icon" :style="{ backgroundColor: `${card.color}1a`, color: card.color }">
            <el-icon><component :is="card.icon" /></el-icon>
          </div>
          <span class="metric-card__growth" :class="card.growth >= 0 ? 'is-up' : 'is-down'">
            <el-icon>
              <Top v-if="card.growth >= 0" />
              <Bottom v-else />
            </el-icon>
            {{ Math.abs(card.growth ?? 0) }}%
          </span>
        </div>
        <div class="metric-card__value">
          {{ (card.value ?? 0).toLocaleString() }}
          <span class="metric-card__suffix">{{ card.suffix }}</span>
        </div>
        <div class="metric-card__label">{{ card.label }}</div>
      </div>
    </div>

    <!-- 次级指标 -->
    <div v-loading="loading" class="overview-sub-metrics">
      <div v-for="item in subMetrics" :key="item.label" class="sub-metric app-card">
        <div class="sub-metric__icon" :style="{ color: item.color }">
          <el-icon><component :is="item.icon" /></el-icon>
        </div>
        <div class="sub-metric__content">
          <span class="sub-metric__value" :class="{ 'is-money': item.isMoney }">{{ item.value }}</span>
          <span class="sub-metric__label">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="overview-charts">
      <ChartCard
        title="订单状态分布"
        sub-title="全部订单"
        :option="orderStatusOption"
        :loading="loading"
        :empty="!orderStatus.length"
        height="300px"
      />
      <ChartCard
        title="服务类型占比"
        sub-title="按订单量统计"
        :option="categoryOption"
        :loading="loading"
        :empty="!categoryRatio.length"
        height="300px"
      />
    </div>

    <div class="overview-charts">
      <ChartCard
        title="各辖区老人与用户分布"
        sub-title="单位：人"
        :option="districtOption"
        :loading="loading"
        :empty="!districtDistribution.length"
        height="320px"
      />
      <ChartCard
        title="志愿者服务时长排行"
        sub-title="TOP 8"
        :option="rankingOption"
        :loading="loading"
        :empty="!volunteerRanking.length"
        height="320px"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

/* ------------------------------ 主指标卡片 ------------------------------ */
.overview-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.metric-card {
  padding: 18px 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--app-shadow-md);
  }
}

.metric-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.metric-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 19px;
  border-radius: $radius-md;
}

.metric-card__growth {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;

  &.is-up {
    color: var(--app-success);
    background-color: var(--app-primary-soft);
  }

  &.is-down {
    color: var(--app-danger);
    background-color: rgba(245, 108, 108, 0.1);
  }
}

.metric-card__value {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--app-text-primary);
}

.metric-card__suffix {
  font-size: 13px;
  font-weight: 400;
  color: var(--app-text-secondary);
  margin-left: 2px;
}

.metric-card__label {
  margin-top: 4px;
  font-size: 13px;
  color: var(--app-text-secondary);
}

/* ------------------------------ 次级指标 ------------------------------ */
.overview-sub-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.sub-metric {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
}

.sub-metric__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: 20px;
  border-radius: 50%;
  background-color: var(--app-bg-hover);
  flex-shrink: 0;
}

.sub-metric__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sub-metric__value {
  font-size: 22px;
  font-weight: 600;
  color: var(--app-text-primary);

  /* 金额数字较长，字号收小一点避免换行 */
  &.is-money {
    font-size: 19px;
    color: var(--app-primary);
  }
}

.sub-metric__label {
  font-size: 13px;
  color: var(--app-text-secondary);
}

/* ------------------------------ 图表区 ------------------------------ */
.overview-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}
</style>
