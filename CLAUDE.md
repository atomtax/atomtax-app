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
Database  : Supabase (PostgreSQL) — 기존 DB 유지
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
│       ├── layout.tsx                  # 사이드바 포함 공통 레이아웃
│       ├── dashboard/page.tsx
│       ├── clients/
│       │   ├── page.tsx                # 고객 목록
│       │   ├── [id]/page.tsx           # 고객 상세
│       │   └── terminated/page.tsx     # 해지고객
│       ├── invoices/
│       │   ├── tax/page.tsx            # 세금계산서
│       │   └── adjustment/page.tsx     # 조정료 청구서
│       ├── traders/
│       │   ├── page.tsx                # 물건 목록
│       │   ├── [clientId]/page.tsx     # 고객별 상세
│       │   ├── checklist/page.tsx
│       │   └── vat/page.tsx
│       └── reports/
│           ├── corporate-tax/page.tsx  # 법인세 보고서
│           ├── income-tax/page.tsx     # 종합소득세 (예정)
│           ├── vat/page.tsx            # 부가가치세 (예정)
│           └── settlement/page.tsx     # 결산보고서 (예정)
├── components/
│   ├── ui/                             # 공통 UI 컴포넌트
│   ├── layout/                         # 사이드바, 헤더 등
│   ├── clients/                        # 고객 관련 컴포넌트
│   ├── invoices/                       # 청구서 관련 컴포넌트
│   ├── traders/                        # 매매사업자 관련 컴포넌트
│   └── reports/                        # 보고서 관련 컴포넌트
├── lib/
│   ├── supabase/
│   │   ├── server.ts                   # 서버용 클라이언트
│   │   └── client.ts                   # 클라이언트용 (최소화)
│   ├── db/                             # DB 접근 함수 모음
│   │   ├── clients.ts
│   │   ├── invoices.ts
│   │   ├── traders.ts
│   │   └── reports.ts
│   └── utils/                          # 공통 유틸 함수
│       ├── format.ts                   # 숫자/날짜 포맷
│       └── fee-calculator.ts           # 보수기준표 계산 로직
└── types/
    └── database.ts                     # DB 타입 정의 (자동생성 또는 수동)
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

### 5-2. corporate_tax_reports (법인세 보고서)

```sql
CREATE TABLE corporate_tax_reports (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                 UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  year                      INTEGER NOT NULL,
  revenue                   NUMERIC(20,2),
  net_profit                NUMERIC(20,2),
  tax_payment               NUMERIC(20,2),
  tax_refund                NUMERIC(20,2),
  prepaid_tax               NUMERIC(20,2),
  current_loss              NUMERIC(20,2),
  carryforward_loss         NUMERIC(20,2),
  tax_credit_type           VARCHAR(100),
  tax_credit_increase       NUMERIC(20,2),
  tax_credit_carryforward   NUMERIC(20,2),
  tax_credit_note           TEXT,
  has_tax_credit            BOOLEAN DEFAULT TRUE,
  requires_faithful_report  BOOLEAN DEFAULT FALSE,
  faithful_report_note      TEXT,
  additional_notes          TEXT,
  income_statement          JSONB,
  financial_statements      JSONB,
  calculated_tax            NUMERIC(20,2),
  local_tax                 NUMERIC(20,2),
  rural_tax                 NUMERIC(20,2),
  determined_tax            NUMERIC(20,2),
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, year)
);
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
  year                  INTEGER,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
```

### 5-4. trader_inventory (매매사업자 물건)

```sql
CREATE TABLE trader_inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  property_name   VARCHAR(255),
  acquisition_date DATE,
  disposal_date   DATE,
  report_deadline DATE,
  status          VARCHAR(20) DEFAULT '미확인'
                  CHECK (status IN ('미확인', '진행중', '완료')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 5-5. expenses (필요경비)

```sql
CREATE TABLE expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES trader_inventory(id) ON DELETE CASCADE,
  category    VARCHAR(100),
  amount      NUMERIC(15,2),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. 페이지 구조

```
/ → /login 리다이렉트
/login                        로그인 페이지

/dashboard                    대시보드 (요약 카드)

/clients                      기장고객 목록 (검색/필터/정렬)
/clients/[id]                 고객 상세 + 연결된 보고서/청구서
/clients/terminated           해지고객 목록

/invoices/tax                 세금계산서 목록/발행
/invoices/adjustment          조정료 청구서 (자동계산 + 인쇄)

/traders                      매매사업자 물건 전체 목록
/traders/[clientId]           고객별 물건 상세
/traders/checklist            체크리스트
/traders/vat                  부가세 계산

/reports/corporate-tax        법인세 보고서 (입력 + 인쇄)
/reports/income-tax           종합소득세 보고서 (Phase 4)
/reports/vat                  부가가치세 보고서 (Phase 4)
/reports/settlement           결산보고서 (Phase 4)
```

---

## 7. 핵심 기능 명세

### 7-1. 고객 관리

- 목록: 검색, 법인/개인 필터, 정렬 (고객번호/상호명/계약일)
- CRUD: 추가/수정/삭제, 해지 처리 (`is_terminated = true`)
- Excel 일괄 등록 (xlsx 파싱), Excel 내보내기
- 고객 상세: 기본정보 + 연결된 보고서/청구서 목록

### 7-2. 조정료 청구서

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

**개인 보수기준표:** (기존 로직 그대로 유지 — 추후 별도 명시)

- 조정료, 세액공제 추가, 성실신고 확인료, 할인 적용
- A4 인쇄 레이아웃 (PDF 저장 가능)
- 저장 시 Supabase에 즉시 반영

### 7-3. 법인세 보고서

- 고객 선택 → 연도 선택 → 데이터 입력
- 자동 계산: 법인세, 지방세(10%), 농어촌세, 결정세액
- 재무제표 입력 (손익계산서 등 JSONB 구조)
- A4 인쇄 레이아웃 (기존 PPT 스타일 유지)
- 저장 즉시 DB 반영

### 7-4. 매매사업자 관리

- 물건 목록 (고객별 필터)
- 취득일/양도일/신고기한 관리
- 진행단계: 미확인 → 진행중 → 완료
- 필요경비 상세 입력
- 부가세 계산

---

## 8. 디자인 가이드

| 항목 | 내용 |
|------|------|
| 레이아웃 | 왼쪽 사이드바 (240px) + 오른쪽 콘텐츠 |
| 메인 컬러 | 보라-파랑 그라디언트 `#667eea → #764ba2` |
| 폰트 | Inter |
| 인쇄 | A4, 여백 20mm, 흑백 인쇄 가능 |
| 반응형 | 데스크톱 우선 (모바일 대응 불필요) |

---

## 9. 코드 규칙

- TypeScript 필수, `any` 타입 금지
- 컴포넌트 → `src/components/`
- DB 접근 함수 → `src/lib/db/`
- 공통 유틸 → `src/lib/utils/`
- 페이지 → `src/app/` (App Router)
- 저장 실패 시 재시도 로직 + 사용자에게 성공/실패 알림 표시
- CDN 라이브러리 로드 금지 (npm install 사용)
- 디버그/테스트 파일 운영 코드에 혼재 금지

---

## 10. 패키지 목록

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install xlsx
npm install react-to-print
npm install date-fns
npm install lucide-react
```

---

## 11. 개발 우선순위

### Phase 1 — 핵심 골격 (지금 시작)
- [x] Next.js 15 프로젝트 세팅 (TypeScript + Tailwind + App Router)
- [x] 패키지 설치
- [x] 폴더 구조 생성
- [x] Supabase 클라이언트 설정 (서버/클라이언트 분리)
- [x] DB 타입 정의 (`src/types/database.ts`)
- [x] 공통 레이아웃 (사이드바 + 헤더)
- [x] 로그인/로그아웃 (Supabase Auth)
- [x] 고객 목록 페이지 (검색/필터 포함)
- [x] 고객 추가/수정/삭제
- [x] 고객 상세 페이지

### Phase 2 — 핵심 업무 기능
- [ ] 조정료 청구서 (자동계산 + 저장 + 인쇄)
- [ ] 법인세 보고서 (입력 + 저장 + 인쇄)

### Phase 3 — 매매사업자
- [ ] 물건 목록 + 상세
- [ ] 체크리스트
- [ ] 부가세 계산

### Phase 4 — 나머지 보고서
- [ ] 세금계산서
- [ ] 종합소득세 / 부가가치세 / 결산보고서
- [ ] Excel 일괄 등록/내보내기

---

## 12. 다중 사용자 운영 방법

- 직원 계정 추가: Supabase 대시보드 → Authentication → Users → Invite User
- 직원이 이메일로 초대받아 비밀번호 설정 후 로그인
- 한 직원이 저장하면 → DB 즉시 반영 → 다른 직원이 새로고침 시 확인 가능

---

## 13. 자동화 배포 흐름

```
claude.ai/code에서 코드 수정
        ↓ (자동)
GitHub atomtax/atomtax-app에 저장
        ↓ (자동, 1~2분)
Vercel이 변경 감지 → 빌드 → 배포
        ↓
실제 웹사이트 자동 업데이트 완료
```
