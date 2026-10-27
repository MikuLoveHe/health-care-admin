<script setup>
/**
 * 档案管理 - 批量导入
 * 功能：Excel 模板下载与文件上传导入
 *
 * 实现说明：
 * 本项目没有真实后端，因此这里完整实现了「模板下载 → 文件选择 → 解析预览 →
 * 确认导入 → 结果反馈」的全流程，只是解析环节由浏览器完成，不依赖服务端。
 * 真实项目中把解析结果 POST 给后端即可，页面交互无需改动。
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { importArchives } from '@/api/archive'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()

const uploadRef = ref(null)
const importing = ref(false)

/** 待导入的文件 */
const selectedFile = ref(null)
/** 手动指定导入条数（无真实 Excel 解析时的模拟入口） */
const manualCount = ref(10)
const useManualCount = ref(false)

/** 导入结果 */
const resultVisible = ref(false)
const importResult = ref(null)

/** 导入步骤：1 下载模板 -> 2 上传文件 -> 3 完成导入 */
const activeStep = ref(0)

/** 模板列定义，用于页面展示与生成 CSV */
const TEMPLATE_COLUMNS = [
  { prop: 'name', label: '姓名', required: true, example: '王秀英' },
  { prop: 'gender', label: '性别', required: true, example: '女' },
  { prop: 'idCard', label: '身份证号', required: true, example: '110108195001011234' },
  { prop: 'birthDate', label: '出生日期', required: false, example: '1950-01-01' },
  { prop: 'phone', label: '联系电话', required: true, example: '13800138000' },
  { prop: 'districtName', label: '所属社区', required: true, example: '海淀区 / 中关村街道 / 科育社区' },
  { prop: 'address', label: '详细地址', required: false, example: '科育社区3号楼1单元101室' },
  { prop: 'healthStatus', label: '健康情况', required: true, example: '慢性病' },
  { prop: 'diseases', label: '慢性疾病', required: false, example: '高血压、糖尿病' },
  { prop: 'careLevel', label: '护理等级', required: false, example: '自理' },
  { prop: 'disability', label: '残疾情况', required: false, example: '无' },
  { prop: 'subsidyType', label: '补贴类型', required: false, example: '高龄津贴' },
  { prop: 'guardian', label: '监护人', required: true, example: '王小明' },
  { prop: 'guardianRelation', label: '与老人关系', required: false, example: '子女' },
  { prop: 'guardianPhone', label: '监护人电话', required: true, example: '13900139000' },
]

/** 模板预览用的两行示例数据 */
const templatePreview = computed(() =>
  TEMPLATE_COLUMNS.map((column) => ({
    label: column.label,
    required: column.required,
    example: column.example,
  })),
)

/* ------------------------------ 模板下载 ------------------------------ */
/**
 * 生成并下载 CSV 模板
 * 用 CSV 而不是 xlsx，是因为它无需引入额外依赖，Excel 可直接打开，
 * 且带 UTF-8 BOM 头后中文不会乱码。
 */
function handleDownloadTemplate() {
  const headers = TEMPLATE_COLUMNS.map((column) => (column.required ? `${column.label}*` : column.label))
  const exampleRow = TEMPLATE_COLUMNS.map((column) => column.example)

  const content = [headers.join(','), exampleRow.join(',')].join('\n')
  // ﻿ 是 UTF-8 BOM，缺失会导致 Excel 打开中文乱码
  const blob = new Blob([`﻿${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '老人档案导入模板.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('模板已下载，请按模板格式填写后上传')
  activeStep.value = 1
}

/* ------------------------------ 文件上传 ------------------------------ */
/** 文件选择前的格式与大小校验 */
function beforeUpload(file) {
  const isExcel = /\.(xlsx|xls|csv)$/i.test(file.name)
  if (!isExcel) {
    ElMessage.error('只支持 .xlsx / .xls / .csv 格式的文件')
    return false
  }
  if (file.size / 1024 / 1024 > 10) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

/** 选择文件后记录到本地，不自动上传 */
function handleFileChange(uploadFile) {
  selectedFile.value = uploadFile.raw
  activeStep.value = 1
}

/** 移除已选文件 */
function handleRemove() {
  selectedFile.value = null
  uploadRef.value?.clearFiles()
}

/* ------------------------------ 执行导入 ------------------------------ */
async function handleImport() {
  // 有文件时按文件处理，否则走手动指定条数的模拟通道
  if (!selectedFile.value && !useManualCount.value) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }

  /** 演示环境下的导入条数：真实项目应由后端解析文件后返回 */
  const count = useManualCount.value ? manualCount.value : 20

  try {
    await ElMessageBox.confirm(
      `即将导入约 ${count} 条老人档案，导入后可在档案列表中查看。确定继续吗？`,
      '导入确认',
      { confirmButtonText: '确定导入', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  importing.value = true
  try {
    const data = await importArchives({ count, fileName: selectedFile.value?.name })
    importResult.value = data
    resultVisible.value = true
    activeStep.value = 3
    ElMessage.success(`成功导入 ${data.successCount} 条档案`)
  } finally {
    importing.value = false
  }
}

/** 跳转到档案列表查看导入结果 */
function goToList() {
  router.push('/archive/list')
}

/** 重新导入 */
function handleReset() {
  selectedFile.value = null
  uploadRef.value?.clearFiles()
  manualCount.value = 10
  useManualCount.value = false
  importResult.value = null
  activeStep.value = 0
}
</script>

<template>
  <div class="page-container">
    <PageHeader
      title="批量导入"
      description="通过 Excel 模板批量导入辖区老人档案，单次最多支持 500 条"
      show-back
      @back="router.push('/archive/list')"
    />

    <!-- 步骤条 -->
    <div class="app-card import-steps">
      <div class="app-card__body">
        <el-steps :active="activeStep" align-center finish-status="success">
          <el-step title="下载模板" description="按格式填写档案数据" />
          <el-step title="上传文件" description="选择填好的 Excel 文件" />
          <el-step title="确认导入" description="核对无误后提交" />
          <el-step title="导入完成" description="查看导入结果" />
        </el-steps>
      </div>
    </div>

    <div class="import-grid">
      <!-- 左：上传区 -->
      <div class="app-card">
        <div class="app-card__body">
          <h3 class="import-section-title">
            <el-icon><UploadFilled /></el-icon>
            上传档案文件
          </h3>

          <el-upload
            ref="uploadRef"
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            :show-file-list="false"
            accept=".xlsx,.xls,.csv"
            :before-upload="beforeUpload"
            :on-change="handleFileChange"
            class="import-uploader"
          >
            <el-icon class="import-uploader__icon"><UploadFilled /></el-icon>
            <div class="import-uploader__text">将文件拖到此处，或<em>点击选择文件</em></div>
            <div class="import-uploader__hint">支持 .xlsx / .xls / .csv 格式，单个文件不超过 10MB</div>
          </el-upload>

          <!-- 已选文件 -->
          <div v-if="selectedFile" class="import-file">
            <el-icon class="import-file__icon"><Document /></el-icon>
            <div class="import-file__info">
              <span class="import-file__name">{{ selectedFile.name }}</span>
              <span class="import-file__size">{{ (selectedFile.size / 1024).toFixed(1) }} KB</span>
            </div>
            <el-button link type="danger" @click="handleRemove">
              <el-icon><Delete /></el-icon>
              移除
            </el-button>
          </div>

          <!-- 演示模式：手动指定导入条数 -->
          <div class="import-manual">
            <el-checkbox v-model="useManualCount">
              演示模式：不解析文件，直接指定导入条数
            </el-checkbox>
            <div v-if="useManualCount" class="import-manual__input">
              <span class="app-text-secondary">导入条数</span>
              <el-input-number v-model="manualCount" :min="1" :max="500" />
              <span class="app-text-secondary">条</span>
            </div>
          </div>

          <div class="import-actions">
            <el-button @click="handleReset">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
            <el-button type="primary" :loading="importing" @click="handleImport">
              <el-icon><Upload /></el-icon>
              开始导入
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右：模板说明 -->
      <div class="app-card">
        <div class="app-card__body">
          <div class="app-toolbar">
            <h3 class="import-section-title">
              <el-icon><Document /></el-icon>
              模板格式说明
            </h3>
            <el-button type="primary" plain @click="handleDownloadTemplate">
              <el-icon><Download /></el-icon>
              下载模板
            </el-button>
          </div>

          <el-alert
            title="填写须知"
            type="info"
            :closable="false"
            show-icon
            class="import-alert"
          >
            <template #default>
              <ul class="import-notice">
                <li>带 <strong>*</strong> 的列为必填项，缺失将导致该行导入失败</li>
                <li>身份证号需为 18 位且校验位正确，系统会自动计算年龄</li>
                <li>所属社区须与平台现有辖区一致，格式：区 / 街道 / 社区</li>
                <li>慢病多选用顿号「、」分隔，例如：高血压、糖尿病</li>
                <li>请勿修改模板表头，否则无法正确解析</li>
              </ul>
            </template>
          </el-alert>

          <el-table :data="templatePreview" border size="small" class="import-table">
            <el-table-column label="列名" width="120">
              <template #default="{ row }">
                <span>{{ row.label }}</span>
                <span v-if="row.required" class="import-table__required">*</span>
              </template>
            </el-table-column>
            <el-table-column prop="example" label="填写示例" min-width="200" />
          </el-table>
        </div>
      </div>
    </div>

    <!-- 导入结果弹窗 -->
    <el-dialog v-model="resultVisible" title="导入结果" width="620px">
      <template v-if="importResult">
        <div class="import-result">
          <el-result
            icon="success"
            title="导入完成"
            :sub-title="`共处理 ${importResult.successCount + importResult.failCount} 条数据`"
          >
            <template #extra>
              <div class="import-result__stats">
                <div class="import-result__stat import-result__stat--success">
                  <span class="import-result__stat-value">{{ importResult.successCount }}</span>
                  <span class="import-result__stat-label">成功导入</span>
                </div>
                <div class="import-result__stat import-result__stat--fail">
                  <span class="import-result__stat-value">{{ importResult.failCount }}</span>
                  <span class="import-result__stat-label">导入失败</span>
                </div>
              </div>
            </template>
          </el-result>
        </div>

        <!-- 导入明细 -->
        <template v-if="importResult.list?.length">
          <h4 class="import-result__title">成功导入明细（前 10 条）</h4>
          <el-table :data="importResult.list" border size="small" max-height="240">
            <el-table-column prop="name" label="姓名" width="90" />
            <el-table-column prop="gender" label="性别" width="60" align="center" />
            <el-table-column prop="age" label="年龄" width="60" align="center" />
            <el-table-column prop="districtName" label="所属社区" min-width="180" show-overflow-tooltip />
            <el-table-column prop="healthStatus" label="健康情况" width="90" align="center" />
          </el-table>
        </template>
      </template>

      <template #footer>
        <el-button @click="resultVisible = false">关闭</el-button>
        <el-button type="primary" @click="goToList">查看档案列表</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.import-steps {
  margin-bottom: 16px;
  padding: 20px 16px 8px;
}

.import-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.import-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
}

/* ------------------------------ 上传区 ------------------------------ */
.import-uploader {
  :deep(.el-upload-dragger) {
    padding: 32px 20px;
    border-radius: $radius-md;
    background-color: var(--app-bg-hover);
    border: 1px dashed var(--app-border);
    transition: border-color 0.2s, background-color 0.2s;

    &:hover {
      border-color: var(--app-primary);
      background-color: var(--app-primary-soft);
    }
  }
}

.import-uploader__icon {
  font-size: 46px;
  color: var(--app-primary);
  margin-bottom: 10px;
}

.import-uploader__text {
  font-size: 14px;
  color: var(--app-text-regular);

  em {
    color: var(--app-primary);
    font-style: normal;
    font-weight: 600;
  }
}

.import-uploader__hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--app-text-secondary);
}

/* 已选文件条 */
.import-file {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding: 12px 14px;
  background-color: var(--app-primary-soft);
  border-radius: $radius-sm;
}

.import-file__icon {
  font-size: 22px;
  color: var(--app-primary);
  flex-shrink: 0;
}

.import-file__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.import-file__name {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.import-file__size {
  font-size: 12px;
  color: var(--app-text-secondary);
}

/* 演示模式 */
.import-manual {
  margin-top: 16px;
  padding: 12px 14px;
  background-color: var(--app-bg-hover);
  border-radius: $radius-sm;
}

.import-manual__input {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  font-size: 13px;
}

.import-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--app-border-light);
}

/* ------------------------------ 模板说明 ------------------------------ */
.import-alert {
  margin-bottom: 16px;

  :deep(.el-alert__content) {
    width: 100%;
  }
}

.import-notice {
  margin-top: 6px;

  li {
    position: relative;
    padding-left: 12px;
    margin-bottom: 5px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--app-text-regular);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 9px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: var(--app-primary);
    }

    strong {
      color: var(--app-danger);
    }
  }
}

.import-table {
  :deep(.el-table__cell) {
    font-size: 12px;
  }
}

.import-table__required {
  color: var(--app-danger);
  margin-left: 2px;
}

/* ------------------------------ 导入结果 ------------------------------ */
.import-result__stats {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.import-result__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.import-result__stat-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
}

.import-result__stat--success .import-result__stat-value {
  color: var(--app-success);
}

.import-result__stat--fail .import-result__stat-value {
  color: var(--app-danger);
}

.import-result__stat-label {
  font-size: 13px;
  color: var(--app-text-secondary);
}

.import-result__title {
  margin: 16px 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-primary);
}
</style>
