<template>
  <div class="ts-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <h1 class="nav-title">⛈️ 뇌우·대기불안정 예보</h1>
      <span class="nav-spacer"></span>
    </nav>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>전국 고속도로 뇌우 위험도를 분석 중…</p>
    </div>

    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <div class="error-title">정보를 불러올 수 없습니다</div>
        <div class="error-desc">{{ error }}</div>
      </div>
    </div>

    <template v-if="!loading && !error">
      <div class="fetched-at">📊 조회 시각: {{ fetchedAt }}</div>

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
          <span class="summary-label">🔶 위험</span>
        </div>
        <div class="summary-item danger">
          <span class="summary-num">{{ dangerCount }}</span>
          <span class="summary-label">🚨 매우위험</span>
        </div>
      </div>

      <div class="legend-bar">
        <span class="legend-title">⚡ CAPE·상승지수·이슬점 기반 뇌우 발생 가능성</span>
      </div>

      <div class="ts-list">
        <div
          v-for="p in tsData"
          :key="p.name"
          class="ts-card"
          :style="cardStyle(p.risk.color)"
        >
          <div class="ts-main">
            <div class="ts-emoji">{{ p.risk.emoji }}</div>
            <div class="ts-info">
              <div class="ts-name">{{ p.name }}</div>
              <div class="ts-route">{{ p.desc }}</div>
            </div>
            <div class="ts-score" :style="scoreStyle(p.risk.color)">
              <span class="ts-score-num">{{ p.risk.score }}</span>
              <span class="ts-score-unit">점</span>
            </div>
          </div>

          <div class="ts-badge-row">
            <span class="ts-badge" :style="badgeStyle(p.risk.color)">
              {{ p.risk.label }}
            </span>
          </div>

          <div class="ts-metrics">
            <div class="metric">
              <span class="m-icon">⚡</span>
              <span class="m-label">CAPE</span>
              <span class="m-value" :style="textStyle(p.capeGrade.color)">
                {{ p.cape ?? '-' }} J/kg
              </span>
            </div>
            <div class="metric">
              <span class="m-icon">📊</span>
              <span class="m-label">상승지수</span>
              <span class="m-value" :style="textStyle(p.liGrade.color)">
                {{ p.liftedIndex != null ? p.liftedIndex.toFixed(1) : '-' }}
              </span>
            </div>
            <div class="metric">
              <span class="m-icon">💧</span>
              <span class="m-label">이슬점</span>
              <span class="m-value" :style="textStyle(p.dewGrade.color)">
                {{ p.dewPoint != null ? Math.round(p.dewPoint) + '°C' : '-' }}
              </span>
            </div>
            <div class="metric">
              <span class="m-icon">☁️</span>
              <span class="m-label">운량</span>
              <span class="m-value" :style="textStyle(p.cloudGrade.color)">
                {{ p.cloudCover }}%
              </span>
            </div>
          </div>

          <div v-if="p.risk.risks.length > 0" class="risk-list">
            <div v-for="(r, i) in p.risk.risks" :key="i" class="risk-item">
              <span class="risk-icon">{{ r.icon }}</span>
              <span class="risk-msg">{{ r.msg }}</span>
            </div>
          </div>

          <details class="hourly-details">
            <summary>📈 시간별 CAPE·상승지수 (12시간)</summary>
            <div class="hourly-chart">
              <div v-for="h in p.hourly" :key="h.time" class="hourly-bar-wrapper">
                <div class="hourly-bar-container">
                  <div class="hourly-bar" :style="barStyle(h.cape)" :title="capeTitle(h.cape)"></div>
                </div>
                <div class="hourly-time">{{ formatHour(h.time) }}</div>
                <div class="hourly-cape" :style="textStyle(getCapeColor(h.cape))">{{ h.cape }}</div>
              </div>
            </div>
          </details>
        </div>
      </div>

      <div class="info-section">
        <h3>📖 뇌우 예보 지표 안내</h3>
        <div class="info-item">
          <strong>⚡ CAPE (Convective Available Potential Energy)</strong>
          <p>대기의 불안정도 에너지. 500J/kg 이상이면 뇌우 주의, 1000J/kg 이상이면 강한 뇌우, 2500J/kg 이상은 극심한 뇌우 가능성을 의미합니다.</p>
        </div>
        <div class="info-item">
          <strong>📊 Lifted Index (상승지수)</strong>
          <p>기단이 상승할 때의 안정성 지표. 0 이하면 불안정, -3 이하면 강한 불안정, -6 이하면 극심한 불안정으로 심한 날씨가 예상됩니다.</p>
        </div>
        <div class="info-item">
          <strong>💧 이슬점 (Dew Point)</strong>
          <p>공기 중 수분량. 18°C 이상이면 뇌우 형성에 충분한 수분이 있음을 의미합니다.</p>
        </div>
        <p class="data-source">출처: Open-Meteo Forecast API (CAMS, GFS 기반)</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { fetchThunderstormRisk, getThunderstormRisk, getCapeGrade, getLiftedIndexGrade, getDewPointGrade, getCloudCoverGrade } from '../lib/api.js'

const tsData = ref([])
const loading = ref(true)
const error = ref(null)
const fetchedAt = ref('')

onMounted(async () => {
  try {
    const data = await fetchThunderstormRisk()
    tsData.value = data.map(p => {
      const risk = getThunderstormRisk(p)
      return {
        ...p,
        risk,
        capeGrade: getCapeGrade(Math.max(p.cape ?? 0, p.maxCape ?? 0)),
        liGrade: getLiftedIndexGrade(p.minLI ?? p.liftedIndex),
        dewGrade: getDewPointGrade(p.dewPoint),
        cloudGrade: getCloudCoverGrade(p.cloudCover),
      }
    })
    fetchedAt.value = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const safeCount = computed(() => tsData.value.filter(p => p.risk.level === 'safe').length)
const cautionCount = computed(() => tsData.value.filter(p => p.risk.level === 'caution').length)
const warningCount = computed(() => tsData.value.filter(p => p.risk.level === 'warning').length)
const dangerCount = computed(() => tsData.value.filter(p => p.risk.level === 'danger').length)

function getCapeColor(cape) {
  if (cape >= 2500) return '#991B1B'
  if (cape >= 1000) return '#EF4444'
  if (cape >= 500) return '#F97316'
  if (cape >= 200) return '#EAB308'
  return '#22C55E'
}

function barStyle(cape) {
  const h = Math.min(100, (cape / 3000) * 100)
  return { height: h + '%', background: getCapeColor(cape) }
}

function capeTitle(cape) {
  return 'CAPE: ' + cape + 'J/kg'
}

function cardStyle(color) {
  return { borderLeftColor: color }
}

function scoreStyle(color) {
  return { color }
}

function badgeStyle(color) {
  return { background: color + '22', color }
}

function textStyle(color) {
  return { color }
}

function formatHour(timeStr) {
  const d = new Date(timeStr)
  return d.getHours() + '시'
}
</script>

<style scoped>
.ts-page {
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: 40px;
}

.page-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #1B355A;
  color: #fff;
}
.btn-back {
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}
.nav-title { margin: 0; font-size: 16px; font-weight: 700; }
.nav-spacer { flex: 1; }

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}
.spinner {
  width: 36px; height: 36px;
  border: 3px solid #e0e0e0;
  border-top-color: #4D9BC6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-box {
  margin: 20px;
  padding: 20px;
  background: #FEF2F2;
  border-radius: 12px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.error-icon { font-size: 24px; }
.error-title { font-weight: 700; color: #EF4444; }
.error-desc { font-size: 13px; color: #888; margin-top: 4px; }

.fetched-at {
  text-align: center;
  font-size: 12px;
  color: #888;
  padding: 8px;
}

.summary-bar {
  display: flex;
  max-width: 480px;
  margin: 0 auto 8px;
  padding: 0 16px;
  gap: 8px;
}
.summary-item {
  flex: 1;
  text-align: center;
  padding: 10px 4px;
  border-radius: 10px;
  background: #fff;
}
.summary-item.safe { border-left: 3px solid #22C55E; }
.summary-item.caution { border-left: 3px solid #EAB308; }
.summary-item.warning { border-left: 3px solid #F97316; }
.summary-item.danger { border-left: 3px solid #EF4444; }
.summary-num { display: block; font-size: 22px; font-weight: 800; }
.summary-label { font-size: 11px; color: #666; }

.legend-bar {
  max-width: 480px;
  margin: 0 auto 12px;
  padding: 0 16px;
}
.legend-title {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.ts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 480px;
  margin: 0 auto;
  padding: 0 16px;
}

.ts-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  border-left: 4px solid #ccc;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.ts-main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ts-emoji { font-size: 28px; }
.ts-info { flex: 1; min-width: 0; }
.ts-name { font-size: 15px; font-weight: 700; color: #1B355A; }
.ts-route { font-size: 12px; color: #888; margin-top: 2px; }
.ts-score { display: flex; align-items: baseline; gap: 2px; }
.ts-score-num { font-size: 24px; font-weight: 800; }
.ts-score-unit { font-size: 12px; }

.ts-badge-row { margin-top: 8px; }
.ts-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 8px;
}

.ts-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 12px;
}
.metric {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: #f8f8f8;
  border-radius: 8px;
}
.m-icon { font-size: 16px; }
.m-label { font-size: 11px; color: #888; flex: 1; }
.m-value { font-size: 13px; font-weight: 700; }

.risk-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.risk-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: #555;
}
.risk-icon { flex-shrink: 0; }
.risk-msg { line-height: 1.4; }

.hourly-details {
  margin-top: 12px;
}
.hourly-details summary {
  font-size: 13px;
  font-weight: 600;
  color: #4D9BC6;
  cursor: pointer;
  padding: 6px 0;
}
.hourly-chart {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  margin-top: 8px;
  overflow-x: auto;
}
.hourly-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 36px;
  flex: 1;
}
.hourly-bar-container {
  height: 60px;
  display: flex;
  align-items: flex-end;
  width: 100%;
}
.hourly-bar {
  width: 100%;
  border-radius: 3px 3px 0 0;
  min-height: 2px;
  transition: height 0.3s;
}
.hourly-time {
  font-size: 9px;
  color: #888;
  margin-top: 2px;
}
.hourly-cape {
  font-size: 9px;
  font-weight: 700;
}

.info-section {
  max-width: 480px;
  margin: 24px auto 0;
  padding: 20px 16px;
  background: #fff;
  border-radius: 14px;
}
.info-section h3 {
  font-size: 15px;
  font-weight: 700;
  color: #1B355A;
  margin-bottom: 12px;
}
.info-item {
  margin-bottom: 12px;
}
.info-item strong {
  font-size: 13px;
  color: #333;
}
.info-item p {
  font-size: 12px;
  color: #666;
  margin: 4px 0 0;
  line-height: 1.5;
}
.data-source {
  font-size: 11px;
  color: #aaa;
  margin-top: 12px;
}
</style>
