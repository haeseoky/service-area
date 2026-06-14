<template>
  <div class="home">
    <header class="home-header">
      <h1 class="logo">🛣️ 고속도로 정보 허브</h1>
      <p class="subtitle">전국 고속도로 정보를 한눈에</p>
    </header>

    <div class="card-grid">
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

      <div class="info-card disabled">
        <div class="card-icon">⛽</div>
        <div class="card-info">
          <div class="card-name">주유소 가격</div>
          <div class="card-desc">휴게소별 유류 가격 정보 (준비 중)</div>
        </div>
        <div class="card-badge soon">SOON</div>
      </div>

      <div class="info-card disabled">
        <div class="card-icon">🍽️</div>
        <div class="card-info">
          <div class="card-name">음식 메뉴</div>
          <div class="card-desc">휴게소별 식당 메뉴 정보 (준비 중)</div>
        </div>
        <div class="card-badge soon">SOON</div>
      </div>
    </div>

    <div class="footer-info">
      <p>🚀 더 많은 정보가 추가됩니다!</p>
      <p class="footer-link">service-area.nutalk.co.kr</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goEvents() { router.push('/events') }
function goTraffic() { router.push('/traffic') }
</script>

<style scoped>
.home {
  min-height: 100dvh;
  background: linear-gradient(180deg, #1B355A 0%, #2A4A72 35%, #f5f5f5 35%);
  padding-bottom: 40px;
}

.home-header {
  text-align: center;
  padding: 40px 20px 28px;
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
.info-card.disabled { cursor: default; opacity: 0.6; }
.info-card.disabled:active { transform: none; }

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
.card-badge.soon { background: #F5F5F5; color: #999; }

.footer-info { text-align: center; margin-top: 28px; color: #aaa; font-size: 12px; }
.footer-link { margin-top: 4px; color: #4D9BC6; }
</style>
