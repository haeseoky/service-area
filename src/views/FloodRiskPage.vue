<template>
  <div class="flood-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <span class="nav-title">🌊 하천 범람 위험</span>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>전국 고속도로 인근 하천 유량을 분석 중…</p>
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
          <span class="summary-label">✅ 정상</span>
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
        <span class="legend-title">🌊 전국 고속도로 인근 하천 유량 예측 (Open-Meteo Flood API)</span>
      </div>

      <!-- 범람 위험 카드 리스트 -->
      <div class="flood-list">
        <div
          v-for="p in floodData"
          :key="p.name"
          class="flood-card"
          :class="{ 'card-danger': p.grade.level === 'danger', 'card-warning': p.grade.level === 'warning' }"
          :style="{ borderLeftColor: p.grade.color }"
        >
          <!-- 메인 행 -->
          <div class="f-main">
            <div class="f-emoji">{{ p.grade.emoji }}</div>
            <div class="f-info">
              <div class="f-name">{{ p.name }}</div>
              <div class="f-river">{{ p.river }} · {{ p.desc }}</div>
            </div>
            <div class="f-discharge" :style="{ color: p.grade.color }">
              <span class="f-discharge-num">{{ p.current ?? '-' }}</span>
              <span class="f-discharge-unit">m³/s</span>
            </div>
          </div>

          <!-- 등급 배지 + 추세 -->
          <div class="f-badge-row">
            <span class="f-badge" :style="{ background: p.grade.color + '22', color: p.grade.color }">
              {{ p.grade.label }}
            </span>
            <span v-if="p.trend" class="f-trend" :style="{ color: p.trend.color }">
              {{ p.trend.icon }} {{ p.trend.text }}
            </span>
            <span v-if="p.surgeRatio > 1.5" class="f-surge">
              💧 최대 {{ p.maxForecast }} m³/s ({{ p.surgeRatio }}배)
            </span>
          </div>

          <!-- 7일 예측 차트 -->
          <div v-if="p.forecast?.length" class="forecast-section">
            <div class="forecast-label">📊 7일 유량 예측</div>
            <div class="bar-chart">
              <div
                v-for="(val, i) in p.forecast"
                :key="i"
                class="bar-col"
              >
                <div class="bar-wrap">
                  <div
                    class="bar"
                    :style="{
                      height: barHeight(val, p.maxForecast, p.current) + '%',
                      background: barColor(val, p.current, p.maxForecast)
                    }"
                  >
                    <span class="bar-val">{{ val >= 100 ? Math.round(val) : val }}</span>
                  </div>
                </div>
                <span class="bar-date">{{ formatDateShort(p.forecastDates[i]) }}</span>
              </div>
            </div>
          </div>

          <!-- 과거 3일 -->
          <div v-if="p.past?.length" class="past-section">
            <span class="past-label">과거 3일:</span>
            <span class="past-vals">
              <span v-for="(v, i) in p.past" :key="i" class="past-val">
                {{ v >= 100 ? Math.round(v) : v }}{{ i < p.past.length - 1 ? ' → ' : '' }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- 호출 시각 -->
      <div class="fetched-at">
        🕐 데이터 호출: {{ fetchedAt }}
      </div>

      <!-- 정보 안내 -->
      <div class="info-box">
        <div class="info-title">ℹ️ 하천 범람 위험도 안내</div>
        <div class="info-desc">
          Open-Meteo Flood API의 하천 유량(discharge) 예측 데이터를 사용합니다.
          장마·태풍 시기 고속도로 인근 하천 범람 위험을 참고하시기 바랍니다.
        </div>
        <div class="info-desc">
          <strong>등급 기준:</strong> 유량 500+ m³/s 또는 급증비 5배+ = 위험 🚨 ·
          유량 100+ m³/s 또는 급증비 2배+ = 주의 ⚠️
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchHighwayFloodRisk, getFloodGrade, getFloodTrend } from '../lib/api.js'

const floodData = ref([])
const loading = ref(true)
const error = ref(null)
const fetchedAt = ref('')

onMounted(async () => {
  try {
    const results = await fetchHighwayFloodRisk()
    floodData.value = results.map(p => ({
      ...p,
      grade: getFloodGrade(p),
      trend: getFloodTrend(p),
    }))
    fetchedAt.value = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const safeCount = computed(() => floodData.value.filter(p => p.grade.level === 'safe').length)
const cautionCount = computed(() => floodData.value.filter(p => p.grade.level === 'caution').length)
const warningCount = computed(() => floodData.value.filter(p => ['warning', 'danger'].includes(p.grade.level)).length)

function barHeight(val, max, current) {
  const peak = Math.max(max, current, 1)
  return Math.max(8, (val / peak) * 100)
}

function barColor(val, current, max) {
  const ratio = current > 0.1 ? val / current : 0
  if (ratio >= 5 || val >= 500) return 'linear-gradient(180deg, #EF4444, #DC2626)'
  if (ratio >= 2 || val >= 100) return 'linear-gradient(180deg, #F97316, #EA580C)'
  if (ratio >= 1.3) return 'linear-gradient(180deg, #EAB308, #CA8A04)'
  return 'linear-gradient(180deg, #4D9BC6, #2563EB)'
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}
</script>

<style scoped>
.flood-page {
  min-height: 100dvh;
  background: #f0f4f8;
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
  border: none;
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.nav-title { font-size: 16px; font-weight: 700; }
.nav-spacer { flex: 1; }

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}
.spinner {
  width: 40px; height: 40px;
  border: 4px solid #ddd;
  border-top-color: #4D9BC6;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-box {
  display: flex;
  gap: 12px;
  margin: 20px;
  padding: 20px;
  background: #FEF2F2;
  border-radius: 12px;
  color: #991B1B;
}
.error-icon { font-size: 32px; }
.error-title { font-weight: 700; }
.error-desc { font-size: 13px; margin-top: 4px; }

.summary-bar {
  display: flex;
  gap: 8px;
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
}
.summary-item {
  flex: 1;
  text-align: center;
  background: #fff;
  border-radius: 12px;
  padding: 14px 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.summary-num { display: block; font-size: 24px; font-weight: 800; }
.summary-label { font-size: 12px; color: #888; }
.summary-item.safe .summary-num { color: #22C55E; }
.summary-item.caution .summary-num { color: #EAB308; }
.summary-item.warning .summary-num { color: #EF4444; }

.legend-bar {
  padding: 0 16px 12px;
  max-width: 480px;
  margin: 0 auto;
}
.legend-title { font-size: 13px; font-weight: 700; color: #1B355A; }

.flood-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 16px;
  max-width: 480px;
  margin: 0 auto;
}

.flood-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  border-left: 5px solid #ccc;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.12s;
}
.flood-card:active { transform: scale(0.99); }
.card-danger {
  background: linear-gradient(135deg, #FFF5F5 0%, #fff 60%);
  box-shadow: 0 4px 12px rgba(239,68,68,0.15);
}
.card-warning {
  background: linear-gradient(135deg, #FFF7ED 0%, #fff 60%);
}

.f-main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.f-emoji { font-size: 28px; flex-shrink: 0; }
.f-info { flex: 1; min-width: 0; }
.f-name { font-size: 15px; font-weight: 700; color: #1B355A; }
.f-river { font-size: 12px; color: #888; margin-top: 2px; }

.f-discharge { text-align: right; flex-shrink: 0; }
.f-discharge-num { font-size: 22px; font-weight: 800; display: block; line-height: 1; }
.f-discharge-unit { font-size: 11px; color: #aaa; }

.f-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.f-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
}
.f-trend {
  font-size: 12px;
  font-weight: 600;
}
.f-surge {
  font-size: 11px;
  color: #EF4444;
  font-weight: 600;
}

.forecast-section {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.forecast-label {
  font-size: 12px;
  font-weight: 700;
  color: #555;
  margin-bottom: 8px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100px;
}
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}
.bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.bar {
  width: 80%;
  min-height: 8px;
  border-radius: 4px 4px 0 0;
  position: relative;
  display: flex;
  justify-content: center;
  transition: height 0.3s ease;
}
.bar-val {
  position: absolute;
  top: -16px;
  font-size: 9px;
  font-weight: 600;
  color: #666;
  white-space: nowrap;
}
.bar-date {
  font-size: 9px;
  color: #aaa;
  margin-top: 4px;
}

.past-section {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  font-size: 11px;
  color: #999;
}
.past-label { font-weight: 600; margin-right: 4px; }
.past-vals { color: #aaa; }
.past-val { color: #888; }

.fetched-at {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: #aaa;
}

.info-box {
  margin: 16px;
  padding: 16px;
  background: #F0F9FF;
  border-radius: 12px;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}
.info-title { font-size: 13px; font-weight: 700; color: #1B355A; }
.info-desc { font-size: 12px; color: #666; margin-top: 6px; line-height: 1.5; }
</style>
