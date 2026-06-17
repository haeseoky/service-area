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
  {
    path: '/weather',
    name: 'Weather',
    component: () => import('../views/WeatherPage.vue'),
  },
  {
    path: '/air-quality',
    name: 'AirQuality',
    component: () => import('../views/AirQualityPage.vue'),
  },
  {
    path: '/weekly-weather',
    name: 'WeeklyWeather',
    component: () => import('../views/WeeklyWeatherPage.vue'),
  },
  {
    path: '/route-traffic',
    name: 'RouteTraffic',
    component: () => import('../views/RouteTrafficPage.vue'),
  },
  {
    path: '/driving-safety',
    name: 'DrivingSafety',
    component: () => import('../views/DrivingSafetyPage.vue'),
  },
  {
    path: '/flood-risk',
    name: 'FloodRisk',
    component: () => import('../views/FloodRiskPage.vue'),
  },
  {
    path: '/road-surface',
    name: 'RoadSurface',
    component: () => import('../views/RoadSurfacePage.vue'),
  },
  {
    path: '/coastal-sea',
    name: 'CoastalSea',
    component: () => import('../views/CoastalSeaPage.vue'),
  },
  {
    path: '/elevation',
    name: 'Elevation',
    component: () => import('../views/ElevationPage.vue'),
  },
  {
    path: '/weather-history',
    name: 'WeatherHistory',
    component: () => import('../views/WeatherHistoryPage.vue'),
  },
  {
    path: '/weather-model',
    name: 'WeatherModel',
    component: () => import('../views/WeatherModelPage.vue'),
  },
  {
    path: '/minutely-forecast',
    name: 'MinutelyForecast',
    component: () => import('../views/MinutelyForecastPage.vue'),
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/SearchPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
