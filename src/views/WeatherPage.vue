<template>
  <div class="weather-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <span class="nav-title">🌤️ 고속도로 날씨</span>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>전국 고속도로 날씨를 불러오는 중…</p>
    </div>

    <!-- 에러 -->
    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <div class="error-title">날씨 정보를 불러올 수 없습니다</div>
        <div class="error-desc">{{ error }}</div>
      </div>
    </div>

    <!-- 요약 -->
    <div v-if="!loading && !error" class="summary-bar">
      <div class="summary-item">
        <span class="summary-num">{{ rainAreas }}</span>
        <span class="summary-label">비/눈 지역</span>
      </div>
      <div class="summary-item">
        <span class="summary-num">{{ avgTemp }}°</span>
        <span class="summary-label">평균 기온</span>
      </div>
      <div class="summary-item">
        <span class="summary-num">{{ maxTemp }}°</span>
        <span class="summary-label">최고 기온</span>
      </div>
    </div>

    <!-- 날씨 카드 리스트 -->
    <div v-if="!loading && !error" class="weather-list">
      <div v-for="w in weather" :key="w.name" class="weather-card" :class="{ rain: w.precip > 0 || w.weatherCode >= 51 }">
        <div class="w-main">
          <span class="w-icon">{{ getWeatherIcon(w.weatherCode) }}</span>
          <div class="w-info">
            <div class="w-name">{{ w.name }}</div>
            <div class="w-desc">{{ w.desc }}</div>
          </div>
          <div class="w-temp">
            <span class="w-temp-val">{{ w.temp }}°</span>
          </div>
        </div>
        <div class="w-details">
          <span class="w-detail">💧 {{ w.humidity }}%</span>
          <span class="w-detail">💨 {{ w.wind }}km/h</span>
          <span class="w-detail" :class="{ 'rain-prob': w.rainProb >= 50 }">🌧️ {{ w.rainProb }}%</span>
        </div>
      </div>
    </div>

    <div class="data-source">
      데이터 출처: Open-Meteo (자유 기상 API)<br>
      호출시각: {{ fetchedAt }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchHighwayWeather, getWeatherIcon, getWeatherDesc } from '../lib/api.js'

const loading = ref(false)
const error = ref('')
const weather = ref([])

const fetchedAt = ref('')

const rainAreas = computed(() => weather.value.filter(w => w.precip > 0 || w.weatherCode >= 51).length)
const avgTemp = computed(() => {
  const valid = weather.value.filter(w => w.temp !== null)
  if (valid.length === 0) return '-'
  return Math.round(valid.reduce((s, w) => s + w.temp, 0) / valid.length)
})
const maxTemp = computed(() => {
  const valid = weather.value.filter(w => w.temp !== null)
  if (valid.length === 0) return '-'
  return Math.max(...valid.map(w => w.temp))
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    weather.value = await fetchHighwayWeather()
    fetchedAt.value = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.weather-page { min-height: 100dvh; background: #f5f5f5; padding-bottom: 40px; }

.page-nav {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #1B355A; color: #fff;
  position: sticky; top: 0; z-index: 10;
}
.btn-back { background: none; border: none; color: #4D9BC6; font-size: 14px; font-weight: 600; cursor: pointer; }
.nav-title { font-size: 15px; font-weight: 700; }
.nav-spacer { flex: 1; }

.summary-bar { display: flex; background: #fff; padding: 16px; border-bottom: 1px solid #eee; }
.summary-item { flex: 1; text-align: center; border-right: 1px solid #eee; }
.summary-item:last-child { border-right: none; }
.summary-num { display: block; font-size: 22px; font-weight: 800; color: #1B355A; }
.summary-label { display: block; font-size: 10px; color: #999; margin-top: 2px; }

.loading { text-align: center; padding: 60px 20px; color: #888; }
.spinner {
  width: 32px; height: 32px; border: 3px solid #e0e0e0;
  border-top-color: #1B355A; border-radius: 50%;
  animation: spin 0.8s linear infinite; margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-box {
  margin: 20px 16px; background: #FEF3C7; border: 1px solid #F59E0B;
  border-radius: 12px; padding: 16px; display: flex; gap: 12px; align-items: flex-start;
}
.error-icon { font-size: 24px; flex-shrink: 0; }
.error-title { font-weight: 700; color: #92400E; font-size: 14px; }
.error-desc { font-size: 12px; color: #92400E; margin-top: 4px; }

.weather-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.weather-card {
  background: #fff; border-radius: 14px; padding: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.weather-card.rain { border-left: 3px solid #3B82F6; }
.w-main { display: flex; align-items: center; gap: 12px; }
.w-icon { font-size: 36px; }
.w-info { flex: 1; min-width: 0; }
.w-name { font-size: 15px; font-weight: 800; color: #1B355A; }
.w-desc { font-size: 11px; color: #888; margin-top: 2px; }
.w-temp-val { font-size: 28px; font-weight: 800; color: #1B355A; }
.w-details { display: flex; gap: 12px; margin-top: 10px; padding-top: 8px; border-top: 1px solid #f0f0f0; }
.w-detail { font-size: 12px; color: #666; font-weight: 600; }
.w-detail.rain-prob { color: #3B82F6; font-weight: 800; }

.data-source { text-align: center; padding: 20px; font-size: 11px; color: #ccc; line-height: 1.6; }
</style>
