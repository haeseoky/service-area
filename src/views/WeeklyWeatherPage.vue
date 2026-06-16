<template>
  <div class="forecast-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <span class="nav-title">📅 고속도로 주간날씨</span>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>주간 날씨 전망을 불러오는 중…</p>
    </div>

    <!-- 에러 -->
    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <div class="error-title">데이터를 불러올 수 없습니다</div>
        <div class="error-desc">{{ error }}</div>
      </div>
    </div>

    <template v-if="!loading && !error">
      <!-- 호출시각 -->
      <div class="update-info">
        🕐 호출시각: {{ fetchedAt }}
      </div>

      <!-- 지점 선택 탭 -->
      <div class="point-tabs">
        <button v-for="p in forecasts" :key="p.name"
          :class="['point-tab', { active: selectedPoint === p.name }]"
          @click="selectedPoint = p.name">
          {{ p.name.split(' ')[0] }}
        </button>
      </div>

      <!-- 오늘 요약 카드 -->
      <div v-if="current" class="today-card">
        <div class="today-header">
          <div class="today-emoji">{{ getWeatherIcon(current.days[0].weatherCode) }}</div>
          <div class="today-info">
            <div class="today-name">{{ current.name }}</div>
            <div class="today-desc">{{ getWeatherDesc(current.days[0].weatherCode) }}</div>
          </div>
          <div class="today-temp">
            <span class="temp-max">{{ current.days[0].tempMax }}°</span>
            <span class="temp-sep">/</span>
            <span class="temp-min">{{ current.days[0].tempMin }}°</span>
          </div>
        </div>

        <div class="today-grid">
          <div class="today-item">
            <span class="item-icon">🌅</span>
            <span class="item-label">일출</span>
            <span class="item-value">{{ formatTime(current.days[0].sunrise) }}</span>
          </div>
          <div class="today-item">
            <span class="item-icon">🌇</span>
            <span class="item-label">일몰</span>
            <span class="item-value">{{ formatTime(current.days[0].sunset) }}</span>
          </div>
          <div class="today-item">
            <span class="item-icon">🔆</span>
            <span class="item-label">자외선</span>
            <span class="item-value" :style="{ color: getUVGrade(current.days[0].uvMax).color }">
              {{ getUVGrade(current.days[0].uvMax).label }} ({{ current.days[0].uvMax }})
            </span>
          </div>
          <div class="today-item">
            <span class="item-icon">💧</span>
            <span class="item-label">강수확률</span>
            <span class="item-value">{{ current.days[0].precipProb }}%</span>
          </div>
          <div class="today-item">
            <span class="item-icon">🌧️</span>
            <span class="item-label">예상강수</span>
            <span class="item-value">{{ current.days[0].precipSum }}mm</span>
          </div>
          <div class="today-item">
            <span class="item-icon">💨</span>
            <span class="item-label">최대풍속</span>
            <span class="item-value">{{ current.days[0].windMax }}km/h</span>
          </div>
        </div>

        <!-- 일조시간 -->
        <div class="daylight-bar">
          <span>☀️ 일조시간: {{ daylightDuration(current.days[0]) }}</span>
        </div>
      </div>

      <!-- 7일 전망 -->
      <div class="forecast-section">
        <h3 class="section-title">📊 7일 전망</h3>
        <div class="forecast-list">
          <div v-for="(day, idx) in current.days" :key="day.date"
            :class="['forecast-row', { today: idx === 0 }]">
            <div class="forecast-date">
              <span class="date-day">{{ formatDateShort(day.date, idx) }}</span>
              <span class="date-full">{{ day.date }}</span>
            </div>
            <div class="forecast-icon">{{ getWeatherIcon(day.weatherCode) }}</div>
            <div class="forecast-desc">{{ getWeatherDesc(day.weatherCode) }}</div>
            <div class="forecast-temp">
              <span class="temp-max">{{ day.tempMax }}°</span>
              <span class="temp-min">{{ day.tempMin }}°</span>
            </div>
            <div class="forecast-extra">
              <span title="강수확률">💧{{ day.precipProb }}%</span>
              <span title="자외선" :style="{ color: getUVGrade(day.uvMax).color }">🔆{{ day.uvMax }}</span>
            </div>
            <div class="forecast-sun">
              <span title="일출">🌅{{ formatTime(day.sunrise) }}</span>
              <span title="일몰">🌇{{ formatTime(day.sunset) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 전 지점 비교표 -->
      <div class="compare-section">
        <h3 class="section-title">🔍 전 지점 비교 (오늘)</h3>
        <div class="compare-list">
          <div v-for="p in forecasts" :key="p.name" class="compare-row"
            @click="selectedPoint = p.name">
            <div class="compare-name">{{ p.name.split(' ')[0] }}</div>
            <div class="compare-emoji">{{ getWeatherIcon(p.days[0]?.weatherCode) }}</div>
            <div class="compare-temp">
              <span class="temp-max">{{ p.days[0]?.tempMax }}°</span>
              <span class="temp-min">{{ p.days[0]?.tempMin }}°</span>
            </div>
            <div class="compare-uv" :style="{ color: getUVGrade(p.days[0]?.uvMax).color }">
              🔆{{ p.days[0]?.uvMax }}
            </div>
            <div class="compare-rain" :class="{ wet: (p.days[0]?.precipProb || 0) >= 50 }">
              💧{{ p.days[0]?.precipProb }}%
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchHighwayForecast, getWeatherIcon, getWeatherDesc, getUVGrade } from '../lib/api.js'

const loading = ref(false)
const error = ref('')
const forecasts = ref([])
const selectedPoint = ref('서울 (경부선)')
const fetchedAt = ref('')

const current = computed(() => forecasts.value.find(p => p.name === selectedPoint.value))

function formatTime(isoStr) {
  if (!isoStr) return '-'
  // Extract HH:MM from ISO string
  const match = isoStr.match(/T(\d{2}:\d{2})/)
  return match ? match[1] : isoStr
}

function formatDateShort(dateStr, idx) {
  if (idx === 0) return '오늘'
  if (idx === 1) return '내일'
  const d = new Date(dateStr)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${days[d.getDay()]}요일`
}

function daylightDuration(day) {
  if (!day.sunrise || !day.sunset) return '-'
  const sr = new Date(day.sunrise)
  const ss = new Date(day.sunset)
  const diff = (ss - sr) / 1000
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  return `${h}시간 ${m}분`
}

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    forecasts.value = await fetchHighwayForecast()
    fetchedAt.value = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch (e) {
    error.value = e.message || '데이터 조회 실패'
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchData())
</script>

<style scoped>
.forecast-page {
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: 40px;
}

.page-nav {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #1B355A;
  color: #fff;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.btn-back {
  background: none; border: none;
  color: #4D9BC6;
  font-size: 14px; font-weight: 600;
  cursor: pointer;
}
.nav-title { font-size: 15px; font-weight: 700; }
.nav-spacer { flex: 1; }

.update-info {
  text-align: center;
  padding: 8px;
  font-size: 12px;
  color: #888;
  background: #FFFBEB;
}

.point-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 12px;
  overflow-x: auto;
  background: #fff;
  border-bottom: 1px solid #eee;
  -webkit-overflow-scrolling: touch;
}
.point-tab {
  background: #f5f5f5; border: none;
  border-radius: 10px; padding: 8px 14px;
  font-size: 13px; font-weight: 600; color: #666;
  cursor: pointer; white-space: nowrap;
  transition: all 0.15s;
}
.point-tab.active { background: #1B355A; color: #fff; }

/* 오늘 카드 */
.today-card {
  margin: 12px;
  background: linear-gradient(135deg, #1B355A 0%, #2A4A72 100%);
  border-radius: 16px;
  padding: 20px 16px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(27,53,90,0.25);
}
.today-header {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 16px;
}
.today-emoji { font-size: 42px; }
.today-info { flex: 1; }
.today-name { font-size: 18px; font-weight: 800; }
.today-desc { font-size: 13px; opacity: 0.7; margin-top: 2px; }
.today-temp { text-align: right; }
.temp-max { font-size: 28px; font-weight: 800; color: #FF8A65; }
.temp-sep { font-size: 16px; opacity: 0.5; margin: 0 2px; }
.temp-min { font-size: 18px; opacity: 0.7; color: #90CAF9; }

.today-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.today-item {
  display: flex; flex-direction: column;
  align-items: center;
  background: rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 10px 4px;
  text-align: center;
}
.item-icon { font-size: 20px; margin-bottom: 2px; }
.item-label { font-size: 10px; opacity: 0.6; }
.item-value { font-size: 13px; font-weight: 700; margin-top: 2px; }

.daylight-bar {
  text-align: center;
  font-size: 12px;
  opacity: 0.7;
  padding: 8px;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
}

/* 7일 전망 */
.forecast-section { padding: 16px 12px; }
.section-title { font-size: 15px; font-weight: 700; color: #1B355A; margin-bottom: 12px; }

.forecast-list { display: flex; flex-direction: column; gap: 6px; }
.forecast-row {
  display: grid;
  grid-template-columns: 70px 36px 1fr auto auto auto;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  font-size: 12px;
}
.forecast-row.today { border-left: 3px solid #4D9BC6; }

.forecast-date { display: flex; flex-direction: column; }
.date-day { font-size: 13px; font-weight: 700; color: #1B355A; }
.date-full { font-size: 10px; color: #aaa; }

.forecast-icon { font-size: 22px; text-align: center; }
.forecast-desc { font-size: 11px; color: #666; }

.forecast-temp { display: flex; gap: 4px; align-items: baseline; }
.forecast-temp .temp-max { font-size: 15px; }
.forecast-temp .temp-min { font-size: 12px; }

.forecast-extra { display: flex; flex-direction: column; gap: 1px; font-size: 10px; text-align: right; }
.forecast-sun { display: flex; flex-direction: column; gap: 1px; font-size: 10px; color: #888; text-align: right; }

/* 전 지점 비교 */
.compare-section { padding: 16px 12px; }
.compare-list { display: flex; flex-direction: column; gap: 4px; }
.compare-row {
  display: grid;
  grid-template-columns: 60px 36px 1fr 50px 50px;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  cursor: pointer;
  transition: transform 0.1s;
}
.compare-row:active { transform: scale(0.98); }

.compare-name { font-size: 13px; font-weight: 700; color: #1B355A; }
.compare-emoji { font-size: 20px; text-align: center; }
.compare-temp { display: flex; gap: 4px; align-items: baseline; }
.compare-temp .temp-max { font-size: 14px; }
.compare-temp .temp-min { font-size: 11px; }
.compare-uv { font-size: 11px; font-weight: 600; text-align: center; }
.compare-rain { font-size: 11px; text-align: center; }
.compare-rain.wet { color: #1E40AF; font-weight: 700; }

/* 로딩 */
.loading { text-align: center; padding: 60px 20px; color: #888; }
.spinner {
  width: 32px; height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #1B355A;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 에러 */
.error-box {
  margin: 20px 16px;
  background: #FEF3C7;
  border: 1px solid #F59E0B;
  border-radius: 12px;
  padding: 16px;
  display: flex; gap: 12px; align-items: flex-start;
}
.error-icon { font-size: 24px; flex-shrink: 0; }
.error-title { font-weight: 700; color: #92400E; font-size: 14px; }
.error-desc { font-size: 12px; color: #92400E; margin-top: 4px; }
</style>
