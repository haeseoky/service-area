import fs from 'fs';

const API_BASE = 'https://data.ex.co.kr/openapi';
const API_KEY = '0105398808';
const EVENT_URL = `${API_BASE}/restinfo/restEventList`;

async function fetchPage(pageNo, numOfRows = 99) {
  const params = new URLSearchParams({
    key: API_KEY,
    type: 'json',
    numOfRows: String(numOfRows),
    pageNo: String(pageNo),
  });
  const res = await fetch(`${EVENT_URL}?${params}`);
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const data = await res.json();
  if (data.code !== 'SUCCESS') throw new Error(data.message || 'API 호출 실패');
  return data;
}

async function main() {
  // First page to get total count
  const first = await fetchPage(1, 99);
  const totalCount = first.count;
  console.log(`Total count from API: ${totalCount}`);

  const allList = [...first.list];
  const totalPages = Math.ceil(totalCount / 99);

  console.log(`Total pages: ${totalPages}`);

  for (let p = 2; p <= totalPages; p++) {
    process.stdout.write(`Fetching page ${p}/${totalPages}...`);
    const data = await fetchPage(p, 99);
    allList.push(...data.list);
    console.log(` ${data.list.length} items`);
  }

  const result = {
    code: 'SUCCESS',
    count: allList.length,
    list: allList,
  };

  fs.writeFileSync('public/events-data.json', JSON.stringify(result, null, 2), 'utf8');
  console.log(`\nDone! Saved ${allList.length} events to public/events-data.json`);

  // Count unique rest areas
  const uniqueRestAreas = new Set(allList.map((item) => item.stdRestNm || item.routeNm));
  console.log(`Unique rest areas: ${uniqueRestAreas.size}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
