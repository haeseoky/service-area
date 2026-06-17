<template>
  <div class="minutely-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <span class="nav-title">⏱️ 단기 강수·시정 예보</span>
      <span class="nav-spacer"></span>
    </nav>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>전국 고속도로 15분 단위 강수·시정 예보 분석 중…</p>
    </div>

    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <div class="error-title">정보를 불러올 수 없습니다</div>
        <div class="error-desc">{{ error }}</div>
      </div>
    </div>

    <template v-if="!loading && !error">
      <!-- 호출 시각 -->
      <div class="fetched-bar">
        <span class="fetched-icon">🕐</span>
        <span class="fetched-text">조회 시각: {{ fetchedAt }}</span>
      </div>

      <!-- 요약 바 -->
      <div class="summary-bar">
        <div class="summary-item rain">
          <span class="summary-num">{{ rainCount }}</span>
          <span class="summary-label">🌧️ 비 예상</span>
        </div>
        <div class="summary-item fog">
          <span class="summary-num">{{ fogCount }}</span>
          <span class="summary-label">🌫️ 시정 주의</span>
        </div>
        <div class="summary-item clear">
          <span class="summary-num">{{ clearCount }}</span>
          <span class="summary-label">☀️ 맑음</span>
        </div>
      </div>

      <div class="legend-bar">
        <span class="legend-title">📊 전국 주요 고속도로 — 앞으로 4시간 (15분 단위)</span>
      </div>

      <!-- 카드 리스트 -->
      <div class="forecast-list">
        <div
          v-for="p in forecastData"
          :key="p.name"
          class="forecast-card"
          :class="{ 'rain-card': p.willRain, 'fog-card': !p.willRain && p.minVisibility < 5000 }"
        >
          <!-- 메인 행 -->
          <div class="f-main">
            <div class="f-emoji">{{ p.willRain ? '🌧️' : (p.minVisibility < 5000 ? '🌫️' : '☀️') }}</div>
            <div class="f-info">
              <div class="f-name">{{ p.name }}</div>
              <div class="f-route">{{ p.desc }}</div>
            </div>
            <div class="f-trend" v-if="p.slots.length">
              <span :style="{ color: p.trend.color }">{{ p.trend.icon }} {{ p.trend.text }}</span>
            </div>
          </div>

          <!-- 비 시작 시간 -->
          <div v-if="p.rainStartTime" class="rain-alert">
            <span class="rain-alert-icon">☔</span>
            <span>예상 강수 시작: <strong>{{ formatTime(p.rainStartTime) }}</strong></span>
            <span class="max-precip">최대 {{ p.maxPrecip }}mm/15분</span>
          </div>

          <!-- 15분 슬롯 그리드 -->
          <div class="slot-grid" v-if="p.slots.length">
            <div
              v-for="slot in p.slots"
              :key="slot.time"
              class="slot"
              :style="{ background: getPrecipColor(slot.precip) }"
            >
              <div class="slot-time">{{ formatSlotTime(slot.time) }}</div>
              <div class="slot-icon">{{ getPrecipGrade(slot.precip).emoji }}</div>
              <div class="slot-precip">{{ slot.precip >= 0.1 ? slot.precip + 'mm' : '—' }}</div>
              <div class="slot-vis" :style="{ color: getVisColor(slot.visibility) }">
                {{ formatVis(slot.visibility) }}
              </div>
            </div>
          </div>

          <!-- 가시거리 요약 -->
          <div class="vis-summary" v-if="p.slots.length">
            <div class="vis-item">
              <span class="vis-label">👀 최저 가시거리</span>
              <span class="vis-value" :style="{ color: p.minVisGrade.color }">
                {{ formatVis(p.minVisibility) }} · {{ p.minVisGrade.label }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 안내 -->
      <div class="info-section">
        <div class="info-title">ℹ️ 이 페이지는</div>
        <p>Open-Meteo의 <strong>minutely_15</strong> API를 사용하여 15분 단위 강수량·가시거리를 예측합니다. 앞으로 4시간(16슬롯)의 상세 날씨 변화를 시간별로 확인할 수 있습니다.</p>
        <p>색상: <span style="color:#22C55E">■</span> 맑음 <span style="color:#06B6D4">■</span> 약한 비 <span style="color:#3B82F6">■</span> 비 <span style="color:#EF4444">■</span> 강한 비</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { fetchMinutelyForecast, getMinutelyPrecipGrade, getPrecipTrend, getMinutelyVisibilityGrade } from '../lib/api.js'

const loading = ref(true)
const error = ref(null)
const forecastData = ref([])
const fetchedAt = ref('')

onMounted(async () => {
  try {
    const raw = await fetchMinutelyForecast()
    forecastData.value = raw.map(p => ({
      ...p,
      trend: getPrecipTrend(p.slots),
      minVisGrade: getMinutelyVisibilityGrade(p.minVisibility),
    }))
    fetchedAt.value = new Date().toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const rainCount = computed(() => forecastData.value.filter(p => p.willRain).length)
const fogCount = computed(() => forecastData.value.filter(p => !p.willRain && p.minVisibility < 5000 && p.minVisibility > 0).length)
const clearCount = computed(() => forecastData.value.filter(p => !p.willRain && p.minVisibility >= 5000).length)

function formatTime(timeStr) {
  if (!timeStr) return '-'
  const d = new Date(timeStr)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function formatSlotTime(timeStr) {
  if (!timeStr) return '-'
  const d = new Date(timeStr)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function formatVis(vis) {
  if (!vis || vis === 0) return '-'
  if (vis >= 1000) return (vis / 1000).toFixed(1) + 'km'
  return vis + 'm'
}

function getPrecipColor(precip) {
  if (precip >= 5) return '#991B1B'
  if (precip >= 2) return '#EF4444'
  if (precip >= 0.5) return '#3B82F6'
  if (precip >= 0.1) return '#06B6D4'
  return '#22C55E'
}

function getPrecipGrade(precip) {
  return getMinutelyPrecipGrade(precip)
}

function getVisColor(vis) {
  return getMinutelyVisibilityGrade(vis).color
}
</script>

<style scoped>
.minutely-page {
  min-height: 100dvh;
  background: #f0f4f8;
  padding-bottom: 40px;
}

.page-nav {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 16px; background: #1B355A; color: #fff;
  position: sticky; top: 0; z-index: 10;
}
.btn-back { background: none; border: none; color: #fff; font-size: 14px; cursor: pointer; padding: 4px 8px; }
.nav-title { font-size: 16px; font-weight: 700; flex: 1; text-align: center; }
.nav-spacer { width: 60px; }

.loading { text-align: center; padding: 60px 20px; color: #666; }
.spinner {
  width: 40px; height: 40px; margin: 0 auto 16px;
  border: 3px solid #e0e0e0; border-top-color: #4D9BC6;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-box {
  display: flex; align-items: center; gap: 12px;
  margin: 20px; padding: 16px; background: #FEF2F2;
  border-radius: 12px; border-left: 4px solid #EF4444;
}
.error-icon { font-size: 32px; }
.error-title { font-weight: 700; color: #991B1B; }
.error-desc { font-size: 13px; color: #666; margin-top: 2px; }

.fetched-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px; background: #E8F0F8;
  font-size: 13px; color: #1B355A;
}

.summary-bar {
  display: flex; gap: 8px; padding: 12px 16px;
  max-width: 480px; margin: 0 auto;
}
.summary-item {
  flex: 1; text-align: center; padding: 10px 6px;
  border-radius: 10px; background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.summary-num { display: block; font-size: 22px; font-weight: 800; }
.summary-label { font-size: 11px; color: #666; margin-top: 2px; display: block; }
.summary-item.rain .summary-num { color: #3B82F6; }
.summary-item.fog .summary-num { color: #F97316; }
.summary-item.clear .summary-num { color: #22C55E; }

.legend-bar {
  padding: 0 16px 8px; max-width: 480px; margin: 0 auto;
}
.legend-title { font-size: 12px; color: #888; }

.forecast-list {
  display: flex; flex-direction: column; gap: 10px;
  padding: 8px 16px; max-width: 480px; margin: 0 auto;
}

.forecast-card {
  background: #fff; border-radius: 12px; padding: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.forecast-card.rain-card { border-left: 3px solid #3B82F6; }
.forecast-card.fog-card { border-left: 3px solid #F97316; }

.f-main { display: flex; align-items: center; gap: 10px; }
.f-emoji { font-size: 28px; }
.f-info { flex: 1; min-width: 0; }
.f-name { font-size: 15px; font-weight: 700; color: #1B355A; }
.f-route { font-size: 12px; color: #888; margin-top: 1px; }
.f-trend { font-size: 11px; font-weight: 600; }

.rain-alert {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  margin-top: 8px; padding: 6px 10px;
  background: #EFF6FF; border-radius: 8px;
  font-size: 12px; color: #1E40AF;
}
.rain-alert-icon { font-size: 14px; }
.max-precip { margin-left: auto; font-weight: 700; color: #3B82F6; }

.slot-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 3px; margin-top: 10px;
}
.slot {
  text-align: center; padding: 4px 2px;
  border-radius: 4px; min-width: 0;
}
.slot-time { font-size: 8px; color: #fff; opacity: 0.9; }
.slot-icon { font-size: 12px; }
.slot-precip { font-size: 8px; color: #fff; font-weight: 700; }
.slot-vis { font-size: 8px; margin-top: 1px; font-weight: 600; }

.vis-summary {
  margin-top: 8px; padding-top: 6px; border-top: 1px solid #f0f0f0;
}
.vis-item { display: flex; justify-content: space-between; align-items: center; }
.vis-label { font-size: 12px; color: #666; }
.vis-value { font-size: 12px; font-weight: 700; }

.info-section {
  margin: 20px 16px 0; padding: 14px; background: #fff;
  border-radius: 10px; max-width: 448px; margin-left: auto; margin-right: auto;
}
.info-title { font-size: 13px; font-weight: 700; color: #1B355A; margin-bottom: 6px; }
.info-section p { font-size: 12px; color: #666; margin: 4px 0; line-height: 1.5; }
</style>
