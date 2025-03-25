// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  root: '.', // 默认就是当前目录
  // 如果你把 index.html 放在 public 目录下，也可以设置 publicDir: 'public'
})
