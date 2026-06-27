<template>
  <div class="safety-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <h1 class="nav-title">🚦 운전안전 지수</h1>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>전국 고속도로 운전안전 정보를 분석 중…</p>
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
          <span class="summary-label">✅ 안전</span>
        </div>
        <div class="summary-item caution">
          <span class="summary-num">{{ cautionCount }}</span>
          <span class="summary-label">⚠️ 주의</span>
        </div>
        <div class="summary-item warning">
          <span class="summary-num">{{ warningCount }}</span>
          <span class="summary-label">🚨 위험</span>
        </div>
      </div>

      <!-- 범례 -->
      <div class="legend-bar">
        <span class="legend-title">📊 전국 주요 고속도로 지점 운전안전 등급</span>
      </div>

      <!-- 안전 카드 리스트 -->
      <div class="safety-list">
        <div
          v-for="p in safetyData"
          :key="p.name"
          class="safety-card"
          :style="{ borderLeftColor: p.safety.color }"
        >
          <!-- 메인 행 -->
          <div class="s-main">
            <div class="s-emoji">{{ p.safety.emoji }}</div>
            <div class="s-info">
              <div class="s-name">{{ p.name }}</div>
              <div class="s-route">{{ p.desc }}</div>
            </div>
            <div class="s-score" :style="{ color: p.safety.color }">
              <span class="s-score-num">{{ p.safety.score }}</span>
              <span class="s-score-unit">점</span>
            </div>
          </div>

          <!-- 등급 배지 -->
          <div class="s-badge-row">
            <span class="s-badge" :style="{ background: p.safety.color + '22', color: p.safety.color }">
              {{ p.safety.label }}
            </span>
          </div>

          <!-- 상세 지표 -->
          <div class="s-metrics">
            <div class="metric">
              <span class="m-icon">👁️</span>
              <span class="m-label">가시거리</span>
              <span class="m-value" :style="{ color: p.visGrade.color }">
                {{ p.visibility >= 1000 ? (p.visibility / 1000).toFixed(1) + 'km' : p.visibility + 'm' }}
              </span>
            </div>
            <div class="metric">
              <span class="m-icon">💨</span>
              <span class="m-label">돌풍</span>
              <span class="m-value" :style="{ color: p.gustGrade.color }">
                {{ p.windGust }}km/h
              </span>
            </div>
            <div class="metric">
              <span class="m-icon">🌡️</span>
              <span class="m-label">체감</span>
              <span class="m-value">{{ p.apparentTemp }}°</span>
            </div>
            <div class="metric">
              <span class="m-icon">☁️</span>
              <span class="m-label">운량</span>
              <span class="m-value">{{ p.cloudCover }}%</span>
            </div>
            <div class="metric">
              <span class="m-icon">📊</span>
              <span class="m-label">기압</span>
              <span class="m-value">{{ p.pressure }}hPa</span>
            </div>
            <div class="metric">
              <span class="m-icon">🌧️</span>
              <span class="m-label">강수</span>
              <span class="m-value">{{ (p.precip + p.showers).toFixed(1) }}mm</span>
            </div>
          </div>

          <!-- 위험 요소 -->
          <div v-if="p.safety.risks.length > 0" class="risk-list">
            <div v-for="(r, i) in p.safety.risks" :key="i" class="risk-item">
              {{ r.icon }} {{ r.msg }}
            </div>
          </div>
          <div v-else class="risk-list">
            <div class="risk-item safe-note">✅ 안전 운전 가능</div>
          </div>
        </div>
      </div>

      <!-- 설명 -->
      <div class="info-section">
        <div class="info-title">📌 운전안전 지수란?</div>
        <div class="info-desc">
          가시거리·돌풍·강수·적설·천둥번개 등 운전 위험 요소를 종합하여
          0~100점으로 평가합니다. 점수가 높을수록 안전합니다.
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="dot" style="background:#22C55E"></span> 85-100점: 안전</div>
          <div class="info-item"><span class="dot" style="background:#EAB308"></span> 65-84점: 주의</div>
          <div class="info-item"><span class="dot" style="background:#F97316"></span> 40-64점: 위험</div>
          <div class="info-item"><span class="dot" style="background:#EF4444"></span> 0-39점: 매우 위험</div>
        </div>
      </div>
    </template>

    <div class="data-source">
      데이터 출처: Open-Meteo (확장 기상 파라미터 — 가시거리·돌풍·해면기압·체감온도·운량·적설·소나기)<br>
      호출시각: {{ fetchedAt }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  fetchDrivingSafety,
  computeSafetyIndex,
  getVisibilityGrade,
  getWindGustGrade,
} from '../lib/api.js'

const loading = ref(false)
const error = ref('')
const rawData = ref([])
const fetchedAt = ref('')

const safetyData = computed(() =>
  rawData.value.map((p) => {
    const safety = computeSafetyIndex(p)
    return {
      ...p,
      safety,
      visGrade: getVisibilityGrade(p.visibility),
      gustGrade: getWindGustGrade(p.windGust),
    }
  })
)

const safeCount = computed(() => safetyData.value.filter((p) => p.safety.score >= 85).length)
const cautionCount = computed(() =>
  safetyData.value.filter((p) => p.safety.score >= 40 && p.safety.score < 85).length
)
const warningCount = computed(() => safetyData.value.filter((p) => p.safety.score < 40).length)

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    rawData.value = await fetchDrivingSafety()
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
.safety-page {
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

.safety-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.safety-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #22c55e;
}
.s-main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.s-emoji {
  font-size: 32px;
}
.s-info {
  flex: 1;
  min-width: 0;
}
.s-name {
  font-size: 15px;
  font-weight: 800;
  color: #1b355a;
}
.s-route {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}
.s-score {
  display: flex;
  align-items: baseline;
  gap: 2px;
}
.s-score-num {
  font-size: 28px;
  font-weight: 800;
}
.s-score-unit {
  font-size: 12px;
  color: #aaa;
}

.s-badge-row {
  margin-top: 6px;
}
.s-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 8px;
}

.s-metrics {
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
