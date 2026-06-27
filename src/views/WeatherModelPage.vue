<template>
  <div class="model-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <h1 class="nav-title">🔮 멀티모델 예보 비교</h1>
      <span class="nav-spacer"></span>
    </nav>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>3대 글로벌 기상 모델 예보를 비교 중…</p>
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
          <span class="summary-num">{{ overall.avgSpread }}°C</span>
          <span class="summary-label">🌡️ 평균 예보 편차</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ overall.highConfCount }}/{{ points.length }}</span>
          <span class="summary-label">✅ 높은 신뢰도 지점</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ overall.lowConfCount }}</span>
          <span class="summary-label">⚠️ 낮은 신뢰도 지점</span>
        </div>
      </div>

      <!-- 모델 설명 -->
      <div class="model-legend">
        <div class="legend-title">📊 비교 모델</div>
        <div class="legend-items">
          <div v-for="m in modelList" :key="m.id" class="legend-item" :style="{ borderColor: m.color }">
            <span class="legend-emoji">{{ m.emoji }}</span>
            <div>
              <div class="legend-name">{{ m.name }}</div>
              <div class="legend-desc">{{ m.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 지점별 카드 -->
      <div class="point-list">
        <div
          v-for="p in points"
          :key="p.name"
          class="point-card"
          :style="{ borderLeftColor: getConfidence(p.tempSpread).color }"
        >
          <div class="point-header" @click="toggle(p.name)">
            <div class="point-title-group">
              <span class="point-emoji">{{ getConfidence(p.tempSpread).emoji }}</span>
              <div>
                <div class="point-name">{{ p.name }}</div>
                <div class="point-desc">{{ p.desc }} · 신뢰도 {{ getConfidence(p.tempSpread).label }}</div>
              </div>
            </div>
            <div class="point-stats" v-if="p.avgTemp != null">
              <div class="mini-stat">
                <span class="mini-label">평균</span>
                <span class="mini-val">{{ p.avgTemp }}°C</span>
              </div>
              <div class="mini-stat">
                <span class="mini-label">편차</span>
                <span class="mini-val" :style="{ color: getConfidence(p.tempSpread).color }">±{{ p.tempSpread }}°</span>
              </div>
              <div class="mini-stat">
                <span class="mini-label">강수확률</span>
                <span class="mini-val">{{ p.avgProb ?? '-' }}%</span>
              </div>
            </div>
            <span class="toggle-icon" :class="{ open: expanded[p.name] }">▼</span>
          </div>

          <div v-if="expanded[p.name]" class="point-detail">
            <!-- 3일 예보 비교 테이블 -->
            <div v-for="(date, di) in p.dates" :key="date" class="day-comparison">
              <div class="day-label">{{ formatShortDate(date) }}</div>
              <div class="model-rows">
                <div
                  v-for="m in modelList"
                  :key="m.id"
                  class="model-row"
                  :style="{ borderLeftColor: m.color }"
                >
                  <div class="model-row-name">
                    <span>{{ m.emoji }}</span>
                    <span>{{ m.name.split(' ')[0] }}</span>
                  </div>
                  <template v-if="p.models[m.id] && p.models[m.id][di]">
                    <div class="model-row-weather">
                      {{ getWeatherIcon(p.models[m.id][di].weatherCode) }}
                    </div>
                    <div class="model-row-temp">
                      <span class="t-max">{{ p.models[m.id][di].tempMax ?? '-' }}°</span>
                      <span class="t-min">/ {{ p.models[m.id][di].tempMin ?? '-' }}°</span>
                    </div>
                    <div class="model-row-precip">
                      <span v-if="p.models[m.id][di].precipProb != null" :style="{ color: p.models[m.id][di].precipProb >= 50 ? '#3B82F6' : '#888' }">
                        💧{{ p.models[m.id][di].precipProb }}%
                      </span>
                      <span v-else class="na">N/A</span>
                    </div>
                    <div class="model-row-wind">
                      💨{{ p.models[m.id][di].windMax ?? '-' }}
                    </div>
                  </template>
                  <template v-else>
                    <div class="model-row-na">데이터 없음</div>
                  </template>
                </div>
              </div>
            </div>

            <!-- 온도 편차 차트 -->
            <div class="spread-chart" v-if="p.tempSpread > 0">
              <div class="chart-label">📊 오늘 최고기온 예표 비교</div>
              <div class="chart-bars">
                <div v-for="m in modelList" :key="m.id" class="chart-col">
                  <div class="bar-label" :style="{ color: m.color }">{{ m.name.split(' ')[0] }}</div>
                  <div
                    class="bar"
                    :style="{
                      height: barHeight(p, m.id) + 'px',
                      background: m.color
                    }"
                  >
                    <span class="bar-text">{{ getTodayTemp(p, m.id) }}°</span>
                  </div>
                </div>
              </div>
              <div class="chart-axis">최고기온 (°C)</div>
            </div>

            <!-- 신뢰도 분석 -->
            <div class="confidence-box" :style="{ background: getConfidence(p.tempSpread).color + '15', borderColor: getConfidence(p.tempSpread).color }">
              <span class="conf-emoji">{{ getConfidence(p.tempSpread).emoji }}</span>
              <div>
                <div class="conf-label" :style="{ color: getConfidence(p.tempSpread).color }">
                  예보 신뢰도: {{ getConfidence(p.tempSpread).label }}
                </div>
                <div class="conf-desc">{{ getConfidence(p.tempSpread).desc }}</div>
                <div class="conf-detail" v-if="p.tempSpread > 0">
                  모델 간 최대 {{ p.tempSpread }}°C 차이
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 정보 -->
      <div class="info-section">
        <div class="info-title">ℹ️ 멀티모델 예보란?</div>
        <p class="info-text">
          전 세계 3대 기상 모델(GFS·ICON·ECMWF)의 예보를 동시에 비교합니다.
          모델들이 비슷한 예보를 내놓으면 신뢰도가 높고, 큰 차이가 나면 불확실성이 큽니다.
          여행이나 장거리 운행 전 예보 신뢰도를 확인하세요.
        </p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchWeatherModels, WEATHER_MODELS, getForecastConfidence, getWeatherIcon, getWeatherDesc } from '../lib/api.js'

const loading = ref(true)
const error = ref(null)
const points = ref([])
const fetchedAt = ref('')
const expanded = ref({})

const modelList = WEATHER_MODELS

onMounted(async () => {
  try {
    const data = await fetchWeatherModels()
    points.value = data
    fetchedAt.value = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    // 첫 번째 지점은 기본 펼침
    if (data.length > 0) expanded.value[data[0].name] = true
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

function toggle(name) {
  expanded.value[name] = !expanded.value[name]
}

function getConfidence(spread) {
  return getForecastConfidence(spread)
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}`
}

function getTodayTemp(point, modelId) {
  return point.models[modelId]?.[0]?.tempMax ?? '-'
}

function barHeight(point, modelId) {
  const temp = getTodayTemp(point, modelId)
  if (temp == null || temp === '-') return 0
  // 15~40°C 범위를 20~100px로 매핑
  const min = 15, max = 40
  const clamped = Math.max(min, Math.min(max, temp))
  return Math.round(20 + ((clamped - min) / (max - min)) * 80)
}

const overall = computed(() => {
  const valid = points.value.filter(p => p.tempSpread != null)
  const avgSpread = valid.length > 0
    ? Math.round(valid.reduce((a, b) => a + b.tempSpread, 0) / valid.length * 10) / 10
    : 0
  const highConfCount = valid.filter(p => p.tempSpread <= 3).length
  const lowConfCount = valid.filter(p => p.tempSpread > 3).length
  return { avgSpread, highConfCount, lowConfCount }
})
</script>

<style scoped>
.model-page {
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: 40px;
}

.page-nav {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #1B355A;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}
.btn-back { background: none; border: none; color: #fff; font-size: 14px; cursor: pointer; }
.nav-title { margin: 0; font-size: 16px; font-weight: 700; margin-left: 8px; }
.nav-spacer { flex: 1; }

.loading { text-align: center; padding: 60px 20px; color: #666; }
.spinner {
  width: 36px; height: 36px; border: 3px solid #e0e0e0;
  border-top-color: #4D9BC6; border-radius: 50%;
  animation: spin 0.8s linear infinite; margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-box {
  margin: 20px; padding: 16px; background: #FEF2F2; border-radius: 12px;
  display: flex; gap: 12px; align-items: flex-start;
}
.error-icon { font-size: 24px; }
.error-title { font-weight: 700; color: #EF4444; }
.error-desc { font-size: 13px; color: #888; margin-top: 4px; }

.fetched-bar {
  text-align: center; padding: 8px; font-size: 12px; color: #888;
  background: #fff; border-bottom: 1px solid #eee;
}

.summary-bar {
  display: flex; background: #fff; padding: 14px 16px; gap: 8px;
  border-bottom: 1px solid #eee;
}
.summary-item { flex: 1; text-align: center; }
.summary-num { display: block; font-size: 22px; font-weight: 800; color: #1B355A; }
.summary-label { font-size: 11px; color: #888; }

.model-legend {
  margin: 12px 16px; padding: 14px; background: #fff; border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.legend-title { font-size: 13px; font-weight: 700; color: #1B355A; margin-bottom: 10px; }
.legend-items { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.legend-item {
  display: flex; gap: 8px; align-items: center;
  padding: 8px 10px; border-radius: 8px;
  background: #f8f9fa; border-left: 3px solid;
}
.legend-emoji { font-size: 18px; }
.legend-name { font-size: 12px; font-weight: 700; color: #333; }
.legend-desc { font-size: 10px; color: #888; }

.point-list { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }

.point-card {
  background: #fff; border-radius: 12px; overflow: hidden;
  border-left: 4px solid #ccc;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.point-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; cursor: pointer;
}
.point-title-group { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.point-emoji { font-size: 22px; flex-shrink: 0; }
.point-name { font-size: 14px; font-weight: 700; color: #1B355A; }
.point-desc { font-size: 11px; color: #888; }

.point-stats { display: flex; gap: 12px; }
.mini-stat { text-align: center; }
.mini-label { display: block; font-size: 10px; color: #aaa; }
.mini-val { font-size: 14px; font-weight: 700; color: #333; }

.toggle-icon { font-size: 12px; color: #aaa; transition: transform 0.2s; }
.toggle-icon.open { transform: rotate(180deg); }

.point-detail { padding: 0 16px 16px; border-top: 1px solid #f0f0f0; }

.day-comparison { margin-top: 12px; }
.day-label { font-size: 12px; font-weight: 700; color: #4D9BC6; margin-bottom: 6px; }
.model-rows { display: flex; flex-direction: column; gap: 4px; }
.model-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; background: #f8f9fa; border-radius: 8px;
  border-left: 3px solid;
}
.model-row-name { width: 70px; font-size: 11px; font-weight: 600; color: #555; display: flex; gap: 4px; align-items: center; }
.model-row-weather { font-size: 16px; width: 24px; text-align: center; }
.model-row-temp { width: 80px; }
.t-max { font-weight: 700; color: #EF4444; font-size: 13px; }
.t-min { font-size: 11px; color: #3B82F6; }
.model-row-precip { width: 60px; font-size: 11px; font-weight: 600; }
.model-row-wind { font-size: 11px; color: #888; margin-left: auto; }
.model-row-na { font-size: 11px; color: #ccc; margin-left: auto; }
.na { color: #ccc; }

.spread-chart { margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 10px; }
.chart-label { font-size: 12px; font-weight: 700; color: #555; margin-bottom: 10px; }
.chart-bars { display: flex; gap: 12px; align-items: flex-end; height: 120px; }
.chart-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.bar-label { font-size: 10px; font-weight: 700; }
.bar {
  width: 100%; max-width: 40px; border-radius: 6px 6px 0 0;
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 4px; min-height: 20px;
}
.bar-text { font-size: 11px; font-weight: 700; color: #fff; }
.chart-axis { font-size: 10px; color: #aaa; text-align: center; margin-top: 4px; }

.confidence-box {
  margin-top: 14px; padding: 12px; border-radius: 10px;
  display: flex; gap: 10px; align-items: flex-start;
  border: 1px solid;
}
.conf-emoji { font-size: 24px; }
.conf-label { font-size: 13px; font-weight: 700; }
.conf-desc { font-size: 11px; color: #666; margin-top: 2px; }
.conf-detail { font-size: 11px; color: #888; margin-top: 4px; }

.info-section { margin: 16px; padding: 14px; background: #fff; border-radius: 12px; }
.info-title { font-size: 13px; font-weight: 700; color: #1B355A; margin-bottom: 6px; }
.info-text { font-size: 12px; color: #666; line-height: 1.6; }
</style>
