<template>
  <div class="version-gantt-page">
    <h1>版本甘特图</h1>
    <div ref="ganttContainer" class="gantt-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import gantt from 'dhtmlx-gantt'

// 1) dhtmlx-gantt 默认样式
// 注意：文件名为 dhtmlxgantt.css（无中划线）
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
// 2) 覆盖样式（与 views 文件夹同级）
import '../gantt-custom.css'

/**
 * 格式化日期为 "dd-mm-yyyy"
 */
function formatDate(date) {
  if (!date) return ""
  const d = date instanceof Date ? date : new Date(date)
  const day = ("0" + d.getDate()).slice(-2)
  const month = ("0" + (d.getMonth() + 1)).slice(-2)
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

/**
 * 将后端 Version 对象转换为 dhtmlx-gantt Task 数据
 */
function transformVersionToTask(version) {
  let duration = 1
  if (version.creationTime && version.releaseDate) {
    const start = new Date(version.creationTime)
    const end = new Date(version.releaseDate)
    duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    if (duration <= 0) duration = 1
  }
  return {
    id: version.id,
    text: `版本号: ${version.iosVersion}`,
    start_date: formatDate(version.creationTime),
    duration: duration,
    // progress=1 -> ACTIVE, progress=0 -> DEPRECATED
    progress: version.status === "ACTIVE" ? 1 : 0,
    details: `更新说明: ${version.changelog || '无'}`,
    // 保存后端数据到 _version
    _version: { ...version }
  }
}

/**
 * 将 dhtmlx-gantt Task 数据转换回后端 Version 对象
 */
function convertTaskToVersion(task) {
  let version = task._version || {}
  // 去掉 "版本号: "
  version.iosVersion = task.text.replace("版本号: ", "")
  // 处理日期：将 start_date + duration 转为 creationTime + releaseDate
  let dateStr = (task.start_date instanceof Date) ? formatDate(task.start_date) : task.start_date
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const startDate = new Date(parts[2], parts[1] - 1, parts[0])
    const newEndDate = new Date(startDate.getTime() + task.duration * 86400000)
    version.creationTime = `${startDate.getFullYear()}-${("0" + (startDate.getMonth()+1)).slice(-2)}-${("0" + startDate.getDate()).slice(-2)}`
    version.releaseDate = `${newEndDate.getFullYear()}-${("0" + (newEndDate.getMonth()+1)).slice(-2)}-${("0" + newEndDate.getDate()).slice(-2)}`
  }
  version.status = task.progress === 1 ? "ACTIVE" : "DEPRECATED"
  return version
}

/**
 * 获取版本数据，返回格式：{ data: [...], links: [] }
 */
async function fetchVersions() {
  try {
    const response = await axios.get("/api/version/list", { params: { page: 0, size: 1000 } })
    const versions = response.data.content || []
    console.log("后端返回 versions:", versions)
    const tasks = versions.map(transformVersionToTask)
    return { data: tasks, links: [] }
  } catch (error) {
    console.error("获取版本数据失败:", error)
    return { data: [], links: [] }
  }
}

/**
 * 获取版本关联数据，返回数组：[{ id, source, target, type }, ...]
 */
async function fetchVersionRelations() {
  try {
    const response = await axios.get("/api/version-relations")
    return response.data.map(rel => ({
      id: rel.id,
      source: rel.sourceVersion.id,
      target: rel.targetVersion.id,
      type: rel.relationType
    }))
  } catch (error) {
    console.error("获取关联关系失败:", error)
    return []
  }
}

const ganttContainer = ref(null)

onMounted(async () => {
  // 自定义任务样式：根据版本状态设置任务颜色
  gantt.templates.task_class = (start, end, task) => {
    if (task._version?.status === "ACTIVE") {
      return "gantt_task_active"
    } else if (task._version?.status === "DEPRECATED") {
      return "gantt_task_deprecated"
    }
    return ""
  }

  // 允许拖动、调整、连线
  gantt.config.drag_move = true
  gantt.config.drag_resize = true
  gantt.config.drag_links = true
  gantt.config.date_format = "%d-%m-%Y"
  // 关键：开启连线删除
  gantt.config.link_deleting = true
  // 如需要右键菜单删除连线，可启用：
  // gantt.config.link_menu = true

  // 初始化甘特图
  gantt.init(ganttContainer.value)

  // 同时获取任务和关联数据
  const tasksData = await fetchVersions()
  const linksData = await fetchVersionRelations()

  // 解析数据到甘特图
  gantt.parse({
    data: tasksData.data,
    links: linksData
  })

  // --------------任务相关事件--------------
  gantt.attachEvent("onAfterTaskUpdate", async (id, item) => {
    const version = convertTaskToVersion(item)
    try {
      await axios.put(`/api/version/${id}`, version)
      console.log("任务更新成功")
      item._version = { ...version }
    } catch (error) {
      console.error("任务更新失败:", error)
    }
  })

  gantt.attachEvent("onAfterTaskAdd", async (id, item) => {
    const version = convertTaskToVersion(item)
    try {
      const response = await axios.post("/api/version/add", version)
      console.log("任务添加成功", response.data)
      if (response.data?.id) {
        item.id = response.data.id
      }
      item._version = { ...response.data }
    } catch (error) {
      console.error("任务添加失败:", error)
    }
  })

  gantt.attachEvent("onAfterTaskDelete", async (id, item) => {
    try {
      await axios.delete(`/api/version/${id}`)
      console.log("任务删除成功")
    } catch (error) {
      console.error("任务删除失败:", error)
    }
  })

  // --------------关联（连线）相关事件--------------
  // 创建关联
  gantt.attachEvent("onLinkCreated", async (link) => {
    try {
      const response = await axios.post("/api/version-relations", {
        sourceVersionId: link.source,
        targetVersionId: link.target,
        relationType: link.type
      })
      link.id = response.data.id
      console.log("关联创建成功:", response.data)
    } catch (error) {
      console.error("关联创建失败:", error)
      gantt.deleteLink(link.id)
    }
  })

  // 更新关联（如修改关联类型）
  gantt.attachEvent("onLinkUpdate", async (link) => {
    try {
      await axios.put(`/api/version-relations/${link.id}`, {
        sourceVersionId: link.source,
        targetVersionId: link.target,
        relationType: link.type
      })
      console.log("关联更新成功")
    } catch (error) {
      console.error("关联更新失败:", error)
      // 回滚操作
      const links = await fetchVersionRelations()
      gantt.parse({ links })
    }
  })

  // 删除关联（改用 onAfterLinkDelete）
  gantt.attachEvent("onAfterLinkDelete", async (id, link) => {
    try {
      await axios.delete(`/api/version-relations/${id}`)
      console.log("关联删除成功")
    } catch (error) {
      console.error("关联删除失败:", error)
      // 回滚操作：重新加载关联数据
      const links = await fetchVersionRelations()
      gantt.parse({ links })
    }
  })
})
</script>

<!-- 不使用 scoped，确保自定义样式能正确应用到 gantt DOM -->
<style>
.version-gantt-page {
  padding: 20px;
}
.gantt-container {
  width: 100%;
  height: 600px;
}
/* 自定义任务颜色 */
.gantt_task_active .gantt_task_bar {
  background-color: #3c763d !important;
}
.gantt_task_deprecated .gantt_task_bar {
  background-color: #f0ad4e !important;
}
</style>
