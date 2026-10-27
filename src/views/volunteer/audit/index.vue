<script setup>
/**
 * 志愿者管理 - 志愿者申请审核
 * 功能：待审核列表、资质查看、通过/驳回操作
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { auditApplication, getApplicationList } from '@/api/volunteer'
import { PAGE_SIZES } from '@/utils/constants'
import { formatDate } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import StatusTag from '@/components/StatusTag.vue'

/* ------------------------------ 列表查询 ------------------------------ */
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const query = reactive({
  keyword: '',
  dateRange: [],
  page: 1,
  pageSize: 10,
})

async function loadList() {
  loading.value = true
  try {
    const data = await getApplicationList(query)
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

/* ------------------------------ 资质查看抽屉 ------------------------------ */
const detailVisible = ref(false)
const current = ref({})

function handleView(row) {
  current.value = { ...row }
  detailVisible.value = true
}

/* ------------------------------ 审核操作 ------------------------------ */
const auditVisible = ref(false)
const auditSubmitting = ref(false)
const auditFormRef = ref(null)

const auditForm = reactive({
  id: null,
  name: '',
  result: '已通过',
  remark: '',
})

const auditRules = {
  result: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  remark: [
    {
      // 驳回必须说明原因，避免志愿者不知道如何修改
      validator: (_rule, value, callback) => {
        if (auditForm.result === '已驳回' && !value?.trim()) {
          callback(new Error('驳回时必须填写驳回原因'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

/** 打开审核弹窗 */
function handleAudit(row, result = '已通过') {
  Object.assign(auditForm, {
    id: row.id,
    name: row.name,
    result,
    remark: '',
  })
  detailVisible.value = false
  auditVisible.value = true
}

/** 表格中的快捷「通过」按钮，先二次确认再提交 */
async function handleQuickPass(row) {
  const hasCertificate = row.certificates?.length > 0
  try {
    await ElMessageBox.confirm(
      `确定要通过志愿者「${row.name}」的资质申请吗？${
        hasCertificate ? '' : '注意：该申请未上传任何证件材料。'
      }`,
      '通过确认',
      { confirmButtonText: '确定通过', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  await auditApplication(row.id, { result: '已通过', remark: '资质齐全，审核通过' })
  ElMessage.success('已通过审核')
  if (tableData.value.length === 1 && query.page > 1) query.page -= 1
  loadList()
}

async function handleAuditSubmit() {
  if (!auditFormRef.value) return
  const valid = await auditFormRef.value.validate().catch(() => false)
  if (!valid) return

  auditSubmitting.value = true
  try {
    await auditApplication(auditForm.id, {
      result: auditForm.result,
      remark: auditForm.remark || (auditForm.result === '已通过' ? '资质齐全，审核通过' : ''),
    })
    ElMessage.success(auditForm.result === '已通过' ? '已通过审核' : '已驳回申请')
    auditVisible.value = false
    if (tableData.value.length === 1 && query.page > 1) query.page -= 1
    loadList()
  } finally {
    auditSubmitting.value = false
  }
}

/** 统计信息：本次待审核总数 */
const pendingCount = computed(() => total.value)

onMounted(loadList)
</script>

<template>
  <div class="page-container">
    <PageHeader title="志愿者申请审核" description="审核用户端提交的志愿者资质申请，确认后可为其派单">
      <template #extra>
        <el-tag type="warning" size="large" round>
          <el-icon><Bell /></el-icon>
          待审核 {{ pendingCount }} 条
        </el-tag>
      </template>
    </PageHeader>

    <SearchBar :loading="loading" @search="handleSearch" @reset="handleReset">
      <el-form-item label="志愿者">
        <el-input v-model="query.keyword" placeholder="姓名 / 手机号" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="申请时间">
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
          <el-table-column type="index" label="#" width="55" align="center" />

          <el-table-column label="志愿者" min-width="170">
            <template #default="{ row }">
              <div class="applicant">
                <el-avatar :size="34" :src="row.avatar" class="applicant__avatar">
                  {{ row.name.slice(0, 1) }}
                </el-avatar>
                <div class="applicant__text">
                  <span class="applicant__name">{{ row.name }}</span>
                  <span class="applicant__meta">{{ row.gender }} · {{ row.age }} 岁</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="phone" label="联系电话" width="120" align="center" />

          <el-table-column label="申请社区" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="app-text-secondary">{{ row.community?.fullName }}</span>
            </template>
          </el-table-column>

          <el-table-column label="技能特长" min-width="140">
            <template #default="{ row }">
              <el-tag
                v-for="skill in (row.skills || []).slice(0, 2)"
                :key="skill"
                size="small"
                type="info"
                round
                class="skill-tag"
              >
                {{ skill }}
              </el-tag>
              <el-tooltip
                v-if="row.skills?.length > 2"
                :content="row.skills.slice(2).join('、')"
                placement="top"
              >
                <el-tag size="small" type="info" round class="skill-tag">
                  +{{ row.skills.length - 2 }}
                </el-tag>
              </el-tooltip>
            </template>
          </el-table-column>

          <el-table-column label="证件" width="85" align="center">
            <template #default="{ row }">
              <el-badge :value="row.certificates?.length || 0" type="primary" :offset="[-2, 2]">
                <el-button link type="primary" @click="handleView(row)">
                  <el-icon><Picture /></el-icon>
                  查看
                </el-button>
              </el-badge>
            </template>
          </el-table-column>

          <el-table-column label="申请时间" width="105" align="center">
            <template #default="{ row }">{{ formatDate(row.applyTime, 'YYYY-MM-DD') }}</template>
          </el-table-column>

          <el-table-column label="状态" width="95" align="center">
            <template #default="{ row }">
              <StatusTag :status="row.qualificationStatus" dot />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="165" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleView(row)">资质</el-button>
              <el-button link type="success" @click="handleQuickPass(row)">通过</el-button>
              <el-button link type="danger" @click="handleAudit(row, '已驳回')">驳回</el-button>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="暂无待审核申请，所有申请都已处理完毕" :image-size="90" />
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

    <!-- 资质查看抽屉 -->
    <el-drawer v-model="detailVisible" title="资质材料审核" size="560px">
      <div v-if="current.id" class="audit-detail">
        <!-- 申请人信息 -->
        <div class="audit-detail__header">
          <el-avatar :size="60" :src="current.avatar" class="audit-detail__avatar">
            {{ current.name?.slice(0, 1) }}
          </el-avatar>
          <div class="audit-detail__basic">
            <h3>{{ current.name }}</h3>
            <div class="audit-detail__tags">
              <StatusTag :status="current.qualificationStatus" dot />
              <el-tag type="info" round>{{ current.gender }} · {{ current.age }} 岁</el-tag>
            </div>
          </div>
        </div>

        <el-descriptions :column="2" border class="audit-detail__desc">
          <el-descriptions-item label="联系电话">{{ current.phone }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">
            {{ formatDate(current.applyTime, 'YYYY-MM-DD') }}
          </el-descriptions-item>
          <el-descriptions-item label="申请社区" :span="2">
            {{ current.community?.fullName }}
          </el-descriptions-item>
          <el-descriptions-item label="技能特长" :span="2">
            <el-tag
              v-for="skill in current.skills"
              :key="skill"
              size="small"
              type="info"
              round
              class="skill-tag"
            >
              {{ skill }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 证件材料预览 -->
        <h4 class="audit-detail__section-title">
          <el-icon><Files /></el-icon>
          证件材料
          <span class="app-text-secondary">（点击图片可放大查看）</span>
        </h4>

        <div v-if="current.certificates?.length" class="certificate-list">
          <div v-for="cert in current.certificates" :key="cert.name" class="certificate-item">
            <el-image
              :src="cert.url"
              fit="cover"
              class="certificate-item__image"
              :preview-src-list="current.certificates.map((item) => item.url)"
              :initial-index="current.certificates.indexOf(cert)"
              preview-teleported
            />
            <div class="certificate-item__meta">
              <span class="certificate-item__name">{{ cert.name }}</span>
              <el-tag size="small" type="info" round>{{ cert.type }}</el-tag>
            </div>
          </div>
        </div>
        <el-empty v-else description="该申请未上传证件材料" :image-size="80" />

        <!-- 审核操作区 -->
        <div class="audit-detail__actions">
          <el-button type="danger" plain size="large" @click="handleAudit(current, '已驳回')">
            <el-icon><CloseBold /></el-icon>
            驳回申请
          </el-button>
          <el-button type="success" size="large" @click="handleAudit(current, '已通过')">
            <el-icon><Select /></el-icon>
            通过审核
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 审核弹窗 -->
    <el-dialog v-model="auditVisible" title="审核确认" width="500px" destroy-on-close>
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="90px">
        <el-form-item label="志愿者">
          <span class="audit-form__name">{{ auditForm.name }}</span>
        </el-form-item>

        <el-form-item label="审核结果" prop="result">
          <el-radio-group v-model="auditForm.result">
            <el-radio value="已通过">通过申请</el-radio>
            <el-radio value="已驳回">驳回申请</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="审核意见" prop="remark">
          <el-input
            v-model="auditForm.remark"
            type="textarea"
            :rows="3"
            :placeholder="auditForm.result === '已驳回' ? '驳回时必须填写原因，便于志愿者修改后重新提交' : '选填'"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="auditSubmitting"
          @click="handleAuditSubmit"
        >
          提交审核
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.applicant {
  display: flex;
  align-items: center;
  gap: 10px;
}

.applicant__avatar {
  flex-shrink: 0;
  background-color: var(--app-info);
  font-size: 13px;
}

.applicant__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.applicant__name {
  font-weight: 500;
  color: var(--app-text-primary);
}

.applicant__meta {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.skill-tag {
  margin: 2px 4px 2px 0;
}

/* ------------------------------ 审核抽屉 ------------------------------ */
.audit-detail__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-border-light);
}

.audit-detail__avatar {
  flex-shrink: 0;
  background-color: var(--app-info);
  font-size: 22px;
}

.audit-detail__basic h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.audit-detail__tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.audit-detail__desc {
  margin-top: 16px;
}

.audit-detail__section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 22px 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);

  .app-text-secondary {
    font-weight: 400;
    font-size: 12px;
  }
}

/* 证件网格 */
.certificate-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.certificate-item__image {
  width: 100%;
  height: 110px;
  border-radius: $radius-sm;
  border: 1px solid var(--app-border-light);
  cursor: zoom-in;
}

.certificate-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: 6px;
}

.certificate-item__name {
  font-size: 12px;
  color: var(--app-text-regular);
}

/* 底部操作区 */
.audit-detail__actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--app-border-light);

  .el-button {
    flex: 1;
  }
}

.audit-form__name {
  font-weight: 600;
  color: var(--app-text-primary);
}
</style>
