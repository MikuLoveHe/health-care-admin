<script setup>
/**
 * 志愿者管理 - 志愿者列表
 * 功能：手动添加、编辑、查询、资质状态显示
 */
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createVolunteer,
  deleteVolunteer,
  getCommunityList,
  getSkillList,
  getVolunteerList,
  updateVolunteer,
} from '@/api/volunteer'
import { GENDERS, PAGE_SIZES, QUALIFICATION_STATUS } from '@/utils/constants'
import { formatDate } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import StatusTag from '@/components/StatusTag.vue'

const router = useRouter()

/* ------------------------------ 列表查询 ------------------------------ */
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const communityList = ref([])
const skillList = ref([])

const query = reactive({
  keyword: '',
  qualificationStatus: '',
  skill: '',
  page: 1,
  pageSize: 10,
})

async function loadList() {
  loading.value = true
  try {
    const data = await getVolunteerList(query)
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function loadDictionaries() {
  const [communities, skills] = await Promise.all([getCommunityList(), getSkillList()])
  communityList.value = communities
  skillList.value = skills
}

function handleSearch() {
  query.page = 1
  loadList()
}

function handleReset() {
  query.keyword = ''
  query.qualificationStatus = ''
  query.skill = ''
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
const dialogMode = ref('create')
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  gender: '男',
  age: 30,
  phone: '',
  community: null,
  skills: [],
  qualificationStatus: '已通过',
})

const rules = {
  name: [{ required: true, message: '请输入志愿者姓名', trigger: 'blur' }],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 18, max: 70, message: '志愿者年龄需在 18 到 70 岁之间', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  community: [{ required: true, message: '请选择所属社区', trigger: 'change' }],
  skills: [
    { required: true, type: 'array', min: 1, message: '请至少选择一项技能特长', trigger: 'change' },
  ],
}

function handleCreate() {
  dialogMode.value = 'create'
  Object.assign(form, {
    id: null,
    name: '',
    gender: '男',
    age: 30,
    phone: '',
    community: null,
    skills: [],
    qualificationStatus: '已通过',
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: row.id,
    name: row.name,
    gender: row.gender,
    age: row.age,
    phone: row.phone,
    community: row.community,
    skills: [...(row.skills || [])],
    qualificationStatus: row.qualificationStatus,
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await createVolunteer({ ...form })
    } else {
      await updateVolunteer(form.id, { ...form })
    }
    ElMessage.success(dialogMode.value === 'create' ? '添加成功' : '保存成功')
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
      `确定要删除志愿者「${row.name}」吗？删除后其历史服务记录将无法关联。`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  await deleteVolunteer(row.id)
  ElMessage.success('删除成功')
  if (tableData.value.length === 1 && query.page > 1) query.page -= 1
  loadList()
}

/** 跳转资质详情页 */
function handleDetail(row) {
  router.push(`/volunteer/detail/${row.id}`)
}

onMounted(() => {
  loadList()
  loadDictionaries()
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="志愿者列表" description="管理平台在册志愿者，支持手动添加、编辑与资质状态查询">
      <template #extra>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          手动添加志愿者
        </el-button>
      </template>
    </PageHeader>

    <SearchBar :loading="loading" @search="handleSearch" @reset="handleReset">
      <el-form-item label="关键字">
        <el-input v-model="query.keyword" placeholder="姓名 / 手机号" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="资质状态">
        <el-select v-model="query.qualificationStatus" placeholder="全部状态" clearable>
          <el-option v-for="item in QUALIFICATION_STATUS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="技能特长">
        <el-select v-model="query.skill" placeholder="全部技能" clearable>
          <el-option v-for="item in skillList" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
    </SearchBar>

    <div class="app-card">
      <div class="app-card__body">
        <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
          <el-table-column type="index" label="#" width="55" align="center" />

          <el-table-column label="志愿者" min-width="170">
            <template #default="{ row }">
              <div class="volunteer">
                <el-avatar :size="34" :src="row.avatar" class="volunteer__avatar">
                  {{ row.name.slice(0, 1) }}
                </el-avatar>
                <div class="volunteer__text">
                  <span class="volunteer__name">{{ row.name }}</span>
                  <span class="volunteer__meta">{{ row.gender }} · {{ row.age }} 岁</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="phone" label="联系电话" width="120" align="center" />

          <el-table-column label="所属社区" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="app-text-secondary">{{ row.community?.fullName }}</span>
            </template>
          </el-table-column>

          <el-table-column label="技能特长" min-width="150">
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

          <!-- 服务时长与次数合并展示，避免 1366 分辨率下表格横向溢出 -->
          <el-table-column label="服务时长/次数" width="120" align="center" sortable prop="serviceHours">
            <template #default="{ row }">
              <div class="service-stat">
                <span class="volunteer__hours">{{ row.serviceHours }} h</span>
                <span class="app-text-secondary">{{ row.serviceCount }} 次</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="资质状态" width="95" align="center">
            <template #default="{ row }">
              <StatusTag :status="row.qualificationStatus" dot />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="175" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleDetail(row)">资质详情</el-button>
              <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="暂无志愿者数据" :image-size="90" />
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

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '手动添加志愿者' : '编辑志愿者'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="form.gender">
                <el-radio v-for="item in GENDERS" :key="item" :value="item">{{ item }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="年龄" prop="age">
              <el-input-number v-model="form.age" :min="18" :max="70" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="所属社区" prop="community">
          <el-select v-model="form.community" placeholder="请选择社区" filterable style="width: 100%">
            <el-option
              v-for="item in communityList"
              :key="item.id"
              :label="item.fullName"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="技能特长" prop="skills">
          <el-select
            v-model="form.skills"
            multiple
            placeholder="可多选"
            style="width: 100%"
          >
            <el-option v-for="item in skillList" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="资质状态" prop="qualificationStatus">
          <el-select v-model="form.qualificationStatus" style="width: 100%">
            <el-option v-for="item in QUALIFICATION_STATUS" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.volunteer {
  display: flex;
  align-items: center;
  gap: 10px;
}

.volunteer__avatar {
  flex-shrink: 0;
  background-color: var(--app-info);
  font-size: 13px;
}

.volunteer__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.volunteer__name {
  font-weight: 500;
  color: var(--app-text-primary);
}

.volunteer__meta {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.volunteer__hours {
  font-weight: 600;
  color: var(--app-primary);
}

.service-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  line-height: 1.4;
}

.skill-tag {
  margin: 2px 4px 2px 0;
}
</style>
