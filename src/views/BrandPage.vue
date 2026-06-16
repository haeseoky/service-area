<template>
  <div class="brand-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <span class="nav-title">🏪 브랜드 매장</span>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 요약 -->
    <div v-if="!loading && !error" class="summary-bar">
      <div class="summary-item">
        <span class="summary-num">{{ brandCount }}</span>
        <span class="summary-label">브랜드</span>
      </div>
      <div class="summary-item">
        <span class="summary-num">{{ restAreaCount }}</span>
        <span class="summary-label">휴게소</span>
      </div>
      <div class="summary-item">
        <span class="summary-num">{{ totalCount }}</span>
        <span class="summary-label">매장</span>
      </div>
    </div>

    <!-- 카테고리 탭 -->
    <div class="category-tabs">
      <button v-for="cat in categories" :key="cat" class="cat-tab" :class="{ active: selectedCategory === cat }" @click="selectedCategory = cat">
        {{ cat }}
      </button>
    </div>

    <!-- 브랜드 필터 -->
    <div v-if="selectedCategory !== '전체'" class="brand-chips">
      <button class="brand-chip" :class="{ active: selectedBrand === '' }" @click="selectedBrand = ''">전체</button>
      <button v-for="b in categoryBrands" :key="b.name" class="brand-chip" :class="{ active: selectedBrand === b.name }" @click="selectedBrand = b.name">
        {{ b.name }} ({{ b.areas.length }})
      </button>
    </div>

    <!-- 검색 -->
    <div class="search-bar">
      <input v-model="searchQuery" type="search" placeholder="휴게소 또는 브랜드 검색..." class="search-input" />
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>브랜드 정보를 불러오는 중…</p>
    </div>

    <!-- 에러 -->
    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <div class="error-title">데이터를 불러올 수 없습니다</div>
        <div class="error-desc">{{ error }}</div>
      </div>
    </div>

    <!-- 브랜드별 그룹 결과 -->
    <div v-if="!loading && viewMode === 'brand'" class="brand-group-list">
      <div v-for="b in filteredByBrand" :key="b.name" class="brand-group-card">
        <div class="brand-group-header">
          <span class="brand-group-name">{{ b.name }}</span>
          <span class="brand-group-cat">{{ getBrandCategory(b.name) }}</span>
          <span class="brand-group-count">{{ b.areas.length }}곳</span>
        </div>
        <div class="brand-area-tags">
          <span v-for="a in b.areas.slice(0, 8)" :key="a.stdRestCd + a.brdCode" class="area-tag" @click="toggleDetail(a)">
            {{ a.stdRestNm }}
          </span>
          <span v-if="b.areas.length > 8" class="area-more">+{{ b.areas.length - 8 }}곳</span>
        </div>
        <Transition name="expand">
          <div v-if="expandedBrand === b.name" class="brand-detail-list">
            <div v-for="a in b.areas" :key="a.stdRestCd + a.brdCode" class="brand-detail-row">
              <div class="bd-name">{{ a.stdRestNm }}</div>
              <div class="bd-route">{{ a.routeNm }}</div>
              <div class="bd-time">{{ a.stime }} ~ {{ a.etime }}</div>
              <div class="bd-addr">{{ a.svarAddr }}</div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 휴게소별 그룹 결과 -->
    <div v-if="!loading && viewMode === 'area'" class="area-group-list">
      <div v-for="[, data] in filteredByArea" :key="data.name" class="area-group-card">
        <div class="area-group-header">
          <span class="area-group-name">{{ data.name }}</span>
          <span class="area-group-route">{{ data.route }}</span>
        </div>
        <div class="area-brand-tags">
          <span v-for="b in data.brands" :key="b.brdCode" class="brand-tag">{{ b.brdName }}</span>
        </div>
        <div class="area-addr">{{ data.addr }}</div>
      </div>
    </div>

    <!-- 뷰 토글 -->
    <div v-if="!loading && !error" class="view-toggle">
      <button :class="{ active: viewMode === 'brand' }" @click="viewMode = 'brand'">🏷️ 브랜드별</button>
      <button :class="{ active: viewMode === 'area' }" @click="viewMode = 'area'">📍 휴게소별</button>
    </div>

    <div v-if="!loading && !error && filteredByBrand.length === 0 && filteredByArea.size === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>검색 결과가 없습니다.</p>
    </div>

    <div class="data-source">
      데이터 출처: 한국도로공사 휴게소 입점 브랜드 현황<br>
      기준일: {{ today }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchBrands, getBrandCategory } from '../lib/api.js'

const loading = ref(false)
const error = ref('')
const allBrands = ref([])
const selectedCategory = ref('전체')
const selectedBrand = ref('')
const searchQuery = ref('')
const viewMode = ref('brand')
const expandedBrand = ref(null)

const today = new Date().toISOString().slice(0, 10)

const categories = ['전체', '커피·디저트', '패스트푸드', '간식·식사', '편의점', '레저·기타']

const brandGroups = computed(() => {
  const map = new Map()
  for (const b of allBrands.value) {
    if (!map.has(b.brdName)) map.set(b.brdName, { name: b.brdName, areas: [] })
    map.get(b.brdName).areas.push(b)
  }
  return Array.from(map.values()).sort((a, b) => b.areas.length - a.areas.length)
})

const categoryBrands = computed(() => {
  if (selectedCategory.value === '전체') return brandGroups.value
  return brandGroups.value.filter(b => getBrandCategory(b.name) === selectedCategory.value)
})

const filteredByBrand = computed(() => {
  let list = categoryBrands.value
  if (selectedBrand.value) list = list.filter(b => b.name === selectedBrand.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.areas.some(a => a.stdRestNm.toLowerCase().includes(q))
    )
  }
  return list
})

const filteredByArea = computed(() => {
  const map = new Map()
  for (const b of allBrands.value) {
    // 필터: 카테고리
    if (selectedCategory.value !== '전체' && getBrandCategory(b.brdName) !== selectedCategory.value) continue
    // 필터: 브랜드
    if (selectedBrand.value && b.brdName !== selectedBrand.value) continue
    // 필터: 검색
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      if (!b.stdRestNm.toLowerCase().includes(q) && !b.brdName.toLowerCase().includes(q)) continue
    }
    if (!map.has(b.stdRestNm)) {
      map.set(b.stdRestNm, { name: b.stdRestNm, route: b.routeNm, addr: b.svarAddr, brands: [] })
    }
    map.get(b.stdRestNm).brands.push(b)
  }
  // 브랜드 많은 순 정렬
  return new Map([...map.entries()].sort((a, b) => b[1].brands.length - a[1].brands.length))
})

const brandCount = computed(() => brandGroups.value.length)
const restAreaCount = computed(() => new Set(allBrands.value.map(b => b.stdRestNm)).size)
const totalCount = computed(() => allBrands.value.length)

function toggleDetail(brand) {
  expandedBrand.value = expandedBrand.value === brand ? null : brand
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchBrands({ numOfRows: 1000 })
    allBrands.value = data.list || []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.brand-page { min-height: 100dvh; background: #f5f5f5; padding-bottom: 60px; }

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

.category-tabs {
  display: flex; gap: 4px; padding: 10px 12px;
  overflow-x: auto; background: #fff; border-bottom: 1px solid #eee;
  -webkit-overflow-scrolling: touch;
}
.cat-tab {
  flex-shrink: 0; padding: 6px 14px; border-radius: 20px;
  background: #f5f5f5; font-size: 12px; font-weight: 600; color: #666;
  transition: all 0.15s;
}
.cat-tab.active { background: #1B355A; color: #fff; }

.brand-chips {
  display: flex; gap: 4px; padding: 10px 12px;
  overflow-x: auto; background: #fff; border-bottom: 1px solid #eee;
}
.brand-chip {
  flex-shrink: 0; padding: 5px 12px; border-radius: 16px;
  background: #E3F2FD; font-size: 11px; font-weight: 600; color: #1976D2;
}
.brand-chip.active { background: #1976D2; color: #fff; }

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

/* 브랜드별 */
.brand-group-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.brand-group-card {
  background: #fff; border-radius: 14px; padding: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.brand-group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.brand-group-name { font-size: 16px; font-weight: 800; color: #1B355A; }
.brand-group-cat { font-size: 10px; font-weight: 600; color: #4D9BC6; background: #E3F2FD; padding: 2px 8px; border-radius: 6px; }
.brand-group-count { margin-left: auto; font-size: 12px; font-weight: 700; color: #16A34A; }
.brand-area-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.area-tag {
  font-size: 11px; padding: 3px 8px; border-radius: 6px;
  background: #f5f5f5; color: #555; cursor: pointer; transition: all 0.15s;
}
.area-tag:hover { background: #E3F2FD; color: #1976D2; }
.area-more { font-size: 11px; padding: 3px 8px; color: #aaa; }

.brand-detail-list { margin-top: 10px; border-top: 1px dashed #eee; padding-top: 8px; }
.brand-detail-row {
  padding: 6px 0; display: grid; grid-template-columns: 1fr auto; gap: 4px 8px;
  border-bottom: 1px solid #f8f8f8;
}
.brand-detail-row:last-child { border-bottom: none; }
.bd-name { font-size: 12px; font-weight: 700; color: #1B355A; }
.bd-route { font-size: 10px; color: #aaa; }
.bd-time { font-size: 10px; color: #16A34A; text-align: right; }
.bd-addr { font-size: 10px; color: #999; grid-column: 1 / -1; }

/* 휴게소별 */
.area-group-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.area-group-card {
  background: #fff; border-radius: 14px; padding: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.area-group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.area-group-name { font-size: 15px; font-weight: 800; color: #1B355A; }
.area-group-route { font-size: 10px; font-weight: 600; color: #888; background: #f0f0f0; padding: 2px 8px; border-radius: 6px; }
.area-brand-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.brand-tag {
  font-size: 11px; padding: 3px 8px; border-radius: 6px;
  background: #E8F5E9; color: #16A34A; font-weight: 600;
}
.area-addr { font-size: 11px; color: #999; }

/* 뷰 토글 */
.view-toggle {
  display: flex; gap: 0; padding: 0 16px; margin-top: 16px;
  position: sticky; bottom: 0; background: #f5f5f5; padding: 12px 16px;
}
.view-toggle button {
  flex: 1; padding: 10px; font-size: 13px; font-weight: 700;
  background: #fff; border: 1px solid #ddd; color: #888;
}
.view-toggle button:first-child { border-radius: 10px 0 0 10px; border-right: none; }
.view-toggle button:last-child { border-radius: 0 10px 10px 0; }
.view-toggle button.active { background: #1B355A; color: #fff; border-color: #1B355A; }

.empty-state { text-align: center; padding: 60px 20px; color: #aaa; }
.empty-icon { font-size: 48px; }

.expand-enter-active, .expand-leave-active { transition: all 0.2s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 600px; }

.data-source { text-align: center; padding: 20px; font-size: 11px; color: #ccc; line-height: 1.6; }
</style>
