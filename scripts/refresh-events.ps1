# 휴게소 이벤트 데이터 갱신 + 재배포
# 매일 07시 KST 크론으로 실행

$ErrorActionPreference = 'Stop'

$projectDir = "C:\Users\haese\projects\service-area"
$apiKey = "0105398808"
$apiUrl = "https://data.ex.co.kr/openapi/restinfo/restEventList?key=$apiKey&type=json&numOfRows=2000&pageNo=1"

Write-Host "=== 휴게소 이벤트 데이터 갱신 시작 ==="

# 1. API 호출
$data = Invoke-RestMethod -Uri $apiUrl -Method Get
Write-Host "API 호출 완료: $($data.count)건"

# 2. 정적 JSON 파일로 저장 (public/ 디렉토리 → 빌드 시 dist/ 로 복사)
$publicDir = Join-Path $projectDir "public"
if (-not (Test-Path $publicDir)) { New-Item -ItemType Directory -Path $publicDir | Out-Null }

$json = $data | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText((Join-Path $publicDir "events-data.json"), $json, [System.Text.UTF8Encoding]::new($false))
Write-Host "events-data.json 저장 완료"

# 3. 빌드
Push-Location $projectDir
npm run build 2>&1 | Select-Object -Last 3
Write-Host "빌드 완료"

# 4. Cloudflare Pages 배포
$t = Get-Content "$env:USERPROFILE\.openclaw\workspace\.api-tokens.json" | ConvertFrom-Json
$env:CLOUDFLARE_API_TOKEN = $t.cloudflare_api_token
$env:CLOUDFLARE_ACCOUNT_ID = "815f1b29f4eb5efb093076fdf6391e94"
npx wrangler pages deploy dist --project-name service-area-nutalk 2>&1 | Select-Object -Last 5
Pop-Location

# 5. 결과 보고
$active = ($data.list | Where-Object { $_.stime -le (Get-Date -Format 'yyyy-MM-dd') -and $_.etime -ge (Get-Date -Format 'yyyy-MM-dd') }).Count
Write-Host "=== 갱신 완료: 전체 $($data.count)건, 진행 중 ${active}건 ==="
