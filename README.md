# 아톰세무회계 - 웹 관리 시스템

## 📋 프로젝트 개요

아톰세무회계의 고객사 및 매매사업자 관리를 위한 통합 웹 시스템입니다.

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

#### Firebase (이전) - 더 이상 사용하지 않음
- **Provider**: Google Firebase
- **Project ID**: atomtax-cffe3
- **마이그레이션 완료 날짜**: 2026-02-16

#### 마이그레이션 파일
- ✅ `sql/supabase-schema.sql` - 데이터베이스 스키마 (실행 완료)
- ✅ `js/supabase-config.js` - Supabase 설정 (API Keys 입력 완료)
- ✅ `js/supabase-auth.js` - 인증 모듈 (사용 중)
- ✅ `js/supabase-db.js` - 데이터베이스 API (사용 중)
- ✅ `SUPABASE_MIGRATION_GUIDE.md` - 마이그레이션 가이드

**마이그레이션 완료!** ✅

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
│   │
│   ├── firebase-config.js             # Firebase 설정 (레거시)
│   ├── firebase-auth.js               # Firebase 인증 (레거시)
│   ├── firebase-db.js                 # Firebase DB API (레거시)
│   │
│   ├── clients.js                     # 고객사 관리 로직
│   ├── trader-detail.js               # 매매사업자 상세 로직
│   ├── common.js                      # 공통 유틸리티
│   └── data-migration.js              # 데이터 마이그레이션 도구
│
├── css/
│   ├── style.css                      # 메인 스타일
│   └── trader-detail.css              # 매매사업자 페이지 스타일
│
└── docs/
    ├── SUPABASE_MIGRATION_GUIDE.md    # Supabase 마이그레이션 가이드
    ├── CLIENT_MANAGEMENT_UPDATE.md    # 고객사 관리 업데이트
    ├── REFERENCE_DATA_FEATURE.md      # 입력참고용 기능
    └── VAT_CALCULATOR_UPDATE.md       # 부가세 계산기 업데이트
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
- Password: (Firebase Auth에 등록된 비밀번호)

### 3. 데이터 백업 (마이그레이션 전 필수)

Firebase 데이터를 백업하려면:
```javascript
// 브라우저 콘솔에서 실행
await backupAllData();
// → firebase_backup_YYYY-MM-DD.json 다운로드됨
```

---

## 📊 데이터 모델

### Firebase Firestore (현재)

#### Collections

**1. users**
```javascript
{
  uid: string,
  email: string,
  name: string,
  role: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**2. clients**
```javascript
{
  id: string,
  number: string,
  company_name: string,
  business_number: string,
  representative: string,
  manager: string,
  phone: string,
  address: string,
  business_type: string,
  business_item: string,
  start_date: date,
  end_date: date,
  contract_amount: number,
  supply_amount: number,
  tax_amount: number,
  is_terminated: boolean,
  termination_date: date,
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**3. trader_inventory (일부는 localStorage)**
```javascript
// LocalStorage: trader_inventory_{clientId}
{
  property_name: string,
  address: string,
  detailed_address: string,
  land_area: number,
  building_area: number,
  acquisition_value: number,
  other_expenses: number,
  transfer_value: number,
  transfer_income: number,
  disposal_cost: number,
  acquisition_date: date,
  transfer_date: date,
  report_deadline: date,
  prepaid_income_tax: number,
  prepaid_local_tax: number,
  over_85: string,
  progress_stage: string,
  remarks: string,
  expenses: [
    {
      no: number,
      expense_name: string,
      category: string,
      amount: number,
      cost_approved: string,
      note: string
    }
  ]
}
```

### Supabase PostgreSQL (마이그레이션 대상)

자세한 스키마는 `sql/supabase-schema.sql` 참고

**테이블:**
- users
- clients (Foreign Key, Unique constraints)
- trader_inventory (clients와 JOIN)
- expenses (trader_inventory와 JOIN)
- documents (서류 업로드)

---

## 🔐 인증 및 보안

### 현재 (Firebase)
- Firebase Authentication (Email/Password)
- Firestore Security Rules

### 마이그레이션 후 (Supabase)
- Supabase Auth (Email/Password)
- Row Level Security (RLS) Policies
- 더 세밀한 권한 관리

---

## 📈 최근 업데이트

### 2026-02-16 ⭐ **Supabase 마이그레이션 완료**
- ✅ Firebase → Supabase 완전 전환
  - PostgreSQL 데이터베이스 스키마 생성
  - Supabase Auth 설정 완료
  - HTML 파일 SDK 교체 (6개 파일)
  - JavaScript 모듈 업데이트
  - 관리자 계정 생성 (mail@atomtax.co.kr)
- ✅ 프로젝트 URL: https://vdjyynwmnypuxvlhrcbk.supabase.co
- ✅ 5개 테이블 생성: users, clients, trader_inventory, expenses, documents
- ✅ Row Level Security (RLS) 정책 적용

### 2026-02-15
- ✅ Supabase 마이그레이션 준비
  - 스키마 설계 및 SQL 파일 작성
  - Supabase 설정·인증·DB 모듈 작성
  - 상세 마이그레이션 가이드 작성
- ✅ 고객사 관리 개선
  - 모달 백그라운드 클릭 방지
  - 번호 중복 체크 (해임고객 제외)
- ✅ 매매사업자 기능 추가
  - Excel 업로드 시 기존 데이터 보존
  - 기납부 종소세·지방소득세 추가
  - 입력참고용 보고서 자동 생성
- ✅ 건물분 부가세 계산기 업데이트
  - 상세 위치 입력 필드 추가
  - 건물기준시가 전체 금액 입력 방식으로 변경
  - PNG 다운로드 기능 추가

### 2026-02-14
- ✅ 필요경비 상세 줄별 삭제 기능
- ✅ 진행 단계별 색상 표시
- ✅ 비용명 드롭박스 변경
- ✅ OCR 서류 업로드 개선

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
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
```

---

## 📝 다음 단계

### 완료된 마이그레이션 단계 ✅
1. ✅ Supabase 프로젝트 생성
2. ✅ 데이터베이스 스키마 실행
3. ✅ 관리자 계정 생성
4. ✅ HTML/JS 코드 Supabase로 전환
5. ✅ 테스트 및 검증

### 권장 다음 작업
- [ ] 실제 고객 데이터 입력 및 테스트
- [ ] 서류 업로드 기능 Supabase Storage 연동
- [ ] 실시간 협업 기능 (Supabase Realtime)
- [ ] 알림 시스템
- [ ] 모바일 반응형 최적화
- [ ] 다크 모드

---

## 📞 문제 해결

### Firebase 연결 실패
- Firebase 설정 확인: `js/firebase-config.js`
- 네트워크 연결 확인
- Firebase Console에서 프로젝트 상태 확인

### LocalStorage 데이터 손실
- 브라우저 캐시 삭제 시 데이터 손실 가능
- **해결책**: Supabase 마이그레이션으로 영구 저장

### Excel 업로드 실패
- 파일 형식 확인 (.xlsx)
- 양식 일치 여부 확인
- 브라우저 콘솔에서 에러 메시지 확인

---

## 🔗 유용한 링크

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Firebase Console](https://console.firebase.google.com)
- [마이그레이션 가이드](./SUPABASE_MIGRATION_GUIDE.md)
- [Daum Postcode API](https://postcode.map.daum.net/guide)

---

## 📄 라이선스

이 프로젝트는 아톰세무회계의 내부 사용을 위해 제작되었습니다.

---

**제작:** Claude AI + 아톰세무회계  
**최종 업데이트:** 2026-02-15  
**버전:** 2.0.0 (Supabase Migration Ready)
