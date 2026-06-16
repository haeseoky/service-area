<template>
  <div class="home">
    <header class="home-header">
      <h1 class="logo">🛣️ 고속도로 정보 허브</h1>
      <p class="subtitle">전국 고속도로 정보를 한눈에</p>
    </header>

    <div class="card-grid">
      <!-- 🔍 통합검색 (강조) -->
      <button class="info-card search-card" @click="goSearch">
        <div class="card-icon">🔍</div>
        <div class="card-info">
          <div class="card-name">휴게소 통합검색</div>
          <div class="card-desc">이벤트·브랜드·편의시설 한번에 검색</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goEvents">
        <div class="card-icon">🎉</div>
        <div class="card-info">
          <div class="card-name">휴게소 이벤트</div>
          <div class="card-desc">전국 휴게소 진행 중인 이벤트 조회</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goTraffic">
        <div class="card-icon">📊</div>
        <div class="card-info">
          <div class="card-name">수도권 관문 교통량</div>
          <div class="card-desc">6대 관문 시간대별·차종별 통행량</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goRouteTraffic">
        <div class="card-icon">🛣️</div>
        <div class="card-info">
          <div class="card-name">노선별 교통량 분석</div>
          <div class="card-desc">19개 노선 전 영업소·차종·시간대별 상세 분석</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goBrands">
        <div class="card-icon">🏪</div>
        <div class="card-info">
          <div class="card-name">브랜드 매장</div>
          <div class="card-desc">휴게소별 입점 브랜드 (할리스, CU, 롯데리아 등)</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goFacilities">
        <div class="card-icon">🛎️</div>
        <div class="card-info">
          <div class="card-name">편의시설</div>
          <div class="card-desc">수유실, 샤워실, 경정비 등 편의시설 검색</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goDrivingSafety">
        <div class="card-icon">🚦</div>
        <div class="card-info">
          <div class="card-name">운전안전 지수</div>
          <div class="card-desc">가시거리·돌풍·적설 종합 분석 안전 점수</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goWeather">
        <div class="card-icon">🌤️</div>
        <div class="card-info">
          <div class="card-name">고속도로 날씨</div>
          <div class="card-desc">전국 주요 지점 실시간 날씨</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goAirQuality">
        <div class="card-icon">🌬️</div>
        <div class="card-info">
          <div class="card-name">고속도로 대기질</div>
          <div class="card-desc">PM10·PM2.5·자외선·대기성분 정보</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goWeeklyWeather">
        <div class="card-icon">📅</div>
        <div class="card-info">
          <div class="card-name">고속도로 주간날씨</div>
          <div class="card-desc">7일 전망·일출/일몰·자외선·강수확률</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goFloodRisk">
        <div class="card-icon">🌊</div>
        <div class="card-info">
          <div class="card-name">하천 범람 위험</div>
          <div class="card-desc">고속도로 인근 하천 유량·홍수 예측 (Open-Meteo Flood API)</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goRoadSurface">
        <div class="card-icon">🌡️</div>
        <div class="card-info">
          <div class="card-name">노면 상태 예측</div>
          <div class="card-desc">표면 온도·수분·결빙/과열 위험 분석 (Open-Meteo Soil API)</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goCoastalSea">
        <div class="card-icon">🏖️</div>
        <div class="card-info">
          <div class="card-name">해안 해상 정보</div>
          <div class="card-desc">파고·너울·수온 — 해안 고속도로 주행 위험 (Open-Meteo Marine API)</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goElevation">
        <div class="card-icon">⛰️</div>
        <div class="card-info">
          <div class="card-name">표고 프로파일</div>
          <div class="card-desc">전국 고속도로 해발 고도·경사도·산악 구간 분석 (Open-Meteo Elevation API)</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goWeatherModel">
        <div class="card-icon">🔮</div>
        <div class="card-info">
          <div class="card-name">멀티모델 예보 비교</div>
          <div class="card-desc">GFS·ICON·ECMWF 3대 모델 예보 비교·신뢰도 분석</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>

      <button class="info-card" @click="goWeatherHistory">
        <div class="card-icon">📉</div>
        <div class="card-info">
          <div class="card-name">기상 이력 분석</div>
          <div class="card-desc">과거 7일 기상 관측 데이터·기온 추이·강수 패턴 분석 (Open-Meteo ERA5 Archive)</div>
        </div>
        <div class="card-badge playable">GO</div>
      </button>
    </div>

    <div class="footer-info">
      <p>🚀 공공 데이터로 운영됩니다</p>
      <p class="footer-link">service-area.nutalk.co.kr</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goSearch() { router.push('/search') }
function goEvents() { router.push('/events') }
function goTraffic() { router.push('/traffic') }
function goRouteTraffic() { router.push('/route-traffic') }
function goDrivingSafety() { router.push('/driving-safety') }
function goBrands() { router.push('/brands') }
function goFacilities() { router.push('/facilities') }
function goWeather() { router.push('/weather') }
function goAirQuality() { router.push('/air-quality') }
function goWeeklyWeather() { router.push('/weekly-weather') }
function goFloodRisk() { router.push('/flood-risk') }
function goRoadSurface() { router.push('/road-surface') }
function goCoastalSea() { router.push('/coastal-sea') }
function goElevation() { router.push('/elevation') }
function goWeatherModel() { router.push('/weather-model') }
function goWeatherHistory() { router.push('/weather-history') }
</script>

<style scoped>
.home {
  min-height: 100dvh;
  background: linear-gradient(180deg, #1B355A 0%, #2A4A72 30%, #f5f5f5 30%);
  padding-bottom: 40px;
}

.home-header {
  text-align: center;
  padding: 40px 20px 24px;
  color: #fff;
}

.logo { font-size: 26px; font-weight: 800; }
.subtitle { font-size: 14px; opacity: 0.7; margin-top: 4px; }

.card-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  max-width: 480px;
  margin: 0 auto;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: none;
  border-radius: 14px;
  padding: 16px 18px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.12s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  width: 100%;
}
.info-card:active { transform: scale(0.98); }

.search-card {
  background: linear-gradient(135deg, #1B355A 0%, #2A4A72 100%);
  border: 2px solid #4D9BC6;
}
.search-card .card-name { color: #fff; }
.search-card .card-desc { color: #a8c4e0; }
.search-card .card-icon { background: rgba(77,155,198,0.2); }
.search-card .card-badge { background: #4D9BC6; color: #fff; }

.card-icon {
  font-size: 32px;
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f5fa;
  border-radius: 12px;
}

.card-info { flex: 1; min-width: 0; }
.card-name { font-size: 15px; font-weight: 700; color: #1B355A; }
.card-desc { font-size: 12px; color: #888; margin-top: 2px; }

.card-badge { flex-shrink: 0; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; }
.card-badge.playable { background: #E8F5E9; color: #16A34A; }

.footer-info { text-align: center; margin-top: 28px; color: #aaa; font-size: 12px; }
.footer-link { margin-top: 4px; color: #4D9BC6; }
</style>
