<template>
  <div class="aq-page">
    <nav class="page-nav">
      <button class="btn-back" @click="$router.push('/')">← 홈</button>
      <h1 class="nav-title">🌬️ 고속도로 대기질</h1>
      <span class="nav-spacer"></span>
    </nav>

    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>전국 대기질 정보를 불러오는 중…</p>
    </div>

    <!-- 에러 -->
    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <div class="error-title">대기질 정보를 불러올 수 없습니다</div>
        <div class="error-desc">{{ error }}</div>
      </div>
    </div>

    <template v-if="!loading && !error">
      <!-- 요약 바 -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-num" :style="{ color: avgPM10Grade.color }">{{ avgPM10Grade.emoji }}</span>
          <span class="summary-label">평균 대기질</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ avgPM10 }}</span>
          <span class="summary-label">평균 PM10 (㎍/㎥)</span>
        </div>
        <div class="summary-item">
          <span class="summary-num">{{ avgPM25 }}</span>
          <span class="summary-label">평균 PM2.5 (㎍/㎥)</span>
        </div>
      </div>

      <!-- 범례 -->
      <div class="legend">
        <div class="legend-row">
          <span class="legend-label">대기질 등급</span>
          <div class="legend-tags">
            <span class="ltag" style="background:#22C55E;color:#fff;">좋음</span>
            <span class="ltag" style="background:#EAB308;color:#fff;">보통</span>
            <span class="ltag" style="background:#F97316;color:#fff;">나쁨</span>
            <span class="ltag" style="background:#EF4444;color:#fff;">매우나쁨</span>
          </div>
        </div>
        <div class="legend-row">
          <span class="legend-label">자외선 등급</span>
          <div class="legend-tags">
            <span class="ltag" style="background:#22C55E;color:#fff;">낮음 ≤2</span>
            <span class="ltag" style="background:#EAB308;color:#fff;">보통 3-5</span>
            <span class="ltag" style="background:#F97316;color:#fff;">높음 6-7</span>
            <span class="ltag" style="background:#EF4444;color:#fff;">매우높음 8-10</span>
          </div>
        </div>
      </div>

      <!-- 대기질 카드 리스트 -->
      <div class="aq-list">
        <div v-for="a in aqData" :key="a.name" class="aq-card" :style="{ borderLeftColor: getPM10Grade(a.pm10).color }">
          <div class="aq-header">
            <div class="aq-name">{{ a.name }}</div>
            <div class="aq-badges">
              <span class="aq-badge" :style="{ background: getPM10Grade(a.pm10).color }">
                {{ getPM10Grade(a.pm10).emoji }} {{ getPM10Grade(a.pm10).label }}
              </span>
            </div>
          </div>
          <div class="aq-desc">{{ a.desc }}</div>

          <!-- 주요 지표 -->
          <div class="aq-metrics">
            <div class="metric">
              <span class="m-label">PM10</span>
              <span class="m-value" :style="{ color: getPM10Grade(a.pm10).color }">{{ a.pm10 ?? '-' }}</span>
              <span class="m-unit">㎍/㎥</span>
            </div>
            <div class="metric">
              <span class="m-label">PM2.5</span>
              <span class="m-value" :style="{ color: getPM25Grade(a.pm25).color }">{{ a.pm25 ?? '-' }}</span>
              <span class="m-unit">㎍/㎥</span>
            </div>
            <div class="metric">
              <span class="m-label">UV</span>
              <span class="m-value" :style="{ color: getUVGrade(a.uvIndex).color }">{{ a.uvIndex ?? '-' }}</span>
              <span class="m-unit">{{ getUVGrade(a.uvIndex).label }}</span>
            </div>
          </div>

          <!-- 상세 지표 (토글) -->
          <details class="aq-details">
            <summary>상세 대기 성분</summary>
            <div class="aq-sub-metrics">
              <div class="sub-metric">
                <span>🌫️ 미세먼지(PM10)</span>
                <span :style="{ color: getPM10Grade(a.pm10).color }">{{ a.pm10 }} ㎍/㎥</span>
              </div>
              <div class="sub-metric">
                <span>💨 초미세먼지(PM2.5)</span>
                <span :style="{ color: getPM25Grade(a.pm25).color }">{{ a.pm25 }} ㎍/㎥</span>
              </div>
              <div class="sub-metric">
                <span>🚗 이산화질소(NO₂)</span>
                <span>{{ a.no2 }} ㎍/㎥</span>
              </div>
              <div class="sub-metric">
                <span>🏭 아황산가스(SO₂)</span>
                <span>{{ a.so2 }} ㎍/㎥</span>
              </div>
              <div class="sub-metric">
                <span>☀️ 오존(O₃)</span>
                <span>{{ a.o3 }} ㎍/㎥</span>
              </div>
              <div class="sub-metric">
                <span>🔥 일산화탄소(CO)</span>
                <span>{{ a.co }} ㎍/㎥</span>
              </div>
              <div class="sub-metric">
                <span>📡 유럽 대기질 지수</span>
                <span :style="{ color: getEAQIGrade(a.eaqi).color }">{{ a.eaqi }} ({{ getEAQIGrade(a.eaqi).label }})</span>
              </div>
            </div>
          </details>
        </div>
      </div>

      <!-- 건강 권고 -->
      <div class="advisory" v-if="worstGrade.label !== '좋음'">
        <div class="advisory-icon">{{ worstGrade.emoji }}</div>
        <div class="advisory-text">
          <div class="advisory-title">🩺 건강 권고</div>
          <div class="advisory-desc">
            현재 일부 지역 대기질이 <strong :style="{ color: worstGrade.color }">{{ worstGrade.label }}</strong>입니다.
            <span v-if="worstGrade.label === '매우나쁨' || worstGrade.label === '최악'">
              야외활동을 자제하고 마스크를 착용하세요.
            </span>
            <span v-else-if="worstGrade.label === '나쁨'">
              호흡기 질환자, 어린이, 노약자는 야외활동에 주의하세요.
            </span>
            <span v-else>
              민감군은 장시간 야외활동에 유의하세요.
            </span>
          </div>
        </div>
      </div>

      <div class="data-source">
        데이터 출처: Open-Meteo Air Quality API (CAMS 기반)<br>
        호출시각: {{ fetchedAt }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchHighwayAirQuality, getPM10Grade, getPM25Grade, getEAQIGrade, getUVGrade } from '../lib/api.js'

const loading = ref(false)
const error = ref('')
const aqData = ref([])
const fetchedAt = ref('')

const avgPM10 = computed(() => {
  const valid = aqData.value.filter(a => a.pm10 != null)
  if (!valid.length) return '-'
  return Math.round(valid.reduce((s, a) => s + a.pm10, 0) / valid.length)
})

const avgPM25 = computed(() => {
  const valid = aqData.value.filter(a => a.pm25 != null)
  if (!valid.length) return '-'
  return (Math.round(valid.reduce((s, a) => s + a.pm25, 0) / valid.length * 10) / 10).toFixed(1)
})

const avgPM10Grade = computed(() => getPM10Grade(Number(avgPM10.value) || null))

const worstGrade = computed(() => {
  const valid = aqData.value.filter(a => a.pm10 != null)
  if (!valid.length) return { label: '-', color: '#ccc', emoji: '❓' }
  const max = Math.max(...valid.map(a => a.pm10))
  return getPM10Grade(max)
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    aqData.value = await fetchHighwayAirQuality()
    fetchedAt.value = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.aq-page { min-height: 100dvh; background: #f5f5f5; padding-bottom: 40px; }

.page-nav {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #1B355A; color: #fff;
  position: sticky; top: 0; z-index: 10;
}
.btn-back { background: none; border: none; color: #4D9BC6; font-size: 14px; font-weight: 600; cursor: pointer; }
.nav-title { margin: 0; font-size: 15px; font-weight: 700; }
.nav-spacer { flex: 1; }

.summary-bar { display: flex; background: #fff; padding: 16px; border-bottom: 1px solid #eee; }
.summary-item { flex: 1; text-align: center; border-right: 1px solid #eee; }
.summary-item:last-child { border-right: none; }
.summary-num { display: block; font-size: 22px; font-weight: 800; color: #1B355A; }
.summary-label { display: block; font-size: 10px; color: #999; margin-top: 2px; }

.legend { background: #fff; padding: 10px 16px; border-bottom: 1px solid #eee; display: flex; flex-direction: column; gap: 6px; }
.legend-row { display: flex; align-items: center; gap: 8px; }
.legend-label { font-size: 11px; color: #888; font-weight: 600; white-space: nowrap; }
.legend-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.ltag { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }

.aq-list { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.aq-card {
  background: #fff; border-radius: 14px; padding: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  border-left: 4px solid #22C55E;
}
.aq-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.aq-name { font-size: 16px; font-weight: 800; color: #1B355A; }
.aq-badges { display: flex; gap: 4px; }
.aq-badge { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 6px; color: #fff; }
.aq-desc { font-size: 11px; color: #aaa; margin-bottom: 10px; }

.aq-metrics { display: flex; gap: 6px; }
.metric {
  flex: 1; background: #f8f9fa; border-radius: 10px; padding: 10px 6px;
  text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.m-label { font-size: 10px; color: #888; font-weight: 600; }
.m-value { font-size: 20px; font-weight: 800; }
.m-unit { font-size: 9px; color: #aaa; }

.aq-details { margin-top: 10px; }
.aq-details summary {
  font-size: 12px; color: #4D9BC6; font-weight: 600; cursor: pointer;
  padding: 6px 0;
}
.aq-sub-metrics { display: flex; flex-direction: column; gap: 4px; padding-top: 6px; }
.sub-metric {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; color: #666; padding: 4px 8px;
  background: #f8f9fa; border-radius: 6px;
}
.sub-metric span:last-child { font-weight: 700; color: #1B355A; }

.advisory {
  margin: 12px; background: #FEF3C7; border: 1px solid #F59E0B;
  border-radius: 12px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;
}
.advisory-icon { font-size: 28px; flex-shrink: 0; }
.advisory-title { font-weight: 700; color: #92400E; font-size: 14px; }
.advisory-desc { font-size: 12px; color: #78350F; margin-top: 4px; line-height: 1.5; }

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

.data-source { text-align: center; padding: 20px; font-size: 11px; color: #ccc; line-height: 1.6; }
</style>
