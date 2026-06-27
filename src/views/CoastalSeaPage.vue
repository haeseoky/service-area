<template>
  <div class="sea-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <h1 class="nav-title">🌊 해안 고속도로 해상정보</h1>
      <span class="nav-spacer"></span>
    </nav>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>해안 도로 해상 정보를 불러오는 중…</p>
    </div>

    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <div class="error-title">해상 정보를 불러올 수 없습니다</div>
        <div class="error-desc">{{ error }}</div>
      </div>
    </div>

    <template v-if="!loading && !error">
      <!-- 요약 바 -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-num">{{ calmAreas }}</span>
          <span class="summary-label">잔잔한 해역</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ avgWave }}m</span>
          <span class="summary-label">평균 파고</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ maxWave }}m</span>
          <span class="summary-label">최대 파고</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ avgSeaTemp }}°</span>
          <span class="summary-label">평균 수온</span>
        </div>
      </div>

      <!-- 해역별 필터 -->
      <div class="region-filter">
        <button
          v-for="r in regions"
          :key="r"
          class="region-btn"
          :class="{ active: selectedRegion === r }"
          @click="selectedRegion = r"
        >{{ r }}</button>
      </div>

      <!-- 해상 정보 카드 리스트 -->
      <div class="sea-list">
        <div
          v-for="s in filteredPoints"
          :key="s.name"
          class="sea-card"
          :class="riskClass(s)"
        >
          <div class="s-header">
            <div class="s-name-block">
              <span class="s-name">{{ s.name }}</span>
              <span class="s-desc">{{ s.desc }}</span>
            </div>
            <div class="s-risk-badge" :style="{ background: getSeaRiskLevel(s).color }">
              <span class="s-risk-emoji">{{ getSeaRiskLevel(s).emoji }}</span>
              <span class="s-risk-label">{{ getSeaRiskLevel(s).label }}</span>
            </div>
          </div>

          <div class="s-metrics">
            <div class="metric">
              <span class="metric-icon">🌊</span>
              <span class="metric-label">파고</span>
              <span class="metric-val" :style="{ color: getWaveGrade(s.waveHeight).color }">
                {{ s.waveHeight != null ? s.waveHeight + 'm' : '-' }}
              </span>
              <span class="metric-sub">{{ getWaveGrade(s.waveHeight).label }}</span>
            </div>
            <div class="metric">
              <span class="metric-icon">🌀</span>
              <span class="metric-label">너울</span>
              <span class="metric-val" :style="{ color: getSwellGrade(s.swellWave).color }">
                {{ s.swellWave != null ? s.swellWave + 'm' : '-' }}
              </span>
              <span class="metric-sub">{{ getSwellGrade(s.swellWave).label }}</span>
            </div>
            <div class="metric">
              <span class="metric-icon">⏱️</span>
              <span class="metric-label">주기</span>
              <span class="metric-val">{{ s.wavePeriod != null ? s.wavePeriod + 's' : '-' }}</span>
              <span class="metric-sub">{{ getWaveDirectionText(s.waveDir) }}</span>
            </div>
            <div class="metric">
              <span class="metric-icon">🌡️</span>
              <span class="metric-label">수온</span>
              <span class="metric-val" :style="{ color: getSeaTempGrade(s.seaTemp).color }">
                {{ s.seaTemp != null ? s.seaTemp + '°' : '-' }}
              </span>
              <span class="metric-sub">{{ getSeaTempGrade(s.seaTemp).label }}</span>
            </div>
          </div>

          <!-- 위험 요소 -->
          <div v-if="getSeaRiskLevel(s).risks.length > 0" class="s-risks">
            <div v-for="(r, i) in getSeaRiskLevel(s).risks" :key="i" class="risk-item">
              <span class="risk-icon">{{ r.icon }}</span>
              <span class="risk-msg">{{ r.msg }}</span>
            </div>
          </div>

          <!-- 안전 점수 바 -->
          <div class="s-score-bar">
            <div class="score-track">
              <div
                class="score-fill"
                :style="{ width: getSeaRiskLevel(s).score + '%', background: getSeaRiskLevel(s).color }"
              ></div>
            </div>
            <span class="score-val">안전점수 {{ getSeaRiskLevel(s).score }}/100</span>
          </div>
        </div>
      </div>

      <!-- 호출 시각 -->
      <div class="fetched-at">
        📡 조회시각: {{ fetchedAt }}
      </div>

      <!-- 데이터 출처 -->
      <div class="data-source">
        데이터 출처: Open-Meteo Marine API
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchCoastalSea, getWaveGrade, getSwellGrade, getSeaRiskLevel, getWaveDirectionText, getSeaTempGrade } from '../lib/api.js'

const loading = ref(true)
const error = ref(null)
const seaData = ref([])
const fetchedAt = ref('')
const selectedRegion = ref('전체')

const regions = ['전체', '동해', '서해', '남해']

const filteredPoints = computed(() => {
  if (selectedRegion.value === '전체') return seaData.value
  return seaData.value.filter(p => p.region === selectedRegion.value)
})

const calmAreas = computed(() => seaData.value.filter(s => s.waveHeight != null && s.waveHeight < 0.8).length)
const avgWave = computed(() => {
  const valid = seaData.value.filter(s => s.waveHeight != null)
  if (!valid.length) return '-'
  return (valid.reduce((a, b) => a + b.waveHeight, 0) / valid.length).toFixed(2)
})
const maxWave = computed(() => {
  const valid = seaData.value.filter(s => s.waveHeight != null)
  if (!valid.length) return '-'
  return Math.max(...valid.map(s => s.waveHeight)).toFixed(2)
})
const avgSeaTemp = computed(() => {
  const valid = seaData.value.filter(s => s.seaTemp != null)
  if (!valid.length) return '-'
  return (valid.reduce((a, b) => a + b.seaTemp, 0) / valid.length).toFixed(1)
})

function riskClass(s) {
  const lvl = getSeaRiskLevel(s)
  return 'risk-' + lvl.level
}

onMounted(async () => {
  try {
    const data = await fetchCoastalSea()
    seaData.value = data
    fetchedAt.value = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.sea-page {
  min-height: 100dvh;
  background: linear-gradient(180deg, #0D2847 0%, #164863 25%, #f0f6fa 25%);
  padding-bottom: 40px;
}

.page-nav {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: rgba(0,0,0,0.2);
  backdrop-filter: blur(10px);
}
.btn-back {
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.nav-title { margin: 0; color: #fff; font-size: 16px; font-weight: 700; margin-left: 12px; }
.nav-spacer { flex: 1; }

.loading {
  text-align: center;
  padding: 80px 20px;
  color: #666;
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #0D2847;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 20px;
  padding: 16px;
  background: #FEF2F2;
  border-radius: 12px;
  border-left: 4px solid #EF4444;
}
.error-icon { font-size: 24px; }
.error-title { font-weight: 700; color: #991B1B; }
.error-desc { font-size: 13px; color: #888; margin-top: 2px; }

.summary-bar {
  display: flex;
  justify-content: space-around;
  margin: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.summary-item { text-align: center; }
.summary-num { display: block; font-size: 22px; font-weight: 800; color: #0D2847; }
.summary-label { font-size: 11px; color: #888; }

.region-filter {
  display: flex;
  gap: 8px;
  padding: 0 16px;
  margin-bottom: 12px;
}
.region-btn {
  flex: 1;
  padding: 8px;
  border: 1.5px solid #ddd;
  background: #fff;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
}
.region-btn.active {
  border-color: #0D2847;
  background: #0D2847;
  color: #fff;
}

.sea-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 16px;
}

.sea-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border-left: 4px solid #22C55E;
}
.sea-card.risk-caution { border-left-color: #EAB308; }
.sea-card.risk-warning { border-left-color: #F97316; }
.sea-card.risk-danger { border-left-color: #EF4444; }
.sea-card.risk-unknown { border-left-color: #ccc; }

.s-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}
.s-name { font-size: 15px; font-weight: 700; color: #1B355A; }
.s-desc { font-size: 11px; color: #aaa; }
.s-risk-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 8px;
}
.s-risk-emoji { font-size: 14px; }
.s-risk-label { font-size: 11px; font-weight: 700; color: #fff; }

.s-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}
.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  background: #f8fafc;
  border-radius: 8px;
}
.metric-icon { font-size: 18px; }
.metric-label { font-size: 10px; color: #aaa; }
.metric-val { font-size: 16px; font-weight: 700; }
.metric-sub { font-size: 10px; color: #aaa; }

.s-risks {
  margin-bottom: 8px;
  padding: 8px 10px;
  background: #FEF3C7;
  border-radius: 8px;
}
.risk-item {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: #92400E;
  padding: 2px 0;
}
.risk-icon { font-size: 14px; }

.s-score-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.score-track {
  flex: 1;
  height: 6px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
}
.score-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.score-val { font-size: 11px; color: #888; white-space: nowrap; }

.fetched-at {
  text-align: center;
  margin: 24px 0 8px;
  font-size: 12px;
  color: #888;
}
.data-source {
  text-align: center;
  font-size: 11px;
  color: #bbb;
}
</style>
