# CLAUDE.md — Atom-base 내부 업무 시스템

> Claude Code가 이 파일을 자동으로 읽고 작업 컨텍스트로 사용합니다.
> 질문 없이 이 문서 기준으로 바로 작업을 시작하세요.

---

## ⚠️ GIT 작업 정책 — 절대 원칙

이 프로젝트는 **1인 작업이며 PR/리뷰 절차가 없습니다.**

### 푸시 정책
- **항상 main 브랜치에서 직접 작업 의도**
- **다른 브랜치 생성 금지** — `feature/*`, `fix/*` 등 모두 금지
- **모든 작업 후 즉시 커밋 + main 푸시**

### 환경 제약 — Claude Code 컨테이너 프록시
- claude.ai/code 환경의 git 프록시가 main 직접 푸시 차단 (HTTP 403)
- 지정된 브랜치 `claude/push-to-main-KjAEB`로만 푸시 가능
- **자동화 흐름** (사용자 명시적 허가):
  1. 단계별 즉시 commit + push to `claude/push-to-main-KjAEB`
  2. 작업 완료 후 PR 자동 생성: `gh pr create --base main --head claude/push-to-main-KjAEB ...`
  3. Squash 머지: `gh pr merge --squash`
  4. 로컬 main 동기화: `git fetch origin && git checkout main && git pull`

### 휘발 방지 — 핵심
- 각 단계 끝날 때마다 **즉시** 커밋 + 푸시
- 큰 작업도 단계별로 나눠서 각 단계마다 커밋
- 한 작업 세션 내에 **최소 3회 이상** 커밋 분할

### Vercel 빌드 정책 (PR #106)
- **`claude/push-to-main-KjAEB` 브랜치는 Vercel 빌드 트리거 안 함** (`vercel.json`에 설정)
- main 머지된 후에만 빌드 (중복 빌드 제거)
- Hobby 플랜 동시 빌드 1개 제한이라 큐 점유 절감

### 마이그레이션 SQL 정책
- DB 스키마 변경 작업 시 작업지시서에 **마이그레이션 SQL 전문** 함께 포함
- 사용자가 Supabase SQL 에디터에서 직접 실행
- Claude Code는 SQL 파일만 저장 (재실행 금지)
- **메모리**: DB 마이그레이션 SQL이 작업지시서에 포함될 때는 채팅 메시지에도 SQL 전문을 별도 코드 블록으로 명확하게 표시

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | **Atom-base** (아톰베이스, 아톰세무회계 내부 인트라넷) |
| 슬로건 | "세금은 원자단위로 정확하게, 시야는 우주처럼 크게" (브랜드 정체성, UI 미표시) |
| 목적 | 세무회계 사무소 내부 직원용 — 고객 관리, 보고서 작성, 청구서 발행, 매매사업자 관리, 결산참고, 부가세 계산기 |
| 사용자 | 내부 직원 5명 이하 + 부가세 계산기는 공개 |
| 접속 환경 | 데스크톱 브라우저 (Chrome 권장) + 부가세 계산기는 모바일 지원 |
| 개발 도구 | Claude Desktop App (Windows) |
| 저장소 | GitHub — atomtax/atomtax-app |
| 배포 | Vercel — https://atomtax-app.vercel.app |
| Claude 플랜 | Max |

### 네이밍 체계
- **아톰베이스** (Atom-base): 내부 인트라넷 (이 시스템)
- 아톰스페이스 (Atom Space): 외부 랜딩페이지
- 아톰스테이션 (Atom Station): 사무실
- **아톰랩** (Atom Lab): 내부 실험공간/베타 기능 (사이드바 마지막 별도 섹션)

---

## 2. 확정 기술 스택

```
Frontend     : Next.js 15 (App Router) + TypeScript
Styling      : Tailwind CSS
Database     : Supabase (PostgreSQL)
Auth         : Supabase Auth
PDF/PNG      : jsPDF + html2canvas (공통 유틸 pdf-export.ts)
PDF 파싱     : pdf-parse (건축물대장 PDF 자동 추출)
엑셀 파싱    : xlsx (SheetJS Community)
엑셀 생성    : exceljs (data validation 드롭다운 지원)
드래그앤드롭 : @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
배포         : Vercel (GitHub 연동 자동 배포)
실시간       : Supabase Realtime (체크리스트)
토스트       : 자체 Toast 컴포넌트 (src/components/ui/Toast.tsx)
폰트         : Pretendard (한글) + Outfit (영문 디스플레이)
```

### 핵심 원칙
- 모든 DB 접근은 서버 사이드에서만 (Server Actions / API Routes)
- 브라우저에서 Supabase 직접 호출 절대 금지
- `localStorage`에 업무 데이터 저장 금지
- `any` 타입 금지
- CDN 라이브러리 로드 금지
- 무거운 라이브러리(xlsx, exceljs, html2canvas, jspdf)는 **dynamic import**

### 부가세 계산기 보안 격리 (공개 페이지)
- `/calculator/*` 및 `/api/calculator/*`는 미들웨어에서 인증 제외 (PR #101)
- 계산기 코드는 Supabase DB/clients/trader_properties import 절대 금지
- 사이드바에서 부가세 계산기는 외부 링크 (단방향, 새 탭)
- 매 작업 후 `grep`으로 격리 검증

---

## 3. 환경변수

```env
NEXT_PUBLIC_SUPABASE_URL=https://vdjyynwmnypuxvlhrcbk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 부가세 계산기 외부 API
NEXT_PUBLIC_VWORLD_API_KEY=       # 클라이언트 측, 도메인 검증
BUILDING_REGISTER_API_KEY=        # 서버 사이드 전용 (공공데이터포털)
VWORLD_API_KEY=                   # 서버측 미사용 보존

# Cron 작업 (공유 링크 만료 정리)
CRON_SECRET=                      # Vercel Cron 인증
```

### vercel.json (PR #106)
- `crons`: 공유 링크 만료 정리 (`/api/cron/cleanup-share-links`)
- `git.deploymentEnabled`: `claude/push-to-main-KjAEB` false로 중복 빌드 차단

---

## 4. 페이지 구조

```
/dashboard

/clients                                    기장고객 목록
/clients/[id]                               고객 상세
/clients/terminated                         해지고객

/reports-review                             결산참고 (분기)
/reports-review/income-tax                  종합소득세 분기 선택
/reports-review/income-tax/personal         일반사업자 참고 (창감/중특, PR #91 단순화)
/reports-review/income-tax/trader           매매사업자 참고 (차감 후 양도가액)
/reports-review/vat                         부가가치세 (Phase 5)
/reports-review/corporate-tax               법인세 (Phase 5)

/invoices/adjustment                        조정료 청구서 (PNG 2페이지, 최종수수료)
/invoices/adjustment/[id]/print             A4 인쇄 + 별지
/invoices/tax                               세금계산서 (Phase 5)

/reports/corporate-tax                      법인세 보고서
/reports/income-tax                         종합소득세 보고서 (공유링크, 농특세, 임시 고객, 손실 표시)
/reports/vat                                부가가치세 보고서 (Phase 5)
/reports/settlement                         결산보고서 (Phase 5)

/traders                                    매매사업자 목록 (일괄 업로드)
/traders/[clientId]                         물건 마스터-디테일
/traders/checklist                          체크리스트 (Realtime, 신고기한 월별)

/atom-lab                                   아톰랩 (실험공간, placeholder)

/calculator/vat                             부가세 계산기 Landing (공개)
/calculator/vat/calc                        부가세 계산기 (공개, 모바일 지원)

/share/[token]                              공유 링크 페이지 (30일 만료)
/api/cron/cleanup-share-links               Vercel Cron
/api/calculator/*                           부가세 계산기 API (공개, 미들웨어 우회)
```

### 사이드바 메뉴 순서

```
ATOM BASE (로고 + 한 줄 대문자)
├── 대시보드
├── 고객 관리
│   ├── 기장고객 목록
│   └── 해지고객
├── 결산참고
│   ├── 부가가치세 (Phase 5)
│   ├── 종합소득세 (일반/매매 분기)
│   └── 법인세 (Phase 5)
├── 청구서 (조정료/세금계산서)
├── 매매사업자 관리
├── 보고서 작성 (법인세/종합소득세/부가가치세)
├── ─ ─ ─ EXPERIMENT ─ ─ ─
└── 아톰랩
```

부가세 계산기는 외부 링크(↗, 새 탭).

---

## 5. 핵심 데이터베이스 테이블 및 컬럼명 ⚠️

### ⚠️ 스키마 명명 — 추측 금지

스키마 추측이 빈번한 오류 원인이므로, **작업 전 반드시 `src/types/database.ts` 또는 `src/lib/db/` 에서 실제 컬럼명 확인**.

#### 확정된 스키마 정정 사항

| 테이블 | 추측한 컬럼명 (오답) | 실제 컬럼명 (정답) |
|--------|-------------------|------------------|
| clients | ~~business_name~~ | **company_name** |
| clients | ~~business_registration_number~~ | **business_number** |
| clients | ~~business_address~~ | **address** |
| trader_properties | ~~transfer_price~~ | **transfer_amount** |
| trader_properties | ~~address~~ | **location** |
| trader_property_expenses | ~~sort_order~~ | **row_no** |
| income_tax_reports | ~~operating_profit, profit_before_tax~~ | **operating_income, pretax_income** |

### 5-1. clients (기장고객)
- `company_name`, `business_number`, `address`, `business_category_code` (703011, 703012 = 매매사업자)
- `business_type_category`: '법인' | '개인'
- `business_item`, `manager`, `resident_number`
- `opening_date`: 개업일 (DATE)
- `is_terminated`, `is_temporary` (임시 고객)
- `google_drive_folder_url` / `trader_drive_folder_url`

### 5-2. corporate_tax_reports ✅ v17 (38컬럼)
### 5-3. income_tax_reports ✅ v19~v28
- `conclusion_sections`: JSONB 배열
- `income_statement_summary`: JSONB 요약 + `details` 키 (SGA 세부 항목)
  - 필드: `sales`, `cogs`, `gross_profit`, `sga`, **`operating_income`** (음수 가능), `non_op_income`, `non_op_expense`, **`pretax_income`** (음수 가능), `income_tax`, **`net_income`** (음수 가능)
  - 손실 케이스: 라벨에 "손실" 포함 시 파서가 음수로 저장 (PR #102)
- `farm_special_tax`: 농어촌특별세 (NUMERIC NOT NULL DEFAULT 0)
- `income_final_with_local`: 종합소득세 + 지방소득세 + 농특세

### 5-4. adjustment_invoice_items ✅ + v25 (매매업 할인)
- `maemae_discount`: 매매업 할인 NUMERIC
- `is_maemae_discount_manual`: 수동 수정 여부 BOOLEAN

### 5-5. trader_properties ✅ v20~v34
- `property_name`, `property_type` (아파트/빌라/다세대/다가구/오피스텔/기타)
- `location` (주소 ⚠️ address 아님)
- `acquisition_date`, `transfer_date`
- `transfer_amount` (총액 ⚠️ transfer_price 아님)
- `vat_amount`: 부가세
- `prepaid_income_tax`, `prepaid_local_tax`
- `transfer_income`: 자동 계산 `(transfer_amount - vat_amount) - 필요경비`
- `prior_transfer_income_override`, `prior_prepaid_income_tax_override`, `prior_prepaid_local_tax_override`
- `progress_status`: 5단계
- `filing_deadline`: 자동 계산 (양도일 + 2개월 말일)
  - ⚠️ **일괄 업로드 시 누락 가능** (PR #94에서 백필 SQL v35 실행됨)
- `land_area`, `building_area`
- **Realtime**: `ALTER PUBLICATION supabase_realtime ADD TABLE trader_properties;`

### 5-6. trader_property_expenses ✅ v20
- 10행 고정, `row_no`, `category`, `expense_name`, `predeclaration_allowed`, `income_tax_allowed`
- 비용명 드롭다운 5종: 취득가액, 취득세 등, 신탁말소비용, 중개수수료, 기타경비

### 5-7. income_tax_review_notes ✅ v22
### 5-8. trader_review_notes ✅ v23
### 5-9. report_share_links ✅ v27
- 보고서 외부 공유 (UUID PK, 30일 만료, RLS 2개)
- Cron 매일 03:00 UTC 정리

### 5-10. industry_codes_master ✅ v31 (1,611건)
- `industry_code` (PK), `mid_special_eligible`, `startup_eligible`, `small_biz_reduction_rate`

### 마이그레이션 이력
- v27 (PR #62): 공유 링크
- v28 (PR #63): 농어촌특별세
- v29 (PR #69): 임시 고객
- v30 (PR #73): 개업일
- v31 (PR #85): 업종코드 마스터
- v32 (PR #79): 종전 양도차익 override
- v33 (PR #80): 부가세 + 물건종류
- v34 (PR #82): 종전 기납부세액 override
- **v35 (PR #94)**: filing_deadline 백필 (일괄 업로드 누락 보정)

---

## 6. 핵심 기능별 진행 상황

### Phase 1~3 ✅ 완료
### Phase 4 ✅ 완료
- 매매사업자 시스템 + 부가가치세 계산기 + 결산참고 메뉴 + 종소세 완성도 + 업종코드 마스터

### Phase 4 → 5 사이 후속 패치 ✅ 완료
- **브랜딩** (#88~#90): Atom-base 리뉴얼, 가독성, 고정 스크롤
- **계산 정정** (#91): 창업감면 OR 단순화 + % 표시
- **체크리스트** (#92→#93, #94): NULL 처리 + filing_deadline 백필
- **race 제거** (#95): revalidatePath 다단계 정리
- **계산기 확장** (#96): 용도지수 주거/상업 분기 + 오피스텔 주거용 추가
- **보고서 단순화** (#99): 종소세 주식매수특례 등 6행 제거
- **모바일 자동조회** (#100): 미들웨어 `/api/calculator/*` 우회 추가
- **손익계산서 손실 표시** (#101~#105): 라벨 기반 부호 처리 + △ 표시 + 디버그 박스
- **빌드 최적화** (#106): vercel.json 중복 빌드 차단

### Phase 5 — 진행 예정
- [ ] 5-1: 부가가치세 보고서 (8~10h, 핵심)
- [ ] 5-2: 결산보고서 (8~12h, 핵심)
- [ ] 5-3: 세금계산서 양식 (4~6h)
- [ ] 5-4: 결산참고 부가가치세 (2~3h)
- [ ] 5-5: 결산참고 법인세 (2~3h)
- [ ] 5-6: 체크리스트 서류업로드 (Supabase Storage, 4~6h)

---

## 7. 디자인 가이드 (Atom-base 브랜드)

| 항목 | 내용 |
|------|------|
| 사이트명 | **ATOM BASE** (한 줄 대문자, Outfit 800, tracking-wider) |
| 로고 | `<AtomLogo />` (src/components/ui/AtomLogo.tsx, 원자 심볼 SVG, currentColor) |
| 브랜드 메인 컬러 | **`#6927FF`** (로고 추출) |
| 브랜드 다크 | `#5118e0` |
| 브랜드 라이트 | `#8b5cff` |
| 브랜드 소프트 (배경) | `#f4efff` |
| 그라디언트 | `linear-gradient(135deg, #6927FF 0%, #9333ea 100%)` |
| 사이드바 배경 | `linear-gradient(180deg, #6927FF 0%, #5118e0 100%)` (보라 그라디언트) |
| 사이드바 액티브 메뉴 | `bg-white text-brand font-extrabold shadow-sm` |
| 사이드바 일반 메뉴 | `text-white font-semibold text-[15px]` |
| EXPERIMENT 라벨 | `text-yellow-200 font-extrabold tracking-[2.5px]` |
| 결론 진파랑 박스 | `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)` (그대로 유지) |
| 환급/납부 강조 | 환급=파랑, 납부=초록 |
| 폰트 | Pretendard (한글) + Outfit (영문 디스플레이) |
| 인쇄 | A4, `<A4Page>`, `no-print` 클래스, `print:hidden` (사이드바) |
| 인증 영역 레이아웃 | `flex h-screen overflow-hidden` + main `overflow-y-auto` (PR #90) |
| 매매사업자 액션 버튼 | 세금계산=진한 보라 / 부가세계산기=연한 슬레이트 / 고객보고서=연한 인디고 |
| 매매사업자 보고서 폰트 | 본 물건 부담세액=text-3xl, 납부할 총세액=text-sm |
| 진행단계 배지 | 5단계 색상 (`PROGRESS_STYLES`) |
| 창감 배지 (PR #91) | 100%=green, 50%=emerald, X=gray |
| 중특 배지 | %=blue, X/-=gray |
| 손실 숫자 표시 (PR #101) | `△1,234,567` (빨간색) |
| 손익계산서 라벨 (PR #101) | 양수=Ⅴ.영업이익 / 음수=Ⅴ.영업손실 (동적) |

### 보라 배경 위 가독성 일반 원칙 (PR #89)
| 요소 | 권장 |
|---|---|
| 본문 텍스트 | `text-white font-semibold` |
| 보조 텍스트 | `text-white/95 font-medium` |
| 라벨/배지 | `text-yellow-200 font-extrabold tracking-wider` |
| 구분선 | `border-white/25` |
| 아이콘 | `strokeWidth={2.25}` |
| **금지** | `text-white/70` 이하 (보라 배경에서 흐릿) |

---

## 8. 코드 규칙

- TypeScript 필수, `any` 금지
- 컴포넌트 → `src/components/`
- DB 접근 → `src/lib/db/`
- 외부 API → `src/lib/api/{provider}/`
- 페이지 → `src/app/` (App Router)
- 유틸리티 → `src/lib/utils/`
- 정적 데이터 → `src/lib/data/`
- 모달/무거운 컴포넌트는 `dynamic` import (xlsx, exceljs, html2canvas, jspdf 등)

### ⚠️ 작업 시작 전 필수 점검
1. **스키마 확인**: `src/types/database.ts` 또는 `src/lib/db/` 에서 실제 컬럼명
2. **CLAUDE.md 5번 섹션** 스키마 정정 사항 참조
3. **추측으로 컬럼명 사용 금지**
4. **진단 우선** (PR #92~#94 회고): grep + 실제 파일 읽기로 사실 확인 후 진행

### 공통 유틸리티 위치
- `src/lib/utils/pdf-export.ts` — PDF 생성 공통
- `src/lib/utils/highlight-amounts.ts` — 수치+단위 강조
- `src/lib/utils/invoice-export.ts` — PNG 다운로드 공통
- `src/lib/utils/pnu.ts` — PNU 분해
- `src/lib/utils/startup-tax-reduction.ts` — 창업감면 OR 단순화 (PR #91)
- `src/lib/utils/format-amount.ts` — `formatIncomeAmount` (△ 음수 표시, PR #101)
- `src/lib/data/regional-zones.ts` — 권역 분류
- `src/lib/data/building-use-codes.ts` — 부가세 계산기 용도 45개 (PR #96)
- `src/lib/data/income-statement-labels.ts` — 손익계산서 동적 라벨 (PR #101)

### 자주 마주친 함정 (실제 발생 사례)

#### 1. Supabase `.or()` 필터의 값 파싱 버그 (PR #77)
- PostgREST `.or()`는 값 안의 `,` `.` 를 구분자로 인식
- **해결**: `.or()` 대신 `.in('column', [v1, v2, v3])` 사용

#### 2. UPSERT 시 같은 PK 중복 (PR #85 핫픽스)
- PostgreSQL: "ON CONFLICT DO UPDATE command cannot affect row a second time"
- **해결**: upsert 전에 Map으로 중복 제거 (마지막 값 우선)

#### 3. 클라이언트 컴포넌트 metadata 불가
- `'use client'`는 metadata export 못 함
- **해결**: 서버 컴포넌트 래퍼로 분리

#### 4. 동적 새 탭 열기 — 팝업 차단
- 비동기 작업 후 `window.open` → 팝업 차단
- **해결**: 빈 탭 먼저 열고 저장 성공 시 URL 변경

#### 5. router.refresh() 남용 (PR #84 성능 최적화)
- 매 액션마다 전체 페이지 re-fetch
- **해결**: 클라이언트 state로 즉시 갱신, 진짜 필요할 때만 router.refresh()

#### 6. React.memo 인라인 함수 무용 (PR #84)
- 부모가 onChange를 인라인 arrow function으로 전달 → 매 렌더 새 함수
- **해결**: dispatcher 패턴, useCallback'd 핸들러 + 자식이 propertyId 받기

#### 7. N+1 쿼리 (PR #87)
- 클라이언트 N명마다 업종코드 조회 → 100명 = 100쿼리
- **해결**: `getIndustryCodes(codes)` 배치 조회

#### 8. "안 보이는 데이터" 버그 = DB 데이터 자체가 잘못된 경우 (PR #94)
- 현상: 특정 케이스가 화면에 안 나타남
- 코드 필터링부터 의심하지 말고, **DB 데이터 실제 상태 확인 1순위**
- 특히 일괄 업로드/마이그레이션 등 다른 INSERT 경로에서 컬럼 누락 가능성
- 사용자 발언을 **현상**(안 보이는 케이스가 있다)과 **의도**(어떤 케이스가 보여야 한다)로 분리해서 진단
- 해결: 코드 수정 + DB 백필 SQL 함께

#### 9. 백그라운드 RSC refetch race (PR #95)
- 서버 액션 안 `revalidatePath`가 백그라운드 RSC refetch를 트리거
- 후속 액션이 DB 갱신해도 RSC refetch가 그 전 시점 데이터를 읽을 수 있음
- `useEffect [initialProperties]`가 stale 데이터로 낙관적 업데이트 덮어씀
- **해결**: 다단계 액션 흐름에서는 **마지막 액션만 revalidatePath**, 중간 단계는 제거

#### 10. 공개 페이지의 API 라우트도 미들웨어 우회 명시 필요 (PR #100)
- 공개 페이지(`/calculator/*`) 우회만으로는 부족 — 그 페이지가 호출하는 API(`/api/calculator/*`)도 함께 우회해야 함
- 누락 시 비로그인 POST → `/login` redirect → POST가 보존되어 → `/login` 페이지가 GET만 받으니 **HTTP 405**
- 데스크톱(로그인)은 안 보이고 모바일/시크릿창에서만 발생 → **환경별 재현 필수**

#### 11. 손익계산서 자동입력 — 라벨 기반 부호 처리 (PR #101)
- 엑셀 행 라벨이 이익/손실에 따라 동적으로 변함 ("영업이익" vs "영업손실")
- 숫자는 항상 절대값 → Roman numeral 매칭 후 라벨에서 "손실" 키워드 감지해서 음수 변환
- 표시: △ 1,234,567 (회계 관례, 빨간색) + 라벨도 동적 ("영업손실")
- 영향 행: 영업이익/손실, 차감전 이익/손실, 당기순이익/손실 — 매출액/매출원가/SGA는 불변
- 결론 멘트도 부호별 라벨 분기

#### 12. Vercel 중복 빌드 (PR #106)
- `claude/push-to-main-KjAEB` 브랜치 push + main squash 머지 = 같은 commit 두 번 빌드
- Hobby 플랜 동시 빌드 1개 제한이라 큐 빠르게 적체
- **해결**: `vercel.json`에 `git.deploymentEnabled` 설정으로 push 브랜치 빌드 비활성화
- 큐 막힘 시: 옛 Queued 모두 Cancel + 최신 main commit만 Redeploy

### 단방향 원칙 (매매사업자 종전 양도차익)
- `calculatePriorAmounts`는 SELECT만, 다른 물건 UPDATE 금지
- C 물건 [세금계산] 클릭이 A, B의 DB 데이터 절대 수정 X
- 양도일 < (strict) 조건으로 이전 물건만 합산

### 토스트 사용 패턴
```typescript
import { Toast } from '@/components/ui/Toast';
const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
setToast({ message: '세금계산이 완료되었습니다', type: 'success' });
{toast && <Toast {...toast} onClose={() => setToast(null)} />}
```

---

## 9. Next.js 15 / Supabase 패턴

### Supabase
- 서버 컴포넌트·서버 액션 → `createClient()` (`src/lib/supabase/server.ts`)
- 새 테이블 RLS 정책 필수
- Realtime 활성화: `ALTER PUBLICATION supabase_realtime ADD TABLE table_name;`

### Next.js 15
- `searchParams`, `params`는 `Promise` 타입 (`await` 필요)
- `useSearchParams()` 사용 시 `<Suspense>` 래퍼 필수

### 외부 API 호출 패턴
- **VWorld**: 클라이언트 측 JSONP (Vercel IP 차단 회피)
- **공공데이터포털**: 서버 사이드 Route Handler

### 미들웨어 우회 (PR #100)
공개 페이지의 모든 진입점이 우회 목록에 포함되어야 함:
```typescript
if (
  pathname.startsWith('/calculator') ||
  pathname.startsWith('/api/calculator/') ||  // ⭐ API도 우회
  pathname.startsWith('/share/') ||
  pathname.startsWith('/api/cron/')
) {
  return NextResponse.next();
}
```

---

## 10. 패키지

```bash
npm install @supabase/supabase-js @supabase/ssr xlsx exceljs react-to-print
npm install date-fns lucide-react jspdf html2canvas pdf-parse
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## 11. 개발 우선순위 / 진행 상황

### Phase 1~4 ✅ 완료
### 후속 패치 (PR #88~#106) ✅ 완료

### Phase 5 — 진행 예정
- [ ] 5-1: 부가가치세 보고서 (8~10h)
- [ ] 5-2: 결산보고서 (8~12h)
- [ ] 5-3: 세금계산서 양식 (4~6h)
- [ ] 5-4: 결산참고 부가가치세 (2~3h)
- [ ] 5-5: 결산참고 법인세 (2~3h)
- [ ] 5-6: 체크리스트 서류업로드 (Supabase Storage, 4~6h)

---

## 12. 다중 사용자 운영

- Supabase 대시보드 → Authentication → Invite User
- 직원이 이메일로 비밀번호 설정 후 로그인
- Realtime 활성화된 테이블은 새로고침 없이 즉시 동기화

---

## 13. 자동화 배포 흐름

```
코드 수정 → commit + push (claude/push-to-main-KjAEB)
        → PR 자동 생성 + Squash 머지 to main
        → Vercel 자동 배포 (main만 빌드, push 브랜치는 PR #106 설정으로 빌드 안 함)
        → 1~2분 후 production 반영
```

> DB 스키마 변경: Supabase SQL 에디터에서 `migrations/v*.sql` 직접 실행
> 큐 막힘 시: 옛 Queued Cancel + 최신 main commit Redeploy

---

## 14. 주요 결정 사항 (참고용)

### 부가가치세 계산기

#### 용도지수 (PR #96)
- 시행령 별표 45개 정적 데이터: `src/lib/data/building-use-codes.ts`
- 1차 분기: **주거용 / 상업용** (산업용 46~60, 기계식주차 61은 보류)
- 2차 분류: 18종 (숙박/판매/위락/.../장례식장)
- 오피스텔: 상업용(코드 28) + **주거용 임대용**(코드 100, 시행령 외 편의 항목, 지수 동일 140)
- usageId 키: 시행령 code의 string ('1', '2', '28', '41' 등)
- 자동조회 매핑 5종: 아파트→'1', 단독/다세대→'2', 오피스텔→'28', 근린생활시설→'41', 업무시설→'29'
- 모바일: 폰트 16px 이상 (자동 zoom 방지), `<select>` + `optgroup` (native picker 그룹 헤더)

#### 모바일 자동조회 (PR #100)
- 미들웨어 우회 목록에 `/api/calculator/*` 추가 필수 (없으면 비로그인 POST → /login → 405)

#### 동/호 매칭, hoNm 재시도, 표제부 폴백, 잔가율
[기존 Phase 4-2 결정 그대로 유지]

### 결산참고 메뉴

#### 일반사업자 — 창감/중특 (PR #91 단순화)
```
업종코드 → industry_codes_master.startup_eligible 확인
       ↓
'O'면:
  사업장 주소 → 권역 (과밀억제 vs 비과밀억제)
  주민번호 + 개업일 → 만 34세 이하 여부
       ↓
  OR 조건 분기:
    - 비과밀억제 AND 청년 (둘 다): 100%
    - 비과밀억제 OR 청년 (하나만): 50%
    - 둘 다 X (과밀 + 일반): X
```

중특감면: `mid_special_eligible='O'`면 `small_biz_reduction_rate` 표시 (예: "30%")

### 매매사업자 비즈니스 로직

#### 양도소득 계산식 (차감 후 양도가액 기준)
```
차감 후 양도가액 = transfer_amount - vat_amount
양도소득(transfer_income) = (transfer_amount - vat_amount) - SUM(필요경비)
부가세 0이면 차감 후 = 양도가액 그대로 (호환성 자동 보장)
```

#### 종전 양도차익 (단방향 원칙)
- 같은 거래처 + 같은 양도년도 + 양도일 < 이번 물건의 transfer_income 합산
- C 계산 시 A, B는 SELECT만, UPDATE 절대 X
- 사용자 수동 수정 가능 (override 컬럼)
- 🔄 자동복귀 버튼

#### 세금계산 자동 prepaid 저장
- [세금계산] 클릭 → 산출세액 계산 → prepaid_income_tax / prepaid_local_tax 자동 저장
- Realtime으로 다른 화면 자동 동기화

#### 자동계산 트리거
- 페이지 진입 시 자동계산 X (override 값만 표시)
- [세금계산] 클릭 시 명시적 재계산
- **revalidatePath 마지막 액션에만** (PR #95)

### 종합소득세 보고서

#### 손익계산서 손실 표시 (PR #101~#105)
- 엑셀 행 라벨에 "손실" 포함 시 음수로 저장 (`operating_income`, `pretax_income`, `net_income`)
- 표시: `△1,234,567` (빨간색)
- 라벨 동적: "영업이익" ↔ "영업손실", "당기순이익" ↔ "당기순손실"
- 결론 멘트도 부호별 자동 분기
- 헬퍼: `getIncomeStatementLabel(field, value)`, `formatIncomeAmount(amount)`
- 법인세 보고서도 같은 파서/컴포넌트 공유 → 함께 적용됨

#### 세액의 계산 단순화 (PR #99)
다음 6개 행 제거 (납부(환급)할 총세액이 표 마지막):
- 주식매수 특례 차감/가산
- 분납할세액
- 신고 기한내 납부할 세액 (33-34+35-36)
- 국세환급금충당
- 충당후 납부(환급)할 세액

DB 컬럼은 호환성 유지. 새 보고서는 0 저장.

#### 공유 링크 / 농특세 / 임시 고객
[기존 PR #62, #63, #69 그대로 유지]

### 체크리스트 (매매사업자)

#### 신고기한 월별 분류 (PR #93, #94)
- `filing_deadline` (양도일 + 2개월 말일) 기준 월별 표시
- NULL은 표시 안 함 (신고기한 미정은 매매사업자 관리 페이지에서 확인)
- 진행단계 무관 (미확인 단계도 신고기한 있으면 표시)

---

## 15. 작업 이력 (최근 — Phase 4 → 5 사이 후속 패치)

### 2026-05-17 ~ 2026-05-19

**브랜드 리뉴얼**
- **PR #88**: Atom-base 브랜드 (보라 그라디언트 사이드바, 원자 심볼 로고, 아톰랩 메뉴)
- **PR #89**: 사이드바 가독성 (ATOM BASE 한 줄 대문자, font-semibold, EXPERIMENT 라벨 가독성)
- **PR #90**: 사이드바 고정 스크롤 (flex h-screen + overflow-y-auto)

**계산 로직 정정**
- **PR #91**: 창업감면 OR 조건 단순화 + "%" 표시 (5단계 → 3단계)

**체크리스트**
- **PR #92→#93**: NULL 노출 시도 → 복원 (회수)
- **PR #94**: 일괄 업로드 `filing_deadline` 누락 진단 + v35 백필 SQL + 코드 수정

**race condition**
- **PR #95**: [세금계산] revalidatePath 다단계 정리 (백그라운드 RSC refetch race 제거)

**부가세 계산기 확장**
- **PR #96**: 용도지수 주거/상업 분기 + 시행령 별표 45개 정적 데이터 + 자동조회 매핑 5종 확장
- **PR #97**: 오피스텔 주거용 추가 (code 100)
- **PR #100**: 모바일 자동조회 HTTP 405 진단 + 미들웨어 `/api/calculator/*` 우회 추가

**보고서**
- **PR #99**: 종소세 보고서 세액의 계산 6행 제거 (주식매수특례 등)
- **PR #101~#105**: 손익계산서 손실 부호 처리 + △ 빨간 표시 + 동적 라벨 + 디버그 박스

**빌드 최적화**
- **PR #106**: vercel.json 추가 — `claude/push-to-main-KjAEB` 빌드 비활성화 (중복 빌드 제거)

[이전 PR #62~#87 이력 유지]

---

## 16. 진단 회고 — 사용자분 통찰의 가치

### 결정적이었던 사용자 통찰 (Phase 4 → 5 추가)

13. **"아예 주식매수 특례 / 분납할 세액 / 이쪽 부분을 없애버려도 될듯해"** → 사용에 안 맞는 UI 단순화 결정 (PR #99)
14. **"신고기한이 없는 경우는 제외해야돼. 신고기한으로 월별로 체크리스트 만드는거였으니까"** → 본래 의도 명확화 → 진단 우선 흐름 강화 (PR #94)
15. **"비과밀억제권역 or 만 34세 이하 중 하나만 충족시켜도 50% 감면인데"** → 창업감면 OR 단순화 (PR #91)
16. **"세금은 원자단위로 정확하게, 시야는 우주처럼 크게"** → 브랜드 슬로건 + 컬러 시스템 #6927FF 추출 (PR #88)
17. **"세금계산 누르면 기납부 종소세에 반영 안되네 (재발)"** → 백그라운드 RSC refetch race 발견 (PR #95)
18. **"모바일 자동조회 안돼 HTTP 405"** → 미들웨어 누락 진단 (PR #100)
19. **"손실인데 당기순이익으로 나와"** → 라벨 기반 부호 처리 필요 (PR #101)
20. **"표시도 당기순손실/영업손실로 해주는거지?"** → 라벨 동적 표기를 보너스에서 필수로 격상

### 교훈 (Phase 4 → 5 추가)
- **사용자 발언을 현상 vs 의도로 분리**: "안 보이는 케이스"라는 현상 보고와 "어떤 케이스가 보여야 한다"라는 의도 요구를 따로 진단
- **DB 데이터 자체 확인 1순위**: 코드 필터링부터 의심하지 말 것 (PR #94 교훈)
- **다단계 액션의 revalidatePath**: 마지막 액션만, 중간은 제거
- **공개 페이지의 API 라우트도 미들웨어 우회**: 페이지만 우회하면 부족
- **모바일은 환경별 재현 필수**: 데스크톱(로그인)에서 안 보이는 버그
- **라벨 기반 부호 처리**: 엑셀의 동적 라벨에서 의미 추출
- **Vercel 빌드 큐 관리**: push 브랜치 + main 중복 빌드 차단 + 큐 막힘 시 cancel/redeploy
- **추측 기반 작업지시서의 한계**: Claude Code 진단 결과를 1차 신뢰, 의외의 정정 시 즉시 사용자에게 의도 재확인

---

*최종 수정일: 2026-05-19*
*Phase 4 + 후속 패치 (PR #88~#106) 완료*
*다음 Phase 5: 부가가치세 보고서 + 결산보고서 + 세금계산서 + 결산참고 부가/법인세 + 체크리스트 서류업로드*
