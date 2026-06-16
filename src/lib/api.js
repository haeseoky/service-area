// 한국도로공사 공공 API
const API_BASE = 'https://data.ex.co.kr/openapi'
const API_KEY = '0105398808'

// ─── 휴게소 이벤트 ───
const EVENT_URL = `${API_BASE}/restinfo/restEventList`

export async function fetchEvents({ numOfRows = 1000, pageNo = 1, routeNm, stdRestNm } = {}) {
  // 1) 정적 캐시 우선 (매일 갱신)
  try {
    const cacheRes = await fetch('/events-data.json?t=' + Date.now())
    if (cacheRes.ok) {
      const cached = await cacheRes.json()
      if (cached.list && cached.list.length > 0) return cached
    }
  } catch {}

  // 2) 실시간 API 폴백
  const params = new URLSearchParams({ key: API_KEY, type: 'json', numOfRows: String(numOfRows), pageNo: String(pageNo) })
  if (routeNm) params.append('routeNm', routeNm)
  if (stdRestNm) params.append('stdRestNm', stdRestNm)
  const res = await fetch(`${EVENT_URL}?${params}`)
  if (!res.ok) throw new Error(`API 오류: ${res.status}`)
  const data = await res.json()
  if (data.code !== 'SUCCESS') throw new Error(data.message || 'API 호출 실패')
  return data
}

export function filterActive(events, today = new Date()) {
  const dateStr = today.toISOString().slice(0, 10)
  return (events || []).filter(e => e.stime <= dateStr && e.etime >= dateStr)
}

export function groupByRestArea(events) {
  const map = new Map()
  for (const e of events || []) {
    if (!map.has(e.stdRestNm)) map.set(e.stdRestNm, [])
    map.get(e.stdRestNm).push(e)
  }
  return map
}

export function groupByRoute(events) {
  const map = new Map()
  for (const e of events || []) {
    if (!map.has(e.routeNm)) map.set(e.routeNm, [])
    map.get(e.routeNm).push(e)
  }
  return map
}

// ─── 휴게소 브랜드 매장 ───
const BRAND_URL = `${API_BASE}/restinfo/restBrandList`

export async function fetchBrands({ numOfRows = 1000, pageNo = 1, stdRestNm, routeNm } = {}) {
  const params = new URLSearchParams({ key: API_KEY, type: 'json', numOfRows: String(numOfRows), pageNo: String(pageNo) })
  if (stdRestNm) params.append('stdRestNm', stdRestNm)
  if (routeNm) params.append('routeNm', routeNm)
  const res = await fetch(`${BRAND_URL}?${params}`)
  if (!res.ok) throw new Error(`API 오류: ${res.status}`)
  const data = await res.json()
  if (data.code !== 'SUCCESS') throw new Error(data.message || 'API 호출 실패')
  return data
}

export function groupBrandsByRestArea(brands) {
  const map = new Map()
  for (const b of brands || []) {
    if (!map.has(b.stdRestNm)) {
      map.set(b.stdRestNm, { name: b.stdRestNm, route: b.routeNm, addr: b.svarAddr, brands: [] })
    }
    map.get(b.stdRestNm).brands.push(b)
  }
  return map
}

export function groupBrandsByName(brands) {
  const map = new Map()
  for (const b of brands || []) {
    if (!map.has(b.brdName)) {
      map.set(b.brdName, { name: b.brdName, areas: [] })
    }
    map.get(b.brdName).areas.push(b)
  }
  return map
}

// ─── 휴게소 편의시설 ───
const CONV_URL = `${API_BASE}/restinfo/restConvList`

export async function fetchConvs({ numOfRows = 2000, pageNo = 1, stdRestNm, routeNm } = {}) {
  const params = new URLSearchParams({ key: API_KEY, type: 'json', numOfRows: String(numOfRows), pageNo: String(pageNo) })
  if (stdRestNm) params.append('stdRestNm', stdRestNm)
  if (routeNm) params.append('routeNm', routeNm)
  const res = await fetch(`${CONV_URL}?${params}`)
  if (!res.ok) throw new Error(`API 오류: ${res.status}`)
  const data = await res.json()
  if (data.code !== 'SUCCESS') throw new Error(data.message || 'API 호출 실패')
  return data
}

export function groupConvsByRestArea(convs) {
  const map = new Map()
  for (const c of convs || []) {
    if (!map.has(c.stdRestNm)) {
      map.set(c.stdRestNm, { name: c.stdRestNm, route: c.routeNm, addr: c.svarAddr, facilities: [] })
    }
    map.get(c.stdRestNm).facilities.push(c)
  }
  return map
}

export function groupConvsByType(convs) {
  const map = new Map()
  for (const c of convs || []) {
    if (!map.has(c.psName)) {
      map.set(c.psName, { name: c.psName, areas: [] })
    }
    map.get(c.psName).areas.push(c)
  }
  return map
}

// ─── 카테고리 메타데이터 ───
export const BRAND_CATEGORIES = {
  '커피·디저트': ['할리스커피', '탐앤탐스', '파스쿠찌', '드롭탑(커피전문점)', '엔제리너스', '투썸플레이스', '달콤커피', '파리바게뜨', '뚜레쥬르', '크리스피크림', '앤티앤스프레즐', '나뚜루', '공차'],
  '패스트푸드': ['던킨도너츠', '롯데리아', 'BBQ', 'BBQ올리브돈까스'],
  '간식·식사': ['로띠번', '용우동'],
  '편의점': ['CU', '이마트24', 'JDX'],
  '레저·기타': ['클라이머홀릭', 'LYNX', '코바코'],
}

export function getBrandCategory(brandName) {
  for (const [cat, names] of Object.entries(BRAND_CATEGORIES)) {
    if (names.some(n => brandName.includes(n))) return cat
  }
  return '기타'
}

export const FACILITY_ICONS = {
  '수유실': '🍼',
  'ATM': '💳',
  '편의점': '🏪',
  '샤워실': '🚿',
  '쉼터': '🛋️',
  '열린매장(간식)': '🍿',
  '수면실': '😴',
  '경정비': '🔧',
  '내고장특산물': '🎁',
  'ex-화물차라운지': '🚛',
  '세탁실': '🧺',
  '세차장': '🚗',
  '휴게소의원': '🏥',
  '약국': '💊',
  '기타': '📌',
}

export function getFacilityIcon(name) {
  return FACILITY_ICONS[name] || '📍'
}

// ─── 고속도로 날씨 (Open-Meteo, 무료/키 불필요) ───
// 주요 고속도로 지점 좌표
export const HIGHWAY_POINTS = [
  { name: '서울 (경부선)', lat: 37.497, lon: 127.027, desc: '수도권 출발' },
  { name: '수원', lat: 37.263, lon: 127.028, desc: '경기 남부' },
  { name: '천안', lat: 36.815, lon: 127.114, desc: '충남 거점' },
  { name: '대전', lat: 36.354, lon: 127.376, desc: '중부 교차점' },
  { name: '대구', lat: 35.871, lon: 128.601, desc: '영남 거점' },
  { name: '부산', lat: 35.180, lon: 128.931, desc: '남해 종점' },
  { name: '광주', lat: 35.160, lon: 126.852, desc: '호남 거점' },
  { name: '전주', lat: 35.824, lon: 127.148, desc: '호남선' },
  { name: '강릉', lat: 37.751, lon: 128.876, desc: '영동선' },
  { name: '원주', lat: 37.342, lon: 127.920, desc: '영동선 거점' },
  { name: '춘천', lat: 37.881, lon: 127.730, desc: '중앙선' },
]

export async function fetchHighwayWeather() {
  const results = await Promise.all(
    HIGHWAY_POINTS.map(async (p) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&hourly=precipitation_probability&timezone=Asia/Seoul&forecast_days=1`
        const res = await fetch(url)
        if (!res.ok) throw new Error('weather fetch failed')
        const d = await res.json()
        return {
          ...p,
          temp: Math.round(d.current.temperature_2m),
          humidity: d.current.relative_humidity_2m,
          wind: Math.round(d.current.wind_speed_10m),
          precip: d.current.precipitation || 0,
          weatherCode: d.current.weather_code,
          rainProb: d.hourly?.precipitation_probability?.[new Date().getHours()] || 0,
        }
      } catch {
        return { ...p, temp: null }
      }
    })
  )
  return results
}

export const WEATHER_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  56: '🌧️', 57: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '⛈️',
  66: '🌧️', 67: '⛈️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  77: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

export function getWeatherIcon(code) {
  return WEATHER_ICONS[code] || '🌡️'
}

export const WEATHER_DESC = {
  0: '맑음', 1: '대체 맑음', 2: '부분 흐림', 3: '흐림',
  45: '안개', 48: '서리 안개',
  51: '약한 이슬비', 53: '이슬비', 55: '강한 이슬비',
  56: '약한 어는 비', 57: '강한 어는 비',
  61: '약한 비', 63: '비', 65: '강한 비',
  66: '약한 어는 비', 67: '강한 어는 비',
  71: '약한 눈', 73: '눈', 75: '강한 눈',
  77: '싸락눈',
  80: '약한 소나기', 81: '소나기', 82: '강한 소나기',
  85: '약한 눈 소나기', 86: '강한 눈 소나기',
  95: '천둥번개', 96: '우박 천둥', 99: '강한 우박 천둥',
}

export function getWeatherDesc(code) {
  return WEATHER_DESC[code] || '-'
}

// ─── 휴게소 통합 검색 ───
// 모든 데이터 소스를 통합해서 휴게소명으로 검색
export async function searchRestArea(query) {
  if (!query || query.trim().length < 2) return null

  const q = query.trim()
  const KEY = API_KEY

  // 병렬로 모든 API 호출
  const [eventsRes, brandsRes, convsRes] = await Promise.allSettled([
    fetch(`${EVENT_URL}?key=${KEY}&type=json&numOfRows=1000&stdRestNm=${encodeURIComponent(q)}`).then(r => r.json()),
    fetch(`${BRAND_URL}?key=${KEY}&type=json&numOfRows=1000&stdRestNm=${encodeURIComponent(q)}`).then(r => r.json()),
    fetch(`${CONV_URL}?key=${KEY}&type=json&numOfRows=2000&stdRestNm=${encodeURIComponent(q)}`).then(r => r.json()),
  ])

  const events = eventsRes.status === 'fulfilled' ? (eventsRes.value.list || []) : []
  const brands = brandsRes.status === 'fulfilled' ? (brandsRes.value.list || []) : []
  const facilities = convsRes.status === 'fulfilled' ? (convsRes.value.list || []) : []

  // 휴게소별로 통합
  const areaMap = new Map()

  for (const e of events) {
    if (!areaMap.has(e.stdRestNm)) {
      areaMap.set(e.stdRestNm, { name: e.stdRestNm, route: e.routeNm, addr: e.svarAddr, events: [], brands: [], facilities: [] })
    }
    areaMap.get(e.stdRestNm).events.push(e)
  }

  for (const b of brands) {
    if (!areaMap.has(b.stdRestNm)) {
      areaMap.set(b.stdRestNm, { name: b.stdRestNm, route: b.routeNm, addr: b.svarAddr, events: [], brands: [], facilities: [] })
    }
    areaMap.get(b.stdRestNm).brands.push(b)
  }

  for (const c of facilities) {
    if (!areaMap.has(c.stdRestNm)) {
      areaMap.set(c.stdRestNm, { name: c.stdRestNm, route: c.routeNm, addr: c.svarAddr, events: [], brands: [], facilities: [] })
    }
    areaMap.get(c.stdRestNm).facilities.push(c)
  }

  // 활성 이벤트 필터
  const today = new Date().toISOString().slice(0, 10)
  for (const area of areaMap.values()) {
    area.activeEvents = area.events.filter(e => e.stime <= today && e.etime >= today)
  }

  return Array.from(areaMap.values()).sort((a, b) => {
    // 이벤트 > 브랜드 > 시설 순으로 우선순위
    return (b.activeEvents.length + b.brands.length + b.facilities.length) - (a.activeEvents.length + a.brands.length + a.facilities.length)
  })
}

// ─── 고속도로 대기질 (Open-Meteo Air Quality, 무료/키 불필요) ───
const AIR_QUALITY_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality'

export async function fetchHighwayAirQuality() {
  const results = await Promise.all(
    HIGHWAY_POINTS.map(async (p) => {
      try {
        const url = `${AIR_QUALITY_BASE}?latitude=${p.lat}&longitude=${p.lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,uv_index,european_aqi&timezone=Asia/Seoul`
        const res = await fetch(url)
        if (!res.ok) throw new Error('air quality fetch failed')
        const d = await res.json()
        return {
          ...p,
          pm10: Math.round(d.current.pm10 || 0),
          pm25: Math.round((d.current.pm2_5 || 0) * 10) / 10,
          co: Math.round(d.current.carbon_monoxide || 0),
          no2: Math.round(d.current.nitrogen_dioxide || 0),
          so2: Math.round(d.current.sulphur_dioxide || 0),
          o3: Math.round(d.current.ozone || 0),
          uvIndex: Math.round(d.current.uv_index || 0),
          eaqi: d.current.european_aqi || 0,
        }
      } catch {
        return { ...p, pm10: null }
      }
    })
  )
  return results
}

// 대기질 등급 (한국 환경부 기준 PM10)
export function getPM10Grade(pm10) {
  if (pm10 == null) return { label: '-', color: '#ccc', emoji: '❓' }
  if (pm10 <= 30) return { label: '좋음', color: '#22C55E', emoji: '😊' }
  if (pm10 <= 80) return { label: '보통', color: '#EAB308', emoji: '😐' }
  if (pm10 <= 150) return { label: '나쁨', color: '#F97316', emoji: '😷' }
  return { label: '매우나쁨', color: '#EF4444', emoji: '🤢' }
}

// 대기질 등급 (한국 환경부 기준 PM2.5)
export function getPM25Grade(pm25) {
  if (pm25 == null) return { label: '-', color: '#ccc', emoji: '❓' }
  if (pm25 <= 15) return { label: '좋음', color: '#22C55E', emoji: '😊' }
  if (pm25 <= 35) return { label: '보통', color: '#EAB308', emoji: '😐' }
  if (pm25 <= 75) return { label: '나쁨', color: '#F97316', emoji: '😷' }
  return { label: '매우나쁨', color: '#EF4444', emoji: '🤢' }
}

// European AQI → 한국식 등급 매핑
export function getEAQIGrade(eaqi) {
  if (eaqi == null) return { label: '-', color: '#ccc', emoji: '❓' }
  if (eaqi <= 20) return { label: '좋음', color: '#22C55E', emoji: '😊' }
  if (eaqi <= 40) return { label: '보통', color: '#EAB308', emoji: '😐' }
  if (eaqi <= 60) return { label: '나쁨', color: '#F97316', emoji: '😷' }
  if (eaqi <= 80) return { label: '매우나쁨', color: '#EF4444', emoji: '🤢' }
  return { label: '최악', color: '#991B1B', emoji: '☠️' }
}

// 자외선 지수 등급
export function getUVGrade(uv) {
  if (uv == null) return { label: '-', color: '#ccc' }
  if (uv <= 2) return { label: '낮음', color: '#22C55E' }
  if (uv <= 5) return { label: '보통', color: '#EAB308' }
  if (uv <= 7) return { label: '높음', color: '#F97316' }
  if (uv <= 10) return { label: '매우높음', color: '#EF4444' }
  return { label: '위험', color: '#991B1B' }
}

// ─── 고속도로 주간 날씨 전망 (Open-Meteo Daily API) ───
// 일출/일몰, 자외선, 일일 최고/최저 기온, 강수확률, 풍속 등 7일 전망
export async function fetchHighwayForecast() {
  const dailyParams = [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'sunrise',
    'sunset',
    'uv_index_max',
    'precipitation_sum',
    'precipitation_probability_max',
    'wind_speed_10m_max',
  ].join(',')

  const results = await Promise.all(
    HIGHWAY_POINTS.map(async (p) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&daily=${dailyParams}&timezone=Asia/Seoul&forecast_days=7`
        const res = await fetch(url)
        if (!res.ok) throw new Error('forecast fetch failed')
        const d = await res.json()
        const days = d.daily.time.map((date, i) => ({
          date,
          weatherCode: d.daily.weather_code[i],
          tempMax: Math.round(d.daily.temperature_2m_max[i]),
          tempMin: Math.round(d.daily.temperature_2m_min[i]),
          sunrise: d.daily.sunrise[i],
          sunset: d.daily.sunset[i],
          uvMax: Math.round(d.daily.uv_index_max[i] * 10) / 10,
          precipSum: d.daily.precipitation_sum[i] || 0,
          precipProb: d.daily.precipitation_probability_max[i] || 0,
          windMax: Math.round(d.daily.wind_speed_10m_max[i] || 0),
        }))
        return { ...p, days }
      } catch {
        return { ...p, days: [] }
      }
    })
  )
  return results
}

// ─── 고속도로 운전안전 지수 (Open-Meteo 확장 기상 파라미터) ───
// 가시거리, 돌풍, 해면기압, 체감온도, 운량, 적설, 소나기 — 기존 날씨 페이지와 완전히 다른 데이터
export async function fetchDrivingSafety() {
  const params = [
    'visibility',
    'wind_gusts_10m',
    'pressure_msl',
    'apparent_temperature',
    'cloud_cover',
    'snowfall',
    'showers',
    'temperature_2m',
    'precipitation',
    'weather_code',
    'wind_speed_10m',
    'relative_humidity_2m',
  ].join(',')

  const results = await Promise.all(
    HIGHWAY_POINTS.map(async (p) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=${params}&timezone=Asia/Seoul`
        const res = await fetch(url)
        if (!res.ok) throw new Error('safety fetch failed')
        const d = await res.json()
        const c = d.current
        return {
          ...p,
          visibility: c.visibility ?? 0,
          windGust: Math.round(c.wind_gusts_10m ?? 0),
          pressure: Math.round(c.pressure_msl ?? 0),
          apparentTemp: Math.round(c.apparent_temperature ?? 0),
          cloudCover: c.cloud_cover ?? 0,
          snowfall: c.snowfall ?? 0,
          showers: c.showers ?? 0,
          temp: Math.round(c.temperature_2m ?? 0),
          precip: c.precipitation ?? 0,
          weatherCode: c.weather_code ?? 0,
          windSpeed: Math.round(c.wind_speed_10m ?? 0),
          humidity: c.relative_humidity_2m ?? 0,
        }
      } catch {
        return { ...p, visibility: null }
      }
    })
  )
  return results
}

// 운전안전 등급 계산 — 가시거리, 돌풍, 강수, 적설, 날씨코드 종합
export function computeSafetyIndex(point) {
  if (point.visibility == null) return { score: 0, level: 'unknown', label: '알 수 없음', emoji: '❓', color: '#ccc', risks: [] }

  let score = 100
  const risks = []

  // 가시거리 (가장 중요)
  if (point.visibility < 500) {
    score -= 45; risks.push({ icon: '🌫️', msg: `가시거리 매우 나쁨 (${point.visibility}m)` })
  } else if (point.visibility < 1000) {
    score -= 30; risks.push({ icon: '🌫️', msg: `가시거리 나쁨 (${point.visibility}m)` })
  } else if (point.visibility < 5000) {
    score -= 15; risks.push({ icon: '🌫️', msg: `가시거리 주의 (${(point.visibility / 1000).toFixed(1)}km)` })
  }

  // 돌풍
  if (point.windGust >= 70) {
    score -= 30; risks.push({ icon: '🌪️', msg: `매우 강한 돌풍 (${point.windGust}km/h)` })
  } else if (point.windGust >= 50) {
    score -= 20; risks.push({ icon: '💨', msg: `강한 돌풍 (${point.windGust}km/h)` })
  } else if (point.windGust >= 35) {
    score -= 10; risks.push({ icon: '💨', msg: `돌풍 주의 (${point.windGust}km/h)` })
  }

  // 적설
  if (point.snowfall >= 5) {
    score -= 35; risks.push({ icon: '❄️', msg: `폭설 (${point.snowfall}cm)` })
  } else if (point.snowfall >= 1) {
    score -= 20; risks.push({ icon: '❄️', msg: `눈 (${point.snowfall}cm)` })
  } else if (point.snowfall > 0) {
    score -= 8; risks.push({ icon: '❄️', msg: `약간의 눈 (${point.snowfall}cm)` })
  }

  // 소나기
  if (point.showers >= 10) {
    score -= 20; risks.push({ icon: '🌧️', msg: `강한 소나기 (${point.showers}mm)` })
  } else if (point.showers >= 3) {
    score -= 10; risks.push({ icon: '🌧️', msg: `소나기 (${point.showers}mm)` })
  }

  // 일반 강수
  if (point.precip >= 10) {
    score -= 15; risks.push({ icon: '🌧️', msg: `강한 비 (${point.precip}mm)` })
  } else if (point.precip >= 3) {
    score -= 8; risks.push({ icon: '🌧️', msg: `비 (${point.precip}mm)` })
  }

  // 천둥번개
  if (point.weatherCode >= 95) {
    score -= 25; risks.push({ icon: '⛈️', msg: '천둥번개' })
  }

  // 안개
  if (point.weatherCode === 45 || point.weatherCode === 48) {
    score -= 20; risks.push({ icon: '🌫️', msg: '안개' })
  }

  score = Math.max(0, Math.min(100, score))

  let level, label, emoji, color
  if (score >= 85) { level = 'safe'; label = '안전'; emoji = '✅'; color = '#22C55E' }
  else if (score >= 65) { level = 'caution'; label = '주의'; emoji = '⚠️'; color = '#EAB308' }
  else if (score >= 40) { level = 'warning'; label = '위험'; emoji = '🔶'; color = '#F97316' }
  else { level = 'danger'; label = '매우 위험'; emoji = '🚨'; color = '#EF4444' }

  return { score, level, label, emoji, color, risks }
}

// 가시거리 등급
export function getVisibilityGrade(vis) {
  if (vis == null) return { label: '-', color: '#ccc' }
  if (vis >= 10000) return { label: '양호', color: '#22C55E' }
  if (vis >= 5000) return { label: '보통', color: '#EAB308' }
  if (vis >= 1000) return { label: '주의', color: '#F97316' }
  return { label: '위험', color: '#EF4444' }
}

// 돌풍 등급
export function getWindGustGrade(gust) {
  if (gust == null) return { label: '-', color: '#ccc' }
  if (gust < 25) return { label: '약함', color: '#22C55E' }
  if (gust < 40) return { label: '보통', color: '#EAB308' }
  if (gust < 60) return { label: '강함', color: '#F97316' }
  return { label: '매우 강함', color: '#EF4444' }
}

// ─── 전국 교통량 (trafficAll) ───
const TRAFFIC_ALL_URL = `${API_BASE}/trafficapi/trafficAll`

export async function fetchTrafficAll() {
  const params = new URLSearchParams({ key: API_KEY, type: 'json', numOfRows: '500' })
  const res = await fetch(`${TRAFFIC_ALL_URL}?${params}`)
  if (!res.ok) throw new Error(`API 오류: ${res.status}`)
  const data = await res.json()
  if (data.code !== 'SUCCESS') throw new Error(data.message || 'API 호출 실패')
  return data
}

// ─── 노선별 교통량 (trafficRoute) ───
const TRAFFIC_ROUTE_URL = `${API_BASE}/trafficapi/trafficRoute`

// 전국 고속도로 노선 목록
export const HIGHWAY_ROUTES = [
  { code: '001', name: '경부선', desc: '서울~부산' },
  { code: '015', name: '서해안선', desc: '서서울~목포' },
  { code: '025', name: '호남선', desc: '논산~광주' },
  { code: '035', name: '중부내륙선', desc: '동서울~대전통영' },
  { code: '045', name: '중부내륙선(상주)', desc: '감곡~상주' },
  { code: '050', name: '영동선', desc: '신갈~강릉' },
  { code: '055', name: '중앙선', desc: '원주~부산' },
  { code: '065', name: '동해선', desc: '속초~부산' },
  { code: '012', name: '광주대구선', desc: '광주~대구' },
  { code: '010', name: '남해선', desc: '순천~부산' },
  { code: '020', name: '새만금포항선', desc: '새만금~포항' },
  { code: '030', name: '서산영덕선', desc: '서산~영덕' },
  { code: '040', name: '평택음성선', desc: '평택~음성' },
  { code: '016', name: '울산선', desc: '울산~경주' },
  { code: '104', name: '남해제2지선', desc: '장유~부산' },
  { code: '153', name: '평택시흥선', desc: '평택~시흥' },
  { code: '160', name: '대구부산선', desc: '대구~부산' },
  { code: '400', name: '수도권제2순환선', desc: '봉담~성남' },
  { code: '600', name: '무안광주선', desc: '무안~광주' },
]

export async function fetchTrafficRoute(routeNo) {
  const params = new URLSearchParams({ key: API_KEY, type: 'json', numOfRows: '10000', routeNo })
  const res = await fetch(`${TRAFFIC_ROUTE_URL}?${params}`)
  if (!res.ok) throw new Error(`API 오류: ${res.status}`)
  const data = await res.json()
  if (data.code !== 'SUCCESS') throw new Error(data.message || 'API 호출 실패')
  return data
}

// 노선별 교통량 영업소별 집계
export function aggregateRouteByUnit(list) {
  const map = new Map()
  for (const t of list || []) {
    const key = t.unitName
    if (!map.has(key)) {
      map.set(key, {
        name: t.unitName,
        code: t.unitCode?.trim(),
        totalIn: 0,
        totalOut: 0,
        carTypes: {},
      })
    }
    const unit = map.get(key)
    const amount = parseInt(t.trafficAmout) || 0
    if (t.inoutType === '0') unit.totalIn += amount
    else unit.totalOut += amount
    // carType 집계
    if (!unit.carTypes[t.carType]) unit.carTypes[t.carType] = { in: 0, out: 0 }
    if (t.inoutType === '0') unit.carTypes[t.carType].in += amount
    else unit.carTypes[t.carType].out += amount
  }
  return Array.from(map.values())
}

// ─── 고속도로 하천 범람 위험 (Open-Meteo Flood API, 무료/키 불필요) ───
// 고속도로 주요 지점 인근 하천의 유량(discharge) 예측
export const FLOOD_POINTS = [
  { name: '서울 (한강)', lat: 37.5145, lon: 126.9682, desc: '경부선 출발 · 한강', river: '한강' },
  { name: '수원 (한강본류)', lat: 37.263, lon: 127.028, desc: '경기 남부', river: '한강' },
  { name: '천안', lat: 36.815, lon: 127.114, desc: '충남 거점', river: '갈천' },
  { name: '대전 (금강)', lat: 36.354, lon: 127.376, desc: '중부 교차점 · 금강', river: '금강' },
  { name: '대구 (낙동강)', lat: 35.871, lon: 128.601, desc: '영남 거점 · 낙동강', river: '낙동강' },
  { name: '부산 (낙동강하구)', lat: 35.180, lon: 128.931, desc: '남해 종점 · 낙동강', river: '낙동강' },
  { name: '광주 (영산강)', lat: 35.160, lon: 126.852, desc: '호남 거점 · 영산강', river: '영산강' },
  { name: '전주 (만경강)', lat: 35.824, lon: 127.148, desc: '호남선', river: '만경강' },
  { name: '강릉 (남대천)', lat: 37.751, lon: 128.876, desc: '영동선', river: '남대천' },
  { name: '원주 (섬강)', lat: 37.342, lon: 127.920, desc: '영동선 거점', river: '섬강' },
  { name: '춘천 (북한강)', lat: 37.881, lon: 127.730, desc: '중앙선', river: '북한강' },
]

const FLOOD_API = 'https://flood-api.open-meteo.com/v1/flood'

export async function fetchHighwayFloodRisk() {
  const results = await Promise.all(
    FLOOD_POINTS.map(async (p) => {
      try {
        const url = `${FLOOD_API}?latitude=${p.lat}&longitude=${p.lon}&daily=river_discharge&past_days=3&forecast_days=7`
        const res = await fetch(url)
        if (!res.ok) throw new Error('flood fetch failed')
        const d = await res.json()
        const times = d.daily.time || []
        const discharges = d.daily.river_discharge || []

        const todayIdx = times.indexOf(new Date().toISOString().slice(0, 10))
        const safeIdx = todayIdx >= 0 ? todayIdx : 3

        const current = discharges[safeIdx] ?? 0
        const forecast = discharges.slice(safeIdx + 1, safeIdx + 8)
        const past = discharges.slice(Math.max(0, safeIdx - 3), safeIdx)
        const maxForecast = forecast.length > 0 ? Math.max(...forecast) : current
        const minForecast = forecast.length > 0 ? Math.min(...forecast) : current

        // 위험도 계산: 절대 기준 + 변화율
        const surgeRatio = current > 0.1 ? maxForecast / current : 1

        return {
          ...p,
          current: Math.round(current * 10) / 10,
          forecast: forecast.map(v => Math.round(v * 10) / 10),
          forecastDates: times.slice(safeIdx + 1, safeIdx + 8),
          past: past.map(v => Math.round(v * 10) / 10),
          pastDates: times.slice(Math.max(0, safeIdx - 3), safeIdx),
          maxForecast: Math.round(maxForecast * 10) / 10,
          minForecast: Math.round(minForecast * 10) / 10,
          surgeRatio: Math.round(surgeRatio * 10) / 10,
        }
      } catch {
        return { ...p, current: null }
      }
    })
  )
  return results
}

// 하천 범람 위험 등급
export function getFloodGrade(point) {
  if (point.current == null) return { level: 'unknown', label: '알 수 없음', emoji: '❓', color: '#ccc' }

  const { current, maxForecast, surgeRatio } = point
  const peak = Math.max(current, maxForecast)

  // 절대 기준 (m³/s)
  if (peak >= 2000) return { level: 'danger', label: '위험', emoji: '🚨', color: '#EF4444' }
  if (peak >= 500) return { level: 'warning', label: '경고', emoji: '🔶', color: '#F97316' }

  // 급격한 증가 (홍수 예보)
  if (surgeRatio >= 10) return { level: 'danger', label: '위험', emoji: '🚨', color: '#EF4444' }
  if (surgeRatio >= 5) return { level: 'warning', label: '경고', emoji: '🔶', color: '#F97316' }
  if (surgeRatio >= 2) return { level: 'caution', label: '주의', emoji: '⚠️', color: '#EAB308' }

  // 일반 기준
  if (peak >= 100) return { level: 'caution', label: '주의', emoji: '⚠️', color: '#EAB308' }
  return { level: 'safe', label: '정상', emoji: '✅', color: '#22C55E' }
}

// 위험도 추세 텍스트
export function getFloodTrend(point) {
  if (point.current == null || !point.forecast?.length) return null
  const avgForecast = point.forecast.reduce((a, b) => a + b, 0) / point.forecast.length
  const diff = avgForecast - point.current
  if (diff > point.current * 0.5) return { text: '급증 예상', icon: '🔺', color: '#EF4444' }
  if (diff > 0) return { text: '증가 추세', icon: '🔼', color: '#F97316' }
  if (diff < -point.current * 0.3) return { text: '감소 추세', icon: '🔽', color: '#22C55E' }
  return { text: '안정', icon: '➡️', color: '#888' }
}

// ─── 고속도로 노면 상태 예측 (Open-Meteo Soil API, 무료/키 불필요) ───
// 지표면 온도(0cm)·지중 온도·표층 수분으로 노면 결빙/과열/수막 형성 위험 예측
export async function fetchRoadSurface() {
  const params = [
    'soil_temperature_0cm',
    'soil_temperature_6cm',
    'soil_temperature_18cm',
    'soil_moisture_0_1cm',
    'soil_moisture_1_3cm',
    'temperature_2m',
    'precipitation',
    'weather_code',
    'wind_speed_10m',
    'cloud_cover',
  ].join(',')

  const results = await Promise.all(
    HIGHWAY_POINTS.map(async (p) => {
      try {
        // 현재 + 24시간 시간별 예보
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&hourly=${params}&timezone=Asia/Seoul&forecast_days=2`
        const res = await fetch(url)
        if (!res.ok) throw new Error('soil fetch failed')
        const d = await res.json()

        const now = new Date()
        const nowIdx = d.hourly.time.findIndex(t => t === now.toISOString().slice(0, 13) + ':00')
        const idx = nowIdx >= 0 ? nowIdx : new Date().getHours()

        const surface = d.hourly.soil_temperature_0cm
        const deep = d.hourly.soil_temperature_6cm
        const deeper = d.hourly.soil_temperature_18cm
        const moist = d.hourly.soil_moisture_0_1cm
        const moistDeep = d.hourly.soil_moisture_1_3cm

        // 다음 24시간 데이터
        const next24 = []
        for (let i = idx; i < Math.min(idx + 24, d.hourly.time.length); i++) {
          next24.push({
            time: d.hourly.time[i],
            surfaceTemp: surface[i] != null ? Math.round(surface[i] * 10) / 10 : null,
            deepTemp: deep[i] != null ? Math.round(deep[i] * 10) / 10 : null,
            moisture: moist[i] != null ? Math.round(moist[i] * 1000) / 10 : null,
            airTemp: d.hourly.temperature_2m[i] != null ? Math.round(d.hourly.temperature_2m[i]) : null,
            precip: d.hourly.precipitation[i] || 0,
          })
        }

        const currentSurface = surface[idx] != null ? Math.round(surface[idx] * 10) / 10 : null
        const currentMoist = moist[idx] != null ? Math.round(moist[idx] * 1000) / 10 : null
        const currentAir = d.hourly.temperature_2m[idx] != null ? Math.round(d.hourly.temperature_2m[idx]) : null

        return {
          ...p,
          surfaceTemp: currentSurface,
          deepTemp: deep[idx] != null ? Math.round(deep[idx] * 10) / 10 : null,
          deeperTemp: deeper[idx] != null ? Math.round(deeper[idx] * 10) / 10 : null,
          moisture: currentMoist,
          moistureDeep: moistDeep[idx] != null ? Math.round(moistDeep[idx] * 1000) / 10 : null,
          airTemp: currentAir,
          precip: d.hourly.precipitation[idx] || 0,
          weatherCode: d.hourly.weather_code[idx] || 0,
          windSpeed: d.hourly.wind_speed_10m[idx] ? Math.round(d.hourly.wind_speed_10m[idx]) : 0,
          cloudCover: d.hourly.cloud_cover[idx] || 0,
          next24,
        }
      } catch {
        return { ...p, surfaceTemp: null }
      }
    })
  )
  return results
}

// 노면 결빙 위험도 계산
export function getRoadSurfaceRisk(point) {
  if (point.surfaceTemp == null) return { level: 'unknown', label: '알 수 없음', emoji: '❓', color: '#ccc', risks: [] }

  const risks = []
  let score = 100

  // 결빙 위험 (표면 온도 0도 이하)
  if (point.surfaceTemp <= -2) {
    score -= 45; risks.push({ icon: '🧊', msg: `노면 결빙 위험 (${point.surfaceTemp}°C)` })
  } else if (point.surfaceTemp <= 1) {
    score -= 30; risks.push({ icon: '⚠️', msg: `결빙 주의 (${point.surfaceTemp}°C)` })
  } else if (point.surfaceTemp <= 3) {
    score -= 12; risks.push({ icon: '❄️', msg: `저온 노면 (${point.surfaceTemp}°C)` })
  }

  // 과열 위험 (여름철 아스팔트)
  if (point.surfaceTemp >= 55) {
    score -= 30; risks.push({ icon: '🔥', msg: `노면 과열 (${point.surfaceTemp}°C) — 타이어 주의` })
  } else if (point.surfaceTemp >= 45) {
    score -= 15; risks.push({ icon: '🥵', msg: `고온 노면 (${point.surfaceTemp}°C)` })
  }

  // 수막 형성 (높은 수분 + 강수)
  if (point.moisture != null && point.moisture >= 0.35 && point.precip >= 3) {
    score -= 25; risks.push({ icon: '💦', msg: `수막 형성 위험 (수분 ${Math.round(point.moisture * 100)}%, 강수 ${point.precip}mm)` })
  } else if (point.moisture != null && point.moisture >= 0.30 && point.precip >= 1) {
    score -= 12; risks.push({ icon: '💧', msg: `젖은 노면 (수분 ${Math.round(point.moisture * 100)}%)` })
  }

  // 공기-표면 온도 차이 (결로 가능성)
  if (point.airTemp != null) {
    const diff = point.surfaceTemp - point.airTemp
    if (diff <= -5 && point.surfaceTemp <= 5) {
      score -= 10; risks.push({ icon: '🌫️', msg: `서리/결로 가능성 (기온 ${point.airTemp}°C, 노면 ${point.surfaceTemp}°C)` })
    }
  }

  score = Math.max(0, Math.min(100, score))

  let level, label, emoji, color
  if (score >= 85) { level = 'safe'; label = '양호'; emoji = '✅'; color = '#22C55E' }
  else if (score >= 65) { level = 'caution'; label = '주의'; emoji = '⚠️'; color = '#EAB308' }
  else if (score >= 40) { level = 'warning'; label = '위험'; emoji = '🔶'; color = '#F97316' }
  else { level = 'danger'; label = '매우 위험'; emoji = '🚨'; color = '#EF4444' }

  return { score, level, label, emoji, color, risks }
}

// 노면 온도 등급
export function getSurfaceTempGrade(temp) {
  if (temp == null) return { label: '-', color: '#ccc' }
  if (temp <= 0) return { label: '결빙', color: '#3B82F6' }
  if (temp <= 5) return { label: '저온', color: '#06B6D4' }
  if (temp <= 20) return { label: '정상', color: '#22C55E' }
  if (temp <= 35) return { label: '온난', color: '#EAB308' }
  if (temp <= 45) return { label: '고온', color: '#F97316' }
  return { label: '과열', color: '#EF4444' }
}

// 노면 수분 등급
export function getMoistureGrade(moist) {
  if (moist == null) return { label: '-', color: '#ccc' }
  const pct = Math.round(moist * 100)
  if (pct >= 40) return { label: '포화', color: '#3B82F6' }
  if (pct >= 30) return { label: '습윤', color: '#06B6D4' }
  if (pct >= 20) return { label: '정상', color: '#22C55E' }
  return { label: '건조', color: '#EAB308' }
}

// ─── 해안 고속도로 해상 정보 (Open-Meteo Marine API, 무료/키 불필요) ───
// 파고·너울·수온·조위 — 해안 도로(동해선·남해선·서해안선) 주행 위험 분석
export const COASTAL_POINTS = [
  { name: '부산 (해운대)', lat: 35.161, lon: 129.16, desc: '남해선·대구부산선 종점', region: '남해' },
  { name: '울산', lat: 35.54, lon: 129.27, desc: '울산선·동해선', region: '동해' },
  { name: '포항', lat: 36.04, lon: 129.37, desc: '동해선 중부', region: '동해' },
  { name: '삼척', lat: 37.45, lon: 129.17, desc: '동해선 북부', region: '동해' },
  { name: '강릉', lat: 37.75, lon: 128.95, desc: '영동선 해안', region: '동해' },
  { name: '속초', lat: 38.20, lon: 128.59, desc: '동해선 최북단', region: '동해' },
  { name: '목포', lat: 34.78, lon: 126.38, desc: '서해안선 종점', region: '서해' },
  { name: '군산', lat: 35.98, lon: 126.68, desc: '서해안선 중부', region: '서해' },
  { name: '보령', lat: 36.52, lon: 126.42, desc: '서해안선', region: '서해' },
  { name: '태안', lat: 36.74, lon: 126.30, desc: '서해안선 북부', region: '서해' },
  { name: '여수', lat: 34.76, lon: 127.66, desc: '남해선', region: '남해' },
  { name: '통영', lat: 34.85, lon: 128.43, desc: '중부내륙선 종점', region: '남해' },
]

const MARINE_API = 'https://marine-api.open-meteo.com/v1/marine'

export async function fetchCoastalSea() {
  const params = [
    'wave_height',
    'wave_direction',
    'wave_period',
    'wind_wave_height',
    'swell_wave_height',
    'sea_surface_temperature',
  ].join(',')

  const results = await Promise.all(
    COASTAL_POINTS.map(async (p) => {
      try {
        const url = `${MARINE_API}?latitude=${p.lat}&longitude=${p.lon}&current=${params}&timezone=Asia/Seoul`
        const res = await fetch(url)
        if (!res.ok) throw new Error('marine fetch failed')
        const d = await res.json()
        const c = d.current
        return {
          ...p,
          waveHeight: c.wave_height != null ? Math.round(c.wave_height * 100) / 100 : null,
          waveDir: c.wave_direction ?? null,
          wavePeriod: c.wave_period != null ? Math.round(c.wave_period * 10) / 10 : null,
          windWave: c.wind_wave_height != null ? Math.round(c.wind_wave_height * 100) / 100 : null,
          swellWave: c.swell_wave_height != null ? Math.round(c.swell_wave_height * 100) / 100 : null,
          seaTemp: c.sea_surface_temperature != null ? Math.round(c.sea_surface_temperature * 10) / 10 : null,
        }
      } catch {
        return { ...p, waveHeight: null }
      }
    })
  )
  return results
}

// 파고 등급 (해상 안전 기준)
export function getWaveGrade(height) {
  if (height == null) return { label: '-', color: '#ccc', emoji: '❓' }
  if (height >= 4.0) return { label: '매우 높음', color: '#991B1B', emoji: '🚨' }
  if (height >= 2.5) return { label: '높음', color: '#EF4444', emoji: '🔴' }
  if (height >= 1.5) return { label: '보통', color: '#F97316', emoji: '🟠' }
  if (height >= 0.8) return { label: '약함', color: '#EAB308', emoji: '🟡' }
  return { label: '매우 잔잔', color: '#22C55E', emoji: '🟢' }
}

// 너울 등급
export function getSwellGrade(height) {
  if (height == null) return { label: '-', color: '#ccc' }
  if (height >= 3.0) return { label: '위험', color: '#EF4444' }
  if (height >= 2.0) return { label: '주의', color: '#F97316' }
  if (height >= 1.0) return { label: '보통', color: '#EAB308' }
  return { label: '양호', color: '#22C55E' }
}

// 해상 운전 위험도 종합 평가
export function getSeaRiskLevel(point) {
  if (point.waveHeight == null) return { score: 0, level: 'unknown', label: '알 수 없음', emoji: '❓', color: '#ccc', risks: [] }

  let score = 100
  const risks = []

  // 파고
  if (point.waveHeight >= 4.0) {
    score -= 50; risks.push({ icon: '🌊', msg: `파고 매우 높음 (${point.waveHeight}m) — 해안도로 통제 위험` })
  } else if (point.waveHeight >= 2.5) {
    score -= 35; risks.push({ icon: '🌊', msg: `파고 높음 (${point.waveHeight}m) — 강풍 주의` })
  } else if (point.waveHeight >= 1.5) {
    score -= 18; risks.push({ icon: '〰️', msg: `파도 보통 (${point.waveHeight}m)` })
  }

  // 너울 (swell)
  if (point.swellWave != null && point.swellWave >= 3.0) {
    score -= 30; risks.push({ icon: '🌀', msg: `너울 높음 (${point.swellWave}m) — 해파수 침수 위험` })
  } else if (point.swellWave != null && point.swellWave >= 2.0) {
    score -= 18; risks.push({ icon: '🌀', msg: `너울 주의 (${point.swellWave}m)` })
  }

  // 파고 주기 (주기가 길면 더 위험)
  if (point.wavePeriod != null && point.wavePeriod >= 10 && point.waveHeight >= 1.5) {
    score -= 12; risks.push({ icon: '⏱️', msg: `긴 주기 파랑 (${point.wavePeriod}초) — 너울성 파도` })
  }

  score = Math.max(0, Math.min(100, score))

  let level, label, emoji, color
  if (score >= 85) { level = 'safe'; label = '안전'; emoji = '✅'; color = '#22C55E' }
  else if (score >= 65) { level = 'caution'; label = '주의'; emoji = '⚠️'; color = '#EAB308' }
  else if (score >= 40) { level = 'warning'; label = '위험'; emoji = '🔶'; color = '#F97316' }
  else { level = 'danger'; label = '매우 위험'; emoji = '🚨'; color = '#EF4444' }

  return { score, level, label, emoji, color, risks }
}

// 파향을 방위 텍스트로 변환
export function getWaveDirectionText(deg) {
  if (deg == null) return '-'
  const dirs = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
  return dirs[Math.round(deg / 45) % 8]
}

// 수온 등급
export function getSeaTempGrade(temp) {
  if (temp == null) return { label: '-', color: '#ccc' }
  if (temp >= 25) return { label: '따뜻함', color: '#EF4444' }
  if (temp >= 15) return { label: '보통', color: '#22C55E' }
  if (temp >= 10) return { label: '서늘', color: '#06B6D4' }
  return { label: '차가움', color: '#3B82F6' }
}

// ─── 고속도로 표고 프로파일 (Open-Meteo Elevation API, 무료/키 불필요) ───
// 각 고속도로 지점의 해발 고도를 조회하여 산악 구간·터널 접근·경사도 정보 제공
const ELEVATION_API = 'https://api.open-meteo.com/v1/elevation'

export async function fetchHighwayElevation() {
  // 한 번에 모든 좌표를 전송 (배치 쿼리)
  const lats = HIGHWAY_POINTS.map(p => p.lat).join(',')
  const lons = HIGHWAY_POINTS.map(p => p.lon).join(',')
  try {
    const url = `${ELEVATION_API}?latitude=${lats}&longitude=${lons}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('elevation fetch failed')
    const d = await res.json()
    const elevations = d.elevation || []

    const points = HIGHWAY_POINTS.map((p, i) => ({
      ...p,
      elevation: elevations[i] != null ? Math.round(elevations[i]) : null,
    }))

    // 인접 지점 간 경사도 계산
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        points[i].gradientFromPrev = null
        points[i].elevationDiff = null
      } else {
        const diff = (points[i].elevation ?? 0) - (points[i - 1].elevation ?? 0)
        points[i].elevationDiff = diff
        // 대략적인 직선 거리 (haversine 단순화)
        const lat1 = points[i - 1].lat
        const lon1 = points[i - 1].lon
        const lat2 = points[i].lat
        const lon2 = points[i].lon
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        points[i].distanceFromPrev = Math.round(distance * 10) / 10
        points[i].gradientFromPrev = distance > 0 ? Math.round((diff / (distance * 1000)) * 1000) / 10 : null
      }
    }

    // 최고/최저 표고
    const validElev = points.filter(p => p.elevation != null)
    const maxElev = validElev.length > 0 ? Math.max(...validElev.map(p => p.elevation)) : 0
    const minElev = validElev.length > 0 ? Math.min(...validElev.map(p => p.elevation)) : 0
    const maxPoint = validElev.find(p => p.elevation === maxElev)
    const minPoint = validElev.find(p => p.elevation === minElev)

    return { points, maxElev, minElev, maxPoint, minPoint }
  } catch {
    return { points: HIGHWAY_POINTS.map(p => ({ ...p, elevation: null })), maxElev: 0, minElev: 0, maxPoint: null, minPoint: null }
  }
}

// 표고 등급
export function getElevationGrade(elevation) {
  if (elevation == null) return { label: '-', color: '#ccc', emoji: '❓' }
  if (elevation >= 500) return { label: '고산', color: '#8B5CF6', emoji: '⛰️' }
  if (elevation >= 300) return { label: '산간', color: '#6366F1', emoji: '🏔️' }
  if (elevation >= 150) return { label: '구릉', color: '#0EA5E9', emoji: '丘陵' }
  if (elevation >= 50) return { label: '평지', color: '#22C55E', emoji: '🏞️' }
  return { label: '저지', color: '#06B6D4', emoji: '🌊' }
}

// 경사도 등급
export function getGradientGrade(gradient) {
  if (gradient == null) return { label: '-', color: '#ccc' }
  const abs = Math.abs(gradient)
  if (abs >= 4) return { label: '급경사', color: '#EF4444' }
  if (abs >= 2) return { label: '완만한 경사', color: '#F97316' }
  if (abs >= 1) return { label: '완경사', color: '#EAB308' }
  return { label: '평지', color: '#22C55E' }
}

// 표고에 따른 온도 감소 보정 (건조 단열 감률: 0.6°C/100m)
export function getTemperatureAdjustment(elevation, seaLevelTemp) {
  if (elevation == null || seaLevelTemp == null) return null
  return Math.round((seaLevelTemp - elevation * 0.006) * 10) / 10
}

// 전국 교통량 차종 코드 → 이름
export const CAR_TYPE_MAP = {
  '1': { label: '1종(승용차)', short: '승용차', emoji: '🚗', color: '#4D9BC6' },
  '2': { label: '2종(중형승용)', short: '중형승용', emoji: '🚙', color: '#22C55E' },
  '3': { label: '3종(대형승용)', short: '대형승용', emoji: '🚐', color: '#EAB308' },
  '4': { label: '4종(소형화물)', short: '소형화물', emoji: '🛻', color: '#F97316' },
  '5': { label: '5종(대형화물)', short: '대형화물', emoji: '🚛', color: '#EF4444' },
  '6': { label: '6종(특수차량)', short: '특수차량', emoji: '🚜', color: '#8B5CF6' },
}
