<script setup>
/**
 * 业务监控 - 业务报表
 * 功能：按周期筛选生成统计报表，支持导出 CSV
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { exportReport, getReport } from '@/api/monitor'
import { REPORT_PERIODS } from '@/utils/constants'
import { formatMoney } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import ChartCard from '@/components/ChartCard.vue'

const loading = ref(false)
const exportLoading = ref(false)

const query = reactive({
  period: 'month',
})

const rows = ref([])
const summary = ref({})

/** 当前周期的文字描述 */
const periodLabel = computed(
  () => REPORT_PERIODS.find((item) => item.value === query.period)?.label || '按月统计',
)

/** 表格列定义 */
const COLUMNS = [
  { prop: 'label', label: '统计周期', width: 130 },
  { prop: 'created', label: '新增订单', align: 'right' },
  { prop: 'finished', label: '完成订单', align: 'right' },
  { prop: 'cancelled', label: '取消订单', align: 'right' },
  { prop: 'newUsers', label: '新增用户', align: 'right' },
  { prop: 'amount', label: '成交金额', align: 'right', isMoney: true },
  { prop: 'finishRate', label: '完成率', align: 'right', isRate: true },
]

/** 给每行补充完成率字段（后端返回的 summary 有，明细行需要自行计算） */
const tableData = computed(() =>
  rows.value.map((item) => ({
    ...item,
    // 完成率 = 完成 / 新增，保留一位小数
    finishRate: item.created ? Number(((item.finished / item.created) * 100).toFixed(1)) : 0,
  })),
)

/* ------------------------------ 图表：趋势 ------------------------------ */
const trendOption = computed(() => ({
  grid: { left: 10, right: 24, top: 44, bottom: 10, containLabel: true },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { right: 0, top: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  xAxis: { type: 'category', data: tableData.value.map((item) => item.label) },
  yAxis: [
    { type: 'value', name: '单' },
    { type: 'value', name: '元', position: 'right', splitLine: { show: false } },
  ],
  series: [
    {
      name: '新增订单',
      type: 'bar',
      barWidth: 16,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: tableData.value.map((item) => item.created),
    },
    {
      name: '完成订单',
      type: 'bar',
      barWidth: 16,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: tableData.value.map((item) => item.finished),
    },
    {
      name: '成交金额',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      yAxisIndex: 1,
      lineStyle: { width: 2.5 },
      data: tableData.value.map((item) => item.amount),
    },
  ],
}))

/* ------------------------------ 数据加载 ------------------------------ */
async function loadReport() {
  loading.value = true
  try {
    const data = await getReport({ period: query.period })
    rows.value = data.rows
    summary.value = data.summary
  } finally {
    loading.value = false
  }
}

/** 点击「生成报表」时重新拉取 */
function handleGenerate() {
  loadReport()
  ElMessage.success(`已生成${periodLabel.value}报表`)
}

/* ------------------------------ 导出 CSV ------------------------------ */
async function handleExport() {
  exportLoading.value = true
  try {
    const data = await exportReport({ period: query.period })

    // 组装 CSV：表头 + 明细行 + 合计行
    const headers = ['统计周期', '新增订单', '完成订单', '取消订单', '新增用户', '成交金额', '完成率']
    const lines = tableData.value.map((item) => [
      item.label,
      item.created,
      item.finished,
      item.cancelled,
      item.newUsers,
      item.amount,
      `${item.finishRate}%`,
    ])
    const summaryLine = [
      '合计',
      summary.value.created,
      summary.value.finished,
      summary.value.cancelled,
      summary.value.newUsers,
      summary.value.amount,
      `${summary.value.finishRate}%`,
    ]

    // 前置 UTF-8 BOM，避免 Excel 打开中文乱码
    const csv = [headers.join(','), ...lines.map((line) => line.join(',')), summaryLine.join(',')].join('\n')
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = data.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success('报表已导出')
  } finally {
    exportLoading.value = false
  }
}

onMounted(loadReport)
</script>

<template>
  <div class="page-container">
    <PageHeader title="业务报表" description="按周期汇总平台经营数据，支持导出为 Excel 可直接打开的 CSV 文件">
      <template #extra>
        <el-button :loading="exportLoading" :disabled="!tableData.length" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </template>
    </PageHeader>

    <!-- 周期筛选 -->
    <div class="report-filter app-card">
      <div class="report-filter__inner">
        <span class="report-filter__label">统计周期：</span>
        <el-radio-group v-model="query.period" @change="handleGenerate">
          <el-radio-button v-for="item in REPORT_PERIODS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>

        <el-button type="primary" :loading="loading" class="report-filter__btn" @click="handleGenerate">
          <el-icon><Refresh /></el-icon>
          生成报表
        </el-button>
      </div>
    </div>

    <!-- 汇总卡片 -->
    <div class="report-summary">
      <div class="summary-card app-card">
        <span class="summary-card__label">新增订单总数</span>
        <span class="summary-card__value">{{ (summary.created || 0).toLocaleString() }}</span>
        <span class="summary-card__unit">单</span>
      </div>
      <div class="summary-card app-card">
        <span class="summary-card__label">完成订单总数</span>
        <span class="summary-card__value">{{ (summary.finished || 0).toLocaleString() }}</span>
        <span class="summary-card__unit">单</span>
      </div>
      <div class="summary-card app-card">
        <span class="summary-card__label">订单完成率</span>
        <span class="summary-card__value">{{ summary.finishRate || 0 }}</span>
        <span class="summary-card__unit">%</span>
      </div>
      <div class="summary-card app-card">
        <span class="summary-card__label">成交金额合计</span>
        <span class="summary-card__value is-money">{{ formatMoney(summary.amount || 0) }}</span>
      </div>
    </div>

    <!-- 趋势图 -->
    <ChartCard
      title="报表趋势"
      :sub-title="periodLabel"
      :option="trendOption"
      :loading="loading"
      :empty="!tableData.length"
      height="320px"
    />

    <!-- 明细表 -->
    <div class="app-card report-table">
      <div class="app-card__body">
        <div class="app-toolbar">
          <h3 class="report-table__title">
            <el-icon><Memo /></el-icon>
            统计明细
          </h3>
          <span class="app-text-secondary">共 {{ tableData.length }} 个统计周期</span>
        </div>

        <el-table
          v-loading="loading"
          :data="tableData"
          border
          stripe
          show-summary
          :summary-method="() => [
            '合计',
            summary.created ?? 0,
            summary.finished ?? 0,
            summary.cancelled ?? 0,
            summary.newUsers ?? 0,
            formatMoney(summary.amount ?? 0),
            `${summary.finishRate ?? 0}%`,
          ]"
          style="width: 100%"
        >
          <el-table-column
            v-for="column in COLUMNS"
            :key="column.prop"
            :prop="column.prop"
            :label="column.label"
            :width="column.width"
            :align="column.align || 'left'"
            sortable
          >
            <template v-if="column.isMoney" #default="{ row }">
              <span class="report-table__money">{{ formatMoney(row[column.prop]) }}</span>
            </template>
            <template v-else-if="column.isRate" #default="{ row }">
              <el-progress
                :percentage="row[column.prop]"
                :stroke-width="6"
                :color="row[column.prop] >= 90 ? '#2ba88f' : '#f5a623'"
                class="report-table__rate"
              />
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="暂无报表数据" :image-size="90" />
          </template>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

/* ------------------------------ 周期筛选 ------------------------------ */
.report-filter {
  padding: 14px 16px;
  margin-bottom: 16px;
}

.report-filter__inner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.report-filter__label {
  font-size: 13px;
  color: var(--app-text-secondary);
}

.report-filter__btn {
  margin-left: auto;
}

/* ------------------------------ 汇总卡片 ------------------------------ */
.report-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.summary-card {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 16px 20px;
  flex-wrap: wrap;
}

.summary-card__label {
  width: 100%;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--app-text-secondary);
}

.summary-card__value {
  font-size: 24px;
  font-weight: 600;
  color: var(--app-primary);

  /* 金额较长时字号收小，避免撑破卡片 */
  &.is-money {
    font-size: 20px;
  }
}

.summary-card__unit {
  font-size: 13px;
  color: var(--app-text-secondary);
}

/* ------------------------------ 明细表 ------------------------------ */
.report-table {
  margin-top: 16px;
}

.report-table__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.report-table__money {
  font-weight: 500;
  color: var(--app-primary);
}

.report-table__rate {
  width: 90px;
}
</style>
