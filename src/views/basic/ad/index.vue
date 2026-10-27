<script setup>
/**
 * 基础管理 - 广告管理
 * 功能：广告位列表、图片上传预览、投放时间设置、上下架
 */
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createAd, deleteAd, getAdList, updateAd, updateAdStatus } from '@/api/basic'
import { AD_POSITIONS, AD_STATUS, PAGE_SIZES } from '@/utils/constants'
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
  position: '',
  status: '',
  dateRange: [],
  page: 1,
  pageSize: 10,
})

async function loadList() {
  loading.value = true
  try {
    const data = await getAdList(query)
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
  query.position = ''
  query.status = ''
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

/* ------------------------------ 新增 / 编辑 ------------------------------ */
const dialogVisible = ref(false)
const dialogMode = ref('create')
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  title: '',
  position: '',
  image: '',
  linkUrl: '',
  sort: 1,
  startTime: '',
  endTime: '',
  status: '投放中',
})

const rules = {
  title: [
    { required: true, message: '请输入广告标题', trigger: 'blur' },
    { max: 30, message: '标题不超过 30 个字', trigger: 'blur' },
  ],
  position: [{ required: true, message: '请选择广告位', trigger: 'change' }],
  image: [{ required: true, message: '请上传广告图片', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择投放开始时间', trigger: 'change' }],
  endTime: [
    { required: true, message: '请选择投放结束时间', trigger: 'change' },
    {
      // 结束时间必须晚于开始时间，否则广告永远不会展示
      validator: (_rule, value, callback) => {
        if (value && form.startTime && new Date(value) <= new Date(form.startTime)) {
          callback(new Error('结束时间必须晚于开始时间'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
  linkUrl: [
    {
      validator: (_rule, value, callback) => {
        if (value && !/^https?:\/\/.+/.test(value)) {
          callback(new Error('请输入以 http:// 或 https:// 开头的链接'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

function handleCreate() {
  dialogMode.value = 'create'
  Object.assign(form, {
    id: null,
    title: '',
    position: '',
    image: '',
    linkUrl: '',
    sort: 1,
    startTime: '',
    endTime: '',
    status: '投放中',
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogMode.value = 'edit'
  Object.assign(form, row)
  // 投放时间拆成 [开始, 结束] 供日期范围选择器使用
  form.startTime = row.startTime ? `${row.startTime} 00:00:00` : ''
  form.endTime = row.endTime ? `${row.endTime} 00:00:00` : ''
  dialogVisible.value = true
}

/**
 * 图片上传
 * 本项目没有真实后端存储，因此不发送请求，直接把本地文件读成 base64 用于预览。
 * 这样断网演示也不会出现上传失败。
 */
const uploadRef = ref(null)

function handleImageChange(uploadFile) {
  const file = uploadFile.raw
  if (!file) return

  // 上传前校验格式与大小
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    uploadRef.value?.clearFiles()
    return
  }
  if (file.size / 1024 / 1024 > 2) {
    ElMessage.error('图片大小不能超过 2MB')
    uploadRef.value?.clearFiles()
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    form.image = event.target.result
  }
  reader.readAsDataURL(file)
}

/** 移除已上传的图片 */
function handleImageRemove() {
  form.image = ''
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    // 提交时只保留日期部分，与 Mock 数据结构保持一致
    const payload = {
      ...form,
      startTime: form.startTime ? String(form.startTime).slice(0, 10) : '',
      endTime: form.endTime ? String(form.endTime).slice(0, 10) : '',
    }
    if (dialogMode.value === 'create') {
      await createAd(payload)
    } else {
      await updateAd(form.id, payload)
    }
    ElMessage.success(dialogMode.value === 'create' ? '新增成功' : '保存成功')
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

/* ------------------------------ 删除 / 上下架 ------------------------------ */
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除广告「${row.title}」吗？`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  await deleteAd(row.id)
  ElMessage.success('删除成功')
  if (tableData.value.length === 1 && query.page > 1) query.page -= 1
  loadList()
}

async function handleToggleStatus(row) {
  const nextStatus = row.status === '投放中' ? '已下架' : '投放中'
  const actionText = nextStatus === '投放中' ? '开始投放' : '停止投放'

  try {
    await ElMessageBox.confirm(`确定要${actionText}广告「${row.title}」吗？`, `${actionText}确认`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  await updateAdStatus(row.id, nextStatus)
  ElMessage.success(`${actionText}成功`)
  loadList()
}

onMounted(loadList)
</script>

<template>
  <div class="page-container">
    <PageHeader title="广告管理" description="管理平台各广告位的投放内容、投放时间与上下架状态">
      <template #extra>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增广告
        </el-button>
      </template>
    </PageHeader>

    <SearchBar :loading="loading" @search="handleSearch" @reset="handleReset">
      <el-form-item label="广告标题">
        <el-input v-model="query.keyword" placeholder="请输入标题" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="广告位">
        <el-select v-model="query.position" placeholder="全部广告位" clearable>
          <el-option v-for="item in AD_POSITIONS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="投放状态">
        <el-select v-model="query.status" placeholder="全部状态" clearable>
          <el-option v-for="item in AD_STATUS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="投放时间">
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

          <el-table-column label="广告图片" width="120">
            <template #default="{ row }">
              <el-image
                :src="row.image"
                fit="cover"
                class="ad-cover"
                :preview-src-list="[row.image]"
                preview-teleported
              />
            </template>
          </el-table-column>

          <el-table-column label="广告标题" min-width="170">
            <template #default="{ row }">
              <div class="ad-title">
                <span class="ad-title__text">{{ row.title }}</span>
                <el-link
                  v-if="row.linkUrl"
                  :href="row.linkUrl"
                  target="_blank"
                  type="primary"
                  :underline="false"
                  class="ad-title__link"
                >
                  跳转链接
                </el-link>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="position" label="广告位" width="115" align="center" />

          <!-- 投放时间只显示日期，避免 1366 分辨率下表格横向溢出 -->
          <el-table-column label="投放时间" width="155" align="center">
            <template #default="{ row }">
              <span class="app-text-secondary">
                {{ row.startTime }} ~ {{ row.endTime }}
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="clickCount" label="点击量" width="85" align="center" sortable />

          <el-table-column label="状态" width="95" align="center">
            <template #default="{ row }">
              <StatusTag :status="row.status" dot />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="175" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button
                link
                :type="row.status === '投放中' ? 'warning' : 'success'"
                @click="handleToggleStatus(row)"
              >
                {{ row.status === '投放中' ? '停止投放' : '开始投放' }}
              </el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="暂无广告数据" :image-size="90" />
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
      :title="dialogMode === 'create' ? '新增广告' : '编辑广告'"
      width="620px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="广告标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入广告标题" maxlength="30" show-word-limit />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="广告位" prop="position">
              <el-select v-model="form.position" placeholder="请选择广告位" style="width: 100%">
                <el-option v-for="item in AD_POSITIONS" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="1" :max="99" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 图片上传与预览 -->
        <el-form-item label="广告图片" prop="image">
          <el-upload
            ref="uploadRef"
            class="ad-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :on-change="handleImageChange"
          >
            <!-- 已上传：展示预览图与操作按钮 -->
            <div v-if="form.image" class="ad-uploader__preview">
              <img :src="form.image" alt="广告预览" class="ad-uploader__image" />
              <div class="ad-uploader__mask">
                <el-icon><ZoomIn /></el-icon>
                <span>点击更换</span>
              </div>
            </div>
            <!-- 未上传：展示虚线占位框 -->
            <div v-else class="ad-uploader__placeholder">
              <el-icon><Plus /></el-icon>
              <span>点击上传广告图片</span>
              <span class="ad-uploader__hint">建议尺寸 640×300，不超过 2MB</span>
            </div>
          </el-upload>
          <el-button v-if="form.image" link type="danger" class="ad-uploader__remove" @click="handleImageRemove">
            移除图片
          </el-button>
        </el-form-item>

        <el-form-item label="跳转链接" prop="linkUrl">
          <el-input v-model="form.linkUrl" placeholder="https://example.com/activity" />
        </el-form-item>

        <el-form-item label="投放时间" required>
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 48%"
          />
          <span class="ad-time-sep">至</span>
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 48%"
          />
        </el-form-item>

        <el-form-item label="投放状态">
          <el-radio-group v-model="form.status">
            <el-radio v-for="item in AD_STATUS" :key="item" :value="item">{{ item }}</el-radio>
          </el-radio-group>
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

.ad-cover {
  width: 120px;
  height: 56px;
  border-radius: $radius-sm;
}

.ad-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ad-title__text {
  font-weight: 500;
  color: var(--app-text-primary);
}

.ad-title__link {
  font-size: 12px;
}

/* ------------------------------ 图片上传 ------------------------------ */
.ad-uploader {
  :deep(.el-upload) {
    display: block;
  }
}

.ad-uploader__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 260px;
  height: 122px;
  color: var(--app-text-secondary);
  font-size: 13px;
  border: 1px dashed var(--app-border);
  border-radius: $radius-sm;
  background-color: var(--app-bg-hover);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;

  .el-icon {
    font-size: 22px;
  }

  &:hover {
    border-color: var(--app-primary);
    color: var(--app-primary);
  }
}

.ad-uploader__hint {
  font-size: 11px;
  color: var(--app-text-placeholder);
}

.ad-uploader__preview {
  position: relative;
  width: 260px;
  height: 122px;
  overflow: hidden;
  border-radius: $radius-sm;
  cursor: pointer;
}

.ad-uploader__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 悬停遮罩，提示可点击更换 */
.ad-uploader__mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.2s;

  .el-icon {
    font-size: 20px;
  }
}

.ad-uploader__preview:hover .ad-uploader__mask {
  opacity: 1;
}

.ad-uploader__remove {
  margin-left: 10px;
}

.ad-time-sep {
  padding: 0 8px;
  color: var(--app-text-secondary);
}
</style>
