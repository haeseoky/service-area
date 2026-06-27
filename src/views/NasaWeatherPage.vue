<template>
  <div class="nasa-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <h1 class="nav-title">🛰️ 위성 기상 분석</h1>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>NASA 위성 기상 데이터를 수신 중…</p>
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
      <!-- 호출 시각 -->
      <div class="fetched-bar">
        🕐 조회시각: {{ fetchedAt }} · <small>NASA POWER 위성 관측 (약 3일 지연)</small>
      </div>

      <!-- 요약 -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-num">{{ maxSolarPoint?.avgSolar ?? '-' }}</span>
          <span class="summary-label">☀️ 일사 최고 <small>{{ maxSolarPoint?.name }}</small></span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ maxWindPoint?.avgWind50 ?? '-' }}</span>
          <span class="summary-label">💨 50m 풍 최고 <small>{{ maxWindPoint?.name }}</small></span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ maxRainPoint?.totalPrecip ?? '-' }}mm</span>
          <span class="summary-label">🌧️ 강수 최다 <small>{{ maxRainPoint?.name }}</small></span>
        </div>
      </div>

      <!-- 데이터 소스 안내 -->
      <div class="info-banner">
        🛰️ <strong>NASA POWER</strong> 위성 관측 기반 · 일사량·고층풍·풍향·습구온도·기압 (지상 관측과 다른 위성 시점)
      </div>

      <!-- 지점별 상세 카드 -->
      <div class="section-title">📊 전국 고속도로 지점별 위성 기상 (최근 14일 평균)</div>

      <div class="point-card" v-for="p in points" :key="p.name">
        <div class="point-header">
          <div class="point-name">{{ p.name }}</div>
          <div class="point-desc">{{ p.desc }}</div>
        </div>

        <!-- 최신 유효 데이터 -->
        <div v-if="p.latest" class="latest-row">
          <div class="latest-tag">최신 관측 {{ p.latest.date }}</div>
        </div>

        <div class="metric-grid">
          <!-- 일사량 -->
          <div class="metric-cell">
            <div class="metric-label">☀️ 일사량</div>
            <div class="metric-value" :style="{ color: getSolarGrade(p.latest?.solar).color }">
              {{ p.latest?.solar ?? '-' }} <small>MJ/m²</small>
            </div>
            <div class="metric-sub">{{ getSolarGrade(p.latest?.solar).label }}</div>
          </div>

          <!-- 50m 고층 풍속 -->
          <div class="metric-cell">
            <div class="metric-label">💨 50m 풍속</div>
            <div class="metric-value" :style="{ color: getHighWindGrade(p.latest?.wind50).color }">
              {{ p.latest?.wind50 ?? '-' }} <small>m/s</small>
            </div>
            <div class="metric-sub">{{ getHighWindGrade(p.latest?.wind50).label }}</div>
          </div>

          <!-- 풍향 -->
          <div class="metric-cell">
            <div class="metric-label">🧭 풍향</div>
            <div class="metric-value">
              {{ getWindDirText(p.latest?.windDir) }}
            </div>
            <div class="metric-sub">{{ p.latest?.windDir != null ? p.latest.windDir + '°' : '-' }}</div>
          </div>

          <!-- 습구온도 -->
          <div class="metric-cell">
            <div class="metric-label">🌡️ 습구온도</div>
            <div class="metric-value" :style="{ color: getWetBulbGrade(p.latest?.wetBulb).color }">
              {{ p.latest?.wetBulb ?? '-' }}<small>°C</small>
            </div>
            <div class="metric-sub">{{ getWetBulbGrade(p.latest?.wetBulb).label }}</div>
          </div>

          <!-- 표면 기압 -->
          <div class="metric-cell">
            <div class="metric-label">📊 기압</div>
            <div class="metric-value" :style="{ color: getPressureGrade(p.latest?.pressure).color }">
              {{ p.latest?.pressure ?? '-' }} <small>kPa</small>
            </div>
            <div class="metric-sub">{{ getPressureGrade(p.latest?.pressure).label }}</div>
          </div>

          <!-- 기온 -->
          <div class="metric-cell">
            <div class="metric-label">🌡️ 기온</div>
            <div class="metric-value">
              {{ p.latest?.temp ?? '-' }}<small>°C</small>
            </div>
            <div class="metric-sub">습도 {{ p.latest?.humidity ?? '-' }}%</div>
          </div>
        </div>

        <!-- 14일 평균 요약 -->
        <div class="avg-row">
          <span class="avg-tag">14일 평균</span>
          <span class="avg-item">☀️ {{ p.avgSolar ?? '-' }} MJ/m²</span>
          <span class="avg-item">💨 {{ p.avgWind50 ?? '-' }} m/s</span>
          <span class="avg-item">🌡️ {{ p.avgTemp ?? '-' }}°C</span>
          <span class="avg-item">📊 {{ p.avgPressure ?? '-' }} kPa</span>
          <span class="avg-item">🌧️ {{ p.totalPrecip ?? '-' }}mm</span>
        </div>

        <!-- 일사량 추이 차트 -->
        <div v-if="p.days.some(d => d.solar != null)" class="mini-chart">
          <div class="mini-chart-title">☀️ 일사량 추이 (14일)</div>
          <div class="bar-chart">
            <div
              v-for="d in p.days"
              :key="d.date"
              class="bar-wrap"
            >
              <div
                v-if="d.solar != null"
                class="bar"
                :style="{
                  height: ((d.solar / 30) * 100) + '%',
                  background: getSolarGrade(d.solar).color
                }"
                :title="`${d.date}: ${d.solar} MJ/m²`"
              ></div>
              <div v-else class="bar-empty"></div>
            </div>
          </div>
          <div class="chart-dates">
            <span>{{ p.days[0]?.date?.slice(5) }}</span>
            <span>{{ p.days[Math.floor(p.days.length/2)]?.date?.slice(5) }}</span>
            <span>{{ p.days[p.days.length-1]?.date?.slice(5) }}</span>
          </div>
        </div>

        <!-- 강수량 추이 -->
        <div v-if="p.days.some(d => d.precip != null && d.precip > 0)" class="mini-chart">
          <div class="mini-chart-title">🌧️ 위성 강수량 (14일)</div>
          <div class="bar-chart">
            <div
              v-for="d in p.days"
              :key="'r-' + d.date"
              class="bar-wrap"
            >
              <div
                v-if="d.precip != null && d.precip > 0"
                class="bar precip-bar"
                :style="{
                  height: Math.min((d.precip / 15) * 100, 100) + '%',
                }"
                :title="`${d.date}: ${d.precip}mm`"
              ></div>
              <div v-else class="bar-empty"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 도움말 -->
      <div class="help-section">
        <div class="help-title">💡 데이터 설명</div>
        <div class="help-item">🛰️ <strong>NASA POWER</strong>: FLASHFLUX/GEOSIT 위성 관측 기반 일별 기상 데이터</div>
        <div class="help-item">☀️ <strong>일사량</strong>: 태양 복사 에너지 (높을수록 눈부심 위험)</div>
        <div class="help-item">💨 <strong>50m 풍속</strong>: 고층 바람 — 대형 트럭·버스 등 고가 차량 영향</div>
        <div class="help-item">🧭 <strong>풍향</strong>: 바람이 불어오는 방향 — 측풍 위험 평가</div>
        <div class="help-item">🌡️ <strong>습구온도</strong>: 온도+습도 복합 — 24°C 이상 시 열사병 위험</div>
        <div class="help-item">📊 <strong>표면 기압</strong>: 저기압 시 졸음·두통 증가, 고기압 시 맑은 날씨</div>
        <div class="help-note">⚠️ 위성 데이터 특성상 약 3일의 지연이 발생합니다</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchNasaWeather, getSolarGrade, getHighWindGrade, getWetBulbGrade, getPressureGrade } from '../lib/api.js'

const loading = ref(true)
const error = ref(null)
const points = ref([])
const fetchedAt = ref('')

onMounted(async () => {
  try {
    const data = await fetchNasaWeather()
    points.value = data
    fetchedAt.value = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  } catch (e) {
    error.value = e.message || '데이터 조회 실패'
  } finally {
    loading.value = false
  }
})

const maxSolarPoint = computed(() => {
  const valid = points.value.filter(p => p.avgSolar != null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => (a.avgSolar > b.avgSolar ? a : b))
})

const maxWindPoint = computed(() => {
  const valid = points.value.filter(p => p.avgWind50 != null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => (a.avgWind50 > b.avgWind50 ? a : b))
})

const maxRainPoint = computed(() => {
  const valid = points.value.filter(p => p.totalPrecip != null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => (a.totalPrecip > b.totalPrecip ? a : b))
})

function getWindDirText(deg) {
  if (deg == null) return '-'
  const dirs = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
  return dirs[Math.round(deg / 45) % 8]
}
</script>

<style scoped>
.nasa-page {
  min-height: 100dvh;
  background: #f0f4f8;
  padding-bottom: 40px;
}

.page-nav {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%);
  color: #fff; padding: 14px 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
}
.btn-back {
  background: rgba(255,255,255,0.15); border: none; color: #fff;
  padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 13px;
}
.nav-title { margin: 0; font-size: 16px; font-weight: 700; }
.nav-spacer { flex: 1; }

.loading, .error-box {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 20px; color: #666; text-align: center;
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
.error-desc { font-size: 13px; color: #888; margin-top: 4px; }

.fetched-bar {
  text-align: center; padding: 10px;
  background: #E8F0FE; color: #1a56c4;
  font-size: 12px;
}
.fetched-bar small { color: #6B7FA8; }

.summary-bar {
  display: flex; padding: 12px; gap: 8px;
  max-width: 480px; margin: 0 auto;
}
.summary-item {
  flex: 1; background: #fff; border-radius: 10px; padding: 10px 8px;
  text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.summary-num { display: block; font-size: 18px; font-weight: 800; color: #1B355A; }
.summary-label { font-size: 11px; color: #888; display: block; margin-top: 2px; }
.summary-label small { display: block; color: #4D9BC6; font-size: 10px; }

.info-banner {
  max-width: 480px; margin: 0 auto 12px;
  padding: 10px 14px; background: linear-gradient(135deg, #1B355A08, #4D9BC608);
  border: 1px solid #4D9BC630; border-radius: 10px;
  font-size: 12px; color: #1B355A; line-height: 1.5;
  text-align: center;
}

.section-title {
  max-width: 480px; margin: 0 auto 8px;
  padding: 0 16px; font-size: 14px; font-weight: 700; color: #1B355A;
}

.point-card {
  max-width: 480px; margin: 0 auto 8px;
  background: #fff; border-radius: 12px; padding: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.point-header {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 8px;
}
.point-name { font-size: 15px; font-weight: 700; color: #1B355A; }
.point-desc { font-size: 11px; color: #aaa; }

.latest-row { margin-bottom: 8px; }
.latest-tag {
  display: inline-block; font-size: 10px; color: #4D9BC6;
  background: #E8F0FE; padding: 2px 8px; border-radius: 4px;
}

.metric-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 8px; margin-bottom: 10px;
}
.metric-cell {
  background: #f8fafc; border-radius: 8px; padding: 8px 6px;
  text-align: center;
}
.metric-label { font-size: 10px; color: #888; margin-bottom: 2px; }
.metric-value { font-size: 16px; font-weight: 700; color: #1B355A; }
.metric-value small { font-size: 10px; font-weight: 400; color: #aaa; }
.metric-sub { font-size: 10px; color: #aaa; margin-top: 2px; }

.avg-row {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
  padding: 8px; background: #f0f4f8; border-radius: 8px;
  margin-bottom: 8px;
}
.avg-tag {
  font-size: 10px; font-weight: 700; color: #4D9BC6;
  background: #E8F0FE; padding: 2px 6px; border-radius: 4px;
}
.avg-item { font-size: 11px; color: #555; }

.mini-chart { margin-top: 8px; }
.mini-chart-title { font-size: 11px; color: #666; margin-bottom: 4px; }
.bar-chart {
  display: flex; align-items: flex-end; gap: 2px;
  height: 50px; background: #f8fafc; border-radius: 6px; padding: 4px;
}
.bar-wrap { flex: 1; display: flex; align-items: flex-end; height: 100%; }
.bar {
  width: 100%; min-height: 2px; border-radius: 2px 2px 0 0;
  transition: height 0.3s;
}
.precip-bar { background: linear-gradient(180deg, #3B82F6, #06B6D4); }
.bar-empty { width: 100%; height: 2px; background: #e0e0e0; border-radius: 2px; }
.chart-dates {
  display: flex; justify-content: space-between;
  font-size: 9px; color: #aaa; margin-top: 2px;
}

.help-section {
  max-width: 480px; margin: 20px auto 0;
  padding: 14px; background: #fff; border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.help-title { font-size: 13px; font-weight: 700; color: #1B355A; margin-bottom: 8px; }
.help-item { font-size: 12px; color: #555; line-height: 1.6; }
.help-note { font-size: 11px; color: #F97316; margin-top: 6px; }
</style>
