import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // @ 指向 src，全项目统一用 @/ 引用，避免 ../../.. 式的相对路径
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    // 本项目全量引入了 Element Plus 与 ECharts，单包体积较大，放宽告警阈值
    chunkSizeWarningLimit: 2000,
  },
})
