<template>
  <div class="register-container" style="max-width: 400px; margin: 0 auto; padding-top: 50px;">
    <el-card>
      <h2 style="text-align: center;">注册</h2>
      <el-form :model="registerForm" ref="registerFormRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="registerForm.role" placeholder="请选择角色">
            <el-option label="普通用户" value="USER"></el-option>
            <el-option label="发布者" value="PUBLISHER"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="register">注册</el-button>
        </el-form-item>
      </el-form>
      <div style="text-align: center; margin-top: 10px;">
        <router-link to="/login">已有账号？去登录</router-link>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Register',
  data() {
    return {
      registerForm: {
        username: '',
        password: '',
        role: 'USER'
      }
    }
  },
  methods: {
    async register() {
      try {
        const response = await axios.post('/api/auth/register', this.registerForm)
        this.$message.success(response.data)
        this.$router.push('/login')
      } catch (error) {
        this.$message.error(error.response.data || '注册失败')
      }
    }
  }
}
</script>
