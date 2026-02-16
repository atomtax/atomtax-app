# 🚀 Firebase → Supabase 마이그레이션 가이드

## 📋 목차
1. [개요](#개요)
2. [준비 단계](#준비-단계)
3. [Supabase 프로젝트 생성](#supabase-프로젝트-생성)
4. [데이터베이스 스키마 적용](#데이터베이스-스키마-적용)
5. [Firebase 데이터 백업](#firebase-데이터-백업)
6. [데이터 마이그레이션](#데이터-마이그레이션)
7. [코드 교체](#코드-교체)
8. [테스트](#테스트)
9. [배포](#배포)
10. [롤백 계획](#롤백-계획)

---

## 개요

### 왜 Supabase로 전환하나요?

| 항목 | Firebase | Supabase | 비고 |
|------|----------|----------|------|
| **비용** | Spark (무료) 제한적 | Free 500MB, 무제한 API | 더 관대한 무료 플랜 |
| **데이터베이스** | NoSQL (Firestore) | PostgreSQL (SQL) | 강력한 관계형 DB |
| **쿼리** | 제한적 (JOIN 불가) | 완전한 SQL 지원 | 복잡한 쿼리 가능 |
| **실시간** | 지원 | 지원 (Realtime) | 양쪽 모두 지원 |
| **오픈소스** | ❌ | ✅ | 자체 호스팅 가능 |
| **인증** | 지원 | 지원 | 양쪽 모두 지원 |
| **스토리지** | 1GB 제한 | 1GB + 더 관대 | Supabase가 유리 |

---

## 준비 단계

### 1. 필요한 파일 확인 ✅

다음 파일들이 이미 생성되어 있습니다:

```
sql/
  └── supabase-schema.sql          # 데이터베이스 스키마

js/
  ├── supabase-config.js           # Supabase 설정
  ├── supabase-auth.js             # 인증 모듈
  └── supabase-db.js               # 데이터베이스 API
```

### 2. 현재 Firebase 구조

**Collections:**
- `users` - 사용자 정보
- `clients` - 고객사 정보
- `trader_inventory` - 매매사업자 물건 목록 (일부는 localStorage)

**LocalStorage:**
- `trader_inventory_{clientId}` - 클라이언트별 물건 목록

---

## Supabase 프로젝트 생성

### Step 1: Supabase 계정 생성

1. https://supabase.com 접속
2. **Start your project** 클릭
3. GitHub 계정으로 로그인 (추천) 또는 이메일로 가입

### Step 2: 새 프로젝트 생성

1. **New Project** 클릭
2. 다음 정보 입력:
   ```
   Project Name: atomtax-app
   Database Password: [강력한 비밀번호 입력 - 반드시 저장!]
   Region: Northeast Asia (Seoul) - ap-northeast-2
   Pricing Plan: Free
   ```
3. **Create new project** 클릭
4. 프로젝트 생성 완료까지 약 2분 대기

### Step 3: API Keys 확인

프로젝트가 생성되면:

1. 좌측 메뉴에서 **Settings** → **API** 클릭
2. 다음 정보를 복사하여 안전한 곳에 저장:
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 데이터베이스 스키마 적용

### Step 1: SQL Editor 열기

1. Supabase 대시보드에서 **SQL Editor** 클릭 (좌측 메뉴)
2. **New query** 클릭

### Step 2: 스키마 실행

1. `sql/supabase-schema.sql` 파일 내용 전체 복사
2. SQL Editor에 붙여넣기
3. 우측 하단 **Run** 버튼 클릭
4. 성공 메시지 확인: `Success. No rows returned`

### Step 3: 테이블 확인

1. 좌측 메뉴에서 **Table Editor** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ users
   - ✅ clients
   - ✅ trader_inventory
   - ✅ expenses
   - ✅ documents

---

## Firebase 데이터 백업

### 방법 1: 웹 콘솔에서 백업 (권장)

현재 프로젝트에서 백업 기능을 이용:

1. 로그인 후 아무 페이지나 열기 (예: `clients.html`)
2. 개발자 도구 열기 (F12)
3. Console 탭에서 다음 명령 실행:
   ```javascript
   // Firebase 데이터 백업 (JSON 파일 다운로드)
   await backupAllData();
   ```
4. `firebase_backup_YYYY-MM-DD.json` 파일이 다운로드됨
5. 이 파일을 안전한 곳에 보관

### 방법 2: Firebase Console에서 Export

1. Firebase Console (https://console.firebase.google.com) 접속
2. 프로젝트 선택: `atomtax-cffe3`
3. **Firestore Database** 메뉴 클릭
4. 상단 **Import/Export** 클릭
5. **Export** 선택
6. Cloud Storage bucket 선택 후 Export 실행

---

## 데이터 마이그레이션

### LocalStorage 데이터를 Supabase로 이전

1. **js/supabase-config.js** 파일 열기
2. API Keys 업데이트:
   ```javascript
   const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co'; // 실제 URL로 교체
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 실제 Key로 교체
   ```

3. HTML 파일에서 Supabase SDK 로드 (아래 [코드 교체](#코드-교체) 섹션 참고)

4. 로그인 후 개발자 도구에서 실행:
   ```javascript
   // 특정 클라이언트의 데이터 마이그레이션
   const clientId = 'd17d502f-0e2c-4bcb-8b6f-79109c24f9bb'; // 실제 ID로 교체
   const result = await SupabaseDB.migrateFromLocalStorage(clientId);
   console.log(result);
   // ✅ { success: true, count: 5, message: '5개 물건이 마이그레이션되었습니다.' }
   ```

5. 모든 클라이언트에 대해 반복

### Firebase → Supabase 데이터 복사

Firebase에서 백업한 JSON 파일을 Supabase에 Insert:

```javascript
// 백업 파일 읽기
const backup = /* JSON 파일 내용 */;

// Clients 데이터 삽입
for (const client of backup.clients) {
    await SupabaseDB.addClient({
        id: client.id,  // Firebase UID 유지
        number: client.number,
        company_name: client.company_name,
        business_number: client.business_number,
        representative: client.representative,
        manager: client.manager,
        phone: client.phone,
        address: client.address,
        business_type: client.business_type,
        business_item: client.business_item,
        start_date: client.start_date,
        end_date: client.end_date,
        contract_amount: client.contract_amount,
        supply_amount: client.supply_amount,
        tax_amount: client.tax_amount,
        is_terminated: client.is_terminated || false,
        termination_date: client.termination_date,
        notes: client.notes
    });
}

console.log('✅ Clients migration completed');
```

---

## 코드 교체

### Step 1: HTML 파일 SDK 교체

모든 HTML 파일에서 Firebase SDK를 Supabase SDK로 교체합니다.

**교체 전 (Firebase):**
```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js"></script>

<!-- Firebase modules -->
<script src="js/firebase-config.js"></script>
<script src="js/firebase-auth.js"></script>
<script src="js/firebase-db.js"></script>
```

**교체 후 (Supabase):**
```html
<!-- Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Supabase modules -->
<script src="js/supabase-config.js"></script>
<script src="js/supabase-auth.js"></script>
<script src="js/supabase-db.js"></script>
```

### Step 2: JavaScript 코드 수정

**인증 코드 변경:**

| Firebase | Supabase |
|----------|----------|
| `auth.signInWithEmailAndPassword(email, password)` | `SupabaseAuth.signInWithEmail(email, password)` |
| `auth.createUserWithEmailAndPassword(email, password)` | `SupabaseAuth.signUpWithEmail(email, password)` |
| `auth.signOut()` | `SupabaseAuth.signOut()` |
| `auth.onAuthStateChanged(callback)` | `SupabaseAuth.onAuthStateChanged(callback)` |

**데이터베이스 코드 변경:**

| Firebase | Supabase |
|----------|----------|
| `db.collection('clients').get()` | `SupabaseDB.getClients()` |
| `db.collection('clients').doc(id).get()` | `SupabaseDB.getClient(id)` |
| `db.collection('clients').add(data)` | `SupabaseDB.addClient(data)` |
| `db.collection('clients').doc(id).update(data)` | `SupabaseDB.updateClient(id, data)` |
| `db.collection('clients').doc(id).delete()` | `SupabaseDB.deleteClient(id)` |

### Step 3: API 객체 교체

**clients.html / traders-data.html 등:**

```javascript
// 기존 API 객체 (Firebase 기반)
const API = {
    getClients: async () => {
        // Firebase 코드...
    }
};

// 새로운 API 객체 (Supabase 기반)
const API = {
    getClients: async () => {
        return await SupabaseDB.getClients();
    },
    getClient: async (id) => {
        return await SupabaseDB.getClient(id);
    },
    addClient: async (data) => {
        return await SupabaseDB.addClient(data);
    },
    updateClient: async (id, data) => {
        return await SupabaseDB.updateClient(id, data);
    },
    deleteClient: async (id) => {
        return await SupabaseDB.deleteClient(id);
    }
};
```

---

## 테스트

### 테스트 체크리스트

#### 1. 인증 테스트
- [ ] 로그인 (mail@atomtax.co.kr)
- [ ] 세션 유지 (페이지 새로고침)
- [ ] 로그아웃

#### 2. 고객사 관리 테스트
- [ ] 고객사 목록 조회
- [ ] 고객사 추가
- [ ] 고객사 수정
- [ ] 고객사 삭제
- [ ] 번호 중복 체크

#### 3. 매매사업자 관리 테스트
- [ ] 물건 목록 조회
- [ ] 물건 추가 (단일)
- [ ] 물건 추가 (엑셀 업로드)
- [ ] 물건 수정
- [ ] 물건 삭제

#### 4. 필요경비 관리 테스트
- [ ] 필요경비 목록 조회
- [ ] 필요경비 추가
- [ ] 필요경비 수정
- [ ] 필요경비 삭제

#### 5. 성능 테스트
- [ ] 페이지 로딩 속도 (< 2초)
- [ ] API 응답 속도 (< 500ms)
- [ ] 대량 데이터 처리 (100+ 항목)

---

## 배포

### Step 1: 코드 변경사항 커밋

```bash
git add .
git commit -m "feat: Firebase to Supabase migration"
git push origin main
```

### Step 2: 환경변수 설정 (Publish 탭)

Publish 탭에서 다음 환경변수 추가:

```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: 배포 후 검증

1. Production URL 접속
2. 모든 기능 테스트
3. Console에서 에러 없는지 확인

---

## 롤백 계획

문제 발생 시 Firebase로 즉시 복귀:

### 1. HTML 파일 SDK 복원
```html
<!-- Supabase 제거 -->
<!-- <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> -->

<!-- Firebase 복원 -->
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js"></script>
```

### 2. JavaScript 모듈 복원
```html
<!-- Supabase 제거 -->
<!-- <script src="js/supabase-config.js"></script> -->
<!-- <script src="js/supabase-auth.js"></script> -->
<!-- <script src="js/supabase-db.js"></script> -->

<!-- Firebase 복원 -->
<script src="js/firebase-config.js"></script>
<script src="js/firebase-auth.js"></script>
<script src="js/firebase-db.js"></script>
```

### 3. Git 롤백
```bash
git revert HEAD
git push origin main
```

---

## 마이그레이션 후 장점

### 1. 비용 절감
- Firebase Spark 플랜의 제한된 읽기/쓰기에서 해방
- Supabase Free 플랜: 500MB DB, 무제한 API 호출

### 2. 강력한 쿼리
```sql
-- 복잡한 JOIN 쿼리 가능
SELECT 
    c.company_name,
    COUNT(ti.id) as property_count,
    SUM(ti.transfer_value) as total_value
FROM clients c
LEFT JOIN trader_inventory ti ON c.id = ti.client_id
WHERE c.is_terminated = false
GROUP BY c.id
ORDER BY total_value DESC;
```

### 3. 실시간 기능
```javascript
// Supabase Realtime으로 변경사항 즉시 반영
SupabaseDB.listenToInventoryChanges(clientId, (payload) => {
    console.log('실시간 변경:', payload);
    // UI 자동 업데이트
});
```

### 4. 데이터 무결성
- Foreign Key 제약조건
- Unique 제약조건
- Trigger 자동 실행

---

## 문제 해결

### Q1: "Invalid API key" 에러
**A:** `js/supabase-config.js`에서 API key를 올바르게 입력했는지 확인

### Q2: "Row Level Security" 에러
**A:** SQL 스키마가 올바르게 실행되었는지 확인. RLS 정책이 자동으로 생성됩니다.

### Q3: 데이터가 보이지 않음
**A:** 데이터 마이그레이션이 완료되었는지 확인. Table Editor에서 데이터 확인.

### Q4: 로그인 안됨
**A:** Supabase Auth에서 사용자를 수동으로 생성해야 할 수 있습니다:
   1. Supabase Dashboard → Authentication → Users
   2. Add user manually: mail@atomtax.co.kr

---

## 지원

문제가 발생하면:
1. 개발자 도구 Console에서 에러 메시지 확인
2. Supabase Dashboard → Logs에서 서버 로그 확인
3. 이 문서의 "문제 해결" 섹션 참고

---

**마이그레이션을 시작하시겠습니까?**

다음 단계:
1. ✅ Supabase 프로젝트 생성
2. ✅ 스키마 실행
3. ✅ Firebase 데이터 백업
4. 🔄 데이터 마이그레이션
5. 🔄 코드 교체
6. 🔄 테스트
7. 🚀 배포
