<template> 
  <div style="padding: 20px;">
    <h2 style="text-align: center;">版本管理</h2>

    <!-- 只有发布者（PUBLISHER）才可以查看甘特图按钮 -->
    <div v-if="isPublisher" style="text-align:center; margin-bottom: 10px;">
      <el-button type="primary" @click="goGanttPage">查看甘特图</el-button>
    </div>

    <!-- 搜索栏 -->
    <div style="text-align: center; margin-top: 10px;">
      <el-input
        v-model="searchIosVersion"
        placeholder="输入iOS版本搜索"
        clearable
        style="width: 300px; margin-bottom: 10px;"
        @keyup.enter="searchVersions"
      />
      <el-button type="primary" @click="searchVersions">搜索</el-button>
      <el-button @click="resetSearch" style="margin-left: 10px;">重置</el-button>
    </div>

    <!-- 卡片显示版本信息 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="8" v-for="version in versions" :key="version.id">
        <el-card shadow="hover">
          <h3>{{ version.iosVersion }}</h3>
          <p><b>创建时间：</b>{{ version.creationTime }}</p>
          <p><b>发布日期：</b>{{ version.releaseDate }}</p>
          <p><b>更新说明：</b>{{ version.changelog }}</p>
          <!-- 状态使用中文显示 -->
          <p><b>状态：</b>{{ translateStatus(version.status) }}</p>
          <!-- 设备名称 -->
          <p><b>设备：</b>{{ findDeviceName(version.deviceId) }}</p>

          <div style="margin-top: 10px; text-align: right;">
            <el-button v-if="isPublisher" type="primary" size="small" @click="editVersion(version)">编辑</el-button>
            <el-button v-if="isPublisher" type="danger" size="small" @click="deleteVersionItem(version.id)">删除</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分页组件 -->
    <el-pagination
      layout="prev, pager, next"
      :total="total"
      :page-size="pageSize"
      v-model:current-page="currentPage"
      @current-change="handleCurrentChange"
      style="text-align: center; margin-top: 20px;"
    />

    <el-divider></el-divider>

    <!-- 只有发布者才可以添加编辑版本 -->
    <div v-if="isPublisher" style="max-width: 600px; margin: auto;">
      <el-card shadow="always">
        <h3>{{ editing ? "编辑版本" : "添加新版本" }}</h3>
        <el-form :model="form" label-width="120px">
          <el-form-item label="iOS Version">
            <el-input v-model="form.iosVersion"></el-input>
          </el-form-item>

          <el-form-item label="创建时间">
            <el-date-picker
              v-model="form.creationTime"
              type="date"
              placeholder="选择创建时间"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <el-form-item label="发布日期">
            <el-date-picker
              v-model="form.releaseDate"
              type="date"
              placeholder="选择发布日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <el-form-item label="Changelog">
            <el-input v-model="form.changelog"></el-input>
          </el-form-item>

          <el-form-item label="Status">
            <el-select v-model="form.status">
              <el-option label="活跃" value="ACTIVE"></el-option>
              <el-option label="废弃" value="DEPRECATED"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="设备">
            <el-select v-model="form.deviceId" placeholder="请选择设备">
              <el-option
                v-for="d in deviceList"
                :key="d.id"
                :label="d.deviceModel"
                :value="d.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="submitForm">{{ editing ? "更新" : "添加" }}</el-button>
            <el-button v-if="editing" @click="cancelEdit">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      versions: [],      // 版本数据
      deviceList: [],    // 设备列表
      form: {
        iosVersion: '',
        creationTime: null,
        releaseDate: null,
        changelog: '',
        status: 'ACTIVE',
        deviceId: null
      },
      editing: false,
      editId: null,
      total: 0,
      currentPage: 1,
      pageSize: 5,
      searchIosVersion: '',
      // 从 localStorage 中获取角色，值为 "USER" 或 "PUBLISHER"
      userRole: localStorage.getItem('role') || ''
    }
  },
  computed: {
    isPublisher() {
      return this.userRole === 'PUBLISHER'
    }
  },
  methods: {
    // 点击按钮跳转到甘特图页面
    goGanttPage() {
      this.$router.push('/version-gantt')
    },

    // 将状态转换为中文显示
    translateStatus(status) {
      if (status === 'ACTIVE') return '活跃'
      if (status === 'DEPRECATED') return '废弃'
      return status
    },

    // 根据设备ID查找设备名称
    findDeviceName(deviceId) {
      if (!deviceId) return '未选择'
      const d = this.deviceList.find(item => item.id === deviceId)
      return d ? d.deviceModel : '未知设备'
    },

    async fetchDevices() {
      try {
        const res = await axios.get('/api/device/list')
        this.deviceList = res.data
      } catch (err) {
        console.error('获取设备失败', err)
      }
    },
    async fetchVersions(page = 0) {
      try {
        const params = { page, size: this.pageSize, iosVersion: this.searchIosVersion }
        const url = this.searchIosVersion ? '/api/version/search' : '/api/version/list'
        const response = await axios.get(url, { params })

        this.versions = response.data.content
        this.total = response.data.totalElements
        this.currentPage = response.data.number + 1
      } catch (error) {
        this.$message.error('加载失败')
        console.error(error)
      }
    },
    searchVersions() {
      this.fetchVersions(0)
    },
    resetSearch() {
      this.searchIosVersion = ''
      this.fetchVersions(0)
    },

    editVersion(v) {
      this.editing = true
      this.editId = v.id
      this.form = { 
        iosVersion: v.iosVersion,
        creationTime: v.creationTime,
        releaseDate: v.releaseDate,
        changelog: v.changelog,
        status: v.status,
        deviceId: v.deviceId
      }
    },
    async submitForm() {
      try {
        if (this.editing) {
          await axios.put(`/api/version/${this.editId}`, this.form)
          this.$message.success('版本更新成功')
        } else {
          await axios.post('/api/version/add', this.form)
          this.$message.success('版本添加成功')
        }
        this.fetchVersions(this.currentPage - 1)
        this.resetForm()
      } catch (error) {
        this.$message.error('提交失败')
        console.error(error)
      }
    },
    async deleteVersionItem(id) {
      try {
        await axios.delete(`/api/version/${id}`)
        this.$message.success('删除成功')
        this.fetchVersions(this.currentPage - 1)
      } catch (error) {
        this.$message.error('删除失败')
        console.error(error)
      }
    },
    cancelEdit() {
      this.resetForm()
    },
    resetForm() {
      this.editing = false
      this.editId = null
      this.form = {
        iosVersion: '',
        creationTime: null,
        releaseDate: null,
        changelog: '',
        status: 'ACTIVE',
        deviceId: null
      }
    },
    handleCurrentChange(page) {
      this.fetchVersions(page - 1)
    }
  },
  async created() {
    this.fetchDevices()
    this.fetchVersions()
  }
}
</script>

<style scoped>
.el-card {
  margin-bottom: 20px;
}
</style>
