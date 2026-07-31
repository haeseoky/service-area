import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue'),
    meta: { title: '고속도로 휴게소 정보 허브 🛣️', description: '전국 고속도로 휴게소 이벤트·브랜드·편의시설·날씨·교통량 종합 정보' },
  },
  {
    path: '/events',
    name: 'Events',
    component: () => import('../views/EventsPage.vue'),
    meta: { title: '휴게소 이벤트 - 고속도로 휴게소 정보 허브', description: '전국 고속도로 휴게소 진행 중인 이벤트·프로모션 조회' },
  },
  {
    path: '/traffic',
    name: 'Traffic',
    component: () => import('../views/TrafficPage.vue'),
    meta: { title: '수도권 관문 교통량 - 고속도로 휴게소 정보 허브', description: '수도권 6대 관문 시간대별·차종별 통행량 분석' },
  },
  {
    path: '/brands',
    name: 'Brands',
    component: () => import('../views/BrandPage.vue'),
    meta: { title: '브랜드 매장 - 고속도로 휴게소 정보 허브', description: '휴게소별 입점 브랜드 검색 (할리스, CU, 롯데리아 등)' },
  },
  {
    path: '/facilities',
    name: 'Facilities',
    component: () => import('../views/ConvPage.vue'),
    meta: { title: '편의시설 - 고속도로 휴게소 정보 허브', description: '수유실, 샤워실, 경정비 등 휴게소 편의시설 검색' },
  },
  {
    path: '/weather',
    name: 'Weather',
    component: () => import('../views/WeatherPage.vue'),
    meta: { title: '고속도로 날씨 - 고속도로 휴게소 정보 허브', description: '전국 고속도로 주요 지점 실시간 날씨 정보' },
  },
  {
    path: '/air-quality',
    name: 'AirQuality',
    component: () => import('../views/AirQualityPage.vue'),
    meta: { title: '고속도로 대기질 - 고속도로 휴게소 정보 허브', description: 'PM10·PM2.5·자외선·대기성분 실시간 정보' },
  },
  {
    path: '/weekly-weather',
    name: 'WeeklyWeather',
    component: () => import('../views/WeeklyWeatherPage.vue'),
    meta: { title: '고속도로 주간날씨 - 고속도로 휴게소 정보 허브', description: '7일 전망·일출/일몰·자외선·강수확률 예보' },
  },
  {
    path: '/route-traffic',
    name: 'RouteTraffic',
    component: () => import('../views/RouteTrafficPage.vue'),
    meta: { title: '노선별 교통량 분석 - 고속도로 휴게소 정보 허브', description: '19개 노선 전 영업소·차종·시간대별 상세 교통량 분석' },
  },
  {
    path: '/driving-safety',
    name: 'DrivingSafety',
    component: () => import('../views/DrivingSafetyPage.vue'),
    meta: { title: '운전안전 지수 - 고속도로 휴게소 정보 허브', description: '가시거리·돌풍·적설 종합 분석 안전 점수' },
  },
  {
    path: '/flood-risk',
    name: 'FloodRisk',
    component: () => import('../views/FloodRiskPage.vue'),
    meta: { title: '하천 범람 위험 - 고속도로 휴게소 정보 허브', description: '고속도로 인근 하천 유량·홍수 예측 (Open-Meteo Flood API)' },
  },
  {
    path: '/road-surface',
    name: 'RoadSurface',
    component: () => import('../views/RoadSurfacePage.vue'),
    meta: { title: '노면 상태 예측 - 고속도로 휴게소 정보 허브', description: '표면 온도·수분·결빙/과열 위험 분석 (Open-Meteo Soil API)' },
  },
  {
    path: '/coastal-sea',
    name: 'CoastalSea',
    component: () => import('../views/CoastalSeaPage.vue'),
    meta: { title: '해안 해상 정보 - 고속도로 휴게소 정보 허브', description: '파고·너울·수온 — 해안 고속도로 주행 위험 (Open-Meteo Marine API)' },
  },
  {
    path: '/elevation',
    name: 'Elevation',
    component: () => import('../views/ElevationPage.vue'),
    meta: { title: '표고 프로파일 - 고속도로 휴게소 정보 허브', description: '전국 고속도로 해발 고도·경사도·산악 구간 분석 (Open-Meteo Elevation API)' },
  },
  {
    path: '/weather-history',
    name: 'WeatherHistory',
    component: () => import('../views/WeatherHistoryPage.vue'),
    meta: { title: '기상 이력 분석 - 고속도로 휴게소 정보 허브', description: '과거 7일 기상 관측 데이터·기온 추이·강수 패턴 분석 (Open-Meteo ERA5 Archive)' },
  },
  {
    path: '/weather-model',
    name: 'WeatherModel',
    component: () => import('../views/WeatherModelPage.vue'),
    meta: { title: '멀티모델 예보 비교 - 고속도로 휴게소 정보 허브', description: 'GFS·ICON·ECMWF 3대 모델 예보 비교·신뢰도 분석' },
  },
  {
    path: '/minutely-forecast',
    name: 'MinutelyForecast',
    component: () => import('../views/MinutelyForecastPage.vue'),
    meta: { title: '단기 강수·시정 예보 - 고속도로 휴게소 정보 허브', description: '15분 단위 강수·가시거리 예측 — 앞으로 4시간 (Open-Meteo minutely_15)' },
  },
  {
    path: '/thunderstorm',
    name: 'Thunderstorm',
    component: () => import('../views/ThunderstormPage.vue'),
    meta: { title: '뇌우·대기불안정 예보 - 고속도로 휴게소 정보 허브', description: 'CAPE·상승지수·이슬점 기반 낙뢰·뇌우 발생 가능성 분석 (Open-Meteo)' },
  },
  {
    path: '/nasa-weather',
    name: 'NasaWeather',
    component: () => import('../views/NasaWeatherPage.vue'),
    meta: { title: 'NASA POWER 날씨 - 고속도로 휴게소 정보 허브', description: 'NASA POWER 위성 기반 전 세계 날씨·태양열·풍력 데이터' },
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/SearchPage.vue'),
    meta: { title: '휴게소 통합검색 - 고속도로 휴게소 정보 허브', description: '이벤트·브랜드·편의시설 한번에 검색' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
