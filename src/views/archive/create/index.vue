<script setup>
/**
 * 档案管理 - 档案录入
 * 功能：表单录入（姓名、身份证、年龄、健康情况等）
 *
 * 表单按「基本信息 / 健康信息 / 监护人信息」分组，每组一张卡片，
 * 长表单分段后用户填写时不容易迷失。
 * 若路由带 id 参数则进入编辑模式，回填已有档案数据。
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createArchive, getArchiveDetail, getCommunityList, updateArchive } from '@/api/archive'
import {
  CARE_LEVELS,
  DISABILITIES,
  DISEASES,
  GENDERS,
  HEALTH_STATUS,
  RELATIONS,
  SUBSIDY_TYPES,
} from '@/utils/constants'
import { calcAgeByIdCard } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()

const formRef = ref(null)
const submitting = ref(false)
const communityList = ref([])

/** 编辑模式：路由带 id 参数 */
const isEdit = computed(() => Boolean(route.query.id))

const form = reactive({
  name: '',
  gender: '男',
  idCard: '',
  age: 0,
  birthDate: '',
  phone: '',
  districtId: '',
  address: '',
  healthStatus: '健康',
  diseases: [],
  careLevel: '自理',
  disability: '无',
  subsidyType: '无',
  guardian: '',
  guardianPhone: '',
  guardianRelation: '子女',
})

/* ------------------------------ 校验规则 ------------------------------ */

/** 身份证校验码算法（GB 11643-1999），用于校验 18 位身份证号是否合法 */
function validateIdCard(idCard) {
  if (!/^\d{17}[\dXx]$/.test(idCard)) return false
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  const sum = idCard
    .slice(0, 17)
    .split('')
    .reduce((total, char, index) => total + Number(char) * weights[index], 0)
  return codes[sum % 11] === idCard.slice(17).toUpperCase()
}

const rules = {
  name: [
    { required: true, message: '请输入老人姓名', trigger: 'blur' },
    { max: 20, message: '姓名不超过 20 个字', trigger: 'blur' },
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value) return callback()
        if (!/^\d{17}[\dXx]$/.test(value)) {
          return callback(new Error('身份证号应为 18 位'))
        }
        if (!validateIdCard(value)) {
          return callback(new Error('身份证号校验位不正确，请核对'))
        }
        return callback()
      },
      trigger: 'blur',
    },
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  districtId: [{ required: true, message: '请选择所属社区', trigger: 'change' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  healthStatus: [{ required: true, message: '请选择健康情况', trigger: 'change' }],
  guardian: [{ required: true, message: '请输入监护人姓名', trigger: 'blur' }],
  guardianPhone: [
    { required: true, message: '请输入监护人联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
}

/**
 * 身份证号变化时自动计算年龄与出生日期。
 * 年龄由证件号推导，比手动输入更可靠，也避免前后不一致。
 */
function handleIdCardChange(value) {
  if (!value || value.length !== 18) return
  const age = calcAgeByIdCard(value)
  if (age > 0) {
    form.age = age
    form.birthDate = `${value.slice(6, 10)}-${value.slice(10, 12)}-${value.slice(12, 14)}`
  }
}

/** 健康情况变化时，联动调整护理等级与慢病标签 */
function handleHealthChange(value) {
  if (value === '健康') {
    form.diseases = []
    form.careLevel = '自理'
  } else if (value === '失能') {
    form.careLevel = '一级护理'
  } else if (value === '半失能') {
    form.careLevel = '二级护理'
  }
}

/* ------------------------------ 数据加载与提交 ------------------------------ */
async function loadCommunities() {
  communityList.value = await getCommunityList()
}

async function loadDetail() {
  if (!isEdit.value) return
  const data = await getArchiveDetail(route.query.id)
  Object.assign(form, data)
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // 年龄不足 65 岁给出提示但仍允许保存（部分辖区有特殊政策）
  if (form.age && form.age < 65) {
    try {
      await ElMessageBox.confirm(
        `该老人年龄为 ${form.age} 岁，未满 65 岁。平台档案主要面向 65 岁以上老人，确定继续保存吗？`,
        '年龄提示',
        { confirmButtonText: '继续保存', cancelButtonText: '返回修改', type: 'warning' },
      )
    } catch {
      return
    }
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await updateArchive(form.id, { ...form })
      ElMessage.success('档案保存成功')
    } else {
      await createArchive({ ...form })
      ElMessage.success('档案录入成功')
    }
    router.push('/archive/list')
  } finally {
    submitting.value = false
  }
}

/** 重置表单 */
function handleReset() {
  formRef.value?.resetFields()
  form.diseases = []
}

onMounted(() => {
  loadCommunities()
  loadDetail()
})
</script>

<template>
  <div class="page-container">
    <PageHeader
      :title="isEdit ? '编辑老人档案' : '档案录入'"
      description="录入辖区内 65 岁以上老人信息，带 * 号为必填项"
      show-back
      @back="router.push('/archive/list')"
    />

    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="archive-form">
      <!-- 基本信息 -->
      <div class="app-card">
        <div class="app-card__body">
          <h3 class="archive-form__section">
            <el-icon><User /></el-icon>
            基本信息
          </h3>

          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="form.name" placeholder="请输入老人姓名" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="form.gender">
                  <el-radio v-for="item in GENDERS" :key="item" :value="item">{{ item }}</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="联系电话" prop="phone">
                <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="身份证号" prop="idCard">
                <el-input
                  v-model="form.idCard"
                  placeholder="输入后自动计算年龄"
                  maxlength="18"
                  @change="handleIdCardChange"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="4">
              <el-form-item label="年龄">
                <!-- 年龄由身份证推导，只读展示避免与证件不一致 -->
                <el-input :model-value="form.age || '—'" readonly>
                  <template #suffix>岁</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="4">
              <el-form-item label="出生日期">
                <el-input :model-value="form.birthDate || '—'" readonly />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="所属社区" prop="districtId">
                <el-select v-model="form.districtId" placeholder="请选择社区" filterable style="width: 100%">
                  <el-option
                    v-for="item in communityList"
                    :key="item.id"
                    :label="item.fullName"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="详细地址" prop="address">
            <el-input v-model="form.address" placeholder="请输入详细居住地址" />
          </el-form-item>
        </div>
      </div>

      <!-- 健康信息 -->
      <div class="app-card">
        <div class="app-card__body">
          <h3 class="archive-form__section">
            <el-icon><FirstAidKit /></el-icon>
            健康信息
          </h3>

          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="健康情况" prop="healthStatus">
                <el-select
                  v-model="form.healthStatus"
                  placeholder="请选择"
                  style="width: 100%"
                  @change="handleHealthChange"
                >
                  <el-option v-for="item in HEALTH_STATUS" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="护理等级" prop="careLevel">
                <el-select v-model="form.careLevel" style="width: 100%">
                  <el-option v-for="item in CARE_LEVELS" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="残疾情况" prop="disability">
                <el-select v-model="form.disability" style="width: 100%">
                  <el-option v-for="item in DISABILITIES" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="慢性疾病">
            <el-checkbox-group v-model="form.diseases">
              <el-checkbox v-for="item in DISEASES" :key="item" :value="item">{{ item }}</el-checkbox>
            </el-checkbox-group>
            <div class="archive-form__hint">健康情况选择「健康」时不建议勾选慢病</div>
          </el-form-item>

          <el-form-item label="补贴类型" prop="subsidyType">
            <el-select v-model="form.subsidyType" style="width: 280px">
              <el-option v-for="item in SUBSIDY_TYPES" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </div>
      </div>

      <!-- 监护人信息 -->
      <div class="app-card">
        <div class="app-card__body">
          <h3 class="archive-form__section">
            <el-icon><PhoneFilled /></el-icon>
            监护人信息
          </h3>

          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="监护人姓名" prop="guardian">
                <el-input v-model="form.guardian" placeholder="请输入监护人姓名" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="与老人关系" prop="guardianRelation">
                <el-select v-model="form.guardianRelation" style="width: 100%">
                  <el-option v-for="item in RELATIONS" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="联系电话" prop="guardianPhone">
                <el-input v-model="form.guardianPhone" placeholder="请输入监护人手机号" maxlength="11" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="archive-form__actions app-card">
        <div class="archive-form__actions-inner">
          <el-button size="large" @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
          <el-button size="large" @click="router.push('/archive/list')">取消</el-button>
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
            <el-icon><Select /></el-icon>
            {{ isEdit ? '保存修改' : '提交录入' }}
          </el-button>
        </div>
      </div>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.archive-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.archive-form__section {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 18px;
  padding-left: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
  border-left: 3px solid var(--app-primary);
}

.archive-form__hint {
  width: 100%;
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--app-text-secondary);
}

/* 底部操作栏吸底，长表单滚动时始终可见 */
.archive-form__actions {
  position: sticky;
  bottom: 0;
  z-index: 10;
  margin-bottom: 16px;
}

.archive-form__actions-inner {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 16px;
}

@media (max-width: 1200px) {
  .archive-form {
    :deep(.el-form-item__label) {
      width: 90px !important;
    }
  }
}
</style>
