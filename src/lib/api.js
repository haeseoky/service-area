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
