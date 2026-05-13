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
Frontend  : Next.js 15 (App Router) + TypeScript
Styling   : Tailwind CSS
Database  : Supabase (PostgreSQL)
Auth      : Supabase Auth
PDF/PNG   : jsPDF + html2canvas
PDF 파싱  : pdf-parse (건축물대장 PDF 자동 추출)
배포      : Vercel (GitHub 연동 자동 배포)
실시간    : Supabase Realtime (체크리스트)
```

### 핵심 원칙
- 모든 DB 접근은 서버 사이드에서만 (Server Actions / API Routes)
- 브라우저에서 Supabase 직접 호출 절대 금지
- `localStorage`에 업무 데이터 저장 금지
- `any` 타입 금지
- CDN 라이브러리 로드 금지

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
```

---

## 4. 페이지 구조

```
/dashboard

/clients                                    기장고객 목록
/clients/[id]                               고객 상세
/clients/terminated                         해지고객

/reports-review                             결산참고 (분기)
/reports-review/income-tax                  종합소득세 분기 선택
/reports-review/income-tax/personal         일반사업자 참고 ✅
/reports-review/income-tax/trader           매매사업자 참고 (준비 중)
/reports-review/vat                         부가가치세 (준비 중)
/reports-review/corporate-tax               법인세 (준비 중)

/invoices/adjustment                        조정료 청구서
/invoices/adjustment/[id]/print             A4 인쇄 + 별지
/invoices/tax                               세금계산서 (예정)

/reports/corporate-tax                      법인세 보고서
/reports/income-tax                         종합소득세 보고서
/reports/vat                                부가가치세 보고서 (예정)
/reports/settlement                         결산보고서 (예정)

/traders                                    매매사업자 목록
/traders/[clientId]                         물건 마스터-디테일
/traders/checklist                          체크리스트 (Realtime)

/calculator/vat                             부가세 계산기 Landing (공개)
/calculator/vat/calc                        부가세 계산기 (공개)
```

### 사이드바 메뉴 순서

```
├── 대시보드
├── 고객 관리
├── 결산참고 ⭐
│   ├── 부가가치세 (준비 중)
│   ├── 종합소득세 (일반사업자/매매사업자 분기)
│   └── 법인세 (준비 중)
├── 청구서 (조정료/세금계산서)
├── 보고서 (법인세/종합소득세/부가가치세)
├── 매매사업자 (관리/체크리스트)
└── 부가세 계산기 (외부 링크 ↗)
```

---

## 5. 핵심 데이터베이스 테이블

### 5-1. clients (기장고객)
- `business_category_code`: 업종코드 (703011, 703012 = 매매사업자)
- `business_type_category`: '법인' | '개인'
- `google_drive_folder_url` / `trader_drive_folder_url` (별도)
- `is_terminated`, `manager`, `business_name`, `business_item`

### 5-2. corporate_tax_reports ✅ v17 (38컬럼)
### 5-3. income_tax_reports ✅ v19 (38컬럼 + 손익계산서 + 결론)
### 5-4. adjustment_invoices ✅ (담당자 컬럼)

### 5-5. trader_properties ✅ v20 (v20e까지)
- `progress_status`: 5단계
- 자동 계산: `transfer_income`, `filing_deadline`
- `land_area`, `building_area` (m²)
- **Realtime 활성화**: `ALTER PUBLICATION supabase_realtime ADD TABLE trader_properties;`

### 5-6. trader_property_expenses ✅ v20
- 10행 고정, `category` (취득가액/기타필요경비), `predeclaration_allowed`, `income_tax_allowed`

### 5-7. income_tax_review_notes ✅ v22 (신규)
- 결산참고 메모 + 확인여부만 저장 (다른 값은 income_tax_reports 실시간)
- UNIQUE(client_id, report_year)

---

## 6. 핵심 기능별 진행 상황

### 6-1~6-4. 고객 관리 / 조정료 / 법인세 / 종합소득세 보고서 ✅

### 6-5. 매매사업자 관리 ✅ (v20a~v20e)
- 3-Level 구조 (담당자 → 사업자 → 물건)
- 진행단계 5단계 색상 배지
- 액션 버튼 5종 (부동산 폴더/입력참고용/세금계산/보고서 PNG/삭제)
- 보고서 PNG 2페이지 (보고서 + 필요경비 상세)

### 6-6. 매매사업자 체크리스트 ✅ (Phase 4-1, Realtime)

### 6-7. 부가가치세 계산기 ✅ (Phase 4-2, 공개)

**완성된 기능**:
- 공개 페이지 (미들웨어 격리)
- Daum 주소검색 + VWorld 좌표/PNU
- VWorld 토지공시지가 자동조회 (JSONP)
- realtyprice.kr 비교 링크
- 건물기준시가 자동계산 (메인 페이지 통합, 모달 제거)
- 건축물대장 자동조회 (표제부 + 전유공용면적)
- **메타 자동 매핑**: 신축연도 + 구조 + 용도 자동 채움
- 건축물대장 PDF 업로드 폴백
- 동/호 숫자 정확 일치 매칭 (105 ≠ 1105)
- 지하 체크박스 → "B" 접두 자동 변환
- **hoNm 자동 재시도** ("1702호" → "1702" 폴백)
- 천단위 콤마 + 소수점 2자리
- 부가세 자동 안분 계산 + PNG 다운로드
- [🔄 초기화] 버튼 (resetKey 강제 리마운트)
- [다시 조회] 시 메타 자동 덮어쓰기

**부가세 산식**:
```
부가가치세 시가 = (매도예상가 × 건물가액) ÷ (토지가액 + 건물가액 × 1.10) × 0.1
부가가치세 최저가 = 부가가치세 시가 × 0.7 (만단위 올림)
건물가액(분배 후) = 부가가치세 최저가 × 10
토지가액(분배 후) = 매도예상가 − 부가가치세 최저가 × 11
```

**건물기준시가 산식 (국세청 해설서)**:
```
m² 단가 = 평가기준액 × 구조지수 × 용도지수 × 위치지수 × 잔가율
잔가율 = max(0.10, 1 - 경과연수 × 연 상각률)
경과연수 = new Date().getFullYear() - 신축연도  (Math.max(0, ...))
건물기준시가 = m² 단가 × 건물면적
```

**잔가율 그룹별 상각률**:
| 그룹 | 내용연수 | 상각률 | 대상 구조 |
|------|---------|--------|---------|
| Ⅰ | 50년 | 0.018 | 철근콘크리트, 통나무, 석조, 프리캐스트, 목구조, 라멘 |
| Ⅱ | 40년 | 0.0225 | 연와조, 목조, 시멘트벽돌, 보강콘크리트, ALC, 철골, 스틸하우스, 보강블럭, 와이어패널 |
| Ⅲ | 30년 | 0.03 | 경량철골, 석회/회벽돌, 돌담/토담, 황토, 시멘트블럭, 조립식 패널, 기계식주차전용 |
| Ⅳ | 20년 | 0.045 | 철파이프, 컨테이너 |

### 6-8. 결산참고 메뉴 ✅ (Phase 4-2i)

**일반사업자 참고** (`/reports-review/income-tax/personal`):
- 활성 개인사업자만 (`business_type_category='개인'`, `is_terminated=false`)
- 담당자별 섹션 그룹
- 연도 좌우 화살표 (기본: 현재 연도 - 1)
- 15컬럼 스프레드시트
- 행 클릭 → 세액공제/감면 상세 펼침
- 메모 + 확인체크박스만 저장
- 보고서 미작성 고객도 행 표시 (값 빈칸, 회색)

---

## 7. 디자인 가이드

| 항목 | 내용 |
|------|------|
| 레이아웃 | 왼쪽 사이드바 (240px) + 오른쪽 콘텐츠 |
| 메인 컬러 | 보라-파랑 그라디언트 `#667eea → #764ba2` |
| 결론 진파랑 박스 | `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)` |
| 환급/납부 강조 | 환급=파랑, 납부=초록 |
| 폰트 | Inter |
| 인쇄 | A4, `<A4Page>`, `no-print` 클래스 |
| 반응형 | 데스크톱 우선 |
| 진행단계 배지 | 5단계 색상 (`PROGRESS_STYLES`) |
| 납부기한 강조 | 빨간색 + 볼드 (`#dc2626`, `font-weight: 700`) |
| 자동조회 완료 강조 | 파란색 배지 (`bg-blue-100 text-blue-700 font-semibold`) |
| 검증 안내 박스 | amber (`bg-amber-50 text-amber-700`) |

---

## 8. 코드 규칙

- TypeScript 필수, `any` 금지
- 컴포넌트 → `src/components/`
- DB 접근 → `src/lib/db/`
- 외부 API → `src/lib/api/{provider}/`
- 페이지 → `src/app/` (App Router)
- CDN 라이브러리 로드 금지
- 모달/무거운 컴포넌트는 `dynamic` import

### 천단위 콤마 / 면적 입력 / 날짜 자동 포맷 패턴
기존 패턴 유지 (자세한 코드는 컴포넌트 참고)

### PNU 분해 패턴
- 19자리 → 시군구5 + 법정동5 + 산여부1 + 본번4 + 부번4
- 산여부 "1"(일반) → platGbCd "0"
- 산여부 "2"(산) → platGbCd "1"
- `src/lib/utils/pnu.ts`의 `parsePnu`

### 강제 리마운트 패턴 (초기화)
```typescript
const [resetKey, setResetKey] = useState(0);
const handleReset = () => {
  if (!confirm('초기화하시겠습니까?')) return;
  setState(INITIAL);
  setResetKey(k => k + 1);
};
<BuildingAreaField key={resetKey} ... />
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
npm install @supabase/supabase-js @supabase/ssr xlsx react-to-print
npm install date-fns lucide-react jspdf html2canvas pdf-parse
```

---

## 11. 개발 우선순위 / 진행 상황

### Phase 1~3 ✅ (Phase 1 골격, Phase 2 핵심 업무, Phase 3 매매사업자 v20a~v20e)

### Phase 4 — 추가 시스템
- [x] **4-1: 매매사업자 체크리스트** (Realtime)
- [x] **4-1b: 조정료청구서 담당자 컬럼**
- [x] **4-2: 부가가치세 계산기** (4-2a ~ 4-2h)
- [x] **4-2i: 결산참고 메뉴 (종합소득세 일반사업자 참고)**
- [ ] **4-3: 부가가치세 보고서** (8~10시간)
- [ ] **4-4: 결산보고서** (8~12시간)
- [ ] **4-5: 세금계산서 양식** (4~6시간)
- [ ] **결산참고 매매사업자 / 부가가치세 / 법인세**
- [ ] **체크리스트 서류업로드** (Supabase Storage, 4~6시간)

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

**API 호출 정책**:
- VWorld: 클라이언트 측 JSONP
- 공공데이터포털: 서버 사이드 Route Handler

**동/호 매칭 정책**:
- API에 `dongNm` 안 보냄 (DB 형식 불일치 위험)
- 응답 받은 후 숫자 추출 정확 일치 매칭 (105 ≠ 1105)
- 지하: 호수란 "1" 유지, API에서만 "B1호" 변환

**hoNm 자동 재시도 (핵심)**:
- 1차: `hoNm = "1702호"` (가락금호 같은 단지)
- 2차 폴백: `hoNm = "1702"` (학하지구 같은 호 접미 없는 단지)
- 두 케이스 모두 자동 처리

**메타 자동 매핑** (표제부 응답):
- `useAprDay` → 신축연도 (예: "19970811" → 1997)
- `strctCdNm` → 구조 (예: "철근콘크리트구조" → `cheolgeun`)
- `mainPurpsCdNm` → 용도 (예: "공동주택" → `apartment`)
- 동별로 다를 수 있어 사용자 입력 동수와 매칭

**표제부 폴백 정책**:
- 동/호 입력 시: 폴백 없음 (잘못된 전체 면적 반환 방지)
- 동/호 미입력 시: 표제부 조회 (단독주택용)

**경과연수 계산** (PR #46 보정):
- `currentYear = new Date().getFullYear()` (FISCAL_YEAR 하드코딩 X)
- `elapsedYears = Math.max(0, currentYear - completionYear)`
- 위치지수와 일관성 유지 (모두 2026 기준)
- 홈택스 결과와 일치 검증 완료

**다시조회 / 초기화 동작**:
- [다시 조회]: 면적 + 메타 모두 새 값으로 덮어쓰기
- [🔄 초기화]: confirm + resetKey 강제 리마운트

### 공공데이터포털 API 알려진 한계
- `numOfRows=1000` 무시 (100건 강제)
- `mgmBldrgstPk` 파라미터 무시
- `dongNm` 정확 일치 검색 실패 빈번
- `hoNm` 단지별 형식 다양 → **자동 재시도로 우회**

### VWorld API 알려진 한계
- 공시지가 동기화 1~3개월 지연 → realtyprice.kr 비교 링크 안내

### 결산참고 메뉴
- 저장 정책: 메모 + 확인체크만 (다른 값은 실시간 조회)
- 보고서 미작성 케이스: 행 표시, 값 빈칸 (회색)
- 담당자별 섹션 그룹 (가나다 순)

### 알려진 데이터 의존성 (검증 완료)
- **위치지수**: 2026 고시본 ✅ (PR #30)
- **구조/용도 지수**: 2025 고시본 (큰 오차 없음, 2026 나오면 갱신)
- **잔가율 산식**: 국세청 해설서와 일치 ✅
- **홈택스 결과와 일치** ✅ (PR #46 후 검증)

---

## 15. 작업 이력 (최근)

### 2026-05-13
- **PR #46**: 경과연수 계산 버그 보정 (FISCAL_YEAR 하드코딩 → 현재 연도)
- 홈택스 결과와 일치 검증 완료

### 2026-05-12
- **PR #43**: 표제부 메타 자동 매핑 (구조/용도/신축연도)
- **PR #44**: 결산참고 메뉴 (종합소득세 일반사업자 참고)
- **PR #45**: 부가세 계산기 UX 미세조정 (헤더/레이아웃/초기화/다시조회)
- **PR #39**: hoNm 자동 재시도 (학하지구 케이스 해결)
- **PR #38**: hoNm 파라미터 복원 (가락금호 정상화)
- **PR #30**: 위치지수 2026 업데이트
- **PR #28**: 조정료청구서 별지 컬럼 폭

### 2026-05-11
- Phase 3 매매사업자 시스템 100% (v20a~v20e)
- Phase 4-1 매매사업자 체크리스트
- Phase 4-2a~d 부가가치세 계산기 초기 구현

---

## 16. 진단 회고 — Phase 4-2 부가세 계산기

### 사용자분 통찰의 가치
이 프로젝트 진행에서 결정적이었던 사용자 통찰:

1. **"DB에서 103만 맞으면 가지고 오면 되는거 아니야?"** → 동/호 매칭 알고리즘의 시작
2. **"105 ≠ 1105 — 숫자는 정확하게 일치하게"** → 정확 일치 원칙
3. **"호 안 붙이고 숫자만 시도하면 안 되나?"** → hoNm 자동 재시도 폴백 (학하지구 해결)
4. **"경과연수는 지금 조회하는 순간 기준 아니야?"** → FISCAL_YEAR 버그 발견

### 교훈
- **API 한계는 우회보다 폴백이 더 현실적** (페이지네이션/PK 필터 시도 후 hoNm 폴백으로 회귀)
- **단순한 해결책이 종종 정답** (복잡한 매칭 로직보다 자동 재시도)
- **사용자 직관 신뢰**: 도메인 지식 + 직관이 코드 분석보다 빠른 진단 가능
- **진단 데이터(Vercel Logs) 받기 전 추측 작업은 위험** (PR #36, #37에서 가락금호까지 무너뜨림)

---

*최종 수정일: 2026-05-13*
*Phase 4-2 부가가치세 계산기 + 결산참고 메뉴 완전 종료*
*다음 작업 후보: Phase 4-3 부가가치세 보고서 (예상 8~10시간)*
