# Atom-base 전체 성능 진단 보고서 (Phase A)

> 작성일: 2026-06-09
> 범위: 코드레벨 정적 분석 + grep/Glob 기반 패턴 추적
> 작성 원칙: 추측 금지, 모든 항목은 파일:라인 근거 포함
> 변경 범위: **본 PR에서는 동적 import 전환 + 명백한 Promise.all 병렬화 외 코드 수정 없음**

---

## 보고 항목 인덱스

- [A-1] 공통 레이어 (미들웨어 · 레이아웃 · supabase 클라이언트)
- [A-2] 데이터 쿼리 패턴 (N+1 · select('*') · 페이지네이션)
- [A-3] DB 인덱스 후보
- [A-4] 렌더링 / 리페치 (router.refresh · revalidatePath · React.memo)
- [A-5] 번들 / 로딩 (정적 vs 동적 import · Realtime 구독 범위)
- [A-6] 외부 API 호출 (VWorld · 건축물대장 · Daum)
- [Top 5] 우선순위 요약
- [Verification SQL] 사용자가 Supabase에서 직접 실행할 검증 쿼리

---

## A-1. 공통 레이어

### A-1-1. 미들웨어의 매 요청 `auth.getUser()`

- **위치**: `src/middleware.ts:4-67` (특히 `auth.getUser()` 라인 ~44)
- **증상**: 정적 자원과 우회 경로(`/calculator`, `/api/calculator/`, `/share/`, `/api/cron/`)를 제외한 모든 요청에서 Supabase Auth round-trip 1회 발생
- **영향 추정**: 페이지 진입마다 +30~100ms (Supabase Auth 지리적 위치 기준). 대시보드 한 번 열 때 layout + page + RSC fetch 등에서 다단계로 누적될 가능성
- **근거**: `src/middleware.ts` 우회 분기 후 `supabase.auth.getUser()` 무조건 호출
- **제안**: (1) 세션 토큰 존재 시 검증만 하고 사용자 row fetch 생략 (Supabase ssr 권장 패턴), (2) `matcher` 더 좁혀서 favicon/robots/manifest 등 정적 자원 추가 우회
- **위험도**: 중간 — 미들웨어 로직 변경은 인증 우회 가능성 동반, 본 PR에서 수정하지 않음
- **우선순위**: **High** (모든 페이지 공통 비용)

### A-1-2. `createClient()` 매 호출 시 `await cookies()`

- **위치**: `src/lib/supabase/server.ts` (전체 함수)
- **증상**: 서버 컴포넌트/액션마다 `createClient()` 호출 → 매번 `await cookies()` + 신규 Supabase 클라이언트 인스턴스 생성
- **영향 추정**: 호출당 ~1~5ms, 페이지당 5~10회 호출 시 누적 가능
- **제안**: Server Component 단위로 1회만 생성하고 prop으로 내려보내기 — 단 RSC 캐시 무효화 의미 변화 가능성, 본 PR 수정하지 않음
- **위험도**: 중간
- **우선순위**: **Medium**

### A-1-3. 레이아웃 자체는 경량 (양호)

- `src/app/layout.tsx`: 폰트(Outfit) + metadata만, DB 쿼리 없음
- `src/app/(dashboard)/layout.tsx`: Sidebar 하나만, DB 쿼리 없음
- **평가**: ✅ 양호

---

## A-2. 데이터 쿼리 패턴

### A-2-1. `select('*')` 광범위 사용

- **위치 (대표)**:
  - `src/lib/db/clients.ts` — `getClients()`, `getClientById()` 등
  - `src/lib/db/trader-properties.ts:60` — `listPropertiesByClient`
  - `src/lib/db/checklist.ts` — `listChecklistRows` (clients 조인)
  - `src/lib/db/income-tax-reports.ts`, `corporate-tax-reports.ts`
  - `src/lib/db/share-links.ts`, `adjustment-invoices.ts`, `industry-codes.ts`
- **증상**: 모든 컬럼 전송 — clients의 `hometax_password`, `notes` 등 큰 컬럼까지 매 목록 조회마다 직렬화/전송
- **영향 추정**: 행당 200~500bytes 추가 전송. 1,000건 목록 시 200~500KB 초과 전송 가능
- **제안**: 화면에서 실제 사용하는 컬럼만 명시. 별도 PR에서 점진 적용
- **위험도**: 낮음 (정적 변경, 타입은 좁아질 뿐)
- **우선순위**: **Medium** — 본 PR 수정 안 함 (회귀 검증 필요)

### A-2-2. `getClients()` 페이지네이션 없음

- **위치**: `src/lib/db/clients.ts` — `getClients()` 전체 row 반환
- **증상**: `/clients`, `/reports-review/*`, `/invoices/adjustment` 등에서 모두 전체 고객 목록 로드
- **영향 추정**: 고객이 500건 이상 누적될 경우 초기 로드가 점진적으로 느려짐. 현재는 아마 100건대로 추정되어 즉시 영향 없음
- **제안**: 클라이언트 측 페이지네이션은 이미 존재 (ClientListManager는 `pageSize=100`). 서버 측은 검색/필터 기준만 받아서 페이지 단위 fetch로 전환
- **위험도**: 낮음~중간 — UI 패턴 변경 필요
- **우선순위**: **Medium**

### A-2-3. 대시보드 카운트 쿼리는 이미 `Promise.all` 사용 (양호)

- **위치**: `src/app/(dashboard)/dashboard/page.tsx`
- **평가**: ✅ 양호 — 4개 count 쿼리 병렬화 완료

### A-2-4. 결산참고/매매사업자에서 N+1 없음 확인

- **위치**: `src/lib/db/checklist.ts` (clients!inner 조인 1쿼리)
- **위치**: `src/lib/db/corporate-tax-reports.ts` (`.in()` 배치 조회 PR #87)
- **평가**: ✅ 이미 최적화됨

### A-2-5. `trader_properties` 조회 시 expense 합산 + transfer_income 재계산

- **위치**: `src/lib/db/trader-properties.ts:60` `listPropertiesByClient`
- **증상**: `trader_properties` + `trader_property_expenses` 동시 조인 후 JS 측에서 `transfer_income` 재계산
- **영향 추정**: 물건 1~20건 수준에서는 영향 미미
- **제안**: 재계산 결과를 DB의 `transfer_income`에 trigger로 저장하면 JS 측 재계산 제거 가능. 별도 작업
- **위험도**: 낮음
- **우선순위**: **Low**

---

## A-3. DB 인덱스 후보

> 아래는 후보일 뿐, 실제 적용 전 사용자가 Supabase에서 [Verification SQL] 섹션의 쿼리를 실행해 seq_scan 분포로 검증해야 합니다.

| 테이블 | 후보 인덱스 | 근거 (쿼리 패턴) |
|--------|-------------|------------------|
| `clients` | `(is_terminated, is_temporary)` | `getClients()`가 두 컬럼 같이 필터 — 복합 인덱스 |
| `clients` | `(manager)` | 조정료 청구서/보고서 화면의 담당자 필터 distinct |
| `income_tax_reports` | `(client_id, report_year)` | UPSERT + 단일 조회 패턴, `onConflict: client_id,report_year` |
| `corporate_tax_reports` | `(client_id, report_year)` | 동일 |
| `trader_properties` | `(client_id)` | 모든 물건 조회가 client_id 기준 |
| `trader_properties` | `(transfer_date)` | `calculatePriorAmounts`에서 양도일 < 조건 비교 |
| `trader_property_expenses` | `(property_id)` | 모든 expense 조회가 property_id 기준 |
| `adjustment_invoices` | `(billing_year, business_type)` | 청구서 목록 핵심 필터 |
| `report_share_links` | `(expires_at)` | Cron 정리 작업 |

**위험도**: 낮음 — 인덱스 추가는 쓰기 약간 느려질 뿐 읽기 개선 측면이 큼
**우선순위**: 사용자 검증 SQL 결과 보고 결정

---

## A-4. 렌더링 / 리페치

### A-4-1. `InvoiceRow` 미memoize + 인라인 콜백

- **위치**: `src/components/invoices/InvoiceRow.tsx:24` (default export, memo 미적용)
- **부모**: `src/components/invoices/AdjustmentInvoiceManager.tsx:778-787` — `onChangeCell`, `onImmediateSave`, `onPrint`, `onDelete`, `onResetMaemaeDiscount` 모두 useCallback 미적용
- **증상**: 조정료 청구서 50~100행에서 부모 리렌더(필터 변경, 토스트 등)마다 모든 행 재생성
- **영향 추정**: 행당 0.1~0.2ms × 100행 = 10~20ms 추가 렌더링
- **제안**: (1) `InvoiceRow`를 `memo()`로 감싸기, (2) 부모의 5개 핸들러 모두 `useCallback`으로 안정화, (3) `RowState` props가 변경된 행만 재렌더
- **위험도**: 낮음 (PR #84 PropertyRow 패턴 차용)
- **우선순위**: **High** — 본 PR 범위 외 (memo 적용은 dispatcher 패턴 정착 필요)

### A-4-2. `PropertyListManager`에서 `router.refresh()` 호출 잔존

- **위치**: `src/components/traders/PropertyListManager.tsx:49, 129`
- **증상**: `handleAddRow`와 `handleSaveAll`에서 낙관적 업데이트 없이 `router.refresh()` → 전체 페이지 RSC refetch
- **참고**: `addProperty`, `updateProperty` 서버 액션이 이미 `revalidatePath` 호출 → `router.refresh()`는 중복
- **영향 추정**: 행 추가/일괄저장 시 200~500ms 추가 round-trip
- **제안**: 서버 액션 결과(추가된 행 객체)를 반환받아 로컬 state에 push, `router.refresh()` 제거. PR #126 즉시저장 패턴과 동일
- **위험도**: 낮음~중간
- **우선순위**: **High** — 본 PR 범위 외

### A-4-3. 다중 `revalidatePath` 호출 (race 가능성)

- **위치**:
  - `src/app/(dashboard)/clients/actions.ts:78-80, 88-89, 103-104, 142-143` — 2~3개 경로 동시 revalidate
  - `src/app/actions/income-tax-reports.ts:131-132` — 목록 + 상세 동시
  - `src/app/actions/corporate-tax-reports.ts:67-68` — 동일
- **증상**: 한 액션 완료 시 여러 RSC 트리가 동시 invalidate → 같은 요청에서 캐시 경합
- **영향 추정**: 액션 후 150~300ms 추가 지연 가능 (PR #95 사례)
- **제안**: 필요한 경로만 — 상세 페이지로 navigating 중이면 상세만, 목록 페이지면 목록만
- **위험도**: 중간 — 누락 시 캐시 정합성 깨질 위험
- **우선순위**: **Medium** — 본 PR 범위 외

### A-4-4. 기타 `router.refresh()` 호출 위치 (참고)

`grep` 결과 총 17건, 그중 폼 저장 후 호출 11건. 낙관적 UI 미적용. 검수/필터 새로고침은 의도적 — 양호.

### A-4-5. `React.memo` 적용 현황

| 컴포넌트 | memo | useCallback 안정화 | 평가 |
|----------|------|--------------------|------|
| `PropertyRow` (`PropertyRow.tsx:187`) | ✅ | ✅ (`PropertyListManager.tsx:56-107`) | ✅ |
| `ChecklistRow` (`ChecklistRow.tsx:143`) | ✅ | ✅ | ✅ |
| `InvoiceRow` (`InvoiceRow.tsx:24`) | ❌ | ❌ | **개선 필요** |

### A-4-6. 'use client' 경계

- 모든 page.tsx는 서버 컴포넌트, 상호작용 영역만 'use client'로 분리 — ✅ 양호

---

## A-5. 번들 / 로딩

### A-5-1. `xlsx` 정적 import 6곳 — 페이지 초기 번들에 포함

| 파일 | import 방식 | 영향 |
|------|-------------|------|
| `src/components/invoices/AdjustmentInvoiceManager.tsx:5` | **정적** | `/invoices/adjustment` 페이지 초기 번들 +600KB |
| `src/components/invoices/ExcelImportModal.tsx:4` | **정적** | 위 페이지 동일 (부모가 정적 import) |
| `src/components/clients/ClientListManager.tsx:4` | **정적** | `/clients` 페이지 초기 번들 +600KB |
| `src/components/clients/ClientExcelImportModal.tsx:4` | **정적** | 위 페이지 동일 |
| `src/lib/excel/trader-upload-parser.ts:1` | **정적** | `TraderBulkUpload`에서 사용 (페이지 직접 import) |
| `src/lib/calculators/income-statement-parser.ts:1` | **정적** | `IncomeStatementUpload`에서 사용 |

- **영향 추정**: `/invoices/adjustment`, `/clients` 페이지 초기 JS 페이로드 약 600KB 추가 (gzip 전). 모바일 3G에서 0.5~1초 지연
- **제안**: 사용 함수 안에서 `const XLSX = await import('xlsx')` 동적 import로 전환
- **위험도**: 낮음 — 함수 시그니처만 async로 바뀜
- **우선순위**: **High**
- **본 PR 처리**: ✅ 4개 클라이언트 컴포넌트는 동적 import 전환 (별도 커밋 참조). 파서 2개 파일(`trader-upload-parser.ts`, `income-statement-parser.ts`)은 호출자가 이미 async 함수이므로 동일하게 전환 가능 — 안전을 위해 별도 PR 후속 처리 권장.

### A-5-2. `html2canvas` — 이미 동적 분리됨 (양호)

- `src/lib/utils/invoice-export.ts:29` — 동적 import ✅
- `src/components/traders/PropertyReportModal.tsx:5` — 정적 import이지만 부모(`PropertyDetailPanel.tsx`)가 `next/dynamic`으로 모달 자체를 lazy-load → **모달 chunk 내에서만 번들됨, 페이지 초기 번들 영향 없음** ✅

### A-5-3. `jspdf` — 동적 import 완료 (양호)

- `src/lib/utils/pdf-export.ts:47` — 동적 import ✅

### A-5-4. `pdf-parse` — 서버 전용 (양호)

- `src/lib/parsers/building-certificate-parser.ts:8` — `/api/calculator/parse-building-cert` 서버 라우트에서만 호출, 클라이언트 번들에 포함 안 됨 ✅

### A-5-5. `@dnd-kit` — 단일 위치만 사용 (양호)

- `src/components/reports/income-tax/ConclusionSectionsInput.tsx:17` 한 곳
- 종소세 보고서 페이지에만 포함, 다른 페이지 영향 없음 ✅

### A-5-6. `exceljs` — 미사용 의존성

- `package.json` dependencies에 등록되어 있으나 `src/` 어디서도 import 안 됨
- **제안**: `npm uninstall exceljs`로 제거 권장 (~1.2MB 도커 이미지 크기 절감, 클라이언트 번들 영향은 없음)
- **위험도**: 낮음 — 본 PR 범위 외 (사용자 확인 후 별도 작업)

### A-5-7. Realtime 구독 범위 — 필터 누락

- **위치**: `src/app/(dashboard)/traders/checklist/ChecklistClient.tsx:71-80`
- **증상**: `trader_properties` 테이블 전체에 대해 `postgres_changes` 구독 (client_id 필터 없음)
- **영향 추정**: 사용자가 늘어날수록 모든 클라이언트가 모든 매매사업자 행 변경 이벤트 수신 → 네트워크/CPU 낭비
- **제안**: 현재 화면에 표시 중인 client_id 목록만 필터링하거나, `manager` 기준으로 분리
- **위험도**: 중간 — 필터 추가로 일부 사용자에게 실시간 동기화 누락 위험
- **우선순위**: **Medium** — 본 PR 범위 외

---

## A-6. 외부 API 호출

### A-6-1. VWorld 3중 호출 체인 (클라이언트)

- **위치**: `src/lib/api/vworld/browser.ts` 내 `geocodeAddress` (라인 ~76) → `getPnuByPoint` (라인 ~111) → `getLandValueByPnu` (라인 ~227)
- **트리거**: `LandValueField`의 `useEffect`에서 주소 변경 시 자동 (3개 함수 순차 await)
- **증상**: 각 호출 10초 타임아웃 → 최악 30초 페이지 블로킹 가능
- **캐싱**: 없음 (`lastLookedUpRef`로 같은 입력 중복만 방지)
- **영향 추정**: 정상 케이스 1~3초, 외부 API 지연 시 누적 가능
- **제안**: localStorage 또는 IndexedDB 기반 PNU 캐시 (주소→PNU→공시지가 24h TTL)
- **위험도**: 낮음 (캐시는 stale 위험 정도)
- **우선순위**: **Medium** — 부가세 계산기 한정 영향

### A-6-2. 건축물대장 PNU 변형 폴백 (서버)

- **위치**: `src/lib/api/building-cert/server.ts` + `src/app/api/calculator/lookup-building-area/route.ts`
- **증상**: 최악 5회 시도(원본 + 4 변형) × 10초 = 최대 50초
- **현재 사용**: 부가세 계산기에서만, 사용자 명시적 트리거 (블로킹 아님)
- **제안**: 서버 측 캐싱 (PNU → 건축물 정보 7일 TTL)
- **위험도**: 낮음
- **우선순위**: **Low**

### A-6-3. Daum 우편번호 SDK — 동적 로드 (양호)

- 클라이언트 이벤트 트리거, 브라우저/npm 캐시 ✅

### A-6-4. 계산기 격리 — 정상

- `/calculator/*` 및 `/api/calculator/*` 미들웨어 우회 정상
- `src/lib/db/*` import 없음 확인 ✅

---

## Top 5 우선순위 요약

| # | 항목 | 영향 | 위험도 | 본 PR 처리 |
|---|------|------|--------|------------|
| **1** | `xlsx` 4개 클라이언트 컴포넌트 정적 → 동적 import | `/clients`, `/invoices/adjustment` 초기 번들 ~600KB ↓ | 낮음 | ✅ 처리 |
| **2** | `InvoiceRow` memo 미적용 + 인라인 콜백 | 조정료 행 100건 리렌더 10~20ms ↓ | 낮음 | ⏳ 후속 |
| **3** | `PropertyListManager` `router.refresh()` 중복 호출 | 행 추가/저장 후 200~500ms ↓ | 낮음 | ⏳ 후속 |
| **4** | 미들웨어 매 요청 `auth.getUser()` Supabase round-trip | 모든 페이지 30~100ms ↓ | 중간 | ⏳ 후속 |
| **5** | DB 인덱스 검증 + 추가 (clients, trader_properties, reports) | seq_scan → index_scan 전환 | 낮음 | ⏳ 사용자 SQL 검증 후 |

### 그 외 후속 후보

- A-1-2: `createClient()` 호출 횟수 최적화
- A-2-1: 전 영역 `select('*')` → 명시적 컬럼 좁히기
- A-4-3: 다중 `revalidatePath` 정리
- A-5-6: `exceljs` 미사용 의존성 제거
- A-5-7: Realtime 구독에 client_id/manager 필터 추가
- A-6-1, A-6-2: VWorld/건축물대장 캐싱

---

## Verification SQL

사용자가 Supabase SQL 에디터에서 직접 실행해주세요.

### 1. 현재 인덱스 현황 (정의된 모든 인덱스)

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'clients',
    'trader_properties',
    'trader_property_expenses',
    'income_tax_reports',
    'corporate_tax_reports',
    'adjustment_invoices',
    'adjustment_invoice_items',
    'report_share_links',
    'industry_codes_master'
  )
ORDER BY tablename, indexname;
```

### 2. 테이블별 시퀀셜 스캔 vs 인덱스 스캔 비율

```sql
SELECT
  schemaname,
  relname AS tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  CASE
    WHEN seq_scan + idx_scan = 0 THEN 0
    ELSE ROUND((100.0 * seq_scan / (seq_scan + idx_scan))::numeric, 1)
  END AS seq_scan_pct,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;
```

`seq_scan_pct`가 50% 이상이고 `row_count`가 큰 테이블이 인덱스 후보 1순위입니다.

### 3. 테이블별 데이터 크기 + 인덱스 비대화

```sql
SELECT
  relname AS tablename,
  n_live_tup AS row_count,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS table_size,
  pg_size_pretty(pg_indexes_size(relid)) AS indexes_size,
  n_dead_tup AS dead_rows,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC;
```

`dead_rows`가 `row_count` 대비 10% 이상이면 `VACUUM ANALYZE` 검토.

---

## Phase B 권장 작업 (다음 PR)

1. **InvoiceRow memo 적용 + 부모 useCallback 안정화** (PR #84 패턴)
2. **PropertyListManager router.refresh 제거 + 낙관적 업데이트** (PR #126 패턴)
3. **미들웨어 인증 캐시 최적화** (세션 토큰 검증 only 모드)
4. **`xlsx` 파서 파일 2개 추가 동적 import 전환** (`trader-upload-parser.ts`, `income-statement-parser.ts`)
5. **DB 인덱스 추가** — Verification SQL 결과 기반으로 마이그레이션 v39 작성
6. **다중 `revalidatePath` 정리** (clients, reports)
7. **Realtime 구독 필터링** (client_id / manager 단위)
8. **VWorld / 건축물대장 결과 캐싱**

각 항목은 측정 → 변경 → 회귀 검증 순서로 별도 PR.

---

*본 보고서는 Phase A의 산출물이며, 본 PR에서는 위 Top 5 중 1번 항목(xlsx 동적 import 전환)만 적용했습니다. 나머지는 측정 → 회귀 검증 절차를 거쳐 별도 PR로 진행 권장.*
