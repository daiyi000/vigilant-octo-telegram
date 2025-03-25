<template>
  <div style="text-align: center; margin-top: 100px;">
    <el-card style="width: 400px; margin: auto;">
      <h2>欢迎使用iPhone版本管理系统</h2>
      <div style="margin-top: 20px;">
        <el-button type="primary" @click="$router.push('/login')">登录</el-button>
        <el-button type="success" @click="$router.push('/register')">注册</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Index'
}
</script>
