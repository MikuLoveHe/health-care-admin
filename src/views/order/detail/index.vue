<script setup>
/**
 * 订单管理 - 订单详情
 * 功能：订单基本信息、服务内容、下单人信息、状态流转记录
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cancelOrder, getOrderDetail } from '@/api/order'
import { formatDate, formatMoney } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref({})

const orderId = computed(() => route.params.id)

async function loadDetail() {
  loading.value = true
  try {
    detail.value = await getOrderDetail(orderId.value)
  } catch {
    // 订单不存在时退回列表页
    router.replace('/order/list')
  } finally {
    loading.value = false
  }
}

/** 状态流转时间轴，按时间正序 */
const timeline = computed(() => {
  const flow = detail.value.statusFlow || []
  return [...flow].sort((a, b) => new Date(a.time) - new Date(b.time))
})

/**
 * 订单进度百分比，用于顶部进度条
 * 待支付 1/5，待接单 2/5，服务中 3/5，已完成 5/5
 */
const progressStatus = computed(() => {
  const map = { 待支付: 'warning', 待接单: 'primary', 服务中: 'primary', 已完成: 'success', 已取消: 'exception' }
  return map[detail.value.status] || 'primary'
})

const activeStep = computed(() => {
  const steps = ['待支付', '待接单', '服务中', '已完成']
  if (detail.value.status === '已取消') return 0
  const index = steps.indexOf(detail.value.status)
  return index === -1 ? 4 : index
})

/** 是否允许取消 */
const canCancel = computed(() => !['已完成', '已取消'].includes(detail.value.status))

async function handleCancel() {
  try {
    await ElMessageBox.confirm(
      `确定要取消订单「${detail.value.orderNo}」吗？取消后服务费将原路退回用户。`,
      '取消订单确认',
      { confirmButtonText: '确定取消', cancelButtonText: '再想想', type: 'warning' },
    )
  } catch {
    return
  }
  await cancelOrder(detail.value.id, { remark: '管理员手动取消订单' })
  ElMessage.success('订单已取消')
  loadDetail()
}

/** 时间轴节点颜色 */
function nodeType(record) {
  if (record.node.includes('取消')) return 'danger'
  if (record.node.includes('完成')) return 'success'
  return 'primary'
}

onMounted(loadDetail)
</script>

<template>
  <div v-loading="loading" class="page-container">
    <PageHeader
      title="订单详情"
      :description="detail.orderNo ? `订单号：${detail.orderNo}` : ''"
      show-back
      @back="router.push('/order/list')"
    >
      <template #extra>
        <StatusTag v-if="detail.status" :status="detail.status" dot size="large" />
        <el-button v-if="canCancel" type="danger" plain @click="handleCancel">
          <el-icon><CircleClose /></el-icon>
          取消订单
        </el-button>
      </template>
    </PageHeader>

    <div v-if="detail.id" class="order-detail">
      <!-- 状态进度条 -->
      <div class="app-card">
        <div class="app-card__body">
          <el-steps :active="activeStep" :status="progressStatus" align-center finish-status="success">
            <el-step title="提交订单" :description="formatDate(detail.orderTime, 'MM-DD HH:mm')" />
            <el-step title="支付完成" description="已支付" />
            <el-step title="志愿者接单" :description="detail.volunteerName || '待分配'" />
            <el-step
              title="服务完成"
              :description="detail.finishTime ? formatDate(detail.finishTime, 'MM-DD HH:mm') : '进行中'"
            />
          </el-steps>
        </div>
      </div>

      <div class="order-detail__grid">
        <!-- 左侧：主要信息 -->
        <div class="order-detail__main">
          <!-- 服务内容 -->
          <div class="app-card">
            <div class="app-card__body">
              <h3 class="order-detail__title">
                <el-icon><Bowl /></el-icon>
                服务内容
              </h3>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="服务名称">{{ detail.serviceName }}</el-descriptions-item>
                <el-descriptions-item label="服务类型">{{ detail.type }}</el-descriptions-item>
                <el-descriptions-item label="服务单价">
                  {{ formatMoney(detail.servicePrice) }}
                </el-descriptions-item>
                <el-descriptions-item label="购买数量">{{ detail.quantity }}</el-descriptions-item>
                <el-descriptions-item label="预约服务时间">
                  {{ formatDate(detail.appointmentTime, 'YYYY-MM-DD HH:mm') }}
                </el-descriptions-item>
                <el-descriptions-item label="服务地址" :span="2">
                  {{ detail.userAddress }}
                </el-descriptions-item>
                <el-descriptions-item label="订单备注" :span="2">
                  {{ detail.remark || '无' }}
                </el-descriptions-item>
              </el-descriptions>

              <!-- 金额汇总 -->
              <div class="order-detail__amount">
                <span class="app-text-secondary">订单合计</span>
                <span class="order-detail__amount-value">{{ formatMoney(detail.amount) }}</span>
              </div>
            </div>
          </div>

          <!-- 状态流转记录 -->
          <div class="app-card">
            <div class="app-card__body">
              <h3 class="order-detail__title">
                <el-icon><Clock /></el-icon>
                状态流转记录
              </h3>

              <el-timeline v-if="timeline.length" class="order-detail__timeline">
                <el-timeline-item
                  v-for="(record, index) in timeline"
                  :key="index"
                  :type="nodeType(record)"
                  :timestamp="record.time"
                  placement="top"
                  size="large"
                >
                  <div class="flow-node">
                    <div class="flow-node__header">
                      <span class="flow-node__title">{{ record.node }}</span>
                      <el-tag size="small" type="info" round>{{ record.operator }}</el-tag>
                    </div>
                    <p v-if="record.remark" class="flow-node__remark">{{ record.remark }}</p>
                  </div>
                </el-timeline-item>
              </el-timeline>

              <el-empty v-else description="暂无流转记录" :image-size="80" />
            </div>
          </div>
        </div>

        <!-- 右侧：下单人与志愿者 -->
        <div class="order-detail__side">
          <!-- 下单人信息 -->
          <div class="app-card">
            <div class="app-card__body">
              <h3 class="order-detail__title">
                <el-icon><User /></el-icon>
                下单人信息
              </h3>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="姓名">{{ detail.userName }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ detail.userPhone }}</el-descriptions-item>
                <el-descriptions-item label="所属社区">{{ detail.districtName }}</el-descriptions-item>
                <el-descriptions-item label="详细地址">{{ detail.userAddress }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>

          <!-- 服务志愿者 -->
          <div class="app-card">
            <div class="app-card__body">
              <h3 class="order-detail__title">
                <el-icon><Avatar /></el-icon>
                服务志愿者
              </h3>

              <template v-if="detail.volunteerName">
                <div class="volunteer-card">
                  <el-avatar :size="46" class="volunteer-card__avatar">
                    {{ detail.volunteerName.slice(0, 1) }}
                  </el-avatar>
                  <div class="volunteer-card__info">
                    <span class="volunteer-card__name">{{ detail.volunteerName }}</span>
                    <span class="volunteer-card__phone">{{ detail.volunteerPhone }}</span>
                  </div>
                </div>
                <el-button
                  link
                  type="primary"
                  class="volunteer-card__link"
                  @click="router.push(`/volunteer/detail/${detail.volunteerId}`)"
                >
                  查看志愿者资质详情
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </template>

              <el-empty v-else description="暂未分配志愿者" :image-size="80" />
            </div>
          </div>

          <!-- 支付信息 -->
          <div class="app-card">
            <div class="app-card__body">
              <h3 class="order-detail__title">
                <el-icon><Wallet /></el-icon>
                支付信息
              </h3>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="支付方式">{{ detail.payMethod }}</el-descriptions-item>
                <el-descriptions-item label="支付金额">
                  {{ formatMoney(detail.amount) }}
                </el-descriptions-item>
                <el-descriptions-item label="下单时间">
                  {{ formatDate(detail.orderTime, 'YYYY-MM-DD HH:mm:ss') }}
                </el-descriptions-item>
                <el-descriptions-item label="完成时间">
                  {{ detail.finishTime ? formatDate(detail.finishTime, 'YYYY-MM-DD HH:mm:ss') : '—' }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.order-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-detail__grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.order-detail__main,
.order-detail__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.order-detail__title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
}

/* 金额汇总条 */
.order-detail__amount {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--app-border);
}

.order-detail__amount-value {
  font-size: 22px;
  font-weight: 600;
  color: var(--app-primary);
}

/* ------------------------------ 时间轴 ------------------------------ */
.order-detail__timeline {
  padding-left: 4px;
}

.flow-node__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flow-node__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.flow-node__remark {
  margin-top: 6px;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--app-text-regular);
  background-color: var(--app-bg-hover);
  border-radius: $radius-sm;
}

/* ------------------------------ 志愿者卡片 ------------------------------ */
.volunteer-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: var(--app-bg-hover);
  border-radius: $radius-md;
}

.volunteer-card__avatar {
  flex-shrink: 0;
  background-color: var(--app-primary);
  font-size: 18px;
}

.volunteer-card__info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.volunteer-card__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.volunteer-card__phone {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.volunteer-card__link {
  margin-top: 10px;
  font-size: 13px;
}
</style>
