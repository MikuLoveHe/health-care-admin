<script setup>
/**
 * 基础管理 - 用户管理
 * 功能：用户列表、搜索、详情查看、禁用/启用
 */
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDistrictList, getUserList, updateUser, updateUserStatus } from '@/api/basic'
import { GENDERS, PAGE_SIZES, USER_STATUS } from '@/utils/constants'
import { formatDate, maskIdCard, maskPhone } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import StatusTag from '@/components/StatusTag.vue'

/* ------------------------------ 列表查询 ------------------------------ */
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const districtList = ref([])

const query = reactive({
  keyword: '',
  status: '',
  districtId: '',
  page: 1,
  pageSize: 10,
})

async function loadList() {
  loading.value = true
  try {
    const data = await getUserList(query)
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 社区下拉选项：只取第三级（社区），用户归属到社区这一层 */
async function loadDistricts() {
  const data = await getDistrictList()
  districtList.value = data.filter((item) => item.level === 3)
}

function handleSearch() {
  query.page = 1
  loadList()
}

function handleReset() {
  query.keyword = ''
  query.status = ''
  query.districtId = ''
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

/* ------------------------------ 详情抽屉 ------------------------------ */
const detailVisible = ref(false)
const detail = ref({})
/** 详情中默认对敏感信息打码，点击后可查看明文 */
const showSensitive = ref(false)

function handleView(row) {
  detail.value = { ...row }
  showSensitive.value = false
  detailVisible.value = true
}

/* ------------------------------ 编辑 ------------------------------ */
const editVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  gender: '男',
  phone: '',
  districtId: '',
  address: '',
  status: '正常',
})

const rules = {
  name: [{ required: true, message: '请输入用户姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  districtId: [{ required: true, message: '请选择所属社区', trigger: 'change' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
}

function handleEdit(row) {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    gender: row.gender,
    phone: row.phone,
    districtId: row.districtId,
    address: row.address,
    status: row.status,
  })
  editVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await updateUser(form.id, { ...form })
    ElMessage.success('保存成功')
    editVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

/* ------------------------------ 禁用 / 启用 ------------------------------ */
async function handleToggleStatus(row) {
  const nextStatus = row.status === '正常' ? '已禁用' : '正常'
  const actionText = nextStatus === '正常' ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(
      `确定要${actionText}用户「${row.name}」吗？${
        nextStatus === '已禁用' ? '禁用后该用户将无法登录用户端。' : ''
      }`,
      `${actionText}确认`,
      { confirmButtonText: `确定${actionText}`, cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  await updateUserStatus(row.id, nextStatus)
  ElMessage.success(`已${actionText}该用户`)
  loadList()
}

onMounted(() => {
  loadList()
  loadDistricts()
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="用户管理" description="管理平台注册用户，支持搜索、详情查看与禁用启用" />

    <SearchBar :loading="loading" @search="handleSearch" @reset="handleReset">
      <el-form-item label="关键字">
        <el-input
          v-model="query.keyword"
          placeholder="姓名 / 手机号 / 身份证"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="所属社区">
        <el-select v-model="query.districtId" placeholder="全部社区" clearable filterable>
          <el-option
            v-for="item in districtList"
            :key="item.id"
            :label="item.fullName"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="账号状态">
        <el-select v-model="query.status" placeholder="全部状态" clearable>
          <el-option v-for="item in USER_STATUS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
    </SearchBar>

    <div class="app-card">
      <div class="app-card__body">
        <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
          <el-table-column type="index" label="#" width="55" align="center" />

          <el-table-column label="用户" min-width="180">
            <template #default="{ row }">
              <div class="user-info">
                <el-avatar :size="34" :src="row.avatar" class="user-info__avatar">
                  {{ row.name.slice(0, 1) }}
                </el-avatar>
                <div class="user-info__text">
                  <span class="user-info__name">{{ row.name }}</span>
                  <span class="user-info__meta">{{ row.gender }} · {{ row.age }} 岁</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="手机号" width="130" align="center">
            <template #default="{ row }">{{ maskPhone(row.phone) }}</template>
          </el-table-column>

          <el-table-column label="所属社区" min-width="180">
            <template #default="{ row }">
              <span class="app-text-secondary">{{ row.districtName }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="orderCount" label="订单数" width="90" align="center" sortable />

          <!-- 注册与最近登录合并展示，避免 1366 分辨率下表格横向溢出 -->
          <el-table-column label="注册 / 最近登录" width="160" align="center">
            <template #default="{ row }">
              <div class="login-time">
                <span>{{ formatDate(row.registerTime, 'YYYY-MM-DD') }}</span>
                <span class="app-text-secondary">{{ formatDate(row.lastLoginTime, 'YYYY-MM-DD') }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="95" align="center">
            <template #default="{ row }">
              <StatusTag :status="row.status" dot />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="165" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleView(row)">详情</el-button>
              <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button
                link
                :type="row.status === '正常' ? 'danger' : 'success'"
                @click="handleToggleStatus(row)"
              >
                {{ row.status === '正常' ? '禁用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="暂无用户数据" :image-size="90" />
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

    <!-- 用户详情抽屉 -->
    <el-drawer v-model="detailVisible" title="用户详情" size="460px">
      <div v-if="detail.id" class="user-detail">
        <div class="user-detail__header">
          <el-avatar :size="64" :src="detail.avatar" class="user-detail__avatar">
            {{ detail.name?.slice(0, 1) }}
          </el-avatar>
          <div class="user-detail__basic">
            <h3>{{ detail.name }}</h3>
            <div class="user-detail__tags">
              <StatusTag :status="detail.status" dot />
              <el-tag type="info" round>{{ detail.gender }}</el-tag>
              <el-tag type="info" round>{{ detail.age }} 岁</el-tag>
            </div>
          </div>
        </div>

        <!-- 敏感信息默认打码，点击切换明文 -->
        <div class="user-detail__switch">
          <span class="app-text-secondary">敏感信息已脱敏显示</span>
          <el-switch
            v-model="showSensitive"
            active-text="显示明文"
            inactive-text=""
            size="small"
          />
        </div>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户编号">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="手机号">
            {{ showSensitive ? detail.phone : maskPhone(detail.phone) }}
          </el-descriptions-item>
          <el-descriptions-item label="身份证号">
            {{ showSensitive ? detail.idCard : maskIdCard(detail.idCard) }}
          </el-descriptions-item>
          <el-descriptions-item label="所属社区">{{ detail.districtName }}</el-descriptions-item>
          <el-descriptions-item label="详细地址">{{ detail.address }}</el-descriptions-item>
          <el-descriptions-item label="累计订单">{{ detail.orderCount }} 单</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ detail.registerTime }}</el-descriptions-item>
          <el-descriptions-item label="最近登录">{{ detail.lastLoginTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editVisible" title="编辑用户" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio v-for="item in GENDERS" :key="item" :value="item">{{ item }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="所属社区" prop="districtId">
          <el-select v-model="form.districtId" placeholder="请选择社区" filterable style="width: 100%">
            <el-option
              v-for="item in districtList"
              :key="item.id"
              :label="item.fullName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="form.address" type="textarea" :rows="2" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="账号状态">
          <el-radio-group v-model="form.status">
            <el-radio v-for="item in USER_STATUS" :key="item" :value="item">{{ item }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info__avatar {
  flex-shrink: 0;
  background-color: var(--app-primary);
  font-size: 13px;
}

.user-info__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-info__name {
  font-weight: 500;
  color: var(--app-text-primary);
}

.user-info__meta {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.login-time {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  line-height: 1.4;
}

/* ------------------------------ 详情抽屉 ------------------------------ */
.user-detail__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-border-light);
}

.user-detail__avatar {
  flex-shrink: 0;
  background-color: var(--app-primary);
  font-size: 24px;
}

.user-detail__basic h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.user-detail__tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.user-detail__switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0 12px;
  font-size: 13px;
}
</style>
