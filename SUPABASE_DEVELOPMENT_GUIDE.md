# Supabase 개발 가이드

## 📋 개요

이 프로젝트는 **Supabase PostgreSQL**을 메인 데이터베이스로 사용합니다.

---

## 🔧 현재 상태

### ✅ 완료된 작업:

1. **Supabase 프로젝트 설정**
   - Project URL: `https://vdjyynwmnypuxvlhrcbk.supabase.co`
   - Region: Northeast Asia (Seoul)
   
2. **데이터베이스 테이블** (5개)
   - `users` - 사용자 정보
   - `clients` - 고객사 정보 (187개 데이터 마이그레이션 완료)
   - `trader_inventory` - 물건 목록
   - `expenses` - 필요경비 상세
   - `documents` - 문서 첨부

3. **인증 시스템**
   - 이메일: `mail@atomtax.co.kr`
   - Supabase Auth 사용

4. **SDK 통합**
   - `js/supabase-config.js` - Supabase 클라이언트 초기화
   - `js/supabase-auth.js` - 인증 모듈
   - `js/supabase-db.js` - DB CRUD 함수들
   - `js/common.js` - API 객체 Supabase 전환 완료 ✅

---

## 🚀 개발 흐름

### **일반적인 개발 과정:**

```
1. 코드 수정 (HTML/CSS/JavaScript)
   ↓
2. 브라우저에서 테스트
   - http://localhost:8080 또는
   - https://kpofwvft.gensparkspace.com/
   ↓
3. Supabase DB에 자동 반영
   - API.createClient() → Supabase INSERT
   - API.updateClient() → Supabase UPDATE
   - API.deleteClient() → Supabase DELETE
   ↓
4. 배포 (Publish 탭)
```

### **데이터는 어디에 저장되나요?**

- ✅ **Supabase PostgreSQL** (메인 DB)
- ❌ ~~GenSpark Tables API~~ (더 이상 사용 안 함)
- ❌ ~~localStorage~~ (제거 예정)

---

## 💻 API 사용법

### **고객 관리 (Clients)**

```javascript
// 1. 전체 고객 조회
const response = await API.getClients({
  page: 1,
  limit: 100,
  search: '검색어',
  sort: 'company_name:asc'
});
console.log(response.data); // 고객 배열
console.log(response.total); // 전체 개수

// 2. 특정 고객 조회
const client = await API.getClient('client-id-uuid');

// 3. 고객 추가
const newClient = await API.createClient({
  number: '001',
  company_name: '테스트 회사',
  business_number: '123-45-67890',
  representative: '홍길동',
  manager: '김철수',
  phone: '02-1234-5678',
  address: '서울시 강남구',
  business_type: '제조업',
  business_item: '부품 제조',
  start_date: '2024-01-01',
  contract_amount: 1000000,
  supply_amount: 909091,
  tax_amount: 90909
});

// 4. 고객 수정
const updated = await API.updateClient('client-id', {
  phone: '02-9999-9999'
});

// 5. 고객 삭제
await API.deleteClient('client-id');
```

---

## 🔍 Supabase Dashboard에서 데이터 확인

### **방법 1: Table Editor**

1. https://supabase.com/dashboard 접속
2. **프로젝트 선택** (atomtax-app)
3. **Table Editor** → **clients** 클릭
4. 데이터 직접 확인/수정 가능

### **방법 2: SQL Editor**

```sql
-- 전체 고객 수
SELECT COUNT(*) FROM clients;

-- 최근 추가된 10개
SELECT * FROM clients 
ORDER BY created_at DESC 
LIMIT 10;

-- 특정 회사 검색
SELECT * FROM clients 
WHERE company_name LIKE '%테스트%';
```

---

## 🛠️ 트러블슈팅

### **문제: "supabaseClient is not defined"**

**원인:** Supabase SDK가 로드되지 않음

**해결:**
1. HTML에 SDK 스크립트 확인:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```
2. `js/supabase-config.js` 로드 확인

---

### **문제: "401 Unauthorized" 오류**

**원인:** Row Level Security (RLS) 정책

**해결:**
```sql
-- Supabase Dashboard → SQL Editor
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE trader_inventory DISABLE ROW LEVEL SECURITY;
```

---

### **문제: 데이터가 보이지 않음**

**체크리스트:**
1. ✅ Supabase Dashboard에서 데이터 확인
2. ✅ Console에 오류 메시지 확인 (F12)
3. ✅ API 함수가 올바른 응답 반환하는지 확인

```javascript
// Console에서 테스트
const test = await API.getClients();
console.log(test);
```

---

## 📊 데이터 마이그레이션

### **GenSpark → Supabase 마이그레이션 완료**

- ✅ 고객 데이터: 187개 이전 완료
- ⏳ 물건 데이터: 필요 시 이전

### **백업 파일 위치:**

- `genspark_backup_2026-02-16.json`
- 187개 고객 데이터 포함

---

## 🔐 환경 변수

### **Supabase 설정 (js/supabase-config.js)**

```javascript
const SUPABASE_URL = 'https://vdjyynwmnypuxvlhrcbk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...'; // Public key (안전)
```

**⚠️ 주의:** `SUPABASE_ANON_KEY`는 public key로 노출되어도 안전합니다.  
RLS 정책으로 보안을 유지합니다.

---

## 🚀 배포

### **배포 방법:**

1. **Publish 탭** 클릭
2. 자동 배포 완료
3. 생성된 URL로 접속

**데이터베이스:**
- ✅ 이미 Supabase에 저장됨
- ✅ 추가 설정 불필요

---

## 📞 도움말

### **참고 링크:**

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)

---

## ✅ TODO

- [x] Supabase 프로젝트 생성
- [x] 데이터베이스 테이블 생성
- [x] 인증 시스템 구축
- [x] 고객 데이터 마이그레이션 (187개)
- [x] API 객체 Supabase 전환
- [ ] trader-detail.js localStorage 제거
- [ ] 전체 기능 테스트
- [ ] 최종 배포

---

**마지막 업데이트:** 2026-02-16
