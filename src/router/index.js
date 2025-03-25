import { createRouter, createWebHashHistory } from 'vue-router'

// 页面组件
import Index from '../views/Index.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import VersionManager from '../views/VersionManager.vue'
import VersionGanttPage from '../views/VersionGanttPage.vue'

const routes = [
  {
    path: '/',
    component: Index
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/register',
    component: Register
  },
  {
    path: '/version-manager',
    component: VersionManager,
    meta: { requiresAuth: true } // 需要登录权限
  },
  {
    path: '/version-gantt',
    component: VersionGanttPage,
    meta: { requiresAuth: true } // 可选，如果也需要登录权限
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由导航守卫
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const role = localStorage.getItem('role')
    if (!role) {
      return next('/login') // 未登录 => 跳转到登录
    }
  }
  next()
})

export default router
