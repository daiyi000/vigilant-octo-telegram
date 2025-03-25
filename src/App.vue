<template>
  <div id="app">
    <!-- 页眉 -->
    <header style="background: #f5f5f5; padding: 10px;">
      <el-row>
        <el-col :span="24" style="text-align: center;">
          <h2>我的iPhone版本管理系统</h2>
        </el-col>
      </el-row>
    </header>

    <!-- 路由切换的页面内容 -->
    <router-view />

    <!-- 页脚 -->
    <footer style="background: #f5f5f5; padding: 10px; margin-top: 20px; text-align: center;">
      <p>Copyright © 2025 My Company</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style scoped>
body {
  margin: 0;
  padding: 0;
  background-color: #f9f9f9;
}
</style>
