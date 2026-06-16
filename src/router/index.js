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
  {
    path: '/brands',
    name: 'Brands',
    component: () => import('../views/BrandPage.vue'),
  },
  {
    path: '/facilities',
    name: 'Facilities',
    component: () => import('../views/ConvPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
