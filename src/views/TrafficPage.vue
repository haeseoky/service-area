<template>
  <div class="traffic-page">
    <nav class="page-nav">
      <button class="btn-back" @click="goBack">← 홈</button>
      <span class="nav-title">📊 수도권 관문 교통량</span>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 요약 + 관문별 탭 -->
    <div class="gate-tabs">
      <button v-for="g in gateList" :key="g.name"
        :class="['gate-tab', { active: selectedGate === g.name }]"
        @click="selectedGate = g.name">
        <span class="gate-emoji">{{ g.emoji }}</span>
        <span class="gate-text">{{ g.name }}</span>
      </button>
    </div>

    <!-- 집계 시간 -->
    <div v-if="lastUpdated" class="update-info">
      🕐 집계시각: {{ lastUpdated }} (15분 단위)
    </div>

    <!-- 요약 카드 -->
    <div v-if="!loading && aggregated.length > 0" class="summary-cards">
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
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>교통량 데이터를 불러오는 중…</p>
    </div>

    <!-- 에러 -->
    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <div class="error-title">데이터를 불러올 수 없습니다</div>
        <div class="error-desc">{{ error }}</div>
      </div>
    </div>

    <!-- 관문별 교통량 카드 -->
    <div v-if="!loading && aggregated.length > 0" class="gate-cards">
      <div v-for="agg in aggregated" :key="agg.unitName" class="gate-card">
        <div class="gate-card-header">
          <span class="gate-card-name">{{ agg.unitName }}</span>
          <span class="gate-card-type">{{ agg.exDivName }}</span>
        </div>
        <div class="gate-card-body">
          <div class="gate-stat">
            <span class="stat-label">📥 진입</span>
            <span class="stat-value">{{ formatNum(agg.totalIn) }}</span>
          </div>
          <div class="gate-stat">
            <span class="stat-label">📤 진출</span>
            <span class="stat-value">{{ formatNum(agg.totalOut) }}</span>
          </div>
          <div class="gate-stat total">
            <span class="stat-label">합계</span>
            <span class="stat-value">{{ formatNum(agg.totalIn + agg.totalOut) }}</span>
          </div>
        </div>
        <!-- 차종별 바 -->
        <div class="car-type-bars">
          <div class="bar-row" v-for="ct in agg.carTypes" :key="ct.type">
            <span class="bar-label">{{ ct.label }}</span>
            <div class="bar-track">
              <div class="bar-fill-sm" :style="{ width: ct.percent + '%' }"></div>
            </div>
            <span class="bar-num">{{ formatNum(ct.count) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 상세 리스트 -->
    <div v-if="!loading && filtered.length > 0" class="detail-section">
      <h3 class="section-title">📋 상세 데이터</h3>
      <div class="data-list">
        <div v-for="(item, idx) in pagedData" :key="idx" class="data-row">
          <div class="row-main">
            <span class="row-gate">{{ item.unitName }}</span>
            <span class="row-type">{{ item.exDivName }}</span>
            <span class="row-dir" :class="item.inoutName === '입구' ? 'in' : 'out'">{{ item.inoutName }}</span>
            <span class="row-tcs">{{ item.tcsName }}</span>
          </div>
          <div class="row-meta">
            <span>🚗 {{ carLabel(item.carType) }}</span>
            <span class="row-vol">{{ formatNum(item.trafficAmout) }}대</span>
            <span class="row-time">{{ formatTime(item.sumTm) }}</span>
          </div>
        </div>
      </div>
      <div class="pagination">
        <button :disabled="page === 1" @click="page--">‹ 이전</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button :disabled="page >= totalPages" @click="page++">다음 ›</button>
      </div>
    </div>

    <div v-if="!loading && !error && filtered.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <p>데이터가 없습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
function goBack() { router.push('/') }

const API_URL = 'https://data.ex.co.kr/openapi/trafficapi/trafficFive'
const API_KEY = '0105398808'

const loading = ref(false)
const error = ref('')
const rawData = ref([])
const selectedGate = ref('')
const page = ref(1)
const pageSize = 20

const gateList = [
  { name: '', emoji: '🌐', label: '전체' },
  { name: '서울', emoji: '🏙️' },
  { name: '서서울', emoji: '🏢' },
  { name: '동서울', emoji: '🌅' },
  { name: '군자', emoji: '📍' },
  { name: '남양주', emoji: '🌲' },
  { name: '서시흥', emoji: '🌆' },
]

const carTypeMap = {
  '1': { label: '1종(승용차)', short: '승용차' },
  '2': { label: '2종(중형승용)', short: '중형' },
  '3': { label: '3종(대형승용)', short: '대형' },
  '4': { label: '4종(소형화물)', short: '소화물' },
  '5': { label: '5종(대형화물)', short: '대화물' },
  '6': { label: '6종(특수차량)', short: '특수' },
  '7': { label: '7종(영업용)', short: '영업용' },
  '8': { label: '8종(기타)', short: '기타' },
}

function carLabel(code) {
  return carTypeMap[code]?.short || `${code}종`
}

const filtered = computed(() => {
  if (!selectedGate.value) return rawData.value
  return rawData.value.filter(i => i.unitName === selectedGate.value)
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))

const lastUpdated = computed(() => {
  if (rawData.value.length === 0) return ''
  const latest = rawData.value[0]
  if (!latest.sumDate || !latest.sumTm) return ''
  const d = latest.sumDate
  const t = latest.sumTm.padStart(4, '0')
  return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)} ${t.slice(0,2)}:${t.slice(2,4)}`
})

// 관문별 집계
const aggregated = computed(() => {
  const map = new Map()
  for (const item of filtered.value) {
    const key = item.unitName
    if (!map.has(key)) {
      map.set(key, {
        unitName: key,
        exDivName: item.exDivName,
        unitCode: item.unitCode,
        totalIn: 0,
        totalOut: 0,
        carTypes: {},
      })
    }
    const agg = map.get(key)
    const vol = parseInt(item.trafficAmout || '0', 10)
    if (item.inoutName === '입구') agg.totalIn += vol
    else agg.totalOut += vol
    const ct = item.carType || '0'
    if (!agg.carTypes[ct]) agg.carTypes[ct] = 0
    agg.carTypes[ct] += vol
  }
  const result = Array.from(map.values())
  // 차종별 바 퍼센트 계산
  for (const agg of result) {
    const carEntries = Object.entries(agg.carTypes)
      .map(([type, count]) => ({
        type,
        label: carTypeMap[type]?.short || `${type}종`,
        count,
      }))
      .sort((a, b) => b.count - a.count)
    const maxCar = Math.max(...carEntries.map(c => c.count), 1)
    carEntries.forEach(c => c.percent = Math.round((c.count / maxCar) * 100))
    agg.carTypes = carEntries.slice(0, 6) // 상위 6개
  }
  return result
})

const grandTotal = computed(() => aggregated.value.reduce((s, a) => s + a.totalIn + a.totalOut, 0))
const totalIn = computed(() => aggregated.value.reduce((s, a) => s + a.totalIn, 0))
const totalOut = computed(() => aggregated.value.reduce((s, a) => s + a.totalOut, 0))

function formatNum(n) {
  if (!n && n !== 0) return '-'
  return Number(n).toLocaleString('ko-KR')
}

function formatTime(tm) {
  if (!tm) return ''
  const t = String(tm).padStart(4, '0')
  return `${t.slice(0,2)}:${t.slice(2,4)}`
}

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({
      key: API_KEY,
      type: 'json',
    })
    const res = await fetch(`${API_URL}?${params}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (data.code && data.code !== 'INFO-000' && data.code !== 'Success') {
      throw new Error(data.message || `API 코드: ${data.code}`)
    }
    const list = data.trafficFive || data.list || []
    rawData.value = list.map(i => ({
      unitName: (i.unitName || '').trim(),
      unitCode: (i.unitCode || '').trim(),
      exDivCode: i.exDivCode || '',
      exDivName: i.exDivName || '',
      inoutType: i.inoutType || '',
      inoutName: i.inoutName || '',
      tcsType: i.tcsType || '',
      tcsName: i.tcsName || '',
      carType: i.carType || '',
      trafficAmout: parseInt(i.trafficAmout || '0', 10),
      sumTm: i.sumTm || '',
      sumDate: i.sumDate || '',
    }))
    page.value = 1
  } catch (e) {
    error.value = e.message || '데이터 조회 실패'
    rawData.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchData())
</script>

<style scoped>
.traffic-page {
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
.nav-title { font-size: 15px; font-weight: 700; }
.nav-spacer { flex: 1; }

.gate-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 12px;
  overflow-x: auto;
  background: #fff;
  border-bottom: 1px solid #eee;
  -webkit-overflow-scrolling: touch;
}
.gate-tab {
  display: flex; flex-direction: column; align-items: center;
  background: #f5f5f5; border: none;
  border-radius: 10px; padding: 8px 12px;
  font-size: 12px; font-weight: 600; color: #666;
  cursor: pointer; white-space: nowrap;
  min-width: 52px;
  transition: all 0.15s;
}
.gate-tab.active { background: #1B355A; color: #fff; }
.gate-emoji { font-size: 18px; margin-bottom: 2px; }

.update-info {
  text-align: center;
  padding: 8px;
  font-size: 12px;
  color: #888;
  background: #FFFBEB;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 12px;
}
.summary-card {
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.summary-card.total { background: #1B355A; color: #fff; }
.summary-card.in { background: #DBEAFE; }
.summary-card.out { background: #FEF3C7; }
.summary-label { font-size: 10px; font-weight: 600; opacity: 0.8; }
.summary-value { font-size: 20px; font-weight: 800; margin-top: 2px; }

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

.gate-cards { padding: 0 12px; display: flex; flex-direction: column; gap: 10px; }
.gate-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.gate-card-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.gate-card-name { font-size: 16px; font-weight: 800; color: #1B355A; }
.gate-card-type { font-size: 10px; font-weight: 600; color: #888; background: #f0f0f0; padding: 2px 8px; border-radius: 6px; }
.gate-card-body { display: flex; gap: 12px; margin-bottom: 12px; }
.gate-stat { display: flex; flex-direction: column; }
.gate-stat.total { margin-left: auto; text-align: right; }
.stat-label { font-size: 11px; color: #888; font-weight: 600; }
.stat-value { font-size: 17px; font-weight: 700; color: #1B355A; }

.car-type-bars { display: flex; flex-direction: column; gap: 4px; }
.bar-row { display: flex; align-items: center; gap: 6px; }
.bar-label { font-size: 10px; color: #888; width: 40px; text-align: right; }
.bar-track { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.bar-fill-sm { height: 100%; background: linear-gradient(90deg, #4D9BC6, #1B355A); border-radius: 4px; }
.bar-num { font-size: 10px; font-weight: 600; color: #666; min-width: 32px; }

.detail-section { padding: 16px 12px; }
.section-title { font-size: 15px; font-weight: 700; color: #1B355A; margin-bottom: 12px; }
.data-list { display: flex; flex-direction: column; gap: 6px; }
.data-row {
  background: #fff; border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.row-main { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap; }
.row-gate { font-size: 13px; font-weight: 700; color: #1B355A; }
.row-type { font-size: 10px; color: #aaa; }
.row-dir { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.row-dir.in { background: #DBEAFE; color: #1E40AF; }
.row-dir.out { background: #FEF3C7; color: #92400E; }
.row-tcs { font-size: 10px; color: #888; background: #f5f5f5; padding: 1px 6px; border-radius: 4px; }
.row-meta { display: flex; gap: 8px; font-size: 11px; color: #666; align-items: center; }
.row-vol { font-weight: 700; color: #1B355A; }
.row-time { margin-left: auto; color: #aaa; font-size: 10px; }

.pagination {
  display: flex; justify-content: center; align-items: center;
  gap: 12px; margin-top: 16px;
  font-size: 13px; color: #666;
}
.pagination button {
  background: #fff; border: 1px solid #ddd;
  border-radius: 8px; padding: 6px 14px;
  font-size: 13px; cursor: pointer;
}
.pagination button:disabled { opacity: 0.4; cursor: default; }

.empty-state { text-align: center; padding: 60px 20px; color: #aaa; }
.empty-icon { font-size: 48px; }
</style>
