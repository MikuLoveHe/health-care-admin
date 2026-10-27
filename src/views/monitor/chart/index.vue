<script setup>
/**
 * 业务监控 - 图表分析
 * 功能：使用 ECharts 展示趋势图、饼图、柱状图等
 */
import { computed, onMounted, ref } from 'vue'
import {
  getCategoryRatio,
  getDistrictDistribution,
  getOrderTrend,
  getVolunteerRanking,
} from '@/api/monitor'
import PageHeader from '@/components/PageHeader.vue'
import ChartCard from '@/components/ChartCard.vue'

const loading = ref(false)
const orderTrend = ref([])
const categoryRatio = ref([])
const districtDistribution = ref([])
const volunteerRanking = ref([])

/** 趋势图展示维度：新增 / 完成 / 取消 */
const activeMetrics = ref(['created', 'finished'])

/** 趋势图可选指标 */
const METRIC_OPTIONS = [
  { key: 'created', label: '新增订单', color: '#2ba88f' },
  { key: 'finished', label: '完成订单', color: '#5b8ff9' },
  { key: 'cancelled', label: '取消订单', color: '#ff7875' },
]

/* ------------------------------ 折线图：订单趋势 ------------------------------ */
const trendOption = computed(() => {
  const visibleMetrics = METRIC_OPTIONS.filter((item) => activeMetrics.value.includes(item.key))
  return {
    grid: { left: 10, right: 24, top: 44, bottom: 10, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross', label: { backgroundColor: '#2ba88f' } } },
    legend: { right: 0, top: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
    xAxis: { type: 'category', boundaryGap: false, data: orderTrend.value.map((item) => item.date) },
    yAxis: { type: 'value', name: '单' },
    series: visibleMetrics.map((metric) => ({
      name: metric.label,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      showSymbol: true,
      lineStyle: { width: 2.5 },
      // 面积渐变让折线图更有层次，颜色从系列色渐变到透明
      areaStyle: {
        opacity: 0.18,
      },
      data: orderTrend.value.map((item) => item[metric.key]),
    })),
  }
})

/* ------------------------------ 饼图：服务类型占比 ------------------------------ */
const categoryOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 单（{d}%）' },
  legend: { orient: 'vertical', right: 0, top: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8 },
  series: [
    {
      type: 'pie',
      radius: ['45%', '68%'],
      center: ['38%', '50%'],
      itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 15, fontWeight: 600, formatter: '{b}\n{d}%' },
        scaleSize: 6,
      },
      data: categoryRatio.value,
    },
  ],
}))

/* ------------------------------ 柱状图：各辖区分布 ------------------------------ */
const districtOption = computed(() => ({
  grid: { left: 10, right: 20, top: 44, bottom: 10, containLabel: true },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { right: 0, top: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  xAxis: {
    type: 'category',
    data: districtDistribution.value.map((item) => item.name),
    axisLabel: { interval: 0, fontSize: 11 },
  },
  yAxis: { type: 'value', name: '数量' },
  series: [
    {
      name: '档案数',
      type: 'bar',
      barWidth: 14,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: districtDistribution.value.map((item) => item.archiveCount),
    },
    {
      name: '用户数',
      type: 'bar',
      barWidth: 14,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: districtDistribution.value.map((item) => item.userCount),
    },
    {
      name: '志愿者数',
      type: 'bar',
      barWidth: 14,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: districtDistribution.value.map((item) => item.volunteerCount),
    },
  ],
}))

/* ------------------------------ 横向柱状图：服务时长排行 ------------------------------ */
const rankingOption = computed(() => {
  const sorted = [...volunteerRanking.value].reverse()
  return {
    grid: { left: 10, right: 60, top: 10, bottom: 10, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const item = sorted[params[0].dataIndex]
        return `${item.name}<br/>服务时长：${item.hours} 小时<br/>服务次数：${item.count} 次`
      },
    },
    xAxis: { type: 'value', name: '小时' },
    yAxis: { type: 'category', data: sorted.map((item) => item.name), axisLabel: { fontSize: 12 } },
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

/* ------------------------------ 数据加载 ------------------------------ */
async function loadData() {
  loading.value = true
  try {
    const [trend, category, district, ranking] = await Promise.all([
      getOrderTrend(),
      getCategoryRatio(),
      getDistrictDistribution(),
      getVolunteerRanking(),
    ])
    orderTrend.value = trend
    categoryRatio.value = category
    districtDistribution.value = district
    volunteerRanking.value = ranking
  } finally {
    loading.value = false
  }
}

/** 切换趋势图展示的指标 */
function toggleMetric(key) {
  const index = activeMetrics.value.indexOf(key)
  if (index === -1) {
    activeMetrics.value.push(key)
  } else if (activeMetrics.value.length > 1) {
    // 至少保留一条曲线，否则图表为空
    activeMetrics.value.splice(index, 1)
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <PageHeader title="图表分析" description="通过折线图、饼图、柱状图多维度分析平台业务数据" />

    <!-- 订单趋势（全宽） -->
    <ChartCard title="订单趋势分析" sub-title="近 7 日" :option="trendOption" :loading="loading" height="340px">
      <template #extra>
        <el-radio-group v-model="activeMetrics" size="small">
          <el-radio-button
            v-for="item in METRIC_OPTIONS"
            :key="item.key"
            :value="item.key"
            @click.prevent="toggleMetric(item.key)"
          >
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </template>
    </ChartCard>

    <!-- 饼图 + 柱状图 -->
    <div class="chart-grid">
      <ChartCard
        title="服务类型占比"
        sub-title="按订单量统计"
        :option="categoryOption"
        :loading="loading"
        :empty="!categoryRatio.length"
        height="330px"
      />
      <ChartCard
        title="各辖区资源分布"
        sub-title="档案 / 用户 / 志愿者"
        :option="districtOption"
        :loading="loading"
        :empty="!districtDistribution.length"
        height="330px"
      />
    </div>

    <!-- 志愿者排行（全宽） -->
    <ChartCard
      title="志愿者服务时长排行"
      sub-title="服务时长 TOP 8"
      :option="rankingOption"
      :loading="loading"
      :empty="!volunteerRanking.length"
      height="320px"
    />
  </div>
</template>

<style scoped lang="scss">
.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
  margin: 16px 0;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}
</style>
