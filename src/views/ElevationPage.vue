<template>
  <div class="elev-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <h1 class="nav-title">⛰️ 표고 프로파일</h1>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>전국 고속도로 표고 데이터를 조회 중…</p>
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
      <!-- 호출 시각 -->
      <div class="fetched-bar">
        🕐 조회시각: {{ fetchedAt }}
      </div>

      <!-- 요약 -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-num">{{ data.maxElev }}m</span>
          <span class="summary-label">⛰️ 최고점 <small>{{ data.maxPoint?.name }}</small></span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ data.minElev }}m</span>
          <span class="summary-label">🌊 최저점 <small>{{ data.minPoint?.name }}</small></span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ elevationRange }}m</span>
          <span class="summary-label">📊 고저차</span>
        </div>
      </div>

      <!-- 범례 -->
      <div class="legend-bar">
        <span class="legend-title">📊 전국 주요 고속도로 지점 해발 고도</span>
      </div>

      <!-- 표고 바 차트 -->
      <div class="chart-section">
        <div class="chart-title">🏔️ 고속도로 표고 프로파일 (남→북)</div>
        <div class="elev-chart">
          <div
            v-for="(p, i) in sortedPoints"
            :key="p.name"
            class="elev-bar-wrap"
          >
            <div class="elev-bar-label">{{ p.elevation }}m</div>
            <div class="elev-bar-col">
              <div
                class="elev-bar"
                :style="{
                  height: getBarHeight(p.elevation) + '%',
                  background: getBarGradient(p.elevation)
                }"
              ></div>
            </div>
            <div class="elev-bar-name">{{ p.name.split(' ')[0] }}</div>
          </div>
        </div>
      </div>

      <!-- 상세 카드 -->
      <div class="card-list">
        <div
          v-for="(p, i) in data.points"
          :key="p.name"
          class="elev-card"
          :style="{ borderLeftColor: getElevationGrade(p.elevation).color }"
        >
          <!-- 메인 -->
          <div class="e-main">
            <div class="e-emoji">{{ getElevationGrade(p.elevation).emoji }}</div>
            <div class="e-info">
              <div class="e-name">{{ p.name }}</div>
              <div class="e-desc">{{ p.desc }}</div>
            </div>
            <div class="e-value" :style="{ color: getElevationGrade(p.elevation).color }">
              <span class="e-value-num">{{ p.elevation ?? '-' }}</span>
              <span class="e-value-unit">m</span>
            </div>
          </div>

          <!-- 등급 배지 -->
          <div class="e-badge-row">
            <span class="e-badge" :style="{ background: getElevationGrade(p.elevation).color + '22', color: getElevationGrade(p.elevation).color }">
              {{ getElevationGrade(p.elevation).label }}
            </span>
          </div>

          <!-- 상세 지표 -->
          <div class="e-metrics">
            <div class="metric">
              <span class="m-icon">📐</span>
              <span class="m-label">해발고도</span>
              <span class="m-value" :style="{ color: getElevationGrade(p.elevation).color }">
                {{ p.elevation != null ? p.elevation + 'm' : '-' }}
              </span>
            </div>
            <div v-if="p.gradientFromPrev != null" class="metric">
              <span class="m-icon">{{ p.elevationDiff > 0 ? '🔼' : p.elevationDiff < 0 ? '🔽' : '➡️' }}</span>
              <span class="m-label">이전 구간 경사</span>
              <span class="m-value" :style="{ color: getGradientGrade(p.gradientFromPrev).color }">
                {{ p.gradientFromPrev > 0 ? '+' : '' }}{{ p.gradientFromPrev }}%
                <small>({{ p.distanceFromPrev }}km, {{ p.elevationDiff > 0 ? '+' : '' }}{{ p.elevationDiff }}m)</small>
              </span>
            </div>
            <div v-if="p.elevation != null" class="metric">
              <span class="m-icon">🌡️</span>
              <span class="m-label">해발별 체감온도</span>
              <span class="m-value">
                해수면 대비 -{{ Math.round(p.elevation * 0.006 * 10) / 10 }}°C
              </span>
            </div>
          </div>

          <!-- 운전 조언 -->
          <div v-if="getElevationAdvice(p).length" class="e-advice">
            <div v-for="(a, j) in getElevationAdvice(p)" :key="j" class="advice-item">
              {{ a.icon }} {{ a.msg }}
            </div>
          </div>
        </div>
      </div>

      <!-- 정보 -->
      <div class="info-box">
        <div class="info-title">ℹ️ 표고 프로파일 정보</div>
        <div class="info-text">
          • 해발 고도가 높을수록 기온이 낮아져 노면 결빙 위험이 증가합니다<br>
          • 해발 100m당 기온이 약 0.6°C 낮아집니다 (건조 단열 감률)<br>
          • 급경사 구간에서는 엔진 브레이크 활용이 중요합니다<br>
          • 고산 구간(500m 이상)은 안개·결빙 발생 빈도가 높습니다
        </div>
        <div class="info-source">출처: Open-Meteo Elevation API</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { fetchHighwayElevation, getElevationGrade, getGradientGrade } from '../lib/api'

const loading = ref(true)
const error = ref(null)
const data = ref({ points: [], maxElev: 0, minElev: 0, maxPoint: null, minPoint: null })
const fetchedAt = ref('')

const elevationRange = computed(() => {
  return data.value.maxElev - data.value.minElev || 0
})

// 바 차트용 (남→북 정렬, 위도 기준)
const sortedPoints = computed(() => {
  return [...data.value.points].sort((a, b) => a.lat - b.lat)
})

function getBarHeight(elev) {
  if (elev == null || data.value.maxElev === 0) return 5
  const min = data.value.minElev || 0
  const max = data.value.maxElev || 1
  return Math.max(8, ((elev - min) / (max - min)) * 100)
}

function getBarGradient(elev) {
  if (elev == null) return '#ccc'
  if (elev >= 500) return 'linear-gradient(180deg, #8B5CF6, #6366F1)'
  if (elev >= 300) return 'linear-gradient(180deg, #6366F1, #0EA5E9)'
  if (elev >= 150) return 'linear-gradient(180deg, #0EA5E9, #22C55E)'
  return 'linear-gradient(180deg, #22C55E, #06B6D4)'
}

function getElevationAdvice(point) {
  const advice = []
  if (point.elevation >= 500) {
    advice.push({ icon: '⛰️', msg: '고산 구간: 안개·결빙 주의, 겨울철 체인 필수' })
  }
  if (point.elevation >= 300 && point.elevation < 500) {
    advice.push({ icon: '🏔️', msg: '산간 구간: 기온이 평지보다 낮아 결빙 가능성 존재' })
  }
  if (point.gradientFromPrev != null && Math.abs(point.gradientFromPrev) >= 4) {
    advice.push({ icon: '⚠️', msg: `급경사 구간 (${point.gradientFromPrev > 0 ? '오르막' : '내리막'} ${Math.abs(point.gradientFromPrev)}%): 엔진 브레이크 권장` })
  }
  if (point.gradientFromPrev != null && Math.abs(point.gradientFromPrev) >= 2 && Math.abs(point.gradientFromPrev) < 4) {
    advice.push({ icon: '🚗', msg: `완만한 경사 (${point.gradientFromPrev > 0 ? '오르막' : '내리막'} ${Math.abs(point.gradientFromPrev)}%): 속도 유지 주의` })
  }
  return advice
}

onMounted(async () => {
  try {
    const result = await fetchHighwayElevation()
    data.value = result
    fetchedAt.value = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    loading.value = false
  } catch (e) {
    error.value = e.message || '알 수 없는 오류'
    loading.value = false
  }
})
</script>

<style scoped>
.elev-page {
  min-height: 100dvh;
  background: #f0f4f8;
}

.page-nav {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #1B355A;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
}
.btn-back {
  background: none;
  border: none;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 8px;
}
.nav-title { margin: 0; font-size: 16px; font-weight: 700; flex: 1; text-align: center; }
.nav-spacer { width: 40px; }

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #4D9BC6;
}
.spinner {
  width: 36px; height: 36px;
  border: 3px solid #e0e0e0;
  border-top-color: #4D9BC6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-box {
  margin: 16px;
  padding: 20px;
  background: #FEF2F2;
  border-radius: 12px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.error-icon { font-size: 28px; }
.error-title { font-weight: 700; color: #991B1B; }
.error-desc { font-size: 13px; color: #888; margin-top: 4px; }

.fetched-bar {
  text-align: center;
  padding: 8px;
  font-size: 12px;
  color: #4D9BC6;
  background: #E8F1FA;
}

.summary-bar {
  display: flex;
  padding: 12px 16px;
  gap: 8px;
}
.summary-item {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.summary-num {
  display: block;
  font-size: 22px;
  font-weight: 800;
  color: #1B355A;
}
.summary-label {
  display: block;
  font-size: 11px;
  color: #888;
  margin-top: 4px;
}
.summary-label small {
  display: block;
  color: #aaa;
  font-size: 10px;
}

.legend-bar {
  padding: 8px 16px;
}
.legend-title {
  font-size: 13px;
  font-weight: 700;
  color: #1B355A;
}

/* 차트 섹션 */
.chart-section {
  margin: 8px 16px 16px;
  background: #fff;
  border-radius: 14px;
  padding: 16px 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.chart-title {
  font-size: 14px;
  font-weight: 700;
  color: #1B355A;
  margin-bottom: 14px;
  text-align: center;
}
.elev-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 160px;
  overflow-x: auto;
}
.elev-bar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 44px;
  height: 100%;
}
.elev-bar-label {
  font-size: 10px;
  font-weight: 600;
  color: #4D9BC6;
  margin-bottom: 4px;
  white-space: nowrap;
}
.elev-bar-col {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.elev-bar {
  width: 70%;
  min-height: 6px;
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
}
.elev-bar-name {
  font-size: 10px;
  color: #666;
  margin-top: 4px;
  white-space: nowrap;
}

/* 카드 리스트 */
.card-list {
  padding: 0 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.elev-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  border-left: 4px solid #ccc;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.e-main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.e-emoji {
  font-size: 28px;
  width: 44px; height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f5fa;
  border-radius: 10px;
  flex-shrink: 0;
}
.e-info { flex: 1; }
.e-name { font-size: 15px; font-weight: 700; color: #1B355A; }
.e-desc { font-size: 12px; color: #888; margin-top: 2px; }
.e-value { text-align: right; }
.e-value-num { font-size: 24px; font-weight: 800; }
.e-value-unit { font-size: 13px; font-weight: 600; }

.e-badge-row {
  margin-top: 10px;
}
.e-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
}

.e-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 8px 10px;
}
.m-icon { font-size: 14px; }
.m-label { font-size: 10px; color: #888; }
.m-value {
  font-size: 13px;
  font-weight: 600;
  color: #1B355A;
}
.m-value small { font-size: 10px; color: #888; font-weight: 400; }

.e-advice {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.advice-item {
  font-size: 12px;
  color: #666;
  background: #FFF7ED;
  padding: 6px 10px;
  border-radius: 6px;
}

.info-box {
  margin: 0 16px 30px;
  padding: 16px;
  background: #E8F1FA;
  border-radius: 12px;
}
.info-title { font-weight: 700; font-size: 13px; color: #1B355A; margin-bottom: 8px; }
.info-text { font-size: 12px; color: #555; line-height: 1.7; }
.info-source { font-size: 11px; color: #888; margin-top: 8px; }
</style>
