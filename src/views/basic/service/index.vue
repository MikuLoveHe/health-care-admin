<script setup>
/**
 * 基础管理 - 服务管理
 * 功能：服务列表增删改查、上下架状态切换、服务分类筛选
 */
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createService,
  deleteService,
  getServiceList,
  updateService,
  updateServiceStatus,
} from '@/api/basic'
import { SERVICE_CATEGORIES, SHELF_STATUS, PAGE_SIZES } from '@/utils/constants'
import { formatDate, formatMoney } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import StatusTag from '@/components/StatusTag.vue'

/* ------------------------------ 列表查询 ------------------------------ */
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const query = reactive({
  keyword: '',
  category: '',
  status: '',
  page: 1,
  pageSize: 10,
})

async function loadList() {
  loading.value = true
  try {
    const data = await getServiceList(query)
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查询：条件变化后回到第一页 */
function handleSearch() {
  query.page = 1
  loadList()
}

/** 重置筛选条件 */
function handleReset() {
  query.keyword = ''
  query.category = ''
  query.status = ''
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

/* ------------------------------ 新增 / 编辑 ------------------------------ */
const dialogVisible = ref(false)
const dialogMode = ref('create') // 'create' | 'edit'
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  category: '',
  price: 0,
  duration: 30,
  unit: '次',
  provider: '',
  description: '',
  cover: '',
  status: '已上架',
})

const rules = {
  name: [
    { required: true, message: '请输入服务名称', trigger: 'blur' },
    { max: 30, message: '服务名称不超过 30 个字', trigger: 'blur' },
  ],
  category: [{ required: true, message: '请选择服务分类', trigger: 'change' }],
  price: [
    { required: true, message: '请输入服务价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能为负数', trigger: 'blur' },
  ],
  duration: [
    { required: true, message: '请输入服务时长', trigger: 'blur' },
    { type: 'number', min: 1, message: '服务时长至少 1 分钟', trigger: 'blur' },
  ],
  provider: [{ required: true, message: '请输入服务提供方', trigger: 'blur' }],
}

/** 打开新增弹窗 */
function handleCreate() {
  dialogMode.value = 'create'
  Object.assign(form, {
    id: null,
    name: '',
    category: '',
    price: 0,
    duration: 30,
    unit: '次',
    provider: '',
    description: '',
    cover: '',
    status: '已上架',
  })
  dialogVisible.value = true
}

/** 打开编辑弹窗 */
function handleEdit(row) {
  dialogMode.value = 'edit'
  Object.assign(form, row)
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await createService({ ...form })
    } else {
      await updateService(form.id, { ...form })
    }
    ElMessage.success(dialogMode.value === 'create' ? '新增成功' : '保存成功')
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

/* ------------------------------ 删除 ------------------------------ */
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除服务「${row.name}」吗？删除后不可恢复。`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return // 用户取消
  }
  await deleteService(row.id)
  ElMessage.success('删除成功')
  // 删掉当前页最后一条时回退一页，避免出现空页
  if (tableData.value.length === 1 && query.page > 1) query.page -= 1
  loadList()
}

/* ------------------------------ 上下架 ------------------------------ */
async function handleToggleStatus(row) {
  const nextStatus = row.status === '已上架' ? '已下架' : '已上架'
  const actionText = nextStatus === '已上架' ? '上架' : '下架'

  try {
    await ElMessageBox.confirm(`确定要${actionText}服务「${row.name}」吗？`, `${actionText}确认`, {
      confirmButtonText: `确定${actionText}`,
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  await updateServiceStatus(row.id, nextStatus)
  ElMessage.success(`${actionText}成功`)
  loadList()
}

/* ------------------------------ 详情抽屉 ------------------------------ */
const detailVisible = ref(false)
const detail = ref({})

function handleView(row) {
  detail.value = row
  detailVisible.value = true
}

onMounted(loadList)
</script>

<template>
  <div class="page-container">
    <PageHeader title="服务管理" description="管理用户端上架的各类养老服务，支持上下架与分类筛选">
      <template #extra>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增服务
        </el-button>
      </template>
    </PageHeader>

    <!-- 搜索栏 -->
    <SearchBar :loading="loading" @search="handleSearch" @reset="handleReset">
      <el-form-item label="服务名称">
        <el-input v-model="query.keyword" placeholder="名称 / 提供方" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="服务分类">
        <el-select v-model="query.category" placeholder="全部分类" clearable>
          <el-option v-for="item in SERVICE_CATEGORIES" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="上架状态">
        <el-select v-model="query.status" placeholder="全部状态" clearable>
          <el-option v-for="item in SHELF_STATUS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
    </SearchBar>

    <!-- 表格 -->
    <div class="app-card">
      <div class="app-card__body">
        <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
          <el-table-column type="index" label="#" width="55" align="center" />

          <!-- 时长、评分等次要属性折进本列，避免 1366 分辨率下表格横向溢出 -->
          <el-table-column label="服务信息" min-width="240">
            <template #default="{ row }">
              <div class="service-info">
                <el-image :src="row.cover" fit="cover" class="service-info__cover" />
                <div class="service-info__text">
                  <span class="service-info__name">{{ row.name }}</span>
                  <span class="service-info__provider">{{ row.provider }}</span>
                  <span class="service-info__meta">
                    {{ row.duration }} 分钟 · 评分 {{ row.rating }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="category" label="服务分类" width="100" align="center" />

          <el-table-column label="价格" width="118" align="center">
            <template #default="{ row }">
              <span class="service-price">{{ formatMoney(row.price) }}</span>
              <span class="app-text-secondary">/{{ row.unit }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="sales" label="销量" width="80" align="center" sortable />

          <el-table-column label="状态" width="105" align="center">
            <template #default="{ row }">
              <StatusTag :status="row.status" dot />
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="112" align="center">
            <template #default="{ row }">{{ formatDate(row.createTime, 'YYYY-MM-DD') }}</template>
          </el-table-column>

          <el-table-column label="操作" width="185" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleView(row)">详情</el-button>
              <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button
                link
                :type="row.status === '已上架' ? 'warning' : 'success'"
                @click="handleToggleStatus(row)"
              >
                {{ row.status === '已上架' ? '下架' : '上架' }}
              </el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="暂无服务数据" :image-size="90" />
          </template>
        </el-table>

        <!-- 分页 -->
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

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增服务' : '编辑服务'"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="服务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入服务名称" maxlength="30" show-word-limit />
        </el-form-item>

        <el-form-item label="服务分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="item in SERVICE_CATEGORIES" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="服务价格" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" :step="5" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计价单位" prop="unit">
              <el-select v-model="form.unit" style="width: 100%">
                <el-option label="次" value="次" />
                <el-option label="小时" value="小时" />
                <el-option label="天" value="天" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="服务时长" prop="duration">
              <el-input-number v-model="form.duration" :min="1" :step="10" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上架状态">
              <el-radio-group v-model="form.status">
                <el-radio v-for="item in SHELF_STATUS" :key="item" :value="item">{{ item }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="服务提供方" prop="provider">
          <el-input v-model="form.provider" placeholder="请输入服务提供机构名称" />
        </el-form-item>

        <el-form-item label="服务说明">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请填写服务内容、注意事项等"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="服务详情" size="440px">
      <div v-if="detail.id" class="service-detail">
        <el-image :src="detail.cover" fit="cover" class="service-detail__cover" />
        <h3 class="service-detail__name">{{ detail.name }}</h3>
        <StatusTag :status="detail.status" dot />

        <el-descriptions :column="1" border class="service-detail__desc">
          <el-descriptions-item label="服务分类">{{ detail.category }}</el-descriptions-item>
          <el-descriptions-item label="服务价格">
            {{ formatMoney(detail.price) }} / {{ detail.unit }}
          </el-descriptions-item>
          <el-descriptions-item label="服务时长">{{ detail.duration }} 分钟</el-descriptions-item>
          <el-descriptions-item label="服务提供方">{{ detail.provider }}</el-descriptions-item>
          <el-descriptions-item label="累计销量">{{ detail.sales }}</el-descriptions-item>
          <el-descriptions-item label="综合评分">{{ detail.rating }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.createTime }}</el-descriptions-item>
          <el-descriptions-item label="服务说明">{{ detail.description }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.service-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.service-info__cover {
  width: 52px;
  height: 40px;
  flex-shrink: 0;
  border-radius: $radius-sm;
}

.service-info__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.service-info__name {
  font-weight: 500;
  color: var(--app-text-primary);
  /* 名称过长时省略，避免撑宽表格 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-info__provider {
  font-size: 12px;
  color: var(--app-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-info__meta {
  font-size: 12px;
  color: var(--app-text-placeholder);
}

.service-price {
  font-weight: 600;
  color: var(--app-primary);
}

/* ------------------------------ 详情抽屉 ------------------------------ */
.service-detail__cover {
  width: 100%;
  height: 160px;
  border-radius: $radius-md;
  margin-bottom: 14px;
}

.service-detail__name {
  font-size: 17px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 8px;
}

.service-detail__desc {
  margin-top: 16px;
}
</style>
