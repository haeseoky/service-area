// 한국도로공사 휴게소 이벤트 API
const API_URL = 'https://data.ex.co.kr/openapi/restinfo/restEventList'
const API_KEY = '0105398808'

// 정적 캐시 우선 → 실패 시 실시간 API 폴백
export async function fetchEvents({ numOfRows = 1000, pageNo = 1, routeNm, stdRestNm } = {}) {
  // 1) 정적 캐시 시도 (매일 07시 갱신)
  try {
    const cacheRes = await fetch('/events-data.json?t=' + Date.now())
    if (cacheRes.ok) {
      const cached = await cacheRes.json()
      if (cached.list && cached.list.length > 0) {
        return cached
      }
    }
  } catch {}

  // 2) 실시간 API 폴백
  const params = new URLSearchParams({
    key: API_KEY,
    type: 'json',
    numOfRows: String(numOfRows),
    pageNo: String(pageNo),
  })
  if (routeNm) params.append('routeNm', routeNm)
  if (stdRestNm) params.append('stdRestNm', stdRestNm)

  const res = await fetch(`${API_URL}?${params}`)
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
    if (!map.has(e.stdRestNm)) {
      map.set(e.stdRestNm, [])
    }
    map.get(e.stdRestNm).push(e)
  }
  return map
}

export function groupByRoute(events) {
  const map = new Map()
  for (const e of events || []) {
    if (!map.has(e.routeNm)) {
      map.set(e.routeNm, [])
    }
    map.get(e.routeNm).push(e)
  }
  return map
}
