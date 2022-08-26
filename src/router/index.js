import Vue from 'vue'
import VueRouter from 'vue-router'
import Live2dModel from '@/views/Live2dModel'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'index',
    redirect: '/model',
  },
  {
    path: '/model',
    name: 'model',
    component: Live2dModel
  }
]

const router = new VueRouter({
  routes
})

export default router
