# 🛣️ 고속도로 정보 허브

> 전국 고속도로 휴게소 · 교통량 · 날씨 종합 정보

## 🌐 서비스 URL
- **메인:** https://service-area.nutalk.co.kr
- **Pages:** https://service-area-nutalk.pages.dev

## 📋 소개
공공데이터 API를 활용하여 전국 고속도로 휴게소 정보, 이벤트, 날씨, 교통량을 실시간으로 제공하는 허브 서비스입니다.

## ✨ 주요 기능
- 🎉 **휴게소 이벤트** — 전국 휴게소 진행 중인 이벤트 조회
- 🏪 **브랜드 매장** — 휴게소별 입점 브랜드 (할리스, CU, 롯데리아 등)
- 🛎️ **편의시설** — 수유실, 샤워실, 경정비 등
- 🚦 **운전안전 지수** — 가시거리·돌풍·적설 종합 분석
- 🌤️ **고속도로 날씨** — 전국 주요 지점 실시간 날씨
- 📊 **수도권 관문 교통량** — 6대 관문 시간대별 통행량
- 🛣️ **노선별 교통량** — 19개 노선 상세 분석
- ⛽ **주유소/충전소** — 휴게소별 유가 정보
- ⛈️ **상세 기상** — 낙뢰, 도로면, 홍수위험, 해안 해상 등

## 🛠 기술 스택
- **Frontend:** Vue 3 + Vite + vue-router
- **배포:** Cloudflare Pages (cron 00시/12시 데이터 갱신)
- **디자인:** hub-design-guide (밝은 테마)
- **데이터:** 공공데이터포털, 한국도로공사, Open-Meteo

## 📂 구조
```
src/
├── lib/api.js          # API 호출 + 캐시 + 유틸리티
├── router/index.js     # 라우트 정의
├── views/              # 20개 페이지 (Home, Events, Weather, Traffic 등)
└── style.css           # 글로벌 테마
public/
├── _redirects          # SPA 폴백
├── _headers            # 캐시 정책
└── events-data.json    # 정적 캐시
```

## 🔄 데이터 갱신
- **크론잡:** 매일 00시/12시 KST 자동 갱신
- 공공데이터 API 호출 → JSON 캐시 → 빌드 → 배포

## 🔗 관련
- **메인 허브:** https://hub.nutalk.co.kr
- **GitHub:** https://github.com/haeseoky/service-area
