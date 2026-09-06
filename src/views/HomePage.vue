<template>
  <div class="home">
    <header class="home-header">
      <h1 class="logo">고속도로 정보 허브</h1>
      <p class="subtitle">전국 고속도로 정보를 한눈에</p>
      <p class="season-badge">2026 하계 특별교통대책 (7.25~8.10) · 휴게소 직계약 개편 추진 중</p>
    </header>

    <!-- 검색 · 휴게소 -->
    <section class="group" aria-labelledby="group-rest">
      <h2 id="group-rest" class="group-title">검색 · 휴게소</h2>
      <div class="card-grid">
        <button class="info-card search-card" @click="goSearch" aria-label="휴게소 통합검색 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.search" /></span>
          <span class="card-info">
            <span class="card-name">휴게소 통합검색</span>
            <span class="card-desc">이벤트·브랜드·편의시설 한번에 검색</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goEvents" aria-label="휴게소 이벤트 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.event" /></span>
          <span class="card-info">
            <span class="card-name">휴게소 이벤트</span>
            <span class="card-desc">전국 휴게소 진행 중인 이벤트 조회</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goBrands" aria-label="브랜드 매장 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.store" /></span>
          <span class="card-info">
            <span class="card-name">브랜드 매장</span>
            <span class="card-desc">휴게소별 입점 브랜드 (할리스, CU, 롯데리아 등)</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goFacilities" aria-label="편의시설 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.bell" /></span>
          <span class="card-info">
            <span class="card-name">편의시설</span>
            <span class="card-desc">수유실, 샤워실, 경정비 등 편의시설 검색</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>
      </div>
    </section>

    <!-- 교통 -->
    <section class="group" aria-labelledby="group-traffic">
      <h2 id="group-traffic" class="group-title">교통</h2>
      <div class="card-grid">
        <button class="info-card" @click="goTraffic" aria-label="수도권 관문 교통량 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.chart" /></span>
          <span class="card-info">
            <span class="card-name">수도권 관문 교통량</span>
            <span class="card-desc">6대 관문 시간대별·차종별 통행량</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goRouteTraffic" aria-label="노선별 교통량 분석 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.route" /></span>
          <span class="card-info">
            <span class="card-name">노선별 교통량 분석</span>
            <span class="card-desc">19개 노선 전 영업소·차종·시간대별 상세 분석</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>
      </div>
    </section>

    <!-- 날씨 -->
    <section class="group" aria-labelledby="group-weather">
      <h2 id="group-weather" class="group-title">날씨</h2>
      <div class="card-grid">
        <button class="info-card" @click="goWeather" aria-label="고속도로 날씨 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.sun" /></span>
          <span class="card-info">
            <span class="card-name">고속도로 날씨</span>
            <span class="card-desc">전국 주요 지점 실시간 날씨</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goWeeklyWeather" aria-label="고속도로 주간날씨 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.calendar" /></span>
          <span class="card-info">
            <span class="card-name">고속도로 주간날씨</span>
            <span class="card-desc">7일 전망·일출/일몰·자외선·강수확률</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goAirQuality" aria-label="고속도로 대기질 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.wind" /></span>
          <span class="card-info">
            <span class="card-name">고속도로 대기질</span>
            <span class="card-desc">미세먼지·초미세먼지·자외선·대기 성분</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goWeatherModel" aria-label="멀티모델 예보 비교 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.layers" /></span>
          <span class="card-info">
            <span class="card-name">멀티모델 예보 비교</span>
            <span class="card-desc">3대 기상모델 예보 비교·신뢰도 분석</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goMinutelyForecast" aria-label="단기 강수·시정 예보 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.clock" /></span>
          <span class="card-info">
            <span class="card-name">단기 강수·시정 예보</span>
            <span class="card-desc">15분 단위 강수·가시거리 예측, 앞으로 4시간</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goWeatherHistory" aria-label="기상 이력 분석 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.history" /></span>
          <span class="card-info">
            <span class="card-name">기상 이력 분석</span>
            <span class="card-desc">최근 7일 관측 데이터·기온 추이·강수 패턴</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goThunderstorm" aria-label="뇌우·대기불안정 예보 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.zap" /></span>
          <span class="card-info">
            <span class="card-name">뇌우·대기불안정 예보</span>
            <span class="card-desc">낙뢰·뇌우 발생 가능성 종합 분석</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>
      </div>
    </section>

    <!-- 안전 · 도로 환경 -->
    <section class="group" aria-labelledby="group-safety">
      <h2 id="group-safety" class="group-title">안전 · 도로 환경</h2>
      <div class="card-grid">
        <button class="info-card" @click="goDrivingSafety" aria-label="운전안전 지수 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.shield" /></span>
          <span class="card-info">
            <span class="card-name">운전안전 지수</span>
            <span class="card-desc">가시거리·돌풍·적설 종합 안전 점수</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goRoadSurface" aria-label="노면 상태 예측 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.thermometer" /></span>
          <span class="card-info">
            <span class="card-name">노면 상태 예측</span>
            <span class="card-desc">노면 온도·수분 기반 결빙/과열 위험 분석</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goFloodRisk" aria-label="하천 범람 위험 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.waves" /></span>
          <span class="card-info">
            <span class="card-name">하천 범람 위험</span>
            <span class="card-desc">도로 인근 하천 홍수·유량 예측 정보</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goCoastalSea" aria-label="해안 해상 정보 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.anchor" /></span>
          <span class="card-info">
            <span class="card-name">해안 해상 정보</span>
            <span class="card-desc">파고·너울·수온으로 보는 해안 도로 주행 위험</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>

        <button class="info-card" @click="goElevation" aria-label="표고 프로파일 페이지로 이동">
          <span class="card-icon" aria-hidden="true"><Icon :d="icons.mountain" /></span>
          <span class="card-info">
            <span class="card-name">표고 프로파일</span>
            <span class="card-desc">해발 고도·경사도·산악 구간 분석</span>
          </span>
          <span class="card-badge" aria-hidden="true">GO</span>
        </button>
      </div>
    </section>

    <!-- 여름 휴가철 팁 배너 -->
    <div class="season-tips">
      <h2>여름 휴가철 휴게소 이용 팁</h2>
      <ul>
        <li><strong>피크 시간대 피하기</strong> — 11시~14시 혼잡, 새벽·심시 이용 권장</li>
        <li><strong>실시간 교통량 확인</strong> — 수도권 관문 교통량 페이지에서 출발 전 확인</li>
        <li><strong>휴게소 이벤트 활용</strong> — 안성·여주·용인 등에서 경품 추첨 및 할인 혜택 진행 중</li>
        <li><strong>휴게소 개편 소식</strong> — 도로공사가 8곳 시범 휴게소와 직접 계약, 12월 개장 목표로 8월 입찰 공고 예정</li>
        <li><strong>안전 운전</strong> — 2시간마다 휴게소에서 15분 휴식, 졸음운전 예방 얼음물 제공</li>
      </ul>
    </div>

    <div class="footer-info">
      <p>공공 데이터로 운영됩니다 · 데이터 갱신: 2026.08.13</p>
      <p class="footer-link">service-area.nutalk.co.kr</p>
    </div>
  </div>
</template>

<script setup>
import { h } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const goSearch = () => router.push('/search')
const goEvents = () => router.push('/events')
const goBrands = () => router.push('/brands')
const goFacilities = () => router.push('/facilities')
const goTraffic = () => router.push('/traffic')
const goRouteTraffic = () => router.push('/route-traffic')
const goWeather = () => router.push('/weather')
const goWeeklyWeather = () => router.push('/weekly-weather')
const goAirQuality = () => router.push('/air-quality')
const goWeatherModel = () => router.push('/weather-model')
const goMinutelyForecast = () => router.push('/minutely-forecast')
const goWeatherHistory = () => router.push('/weather-history')
const goThunderstorm = () => router.push('/thunderstorm')
const goDrivingSafety = () => router.push('/driving-safety')
const goRoadSurface = () => router.push('/road-surface')
const goFloodRisk = () => router.push('/flood-risk')
const goCoastalSea = () => router.push('/coastal-sea')
const goElevation = () => router.push('/elevation')

const Icon = {
  props: { d: { type: String, required: true } },
  setup(props) {
    return () => h('svg', {
      viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      'aria-hidden': 'true', innerHTML: props.d
    })
  }
}

const icons = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>',
  event: '<path d="M2 22h20"/><path d="M4.5 22V8a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v14"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M9 12h6"/><path d="M9 16h2"/>',
  store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v-4"/><path d="M11 15V8"/><path d="M15 15v-6"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/>',
  wind: '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  thermometer: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
  waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  anchor: '<circle cx="12" cy="5" r="3"/><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
  mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>'
}
</script>

<style scoped>
.home {
  min-height: 100dvh;
  background: #1B355A linear-gradient(180deg, #1B355A 0%, #224070 26%, #f5f5f5 26%);
  padding-bottom: 40px;
}

.home-header {
  text-align: center;
  padding: 40px 20px 24px;
  color: #fff;
}

.logo { font-size: 26px; font-weight: 700; }
.subtitle { font-size: 14px; opacity: 0.7; margin-top: 4px; }

.group {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 20px;
}
.group + .group { margin-top: 22px; }
.group-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #4D9BC6;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.card-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1px solid #E3E9F0;
  border-left: 3px solid #4D9BC6;
  border-radius: 8px;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  width: 100%;
}
.info-card:hover,
.info-card:focus-visible { border-color: #4D9BC6; background: #F6FAFD; outline: none; }
.info-card:active { transform: scale(0.985); }

.search-card {
  background: #1B355A;
  border: 1px solid #4D9BC6;
  border-left: 3px solid #7FB8D9;
}
.search-card .card-name { color: #fff; }
.search-card .card-desc { color: #a8c4e0; }
.search-card .card-icon { background: rgba(77,155,198,0.25); color: #cfe6f5; }
.search-card .card-badge { background: #4D9BC6; color: #fff; }

.card-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F0F6FB;
  border-radius: 8px;
  color: #1B355A;
}
.card-icon svg { width: 22px; height: 22px; }

.card-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.card-name { font-size: 15px; font-weight: 700; color: #1B355A; }
.card-desc { font-size: 12px; color: #7d8b9a; margin-top: 2px; }

.card-badge { flex-shrink: 0; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
.card-badge.playable, .card-badge { background: #E8F5E9; color: #1E7B45; }

.season-badge {
  display: inline-block;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 12px;
  color: #e0f0ff;
  margin-top: 10px;
}

.season-tips {
  max-width: 480px;
  margin: 26px auto 0;
  padding: 20px;
  background: #fff;
  border: 1px solid #E3E9F0;
  border-radius: 8px;
}
.season-tips h2 { font-size: 16px; font-weight: 700; color: #1B355A; margin-bottom: 12px; }
.season-tips ul { list-style: none; padding: 0; margin: 0; }
.season-tips li { font-size: 13px; color: #555; line-height: 1.6; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
.season-tips li:last-child { border-bottom: none; }
.season-tips li strong { color: #1B355A; }

.footer-info { text-align: center; margin-top: 28px; color: #aaa; font-size: 12px; }
.footer-link { margin-top: 4px; color: #4D9BC6; }

@media (prefers-reduced-motion: reduce) {
  .info-card { transition: none; }
}
</style>
