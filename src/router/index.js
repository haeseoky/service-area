import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue'),
  },
  {
    path: '/events',
    name: 'Events',
    component: () => import('../views/EventsPage.vue'),
  },
  {
    path: '/traffic',
    name: 'Traffic',
    component: () => import('../views/TrafficPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
