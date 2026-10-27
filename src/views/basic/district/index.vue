<script setup>
/**
 * 基础管理 - 辖区范围管理
 * 功能：辖区树形结构展示、区域增删改查
 *
 * 数据为「区 - 街道 - 社区」三级树，左侧展示树、右侧展示选中节点的详情与下级列表。
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createDistrict,
  deleteDistrict,
  getDistrictList,
  getDistrictTree,
  updateDistrict,
} from '@/api/basic'
import PageHeader from '@/components/PageHeader.vue'

const loading = ref(false)
const treeData = ref([])
const flatList = ref([])
/** 树节点默认全部展开 */
const defaultExpandedKeys = ref([])
const filterText = ref('')
const treeRef = ref(null)

/** 当前选中的辖区节点 */
const currentNode = ref(null)

/** 树过滤：Element Plus 的 filter-node-method */
function filterNode(value, data) {
  if (!value) return true
  return data.name.includes(value)
}

// 关键字变化时触发树过滤
function handleFilter() {
  treeRef.value?.filter(filterText.value)
}

async function loadData() {
  loading.value = true
  try {
    const [tree, flat] = await Promise.all([getDistrictTree(), getDistrictList()])
    treeData.value = tree
    flatList.value = flat
    // 默认展开前两级，保持层级感又不过于冗长
    defaultExpandedKeys.value = flat.filter((item) => item.level <= 2).map((item) => item.id)
  } finally {
    loading.value = false
  }
}

/* ------------------------------ 节点选中 ------------------------------ */
/** 选中节点的下级列表（供右侧表格展示） */
const childrenOfCurrent = computed(() => {
  if (!currentNode.value) return []
  return flatList.value.filter((item) => item.parentId === currentNode.value.id)
})

/** 选中节点的完整路径 */
const currentPath = computed(() => {
  if (!currentNode.value) return []
  const path = []
  let node = currentNode.value
  while (node) {
    path.unshift(node)
    node = flatList.value.find((item) => item.id === node.parentId)
  }
  return path
})

function handleNodeClick(data) {
  // 树节点是原始结构，这里换成平铺数据以拿到 fullName / level 等字段
  currentNode.value = flatList.value.find((item) => item.id === data.id) || null
}

/* ------------------------------ 新增 / 编辑 ------------------------------ */
const dialogVisible = ref(false)
const dialogMode = ref('create')
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  parentId: null,
  name: '',
})

const rules = {
  name: [
    { required: true, message: '请输入辖区名称', trigger: 'blur' },
    { max: 20, message: '名称不超过 20 个字', trigger: 'blur' },
  ],
}

/** 上级可选节点：只允许挂到 1、2 级下（即最多三级：区-街道-社区） */
const parentOptions = computed(() => flatList.value.filter((item) => item.level <= 2))

/** 新增顶级辖区 */
function handleCreateRoot() {
  dialogMode.value = 'create'
  Object.assign(form, { id: null, parentId: null, name: '' })
  dialogVisible.value = true
}

/** 新增下级辖区 */
function handleCreateChild() {
  if (!currentNode.value) {
    ElMessage.warning('请先在左侧选择一个上级辖区')
    return
  }
  if (currentNode.value.level >= 3) {
    ElMessage.warning('辖区最多支持三级（区 - 街道 - 社区），无法继续添加下级')
    return
  }
  dialogMode.value = 'create'
  Object.assign(form, { id: null, parentId: currentNode.value.id, name: '' })
  dialogVisible.value = true
}

/** 编辑当前选中节点 */
function handleEdit() {
  if (!currentNode.value) {
    ElMessage.warning('请先在左侧选择要编辑的辖区')
    return
  }
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: currentNode.value.id,
    parentId: currentNode.value.parentId,
    name: currentNode.value.name,
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (dialogMode.value === 'edit' && !form.parentId) {
    // 编辑顶级节点时不允许改挂载点，避免出现环
    submitting.value = true
    try {
      await updateDistrict(form.id, { name: form.name })
      ElMessage.success('保存成功')
      dialogVisible.value = false
      await loadData()
      syncCurrentNode()
    } finally {
      submitting.value = false
    }
    return
  }

  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await createDistrict({ parentId: form.parentId, name: form.name })
    } else {
      await updateDistrict(form.id, { name: form.name })
    }
    ElMessage.success(dialogMode.value === 'create' ? '新增成功' : '保存成功')
    dialogVisible.value = false
    await loadData()
    syncCurrentNode()
  } finally {
    submitting.value = false
  }
}

/** 数据刷新后，用 id 重新绑定当前选中节点，避免引用失效 */
function syncCurrentNode() {
  if (!currentNode.value) return
  currentNode.value = flatList.value.find((item) => item.id === currentNode.value.id) || null
}

/* ------------------------------ 删除 ------------------------------ */
async function handleDelete(row) {
  const target = row || currentNode.value
  if (!target) {
    ElMessage.warning('请先选择要删除的辖区')
    return
  }
  const childCount = flatList.value.filter((item) => item.parentId === target.id).length

  try {
    await ElMessageBox.confirm(
      childCount > 0
        ? `「${target.name}」下还有 ${childCount} 个下级辖区，删除后一并移除，确定继续吗？`
        : `确定要删除辖区「${target.name}」吗？`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  await deleteDistrict(target.id)
  ElMessage.success('删除成功')
  // 若删掉的正是当前选中项，清空选中态
  if (currentNode.value?.id === target.id) currentNode.value = null
  await loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <PageHeader title="辖区范围管理" description="维护平台服务覆盖的行政区划，支持三级树形结构管理">
      <template #extra>
        <el-button @click="handleCreateRoot">
          <el-icon><Plus /></el-icon>
          新增一级辖区
        </el-button>
        <el-button type="primary" @click="handleCreateChild">
          <el-icon><Plus /></el-icon>
          新增下级辖区
        </el-button>
      </template>
    </PageHeader>

    <div class="district">
      <!-- 左侧：树形结构 -->
      <div class="app-card district__tree">
        <div class="district__tree-header">
          <h3>辖区结构</h3>
          <span class="app-text-secondary">共 {{ flatList.length }} 个节点</span>
        </div>

        <el-input
          v-model="filterText"
          placeholder="搜索辖区名称"
          clearable
          class="district__search"
          @input="handleFilter"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-scrollbar class="district__tree-scroll">
          <el-tree
            ref="treeRef"
            v-loading="loading"
            :data="treeData"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            :default-expanded-keys="defaultExpandedKeys"
            :filter-node-method="filterNode"
            highlight-current
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
          >
            <template #default="{ data }">
              <div class="district-node">
                <span class="district-node__name">{{ data.name }}</span>
                <el-tag
                  v-if="data.children?.length"
                  size="small"
                  type="info"
                  round
                  class="district-node__count"
                >
                  {{ data.children.length }}
                </el-tag>
              </div>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>

      <!-- 右侧：详情与下级列表 -->
      <div class="district__detail">
        <template v-if="currentNode">
          <!-- 选中节点信息 -->
          <div class="app-card">
            <div class="app-card__body">
              <div class="district__current-header">
                <div>
                  <h3 class="district__current-name">{{ currentNode.name }}</h3>
                  <div class="district__current-path">
                    <el-breadcrumb separator="/">
                      <el-breadcrumb-item v-for="item in currentPath" :key="item.id">
                        {{ item.name }}
                      </el-breadcrumb-item>
                    </el-breadcrumb>
                  </div>
                </div>
                <div class="district__current-actions">
                  <el-button size="small" @click="handleEdit">
                    <el-icon><EditPen /></el-icon>
                    重命名
                  </el-button>
                  <el-button size="small" type="danger" plain @click="handleDelete(null)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>

              <el-descriptions :column="3" border class="district__current-desc">
                <el-descriptions-item label="节点编号">{{ currentNode.id }}</el-descriptions-item>
                <el-descriptions-item label="行政层级">
                  第 {{ currentNode.level }} 级
                </el-descriptions-item>
                <el-descriptions-item label="下级数量">
                  {{ childrenOfCurrent.length }} 个
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>

          <!-- 下级列表 -->
          <div class="app-card">
            <div class="app-card__body">
              <div class="app-toolbar">
                <h3 class="district__sub-title">下级辖区</h3>
                <el-button
                  v-if="currentNode.level < 3"
                  size="small"
                  type="primary"
                  plain
                  @click="handleCreateChild"
                >
                  <el-icon><Plus /></el-icon>
                  添加下级
                </el-button>
              </div>

              <el-table :data="childrenOfCurrent" stripe style="width: 100%">
                <el-table-column prop="id" label="编号" width="90" align="center" />
                <el-table-column prop="name" label="辖区名称" min-width="160" />
                <el-table-column label="层级" width="100" align="center">
                  <template #default="{ row }">第 {{ row.level }} 级</template>
                </el-table-column>
                <el-table-column label="操作" width="150" align="center">
                  <template #default="{ row }">
                    <el-button link type="primary" @click="handleNodeClick(row)">查看</el-button>
                    <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
                  </template>
                </el-table-column>
                <template #empty>
                  <el-empty description="该辖区暂无下级" :image-size="80" />
                </template>
              </el-table>
            </div>
          </div>
        </template>

        <!-- 未选中提示 -->
        <div v-else class="app-card district__empty">
          <el-empty description="请从左侧选择一个辖区查看详情" :image-size="110" />
        </div>
      </div>
    </div>

    <!-- 新增 / 重命名弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增辖区' : '重命名辖区'"
      width="460px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item v-if="dialogMode === 'create'" label="上级辖区">
          <el-select v-model="form.parentId" placeholder="不选则创建为一级辖区" clearable style="width: 100%">
            <el-option
              v-for="item in parentOptions"
              :key="item.id"
              :label="item.fullName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="辖区名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入辖区名称" maxlength="20" show-word-limit />
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

.district {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

/* ------------------------------ 左侧树 ------------------------------ */
.district__tree {
  padding: 16px;
  /* 与右侧内容区高度对齐，超长时内部滚动 */
  max-height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.district__tree-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--app-text-primary);
  }

  span {
    font-size: 12px;
  }
}

.district__search {
  margin-bottom: 12px;
}

.district__tree-scroll {
  flex: 1;
  min-height: 200px;
}

.district-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;
  font-size: 13px;
}

.district-node__count {
  transform: scale(0.85);
}

/* ------------------------------ 右侧详情 ------------------------------ */
.district__detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.district__current-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.district__current-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.district__current-path {
  margin-top: 8px;

  :deep(.el-breadcrumb) {
    font-size: 12px;
  }
}

.district__current-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.district__current-desc {
  :deep(.el-descriptions__label) {
    width: 90px;
  }
}

.district__sub-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.district__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}
</style>
