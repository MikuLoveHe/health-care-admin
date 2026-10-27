import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import 'element-plus/dist/index.css'
// Element Plus 官方暗黑模式变量，配合 <html class="dark"> 使用
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
import router from './router'
import pinia from './stores'
// 自定义主题必须放在 Element Plus 样式之后，否则会被组件库默认样式覆盖
import '@/assets/styles/index.scss'

const app = createApp(App)

// 全局注册 Element Plus 图标组件，模板中可直接写 <el-icon><Search /></el-icon>
Object.entries(ElementPlusIconsVue).forEach(([name, component]) => {
  app.component(name, component)
})

app.use(pinia)
app.use(router)
// 全量引入组件库并指定中文语言包
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
