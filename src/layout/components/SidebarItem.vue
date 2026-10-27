<script setup>
/**
 * 侧边栏菜单项（递归组件）
 *
 * 有两种渲染形态：
 *   1. 只有一个可见子路由 -> 渲染成单个 el-menu-item
 *   2. 有多个可见子路由   -> 渲染成 el-sub-menu，内部递归自己
 * 这样处理后，像「订单管理」这种只有一级子菜单的模块不会出现多余的折叠层。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  // 路由配置项
  item: { type: Object, required: true },
  // 拼接好的完整路径前缀
  basePath: { type: String, default: '' },
})

const route = useRoute()

/** 过滤掉 hidden 的子路由 */
const visibleChildren = computed(() => (props.item.children || []).filter((child) => !child.meta?.hidden))

/** 拼接完整路径，兼容绝对路径与相对路径两种写法 */
function resolvePath(childPath) {
  if (!childPath) return props.basePath
  if (childPath.startsWith('/')) return childPath
  return `${props.basePath.replace(/\/$/, '')}/${childPath}`
}

/** 当前菜单是否处于激活态（详情页通过 meta.activeMenu 指定高亮项） */
const activeMenu = computed(() => route.meta?.activeMenu || route.path)

const hasChildren = computed(() => visibleChildren.value.length > 0)
const onlyChild = computed(() => (visibleChildren.value.length === 1 ? visibleChildren.value[0] : null))

/** 单子菜单场景下，隐去了唯一子项就直接把父级渲染成菜单项 */
const isSingle = computed(
  () => hasChildren.value && onlyChild.value && (!onlyChild.value.children || onlyChild.value.children.length === 0),
)
</script>

<template>
  <!-- 无可见子路由：不渲染（避免出现点不动的空菜单） -->
  <template v-if="!item.meta?.hidden">
    <!-- 形态一：单个子路由，渲染成一级菜单项 -->
    <el-menu-item v-if="isSingle" :index="resolvePath(onlyChild.path)" class="sidebar-item">
      <el-icon v-if="item.meta?.icon || onlyChild.meta?.icon">
        <component :is="item.meta?.icon || onlyChild.meta?.icon" />
      </el-icon>
      <template #title>{{ item.meta?.title || onlyChild.meta?.title }}</template>
    </el-menu-item>

    <!-- 形态二：多个子路由，渲染成可折叠子菜单 -->
    <el-sub-menu v-else-if="hasChildren" :index="basePath || item.path" class="sidebar-submenu">
      <template #title>
        <el-icon v-if="item.meta?.icon">
          <component :is="item.meta.icon" />
        </el-icon>
        <span>{{ item.meta?.title }}</span>
      </template>

      <!-- 递归渲染子级 -->
      <SidebarItem
        v-for="child in visibleChildren"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(child.path)"
      />
    </el-sub-menu>

    <!-- 形态三：自身就是叶子节点（一级菜单无子级） -->
    <el-menu-item v-else :index="resolvePath(item.path)" class="sidebar-item">
      <el-icon v-if="item.meta?.icon">
        <component :is="item.meta.icon" />
      </el-icon>
      <template #title>{{ item.meta?.title }}</template>
    </el-menu-item>
  </template>
</template>

<style scoped lang="scss">
.sidebar-item,
.sidebar-submenu {
  /* 菜单项文字跟随主题切换 */
  color: var(--app-menu-text);
}
</style>
