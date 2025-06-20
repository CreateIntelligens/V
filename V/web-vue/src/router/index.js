import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/home/index.vue'),
    meta: {
      title: '首頁'
    }
  },
  {
    path: '/video/edit',
    name: 'VideoEdit',
    component: () => import('@/views/video-edit/VideoEditView.vue'),
    meta: {
      title: '影片編輯'
    }
  },
  {
    path: '/models',
    name: 'Models',
    component: () => import('@/views/models/index.vue'),
    meta: {
      title: '模特管理'
    }
  },
  {
    path: '/videos',
    name: 'Videos',
    component: () => import('@/views/videos/index.vue'),
    meta: {
      title: '作品管理'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守衛
router.beforeEach((to, from, next) => {
  // 設置頁面標題
  if (to.meta.title) {
    document.title = `${to.meta.title} - HeyGem 數字人生成器`
  }
  
  next()
})

export default router
