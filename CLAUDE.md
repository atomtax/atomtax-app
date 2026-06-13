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
- **자동화 흐름**:
  1. 단계별 즉시 commit + push to `claude/push-to-main-KjAEB`
  2. PR 자동 생성: `gh pr create --base main --head claude/push-to-main-KjAEB ...`
  3. Squash 머지: `gh pr merge --squash`
  4. 로컬 main 동기화: `git fetch origin && git checkout main && git pull`

### Vercel 빌드 정책 (PR #106)
- `claude/push-to-main-KjAEB` 브랜치는 Vercel 빌드 트리거 안 함 (`vercel.json`)
- main 머지된 후에만 빌드 (중복 빌드 제거)
- 큐 막힘 시: 옛 Queued Cancel + 최신 main commit Redeploy

### 마이그레이션 SQL 정책 ⭐
- DB 스키마 변경 작업 시 작업지시서에 **마이그레이션 SQL 전문** 포함
- **채팅 메시지에도 SQL 전문을 별도 코드 블록으로 명확하게 표시** (사용자 즉시 복사용)
- 사용자가 Supabase SQL 에디터에서 직접 실행
- **작업 시작 전 또는 머지 직후 즉시 실행 강조** (누락 시 "Server Components render" 모호 에러 발생, PR #114 회고)
- Claude Code는 SQL 파일만 저장 (재실행 금지)

### 휘발 방지
- 각 단계 끝날 때마다 **즉시** 커밋 + 푸시
- 한 작업 세션 내에 **최소 3회 이상** 커밋 분할

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | **Atom-base** (아톰베이스, 아톰세무회계 내부 인트라넷) |
| 슬로건 | "세금은 원자단위로 정확하게, 시야는 우주처럼 크게" |
| 목적 | 세무회계 사무소 내부 직원용 — 고객 관리, 보고서 작성, 청구서 발행, 매매사업자 관리, 결산참고, 부가세 계산기 |
| 사용자 | 내부 직원 5명 이하 + 부가세 계산기는 공개 |
| 저장소 | GitHub — atomtax/atomtax-app |
| 배포 | Vercel — https://atomtax-app.vercel.app |

### 네이밍 체계
- **아톰베이스** (Atom-base): 내부 인트라넷 (이 시스템)
- 아톰스페이스 (Atom Space): 외부 랜딩페이지
- 아톰스테이션 (Atom Station): 사무실
- **아톰랩** (Atom Lab): 내부 실험공간/베타 기능

---

## 2. 확정 기술 스택

```
Frontend     : Next.js 15 (App Router) + TypeScript
Styling      : Tailwind CSS
Database     : Supabase (PostgreSQL)
Auth         : Supabase Auth
PDF/PNG      : jsPDF + html2canvas
PDF 파싱     : pdf-parse
엑셀 파싱    : xlsx (SheetJS Community)
엑셀 생성    : exceljs
드래그앤드롭 : @dnd-kit/core, @dnd-kit/sortable
배포         : Vercel
실시간       : Supabase Realtime
폰트         : Pretendard (한글) + Outfit (영문 디스플레이)
```

### 핵심 원칙
- 모든 DB 접근은 서버 사이드에서만 (Server Actions / API Routes)
- 브라우저에서 Supabase 직접 호출 절대 금지
- `localStorage`에 업무 데이터 저장 금지
- `any` 타입 금지
- 무거운 라이브러리는 **dynamic import**

### 부가세 계산기 보안 격리 (공개 페이지)
- `/calculator/*` 및 `/api/calculator/*`는 미들웨어 인증 제외 (PR #100)
- 계산기 코드는 Supabase DB/clients/trader_properties import 절대 금지
- 매 작업 후 `grep`으로 격리 검증

---

## 3. 환경변수

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_VWORLD_API_KEY=
BUILDING_REGISTER_API_KEY=

CRON_SECRET=
```

### vercel.json (PR #106)
- `crons`: 공유 링크 만료 정리
- `git.deploymentEnabled`: `claude/push-to-main-KjAEB` false

---

## 4. 페이지 구조

```
/dashboard

/clients                                    기장고객 목록
/clients/[id]                               고객 상세
/clients/terminated                         해지고객

/reports-review                             결산참고 (분기)
/reports-review/income-tax/personal         일반사업자 (창감/중특, PR #91)
/reports-review/income-tax/trader           매매사업자

/invoices/adjustment                        조정료 청구서 (발송/납부 체크박스, 필터, PR #113)
/invoices/adjustment/[id]/print             A4 인쇄
/invoices/tax                               세금계산서 (Phase 5)

/reports/corporate-tax                      법인세 보고서
/reports/income-tax                         종합소득세 보고서 (지방세 override PR #114)

/traders                                    매매사업자 목록
/traders/[clientId]                         물건 마스터-디테일
/traders/checklist                          체크리스트 (Realtime)

/atom-lab                                   아톰랩 (placeholder)

/calculator/vat                             부가세 계산기 Landing (공개)
/calculator/vat/calc                        부가세 계산기 (공개, 모바일)

/share/[token]                              공유 링크 (30일 만료)
/api/cron/cleanup-share-links               Vercel Cron
/api/calculator/*                           부가세 계산기 API (공개, 미들웨어 우회)
/api/wehago/ingest                          위하고 확장 수신 API (토큰 인증, 미들웨어 우회)

/atom-lab/wehago                            위하고 수집 1단계 (붙여넣기 검산)
/atom-lab/closing                           마감감지 + TP 매출대조 (Phase 7 재설계)
```

### 사이드바 메뉴 순서

```
ATOM BASE
├── 대시보드
├── 고객 관리 (기장고객/해지고객)
├── 결산참고 (부가/종합/법인)
├── 청구서 (조정료/세금계산서)
├── 매매사업자 관리
├── 보고서 작성
├── ─ ─ EXPERIMENT ─ ─
└── 아톰랩
```

---

## 5. 핵심 DB 테이블 및 컬럼명 ⚠️

### ⚠️ 스키마 명명 — 추측 금지

**작업 전 반드시 `src/types/database.ts` 또는 `src/lib/db/` 에서 실제 컬럼명 확인.**

#### 확정된 스키마 정정 사항

| 테이블 | 추측 (오답) | 실제 (정답) |
|--------|-----------|----------|
| clients | ~~business_name~~ | **company_name** |
| clients | ~~business_registration_number~~ | **business_number** |
| trader_properties | ~~transfer_price~~ | **transfer_amount** |
| trader_properties | ~~address~~ | **location** |
| trader_property_expenses | ~~sort_order~~ | **row_no** |
| income_tax_reports | ~~operating_profit/profit_before_tax~~ | **operating_income/pretax_income** |

### 5-1. clients
- `company_name`, `business_number`, `address`, `business_category_code`
- `business_type_category`: '법인' | '개인'
- `manager`, `resident_number`, `opening_date`
- `is_terminated`, `is_temporary`

### 5-2. corporate_tax_reports ✅ v17

### 5-3. income_tax_reports ✅ v19~v28, v37
- `conclusion_sections`: JSONB 배열
- `income_statement_summary`: JSONB
  - `operating_income`, `pretax_income`, `net_income` (음수 가능, PR #101)
  - 손실 케이스: 라벨 "손실" 포함 시 파서가 음수로 저장
- `farm_special_tax`: 농어촌특별세
- `income_final_with_local`: 종소세 + 지방소득세 + 농특세
- **`income_local_tax_override`** (v37, PR #114): NULL = 자동(총세액×10%), 값 = 수동

### 5-4. adjustment_invoices ✅ v36
- **`is_sent`** (v36, PR #113): BOOLEAN
- `is_paid`: 납부 여부
- `payment_method`: 납부방법
- `manager`: 수동 행 담당자

### 5-5. adjustment_invoice_items ✅ v25
- `maemae_discount`, `is_maemae_discount_manual`

### 5-6. trader_properties ✅ v20~v34
- `property_name`, `property_type`, `location`
- `acquisition_date`, `transfer_date`
- `transfer_amount`, `vat_amount`
- `prepaid_income_tax`, `prepaid_local_tax`
- `transfer_income`: 자동 계산
- `prior_transfer_income_override`, `prior_prepaid_income_tax_override`, `prior_prepaid_local_tax_override`
- `filing_deadline`: 양도일 + 2개월 말일 (PR #94 v35 백필)
- `progress_status`: 5단계
- Realtime 활성

### 5-7. trader_property_expenses ✅ v20

### 5-8~5-11. 기타: income_tax_review_notes (v22), trader_review_notes (v23), report_share_links (v27), industry_codes_master (v31, 1,611건)

### 5-12. 위하고 수집 (v40, Phase 7 / 1단계) ⭐

더존 위하고T Smart A 10 화면 응답(JSON)을 수집해 검산하는 파이프라인.

**wehago_companies** — 위하고 회사코드 ↔ 아톰베이스 거래처 매핑
- `ccode` (UNIQUE), `business_number`(숫자만), `company_name`, `client_id`(clients FK, 미매칭이면 NULL), `gisu`, `acc_begin`, `acc_end`

**wehago_snapshots** — 화면코드별 응답 스냅샷
- `ccode`, `screen_code`, `gisu`, `period_from`/`period_to`('YYYYMM'), `content_hash`(sha256), `payload`(jsonb, 마스킹 후), `source`('manual'|'extension')
- dedupe UNIQUE: `(ccode, screen_code, gisu, COALESCE(period_to,''), content_hash)` — 같은 데이터 재저장 시 23505 → "변경 없음"

**확정 화면코드 5종** (`https://api.wehago.com/smarta/{코드}/...` GET):
| 코드 | 내용 | 핵심 |
|---|---|---|
| `sabc0102` | 수임처 기본정보 | `no_biz`, `cd_com`(=ccode), `nm_krcom`, `danggi_gisu`, `da_accbegin`/`da_accend` |
| `sacl0106` | 손익계산서 | 섹션행 `cd_acctit="0"`(`mn_total2`/`mn_btotal2`), 계정행(`mn_total1`/`mn_btotal1`), `mn_variation_amount` |
| `swsa0105` | 급여대장 | `total_ji`(연간 지급), `no_social` ⚠️마스킹 |
| `saas0106` | 고정자산 | `{g_data:[]}`, `subhap`('0'자산/'1'소계/'2'합계), `mn_cdep`(당기상각) |
| `swbu0111` | 사업소득(3.3%) | `grp_1[].am_pay`, `no_social`/`no_corpor` ⚠️마스킹 |

**민감정보 마스킹 원칙** (`src/lib/wehago/sanitize.ts`): `no_social`/`no_ceosoc`/`no_mainsoc`는 항상, `no_corpor`는 13자리일 때만 → 7자리+ 숫자면 앞 6자리(생년월일) 외 `*`. **마스킹을 content_hash보다 먼저** 적용.

**검산 룰** (`src/lib/wehago/rules.ts`, 실데이터 1원까지 검증):
- 인건비: 급여 `total_ji` 합 = 손익 `cd_acctit` 802/803/805 `mn_total1` 합
- 감가상각: 고정자산 `subhap="2"` `mn_cdep` = 손익 [818] `mn_total1`, A>0 & B=0 → 🔴 미계상

코어: `src/lib/wehago/{parse-url,sanitize,hash,ingest,rules}.ts` (폼+API 양쪽 재사용), 픽스처 `src/lib/wehago/__fixtures__/`, 화면 `/atom-lab/wehago`.

**2단계-A 확장 수신 (v41)**: 크롬 확장 → 아톰베이스 수신 창구.
- 수신 API `POST /api/wehago/ingest` — 헤더 `x-wehago-token`, body `{ url, payload }`. ingest 코어 재사용(`source='extension'`, `ingestLabel`). 본문 2MB 상한(413), CORS Origin은 `WEHAGO_EXTENSION_ORIGIN` 환경변수로만 허용(`*` 금지).
- 인증: 직원별 고정 토큰. `wehago_ingest_tokens`에 sha256 해시만 저장(원문은 발급 시 1회 노출). `token_hash` 단일조건 조회 후 `is_active` 확인 → 실패 시 401. 비활성화는 삭제 아님(이력 보존).
- 미들웨어 우회: `/api/wehago/ingest` 1줄 추가(쓰기 API라 토큰 인증 필수). 토큰 lib `src/lib/wehago/token.ts`, 발급/관리 `/atom-lab/wehago` 토큰 섹션.

**2단계-B 크롬 확장 (`wehago-extension/`, MV3)**: Vercel 빌드와 무관(`.vercelignore`), 직원 PC에 개발자모드로 직접 설치.
- 읽기 전용: `interceptor.js`(MAIN world)가 위하고 응답 fetch/XHR만 복제해 읽음 → 위하고로 신규 요청 절대 안 보냄. `content.js`(ISOLATED)가 중계 → `background.js`가 화이트리스트(5종) 필터 + 로컬 해시 dedupe(2차 방어) 후 수신 API로 POST.
- 인증: 팝업에서 직원 토큰 입력(`x-wehago-token`). on/off 토글, 최근 수집 로그(금액/결과만, 토큰·민감정보 미저장).
- 고정 확장 ID(manifest `key`): `goecaigfmlcbomcdhdbglpfiejolhdbi` → CORS용 `WEHAGO_EXTENSION_ORIGIN=chrome-extension://<ID>`(선택, 보강).

### 5-13. 마감감지 + TP 매출 (v42, Phase 7 재설계) ⭐

확장 가로채기 폐기 후, 위하고 마감현황(`common/make/master`) 응답을 붙여넣어 마감 변화를 감지하는 방식.

**위하고 마감현황 응답** `{ result_data:[], cno_list:[] }` — `result_data[]` 핵심: `no_biz`(매칭키), `nm_krcom`, `cno`, `da_period`, **`str_3`**(마감 플래그 1/0), **`str_6`**(마감일시 YYYYMMDDHHMMSS, 마감 판정 1차 기준), `str_7`(담당자). 변화 감지키=`no_biz`+기간, 값=`str_6`: 이전 없던 회사가 str_6 보유→신규마감, str_6 변경→재마감.

**closing_snapshots** — 회사×세목×기간 관측 이력 (`business_number`, `tax_type`'income'|'vat', `period`, `is_closed`, `closed_at_raw`=str_6, `client_id`)
**closing_changes** — 감지 이벤트 (`change_type`'new_closed'|'re_closed', `prev/curr_closed_at`, `is_reviewed`)
**tp_sales_snapshots** — 홈택스 부가세 합계표 집계 (`sales_*` 6종 + `sales_total`=신고매출, `purchase_tax_invoice` 참고)

**TP 합계표** 헤더: 귀속|사이트|상점ID|구분|건수|공급가액|부가세|합계|조회일. 신고매출=같은 귀속 (매출)세금계산서+계산서+현금영수증+신용카드+수출실적+제로페이 공급가액 합. ⚠️ `구분` 매칭은 **세금계산서를 계산서보다 먼저** 판정(부분문자열). 파일에 사업자번호 없음 → 업로드 시 거래처 드롭다운 선택.

코어: `src/lib/closing/{detect,tp-parse,types}.ts`(detect는 기장거래처 한정·N+1 방지 배치 조회), `src/lib/db/closing.ts`, 화면 `/atom-lab/closing`. clients 전체 1회 조회 후 숫자만 키 맵으로 매칭(.or()/.in() 형식 이슈 회피). xlsx 정적 import.

### 마이그레이션 이력
- v27 (PR #62): 공유 링크
- v28 (PR #63): 농어촌특별세
- v29 (PR #69): 임시 고객
- v30 (PR #73): 개업일
- v31 (PR #85): 업종코드 마스터
- v32~v34 (PR #79~#82): 종전 override + 부가세 + 종전 기납부세액
- **v35 (PR #94)**: filing_deadline 백필
- **v36 (PR #113)**: adjustment_invoices.is_sent
- **v37 (PR #114)**: income_tax_reports.income_local_tax_override
- **v40 (Phase 7 / 1단계)**: wehago_companies + wehago_snapshots (위하고 수집 저장소)
- **v41 (Phase 7 / 2단계-A)**: wehago_ingest_tokens (확장 수신 토큰) + wehago_snapshots.ingest_label
- **v42 (Phase 7 재설계)**: closing_snapshots + closing_changes + tp_sales_snapshots (마감감지 + TP 매출)

---

## 6. 진행 상황

### Phase 1~3 ✅ 완료
### Phase 4 ✅ 완료
### 후속 패치 (PR #88~#116) ✅ 완료
- 브랜딩 (#88~#90): Atom-base 리뉴얼, 가독성, 고정 스크롤
- 계산 정정 (#91): 창업감면 OR 단순화
- 체크리스트 (#94): filing_deadline 백필 v35
- race 제거 (#95): revalidatePath 다단계 정리
- 계산기 확장 (#96~#97): 용도지수 주거/상업 분기 + 오피스텔 주거용
- 보고서 단순화 (#99): 종소세 6행 제거
- 모바일 자동조회 (#100): 미들웨어 `/api/calculator/*` 우회
- 손익계산서 손실 (#101~#105): 라벨 기반 부호 + △
- 빌드 최적화 (#106): vercel.json 중복 빌드 차단
- 자동조회 hoNm/PNU (#108~#109): 5단계 + 부번 변형 폴백
- html2canvas form-sync (#110): 헬퍼 (효과 부분적)
- 종소세 임시 고객 UPSERT (#112): UNIQUE 제약 해결
- 조정료 발송 체크박스 + 필터 (#113): v36
- 종소세 지방세 override (#114): v37 + 친화적 에러 메시지
- 행 담당자 드롭다운 (#116): clients.manager distinct 공유

### Phase 7 — 위하고 데이터 수집 (진행 중)
> 위하고T 화면 데이터를 받아 아톰베이스에 쌓고 결재 검토 시 원클릭 확인. 4단계 로드맵.
- [x] **1단계** ✅: 스냅샷 저장소(v40) + 수동 붙여넣기 수집 + 아톰랩 검토 화면 (인건비·감가상각 룰)
- [x] **2단계-A** ✅: 확장 수신 API(`/api/wehago/ingest`) + 직원별 토큰 인증(v41) + 토큰 관리 화면
- [~] **2단계-B** ⚠️ 폐기: 크롬 확장 응답 가로채기(`wehago-extension/`). 위하고가 fetch/XHR이 아닌 자체 통신 모듈(luna-ufo)을 써서 `window.fetch`/`XMLHttpRequest` 래핑·MAIN world 주입(PR #133~135) 모두 무효 → **가로채기 방식 공식 폐기**. 폴더는 삭제 안 하고 "마감현황 동기화 버튼"용으로 재활용 예정.

> **재설계 (PR 이후)**: 전체 폴링 대신 **세무사가 마감현황을 1회 조회 → 응답 붙여넣기 → 마감 상태 변화 감지**(차단 위험↓). 1단계 룰 + TP 매출대조 재사용. → 5-13 / `/atom-lab/closing` 참조.
- [x] **재설계 1단계** ✅: 마감감지(`closing_snapshots`/`closing_changes`) + TP 매출(`tp_sales_snapshots`) 붙여넣기/업로드 화면 (v42, 종소세/법인세 세목)
- [ ] 재설계 2단계: 부가세 마감현황 정찰 → `tax_type='vat'` + TP vs 위하고 과세표준 자동 대조
- [ ] 재설계 3단계: 마감현황 붙여넣기를 확장 버튼 1클릭 자동화(wehago-extension 개조)

### Phase 5 — 진행 예정
- [ ] 5-1: 부가가치세 보고서 (8~10h)
- [ ] 5-2: 결산보고서 (8~12h)
- [ ] 5-3: 세금계산서 양식 (4~6h)
- [ ] 5-4: 결산참고 부가가치세
- [ ] 5-5: 결산참고 법인세
- [ ] 5-6: 체크리스트 서류업로드 (Supabase Storage)

### 작업지시서 단계 (대기 중 / 진행 가능)
- 부가세 계산기 PNG → 보고서 컴포넌트 전환 (VatCalcReport)
- 조정료 청구서 즉시 저장 (납부방법/발송/납부)
- 위쪽 담당자 필터 매칭 확장 (수동 행 manager 포함)
- 홈택스 표 농특세 파서 수정 (납부할 총세액 행 매칭)
- 매매사업자 면적 소수점 입력
- 매매사업자 행 expand 시 prior 자동 표시

---

## 7. 디자인 가이드 (Atom-base 브랜드)

| 항목 | 내용 |
|------|------|
| 사이트명 | **ATOM BASE** (한 줄 대문자, Outfit 800) |
| 로고 | `<AtomLogo />` (원자 심볼 SVG) |
| 브랜드 메인 | **`#6927FF`** |
| 브랜드 다크 | `#5118e0` |
| 브랜드 라이트 | `#8b5cff` |
| 브랜드 소프트 (배경) | `#f4efff` |
| 사이드바 배경 | `linear-gradient(180deg, #6927FF 0%, #5118e0 100%)` |
| 결론 진파랑 박스 | `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)` |
| 손실 숫자 (PR #101) | `△1,234,567` (빨간색) |
| 손익계산서 라벨 (PR #101) | 양수=Ⅴ.영업이익 / 음수=Ⅴ.영업손실 (동적) |
| override 상태 (PR #114) | 자동=회색 placeholder / 수동=앰버 border + 🔄 자동복귀 |

### 보라 배경 위 가독성 (PR #89)
- 본문: `text-white font-semibold`
- 라벨/배지: `text-yellow-200 font-extrabold tracking-wider`
- **금지**: `text-white/70` 이하

---

## 8. 코드 규칙

- TypeScript 필수, `any` 금지
- 컴포넌트 → `src/components/`
- DB 접근 → `src/lib/db/`
- 외부 API → `src/lib/api/{provider}/`
- 정적 데이터 → `src/lib/data/`
- 무거운 컴포넌트 `dynamic` import

### ⚠️ 작업 시작 전 필수 점검
1. **스키마 확인**: `src/types/database.ts` 또는 `src/lib/db/`
2. **CLAUDE.md 5번 섹션** 스키마 정정 사항 참조
3. **추측으로 컬럼명 사용 금지**
4. **진단 우선**: grep + 실제 파일 읽기로 사실 확인 후 진행

### 공통 유틸리티 위치
- `src/lib/utils/pdf-export.ts` — PDF 생성
- `src/lib/utils/highlight-amounts.ts` — 수치 강조
- `src/lib/utils/invoice-export.ts` — PNG 다운로드
- `src/lib/utils/pnu.ts` — PNU 분해 + 변형 (PR #109)
- `src/lib/utils/startup-tax-reduction.ts` — 창업감면 (PR #91)
- `src/lib/utils/format-amount.ts` — formatIncomeAmount (△ 음수)
- `src/lib/utils/html2canvas-form-sync.ts` — input value 동기화 (PR #110)
- `src/lib/data/regional-zones.ts` — 권역 분류
- `src/lib/data/building-use-codes.ts` — 부가세 계산기 용도 45개
- `src/lib/data/income-statement-labels.ts` — 손익계산서 동적 라벨

---

### 자주 마주친 함정 (실제 발생 사례)

#### 1. Supabase `.or()` 필터의 값 파싱 버그 (PR #77)
- PostgREST `.or()`는 값 안의 `,` `.` 를 구분자로 인식
- **해결**: `.in()` 또는 두 번 쿼리 후 클라이언트 측 합치기

#### 2. UPSERT 시 같은 PK 중복 (PR #85)
- **해결**: upsert 전에 Map으로 중복 제거

#### 3. 클라이언트 컴포넌트 metadata 불가
- **해결**: 서버 컴포넌트 래퍼로 분리

#### 4. 동적 새 탭 — 팝업 차단
- **해결**: 빈 탭 먼저 열고 URL 변경

#### 5. router.refresh() 남용 (PR #84)
- **해결**: 클라이언트 state로 즉시 갱신

#### 6. React.memo 인라인 함수 무용 (PR #84)
- **해결**: dispatcher 패턴, useCallback

#### 7. N+1 쿼리 (PR #87)
- **해결**: 배치 조회

#### 8. "안 보이는 데이터" = DB 데이터 자체가 잘못 (PR #94)
- 코드 필터링부터 의심 X, **DB 데이터 실제 상태 확인 1순위**
- 사용자 발언을 **현상 vs 의도**로 분리

#### 9. 백그라운드 RSC refetch race (PR #95)
- **해결**: 다단계 액션은 **마지막 액션만 revalidatePath**

#### 10. 공개 페이지의 API 라우트도 미들웨어 우회 명시 필요 (PR #100)
- 페이지 + API 둘 다 우회 필요
- 누락 시 비로그인 POST → /login redirect → **HTTP 405**
- 데스크톱(로그인)은 안 보이고 모바일/시크릿창에서 발생

#### 11. 손익계산서 자동입력 — 라벨 기반 부호 처리 (PR #101)
- 엑셀 라벨이 동적 ("영업이익" vs "영업손실")
- 숫자는 항상 절대값 → 라벨에서 "손실" 키워드 감지해서 음수
- 표시: △ + 라벨 동적

#### 12. Vercel 중복 빌드 (PR #106)
- push 브랜치 + main = 같은 commit 2번 빌드
- **해결**: vercel.json `git.deploymentEnabled`
- 큐 막힘: 옛 Queued Cancel + 최신 main commit Redeploy

#### 13. 자동조회 PNU 변환 오류 — 여러 필지 단지 (PR #109)
- VWorld가 도로명주소 → PNU 변환 시 단지의 다른 필지로 매핑
- 건축물대장은 대표지번 1개에만 등록 → itemCount: 0
- 사례: 태형팰리스 — 시스템 부번 0002, 건물 등록 부번 0001
- **해결**: PNU 부번 ±1, ±2, 대지구분 swap 변형 시도
- 진단: Vercel Function Logs itemCount 확인

#### 14. html2canvas + `<input>` value 함정 (PR #110, 부분 해결)
- `<input>` value는 attribute가 아니라 DOM property
- html2canvas는 attribute만 보고 렌더링 → PNG에서 빈 칸/placeholder
- 헬퍼: `html2canvas-form-sync.ts` (onclone에서 동기화)
- **본질적 해결**: **보고서 컴포넌트로 전환** — 화면 캡처 X, 정적 컴포넌트 캡처

#### 15. INSERT 중복 호출 = UNIQUE 제약 위반 (PR #112)
- 페이지 서버 컴포넌트 + 모달이 같은 row를 둘 다 INSERT 시도
- 사용자에게는 "기능 되는데 에러 나오네"로 보임
- 진단: Vercel Logs `digest`로 정확한 에러 확보
- **해결**: UPSERT (`onConflict + ignoreDuplicates`)

#### 16. "Server Components render" 모호 에러 = DB 마이그레이션 누락 가능성 ⭐ (PR #114)
- 새 컬럼 UPDATE 코드는 들어갔는데 마이그레이션 SQL 미실행
- PostgreSQL 42703 → Next.js Server Component가 production에서 메시지 마스킹
- **1순위 진단**: 최근 작업의 마이그레이션 SQL 실행 여부 확인
- 보강: 42703 에러를 잡아서 "스키마 마이그레이션 필요" 메시지로 변환

### Vercel Logs 활용 패턴 ⭐⭐

추측 2번 빗나가면 즉시 Vercel Logs 캡처 요청 — 진단 시간 극적 단축. 활용 케이스:
- HTTP 405 → 미들웨어 누락 (PR #100)
- itemCount 0 → PNU 변환 오류 (PR #109)
- digest 216066889 → UNIQUE 제약 위반 (PR #112)
- 42703 → 마이그레이션 누락 (PR #114)

### 단방향 원칙 (매매사업자 종전 양도차익)
- `calculatePriorAmounts`는 SELECT만, 다른 물건 UPDATE 금지
- 양도일 < (strict) 조건으로 이전 물건만 합산

---

## 9. Next.js 15 / Supabase 패턴

### Supabase
- 서버 컴포넌트·서버 액션 → `createClient()` (`src/lib/supabase/server.ts`)
- 새 테이블 RLS 정책 필수
- Realtime 활성화: `ALTER PUBLICATION supabase_realtime ADD TABLE table_name;`

### Next.js 15
- `searchParams`, `params`는 `Promise` 타입 (`await` 필요)
- `useSearchParams()` 사용 시 `<Suspense>` 래퍼 필수

### 미들웨어 우회 (PR #100)
```typescript
if (
  pathname.startsWith('/calculator') ||
  pathname.startsWith('/api/calculator/') ||  // ⭐ API도 우회
  pathname.startsWith('/share/') ||
  pathname.startsWith('/api/cron/') ||
  pathname.startsWith('/api/wehago/ingest')   // 2단계-A: 확장 수신(토큰 인증)
) {
  return NextResponse.next();
}
```

### Postgres 에러 친화화 (PR #114)
```typescript
try {
  await supabase.from('...').update({...});
} catch (e: any) {
  if (e.code === '42703') {
    throw new Error('스키마 마이그레이션이 필요합니다.');
  }
  throw e;
}
```

---

## 10. 자동화 배포 흐름

```
코드 수정 → commit + push (claude/push-to-main-KjAEB)
        → PR 자동 생성 + Squash 머지 to main
        → Vercel 자동 배포 (main만 빌드, push 브랜치는 PR #106으로 비활성)
        → 1~2분 후 production 반영
```

DB 스키마 변경: Supabase SQL 에디터에서 `migrations/v*.sql` 직접 실행
큐 막힘 시: 옛 Queued Cancel + 최신 main commit Redeploy

---

## 11. 주요 결정 사항

### 부가가치세 계산기

#### 용도지수 (PR #96~#97)
- 시행령 별표 45개 정적 데이터: `building-use-codes.ts`
- 1차 분기: 주거용 / 상업용
- 오피스텔: 상업용(28) + 주거용 임대용(100)
- usageId 키: code의 string
- 자동조회 매핑 5종: 아파트→'1', 단독/다세대→'2', 오피스텔→'28', 근린생활→'41', 업무시설→'29'

#### 자동조회 PNU 변형 폴백 (PR #109) ⭐
- 시스템 PNU로 itemCount: 0이면 부번 변형 시도
- 변형: 부번 ±1, ±2, 대지구분 swap
- 매칭된 PNU로 hoNm 5단계 시도
- 사례: 태형팰리스 (109-2 → 109-1로 매칭)
- 모든 변형 실패 시 사용자에게 PDF 업로드 안내

#### 모바일 자동조회 (PR #100)
- 미들웨어 우회 목록에 `/api/calculator/*` 추가 필수

#### 공시지가 (2026년)
- 정부 API에서 자동 업데이트 (5/31 이후)
- 우리가 정적 데이터로 갱신할 게 없음

### 결산참고

#### 일반사업자 — 창감/중특 (PR #91)
- 비과밀억제 AND 청년 = 100%
- 비과밀억제 OR 청년 = 50%
- 둘 다 X = X

### 매매사업자 비즈니스 로직

#### 양도소득 계산식
```
차감 후 양도가액 = transfer_amount - vat_amount
양도소득 = (transfer_amount - vat_amount) - SUM(필요경비)
```

#### 종전 양도차익 (단방향 원칙)
- 같은 거래처 + 같은 양도년도 + 양도일 < 이번 물건의 합산
- SELECT만, UPDATE 절대 X
- 🔄 자동복귀 버튼

#### 자동계산 트리거
- 페이지 진입 시 자동계산 X (override 값만 로드)
- [세금계산] 클릭 시 명시적 재계산 + prepaid DB 저장
- **revalidatePath 마지막 액션에만** (PR #95)

### 종합소득세 보고서

#### 손익계산서 손실 표시 (PR #101~#105)
- 라벨에 "손실" 포함 시 음수 저장
- 표시: `△1,234,567` (빨간색)
- 라벨 동적: "영업이익" ↔ "영업손실" 등
- 헬퍼: `getIncomeStatementLabel(field, value)`, `formatIncomeAmount(amount)`
- 법인세 보고서도 같은 파서/컴포넌트 공유

#### 세액의 계산 단순화 (PR #99)
6개 행 제거. "납부(환급)할 총세액"이 표 마지막.

#### 지방소득세 override (PR #114)
- `income_local_tax_override` NULL = 자동(총세액×10%), 값 = 수동
- 🔄 자동복귀 버튼
- 패턴: 매매사업자 prior_*_override와 동일

#### 임시 고객 UPSERT (PR #112)
- `onConflict: 'client_id,report_year', ignoreDuplicates: true`

### 조정료 청구서

#### 발송 체크박스 + 필터 (PR #113)
- `is_sent` 컬럼 (v36)
- 납부방법 / 발송 / 납부 3중 필터 (URL query string)
- 헤더/푸터 통계 분리

#### 행 담당자 드롭다운 (PR #116)
- 수동 행만 적용 (자동 연결 행은 clients.manager readonly)
- 위쪽 필터와 동일 소스 (clients.manager distinct)
- 옛 데이터 호환: 목록에 없는 값은 첫 옵션으로 보존

---

## 12. 작업 이력

### 2026-05-17 ~ 2026-05-19 (Phase 4 → 5 사이 후속 패치)

**브랜드 리뉴얼**
- PR #88: Atom-base 브랜드 (보라 그라디언트, AtomLogo, 아톰랩)
- PR #89: 사이드바 가독성
- PR #90: 사이드바 고정 스크롤

**계산 로직 정정**
- PR #91: 창업감면 OR 단순화 + % 표시

**체크리스트**
- PR #92→#93: NULL 노출 회수
- PR #94: filing_deadline 백필 + v35

**race condition**
- PR #95: revalidatePath 다단계 정리

**부가세 계산기**
- PR #96: 용도지수 주거/상업 분기 + 시행령 45개
- PR #97: 오피스텔 주거용 추가
- PR #100: 모바일 자동조회 HTTP 405 미들웨어 우회
- PR #108: hoNm 5단계 확장
- PR #109: PNU 부번 변형 폴백 (태형팰리스 해결)
- PR #110: html2canvas form-sync (부분 효과)

**보고서**
- PR #99: 종소세 세액의 계산 6행 제거
- PR #101~#105: 손익계산서 손실 부호 + △ + 동적 라벨

**빌드 최적화**
- PR #106: vercel.json 중복 빌드 차단

**임시 고객 + 청구서**
- PR #112: 종소세 임시 고객 UPSERT (UNIQUE 제약)
- PR #113: 조정료 발송 체크박스 + 필터 + v36
- PR #114: 종소세 지방세 override + v37 + 친화적 에러
- PR #116: 행 담당자 드롭다운

### 작업지시서 단계 (대기)
- 부가세 계산기 PNG → 보고서 컴포넌트 전환
- 조정료 청구서 즉시 저장 (납부방법/발송/납부)
- 위쪽 담당자 필터 매칭 확장
- 홈택스 표 농특세 파서 수정
- 매매사업자 면적 소수점 입력
- 매매사업자 행 expand 시 prior 자동 표시

---

## 13. 진단 회고 — 사용자분 통찰

### Phase 4 → 5 결정적 통찰

13. "주식매수 특례 / 분납할 세액 부분을 없애버려도 될듯해" → UI 단순화 (PR #99)
14. "신고기한이 없는 경우는 제외해야돼" → 본래 의도 명확화 (PR #94)
15. "비과밀억제권역 or 만 34세 이하 중 하나만 충족" → 창업감면 OR (PR #91)
16. "세금은 원자단위로 정확하게" → 브랜드 시스템 #6927FF (PR #88)
17. "세금계산 누르면 기납부 종소세에 반영 안되네 (재발)" → RSC race 발견 (PR #95)
18. "모바일 자동조회 안돼 HTTP 405" → 미들웨어 누락 (PR #100)
19. "손실인데 당기순이익으로 나와" → 라벨 부호 처리 (PR #101)
20. "표시도 당기순손실/영업손실로 해주는거지?" → 라벨 동적 표기 격상
21. **"이 경우에는 화면 자체를 캡처해서 내보내지 말고 보고서 형식으로 바꿔서 내보내면"** → 화면 캡처의 본질적 한계 지적
22. **"행추가한 업체 담당자가 ... 위에 담당자 선택하고 조회 눌렀을때도 그 담당자로 나와야함"** → 단방향 매칭의 비대칭성 발견
23. **Vercel Logs로 결정적 단서 자발 제공** → PR #109, #112, #114 진단의 결정적 분기점

### 교훈

- **사용자 발언을 현상 vs 의도로 분리**
- **DB 데이터 자체 확인 1순위** (PR #94)
- **다단계 액션의 revalidatePath**: 마지막 액션만 (PR #95)
- **공개 페이지의 API 라우트도 미들웨어 우회** (PR #100)
- **모바일은 환경별 재현 필수**
- **라벨 기반 부호 처리** (PR #101)
- **Vercel 빌드 큐 관리**: push 브랜치 + main 중복 차단
- **추측 2번 빗나가면 Vercel Logs 캡처 요청** ⭐ (PR #109, #112, #114)
- **마이그레이션 SQL 누락은 "Server Components render" 모호 에러** (PR #114)
- **화면 캡처의 본질적 한계**: 보고서 컴포넌트 전환이 더 본질적 해결 (PR #110 보강)
- **UNIQUE 제약 + INSERT 중복**: UPSERT 또는 INSERT 일원화 (PR #112)
- **추측 기반 작업지시서의 한계**: Claude Code 진단 결과 1차 신뢰, 의외 정정 시 사용자에게 의도 재확인

---

## 14. 사용자 운영

- Supabase 대시보드 → Authentication → Invite User
- 직원이 이메일로 비밀번호 설정 후 로그인
- Realtime 활성화된 테이블은 새로고침 없이 즉시 동기화

---

*최종 수정일: 2026-06-12*
*Phase 4 + 후속 패치 (PR #88~#116) 완료 / Phase 7: 위하고 수집 1단계(v40) + 2단계-A 수신 API·토큰(v41) / 2단계-B 확장 가로채기 ⚠️폐기(luna-ufo) → 재설계: 마감감지+TP 매출(v42, `/atom-lab/closing`)*
*다음: 부가세 마감현황 정찰 → TP vs 위하고 과세표준 자동대조 + Phase 5(부가세 보고서/결산보고서/세금계산서/결산참고/체크리스트 업로드)*
*진행 중 작업지시서 6건 대기*
