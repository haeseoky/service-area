<template>
  <div class="traffic-page">
    <!-- 헤더 -->
    <nav class="page-nav">
      <button class="btn-back" @click="goBack">← 홈</button>
      <span class="nav-title">📊 수도권 관문 교통량</span>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 필터 -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>관문</label>
        <select v-model="selectedGate" class="filter-select">
          <option value="">전체</option>
          <option v-for="g in gates" :key="g" :value="g">{{ g }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>방향</label>
        <select v-model="selectedDir" class="filter-select">
          <option value="">전체</option>
          <option value="진입">진입</option>
          <option value="진출">진출</option>
        </select>
      </div>
      <button class="btn-refresh" @click="fetchData" :disabled="loading">
        {{ loading ? '조회 중…' : '🔄 새로고침' }}
      </button>
    </div>

    <!-- 요약 카드 -->
    <div v-if="!loading && filteredData.length > 0" class="summary-cards">
      <div class="summary-card">
        <div class="summary-label">총 통행량</div>
        <div class="summary-value">{{ formatNum(totalVolume) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">승용차</div>
        <div class="summary-value">{{ formatNum(totalCar) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">버스</div>
        <div class="summary-value">{{ formatNum(totalBus) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">화물차</div>
        <div class="summary-value">{{ formatNum(totalTruck) }}</div>
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

    <!-- 시간대별 차트 -->
    <div v-if="!loading && filteredData.length > 0" class="chart-section">
      <h3 class="section-title">🕐 시간대별 통행량</h3>
      <div class="bar-chart">
        <div v-for="item in hourlyChart" :key="item.hour" class="bar-item">
          <div class="bar-fill" :style="{ height: item.percent + '%' }"></div>
          <div class="bar-value">{{ formatNum(item.volume) }}</div>
          <div class="bar-label">{{ item.hour }}시</div>
        </div>
      </div>
    </div>

    <!-- 상세 테이블 -->
    <div v-if="!loading && filteredData.length > 0" class="table-section">
      <h3 class="section-title">📋 상세 정보</h3>
      <div class="data-list">
        <div v-for="(item, idx) in pagedData" :key="idx" class="data-row">
          <div class="row-main">
            <span class="row-gate">{{ item.gateNm }}</span>
            <span class="row-route">{{ item.routeNm }}</span>
            <span class="row-dir" :class="item.dirType === '진입' ? 'in' : 'out'">{{ item.dirType }}</span>
          </div>
          <div class="row-time">{{ item.ymd }} {{ item.hh }}시</div>
          <div class="row-volumes">
            <span class="vol-car">🚗 {{ formatNum(item.carVol) }}</span>
            <span class="vol-bus">🚌 {{ formatNum(item.busVol) }}</span>
            <span class="vol-truck">🚚 {{ formatNum(item.truckVol) }}</span>
            <span class="vol-total">{{ formatNum(item.totalVol) }}</span>
          </div>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div class="pagination">
        <button :disabled="page === 1" @click="page--">‹ 이전</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button :disabled="page >= totalPages" @click="page++">다음 ›</button>
      </div>
    </div>

    <!-- 데이터 없음 -->
    <div v-if="!loading && !error && filteredData.length === 0" class="empty-state">
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

// API config — ex.co.kr OpenAPI (수도권 관문 교통량)
// ⚠️ API 승인 후 엔드포인트 업데이트 필요
const API_URL = 'https://data.ex.co.kr/openapi/traffic/metropoGateTrfList'
const API_KEY = '0105398808'

// State
const loading = ref(false)
const error = ref('')
const rawData = ref([])
const selectedGate = ref('')
const selectedDir = ref('')
const page = ref(1)
const pageSize = 20

// 6대 관문
const gates = ['서울', '서서울', '동서울', '군자', '남양주', '서시흥']

// Computed
const filteredData = computed(() => {
  let d = rawData.value
  if (selectedGate.value) d = d.filter(i => i.gateNm?.includes(selectedGate.value))
  if (selectedDir.value) d = d.filter(i => i.dirType === selectedDir.value)
  return d
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredData.value.length / pageSize)))

const totalVolume = computed(() => filteredData.value.reduce((s, i) => s + (i.totalVol || 0), 0))
const totalCar = computed(() => filteredData.value.reduce((s, i) => s + (i.carVol || 0), 0))
const totalBus = computed(() => filteredData.value.reduce((s, i) => s + (i.busVol || 0), 0))
const totalTruck = computed(() => filteredData.value.reduce((s, i) => s + (i.truckVol || 0), 0))

const hourlyChart = computed(() => {
  const map = new Map()
  for (const item of filteredData.value) {
    const h = item.hh || 0
    map.set(h, (map.get(h) || 0) + (item.totalVol || 0))
  }
  const max = Math.max(...map.values(), 1)
  const result = []
  for (let h = 0; h < 24; h++) {
    const vol = map.get(h) || 0
    result.push({ hour: h, volume: vol, percent: Math.round((vol / max) * 100) })
  }
  return result
})

// Methods
function formatNum(n) {
  if (!n && n !== 0) return '-'
  return Number(n).toLocaleString('ko-KR')
}

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const today = new Date()
    const ymd = today.toISOString().slice(0, 10).replace(/-/g, '')
    const params = new URLSearchParams({
      key: API_KEY,
      type: 'json',
      numOfRows: '1000',
      pageNo: '1',
      ymd,
    })
    const res = await fetch(`${API_URL}?${params}`)
    if (!res.ok) throw new Error(`API 오류: ${res.status}`)
    const data = await res.json()
    if (data.code && data.code !== 'SUCCESS') throw new Error(data.message || 'API 호출 실패')

    const list = data.list || []
    rawData.value = list.map(i => ({
      gateNm: i.gateNm || i.sgName || '',
      routeNm: i.routeNm || i.roadName || '',
      dirType: i.dirType || i.directionType || '',
      ymd: (i.ymd || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      hh: parseInt(i.hh || i.hour || '0', 10),
      carVol: parseInt(i.carVol || i.trafficVolColumn1 || '0', 10),
      busVol: parseInt(i.busVol || i.trafficVolColumn2 || '0', 10),
      truckVol: parseInt(i.truckVol || i.trafficVolColumn3 || '0', 10),
      totalVol: parseInt(i.totalVol || i.trafficVol || '0', 10),
    }))
    page.value = 1
  } catch (e) {
    error.value = e.message || '데이터 조회 실패'
    rawData.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.traffic-page {
  min-height: 100dvh;
  background: #f5f5f5;
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
  background: none;
  border: none;
  color: #4D9BC6;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.nav-title { font-size: 15px; font-weight: 700; }
.nav-spacer { flex: 1; }

.filter-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  align-items: flex-end;
}
.filter-group { display: flex; flex-direction: column; gap: 2px; }
.filter-group label { font-size: 10px; color: #999; font-weight: 600; }
.filter-select {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  background: #fff;
}
.btn-refresh {
  margin-left: auto;
  background: #1B355A;
  color: #fff;
  border: none;
  padding: 9px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn-refresh:disabled { opacity: 0.5; }

.summary-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 16px;
}
.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.summary-label { font-size: 11px; color: #888; font-weight: 600; }
.summary-value { font-size: 22px; font-weight: 800; color: #1B355A; margin-top: 4px; }

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
@keyframes spin { to { transform: rotate(360deg); } }

.error-box {
  margin: 20px 16px;
  background: #FEF3C7;
  border: 1px solid #F59E0B;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.error-icon { font-size: 24px; flex-shrink: 0; }
.error-title { font-weight: 700; color: #92400E; font-size: 14px; }
.error-desc { font-size: 12px; color: #92400E; margin-top: 4px; }

.chart-section { padding: 16px; }
.section-title { font-size: 15px; font-weight: 700; color: #1B355A; margin-bottom: 12px; }

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 140px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 8px 32px;
  overflow-x: auto;
}
.bar-item {
  flex: 1;
  min-width: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  position: relative;
  justify-content: flex-end;
}
.bar-fill {
  width: 70%;
  background: linear-gradient(to top, #4D9BC6, #1B355A);
  border-radius: 3px 3px 0 0;
  min-height: 2px;
  transition: height 0.3s;
}
.bar-value { font-size: 8px; color: #666; margin-top: 2px; }
.bar-label { font-size: 9px; color: #aaa; }

.table-section { padding: 0 16px 20px; }
.data-list { display: flex; flex-direction: column; gap: 6px; }
.data-row {
  background: #fff;
  border-radius: 10px;
  padding: 12px 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.row-main { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.row-gate { font-size: 14px; font-weight: 700; color: #1B355A; }
.row-route { font-size: 11px; color: #888; }
.row-dir { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
.row-dir.in { background: #DBEAFE; color: #1E40AF; }
.row-dir.out { background: #FEF3C7; color: #92400E; }
.row-time { font-size: 11px; color: #aaa; margin-bottom: 6px; }
.row-volumes { display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; }
.vol-car { color: #3B82F6; }
.vol-bus { color: #F59E0B; }
.vol-truck { color: #6366F1; }
.vol-total { font-weight: 700; color: #1B355A; }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  font-size: 13px;
  color: #666;
}
.pagination button {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
}
.pagination button:disabled { opacity: 0.4; cursor: default; }

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
}
.empty-icon { font-size: 48px; }
</style>
