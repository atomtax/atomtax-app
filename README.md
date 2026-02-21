# 아톰세무회계 - 웹 관리 시스템

매매사업자 및 고객사를 관리하는 웹 기반 세무회계 시스템

---

## 📌 최신 업데이트 (2026-02-21)

### 🔥 **긴급 수정: 테이블 레이아웃 12칼럼 구조 복원**

#### **문제점:**
- 물건 목록 테이블 헤더는 **12칼럼**이었으나, JavaScript 렌더링 로직은 **8칼럼만** 생성
- 데이터가 잘못된 위치에 표시되고, 칼럼명과 데이터가 불일치
- 테이블 레이아웃이 깨지고 오버플로우 발생

#### **해결책:**
✅ **renderInventoryTable() 함수를 12칼럼 구조로 완전히 재작성**
- 12개 칼럼 정확히 일치: No, 소재지, 면적(㎡), 취득가액, 취득일자, 양도가액, 양도일자, 필요경비, 필요경비 상세, 양도소득금액, 신고여부, 작업
- 각 칼럼에 적절한 입력 필드와 버튼 배치
- 칼럼 너비 최적화 (min-width 설정)
- 데이터 바인딩 정확성 향상

#### **수정된 파일:**
1. `trader-detail.html` - 테이블 헤더 및 CSS 최적화
2. `js/trader-detail.js` - 12칼럼 렌더링 로직 완전히 새로 작성

#### **테이블 구조:**
| 순번 | 칼럼명 | 너비 | 타입 | 설명 |
|------|--------|------|------|------|
| 1 | No | 50px | 읽기전용 | 행 번호 (자동) |
| 2 | 소재지 | 200px | 입력 | 물건 주소 |
| 3 | 면적(㎡) | 90px | 입력 | 물건 면적 |
| 4 | 취득가액 | 110px | 읽기전용 | 자동계산 (필요경비 상세에서) |
| 5 | 취득일자 | 110px | 입력 | YYYYMMDD 형식 |
| 6 | 양도가액 | 110px | 입력 | 판매 금액 |
| 7 | 양도일자 | 110px | 입력 | YYYYMMDD 형식 |
| 8 | 필요경비 | 110px | 읽기전용 | 자동계산 (필요경비 상세에서) |
| 9 | 필요경비 상세 | 100px | 버튼 | 상세 입력 모달 열기 |
| 10 | 양도소득금액 | 120px | 읽기전용 | 자동계산 (양도가액 - 취득가액 - 필요경비) |
| 11 | 신고여부 | 100px | 선택 | 미확인/확인/위하고입력/고객안내/신고완료 |
| 12 | 작업 | 180px | 버튼 | 계산/보고서/삭제 버튼 |

---

## 🎯 프로젝트 개요

**아톰세무회계** 웹 시스템은 다음 기능을 제공합니다:

- ✅ **고객사 관리**: 회사 정보, 담당자, 연락처 관리
- ✅ **매매사업자 관리**: 부동산 물건 목록, 재고자산 정리
- ✅ **물건 데이터 관리**: 엑셀 업로드, 수동 입력, 자동 계산
- ✅ **필요경비 상세**: 10개 행 입력, 취득가액/기타필요경비 구분
- ✅ **세금 계산**: 양도소득세, 종합소득세 자동 계산
- ✅ **보고서 생성**: PDF 보고서 자동 생성
- ✅ **체크리스트**: 물건별 진행 상태 추적
- ✅ **부가세 신고**: 부가가치세 계산 및 신고

---

## 📁 프로젝트 구조

```
atomtax-app/
├── index.html              # 메인 랜딩 페이지
├── login.html              # 로그인 페이지
├── dashboard.html          # 대시보드
├── clients.html            # 고객사 목록
├── client-detail.html      # 고객사 상세
├── traders-data.html       # 매매사업자 목록
├── trader-detail.html      # 매매사업자 상세 ⭐ (최신 수정)
├── traders-checklist.html  # 체크리스트
├── traders-vat.html        # 부가세 신고
│
├── css/
│   ├── style.css           # 전역 스타일
│   └── traders-performance.css  # 매매사업자 전용 스타일
│
├── js/
│   ├── supabase-config.js  # Supabase 설정
│   ├── supabase-auth.js    # 인증 관리
│   ├── supabase-db.js      # DB 쿼리
│   ├── common.js           # 공통 유틸리티
│   ├── auto-backup.js      # 자동 백업
│   └── trader-detail.js    # 매매사업자 상세 로직 ⭐ (최신 수정)
│
├── sql/
│   └── supabase-schema.sql # Supabase 테이블 스키마
│
└── images/                 # 이미지 파일
```

---

## 🔑 핵심 기능

### 1. **매매사업자 상세 페이지** (`trader-detail.html`)

#### **물건 목록 테이블 (12칼럼)**
- 물건 정보 입력 및 수정
- 자동 계산: 취득가액, 필요경비, 양도소득금액
- 진행 상태 추적: 미확인 → 확인 → 위하고입력 → 고객안내 → 신고완료

#### **필요경비 상세 입력**
- 10개 행 사전 생성 (엑셀 스타일)
- 비용명 선택: 취득가액, 취득세 등, 신탁말소비용, 중개수수료, 관리비 정산, 기타비용
- 구분: 취득가액 / 기타필요경비
- 예정신고/확정신고 비용인정 여부 (O/X)
- 실시간 합계 계산

#### **자동 계산 기능**
- **취득가액**: 필요경비 상세에서 '취득가액' 구분의 합계
- **필요경비**: 필요경비 상세에서 '기타필요경비' 구분의 합계
- **양도소득금액**: 양도가액 - 취득가액 - 필요경비

### 2. **데이터 저장**
- **로컬 저장소**: `localStorage` 사용 (키: `trader_inventory_{clientId}`)
- **자동 저장**: 입력 즉시 자동 저장
- **Supabase 연동**: 클라이언트 정보는 Supabase에서 관리

### 3. **엑셀 업로드**
- XLSX 파일 업로드
- 자동 파싱 및 데이터 매핑
- 기존 데이터 병합 또는 덮어쓰기

---

## 🌐 배포 및 URL

### **Production (Netlify)**
- **메인 사이트**: https://atomtax-app.netlify.app
- **매매사업자 상세**: https://atomtax-app.netlify.app/trader-detail.html?id={clientId}

### **Supabase Backend**
- **Dashboard**: https://vdjyynwmnypuxvlhrcbk.supabase.co
- **Project ID**: vdjyynwmnypuxvlhrcbk

### **GitHub Repository**
- **Repo**: https://github.com/atomtax/atomtax-app

---

## 🛠️ 기술 스택

### **Frontend**
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome (아이콘)
- Google Fonts (Inter)

### **라이브러리**
- **xlsx.js**: 엑셀 파일 파싱
- **html2canvas**: 스크린샷 생성
- **jsPDF**: PDF 생성

### **Backend**
- **Supabase**: PostgreSQL 데이터베이스, 인증, RLS (Row Level Security)

### **배포**
- **Netlify**: 자동 배포, CDN, HTTPS

---

## 📊 데이터 모델

### **clients 테이블**
- `id` (UUID): 고객사 고유 ID
- `company_name`: 회사명
- `representative`: 대표자명
- `ceo_name`: 대표자명 (별칭)
- `business_code`: 사업자번호
- `contact` / `phone`: 연락처
- `address`: 주소
- `real_estate_drive_folder`: 부동산 자료함 URL
- `created_at`: 생성일시
- `updated_at`: 수정일시

### **inventoryRows (localStorage)**
```javascript
{
  property_name: '물건1',
  address: '서울시 강남구 테헤란로 123',
  area: 50.5,
  acquisition_value: 300000000,  // 자동계산
  acquisition_date: '2024-01-15',
  transfer_value: 400000000,
  transfer_date: '2025-03-20',
  other_expenses: 10000000,       // 자동계산
  transfer_income: 90000000,      // 자동계산
  progress_stage: '확인',
  report_deadline: '2025-05-31',
  prepaid_income_tax: 5000000,
  prepaid_local_tax: 500000,
  over_85: 'N',
  comparative_tax: 'N',
  expenses: [
    {
      no: 1,
      expense_name: '취득가액',
      category: '취득가액',
      amount: 250000000,
      preliminary_approved: 'O',
      income_tax_approved: 'O',
      note: ''
    },
    ...
  ]
}
```

---

## 🔐 인증

### **로그인 정보**
- **기본 계정**: mail@atomtax.co.kr
- **인증 방식**: Supabase Auth (이메일/비밀번호)
- **세션 관리**: JWT 토큰

---

## 📝 사용 방법

### 1. **GitHub에 파일 업로드**

#### **방법 A: 웹에서 직접 업로드**
1. https://github.com/atomtax/atomtax-app 접속
2. **`trader-detail.html`** 수정:
   - 파일 열기 → ✏️ Edit 버튼
   - 전체 선택 (Ctrl+A) → 삭제
   - `GITHUB_UPLOAD/trader-detail.html` 내용 복사 & 붙여넣기
   - **Commit message**: `Fix: 테이블 레이아웃 12칼럼 구조 복원`
   - **Commit changes** 클릭

3. **`js/trader-detail.js`** 수정:
   - `js/` 폴더 → `trader-detail.js` 파일 열기
   - ✏️ Edit 버튼 → 전체 삭제
   - `GITHUB_UPLOAD/js/trader-detail.js` 내용 복사 & 붙여넣기
   - **Commit message**: `Fix: 12칼럼 렌더링 로직 재작성`
   - **Commit changes** 클릭

4. **`README.md`** 수정:
   - 파일 열기 → ✏️ Edit
   - `GITHUB_UPLOAD/README.md` 내용으로 교체
   - **Commit message**: `Docs: 업데이트 로그 추가`
   - **Commit changes** 클릭

#### **방법 B: 로컬 Git 사용**
```bash
cd /path/to/atomtax-app
git add trader-detail.html js/trader-detail.js README.md
git commit -m "Fix: 테이블 12칼럼 구조 복원"
git push origin main
```

### 2. **Netlify 배포 확인**

1. https://app.netlify.com/sites/atomtax-app/deploys 접속
2. 최신 Deploy 상태 확인 (1~2분 대기)
3. **Status: Published** 확인
4. **Live Site** 방문

### 3. **브라우저 테스트**

1. **시크릿 모드**(Incognito)로 테스트 권장
2. https://atomtax-app.netlify.app/trader-detail.html?id={clientId} 접속
3. 확인 사항:
   - ✅ 테이블 헤더 12개 칼럼 정확히 표시
   - ✅ 데이터 입력 시 올바른 칼럼에 표시
   - ✅ 필요경비 상세 버튼 작동
   - ✅ 양도소득금액 자동 계산
   - ✅ 행 추가/삭제 정상 작동

---

## 🐛 문제 해결

### **테이블이 여전히 깨진다면?**

1. **브라우저 캐시 강제 새로고침**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **개발자 도구 확인**
   - `F12` → Console 탭
   - 에러 메시지 확인

3. **localStorage 초기화**
   ```javascript
   // 콘솔에서 실행
   localStorage.clear();
   location.reload();
   ```

4. **Netlify 배포 상태 확인**
   - https://app.netlify.com/sites/atomtax-app/deploys
   - **Deploy log** 에러 확인

---

## 📈 향후 계획

- [ ] 엑셀 업로드 완전 자동화
- [ ] PDF 보고서 템플릿 개선
- [ ] 세금 계산 알고리즘 정밀화
- [ ] 부가세 신고 기능 강화
- [ ] 모바일 반응형 최적화
- [ ] Supabase 백업 자동화

---

## 👥 문의

- **개발자**: Atom Tax Accounting Team
- **Email**: mail@atomtax.co.kr
- **GitHub Issues**: https://github.com/atomtax/atomtax-app/issues

---

## 📄 라이선스

© 2024-2026 Atom Tax Accounting. All Rights Reserved.
