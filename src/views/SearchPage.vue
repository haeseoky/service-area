<template>
  <div class="search-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <h1 class="nav-title">🔍 휴게소 통합검색</h1>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 검색바 -->
    <div class="search-bar">
      <input
        v-model="query"
        type="search"
        placeholder="휴게소명 입력 (예: 안동, 청원, 호법)"
        class="search-input"
        @keyup.enter="doSearch"
      />
      <button class="search-btn" @click="doSearch" :disabled="loading">검색</button>
    </div>

    <!-- 빠른 검색 -->
    <div class="quick-tags">
      <button v-for="name in quickNames" :key="name" class="quick-tag" @click="query = name; doSearch()">
        {{ name }}
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>모든 데이터에서 검색 중…</p>
    </div>

    <!-- 에러 -->
    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <div class="error-title">검색 실패</div>
        <div class="error-desc">{{ error }}</div>
      </div>
    </div>

    <!-- 결과 없음 안내 -->
    <div v-if="!loading && !error && searched && results.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>'{{ lastQuery }}'에 대한 결과가 없습니다.</p>
      <p class="empty-hint">2글자 이상 입력해주세요.</p>
    </div>

    <!-- 검색 결과 -->
    <div v-if="!loading && results.length > 0" class="result-list">
      <div class="result-count">'{{ lastQuery }}' — {{ results.length }}개 휴게소 <span class="fetched-time">| 호출: {{ fetchedAt }}</span></div>

      <div v-for="area in results" :key="area.name" class="area-result-card">
        <!-- 헤더 -->
        <div class="area-header">
          <span class="area-name">{{ area.name }}</span>
          <span class="area-route">{{ area.route }}</span>
        </div>
        <div v-if="area.addr" class="area-addr">📍 {{ area.addr }}</div>

        <!-- 진행 중 이벤트 -->
        <div v-if="area.activeEvents.length > 0" class="section">
          <div class="section-title">🎉 진행 중 이벤트 ({{ area.activeEvents.length }})</div>
          <div v-for="e in area.activeEvents" :key="e.eventSeq" class="event-row">
            <span class="event-name">{{ e.eventNm }}</span>
            <span class="event-period">{{ e.stime?.slice(5) }} ~ {{ e.etime?.slice(5) }}</span>
          </div>
        </div>

        <!-- 입점 브랜드 -->
        <div v-if="area.brands.length > 0" class="section">
          <div class="section-title">🏪 입점 브랜드 ({{ area.brands.length }})</div>
          <div class="brand-tags">
            <span v-for="b in area.brands" :key="b.brdCode" class="brand-tag">{{ b.brdName }}</span>
          </div>
        </div>

        <!-- 편의시설 -->
        <div v-if="area.facilities.length > 0" class="section">
          <div class="section-title">🛎️ 편의시설 ({{ area.facilities.length }})</div>
          <div class="fac-tags">
            <span v-for="f in area.facilities" :key="f.psCode" class="fac-tag">
              {{ getFacilityIcon(f.psName) }} {{ f.psName }}
            </span>
          </div>
        </div>

        <!-- 정보 없음 -->
        <div v-if="area.activeEvents.length === 0 && area.brands.length === 0 && area.facilities.length === 0" class="no-info">
          현재 등록된 정보가 없습니다.
        </div>
      </div>
    </div>

    <!-- 초기 안내 -->
    <div v-if="!loading && !searched" class="intro">
      <div class="intro-icon">🛣️</div>
      <p class="intro-title">휴게소를 검색해보세요</p>
      <p class="intro-desc">이벤트, 브랜드 매장, 편의시설 정보를 한번에!</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { searchRestArea, getFacilityIcon } from '../lib/api.js'

const query = ref('')
const lastQuery = ref('')
const loading = ref(false)
const error = ref('')
const searched = ref(false)
const results = ref([])
const fetchedAt = ref('')

const quickNames = ['안동', '청원', '호법', '죽암', '이천', '망향', '대전', '옥천', '김천']

async function doSearch() {
  const q = query.value.trim()
  if (q.length < 2) return

  loading.value = true
  error.value = ''
  searched.value = true

  try {
    results.value = await searchRestArea(q) || []
    lastQuery.value = q
    fetchedAt.value = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch (e) {
    error.value = e.message
    results.value = []
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.search-page { min-height: 100dvh; background: #f5f5f5; padding-bottom: 40px; }

.page-nav {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #1B355A; color: #fff;
  position: sticky; top: 0; z-index: 10;
}
.btn-back { background: none; border: none; color: #4D9BC6; font-size: 14px; font-weight: 600; cursor: pointer; }
.nav-title { margin: 0; font-size: 15px; font-weight: 700; }
.nav-spacer { flex: 1; }

.search-bar {
  display: flex; gap: 8px; padding: 12px 16px;
  background: #fff; border-bottom: 1px solid #eee;
}
.search-input {
  flex: 1; padding: 10px 14px; border: 1px solid #e0e0e0;
  border-radius: 10px; font-size: 14px; outline: none; font-family: inherit;
}
.search-input:focus { border-color: #4D9BC6; }
.search-btn {
  padding: 10px 20px; background: #1B355A; color: #fff;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 700;
  cursor: pointer; white-space: nowrap;
}
.search-btn:disabled { opacity: 0.5; }

.quick-tags {
  display: flex; gap: 4px; padding: 10px 16px;
  overflow-x: auto; background: #fff; border-bottom: 1px solid #eee;
}
.quick-tag {
  flex-shrink: 0; padding: 5px 12px; border-radius: 16px;
  background: #E3F2FD; font-size: 12px; font-weight: 600; color: #1976D2;
}

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

.empty-state { text-align: center; padding: 60px 20px; color: #aaa; }
.empty-icon { font-size: 48px; }
.empty-hint { font-size: 12px; margin-top: 8px; color: #ccc; }

.result-list { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.result-count { font-size: 13px; color: #666; font-weight: 600; padding: 4px 4px 8px; }
.fetched-time { font-weight: 400; color: #aaa; font-size: 11px; }

.area-result-card {
  background: #fff; border-radius: 14px; padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.area-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.area-name { font-size: 17px; font-weight: 800; color: #1B355A; }
.area-route { font-size: 10px; font-weight: 600; color: #888; background: #f0f0f0; padding: 2px 8px; border-radius: 6px; }
.area-addr { font-size: 11px; color: #999; margin-bottom: 10px; }

.section { margin-top: 10px; padding-top: 10px; border-top: 1px solid #f0f0f0; }
.section-title { font-size: 12px; font-weight: 700; color: #1B355A; margin-bottom: 6px; }

.event-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
.event-name { font-size: 13px; color: #333; font-weight: 600; }
.event-period { font-size: 11px; color: #888; }

.brand-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.brand-tag {
  font-size: 11px; padding: 3px 8px; border-radius: 6px;
  background: #E8F5E9; color: #16A34A; font-weight: 600;
}
.fac-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.fac-tag {
  font-size: 11px; padding: 3px 8px; border-radius: 6px;
  background: #E3F2FD; color: #1976D2; font-weight: 600;
}

.no-info { font-size: 13px; color: #aaa; padding: 8px 0; }

.intro { text-align: center; padding: 80px 20px; color: #aaa; }
.intro-icon { font-size: 60px; margin-bottom: 12px; }
.intro-title { font-size: 18px; font-weight: 700; color: #1B355A; }
.intro-desc { font-size: 13px; margin-top: 4px; }
</style>
