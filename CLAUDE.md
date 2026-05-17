# CLAUDE.md — 아톰세무회계 내부 업무 시스템

> Claude Code가 이 파일을 자동으로 읽고 작업 컨텍스트로 사용합니다.
> 질문 없이 이 문서 기준으로 바로 작업을 시작하세요.

---

## ⚠️ GIT 작업 정책 — 절대 원칙

이 프로젝트는 **1인 작업이며 PR/리뷰 절차가 없습니다.**

### 푸시 정책
- **항상 main 브랜치에서 직접 작업**
- **다른 브랜치 생성 금지** — `claude/*`, `feature/*`, `fix/*` 모두 금지
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

### 마이그레이션 SQL 정책
- DB 스키마 변경 작업 시 작업지시서에 **마이그레이션 SQL 전문** 함께 포함
- 사용자가 Supabase SQL 에디터에서 직접 실행
- Claude Code는 SQL 파일만 저장 (재실행 금지)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 아톰세무회계 내부 업무 시스템 |
| 목적 | 세무회계 사무소 내부 직원용 — 고객 관리, 보고서 작성, 청구서 발행, 매매사업자 관리, 결산참고, 부가세 계산기 |
| 사용자 | 내부 직원 5명 이하 + 부가세 계산기는 공개 |
| 접속 환경 | 데스크톱 브라우저 (Chrome 권장) |
| 개발 도구 | Claude Desktop App (Windows) |
| 저장소 | GitHub — atomtax/atomtax-app |
| 배포 | Vercel — https://atomtax-app.vercel.app |
| Claude 플랜 | Max |

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
```

### 핵심 원칙
- 모든 DB 접근은 서버 사이드에서만 (Server Actions / API Routes)
- 브라우저에서 Supabase 직접 호출 절대 금지
- `localStorage`에 업무 데이터 저장 금지
- `any` 타입 금지
- CDN 라이브러리 로드 금지
- 무거운 라이브러리(xlsx, exceljs, html2canvas, jspdf)는 **dynamic import**

### 부가세 계산기 보안 격리 (공개 페이지)
- `/calculator/*`는 미들웨어에서 인증 제외
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

---

## 4. 페이지 구조

```
/dashboard

/clients                                    기장고객 목록 ✅ (개업일 일괄 업로드 PR #73)
/clients/[id]                               고객 상세 ✅ (개업일 표시 PR #74)
/clients/terminated                         해지고객

/reports-review                             결산참고 (분기)
/reports-review/income-tax                  종합소득세 분기 선택
/reports-review/income-tax/personal         일반사업자 참고 ✅ (창감/중특 컬럼 PR #87)
/reports-review/income-tax/trader           매매사업자 참고 ✅ (차감 후 양도가액 PR #80)
/reports-review/vat                         부가가치세 (Phase 5 예정)
/reports-review/corporate-tax               법인세 (Phase 5 예정)

/invoices/adjustment                        조정료 청구서 ✅ (PNG 2페이지 PR #66, 최종수수료 행 PR #67)
/invoices/adjustment/[id]/print             A4 인쇄 + 별지
/invoices/tax                               세금계산서 (Phase 5 예정)

/reports/corporate-tax                      법인세 보고서
/reports/income-tax                         종합소득세 보고서 ✅ (공유링크 PR #62, 농특세 PR #63, 임시 고객 PR #69)
/reports/vat                                부가가치세 보고서 (Phase 5 예정)
/reports/settlement                         결산보고서 (Phase 5 예정)

/traders                                    매매사업자 목록 ✅ (일괄 업로드)
/traders/[clientId]                         물건 마스터-디테일 ✅ (부가세/물건종류/종전양도차익 PR #80~84)
/traders/checklist                          체크리스트 (Realtime) ✅ (PR #81 종소세 예상 갱신)

/calculator/vat                             부가세 계산기 Landing (공개)
/calculator/vat/calc                        부가세 계산기 (공개)

/share/[token]                              공유 링크 페이지 ✅ (PR #62, 30일 만료)
/api/cron/cleanup-share-links               Vercel Cron (PR #62)
```

### 사이드바 메뉴 순서

```
├── 대시보드
├── 고객 관리
├── 결산참고 ⭐
│   ├── 부가가치세 (Phase 5 예정)
│   ├── 종합소득세 (일반사업자/매매사업자 분기)
│   └── 법인세 (Phase 5 예정)
├── 청구서 (조정료/세금계산서)
├── 보고서 (법인세/종합소득세/부가가치세)
├── 매매사업자 (관리/체크리스트)
└── 부가세 계산기 (외부 링크 ↗)
```

---

## 5. 핵심 데이터베이스 테이블 및 컬럼명 ⚠️

### ⚠️ 스키마 명명 — 추측 금지

스키마 추측이 빈번한 오류 원인이므로, **작업 전 반드시 `src/types/database.ts` 또는 `src/lib/db/` 에서 실제 컬럼명 확인**.

#### 확정된 스키마 정정 사항

| 테이블 | 추측한 컬럼명 (오답) | 실제 컬럼명 (정답) |
|--------|-------------------|------------------|
| clients | ~~business_name~~ | **company_name** |
| clients | ~~business_registration_number~~ | **business_number** |
| clients | ~~business_address~~ | **address** ⭐ |
| trader_properties | ~~transfer_price~~ | **transfer_amount** |
| trader_properties | ~~address~~ | **location** |
| trader_property_expenses | ~~sort_order~~ | **row_no** |

#### 매매사업자 물건종류 — DB에 저장됨 (PR #80에서 추가)
- `property_type VARCHAR(20)` — 아파트/빌라/다세대/다가구/오피스텔/기타
- 기존 일괄 업로드 시 무시했던 값을 이제 저장

### 5-1. clients (기장고객)
- `company_name`: 회사명
- `business_number`: 사업자등록번호 (10자리 숫자 또는 XXX-XX-XXXXX)
- `address`: 사업장 주소 (PR #86 권역 판단에 사용)
- `business_category_code`: 업종코드 (703011, 703012 = 매매사업자)
- `business_type_category`: '법인' | '개인'
- `business_item`: 종목
- `manager`: 담당자
- `resident_number`: 주민번호 (PR #86 만 35세 미만 판단에 사용, 보안 주의)
- `opening_date`: 개업일 ⭐ (PR #73, DATE)
- `is_terminated`: 해지 여부
- `is_temporary`: 임시 고객 여부 ⭐ (PR #69)
- `google_drive_folder_url` / `trader_drive_folder_url` (별도)

### 5-2. corporate_tax_reports ✅ v17 (38컬럼)
### 5-3. income_tax_reports ✅ v19~v28
- `conclusion_notes`: 기존 단일 문자열 (legacy 호환 유지)
- `conclusion_sections`: JSONB 배열 (v26 신규)
- `income_statement_summary`: JSONB 요약 + `details` 키 (SGA 세부 항목, PR #55)
- `farm_special_tax`: 농어촌특별세 ⭐ (PR #63, v28, NUMERIC NOT NULL DEFAULT 0)
- `income_final_with_local`: 종합소득세 + 지방소득세 + 농특세 (메시지 + 보고서 CHAPTER 02)

### 5-4. adjustment_invoice_items ✅ + v25 (매매업 할인)
- `maemae_discount`: 매매업 할인 NUMERIC (PR #59, v25)
- `is_maemae_discount_manual`: 수동 수정 여부 BOOLEAN

### 5-5. trader_properties ✅ v20~v34
- `property_name`: 물건명
- `property_type`: 물건 종류 (아파트/빌라/다세대/다가구/오피스텔/기타) ⭐ (v33)
- `location`: 주소 ⚠️ (address 아님)
- `acquisition_date`: 취득일
- `transfer_date`: 양도일
- `transfer_amount`: 양도가액 (총액) ⚠️ (transfer_price 아님)
- `vat_amount`: 부가세 ⭐ (v33, NUMERIC NOT NULL DEFAULT 0)
- `prepaid_income_tax`, `prepaid_local_tax`: 기납부 세금
- `transfer_income`: 양도소득 (자동 계산, `(transfer_amount - vat_amount) - 필요경비`)
- `prior_transfer_income_override`: 종전 양도차익 수동값 ⭐ (v32, nullable)
- `prior_prepaid_income_tax_override`: 종전 기납부 종소세 수동값 ⭐ (v34, nullable)
- `prior_prepaid_local_tax_override`: 종전 기납부 지방세 수동값 ⭐ (v34, nullable)
- `progress_status`: 5단계
- `filing_deadline`: 자동 계산
- `land_area`, `building_area` (m²)
- **Realtime 활성화**: `ALTER PUBLICATION supabase_realtime ADD TABLE trader_properties;`

### 5-6. trader_property_expenses ✅ v20
- 10행 고정
- `row_no`: 순번 ⚠️ (sort_order 아님)
- `category`: '취득가액' | '기타필요경비'
- `expense_name`: 비용명 (드롭다운 옵션)
- `predeclaration_allowed`, `income_tax_allowed`: boolean

**비용명 드롭다운 옵션** (5개, PR #80 순서 변경):
1. 취득가액
2. 취득세 등
3. 신탁말소비용  ⭐ (순서 변경)
4. 중개수수료    ⭐ (순서 변경)
5. 기타경비

### 5-7. income_tax_review_notes ✅ v22
### 5-8. trader_review_notes ✅ v23
### 5-9. report_share_links ✅ v27 (PR #62)
- 보고서 외부 공유 링크 (UUID PK, 30일 만료, RLS 2개)
- `client_id`, `report_id`, `token`, `expires_at`
- Cron으로 매일 03:00 UTC 정리

### 5-10. industry_codes_master ✅ v31 (PR #85, 1,611건)
- `industry_code` (PK)
- `mid_special_eligible` ('O'/'X') — 중소기업 특별 세액감면
- `startup_eligible` ('O'/'X') — 창업감면
- `small_biz_reduction_rate` — 소기업 감면율
- `business_description`, `category_major`, `category_major_name` 등

---

## 6. 핵심 기능별 진행 상황

### Phase 1~3 ✅ 완료

### Phase 4 ✅ 완료 (2026-05-13 ~ 2026-05-17)
- 매매사업자 시스템 (v20a~v20e + 일괄 업로드)
- 부가가치세 계산기 (4-2a ~ 4-2h)
- 결산참고 메뉴 (일반/매매사업자, 일반사업자 창감/중특)
- 종합소득세 보고서 완성도 (결론 섹션화, PDF 최적화, 공유링크, 농특세, 임시 고객)
- 매매사업자 부가세/물건종류/종전양도차익 (PR #80~84)
- 업종코드 마스터 (1,611건, PR #85)
- 비과밀억제권역 + 창업감면율 (PR #86)
- 결산참고 일반사업자 창감/중특 컬럼 (PR #87)

### Phase 5 — 진행 예정
- [ ] **부가가치세 보고서** (8~10시간)
- [ ] **결산보고서** (8~12시간)
- [ ] **세금계산서 양식** (4~6시간)
- [ ] **결산참고 부가가치세** (2~3시간)
- [ ] **결산참고 법인세** (2~3시간)
- [ ] **체크리스트 서류업로드** (Supabase Storage, 4~6시간)

---

## 7. 디자인 가이드

| 항목 | 내용 |
|------|------|
| 레이아웃 | 왼쪽 사이드바 (240px) + 오른쪽 콘텐츠 |
| 메인 컬러 | 보라-파랑 그라디언트 `#667eea → #764ba2` |
| 결론 진파랑 박스 | `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)` |
| 환급/납부 강조 | 환급=파랑, 납부=초록 |
| 종합결론 수치 강조 | 파란색 600 + bold + 1.1em |
| 폰트 | Inter |
| 인쇄 | A4, `<A4Page>`, `no-print` 클래스 |
| 매매사업자 액션 버튼 색상 (PR #83) | 세금계산=진한 보라 (강조) / 부가세계산기=연한 슬레이트 / 고객보고서=연한 인디고 |
| 매매사업자 보고서 폰트 (PR #83) | 본 물건 부담세액=text-3xl (최강조), 납부할 총세액=text-sm |
| 진행단계 배지 | 5단계 색상 (`PROGRESS_STYLES`) |
| 창감 배지 (PR #87) | 100=green, 75=emerald, 50=yellow, 25=amber, X=gray |
| 중특 배지 (PR #87) | %=blue, X/-=gray |

---

## 8. 코드 규칙

- TypeScript 필수, `any` 금지
- 컴포넌트 → `src/components/`
- DB 접근 → `src/lib/db/`
- 외부 API → `src/lib/api/{provider}/`
- 페이지 → `src/app/` (App Router)
- 유틸리티 → `src/lib/utils/`
- CDN 라이브러리 로드 금지
- 모달/무거운 컴포넌트는 `dynamic` import (xlsx, exceljs, html2canvas, jspdf 등)

### ⚠️ 작업 시작 전 필수 점검
1. **스키마 확인**: `src/types/database.ts` 또는 `src/lib/db/` 에서 실제 컬럼명
2. **CLAUDE.md 5번 섹션** 스키마 정정 사항 참조
3. **추측으로 컬럼명 사용 금지**

### 공통 유틸리티 위치
- `src/lib/utils/pdf-export.ts` — PDF 생성 (모든 보고서/청구서)
- `src/lib/utils/highlight-amounts.ts` — 수치+단위 강조 렌더링
- `src/lib/utils/invoice-export.ts` — PNG 다운로드 공통 (PR #66)
- `src/lib/utils/pnu.ts` — PNU 분해
- `src/lib/data/regional-zones.ts` — 권역 분류 (PR #86)
- `src/lib/utils/startup-tax-reduction.ts` — 창업감면율 계산 (PR #86)

### 자주 마주친 함정 (실제 발생한 사례)

#### 1. Supabase `.or()` 필터의 값 파싱 버그 (PR #77)
- PostgREST `.or()`는 값 안의 `,` / `.` 를 구분자로 인식
- 사업자번호처럼 콤마 들어가는 값 사용 시 컬럼명 오인 에러
- **해결**: `.or()` 대신 `.in('column', [v1, v2, v3])` 사용 (supabase-js가 안전 인코딩)

#### 2. UPSERT 시 같은 PK 중복 (PR #85 핫픽스)
- PostgreSQL: "ON CONFLICT DO UPDATE command cannot affect row a second time"
- 한 배치 안에 같은 PK 두 번 처리 거부
- **해결**: upsert 전에 Map으로 중복 제거 (마지막 값 우선)

#### 3. 클라이언트 컴포넌트 metadata 불가
- `'use client'`는 metadata export 못 함
- **해결**: 서버 컴포넌트 래퍼로 분리

#### 4. 동적 새 탭 열기 — 팝업 차단
- 비동기 작업 후 `window.open` 호출 시 팝업 차단
- **해결**: 빈 탭 먼저 열고 저장 성공 시 URL 변경

#### 5. router.refresh() 남용 (PR #84 성능 최적화)
- 매 액션마다 전체 페이지 re-fetch → 11개 물건이면 11행 + expenses 전체 다시 fetch
- **해결**: 클라이언트 state로 즉시 갱신, 진짜 필요할 때만 router.refresh()

#### 6. React.memo 인라인 함수 무용 (PR #84)
- 부모가 onChange를 인라인 arrow function으로 전달 → 매 렌더마다 새 함수
- **해결**: dispatcher 패턴, useCallback'd 핸들러 + 자식이 propertyId 받기

#### 7. N+1 쿼리 (PR #87)
- 클라이언트 N명마다 업종코드 조회 → 100명 = 100쿼리
- **해결**: `getIndustryCodes(codes)` 배치 조회, 1번에 묶기

### 단방향 원칙 (매매사업자 종전 양도차익)
- `calculatePriorAmounts`는 SELECT만, 다른 물건 UPDATE 금지
- C 물건의 계산이 A, B의 DB 데이터를 절대 수정하지 않음
- 양도일 < (strict) 조건으로 이전 물건만 합산

### 토스트 사용 패턴 (PR #84)
```typescript
import { Toast } from '@/components/ui/Toast';
// ... 컴포넌트 내부
const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

// 액션 후
setToast({ message: '세금계산이 완료되었습니다', type: 'success' });

// 렌더 끝부분
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

### Phase 5 — 진행 예정
- [ ] 5-1: 부가가치세 보고서 (8~10시간)
- [ ] 5-2: 결산보고서 (8~12시간)
- [ ] 5-3: 세금계산서 양식 (4~6시간)
- [ ] 5-4: 결산참고 부가가치세 (2~3시간)
- [ ] 5-5: 결산참고 법인세 (2~3시간)
- [ ] 5-6: 체크리스트 서류업로드 (Supabase Storage, 4~6시간)

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
        → Vercel 자동 배포 (1~2분)
```

> DB 스키마 변경: Supabase SQL 에디터에서 `migrations/v*.sql` 직접 실행

---

## 14. 주요 결정 사항 (참고용)

### 부가가치세 계산기
[기존 내용 유지 — 동/호 매칭, hoNm 재시도, 표제부 폴백, 잔가율 등]

### 결산참고 메뉴
[기존 내용 유지]

### 매매사업자 비즈니스 로직 (PR #80~84)

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

#### 세금계산 자동 prepaid 저장 (PR #83)
- [세금계산] 클릭 → 산출세액 계산 → prepaid_income_tax / prepaid_local_tax에 자동 저장
- 매매사업자 예정신고 워크플로우와 일치
- 다른 화면(체크리스트 등) 자동 동기화 (Realtime)

#### 자동계산 트리거 (PR #82)
- 페이지 진입 시 자동계산 X (override 값만 표시)
- [세금계산] 클릭 시 명시적 재계산

### 결산참고 일반사업자 — 창감/중특 (PR #87)

#### 창업감면 계산 흐름
```
업종코드 → industry_codes_master.startup_eligible 확인
       ↓
'O'면:
  사업장 주소 → 권역 (과밀/수도권비과밀/비수도권)
  주민번호 + 개업일 → 만 35세 미만 여부
       ↓
  조특법 §6 감면율 분기:
    - 과밀억제권역: X
    - 비수도권 + 청년: 100%
    - 비수도권 + 일반: 50%
    - 수도권 비과밀 + 청년 (2026~): 75%
    - 수도권 비과밀 + 청년 (~2025): 50%
    - 수도권 비과밀 + 일반: 25%
```

#### 중특감면 계산 흐름
```
업종코드 → industry_codes_master.mid_special_eligible 확인
       ↓
'X'면 'X' 표시
'O'면 small_biz_reduction_rate 표시 (예: 0.3 → "30%")
```

---

## 15. 작업 이력 (최근 — Phase 4)

### 2026-05-17 (오늘)
- **PR #87**: 결산참고 일반사업자 — 창감/중특 컬럼 + 일반↔매매 전환 버튼 (4 commits)
- **PR #86**: 비과밀억제권역 + 창업감면율 계산 (regional-zones.ts + startup-tax-reduction.ts)
- **PR #85**: 업종코드 마스터 import 핫픽스 (UPSERT 중복 제거 Map 패턴, 1,611건 import 성공)
- **PR #84**: 매매사업자 토스트 + 성능 최적화 (4 commits) — router.refresh 7곳 제거, React.memo 활성화, Promise.all 병렬
- **PR #83**: 매매사업자 PR #82 보강 (5 commits) — 세금계산 시 prepaid 자동 저장 (핵심 버그 수정), 보고서 폰트 재배치
- **PR #82**: 매매사업자 PR #80 보강 (7 commits) — 종전 기납부 수정 가능 + 🔄, 자동계산 트리거 변경, 부가세 0 분기, UI 정리
- **PR #81**: 체크리스트 종소세 예상 — 옛 계산식 제거, prepaid 컬럼 직접 사용
- **PR #80**: 매매사업자 통합 대형 PR (7 commits) — v33 부가세/물건종류, 차감 후 양도가액, 부가세계산기 링크
- **PR #79**: 매매사업자 종전 양도차익 (v32 + calculatePriorAmounts + 단방향 원칙)
- **PR #77**: bulkUpdateOpeningDates 컬럼명 핫픽스 (.or() → .in() 패턴)
- **PR #76**: 개업일 입력 날짜 자동포맷
- **PR #74**: 개업일 상세/모달 표시
- **PR #73**: 기장고객 개업일 컬럼 + 일괄 업로드 (v30, BulkOpeningDateUpload)
- **PR #72**: 손익계산서 매출원가 + 메시지 최종 세액 라인
- **PR #71**: 멘트 거래처명 prop 전달 보강 + 마침표 제거
- **PR #70**: 담당자 드롭다운 + 임시 고객 삭제 버튼
- **PR #69**: 일회성 임시 고객 추가 (v29 is_temporary)
- **PR #68**: 페이지별 동적 탭 제목 (title.template)
- **PR #67**: 조정료 청구서 최종수수료 행
- **PR #66**: 조정료 청구서 PNG 2페이지 + invoice-export.ts 공통화
- **PR #65**: 멘트 거래처명 동적 삽입 (buildMessage)
- **PR #64**: 자동입력 파서 농특세 컬럼
- **PR #63**: 농어촌특별세 컬럼 (v28) + PDF 출력 동작 변경
- **PR #62**: 공유링크 시스템 (v27, /share/[token], 30일 만료, Vercel Cron)

### 2026-05-16
- PR #61: 결론 섹션 이동 (드래그앤드롭 + 화살표) + PDF 용량 최적화
- PR #60: 종합소득세 결론 섹션화 (v26 conclusion_sections)

[이전 PR 이력 유지]

---

## 16. 진단 회고 — 사용자분 통찰의 가치

### 결정적이었던 사용자 통찰 (Phase 4 추가)

1. **"DB에서 103만 맞으면 가지고 오면 되는거 아니야?"** → 동/호 매칭 알고리즘의 시작
2. **"호 안 붙이고 숫자만 시도하면 안 되나?"** → hoNm 자동 재시도 폴백
3. **"경과연수는 지금 조회하는 순간 기준 아니야?"** → FISCAL_YEAR 버그 발견
4. **"이렇게 데이터가 있어. 여기서 각 컬럼명을 우리 매매사업자 데이터에 있는 컬럼과 일치시키면 되는거야"** → 일괄 업로드 시스템 설계 시작점
5. **"손익계산서에서 판매비와 관리비, 영업외비용 총계는 제외하고 나머지 세부항목"** → SGA 세부 항목 확장
6. **"차라리 결론/의견 란을 칸을 나눠놓고 칸 제목을 수정할 수 있게 바꾸는게 깔끔하지 않을까?"** → 결론 섹션화
7. **"PDF 40메가야"** → 공통 PDF 유틸 설계
8. **"C의 계산이 A, B에는 영향을 미치면 안되는거 알지?"** → 단방향 원칙 명문화 (PR #79)
9. **"부가세가 없는 경우 보고서에서 부가세 행 빼주고"** → 부가세 0 호환성 분기 (PR #82)
10. **"세금계산 누르면 기납부 종소세에 반영 안되네"** → race condition + stale state 진단 (PR #83)
11. **"매매사업자 데이터 페이지를 좀더 효율화 해서 속도를 빠르게 할 수 있나"** → router.refresh 남용 + React.memo 무용 진단 (PR #84)
12. **"이거는 그건 너가 조사해서 넣어"** → 시행령 별표 1 정적 데이터화 (PR #86)

### 교훈 (Phase 4 추가)
- **단방향 원칙은 명문화하기**: "C가 A, B에 영향 X" — 코드 리뷰 + 테스트 + 작업지시서에 명시
- **부가세 0 호환성**: 새 컬럼 추가 시 기본값 + 분기 처리로 기존 데이터 무영향
- **race condition 주의**: 비동기 저장 후 즉시 계산 시 stale state 위험 → 명시적 재조회
- **router.refresh 신중 사용**: 매 액션마다 전체 페이지 re-fetch는 페이지 무거움
- **React.memo 효과는 props 안정화부터**: 인라인 함수 전달은 memo 무용
- **N+1 배치 lookup**: 클라이언트당 쿼리 X → 한 번에 모든 키 조회
- **실제 데이터로 검증 필수**: 타입체크/빌드만으로는 부족 (PR #85 핫픽스 등)
- **PostgreSQL UPSERT 한계**: 같은 PK 중복 거부 → Map으로 dedup
- **사용자 직관 신뢰**: 도메인 지식 + 직관이 코드 분석보다 빠른 진단

---

*최종 수정일: 2026-05-17*
*Phase 4 완료: 매매사업자 시스템 (부가세, 종전양도차익, 보고서 양식, 성능 최적화) + 결산참고 메뉴 (일반사업자 창감/중특, 매매사업자 차감 후 양도가액) + 임시 고객 + 공유링크 + 농특세 + 개업일 일괄 업로드 + 업종코드 마스터*
*다음 Phase 5: 부가가치세 보고서 + 결산보고서 + 세금계산서 + 결산참고 부가/법인세 + 체크리스트 서류업로드*
