<template>
  <div class="login-container" style="max-width: 400px; margin: 50px auto;">
    <el-card>
      <h2 style="text-align: center;">登录</h2>
      <el-form :model="loginForm">
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="login">登录</el-button>
        </el-form-item>
      </el-form>
      <div style="text-align: center; margin-top: 10px;">
        <router-link to="/register">没有账号？去注册</router-link>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      }
    }
  },
  methods: {
    async login() {
      try {
        const response = await axios.post('/api/auth/login', {
          username: this.loginForm.username,
          password: this.loginForm.password
        })
        // 假设后端登录成功后，返回的响应中没有角色信息
        // 你需要在后端登录成功时也返回角色信息, 或者在登录后再请求一次获取用户信息
        // 这里演示一个额外请求：
        const userInfo = await axios.get(`/api/auth/userinfo?username=${this.loginForm.username}`)
        const { role } = userInfo.data
        // 存储到 localStorage
        localStorage.setItem('username', this.loginForm.username)
        localStorage.setItem('role', role)

        this.$message.success("登录成功")
        // 跳转到版本管理
        this.$router.push('/version-manager')
      } catch (err) {
        this.$message.error(err.response?.data || '登录失败')
      }
    }
  }
}
</script>
