# CLAUDE.md — 아톰세무회계 내부 업무 시스템

> Claude Code가 이 파일을 자동으로 읽고 작업 컨텍스트로 사용합니다.
> 질문 없이 이 문서 기준으로 바로 작업을 시작하세요.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 아톰세무회계 내부 업무 시스템 |
| 목적 | 세무회계 사무소 내부 직원용 — 고객 관리, 보고서 작성, 청구서 발행 |
| 사용자 | 내부 직원 5명 이하, 각자 계정으로 로그인 |
| 접속 환경 | 데스크톱 브라우저 (Chrome 권장) |
| 개발 도구 | claude.ai/code (웹버전) |
| 저장소 | GitHub — atomtax/atomtax-app |
| 배포 | Vercel (GitHub push 시 자동 배포) |

---

## 2. 확정 기술 스택

```
Frontend  : Next.js 15 (App Router) + TypeScript
Styling   : Tailwind CSS
Database  : Supabase (PostgreSQL)
Auth      : Supabase Auth (직원별 이메일 계정)
배포      : Vercel (GitHub 연동 자동 배포)
```

### 핵심 원칙
- **모든 DB 접근은 서버 사이드에서만** (Server Actions / API Routes)
- 브라우저에서 Supabase 직접 호출 **절대 금지**
- `localStorage`에 업무 데이터 저장 **금지** (UI 상태만 허용)
- `any` 타입 **금지**, TypeScript 타입 명시 필수

---

## 3. 환경변수

```env
# .env.local — git에 절대 올리지 말 것 (.gitignore에 포함)
NEXT_PUBLIC_SUPABASE_URL=https://vdjyynwmnypuxvlhrcbk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=        # 서버 전용 (브라우저 노출 금지)
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # 읽기 전용 작업에만 사용
```

> Vercel 배포 시 대시보드 → Settings → Environment Variables에 동일하게 입력

---

## 4. 폴더 구조

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── clients/
│       │   ├── page.tsx                # 고객 목록
│       │   ├── actions.ts              # 고객 CRUD Server Actions
│       │   ├── [id]/page.tsx           # 고객 상세
│       │   └── terminated/page.tsx     # 해지고객
│       ├── invoices/
│       │   ├── tax/page.tsx
│       │   └── adjustment/
│       │       ├── page.tsx            # 조정료 청구서 목록/작성
│       │       └── [id]/print/page.tsx # 청구서 인쇄
│       ├── traders/
│       │   ├── page.tsx
│       │   ├── [clientId]/page.tsx
│       │   ├── checklist/page.tsx
│       │   └── vat/page.tsx
│       └── reports/
│           ├── corporate-tax/
│           │   ├── page.tsx            # 법인세 보고서 목록 (담당자별 카드)
│           │   └── [clientId]/
│           │       ├── page.tsx        # 법인세 보고서 작성
│           │       └── print/page.tsx  # 법인세 보고서 인쇄
│           ├── income-tax/page.tsx     # (예정)
│           ├── vat/page.tsx            # (예정)
│           └── settlement/page.tsx     # (예정)
├── app/actions/
│   └── corporate-tax-reports.ts       # ensureCorporateTaxReport, saveCorporateTaxReportFull
├── components/
│   ├── ui/
│   ├── layout/                         # Sidebar.tsx 등
│   ├── print/
│   │   ├── A4Page.tsx                  # A4 인쇄 래퍼
│   │   └── PrintButton.tsx             # window.print() 버튼
│   ├── clients/
│   │   ├── ClientListManager.tsx
│   │   ├── ClientFormModal.tsx
│   │   ├── ClientDetailModal.tsx
│   │   └── ClientExcelImportModal.tsx
│   ├── invoices/
│   │   ├── AdjustmentInvoiceManager.tsx
│   │   ├── AdjustmentInvoicePrint.tsx
│   │   └── AdjustmentInvoiceFeeSchedule.tsx
│   └── reports/
│       ├── CorporateTaxFilters.tsx     # 연도/담당자/검색 필터
│       ├── CorporateTaxReportList.tsx  # 담당자별 그룹 카드 목록
│       ├── CorporateTaxReportCard.tsx  # 개별 고객 카드
│       ├── CorporateTaxReportForm.tsx  # 보고서 작성 메인 폼
│       ├── CorporateTaxPrint.tsx       # A4 인쇄 레이아웃
│       ├── IncomeStatementUpload.tsx   # 위하고 엑셀 업로드/파싱
│       ├── IncomeStatementTable.tsx    # 손익계산서 10개 항목 테이블
│       ├── FinancialSummary.tsx        # 매출액/순이익 입력
│       ├── TaxCalculationSection.tsx   # 세금 계산 테이블
│       ├── TaxCreditsSection.tsx       # 세액공제 항목 관리
│       ├── TaxReductionsSection.tsx    # 세액감면 항목 관리
│       └── NotesSection.tsx            # 메모/의견/성실신고 체크
├── lib/
│   ├── supabase/
│   │   ├── server.ts                   # createClient() — 서버용 (service role key)
│   │   └── client.ts                   # 클라이언트용 (최소화)
│   ├── calculators/
│   │   ├── corporate-tax.ts            # calculateCorporateTax/LocalTax/RuralTax
│   │   ├── fee-schedule.ts             # 조정료 보수기준표 계산
│   │   └── income-statement-parser.ts  # 위하고 엑셀 파싱
│   ├── constants/
│   │   └── office.ts                   # OFFICE 상수 (사무소 정보)
│   ├── db/
│   │   ├── clients.ts
│   │   ├── adjustment-invoices.ts
│   │   ├── corporate-tax-reports.ts    # listCorporateClientsWithReports 등
│   │   └── reports.ts
│   └── utils/
│       └── format.ts                   # formatAmount, normalizeBillingMonth 등
└── types/
    └── database.ts                     # 전체 DB 타입 정의
```

---

## 5. 데이터베이스 스키마

### 5-1. clients (기장고객)

```sql
CREATE TABLE clients (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number                  VARCHAR(10),
  company_name            VARCHAR(255) NOT NULL,
  business_number         VARCHAR(20),
  corporate_number        VARCHAR(20),
  representative          VARCHAR(100),
  manager                 VARCHAR(100),
  phone                   VARCHAR(20),
  address                 TEXT,
  business_type           VARCHAR(100),
  business_item           VARCHAR(100),
  business_type_category  VARCHAR(10) DEFAULT '개인'
                          CHECK (business_type_category IN ('법인', '개인')),
  start_date              DATE,
  end_date                DATE,
  contract_amount         NUMERIC(15,2),
  supply_amount           NUMERIC(15,2),
  tax_amount              NUMERIC(15,2),
  is_terminated           BOOLEAN DEFAULT FALSE,
  termination_date        DATE,
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

### 5-2. corporate_tax_reports (법인세 보고서) ← v17 마이그레이션 완료

```sql
CREATE TABLE corporate_tax_reports (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                     UUID REFERENCES clients(id) ON DELETE SET NULL,

  report_year                   INTEGER NOT NULL,
  status                        VARCHAR(20) NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'completed')),

  -- 손익계산서
  income_statement_filename     TEXT,
  income_statement_period_label TEXT,
  income_statement_summary      JSONB,          -- IncomeStatementSummary

  -- 재무 현황
  revenue                       NUMERIC(20,2),
  net_income                    NUMERIC(20,2),

  -- 세금 계산 결과
  calculated_tax                NUMERIC(20,2) NOT NULL DEFAULT 0,
  determined_tax                NUMERIC(20,2) NOT NULL DEFAULT 0,
  local_tax                     NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_special_tax             NUMERIC(20,2) NOT NULL DEFAULT 0,
  prepaid_tax                   NUMERIC(20,2) NOT NULL DEFAULT 0,
  final_tax                     NUMERIC(20,2) NOT NULL DEFAULT 0,

  -- 결손금
  current_loss                  NUMERIC(20,2) NOT NULL DEFAULT 0,
  carryover_loss                NUMERIC(20,2) NOT NULL DEFAULT 0,

  -- 세액공제/감면 (JSONB 배열)
  tax_credits                   JSONB NOT NULL DEFAULT '[]',  -- TaxCredit[]
  tax_reductions                JSONB NOT NULL DEFAULT '[]',  -- TaxReduction[]

  -- 메모
  is_sincere_filing             BOOLEAN NOT NULL DEFAULT FALSE,
  additional_notes              TEXT,
  conclusion_notes              TEXT,

  completed_at                  TIMESTAMPTZ,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(client_id, report_year)
);

-- RLS: 인증된 사용자 전체 접근 허용
ALTER TABLE corporate_tax_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_full_access" ON corporate_tax_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 5-3. adjustment_invoices (조정료 청구서)

```sql
CREATE TABLE adjustment_invoices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID REFERENCES clients(id),
  business_type         VARCHAR(20) NOT NULL
                        CHECK (business_type IN ('corporate', 'individual')),
  client_name           VARCHAR(255) NOT NULL,
  business_number       VARCHAR(20),
  revenue               BIGINT DEFAULT 0,
  settlement_fee        BIGINT DEFAULT 0,
  adjustment_fee        BIGINT DEFAULT 0,
  tax_credit_additional BIGINT DEFAULT 0,
  faithful_report_fee   BIGINT DEFAULT 0,
  discount              BIGINT DEFAULT 0,
  final_fee             BIGINT DEFAULT 0,
  supply_amount         BIGINT,
  vat_amount            BIGINT,
  total_amount          BIGINT,
  year                  INTEGER,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
```

### 5-4. trader_inventory (매매사업자 물건)

```sql
CREATE TABLE trader_inventory (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  property_name    VARCHAR(255),
  acquisition_date DATE,
  disposal_date    DATE,
  report_deadline  DATE,
  status           VARCHAR(20) DEFAULT '미확인'
                   CHECK (status IN ('미확인', '진행중', '완료')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### 5-5. expenses (필요경비)

```sql
CREATE TABLE expenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES trader_inventory(id) ON DELETE CASCADE,
  category     VARCHAR(100),
  amount       NUMERIC(15,2),
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. 페이지 구조

```
/ → /login 리다이렉트
/login                                      로그인 페이지

/dashboard                                  대시보드

/clients                                    기장고객 목록 (검색/필터/정렬/페이지네이션)
/clients/[id]                               고객 상세
/clients/terminated                         해지고객 목록

/invoices/adjustment                        조정료 청구서 (자동계산 + 저장 + 인쇄)
/invoices/adjustment/[id]/print             청구서 A4 인쇄

/reports/corporate-tax                      법인세 보고서 목록 (연도/담당자 필터, 카드뷰)
/reports/corporate-tax/[clientId]           법인세 보고서 작성 (손익계산서 업로드 + 세금계산 + 저장)
/reports/corporate-tax/[clientId]/print     법인세 보고서 A4 인쇄

/traders                                    매매사업자 물건 목록
/traders/[clientId]                         고객별 물건 상세
/traders/checklist                          체크리스트
/traders/vat                                부가세 계산
```

---

## 7. 핵심 기능 명세

### 7-1. 고객 관리 ✅ 완료

- 목록: 검색, 법인/개인 필터, 정렬, 페이지당 표시 수 선택, 상단/하단 페이지네이션
- CRUD: 추가/수정/삭제, 해지 처리
- Excel 일괄 등록 (xlsx 파싱, `cellDates: true`, 최초출금월 자동 정규화)
- 공급가액 입력 시 부가세(10%) 자동 계산
- 최초출금월: `type="month"` 입력, `normalizeBillingMonth()` 로 Excel serial → YYYY-MM 변환

### 7-2. 조정료 청구서 ✅ 완료

**법인 보수기준표:**
```
매출액 1억 이하         : 500,000원
매출액 1억 ~ 3억        : 500,000 + (초과분 × 0.20%)
매출액 3억 ~ 5억        : 900,000 + (초과분 × 0.20%)
매출액 5억 ~ 10억       : 1,300,000 + (초과분 × 0.15%)
매출액 10억 ~ 30억      : 2,050,000 + (초과분 × 0.10%)
매출액 30억 ~ 50억      : 4,050,000 + (초과분 × 0.08%)
매출액 50억 ~ 100억     : 5,650,000 + (초과분 × 0.06%)
매출액 100억 초과       : 8,650,000 + (초과분 × 0.04%)
```
- 조정료, 세액공제 추가, 성실신고 확인료, 할인 적용
- A4 인쇄 레이아웃 (보수기준표 별지 포함)
- 저장 시 Supabase 즉시 반영

### 7-3. 법인세 보고서 ✅ 완료 (v17a~v17c)

**목록 페이지 (`/reports/corporate-tax`)**
- 연도/담당자 필터, 검색 (URL searchParams 기반)
- 담당자별 그룹 카드 뷰, 완료/초안/미작성 상태 표시
- 고객사 새로고침 버튼

**작성 페이지 (`/reports/corporate-tax/[clientId]`)**
- 신고연도 ← → 버튼으로 전환 (연도별 별도 보고서)
- 매출 1,500억 이상 → 성실신고 대상 안내 배너
- 위하고 손익계산서 엑셀 업로드 → 자동 파싱 (10개 항목 매핑)
- 재무 현황: 매출액/순이익 입력 (엑셀 파싱 값 자동 채움 + 직접 수정 가능)
- **세금 계산** (실시간 자동 계산):
  - 과세표준 = 당기순이익 − 이월결손금
  - 산출세액 = `calculateCorporateTax(과세표준, year)` (누진세율)
  - 결정세액 = 산출세액 − 세액공제 합계 − 세액감면 합계
  - 지방소득세 = 결정세액 × 10%
  - 농어촌특별세 = 감면액 × 20%
  - 최종납부세액 = 결정세액 + 지방세 + 농어촌세 − 기납부세액
- **세액공제**: 항목 추가/삭제, 당기·이월 금액 입력
- **세액감면**: 항목 추가/삭제, 농어촌특별세 실시간 안내
- **메모**: 추가 메모, 결론/의견, 성실신고 체크박스
- 저장 → `saveCorporateTaxReportFull` (전체 필드 일괄 저장)

**인쇄 페이지 (`/reports/corporate-tax/[clientId]/print`)**
- A4 레이아웃: 손익계산서 요약 → 세금 계산 → 세액공제/감면 내역 → 메모
- `PrintButton` → `window.print()`, PDF 저장 가능

**법인세율 (2025/2026):**
```
2025: 9%(~2억) / 19%(~200억) / 21%(~3,000억) / 24%(초과)
2026: 10%(~2억) / 20%(~200억) / 22%(~3,000억) / 25%(초과)
```

### 7-4. 매매사업자 관리 (구현됨, 추가 개선 예정)

- 물건 목록, 취득일/양도일/신고기한 관리
- 진행단계: 미확인 → 진행중 → 완료
- 부가세 계산 페이지

---

## 8. 디자인 가이드

| 항목 | 내용 |
|------|------|
| 레이아웃 | 왼쪽 사이드바 (240px) + 오른쪽 콘텐츠 |
| 메인 컬러 | 보라-파랑 그라디언트 `#667eea → #764ba2` |
| 폰트 | Inter |
| 인쇄 | A4, `<A4Page>` 컴포넌트 사용, `no-print` 클래스로 버튼 숨김 |
| 반응형 | 데스크톱 우선 (모바일 대응 불필요) |

---

## 9. 코드 규칙

- TypeScript 필수, `any` 타입 금지
- 컴포넌트 → `src/components/`
- DB 접근 함수 → `src/lib/db/`
- 공통 유틸 → `src/lib/utils/`
- 페이지 → `src/app/` (App Router)
- 저장 실패 시 사용자에게 alert로 성공/실패 알림
- CDN 라이브러리 로드 금지 (npm install 사용)
- `xlsx` 정적 import 필수 (`import * as XLSX from 'xlsx'`) — 동적 import 금지

---

## 10. Next.js 15 / Supabase 패턴 및 주의사항

### Supabase 클라이언트
- 서버 컴포넌트·서버 액션에서는 **`createClient()`** 사용 (`src/lib/supabase/server.ts`)
- `createServerClient` 직접 호출 금지 — 반드시 `createClient()` 래퍼 사용

### Server Actions (`'use server'`)
- 파일 상단에 `'use server'` 선언 시 해당 파일의 모든 export가 서버 액션이 됨
- **Server Component에서 서버 액션 호출 시 `revalidatePath` 사용 금지** — 렌더 중 호출 불가
- `revalidatePath`는 반드시 뮤테이션(저장/삭제) 액션 내부에서만 호출
- Client Component에서 서버 액션 호출 → 정상 (표준 패턴)

### Next.js 15 App Router
- `searchParams`, `params`는 `Promise` 타입 → `await` 필요
- `useSearchParams()` 사용 시 `<Suspense>` 래퍼 필수
- `'use client'` 컴포넌트의 import 체인도 서버에서 SSR됨 → 브라우저 전용 API 주의

### Supabase RLS
- **새 테이블 생성 시 RLS가 자동 활성화되나 정책은 자동 생성되지 않음**
- 새 테이블마다 반드시 RLS 정책 추가 필요:
  ```sql
  ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "authenticated_full_access" ON new_table
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
  ```
- 마이그레이션 파일에 정책 생성 구문 포함시킬 것

### 인쇄 레이아웃
- `<A4Page>` (`src/components/print/A4Page.tsx`) 래퍼 사용
- `<PrintButton>` → `window.print()` 호출
- 인쇄 시 숨길 요소: `className="no-print"` 또는 `fixed` 포지션 버튼
- 인라인 스타일 사용 (Tailwind 클래스는 인쇄 시 누락될 수 있음)
- `WebkitPrintColorAdjust: 'exact'` + `printColorAdjust: 'exact'` 로 배경색 보존

---

## 11. 패키지 목록

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install xlsx
npm install react-to-print
npm install date-fns
npm install lucide-react
```

---

## 12. 개발 우선순위

### Phase 1 — 핵심 골격 ✅ 완료
- [x] Next.js 15 프로젝트 세팅 (TypeScript + Tailwind + App Router)
- [x] 패키지 설치, 폴더 구조 생성
- [x] Supabase 클라이언트 설정 (서버/클라이언트 분리)
- [x] DB 타입 정의 (`src/types/database.ts`)
- [x] 공통 레이아웃 (사이드바 + 헤더)
- [x] 로그인/로그아웃 (Supabase Auth)
- [x] 고객 목록 페이지 (검색/필터/정렬/페이지네이션)
- [x] 고객 추가/수정/삭제, 해지 처리
- [x] 고객 상세 페이지
- [x] Excel 일괄 등록/내보내기

### Phase 2 — 핵심 업무 기능 ✅ 완료
- [x] 조정료 청구서 (자동계산 + 저장 + 인쇄)
- [x] 법인세 보고서 목록 (담당자별 카드, 연도/필터)
- [x] 법인세 보고서 작성 (손익계산서 파싱 + 세금 계산 + 세액공제/감면 + 저장)
- [x] 법인세 보고서 인쇄 (A4 레이아웃)

### Phase 3 — 매매사업자 (부분 완료)
- [x] 물건 목록 + 상세
- [x] 체크리스트
- [x] 부가세 계산
- [ ] 추가 개선 (필요 시)

### Phase 4 — 나머지 보고서
- [ ] 세금계산서
- [ ] 종합소득세 보고서
- [ ] 부가가치세 보고서
- [ ] 결산보고서

---

## 13. 다중 사용자 운영 방법

- 직원 계정 추가: Supabase 대시보드 → Authentication → Users → Invite User
- 직원이 이메일로 초대받아 비밀번호 설정 후 로그인
- 한 직원이 저장하면 → DB 즉시 반영 → 다른 직원이 새로고침 시 확인 가능

---

## 14. 자동화 배포 흐름

```
claude.ai/code에서 코드 수정
        ↓ (git push origin main)
GitHub atomtax/atomtax-app에 저장
        ↓ (자동, 1~2분)
Vercel이 변경 감지 → 빌드 → 배포
        ↓
실제 웹사이트 자동 업데이트 완료
```

> DB 스키마 변경 시: Supabase SQL 에디터에서 `migrations/` 폴더의 해당 파일 직접 실행
