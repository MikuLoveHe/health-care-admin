<script setup>
/**
 * 志愿者管理 - 资质详情
 * 功能：证件图片预览、审核记录时间轴
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getVolunteerDetail, updateVolunteerStatus } from '@/api/volunteer'
import { formatDate } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref({})

/** 证件预览抽屉 */
const previewVisible = ref(false)
const previewIndex = ref(0)

const volunteerId = computed(() => route.params.id)

async function loadDetail() {
  loading.value = true
  try {
    detail.value = await getVolunteerDetail(volunteerId.value)
  } catch {
    // 志愿者不存在时退回列表页
    router.replace('/volunteer/list')
  } finally {
    loading.value = false
  }
}

/**
 * 审核记录时间轴
 * 按时间正序排列，形成「提交 -> 初审 -> 审核」的完整链路
 */
const timeline = computed(() => {
  const records = detail.value.auditRecords || []
  return [...records].sort((a, b) => new Date(a.time) - new Date(b.time))
})

/** 时间轴节点颜色：通过为绿、驳回为红、待审核为橙 */
function nodeType(record) {
  if (record.result === '已通过' || record.result === '通过') return 'success'
  if (record.result === '已驳回' || record.result === '驳回') return 'danger'
  if (record.result === '待审核') return 'warning'
  return 'primary'
}

/** 证件材料分类展示 */
const certificates = computed(() => detail.value.certificates || [])

function handlePreview(index) {
  previewIndex.value = index
  previewVisible.value = true
}

/** 变更资质状态（续期 / 作废） */
async function handleChangeStatus(status) {
  const actionText = status === '已通过' ? '恢复有效' : '作废'
  try {
    await ElMessageBox.confirm(
      `确定要将「${detail.value.name}」的资质状态变更为「${status}」吗？`,
      `${actionText}确认`,
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  await updateVolunteerStatus(detail.value.id, {
    qualificationStatus: status,
    remark: `管理员手动${actionText}资质`,
  })
  ElMessage.success('资质状态已更新')
  loadDetail()
}

onMounted(loadDetail)
</script>

<template>
  <div v-loading="loading" class="page-container">
    <PageHeader
      title="志愿者资质详情"
      :description="`查看 ${detail.name || ''} 的证件材料与完整审核记录`"
      show-back
      @back="router.push('/volunteer/list')"
    >
      <template #extra>
        <el-button
          v-if="detail.qualificationStatus === '已通过'"
          type="warning"
          plain
          @click="handleChangeStatus('已过期')"
        >
          <el-icon><CircleClose /></el-icon>
          作废资质
        </el-button>
        <el-button
          v-else-if="detail.qualificationStatus === '已过期' || detail.qualificationStatus === '已驳回'"
          type="success"
          @click="handleChangeStatus('已通过')"
        >
          <el-icon><CircleCheck /></el-icon>
          恢复有效
        </el-button>
      </template>
    </PageHeader>

    <div v-if="detail.id" class="detail">
      <!-- 左侧：基本信息 -->
      <div class="detail__left">
        <div class="app-card">
          <div class="app-card__body">
            <!-- 志愿者名片 -->
            <div class="profile">
              <el-avatar :size="72" :src="detail.avatar" class="profile__avatar">
                {{ detail.name?.slice(0, 1) }}
              </el-avatar>
              <h3 class="profile__name">{{ detail.name }}</h3>
              <StatusTag :status="detail.qualificationStatus" dot size="large" />

              <!-- 服务统计 -->
              <div class="profile__stats">
                <div class="profile__stat">
                  <span class="profile__stat-value">{{ detail.serviceHours || 0 }}</span>
                  <span class="profile__stat-label">服务时长(h)</span>
                </div>
                <div class="profile__stat">
                  <span class="profile__stat-value">{{ detail.serviceCount || 0 }}</span>
                  <span class="profile__stat-label">服务次数</span>
                </div>
              </div>
            </div>

            <el-descriptions :column="1" border class="detail__desc">
              <el-descriptions-item label="性别年龄">
                {{ detail.gender }} · {{ detail.age }} 岁
              </el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ detail.phone }}</el-descriptions-item>
              <el-descriptions-item label="所属社区">
                {{ detail.community?.fullName }}
              </el-descriptions-item>
              <el-descriptions-item label="技能特长">
                <el-tag
                  v-for="skill in detail.skills"
                  :key="skill"
                  size="small"
                  type="info"
                  round
                  class="skill-tag"
                >
                  {{ skill }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="申请时间">
                {{ formatDate(detail.applyTime, 'YYYY-MM-DD HH:mm') }}
              </el-descriptions-item>
              <el-descriptions-item label="审核时间">
                {{ detail.auditTime ? formatDate(detail.auditTime, 'YYYY-MM-DD HH:mm') : '—' }}
              </el-descriptions-item>
              <el-descriptions-item v-if="detail.auditRemark" label="审核意见">
                <span :class="{ 'detail__reject': detail.qualificationStatus === '已驳回' }">
                  {{ detail.auditRemark }}
                </span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </div>

      <!-- 右侧：证件 + 时间轴 -->
      <div class="detail__right">
        <!-- 证件材料 -->
        <div class="app-card">
          <div class="app-card__body">
            <div class="app-toolbar">
              <h3 class="detail__section-title">
                <el-icon><Files /></el-icon>
                证件材料
              </h3>
              <span class="app-text-secondary">共 {{ certificates.length }} 份，点击可放大</span>
            </div>

            <div v-if="certificates.length" class="certificate-grid">
              <div
                v-for="(cert, index) in certificates"
                :key="cert.name"
                class="certificate-card"
                @click="handlePreview(index)"
              >
                <el-image :src="cert.url" fit="cover" class="certificate-card__image" />
                <div class="certificate-card__mask">
                  <el-icon><ZoomIn /></el-icon>
                </div>
                <div class="certificate-card__footer">
                  <span class="certificate-card__name">{{ cert.name }}</span>
                  <el-tag size="small" type="info" round>{{ cert.type }}</el-tag>
                </div>
              </div>
            </div>

            <el-empty v-else description="暂未上传证件材料" :image-size="90" />
          </div>
        </div>

        <!-- 审核记录时间轴 -->
        <div class="app-card">
          <div class="app-card__body">
            <h3 class="detail__section-title">
              <el-icon><Clock /></el-icon>
              审核记录
            </h3>

            <el-timeline v-if="timeline.length" class="detail__timeline">
              <el-timeline-item
                v-for="(record, index) in timeline"
                :key="index"
                :type="nodeType(record)"
                :timestamp="record.time"
                placement="top"
                size="large"
              >
                <div class="timeline-node">
                  <div class="timeline-node__header">
                    <span class="timeline-node__title">{{ record.node }}</span>
                    <el-tag :type="nodeType(record)" size="small" round>{{ record.result }}</el-tag>
                  </div>
                  <p class="timeline-node__operator">
                    <el-icon><User /></el-icon>
                    操作人：{{ record.operator }}
                  </p>
                  <p v-if="record.remark" class="timeline-node__remark">{{ record.remark }}</p>
                </div>
              </el-timeline-item>
            </el-timeline>

            <el-empty v-else description="暂无审核记录" :image-size="90" />
          </div>
        </div>
      </div>
    </div>

    <!-- 证件大图预览 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="certificates.map((item) => item.url)"
      :initial-index="previewIndex"
      teleported
      @close="previewVisible = false"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.detail {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.detail__left,
.detail__right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* ------------------------------ 志愿者名片 ------------------------------ */
.profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--app-border-light);
}

.profile__avatar {
  background-color: var(--app-info);
  font-size: 26px;
}

.profile__name {
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.profile__stats {
  display: flex;
  width: 100%;
  margin-top: 10px;
}

.profile__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
  position: relative;

  /* 两项之间加分隔线 */
  & + &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 24px;
    background-color: var(--app-border-light);
  }
}

.profile__stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--app-primary);
}

.profile__stat-label {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.detail__desc {
  margin-top: 16px;
}

.detail__reject {
  color: var(--app-danger);
}

.skill-tag {
  margin: 2px 4px 2px 0;
}

/* ------------------------------ 证件网格 ------------------------------ */
.detail__section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.certificate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.certificate-card {
  position: relative;
  border: 1px solid var(--app-border-light);
  border-radius: $radius-md;
  overflow: hidden;
  cursor: zoom-in;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: var(--app-primary);
    box-shadow: var(--app-shadow-md);

    .certificate-card__mask {
      opacity: 1;
    }
  }
}

.certificate-card__image {
  width: 100%;
  height: 130px;
  display: block;
}

.certificate-card__mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.2s;
}

.certificate-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 8px 10px;
  background-color: var(--app-bg-card);
}

.certificate-card__name {
  font-size: 13px;
  color: var(--app-text-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ------------------------------ 时间轴 ------------------------------ */
.detail__timeline {
  margin-top: 20px;
  padding-left: 4px;
}

.timeline-node__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-node__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.timeline-node__operator {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--app-text-secondary);
}

.timeline-node__remark {
  margin-top: 6px;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--app-text-regular);
  background-color: var(--app-bg-hover);
  border-radius: $radius-sm;
}
</style>
