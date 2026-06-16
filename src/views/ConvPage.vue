<template>
  <div class="conv-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <span class="nav-title">🛎️ 편의시설</span>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 요약 -->
    <div v-if="!loading && !error" class="summary-bar">
      <div class="summary-item">
        <span class="summary-num">{{ facilityTypes }}</span>
        <span class="summary-label">시설 종류</span>
      </div>
      <div class="summary-item">
        <span class="summary-num">{{ restAreaCount }}</span>
        <span class="summary-label">휴게소</span>
      </div>
      <div class="summary-item">
        <span class="summary-num">{{ totalCount }}</span>
        <span class="summary-label">총 정보</span>
      </div>
    </div>

    <!-- 시설 타입 탭 -->
    <div class="facility-tabs">
      <button v-for="[name, data] in facilityGroups" :key="name"
        class="fac-tab" :class="{ active: selectedFacility === name }"
        @click="selectedFacility = name">
        <span class="fac-icon">{{ getFacilityIcon(name) }}</span>
        <span class="fac-name">{{ name }}</span>
        <span class="fac-count">{{ data.areas.length }}</span>
      </button>
    </div>

    <!-- 검색 -->
    <div class="search-bar">
      <input v-model="searchQuery" type="search" placeholder="휴게소명 검색..." class="search-input" />
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>편의시설 정보를 불러오는 중…</p>
    </div>

    <!-- 에러 -->
    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <div class="error-title">데이터를 불러올 수 없습니다</div>
        <div class="error-desc">{{ error }}</div>
      </div>
    </div>

    <!-- 휴게소별 시설 카드 -->
    <div v-if="!loading && !error" class="area-list">
      <div v-for="[, data] in filteredByArea" :key="data.name" class="area-card">
        <div class="area-card-header">
          <span class="area-name">{{ data.name }}</span>
          <span class="area-route">{{ data.route }}</span>
        </div>
        <div class="area-facilities">
          <div v-for="f in data.facilities" :key="f.psCode" class="facility-row">
            <span class="fac-badge">{{ getFacilityIcon(f.psName) }} {{ f.psName }}</span>
            <span class="fac-time">{{ f.stime }} ~ {{ f.etime }}</span>
          </div>
        </div>
        <div class="area-addr">📍 {{ data.addr }}</div>
      </div>
    </div>

    <!-- 시설별 상세 보기 -->
    <div v-if="!loading && !error && selectedFacility" class="facility-detail-section">
      <h3 class="section-title">{{ getFacilityIcon(selectedFacility) }} {{ selectedFacility }} 설명</h3>
      <div class="facility-desc-card" v-if="facilityDescription">
        <p>{{ facilityDescription }}</p>
      </div>
    </div>

    <div v-if="!loading && !error && filteredByArea.size === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>검색 결과가 없습니다.</p>
    </div>

    <div class="data-source">
      데이터 출처: 한국도로공사 휴게소 편의시설 현황<br>
      기준일: {{ today }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchConvs, getFacilityIcon } from '../lib/api.js'

const loading = ref(false)
const error = ref('')
const allConvs = ref([])
const selectedFacility = ref('')
const searchQuery = ref('')

const today = new Date().toISOString().slice(0, 10)

// 시설별 그룹 (sorted by count desc)
const facilityGroups = computed(() => {
  const map = new Map()
  for (const c of allConvs.value) {
    if (!map.has(c.psName)) map.set(c.psName, { name: c.psName, areas: [] })
    map.get(c.psName).areas.push(c)
  }
  return Array.from(map.entries()).sort((a, b) => b[1].areas.length - a[1].areas.length)
})

// 선택된 시설의 설명 (첫 번째 항목에서 추출)
const facilityDescription = computed(() => {
  if (!selectedFacility.value) return ''
  const group = facilityGroups.value.find(([name]) => name === selectedFacility.value)
  if (!group || !group[1].areas[0]?.psDesc) return ''
  return group[1].areas[0].psDesc
})

// 휴게소별 그룹 (필터 적용)
const filteredByArea = computed(() => {
  const map = new Map()
  for (const c of allConvs.value) {
    // 필터: 시설 타입
    if (selectedFacility.value && c.psName !== selectedFacility.value) continue
    // 필터: 검색
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      if (!c.stdRestNm.toLowerCase().includes(q)) continue
    }
    if (!map.has(c.stdRestNm)) {
      map.set(c.stdRestNm, { name: c.stdRestNm, route: c.routeNm, addr: c.svarAddr, facilities: [] })
    }
    map.get(c.stdRestNm).facilities.push(c)
  }
  // 시설 많은 순 정렬
  return new Map([...map.entries()].sort((a, b) => b[1].facilities.length - a[1].facilities.length))
})

const facilityTypes = computed(() => new Set(allConvs.value.map(c => c.psName)).size)
const restAreaCount = computed(() => new Set(allConvs.value.map(c => c.stdRestNm)).size)
const totalCount = computed(() => allConvs.value.length)

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchConvs({ numOfRows: 2000 })
    allConvs.value = data.list || []
    // 첫 번째 시설 자동 선택
    if (facilityGroups.value.length > 0 && !selectedFacility.value) {
      // 전체 보기가 기본
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.conv-page { min-height: 100dvh; background: #f5f5f5; padding-bottom: 40px; }

.page-nav {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #1B355A; color: #fff;
  position: sticky; top: 0; z-index: 10;
}
.btn-back { background: none; border: none; color: #4D9BC6; font-size: 14px; font-weight: 600; cursor: pointer; }
.nav-title { font-size: 15px; font-weight: 700; }
.nav-spacer { flex: 1; }

.summary-bar { display: flex; background: #fff; padding: 16px; border-bottom: 1px solid #eee; }
.summary-item { flex: 1; text-align: center; border-right: 1px solid #eee; }
.summary-item:last-child { border-right: none; }
.summary-num { display: block; font-size: 22px; font-weight: 800; color: #1B355A; }
.summary-label { display: block; font-size: 10px; color: #999; margin-top: 2px; }

.facility-tabs {
  display: flex; gap: 4px; padding: 10px 12px;
  overflow-x: auto; background: #fff; border-bottom: 1px solid #eee;
  -webkit-overflow-scrolling: touch;
}
.fac-tab {
  display: flex; flex-direction: column; align-items: center;
  flex-shrink: 0; min-width: 60px; padding: 8px 12px; border-radius: 12px;
  background: #f5f5f5; transition: all 0.15s;
}
.fac-tab.active { background: #1B355A; color: #fff; }
.fac-icon { font-size: 20px; }
.fac-name { font-size: 10px; font-weight: 700; margin-top: 2px; }
.fac-count { font-size: 9px; opacity: 0.7; }

.search-bar { padding: 12px 16px; background: #fff; border-bottom: 1px solid #eee; }
.search-input {
  width: 100%; padding: 10px 14px; border: 1px solid #e0e0e0;
  border-radius: 10px; font-size: 14px; outline: none; font-family: inherit;
}
.search-input:focus { border-color: #4D9BC6; }

.loading { text-align: center; padding: 60px 20px; color: #888; }
.spinner {
  width: 32px; height: 32px; border: 3px solid #e0e0e0;
  border-top-color: #1B355A; border-radius: 50%;
  animation: spin 0.8s linear infinite; margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-box {
  margin: 20px 16px; background: #FEF3C7; border: 1px solid #F59E0B;
  border-radius: 12px; padding: 16px; display: flex; gap: 12px; align-items: flex-start;
}
.error-icon { font-size: 24px; flex-shrink: 0; }
.error-title { font-weight: 700; color: #92400E; font-size: 14px; }
.error-desc { font-size: 12px; color: #92400E; margin-top: 4px; }

.area-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.area-card {
  background: #fff; border-radius: 14px; padding: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.area-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.area-name { font-size: 15px; font-weight: 800; color: #1B355A; }
.area-route { font-size: 10px; font-weight: 600; color: #888; background: #f0f0f0; padding: 2px 8px; border-radius: 6px; }

.area-facilities { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.facility-row { display: flex; justify-content: space-between; align-items: center; }
.fac-badge {
  font-size: 12px; font-weight: 600; color: #1B355A;
  background: #E3F2FD; padding: 3px 10px; border-radius: 8px;
}
.fac-time { font-size: 11px; color: #16A34A; font-weight: 600; }

.area-addr { font-size: 11px; color: #999; }

.facility-detail-section { padding: 0 12px; margin-top: 16px; }
.section-title { font-size: 14px; font-weight: 700; color: #1B355A; margin-bottom: 8px; }
.facility-desc-card {
  background: #fff; border-radius: 12px; padding: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.facility-desc-card p { font-size: 13px; color: #555; line-height: 1.6; }

.empty-state { text-align: center; padding: 60px 20px; color: #aaa; }
.empty-icon { font-size: 48px; }

.data-source { text-align: center; padding: 20px; font-size: 11px; color: #ccc; line-height: 1.6; }
</style>
