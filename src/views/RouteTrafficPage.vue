<template>
  <div class="route-traffic-page">
    <nav class="page-nav">
      <button class="btn-back" @click="goBack">← 홈</button>
      <h1 class="nav-title">🛣️ 노선별 교통량 분석</h1>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 노선 선택 -->
    <div class="route-selector">
      <label class="selector-label">고속도로 노선 선택</label>
      <div class="route-chips">
        <button v-for="r in routes" :key="r.code"
          :class="['route-chip', { active: selectedRoute === r.code }]"
          @click="selectRoute(r.code)">
          <span class="chip-name">{{ r.name }}</span>
          <span class="chip-desc">{{ r.desc }}</span>
        </button>
      </div>
    </div>

    <!-- 호출 시각 -->
    <div v-if="fetchedAt" class="update-info">
      🕐 호출시각: {{ fetchedAt }} | 집계일: {{ sumDate }}
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>노선별 교통량 데이터를 불러오는 중… (수만 건 처리)</p>
    </div>

    <!-- 에러 -->
    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <div class="error-title">데이터를 불러올 수 없습니다</div>
        <div class="error-desc">{{ error }}</div>
      </div>
    </div>

    <template v-if="!loading && !error && units.length > 0">
      <!-- 요약 카드 -->
      <div class="summary-cards">
        <div class="summary-card total">
          <div class="summary-label">총 교통량</div>
          <div class="summary-value">{{ formatNum(grandTotal) }}</div>
        </div>
        <div class="summary-card in">
          <div class="summary-label">📥 진입</div>
          <div class="summary-value">{{ formatNum(totalIn) }}</div>
        </div>
        <div class="summary-card out">
          <div class="summary-label">📤 진출</div>
          <div class="summary-value">{{ formatNum(totalOut) }}</div>
        </div>
        <div class="summary-card gates">
          <div class="summary-label">🚂 영업소</div>
          <div class="summary-value">{{ units.length }}곳</div>
        </div>
      </div>

      <!-- 차종별 분포 -->
      <div class="section">
        <h3 class="section-title">🚗 차종별 분포</h3>
        <div class="car-type-list">
          <div v-for="ct in carTypeStats" :key="ct.type" class="car-type-row">
            <span class="ct-emoji">{{ ct.emoji }}</span>
            <div class="ct-info">
              <div class="ct-top">
                <span class="ct-label">{{ ct.label }}</span>
                <span class="ct-num">{{ formatNum(ct.count) }}대</span>
              </div>
              <div class="ct-bar-track">
                <div class="ct-bar-fill" :style="{ width: ct.percent + '%', background: ct.color }"></div>
              </div>
              <div class="ct-pct">{{ ct.share }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 시간대별 패턴 -->
      <div class="section">
        <h3 class="section-title">⏰ 시간대별 교통량</h3>
        <div class="time-chart">
          <div v-for="(h, idx) in hourlyChart" :key="idx" class="time-bar-wrap">
            <div class="time-bar-col">
              <div class="time-bar" :style="{ height: h.heightPercent + '%', background: h.isPeak ? '#EF4444' : h.isRush ? '#F97316' : '#4D9BC6' }">
                <span v-if="h.heightPercent > 30" class="time-bar-val">{{ formatNum(h.total) }}</span>
              </div>
            </div>
            <span class="time-label">{{ h.label }}</span>
          </div>
        </div>
        <div class="time-legend">
          <span class="legend-item"><span class="legend-dot" style="background:#EF4444"></span> 최고峰</span>
          <span class="legend-item"><span class="legend-dot" style="background:#F97316"></span> 러시위크</span>
          <span class="legend-item"><span class="legend-dot" style="background:#4D9BC6"></span> 일반</span>
        </div>
      </div>

      <!-- 영업소별 교통량 -->
      <div class="section">
        <h3 class="section-title">🏢 영업소별 교통량 (Top 20)</h3>
        <div class="unit-list">
          <div v-for="(u, idx) in topUnits" :key="u.name" class="unit-card">
            <div class="unit-rank">#{{ idx + 1 }}</div>
            <div class="unit-body">
              <div class="unit-header">
                <span class="unit-name">{{ u.name }}</span>
                <span class="unit-total">{{ formatNum(u.totalIn + u.totalOut) }}대</span>
              </div>
              <div class="unit-stats">
                <span class="us in">📥 {{ formatNum(u.totalIn) }}</span>
                <span class="us out">📤 {{ formatNum(u.totalOut) }}</span>
              </div>
              <div class="unit-bar-track">
                <div class="unit-bar-fill" :style="{ width: u.barPercent + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TCS 유형별 -->
      <div class="section">
        <h3 class="section-title">🎫 하이패스 vs 일반</h3>
        <div class="tcs-cards">
          <div class="tcs-card hipass">
            <div class="tcs-emoji">⚡</div>
            <div class="tcs-label">하이패스</div>
            <div class="tcs-value">{{ formatNum(hipassTotal) }}</div>
            <div class="tcs-share">{{ hipassShare }}%</div>
          </div>
          <div class="tcs-card general">
            <div class="tcs-emoji">🚗</div>
            <div class="tcs-label">일반</div>
            <div class="tcs-value">{{ formatNum(generalTotal) }}</div>
            <div class="tcs-share">{{ 100 - hipassShare }}%</div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="!loading && !error && units.length === 0 && selectedRoute" class="empty-state">
      <div class="empty-icon">📭</div>
      <p>해당 노선의 데이터가 없습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { HIGHWAY_ROUTES, CAR_TYPE_MAP, fetchTrafficRoute } from '../lib/api.js'

const router = useRouter()
function goBack() { router.push('/') }

const loading = ref(false)
const error = ref('')
const rawData = ref([])
const selectedRoute = ref('001')
const fetchedAt = ref('')

const routes = HIGHWAY_ROUTES

function selectRoute(code) {
  if (selectedRoute.value === code || loading.value) return
  selectedRoute.value = code
  fetchData()
}

// 데이터 집계
const units = computed(() => {
  const map = new Map()
  for (const t of rawData.value) {
    const key = (t.unitName || '').trim()
    if (!key) continue
    if (!map.has(key)) {
      map.set(key, { name: key, totalIn: 0, totalOut: 0, carTypes: {} })
    }
    const u = map.get(key)
    const amt = parseInt(t.trafficAmout) || 0
    if (t.inoutType === '0') u.totalIn += amt
    else u.totalOut += amt
    const ct = t.carType || '0'
    if (!u.carTypes[ct]) u.carTypes[ct] = 0
    u.carTypes[ct] += amt
  }
  const arr = Array.from(map.values())
  arr.sort((a, b) => (b.totalIn + b.totalOut) - (a.totalIn + a.totalOut))
  // bar percent
  const maxTotal = Math.max(...arr.map(u => u.totalIn + u.totalOut), 1)
  arr.forEach(u => { u.barPercent = Math.round(((u.totalIn + u.totalOut) / maxTotal) * 100) })
  return arr
})

const topUnits = computed(() => units.value.slice(0, 20))

const grandTotal = computed(() => units.value.reduce((s, u) => s + u.totalIn + u.totalOut, 0))
const totalIn = computed(() => units.value.reduce((s, u) => s + u.totalIn, 0))
const totalOut = computed(() => units.value.reduce((s, u) => s + u.totalOut, 0))

// 차종별 통계
const carTypeStats = computed(() => {
  const totals = {}
  for (const u of units.value) {
    for (const [type, count] of Object.entries(u.carTypes)) {
      if (!totals[type]) totals[type] = 0
      totals[type] += count
    }
  }
  const grand = Object.values(totals).reduce((s, v) => s + v, 0) || 1
  const maxCount = Math.max(...Object.values(totals), 1)
  return Object.entries(totals)
    .map(([type, count]) => {
      const meta = CAR_TYPE_MAP[type] || { label: `${type}종`, emoji: '🚗', color: '#888' }
      return {
        type,
        label: meta.label,
        emoji: meta.emoji,
        color: meta.color,
        count,
        percent: Math.round((count / maxCount) * 100),
        share: ((count / grand) * 100).toFixed(1),
      }
    })
    .sort((a, b) => b.count - a.count)
})

// 시간대별 집계
const hourlyChart = computed(() => {
  const hourly = new Array(24).fill(0).map((_, i) => ({ hour: i, total: 0 }))
  for (const t of rawData.value) {
    const tm = String(t.sumTm || '').padStart(4, '0')
    const h = parseInt(tm.slice(0, 2))
    if (h >= 0 && h < 24) {
      hourly[h].total += parseInt(t.trafficAmout) || 0
    }
  }
  const maxTotal = Math.max(...hourly.map(h => h.total), 1)
  const sorted = [...hourly].sort((a, b) => b.total - a.total)
  const peakHour = sorted[0].hour
  const peakThreshold = sorted[4].total // top 5 threshold

  return hourly.map(h => ({
    label: String(h.hour).padStart(2, '0'),
    total: h.total,
    heightPercent: Math.max(2, Math.round((h.total / maxTotal) * 100)),
    isPeak: h.hour === peakHour,
    isRush: h.total >= peakThreshold && h.hour !== peakHour,
  }))
})

// TCS 유형별
const hipassTotal = computed(() => rawData.value
  .filter(t => t.tcsType === '2')
  .reduce((s, t) => s + (parseInt(t.trafficAmout) || 0), 0))
const generalTotal = computed(() => rawData.value
  .filter(t => t.tcsType === '1')
  .reduce((s, t) => s + (parseInt(t.trafficAmout) || 0), 0))
const hipassShare = computed(() => {
  const total = hipassTotal.value + generalTotal.value
  if (!total) return 0
  return Math.round((hipassTotal.value / total) * 100)
})

const sumDate = computed(() => {
  if (rawData.value.length === 0) return ''
  const d = rawData.value[0].sumDate
  if (!d) return ''
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
})

function formatNum(n) {
  if (!n && n !== 0) return '-'
  return Number(n).toLocaleString('ko-KR')
}

async function fetchData() {
  loading.value = true
  error.value = ''
  rawData.value = []
  try {
    const data = await fetchTrafficRoute(selectedRoute.value)
    rawData.value = (data.list || []).map(t => ({
      ...t,
      unitName: (t.unitName || '').trim(),
      trafficAmout: String(t.trafficAmout || '0'),
    }))
    fetchedAt.value = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch (e) {
    error.value = e.message || '데이터 조회 실패'
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchData())
</script>

<style scoped>
.route-traffic-page {
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: 40px;
}

.page-nav {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #1B355A;
  color: #fff;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.btn-back {
  background: none; border: none;
  color: #4D9BC6;
  font-size: 14px; font-weight: 600;
  cursor: pointer;
}
.nav-title { margin: 0; font-size: 15px; font-weight: 700; }
.nav-spacer { flex: 1; }

.route-selector { padding: 12px; background: #fff; border-bottom: 1px solid #eee; }
.selector-label { font-size: 11px; font-weight: 700; color: #888; display: block; margin-bottom: 8px; }
.route-chips {
  display: flex; gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
}
.route-chip {
  display: flex; flex-direction: column; align-items: center;
  background: #f5f5f5; border: 1px solid transparent;
  border-radius: 10px; padding: 8px 14px;
  cursor: pointer; white-space: nowrap; min-width: 80px;
  transition: all 0.15s;
}
.route-chip.active {
  background: #1B355A; color: #fff;
  border-color: #4D9BC6;
}
.chip-name { font-size: 13px; font-weight: 700; }
.chip-desc { font-size: 9px; opacity: 0.7; margin-top: 2px; }

.update-info {
  text-align: center; padding: 8px;
  font-size: 12px; color: #888;
  background: #FFFBEB;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px; padding: 12px;
}
.summary-card {
  border-radius: 12px; padding: 14px 10px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.summary-card.total { background: #1B355A; color: #fff; }
.summary-card.in { background: #DBEAFE; }
.summary-card.out { background: #FEF3C7; }
.summary-card.gates { background: #F0FDF4; }
.summary-label { font-size: 11px; font-weight: 600; opacity: 0.8; }
.summary-value { font-size: 22px; font-weight: 800; margin-top: 2px; }

.loading { text-align: center; padding: 60px 20px; color: #888; }
.spinner {
  width: 32px; height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #1B355A;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-box {
  margin: 20px 16px;
  background: #FEF3C7;
  border: 1px solid #F59E0B;
  border-radius: 12px;
  padding: 16px;
  display: flex; gap: 12px; align-items: flex-start;
}
.error-icon { font-size: 24px; flex-shrink: 0; }
.error-title { font-weight: 700; color: #92400E; font-size: 14px; }
.error-desc { font-size: 12px; color: #92400E; margin-top: 4px; }

.section { padding: 16px 12px 0; }
.section-title { font-size: 15px; font-weight: 700; color: #1B355A; margin-bottom: 12px; }

/* 차종별 */
.car-type-list { display: flex; flex-direction: column; gap: 8px; }
.car-type-row {
  background: #fff; border-radius: 12px; padding: 10px 12px;
  display: flex; gap: 10px; align-items: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.ct-emoji { font-size: 22px; flex-shrink: 0; }
.ct-info { flex: 1; min-width: 0; }
.ct-top { display: flex; justify-content: space-between; }
.ct-label { font-size: 12px; font-weight: 600; color: #555; }
.ct-num { font-size: 12px; font-weight: 700; color: #1B355A; }
.ct-bar-track { height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; margin: 4px 0 2px; }
.ct-bar-fill { height: 100%; border-radius: 4px; }
.ct-pct { font-size: 10px; color: #aaa; }

/* 시간대 차트 */
.time-chart {
  display: flex; gap: 2px; align-items: flex-end;
  height: 140px; background: #fff;
  border-radius: 12px; padding: 12px 8px 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  overflow-x: auto;
}
.time-bar-wrap {
  display: flex; flex-direction: column;
  align-items: center; flex: 1;
  min-width: 16px;
}
.time-bar-col {
  flex: 1; width: 100%;
  display: flex; align-items: flex-end;
  justify-content: center;
}
.time-bar {
  width: 70%; min-height: 2px;
  border-radius: 3px 3px 0 0;
  position: relative;
  display: flex; align-items: flex-start; justify-content: center;
}
.time-bar-val {
  font-size: 8px; font-weight: 700; color: #fff;
  margin-top: 2px;
}
.time-label { font-size: 8px; color: #aaa; margin-top: 2px; }
.time-legend {
  display: flex; gap: 12px; justify-content: center;
  margin-top: 8px;
}
.legend-item { font-size: 10px; color: #888; display: flex; align-items: center; gap: 4px; }
.legend-dot { width: 8px; height: 8px; border-radius: 2px; }

/* 영업소별 */
.unit-list { display: flex; flex-direction: column; gap: 6px; }
.unit-card {
  background: #fff; border-radius: 12px;
  padding: 10px 12px;
  display: flex; gap: 10px; align-items: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.unit-rank {
  font-size: 14px; font-weight: 800; color: #4D9BC6;
  min-width: 28px;
}
.unit-body { flex: 1; min-width: 0; }
.unit-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.unit-name { font-size: 14px; font-weight: 700; color: #1B355A; }
.unit-total { font-size: 13px; font-weight: 800; color: #1B355A; }
.unit-stats { display: flex; gap: 10px; margin-bottom: 4px; }
.us { font-size: 11px; font-weight: 600; }
.us.in { color: #2563EB; }
.us.out { color: #D97706; }
.unit-bar-track { height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.unit-bar-fill { height: 100%; background: linear-gradient(90deg, #4D9BC6, #1B355A); border-radius: 3px; }

/* TCS */
.tcs-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tcs-card {
  border-radius: 14px; padding: 16px 12px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.tcs-card.hipass { background: linear-gradient(135deg, #DBEAFE, #EFF6FF); }
.tcs-card.general { background: linear-gradient(135deg, #FEF3C7, #FFFBEB); }
.tcs-emoji { font-size: 28px; }
.tcs-label { font-size: 12px; font-weight: 700; color: #666; margin-top: 4px; }
.tcs-value { font-size: 24px; font-weight: 800; color: #1B355A; margin-top: 4px; }
.tcs-share { font-size: 12px; font-weight: 600; color: #888; }

.empty-state { text-align: center; padding: 60px 20px; color: #aaa; }
.empty-icon { font-size: 48px; }
</style>
