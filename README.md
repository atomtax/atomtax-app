# 아톰세무회계 - 웹 관리 시스템

## 📋 프로젝트 개요

아톰세무회계의 고객사 및 매매사업자 관리를 위한 통합 웹 시스템입니다.

---

## 🔥 최신 업데이트 (2026-02-21 23:00)

### ✅ 매매사업자 상세 페이지 - 테이블 레이아웃 긴급 수정

**상태**: ✅ **테이블 오버플로우 문제 해결 완료**

**문제**:
- 테이블 헤더 일부(필요경비 상세, 양도소득금액, 신고여부, 작업)가 빨간색 박스처럼 튀어나옴
- 원인: `table-layout: fixed` + 일부 칼럼 너비 미지정으로 인한 레이아웃 깨짐

**해결 방법**:
1. **`table-layout: fixed` 제거** → 자동 너비 조정으로 변경
2. **개별 칼럼 너비 지정 제거** → 내용에 따라 자동 조정
3. **최소 너비만 지정** (`min-width: 70px`) → 너무 좁아지는 것 방지
4. **소재지 칼럼 최소 너비** (`min-width: 150px`) → 긴 주소 표시

**로컬 테스트 결과**:
```
테이블 너비:     1,198 px
컨테이너 너비:   1,238 px
상태:           ✅ 정상 (오버플로우 없음)
칼럼 정렬:      12개 칼럼 모두 정상 표시
```

**파일 변경**:
- `trader-detail.html`: CSS 스타일 수정 (4개 블록)
- `README.md`: 최신 업데이트 기록 추가
- `TABLE_OVERFLOW_FIX_2026-02-21.md`: 상세 수정 문서
- `LOCAL_TEST_RESULT.md`: 로컬 테스트 결과

**결과**:
- ✅ 테이블 헤더가 정상적으로 정렬됨
- ✅ 칼럼 너비가 내용에 맞게 자동 조정됨
- ✅ 오버플로우/튀어나옴 현상 사라짐
- ✅ 모든 기능 정상 작동 (보고서, 엑셀 업로드 등)

---

## ✅ 최근 업데이트 (2026-02-21)

### 🔧 수정 완료
1. **대표자 필드 통합**
   - Supabase DB: `representative`, `ceo_name` 두 필드 모두 업데이트
   - UI 표시: 둘 다 사용 (호환성 보장)
   - Excel 업로드: "대표자" 컬럼 → 두 필드 모두 저장

2. **매매사업자 데이터 로드 수정**
   - `trader-detail.js`: RESTful API → Supabase API로 전환
   - `traders-data.html`: Fallback API 제거, Supabase 단일화
   - 테스트 모드 제거, 실제 DB 데이터 사용

3. **매매사업자 체크리스트 인증 수정**
   - `traders-checklist.html`: Supabase 인증 로직 보강
   - 인증 상태 로그 추가 (디버깅용)

4. **캐시 문제 해결** ⭐
   - 모든 JS 파일에 버전 파라미터 추가 (`?v=20260221`)
   - 브라우저 캐시 무효화 강제 적용
   - 파일: trader-detail.html, traders-data.html, traders-checklist.html

5. **매매사업자 목록 UI 표시 문제 해결** 🎉
   - `tradersGridContainer` 초기 `display: none` → `display: block` 수정
   - 데이터 로드는 성공했으나 CSS로 숨겨져 있던 문제 해결
   - 61개 매매사업자 정상 표시

6. **매매사업자 상세 페이지 캐시 문제 해결** ⭐
   - 데이터는 정상 조회되지만 캐시된 이전 JS로 Preview 모드 표시되던 문제
   - **Hotfix 적용**: trader-detail.html에 인라인 스크립트 추가
   - 외부 JS 파일 우회, Supabase 직접 호출로 즉시 동작
   - Netlify 재배포 없이도 정상 작동

---

## 🎯 주요 기능

### 1. 고객사 관리 (Clients Management)
- ✅ 기장고객 목록 조회 및 관리
- ✅ 해임고객 별도 관리
- ✅ 고객 정보 추가/수정/삭제
- ✅ 번호 중복 체크 (해임고객 제외)
- ✅ 담당자별 필터링
- ✅ 정렬 및 검색

### 2. 매매사업자 관리 (Trader Management)
- ✅ 물건 목록 관리
- ✅ Excel 일괄 업로드/다운로드
- ✅ 물건별 필요경비 상세 관리
- ✅ 진행 단계별 색상 표시 (미확인/확인/위하고입력/고객안내/신고완료)
- ✅ OCR 서류 자동 입력
- ✅ 입력참고용 보고서 자동 생성
- ✅ 신고기한 자동 계산

### 3. 건물분 부가가치세 계산기 (VAT Calculator)
- ✅ 주소 검색 (Daum Postcode API)
- ✅ 토지·건물 가액 자동 계산
- ✅ 부가가치세 계산
- ✅ PDF/PNG 다운로드 및 인쇄
- ✅ 상세 위치 입력

---

## 🗄️ 데이터베이스

### **현재 상태: Supabase 마이그레이션 완료** ✅

#### Supabase (현재 사용 중) ⭐
- **Provider**: Supabase (PostgreSQL)
- **Project**: https://vdjyynwmnypuxvlhrcbk.supabase.co
- **Services**:
  - Supabase Authentication (Email/Password)
  - PostgreSQL Database (관계형 DB)
  - Row Level Security (RLS)
- **장점**:
  - 💰 더 관대한 무료 플랜 (500MB DB, 무제한 API)
  - 🔍 강력한 SQL 쿼리 (JOIN, 복잡한 쿼리 지원)
  - 🔓 오픈소스 (자체 호스팅 가능)
  - 📊 더 나은 데이터 무결성 (Foreign Key, Unique 제약조건)

---

## 📂 프로젝트 구조

```
/
├── index.html                          # 메인 대시보드
├── login.html                          # 로그인 페이지
├── clients.html                        # 기장고객 관리
├── clients-terminated.html             # 해임고객 관리
├── traders-data.html                   # 매매사업자 일괄 데이터 관리
├── trader-detail.html                  # 매매사업자 상세 관리
├── vat-calculator-standalone.html      # 건물분 부가가치세 계산기
│
├── sql/
│   └── supabase-schema.sql            # Supabase DB 스키마
│
├── js/
│   ├── supabase-config.js             # Supabase 설정 (현재 사용)
│   ├── supabase-auth.js               # Supabase 인증 (현재 사용)
│   ├── supabase-db.js                 # Supabase DB API (현재 사용)
│   ├── clients.js                     # 고객사 관리 로직
│   ├── trader-detail.js               # 매매사업자 상세 로직
│   ├── common.js                      # 공통 유틸리티
│   └── auto-backup.js                 # 자동 백업
│
├── css/
│   ├── style.css                      # 메인 스타일
│   └── traders-performance.css        # 매매사업자 페이지 스타일
│
└── docs/
    ├── TABLE_OVERFLOW_FIX_2026-02-21.md
    ├── LOCAL_TEST_RESULT.md
    ├── SUPABASE_MIGRATION_GUIDE.md
    └── ...
```

---

## 🚀 시작하기

### 1. 로컬 개발 환경

**필수 요구사항:**
- 웹 브라우저 (Chrome, Firefox, Edge 등)
- 로컬 웹 서버 (Live Server, http-server 등)

**실행 방법:**
```bash
# VS Code Live Server 사용
1. VS Code에서 프로젝트 열기
2. index.html 우클릭 → "Open with Live Server"

# 또는 http-server 사용
npm install -g http-server
http-server -p 8080
```

### 2. 로그인

**기본 계정:**
- Email: `mail@atomtax.co.kr`
- Password: (Supabase Auth에 등록된 비밀번호)

---

## 🛠️ 기술 스택

### Frontend
- HTML5, CSS3, JavaScript (Vanilla JS)
- Font Awesome (아이콘)
- Google Fonts (타이포그래피)
- Daum Postcode API (주소 검색)
- SheetJS (XLSX) (Excel 처리)
- html2canvas (이미지 캡처)
- jsPDF (PDF 생성)

### Backend (Database)
- **현재**: Supabase (PostgreSQL, Auth, RLS)
- **이전**: Google Firebase (Firestore, Auth) - 더 이상 사용하지 않음

### CDN Libraries
```html
<!-- Supabase SDK (현재 사용) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Other Libraries -->
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
```

---

## 🌐 **배포 정보**

### **Production URL**
- 🌍 **사이트**: https://atomtax-app.netlify.app
- ✅ **상태**: Live & Running
- 📅 **최종 업데이트**: 2026-02-21

### **GitHub Repository**
- 📦 **저장소**: https://github.com/atomtax/atomtax-app
- 🔄 **자동 배포**: Netlify 연동 완료

### **호스팅**
- 🏠 **플랫폼**: Netlify
- 🚀 **자동 배포**: GitHub main 브랜치 push 시
- 🔒 **HTTPS**: 자동 적용
- ⚡ **CDN**: 글로벌 배포

---

## 🔐 **로그인 정보**

- **Email**: `mail@atomtax.co.kr`
- **Password**: (Supabase Dashboard에서 관리)

---

## 📊 **데이터 현황**

- **고객 데이터**: 187개 (Supabase PostgreSQL)
- **매매사업자**: 61개
- **백업 시스템**: 자동 백업 (auto-backup.js)
- **자동 백업**: Console에서 `autoBackup()` 실행
- **백업 주기**: 매주 권장

---

## 🔄 **개발 워크플로우**

```
1. GenSpark/로컬에서 코드 수정
   ↓
2. GitHub에 Push
   ↓
3. Netlify 자동 배포 (1-2분)
   ↓
4. https://atomtax-app.netlify.app 업데이트 완료!
```

---

## 📞 **지원 및 문서**

- 📖 [테이블 오버플로우 수정](./TABLE_OVERFLOW_FIX_2026-02-21.md)
- 🧪 [로컬 테스트 결과](./LOCAL_TEST_RESULT.md)
- 📖 [Supabase 마이그레이션 가이드](./SUPABASE_MIGRATION_COMPLETE.md)
- 🔧 [개발 가이드](./SUPABASE_DEVELOPMENT_GUIDE.md)

---

## 📄 라이선스

이 프로젝트는 아톰세무회계의 내부 사용을 위해 제작되었습니다.

---

**제작:** Claude AI + 아톰세무회계  
**최종 업데이트:** 2026-02-21  
**버전:** 2.2.0 (테이블 레이아웃 수정) 🚀

---

**🎉 배포 완료 및 운영 중!**
