<template>
  <div class="rs-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <h1 class="nav-title">🌡️ 노면 상태 예측</h1>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>전국 고속도로 노면 상태를 분석 중…</p>
    </div>

    <!-- 에러 -->
    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <div class="error-title">정보를 불러올 수 없습니다</div>
        <div class="error-desc">{{ error }}</div>
      </div>
    </div>

    <template v-if="!loading && !error">
      <!-- 요약 바 -->
      <div class="summary-bar">
        <div class="summary-item safe">
          <span class="summary-num">{{ safeCount }}</span>
          <span class="summary-label">✅ 양호</span>
        </div>
        <div class="summary-item caution">
          <span class="summary-num">{{ cautionCount }}</span>
          <span class="summary-label">⚠️ 주의</span>
        </div>
        <div class="summary-item warning">
          <span class="summary-num">{{ dangerCount }}</span>
          <span class="summary-label">🚨 위험</span>
        </div>
      </div>

      <!-- 범례 -->
      <div class="legend-bar">
        <span class="legend-title">🌡️ 전국 주요 고속도로 지점 노면 온도·수분·결빙 위험 분석</span>
      </div>

      <!-- 노면 카드 리스트 -->
      <div class="rs-list">
        <div
          v-for="p in surfaceData"
          :key="p.name"
          class="rs-card"
          :style="{ borderLeftColor: p.risk.color }"
        >
          <!-- 메인 행 -->
          <div class="rs-main">
            <div class="rs-emoji">{{ p.risk.emoji }}</div>
            <div class="rs-info">
              <div class="rs-name">{{ p.name }}</div>
              <div class="rs-route">{{ p.desc }}</div>
            </div>
            <div class="rs-score" :style="{ color: p.risk.color }">
              <span class="rs-score-num">{{ p.risk.score }}</span>
              <span class="rs-score-unit">점</span>
            </div>
          </div>

          <!-- 등급 배지 -->
          <div class="rs-badge-row">
            <span class="rs-badge" :style="{ background: p.risk.color + '22', color: p.risk.color }">
              {{ p.risk.label }}
            </span>
          </div>

          <!-- 상세 지표 -->
          <div class="rs-metrics">
            <div class="metric">
              <span class="m-icon">🌡️</span>
              <span class="m-label">노면 온도</span>
              <span class="m-value" :style="{ color: p.surfaceGrade.color }">
                {{ p.surfaceTemp != null ? p.surfaceTemp + '°' : '-' }}
              </span>
            </div>
            <div class="metric">
              <span class="m-icon">🌐</span>
              <span class="m-label">지중(6cm)</span>
              <span class="m-value">{{ p.deepTemp != null ? p.deepTemp + '°' : '-' }}</span>
            </div>
            <div class="metric">
              <span class="m-icon">💧</span>
              <span class="m-label">수분</span>
              <span class="m-value" :style="{ color: p.moistureGrade.color }">
                {{ p.moisture != null ? Math.round(p.moisture * 100) + '%' : '-' }}
              </span>
            </div>
            <div class="metric">
              <span class="m-icon">🌬️</span>
              <span class="m-label">기온</span>
              <span class="m-value">{{ p.airTemp != null ? p.airTemp + '°' : '-' }}</span>
            </div>
            <div class="metric">
              <span class="m-icon">🌧️</span>
              <span class="m-label">강수</span>
              <span class="m-value">{{ p.precip.toFixed(1) }}mm</span>
            </div>
            <div class="metric">
              <span class="m-icon">💨</span>
              <span class="m-label">풍속</span>
              <span class="m-value">{{ p.windSpeed }}km/h</span>
            </div>
          </div>

          <!-- 24시간 노면 온도 트렌드 -->
          <div v-if="p.next24 && p.next24.length > 0" class="trend-section">
            <div class="trend-title">📊 24시간 노면 온도 변화</div>
            <div class="trend-chart">
              <div class="bars">
                <div
                  v-for="(h, i) in p.next24.slice(0, 24)"
                  :key="i"
                  class="bar-wrap"
                  :title="`${h.time.split('T')[1]} — 노면 ${h.surfaceTemp != null ? h.surfaceTemp + '°C' : 'N/A'}`"
                >
                  <div
                    class="bar"
                    :style="getBarStyle(h.surfaceTemp, i, p.next24)"
                  ></div>
                </div>
              </div>
              <div class="trend-axis">
                <span>지금</span>
                <span>+6h</span>
                <span>+12h</span>
                <span>+18h</span>
                <span>+24h</span>
              </div>
            </div>
          </div>

          <!-- 위험 요소 -->
          <div v-if="p.risk.risks.length > 0" class="risk-list">
            <div v-for="(r, i) in p.risk.risks" :key="i" class="risk-item">
              {{ r.icon }} {{ r.msg }}
            </div>
          </div>
          <div v-else class="risk-list">
            <div class="risk-item safe-note">✅ 노면 상태 양호</div>
          </div>
        </div>
      </div>

      <!-- 설명 -->
      <div class="info-section">
        <div class="info-title">📌 노면 상태 예측이란?</div>
        <div class="info-desc">
          Open-Meteo 토양 온도·수분 모델을 활용하여 고속도로 노면(아스팔트 표면)의
          결빙, 과열, 수막 형성 위험을 예측합니다. 겨울철 블랙아이스, 여름철 과열 노면,
          강수로 인한 수막 현상 등 주요 노면 위험 요소를 종합 평가합니다.
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="dot" style="background:#22C55E"></span> 85-100점: 양호</div>
          <div class="info-item"><span class="dot" style="background:#EAB308"></span> 65-84점: 주의</div>
          <div class="info-item"><span class="dot" style="background:#F97316"></span> 40-64점: 위험</div>
          <div class="info-item"><span class="dot" style="background:#EF4444"></span> 0-39점: 매우 위험</div>
        </div>
      </div>
    </template>

    <div class="data-source">
      데이터 출처: Open-Meteo (Soil Temperature &amp; Moisture API — 표층/지중 온도·수분)<br>
      호출시각: {{ fetchedAt }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  fetchRoadSurface,
  getRoadSurfaceRisk,
  getSurfaceTempGrade,
  getMoistureGrade,
} from '../lib/api.js'

const loading = ref(false)
const error = ref('')
const rawData = ref([])
const fetchedAt = ref('')

const surfaceData = computed(() =>
  rawData.value.map((p) => {
    const risk = getRoadSurfaceRisk(p)
    return {
      ...p,
      risk,
      surfaceGrade: getSurfaceTempGrade(p.surfaceTemp),
      moistureGrade: getMoistureGrade(p.moisture),
    }
  })
)

const safeCount = computed(() => surfaceData.value.filter((p) => p.risk.score >= 85).length)
const cautionCount = computed(() =>
  surfaceData.value.filter((p) => p.risk.score >= 40 && p.risk.score < 85).length
)
const dangerCount = computed(() => surfaceData.value.filter((p) => p.risk.score < 40).length)

// 바 차트 스타일 — 온도에 따라 색상/높이
function getBarStyle(temp, idx, data) {
  if (temp == null) return { height: '2px', background: '#ddd' }
  const allTemps = data.filter(d => d.surfaceTemp != null).map(d => d.surfaceTemp)
  const minT = Math.min(...allTemps, -10)
  const maxT = Math.max(...allTemps, 40)
  const range = maxT - minT || 1
  const heightPct = Math.max(5, ((temp - minT) / range) * 100)

  let color
  if (temp <= 0) color = '#3B82F6'
  else if (temp <= 5) color = '#06B6D4'
  else if (temp <= 20) color = '#22C55E'
  else if (temp <= 35) color = '#EAB308'
  else if (temp <= 45) color = '#F97316'
  else color = '#EF4444'

  return {
    height: heightPct + '%',
    background: color,
    opacity: idx === 0 ? '1' : '0.7',
  }
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    rawData.value = await fetchRoadSurface()
    fetchedAt.value = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.rs-page {
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: 40px;
}

.page-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #1B355A;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}
.btn-back {
  background: none;
  border: none;
  color: #4D9BC6;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.nav-title { margin: 0;
  font-size: 15px;
  font-weight: 700;
}
.nav-spacer {
  flex: 1;
}

.summary-bar {
  display: flex;
  background: #fff;
  padding: 16px;
  border-bottom: 1px solid #eee;
}
.summary-item {
  flex: 1;
  text-align: center;
  border-right: 1px solid #eee;
}
.summary-item:last-child {
  border-right: none;
}
.summary-num {
  display: block;
  font-size: 24px;
  font-weight: 800;
}
.summary-item.safe .summary-num {
  color: #22C55E;
}
.summary-item.caution .summary-num {
  color: #EAB308;
}
.summary-item.warning .summary-num {
  color: #EF4444;
}
.summary-label {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.legend-bar {
  padding: 10px 16px;
  background: #f9fafb;
}
.legend-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #1B355A;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-box {
  margin: 20px 16px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.error-icon {
  font-size: 24px;
  flex-shrink: 0;
}
.error-title {
  font-weight: 700;
  color: #92400e;
  font-size: 14px;
}
.error-desc {
  font-size: 12px;
  color: #92400e;
  margin-top: 4px;
}

.rs-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rs-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #22c55e;
}
.rs-main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.rs-emoji {
  font-size: 32px;
}
.rs-info {
  flex: 1;
  min-width: 0;
}
.rs-name {
  font-size: 15px;
  font-weight: 800;
  color: #1b355a;
}
.rs-route {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}
.rs-score {
  display: flex;
  align-items: baseline;
  gap: 2px;
}
.rs-score-num {
  font-size: 28px;
  font-weight: 800;
}
.rs-score-unit {
  font-size: 12px;
  color: #aaa;
}

.rs-badge-row {
  margin-top: 6px;
}
.rs-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 8px;
}

.rs-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}
.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 2px;
}
.m-icon {
  font-size: 14px;
}
.m-label {
  font-size: 9px;
  color: #aaa;
  margin-top: 1px;
}
.m-value {
  font-size: 12px;
  font-weight: 700;
  color: #333;
  margin-top: 1px;
}

/* 트렌드 차트 */
.trend-section {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}
.trend-title {
  font-size: 11px;
  font-weight: 700;
  color: #666;
  margin-bottom: 6px;
}
.trend-chart {
  background: #f8fafc;
  border-radius: 8px;
  padding: 8px 6px 4px;
}
.bars {
  display: flex;
  align-items: flex-end;
  gap: 1px;
  height: 50px;
}
.bar-wrap {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 100%;
}
.bar {
  width: 70%;
  min-height: 2px;
  border-radius: 2px 2px 0 0;
  transition: opacity 0.15s;
}
.trend-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 8px;
  color: #aaa;
}

.risk-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.risk-item {
  font-size: 11px;
  color: #f97316;
  background: #fff7ed;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
}
.risk-item.safe-note {
  color: #16a34a;
  background: #f0fdf4;
}

.info-section {
  margin: 16px;
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}
.info-title {
  font-size: 14px;
  font-weight: 800;
  color: #1b355a;
  margin-bottom: 8px;
}
.info-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 10px;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}
.info-item {
  font-size: 11px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.data-source {
  text-align: center;
  padding: 20px;
  font-size: 11px;
  color: #ccc;
  line-height: 1.6;
}
</style>
