<template>
  <div class="hist-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <span class="nav-title">📉 기상 이력 분석</span>
      <span class="nav-spacer"></span>
    </nav>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>과거 7일 기상 이력을 조회 중…</p>
    </div>

    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <div class="error-title">정보를 불러올 수 없습니다</div>
        <div class="error-desc">{{ error }}</div>
      </div>
    </div>

    <template v-if="!loading && !error">
      <div class="fetched-bar">
        🕐 조회시각: {{ fetchedAt }}
      </div>

      <!-- 전국 요약 -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-num">{{ overallStats.avgTemp }}°C</span>
          <span class="summary-label">🌡️ 주간 평균 최고기온</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ overallStats.totalPrecip }}mm</span>
          <span class="summary-label">💧 전국 총 강수량</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ overallStats.hotSpots }}곳</span>
          <span class="summary-label">🔥 폭염 지점</span>
        </div>
      </div>

      <!-- 날짜 범위 -->
      <div class="date-range">
        📅 {{ dateRange }}
      </div>

      <!-- 지점별 상세 -->
      <div class="point-list">
        <div
          v-for="p in points"
          :key="p.name"
          class="point-card"
          :style="{ borderLeftColor: getPattern(p.stats).color }"
        >
          <div class="point-header" @click="toggle(p.name)">
            <div class="point-title-group">
              <span class="point-emoji">{{ getPattern(p.stats).emoji }}</span>
              <div>
                <div class="point-name">{{ p.name }}</div>
                <div class="point-desc">{{ p.desc }} · {{ getPattern(p.stats).desc }}</div>
              </div>
            </div>
            <div class="point-stats" v-if="p.stats">
              <div class="mini-stat">
                <span class="mini-label">최고</span>
                <span class="mini-val hot">{{ p.stats.avgMax }}°C</span>
              </div>
              <div class="mini-stat">
                <span class="mini-label">최저</span>
                <span class="mini-val cold">{{ p.stats.avgMin }}°C</span>
              </div>
              <div class="mini-stat">
                <span class="mini-label">강수</span>
                <span class="mini-val">{{ p.stats.totalPrecip }}mm</span>
              </div>
              <div class="mini-stat">
                <span class="mini-label">최대풍</span>
                <span class="mini-val">{{ p.stats.maxWind }}km/h</span>
              </div>
            </div>
            <span class="toggle-icon" :class="{ open: expanded[p.name] }">▼</span>
          </div>

          <div v-if="expanded[p.name]" class="point-detail">
            <!-- 일자별 표 -->
            <div class="daily-table">
              <div class="daily-header">
                <span>날짜</span>
                <span>날씨</span>
                <span>최고</span>
                <span>최저</span>
                <span>강수</span>
                <span>적설</span>
                <span>일조</span>
                <span>돌풍</span>
              </div>
              <div
                v-for="day in p.days"
                :key="day.date"
                class="daily-row"
              >
                <span class="d-date">{{ formatShortDate(day.date) }}</span>
                <span class="d-weather">{{ getWeatherIcon(day.weatherCode) }} {{ getWeatherDesc(day.weatherCode) }}</span>
                <span class="d-temp hot">{{ day.tempMax ?? '-' }}°</span>
                <span class="d-temp cold">{{ day.tempMin ?? '-' }}°</span>
                <span :class="['d-precip', { 'has-rain': day.precip >= 1 }]">{{ day.precip ?? '-' }}mm</span>
                <span class="d-snow">{{ day.snow && day.snow > 0 ? day.snow + 'cm' : '-' }}</span>
                <span class="d-sun">{{ day.sunshine != null ? day.sunshine + '분' : '-' }}</span>
                <span class="d-gust">{{ day.gustMax ?? '-' }}km/h</span>
              </div>
            </div>

            <!-- 온도 추이 미니 차트 -->
            <div class="temp-chart">
              <div class="chart-label">📈 기온 추이 (최고/최저)</div>
              <div class="chart-bars">
                <div v-for="day in p.days" :key="day.date" class="chart-col">
                  <div class="bar-group">
                    <div
                      class="bar bar-max"
                      :style="{ height: barHeight(day.tempMax, p.stats) + 'px', background: tempColor(day.tempMax) }"
                    >
                      <span class="bar-text">{{ day.tempMax ?? '' }}°</span>
                    </div>
                    <div
                      class="bar bar-min"
                      :style="{ height: barHeight(day.tempMin, p.stats, true) + 'px', background: '#3B82F6' }"
                    >
                      <span class="bar-text">{{ day.tempMin ?? '' }}°</span>
                    </div>
                  </div>
                  <span class="chart-date">{{ formatDay(day.date) }}</span>
                </div>
              </div>
            </div>

            <!-- 강수량 차트 -->
            <div class="precip-chart">
              <div class="chart-label">🌧️ 일일 강수량</div>
              <div class="chart-bars">
                <div v-for="day in p.days" :key="day.date" class="chart-col">
                  <div
                    class="bar bar-precip"
                    :style="{ height: precipHeight(day.precip) + 'px', background: precipColor(day.precip) }"
                  >
                    <span class="bar-text" v-if="day.precip > 0">{{ day.precip }}</span>
                  </div>
                  <span class="chart-date">{{ formatDay(day.date) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { fetchHighwayWeatherHistory, getWeatherPattern, getWeatherIcon, getWeatherDesc } from '../lib/api'

const loading = ref(true)
const error = ref(null)
const points = ref([])
const fetchedAt = ref('')
const expanded = reactive({})

onMounted(async () => {
  try {
    fetchedAt.value = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    const data = await fetchHighwayWeatherHistory(7)
    points.value = data
    // 첫 번째 지점 펼쳐서 표시
    if (data.length > 0) expanded[data[0].name] = true
  } catch (e) {
    error.value = e.message || '데이터를 불러올 수 없습니다'
  } finally {
    loading.value = false
  }
})

function toggle(name) {
  expanded[name] = !expanded[name]
}

function getPattern(stats) {
  return getWeatherPattern(stats)
}

const overallStats = computed(() => {
  const valid = points.value.filter(p => p.stats)
  if (valid.length === 0) return { avgTemp: '-', totalPrecip: '-', hotSpots: 0 }
  const avgMaxes = valid.map(p => p.stats.avgMax).filter(x => x != null)
  const totalP = valid.reduce((sum, p) => sum + (p.stats.totalPrecip || 0), 0)
  const avgTemp = avgMaxes.length > 0 ? Math.round(avgMaxes.reduce((a, b) => a + b, 0) / avgMaxes.length * 10) / 10 : '-'
  const hotSpots = valid.filter(p => p.stats.avgMax >= 30).length
  return {
    avgTemp,
    totalPrecip: Math.round(totalP * 10) / 10,
    hotSpots,
  }
})

const dateRange = computed(() => {
  if (points.value.length === 0 || !points.value[0].days?.length) return '-'
  const days = points.value[0].days
  return `${formatShortDate(days[0].date)} ~ ${formatShortDate(days[days.length - 1].date)}`
})

function formatShortDate(dateStr) {
  if (!dateStr) return '-'
  const [, m, d] = dateStr.split('-')
  return `${m}/${d}`
}

function formatDay(dateStr) {
  if (!dateStr) return ''
  const dt = new Date(dateStr)
  const day = ['일', '월', '화', '수', '목', '금', '토'][dt.getDay()]
  return formatShortDate(dateStr) + '(' + day + ')'
}

function barHeight(temp, stats, isMin = false) {
  if (temp == null) return 0
  const allTemps = []
  if (stats) {
    // 범위: avgMin - 5 ~ avgMax + 5
    const base = isMin ? (stats.avgMin - 5) : 0
    const range = Math.max(10, (stats.avgMax ?? 30) - (stats.avgMin ?? 10) + 10)
    return Math.max(4, Math.min(80, ((temp - base) / range) * 80))
  }
  return Math.max(4, Math.min(80, Math.abs(temp) * 1.5))
}

function tempColor(temp) {
  if (temp == null) return '#ccc'
  if (temp >= 30) return '#EF4444'
  if (temp >= 25) return '#F97316'
  if (temp >= 15) return '#EAB308'
  if (temp >= 5) return '#22C55E'
  return '#3B82F6'
}

function precipHeight(precip) {
  if (precip == null || precip === 0) return 2
  return Math.max(4, Math.min(60, precip * 6))
}

function precipColor(precip) {
  if (precip == null || precip === 0) return '#E5E7EB'
  if (precip >= 20) return '#1E40AF'
  if (precip >= 10) return '#3B82F6'
  if (precip >= 3) return '#60A5FA'
  return '#93C5FD'
}
</script>

<style scoped>
.hist-page {
  min-height: 100dvh;
  background: #f0f4f8;
}

.page-nav {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px;
  background: #1B355A; color: #fff;
  position: sticky; top: 0; z-index: 10;
}
.btn-back { background: none; border: none; color: #a8c4e0; font-size: 14px; cursor: pointer; white-space: nowrap; }
.nav-title { font-size: 16px; font-weight: 700; }
.nav-spacer { flex: 1; }

.loading, .error-box {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 20px; color: #666;
}
.spinner {
  width: 36px; height: 36px;
  border: 3px solid #e0e0e0; border-top-color: #4D9BC6;
  border-radius: 50%; animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-box { flex-direction: row; gap: 12px; }
.error-icon { font-size: 32px; }
.error-title { font-weight: 700; color: #EF4444; }
.error-desc { font-size: 13px; color: #999; }

.fetched-bar {
  text-align: center; font-size: 12px; color: #888;
  padding: 8px; background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.summary-bar {
  display: flex; gap: 8px; padding: 12px;
  max-width: 480px; margin: 0 auto;
}
.summary-item {
  flex: 1; background: #fff; border-radius: 12px;
  padding: 14px 8px; text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.summary-num { display: block; font-size: 20px; font-weight: 800; color: #1B355A; }
.summary-label { display: block; font-size: 11px; color: #888; margin-top: 4px; }

.date-range {
  text-align: center; font-size: 13px; color: #4D9BC6;
  font-weight: 600; padding: 0 16px 12px;
}

.point-list {
  max-width: 480px; margin: 0 auto; padding: 0 12px 40px;
  display: flex; flex-direction: column; gap: 8px;
}

.point-card {
  background: #fff; border-radius: 12px;
  border-left: 4px solid #ccc;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  overflow: hidden;
}

.point-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 14px; cursor: pointer;
}
.point-title-group { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.point-emoji { font-size: 24px; flex-shrink: 0; }
.point-name { font-size: 14px; font-weight: 700; color: #1B355A; }
.point-desc { font-size: 11px; color: #999; margin-top: 2px; }

.point-stats {
  display: flex; gap: 8px; flex-shrink: 0;
}
.mini-stat { text-align: center; }
.mini-label { display: block; font-size: 9px; color: #aaa; }
.mini-val { display: block; font-size: 12px; font-weight: 700; color: #333; }
.mini-val.hot { color: #EF4444; }
.mini-val.cold { color: #3B82F6; }

.toggle-icon {
  font-size: 10px; color: #aaa;
  transition: transform 0.2s;
}
.toggle-icon.open { transform: rotate(180deg); }

.point-detail { padding: 0 12px 14px; border-top: 1px solid #f0f0f0; }

/* 일자별 표 */
.daily-table {
  overflow-x: auto; margin-top: 10px;
  -webkit-overflow-scrolling: touch;
}
.daily-header, .daily-row {
  display: grid;
  grid-template-columns: 52px 70px 42px 42px 48px 42px 42px 52px;
  gap: 4px; align-items: center;
  font-size: 11px; padding: 6px 0;
}
.daily-header {
  font-weight: 700; color: #888;
  border-bottom: 1px solid #eee;
}
.daily-row { border-bottom: 1px solid #f8f8f8; }
.d-date { color: #555; font-weight: 600; }
.d-weather { font-size: 10px; }
.d-temp { font-weight: 700; }
.d-temp.hot { color: #EF4444; }
.d-temp.cold { color: #3B82F6; }
.d-precip { color: #555; }
.d-precip.has-rain { color: #3B82F6; font-weight: 700; }
.d-snow { color: #06B6D4; }
.d-sun { color: #EAB308; }
.d-gust { color: #888; }

/* 차트 */
.temp-chart, .precip-chart {
  margin-top: 14px;
}
.chart-label {
  font-size: 12px; font-weight: 700; color: #555;
  margin-bottom: 8px;
}
.chart-bars {
  display: flex; gap: 4px; align-items: flex-end;
  min-height: 100px;
  padding: 8px 4px; background: #f9fafb; border-radius: 8px;
}
.chart-col {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  gap: 2px;
}
.bar-group {
  display: flex; gap: 2px; align-items: flex-end;
  height: 80px;
}
.bar {
  min-width: 12px; border-radius: 3px 3px 0 0;
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 2px;
}
.bar-precip {
  min-width: 16px; border-radius: 3px 3px 0 0;
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 2px;
  min-height: 2px; height: 2px;
}
.bar-text {
  font-size: 8px; color: #fff; font-weight: 700;
  writing-mode: horizontal-tb;
  white-space: nowrap;
}
.chart-date {
  font-size: 8px; color: #aaa; white-space: nowrap;
}
</style>
