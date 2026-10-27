<script setup>
/**
 * 订单管理 - 订单列表
 * 功能：按状态/时间/类型筛选、分页查询
 */
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cancelOrder, getOrderList } from '@/api/order'
import { ORDER_STATUS, PAGE_SIZES, SERVICE_CATEGORIES } from '@/utils/constants'
import { formatDate, formatMoney } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import StatusTag from '@/components/StatusTag.vue'

const router = useRouter()

/* ------------------------------ 列表查询 ------------------------------ */
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const query = reactive({
  keyword: '',
  status: '',
  type: '',
  dateRange: [],
  page: 1,
  pageSize: 10,
})

async function loadList() {
  loading.value = true
  try {
    const data = await getOrderList(query)
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadList()
}

function handleReset() {
  query.keyword = ''
  query.status = ''
  query.type = ''
  query.dateRange = []
  handleSearch()
}

function handlePageChange(page) {
  query.page = page
  loadList()
}

function handleSizeChange(size) {
  query.pageSize = size
  query.page = 1
  loadList()
}

/** 点击状态标签快捷筛选 */
function handleStatusTab(status) {
  query.status = status
  handleSearch()
}

/** 查看订单详情 */
function handleDetail(row) {
  router.push(`/order/detail/${row.id}`)
}

/** 取消订单 */
async function handleCancel(row) {
  try {
    await ElMessageBox.confirm(
      `确定要取消订单「${row.orderNo}」吗？取消后服务费将原路退回用户。`,
      '取消订单确认',
      { confirmButtonText: '确定取消', cancelButtonText: '再想想', type: 'warning' },
    )
  } catch {
    return
  }
  await cancelOrder(row.id, { remark: '管理员手动取消订单' })
  ElMessage.success('订单已取消')
  loadList()
}

/** 判断订单当前是否允许取消 */
function canCancel(row) {
  return !['已完成', '已取消'].includes(row.status)
}

onMounted(loadList)
</script>

<template>
  <div class="page-container">
    <PageHeader title="订单列表" description="查询平台各类服务订单，支持按状态、时间与服务类型组合筛选" />

    <!-- 状态快捷筛选 -->
    <div class="order-tabs app-card">
      <div class="order-tabs__inner">
        <span class="order-tabs__label">订单状态：</span>
        <el-radio-group v-model="query.status" @change="handleStatusTab">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button v-for="item in ORDER_STATUS" :key="item" :value="item">
            {{ item }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <SearchBar :loading="loading" @search="handleSearch" @reset="handleReset">
      <el-form-item label="关键字">
        <el-input
          v-model="query.keyword"
          placeholder="订单号 / 用户 / 志愿者"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="服务类型">
        <el-select v-model="query.type" placeholder="全部类型" clearable>
          <el-option v-for="item in SERVICE_CATEGORIES" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="下单时间">
        <el-date-picker
          v-model="query.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </SearchBar>

    <div class="app-card">
      <div class="app-card__body">
        <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
          <el-table-column label="订单号" width="160">
            <template #default="{ row }">
              <el-button link type="primary" class="order-no" @click="handleDetail(row)">
                {{ row.orderNo }}
              </el-button>
            </template>
          </el-table-column>

          <el-table-column label="服务信息" min-width="200">
            <template #default="{ row }">
              <div class="order-service">
                <span class="order-service__name">{{ row.serviceName }}</span>
                <span class="order-service__meta">
                  {{ row.type }} · {{ formatMoney(row.servicePrice) }} × {{ row.quantity }}
                </span>
              </div>
            </template>
          </el-table-column>

          <!-- 下单人与志愿者合并展示，避免 1366 分辨率下表格横向溢出 -->
          <el-table-column label="下单人 / 志愿者" width="140">
            <template #default="{ row }">
              <div class="order-user">
                <span class="order-user__name">{{ row.userName }}</span>
                <span class="order-user__phone">
                  {{ row.volunteerName || '待分配志愿者' }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="订单金额" width="105" align="center" sortable prop="amount">
            <template #default="{ row }">
              <span class="order-amount">{{ formatMoney(row.amount) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="下单时间" width="162" align="center">
            <template #default="{ row }">{{ formatDate(row.orderTime, 'YYYY-MM-DD HH:mm') }}</template>
          </el-table-column>

          <el-table-column label="状态" width="95" align="center">
            <template #default="{ row }">
              <StatusTag :status="row.status" dot />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="125" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
              <el-button v-if="canCancel(row)" link type="danger" @click="handleCancel(row)">
                取消
              </el-button>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="暂无符合条件的订单" :image-size="90" />
          </template>
        </el-table>

        <div class="app-pagination">
          <el-pagination
            :current-page="query.page"
            :page-size="query.pageSize"
            :page-sizes="PAGE_SIZES"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.order-tabs {
  padding: 12px 16px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.order-tabs__inner {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.order-tabs__label {
  font-size: 13px;
  color: var(--app-text-secondary);
  flex-shrink: 0;
}

.order-no {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 13px;
}

.order-service {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-service__name {
  font-weight: 500;
  color: var(--app-text-primary);
}

.order-service__meta {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.order-user {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-user__name {
  font-weight: 500;
  color: var(--app-text-primary);
}

.order-user__phone {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.order-amount {
  font-weight: 600;
  color: var(--app-primary);
}
</style>
