<template>
  <div class="events-page">
    <!-- 헤더 -->
    <header class="page-header">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <span class="page-title">🎉 휴게소 이벤트</span>
      <span></span>
    </header>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>이벤트를 불러오는 중...</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="error-msg">
      <p>❌ {{ error }}</p>
      <button @click="loadEvents">다시 시도</button>
    </div>

    <!-- 데이터 -->
    <template v-else>
      <!-- 요약 배너 -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-num">{{ newCount }}</span>
          <span class="summary-label">🆕 새 이벤트</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ statusCounts.active }}</span>
          <span class="summary-label">진행 중</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ allEvents.length }}</span>
          <span class="summary-label">전체</span>
        </div>
      </div>

      <!-- 상태 필터 -->
      <div class="status-filter-bar">
        <button class="status-chip" :class="{ active: selectedStatus === 'new' }" @click="selectedStatus = 'new'">
          🆕 새 이벤트 <span class="chip-count">{{ newCount }}</span>
        </button>
        <button class="status-chip" :class="{ active: selectedStatus === 'active' }" @click="selectedStatus = 'active'">
          ▶️ 진행 중 <span class="chip-count">{{ statusCounts.active }}</span>
        </button>
        <button class="status-chip" :class="{ active: selectedStatus === 'upcoming' }" @click="selectedStatus = 'upcoming'">
          📅 예정 <span class="chip-count">{{ statusCounts.upcoming }}</span>
        </button>
        <button class="status-chip" :class="{ active: selectedStatus === 'ended' }" @click="selectedStatus = 'ended'">
          ✅ 종료 <span class="chip-count">{{ statusCounts.ended }}</span>
        </button>
        <button class="status-chip" :class="{ active: selectedStatus === 'all' }" @click="selectedStatus = 'all'">
          📋 전체 <span class="chip-count">{{ allEvents.length }}</span>
        </button>
      </div>

      <!-- 노선 필터 -->
      <div class="filter-bar">
        <button
          v-for="r in routes"
          :key="r"
          class="filter-chip"
          :class="{ active: selectedRoute === r }"
          @click="selectedRoute = r"
        >{{ r }}</button>
      </div>

      <!-- 검색 -->
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="휴게소명 또는 이벤트 검색..."
          class="search-input"
        />
      </div>

      <!-- 이벤트 테이블 -->
      <div class="table-container">
        <div class="table-header">
          <span class="col-rest">휴게소</span>
          <span class="col-event">이벤트</span>
          <span class="col-period">기간</span>
        </div>

        <div
          v-for="(e, i) in filteredEvents"
          :key="e.eventSeq || i"
          class="table-row"
          :class="{ 'row-new': isNew(e) }"
          @click="toggleDetail(e.eventSeq)"
        >
          <div class="cell-rest">
            <div class="rest-name">{{ e.stdRestNm }}</div>
            <div class="rest-route">{{ e.routeNm }}</div>
          </div>
          <div class="cell-event">
            <div class="event-name">
              <span v-if="isNew(e)" class="new-badge">NEW</span>
              {{ e.eventNm }}
            </div>
            <div class="event-type">{{ getEventType(e) }}</div>
          </div>
          <div class="cell-period">
            <div class="period-text">{{ formatPeriod(e.stime, e.etime) }}</div>
            <div class="period-status" :class="getStatusClass(e)">
              {{ getStatus(e) }}
            </div>
          </div>

          <!-- 상세 내용 (클릭 시 펼침) -->
          <Transition name="expand">
            <div v-if="expandedDetail === e.eventSeq" class="event-detail">
              <div class="detail-content">{{ e.eventDetail }}</div>
              <div class="detail-meta">
                <span v-if="e.svarAddr">📍 {{ e.svarAddr }}</span>
                <span v-if="e.stdRestGubun === 'S'">🅿️ 휴게소</span>
                <span v-else>⛽ 주유소</span>
              </div>
            </div>
          </Transition>
        </div>

        <div v-if="filteredEvents.length === 0" class="empty-state">
          🔍 검색 결과가 없습니다
        </div>
      </div>

      <!-- 데이터 출처 -->
      <div class="data-source">
        데이터 출처: 한국도로공사 휴게소 이벤트 현황 조회 서비스<br>
        기준일: {{ today }} | 호출시각: {{ fetchedAt }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchEvents } from '../lib/api.js'

const loading = ref(true)
const error = ref('')
const allEvents = ref([])
const selectedStatus = ref('new')
const selectedRoute = ref('전체')
const searchQuery = ref('')
const expandedDetail = ref(null)

const today = new Date().toISOString().slice(0, 10)
const fetchedAt = ref('')

// 오늘 시작한 이벤트 = NEW (갱신 주기 00시/12시에 맞춤)
function isNew(e) {
  return e.stime === today
}

const newCount = computed(() => allEvents.value.filter(e => isNew(e)).length)

// 상태별 분류
function getEventStatus(e) {
  if (e.stime > today) return 'upcoming'
  if (e.stime === today) return 'new'
  const days = Math.ceil((new Date(e.etime) - new Date(today)) / (1000 * 60 * 60 * 24))
  if (days > 365) return 'active' // 상시
  if (days < 0) return 'ended'
  return 'active'
}

const statusCounts = computed(() => {
  const counts = { new: 0, active: 0, upcoming: 0, ended: 0 }
  for (const e of allEvents.value) {
    const s = getEventStatus(e)
    if (counts[s] != null) counts[s]++
  }
  return counts
})

const routes = computed(() => {
  const set = new Set(['전체'])
  let list = allEvents.value
  if (selectedStatus.value === 'new') list = list.filter(e => isNew(e))
  else if (selectedStatus.value !== 'all') list = list.filter(e => getEventStatus(e) === selectedStatus.value)
  list.forEach(e => set.add(e.routeNm))
  return [...set]
})

const filteredEvents = computed(() => {
  let list = allEvents.value

  // 상태 필터
  if (selectedStatus.value === 'new') {
    list = list.filter(e => isNew(e))
  } else if (selectedStatus.value !== 'all') {
    list = list.filter(e => getEventStatus(e) === selectedStatus.value)
  }

  // 노선 필터
  if (selectedRoute.value !== '전체') {
    list = list.filter(e => e.routeNm === selectedRoute.value)
  }

  // 검색 필터
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(e =>
      (e.stdRestNm || '').toLowerCase().includes(q) ||
      (e.eventNm || '').toLowerCase().includes(q) ||
      (e.eventDetail || '').toLowerCase().includes(q)
    )
  }

  // 정렬: NEW(오늘 시작) 최상단 → 진행 중 → 나머지 가나다
  return list.sort((a, b) => {
    const aNew = isNew(a) ? 0 : 1
    const bNew = isNew(b) ? 0 : 1
    if (aNew !== bNew) return aNew - bNew
    return (a.stdRestNm || '').localeCompare(b.stdRestNm || '')
  })
})

function toggleDetail(seq) {
  expandedDetail.value = expandedDetail.value === seq ? null : seq
}

function getEventType(e) {
  const name = (e.eventNm || '').toLowerCase()
  const detail = (e.eventDetail || '').toLowerCase()
  if (name.includes('생수') || detail.includes('생수')) return '🥤 음료 제공'
  if (name.includes('식사') || name.includes('식권') || detail.includes('무료 식')) return '🍚 식사'
  if (name.includes('커피') || detail.includes('커피')) return '☕ 커피'
  if (name.includes('임산부') || name.includes('다자녀') || name.includes('어린이')) return '👨‍👩‍👧 가족'
  if (name.includes('펫') || name.includes('반려') || name.includes('멍멍')) return '🐶 반려동물'
  if (name.includes('사은') || name.includes('증정') || name.includes('선착순')) return '🎁 사은품'
  if (name.includes('주유') || name.includes('포인트')) return '⛽ 주유'
  return '📌 기타'
}

function formatPeriod(stime, etime) {
  const s = stime?.slice(5) || '?'
  const e = etime?.slice(5) || '?'
  return `${s} ~ ${e}`
}

function getStatus(e) {
  if (isNew(e)) return '🆕 NEW'
  const days = Math.ceil((new Date(e.etime) - new Date(today)) / (1000 * 60 * 60 * 24))
  if (e.stime > today) return '예정'
  if (days > 365) return '상시'
  if (days <= 0) return '종료 임박'
  if (days <= 7) return `D-${days}`
  return '진행 중'
}

function getStatusClass(e) {
  if (isNew(e)) return 'status-new'
  const s = getStatus(e)
  if (s === '상시') return 'status-always'
  if (s.startsWith('D-')) return 'status-soon'
  return 'status-active'
}

async function loadEvents() {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchEvents()
    fetchedAt.value = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    allEvents.value = data.list || []
    // 새 이벤트가 있으면 'new' 탭, 없으면 'active'
    const hasNew = allEvents.value.some(e => isNew(e))
    selectedStatus.value = hasNew ? 'new' : 'active'
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadEvents)
</script>

<style scoped>
.events-page {
  min-height: 100dvh;
  background: #f5f5f5;
  max-width: 600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  padding: 6px 12px;
}

.page-title {
  font-size: 16px;
  font-weight: 700;
}

/* Loading */
.loading {
  text-align: center;
  padding: 80px 20px;
  color: #888;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #4D9BC6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Error */
.error-msg {
  text-align: center;
  padding: 60px 20px;
  color: #ef4444;
}
.error-msg button {
  margin-top: 12px;
  padding: 8px 20px;
  background: #4D9BC6;
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
}

/* Summary */
.summary-bar {
  display: flex;
  background: #fff;
  margin: 0;
  padding: 16px;
  border-bottom: 1px solid #eee;
}
.summary-item {
  flex: 1;
  text-align: center;
  border-right: 1px solid #eee;
}
.summary-item:last-child { border-right: none; }
.summary-num {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: #1B355A;
}
.summary-label {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

/* Status filter bar */
.status-filter-bar {
  display: flex;
  gap: 6px;
  padding: 10px 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.status-chip {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 20px;
  background: #f0f0f0;
  font-size: 13px;
  font-weight: 700;
  color: #666;
  transition: all 0.15s;
  white-space: nowrap;
}
.status-chip.active {
  background: #1B355A;
  color: #fff;
}
.chip-count {
  font-size: 11px;
  opacity: 0.8;
}

/* Filter chips (route) */
.filter-bar {
  display: flex;
  gap: 6px;
  padding: 10px 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.filter-chip {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 20px;
  background: #f5f5f5;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  transition: all 0.15s;
}
.filter-chip.active {
  background: #4D9BC6;
  color: #fff;
}

/* Search */
.search-bar {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
}
.search-input:focus {
  border-color: #4D9BC6;
}

/* Table */
.table-container {
  background: #fff;
  margin-bottom: 20px;
}
.table-header {
  display: grid;
  grid-template-columns: 100px 1fr 90px;
  gap: 8px;
  padding: 10px 16px;
  background: #f8f9fa;
  font-size: 11px;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #eee;
  position: sticky;
  top: 48px;
  z-index: 5;
}
.table-row {
  display: grid;
  grid-template-columns: 100px 1fr 90px;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.1s;
  align-items: start;
}
.table-row:active {
  background: #f8f9fa;
}
.table-row:hover {
  background: #f8fbff;
}
.row-new {
  background: #FFF8E1;
}
.row-new:hover {
  background: #FFF3C4;
}

.cell-rest { min-width: 0; }
.rest-name {
  font-size: 13px;
  font-weight: 700;
  color: #1B355A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rest-route {
  font-size: 10px;
  color: #aaa;
  margin-top: 2px;
}

.cell-event { min-width: 0; }
.event-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.event-type {
  font-size: 11px;
  color: #4D9BC6;
  margin-top: 3px;
  font-weight: 600;
}

.new-badge {
  display: inline-block;
  background: #FF1744;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.cell-period {
  text-align: right;
}
.period-text {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}
.period-status {
  font-size: 10px;
  font-weight: 700;
  margin-top: 3px;
  display: inline-block;
  padding: 2px 6px;
  border-radius: 6px;
}
.status-active { background: #E8F5E9; color: #16A34A; }
.status-always { background: #E3F2FD; color: #1976D2; }
.status-soon { background: #FFF3E0; color: #F57C00; }
.status-new { background: #FFEBEE; color: #FF1744; }

/* Detail expansion */
.event-detail {
  grid-column: 1 / -1;
  padding: 12px 0 4px;
  border-top: 1px dashed #e0e0e0;
  margin-top: 8px;
}
.detail-content {
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  white-space: pre-wrap;
  background: #f8f9fa;
  padding: 10px 12px;
  border-radius: 8px;
}
.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  font-size: 11px;
  color: #aaa;
}

/* Expand transition */
.expand-enter-active, .expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to, .expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* Empty */
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #aaa;
  font-size: 14px;
}

/* Data source */
.data-source {
  text-align: center;
  padding: 20px;
  font-size: 11px;
  color: #ccc;
  line-height: 1.6;
}
</style>
