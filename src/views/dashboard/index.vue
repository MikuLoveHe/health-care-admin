<script setup>
/**
 * 首页概览
 * 顶部欢迎条 + 指标卡片 + 待办事项 + 订单趋势图
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getHealthOverview, getOrderTrend } from '@/api/monitor'
import { useUserStore } from '@/stores/user'
import { formatMoney } from '@/utils/format'
import ChartCard from '@/components/ChartCard.vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const metrics = ref({})
const todos = ref([])
const trend = ref([])

/** 顶部四个指标卡片 */
const metricCards = computed(() => [
  {
    key: 'userTotal',
    label: '平台用户总数',
    value: metrics.value.userTotal,
    growth: metrics.value.userGrowth,
    icon: 'User',
    color: '#2ba88f',
  },
  {
    key: 'orderTotal',
    label: '订单总数',
    value: metrics.value.orderTotal,
    growth: metrics.value.orderGrowth,
    icon: 'Tickets',
    color: '#5b8ff9',
  },
  {
    key: 'volunteerTotal',
    label: '在册志愿者',
    value: metrics.value.volunteerTotal,
    growth: metrics.value.volunteerGrowth,
    icon: 'Avatar',
    color: '#f5a623',
  },
  {
    key: 'archiveTotal',
    label: '老人档案总数',
    value: metrics.value.archiveTotal,
    growth: metrics.value.archiveGrowth,
    icon: 'Folder',
    color: '#9b8afb',
  },
])

/** 折线图配置 */
const trendOption = computed(() => ({
  grid: { left: 10, right: 20, top: 40, bottom: 10, containLabel: true },
  tooltip: { trigger: 'axis' },
  legend: { data: ['新增订单', '完成订单'], right: 0, top: 0 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: trend.value.map((item) => item.date),
  },
  yAxis: { type: 'value', name: '单' },
  series: [
    {
      name: '新增订单',
      type: 'line',
      smooth: true,
      symbolSize: 6,
      data: trend.value.map((item) => item.created),
      areaStyle: { opacity: 0.12 },
    },
    {
      name: '完成订单',
      type: 'line',
      smooth: true,
      symbolSize: 6,
      data: trend.value.map((item) => item.finished),
      areaStyle: { opacity: 0.12 },
    },
  ],
}))

/** 根据性别/时段生成问候语 */
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了，注意休息'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

async function loadData() {
  loading.value = true
  try {
    // 两个接口互不依赖，并行请求
    const [health, orderTrend] = await Promise.all([getHealthOverview(), getOrderTrend()])
    metrics.value = health.metrics
    todos.value = health.todos
    trend.value = orderTrend
  } finally {
    loading.value = false
  }
}

/** 待办项点击跳转到对应模块 */
function goTodo(item) {
  router.push(item.path)
}

onMounted(loadData)
</script>

<template>
  <div class="page-container dashboard">
    <!-- 欢迎条 -->
    <div class="dashboard__banner app-card">
      <div class="dashboard__banner-text">
        <h2 class="dashboard__greeting">{{ greeting }}，{{ userStore.name }}</h2>
        <p class="dashboard__welcome">
          今天是 {{ new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}，
          平台各项业务运行正常。当前有
          <strong>{{ todos.find((item) => item.title.includes('待审核'))?.count || 0 }}</strong>
          条志愿者资质待审核，请及时处理。
        </p>
      </div>
      <div class="dashboard__banner-actions">
        <el-button type="primary" @click="router.push('/volunteer/audit')">
          <el-icon><DocumentChecked /></el-icon>
          去审核
        </el-button>
        <el-button @click="router.push('/monitor/chart')">
          <el-icon><TrendCharts /></el-icon>
          查看数据
        </el-button>
      </div>
    </div>

    <!-- 指标卡片 -->
    <div v-loading="loading" class="dashboard__metrics">
      <div
        v-for="card in metricCards"
        :key="card.key"
        class="metric-card app-card"
      >
        <div class="metric-card__icon" :style="{ backgroundColor: `${card.color}1a`, color: card.color }">
          <el-icon><component :is="card.icon" /></el-icon>
        </div>
        <div class="metric-card__content">
          <span class="metric-card__label">{{ card.label }}</span>
          <span class="metric-card__value">{{ (card.value ?? 0).toLocaleString() }}</span>
          <span class="metric-card__growth" :class="card.growth >= 0 ? 'is-up' : 'is-down'">
            <el-icon>
              <Top v-if="card.growth >= 0" />
              <Bottom v-else />
            </el-icon>
            {{ Math.abs(card.growth ?? 0) }}% 较上月
          </span>
        </div>
      </div>
    </div>

    <!-- 待办 + 趋势图 -->
    <div class="dashboard__grid">
      <!-- 待办事项 -->
      <div class="app-card dashboard__todo">
        <div class="dashboard__section-header">
          <h3>待办事项</h3>
          <span class="app-text-secondary">点击可跳转处理</span>
        </div>
        <ul class="todo-list">
          <li
            v-for="item in todos"
            :key="item.title"
            class="todo-item"
            @click="goTodo(item)"
          >
            <span class="todo-item__dot" :class="`todo-item__dot--${item.type}`" />
            <span class="todo-item__title">{{ item.title }}</span>
            <span class="todo-item__count">{{ item.count }}</span>
            <el-icon class="todo-item__arrow"><ArrowRight /></el-icon>
          </li>
        </ul>

        <div class="dashboard__amount">
          <span class="app-text-secondary">已完成订单金额合计</span>
          <strong>{{ formatMoney(metrics.finishedAmount) }}</strong>
        </div>
      </div>

      <!-- 订单趋势 -->
      <ChartCard
        title="近 7 日订单趋势"
        sub-title="单位：单"
        :option="trendOption"
        :loading="loading"
        height="326px"
        class="dashboard__chart"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.dashboard__banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  /* 品牌色渐变条 */
  background: linear-gradient(120deg, var(--app-primary-soft) 0%, var(--app-bg-card) 65%);
}

.dashboard__greeting {
  font-size: 20px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.dashboard__welcome {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--app-text-secondary);

  strong {
    color: var(--app-accent);
    font-size: 15px;
    padding: 0 2px;
  }
}

.dashboard__banner-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

/* ------------------------------ 指标卡片 ------------------------------ */
.dashboard__metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--app-shadow-md);
  }
}

.metric-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  font-size: 22px;
  border-radius: $radius-md;
}

.metric-card__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.metric-card__label {
  font-size: 13px;
  color: var(--app-text-secondary);
}

.metric-card__value {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--app-text-primary);
}

.metric-card__growth {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;

  &.is-up {
    color: var(--app-success);
  }

  &.is-down {
    color: var(--app-danger);
  }
}

/* ------------------------------ 下半部分 ------------------------------ */
.dashboard__grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.dashboard__todo {
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.dashboard__section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--app-text-primary);
  }
}

.todo-list {
  flex: 1;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  margin-bottom: 8px;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--app-bg-hover);

    .todo-item__arrow {
      transform: translateX(3px);
      color: var(--app-primary);
    }
  }
}

.todo-item__dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;

  &--warning {
    background-color: var(--app-warning);
  }

  &--primary {
    background-color: var(--app-info);
  }

  &--success {
    background-color: var(--app-success);
  }

  &--info {
    background-color: var(--app-text-secondary);
  }
}

.todo-item__title {
  flex: 1;
  font-size: 13px;
  color: var(--app-text-regular);
}

.todo-item__count {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.todo-item__arrow {
  font-size: 13px;
  color: var(--app-text-placeholder);
  transition: transform 0.2s, color 0.2s;
}

.dashboard__amount {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 14px;
  font-size: 13px;
  border-top: 1px dashed var(--app-border);

  strong {
    font-size: 17px;
    color: var(--app-primary);
  }
}

.dashboard__chart {
  min-width: 0;
}
</style>
