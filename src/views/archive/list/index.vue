<script setup>
/**
 * 档案管理 - 档案列表
 * 功能：老人信息列表、按辖区/年龄筛选、搜索
 */
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteArchive, getArchiveList, getCommunityList } from '@/api/archive'
import { AGE_RANGES, HEALTH_STATUS, PAGE_SIZES } from '@/utils/constants'
import { formatDate, maskIdCard, maskPhone } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import StatusTag from '@/components/StatusTag.vue'

const router = useRouter()

/* ------------------------------ 列表查询 ------------------------------ */
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const communityList = ref([])

const query = reactive({
  keyword: '',
  districtId: '',
  ageRange: null,
  healthStatus: '',
  page: 1,
  pageSize: 10,
})

async function loadList() {
  loading.value = true
  try {
    const data = await getArchiveList(query)
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function loadCommunities() {
  communityList.value = await getCommunityList()
}

function handleSearch() {
  query.page = 1
  loadList()
}

function handleReset() {
  query.keyword = ''
  query.districtId = ''
  query.ageRange = null
  query.healthStatus = ''
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
const showSensitive = ref(false)

function handleView(row) {
  detail.value = { ...row }
  showSensitive.value = false
  detailVisible.value = true
}

/* ------------------------------ 删除 ------------------------------ */
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除「${row.name}」的档案吗？删除后该老人的服务记录将无法追溯。`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  await deleteArchive(row.id)
  ElMessage.success('删除成功')
  if (tableData.value.length === 1 && query.page > 1) query.page -= 1
  loadList()
}

/** 跳转录入页（编辑模式） */
function handleEdit(row) {
  router.push({ path: '/archive/create', query: { id: row.id } })
}

onMounted(() => {
  loadList()
  loadCommunities()
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="档案列表" description="管理辖区内 65 岁以上老人信息档案，支持按辖区、年龄段筛选">
      <template #extra>
        <el-button @click="router.push('/archive/import')">
          <el-icon><UploadFilled /></el-icon>
          批量导入
        </el-button>
        <el-button type="primary" @click="router.push('/archive/create')">
          <el-icon><Plus /></el-icon>
          档案录入
        </el-button>
      </template>
    </PageHeader>

    <SearchBar :loading="loading" @search="handleSearch" @reset="handleReset">
      <el-form-item label="关键字">
        <el-input
          v-model="query.keyword"
          placeholder="姓名 / 身份证 / 电话"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="所属社区">
        <el-select v-model="query.districtId" placeholder="全部社区" clearable filterable>
          <el-option
            v-for="item in communityList"
            :key="item.id"
            :label="item.fullName"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="年龄段">
        <el-select v-model="query.ageRange" placeholder="全部年龄" clearable>
          <el-option
            v-for="item in AGE_RANGES"
            :key="item.label"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="健康情况">
        <el-select v-model="query.healthStatus" placeholder="全部情况" clearable>
          <el-option v-for="item in HEALTH_STATUS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
    </SearchBar>

    <div class="app-card">
      <div class="app-card__body">
        <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
          <el-table-column type="index" label="#" width="55" align="center" />

          <el-table-column label="老人信息" min-width="138">
            <template #default="{ row }">
              <div class="elder">
                <el-avatar :size="34" class="elder__avatar">{{ row.name.slice(0, 1) }}</el-avatar>
                <div class="elder__text">
                  <span class="elder__name">{{ row.name }}</span>
                  <span class="elder__meta">{{ row.gender }} · {{ row.age }} 岁</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="身份证号" width="160" align="center">
            <template #default="{ row }">
              <span class="mono">{{ maskIdCard(row.idCard) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="联系电话" width="120" align="center">
            <template #default="{ row }">{{ maskPhone(row.phone) }}</template>
          </el-table-column>

          <el-table-column label="所属社区" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="app-text-secondary">{{ row.districtName }}</span>
            </template>
          </el-table-column>

          <!-- 健康情况与慢病合并展示，避免 1366 分辨率下表格横向溢出 -->
          <el-table-column label="健康情况" min-width="120">
            <template #default="{ row }">
              <div class="health-cell">
                <StatusTag :status="row.healthStatus" dot />
                <span v-if="row.diseases?.length" class="health-cell__disease">
                  {{ row.diseases.slice(0, 2).join('、') }}{{ row.diseases.length > 2 ? ' 等' : '' }}
                </span>
                <span v-else class="app-text-secondary">无慢病</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="护理等级" width="95" align="center">
            <template #default="{ row }">
              <StatusTag :status="row.careLevel" />
            </template>
          </el-table-column>

          <el-table-column label="建档时间" width="115" align="center">
            <template #default="{ row }">{{ formatDate(row.createTime, 'YYYY-MM-DD') }}</template>
          </el-table-column>

          <el-table-column label="操作" width="145" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleView(row)">详情</el-button>
              <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="暂无档案数据，可点击右上角录入或批量导入" :image-size="90" />
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

    <!-- 档案详情抽屉 -->
    <el-drawer v-model="detailVisible" title="老人档案详情" size="520px">
      <div v-if="detail.id" class="archive-detail">
        <div class="archive-detail__header">
          <el-avatar :size="60" class="archive-detail__avatar">
            {{ detail.name?.slice(0, 1) }}
          </el-avatar>
          <div class="archive-detail__basic">
            <h3>{{ detail.name }}</h3>
            <div class="archive-detail__tags">
              <StatusTag :status="detail.healthStatus" dot />
              <el-tag type="info" round>{{ detail.gender }} · {{ detail.age }} 岁</el-tag>
              <StatusTag :status="detail.careLevel" />
            </div>
          </div>
        </div>

        <div class="archive-detail__switch">
          <span class="app-text-secondary">敏感信息已脱敏显示</span>
          <el-switch v-model="showSensitive" active-text="显示明文" size="small" />
        </div>

        <h4 class="archive-detail__section">基本信息</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="档案编号">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">
            {{ showSensitive ? detail.idCard : maskIdCard(detail.idCard) }}
          </el-descriptions-item>
          <el-descriptions-item label="出生日期">{{ detail.birthDate }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ showSensitive ? detail.phone : maskPhone(detail.phone) }}
          </el-descriptions-item>
          <el-descriptions-item label="所属社区">{{ detail.districtName }}</el-descriptions-item>
          <el-descriptions-item label="详细地址">{{ detail.address }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="archive-detail__section">健康信息</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="健康情况">{{ detail.healthStatus }}</el-descriptions-item>
          <el-descriptions-item label="慢性疾病">
            <template v-if="detail.diseases?.length">
              <el-tag
                v-for="disease in detail.diseases"
                :key="disease"
                size="small"
                type="warning"
                round
                class="disease-tag"
              >
                {{ disease }}
              </el-tag>
            </template>
            <span v-else>无</span>
          </el-descriptions-item>
          <el-descriptions-item label="护理等级">{{ detail.careLevel }}</el-descriptions-item>
          <el-descriptions-item label="残疾情况">{{ detail.disability }}</el-descriptions-item>
          <el-descriptions-item label="补贴类型">{{ detail.subsidyType }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="archive-detail__section">监护人信息</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="监护人">{{ detail.guardian }}</el-descriptions-item>
          <el-descriptions-item label="与老人关系">{{ detail.guardianRelation }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ detail.guardianPhone ? maskPhone(detail.guardianPhone) : '—' }}
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="archive-detail__section">档案记录</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="建档时间">{{ detail.createTime }}</el-descriptions-item>
          <el-descriptions-item label="最近更新">{{ detail.updateTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.elder {
  display: flex;
  align-items: center;
  gap: 10px;
}

.elder__avatar {
  flex-shrink: 0;
  background-color: var(--app-accent);
  color: #fff;
  font-size: 13px;
}

.elder__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.elder__name {
  font-weight: 500;
  color: var(--app-text-primary);
}

.elder__meta {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.mono {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
}

.disease-tag {
  margin: 2px 4px 2px 0;
}

.health-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.health-cell__disease {
  font-size: 12px;
  color: var(--app-text-secondary);
  line-height: 1.4;
}

/* ------------------------------ 详情抽屉 ------------------------------ */
.archive-detail__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-border-light);
}

.archive-detail__avatar {
  flex-shrink: 0;
  background-color: var(--app-accent);
  color: #fff;
  font-size: 22px;
}

.archive-detail__basic h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.archive-detail__tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.archive-detail__switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0;
  font-size: 13px;
}

.archive-detail__section {
  margin: 20px 0 10px;
  padding-left: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-primary);
  border-left: 3px solid var(--app-primary);
}
</style>
