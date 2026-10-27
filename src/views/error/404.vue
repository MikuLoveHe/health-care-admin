<script setup>
/**
 * 404 页面
 */
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <div class="not-found__code">404</div>
    <h2 class="not-found__title">页面走丢了</h2>
    <p class="not-found__desc">抱歉，你访问的页面不存在或已被移除</p>
    <div class="not-found__actions">
      <el-button type="primary" @click="router.push('/')">
        <el-icon><HomeFilled /></el-icon>
        返回首页
      </el-button>
      <el-button @click="router.back()">返回上一页</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 24px;
  text-align: center;
  background-color: var(--app-bg-page);
}

.not-found__code {
  font-size: 110px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 6px;
  background: linear-gradient(135deg, var(--app-primary), var(--app-primary-light));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.not-found__title {
  margin-top: 16px;
  font-size: 22px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.not-found__desc {
  margin-top: 8px;
  font-size: 14px;
  color: var(--app-text-secondary);
}

.not-found__actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}
</style>
