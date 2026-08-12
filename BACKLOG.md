# Service Area Hub 개선 백로그

> service-area.nutalk.co.kr — 전국 고속도로 휴게소 종합 정보 허브
> 우선순위: 🔴 높음 / 🟡 보통 / 🟢 낮음
> 상태: ⬜ 미시작 / 🔧 진행 중 / ✅ 완료

---

## 🔴 높음 (High)

### 1. ⬜ 이벤트/브랜드 데이터 자동 캐싱 파이프라인
- **설명:** 한국도로공사 API 데이터를 자동 갱신하는 캐시 시스템 구축
- **방법:** GitHub Actions 크론 → API 호출 → `public/events-data.json`, `public/brands-data.json` 갱신 → 배포
- **현재:** 클라이언트에서 `/events-data.json` 우선 조회, 실패 시 API 호출 (수동 갱신)
- **기대효과:** API 장애 대응, 로딩 속도 향상, 트래픽 절약

### 2. ⬜ 홈페이지 정보 밀도 개선 — 그룹화 및 요약
- **설명:** 18개 카드가 단일 리스트로 나열되어 압도적
- **방법:** 카테고리별 그룹핑 (검색/이벤트, 날씨/안전, 교통/분석), 즐겨찾기 기능
- **현재:** HomePage에 18개 버튼이 세로로 나열
- **기대효과:** 정보 탐색 효율성 향상, 이탈률 감소

### 3. ⬜ 휴게소 상세 페이지 구현
- **설명:** 개별 휴게소 클릭 시 통합 정보 페이지 없음
- **방법:** `/restarea/:name` 라우트 추가, 편의시설/브랜드/이벤트/날씨 통합 표시
- **현재:** SearchPage에서 검색만 가능, 상세 페이지 없음
- **기대효과:** 체류 시간 증가, 검색 SEO 강화

### 4. ⬜ 다크모드 지원
- **설명:** 현재 다크 그라데이션 헤더 + 라이트 본문 고정
- **방법:** CSS 변수 토글, `prefers-color-scheme` 감지, localStorage 저장
- **현재:** 고정 컬러 스킴 (`#1B355A` 헤더, 흰색 카드)
- **기대효과:** 야간 주행 시 눈 부담 감소, 사용자 선택권

### 5. ⬜ Open Graph 이미지 및 SEO 강화
- **설명:** og:image 미설정, 페이지별 메타 부재
- **방법:** 동적 OG 이미지 생성, 페이지별 title/description
- **현재:** og:title/og:description만 있고 og:image 없음
- **기대효과:** 공유 클릭률 향상, 검색 가시성

---

## 🟡 보통 (Medium)

### 6. ⬜ PWA 적용 및 오프라인 지원
- **설명:** 고속도로 주행 중 오프라인 환경 대응
- **방법:** manifest.json + Workbox service worker (stale-while-revalidate)
- **현재:** PWA 설정 없음
- **기대효과:** 약환경에서도 핵심 정보 접근 가능

### 7. ⬜ 날씨 API 캐싱 및 에러 핸들링
- **설명:** Open-Meteo API 호출이 많고 에러 처리 미흡
- **방법:** 날씨 데이터 10분 캐싱, 로딩 스켈레톤, 에러 fallback UI
- **현재:** WeatherPage, WeeklyWeatherPage 등에서 직접 API 호출
- **기대효과:** 로딩 속도 향상, 안정성 증가

### 8. ⬜ 교통량 데이터 시각화 개선
- **설명:** 차트나 그래프 없이 텍스트/표 위주
- **방법:** Chart.js 또는 D3.js로 시간대별 교통량 차트
- **현재:** TrafficPage, RouteTrafficPage에서 표 형태만 표시
- **기대효과:** 데이터 이해도 향상

### 9. ⬜ 휴게소 즐겨찾기 / 최근 검색
- **설명:** 자주 가는 휴게소 저장 기능
- **방법:** localStorage 기반 즐겨찾기, 홈화면 단축 추가
- **기대효과:** 재방문율, 사용자 편의성

### 10. ⬜ 테스트 커버리지 확대
- **설명:** vitest 설정은 있으나 테스트 케이스 부족
- **방법:** api.js 함수 테스트, 컴포넌트 렌더링 테스트 작성
- **현재:** `vitest` devDependency만 있고 테스트 파일 수 미확인
- **기대효과:** 코드 품질 보장, 회귀 방지

### 11. ⬜ 반응형 개선 — 태블릿/데스크톱
- **설명:** 모바일 중심 레이아웃, 넓은 화면 대응 부족
- **방법:** 브레이크포인트 추가, 2열 그리드, 사이드 네비게이션
- **현재:** `max-width: 480px` 단일열
- **기대효과:** 다양한 디바이스 대응

---

## 🟢 낮음 (Low)

### 12. ⬜ 다국어 지원 (i18n)
- **설명:** 영어 지원
- **방법:** vue-i18n, 외국인 운전자 대상
- **기대효과:** 외국인 접근성

### 13. ⬜ 접근성(a11y) 강화
- **설명:** 스크린 리더, 키보드 내비게이션
- **방법:** aria-label 보완, focus-visible, tab index
- **현재:** 일부 aria-label 적용됨
- **기대효과:** 웹 접근성 준수

### 14. ⬜ 휴게소 리뷰 / 평점
- **설명:** 사용자 리뷰 기능
- **방법:** 백엔드 API 또는 localStorage
- **기대효과:** 사용자 참여, 신뢰성 있는 정보

### 15. ⬜ 고속도로 경로 추천
- **설명:** 출발지-도착지 기반 휴게소 추천
- **방법:** 경로 API 연동, 중간 휴게소 필터링
- **기대효과:** 여행 계획 기능 확장

### 16. ⬜ 분석/통계 추가
- **설명:** 사용자 검색 패턴, 인기 휴게소 분석
- **방법:** GA4 이벤트 추적
- **기대효과:** 데이터 기반 서비스 개선

---

## 완료됨 (Done)

### ✅ 핵심 기능 (18개 페이지)
- HomePage (18개 정보 카드, 통합 검색 강조)
- SearchPage (휴게소 통합 검색)
- EventsPage (휴게소 이벤트 조회)
- BrandPage (브랜드 매장 정보)
- ConvPage (편의시설 검색)
- TrafficPage (수도권 관문 교통량)
- RouteTrafficPage (노선별 교통량 분석)
- DrivingSafetyPage (운전안전 지수)
- WeatherPage (실시간 날씨)
- WeeklyWeatherPage (주간 날씨)
- AirQualityPage (대기질 정보)
- MinutelyForecastPage (단기 강수 예보)
- FloodRiskPage (하천 범람 위험)
- RoadSurfacePage (노면 상태 예측)
- CoastalSeaPage (해안 해상 정보)
- ElevationPage (표고 프로파일)
- WeatherModelPage (멀티모델 예보 비교)
- WeatherHistoryPage (기상 이력 분석)
- ThunderstormPage (뇌우 예보)
- NasaWeatherPage (NASA 위성 관측)

### ✅ API 연동
- 한국도로공사 공공 API (이벤트, 브랜드, 편의시설, 교통량)
- Open-Meteo API (날씨, 대기질, 해상, 토양, 홍수, 고도, 뇌우)
- 정적 캐시 폴백 시스템

### ✅ UI/UX
- 모바일 최적화 레이아웃 (`max-width: 480px`)
- 카드형 정보 디자인
- 동적 파비콘 (SVG emoji)
- Cache-Control 헤더 설정

### ✅ 인프라
- Vue 3 + Vite 8 + Vue Router 4
- vitest 테스트 환경
- 기본 SEO 메타 (description, og:title, og:description)
- robots.txt, _headers, _redirects

---

_최종 업데이트: 2026-07-01_
