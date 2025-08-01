import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MobileHomeView from '../views/MobileHomeView.vue'
import { isMobile } from '@/utils/device' // 需要实现的设备检测工具


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => 
      isMobile() 
        ? import('@/views/MobileHomeView.vue')
        : import('@/views/HomeView.vue')
      // component: MobileView,
      // children: [
      //   {
      //     path: "/things",
      //     name: "things",
      //     component: ThingsView
      //   },
      // ]
    },
    {
      path: '/mobile',
      name: 'mobile',
      component: MobileHomeView
    }
  ]
})

export default router
