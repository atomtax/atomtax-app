```markdown
# 🚀 Firebase → Supabase 마이그레이션 가이드

**프로젝트**: 아톰세무회계 내부 데이터 관리 시스템  
**작업일**: 2026-02-11  
**버전**: 1.0

---

## 📋 목차

1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [데이터베이스 스키마 설정](#2-데이터베이스-스키마-설정)
3. [Firebase 데이터 내보내기](#3-firebase-데이터-내보내기)
4. [Supabase로 데이터 가져오기](#4-supabase로-데이터-가져오기)
5. [프로젝트 설정 업데이트](#5-프로젝트-설정-업데이트)
6. [HTML 파일 수정](#6-html-파일-수정)
7. [테스트](#7-테스트)
8. [배포](#8-배포)

---

## 1. Supabase 프로젝트 생성

### Step 1.1: Supabase 계정 생성
1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인

### Step 1.2: 새 프로젝트 생성
1. "New Project" 클릭
2. 프로젝트 정보 입력:
   - **Organization**: 새로 생성 또는 기존 선택
   - **Name**: `atomtax-management`
   - **Database Password**: 강력한 비밀번호 (저장 필수!)
   - **Region**: `Northeast Asia (Seoul)` (가장 가까운 지역)
   - **Pricing Plan**: `Free` (시작용)
3. "Create new project" 클릭
4. 프로젝트 생성 완료 (1-2분 소요)

### Step 1.3: API 키 확인
1. 왼쪽 메뉴: **Settings** > **API**
2. 다음 정보 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (공개 키)
   - **service_role key**: `eyJhbGc...` (비공개, 서버 전용)

---

## 2. 데이터베이스 스키마 설정

### Step 2.1: SQL Editor 열기
1. 왼쪽 메뉴: **SQL Editor**
2. "New query" 클릭

### Step 2.2: 스키마 실행
1. `supabase-schema.sql` 파일 내용 복사
2. SQL Editor에 붙여넣기
3. **Run** 버튼 클릭 (Ctrl/Cmd + Enter)
4. 성공 메시지 확인: `Success. No rows returned`

### Step 2.3: 테이블 확인
1. 왼쪽 메뉴: **Table Editor**
2. 생성된 테이블 확인:
   - ✅ `clients` (고객사)
   - ✅ `trader_inventory` (물건목록)
   - ✅ `expenses` (필요경비)
   - ✅ `client_summary` (View)
   - ✅ `inventory_expense_summary` (View)

---

## 3. Firebase 데이터 내보내기

### Step 3.1: Firestore 데이터 내보내기

**방법 1: Firebase Console에서 직접 내보내기**
1. Firebase Console 접속
2. **Firestore Database** 선택
3. 각 컬렉션별로:
   - `clients` 컬렉션 선택
   - 오른쪽 상단 "Export" 클릭 (또는 데이터 수동 복사)

**방법 2: Firebase Admin SDK 사용** (권장)

```javascript
// firebase-export.js
const admin = require('firebase-admin');
const fs = require('fs');

// Firebase Admin 초기화
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 데이터 내보내기 함수
async function exportCollection(collectionName) {
    const snapshot = await db.collection(collectionName).get();
    const data = [];
    
    snapshot.forEach(doc => {
        data.push({
            id: doc.id,
            ...doc.data()
        });
    });
    
    fs.writeFileSync(
        `${collectionName}.json`,
        JSON.stringify(data, null, 2)
    );
    
    console.log(`✅ ${collectionName} exported: ${data.length} documents`);
}

// 실행
(async () => {
    await exportCollection('clients');
    await exportCollection('users');
    console.log('✅ Export completed!');
})();
```

### Step 3.2: 실행
```bash
node firebase-export.js
```

**결과 파일**:
- `clients.json`
- `users.json`

---

## 4. Supabase로 데이터 가져오기

### Step 4.1: JSON 데이터 변환

**Firebase 형식**:
```json
{
  "id": "abc123",
  "number": "1",
  "company_name": "테스트회사",
  "is_terminated": false
}
```

**Supabase 형식** (id는 UUID로 자동 생성):
```json
{
  "number": "1",
  "company_name": "테스트회사",
  "is_terminated": false
}
```

### Step 4.2: Supabase에 데이터 삽입

**방법 1: SQL Editor 사용**
```sql
INSERT INTO clients (number, company_name, manager, business_number, ceo_name)
VALUES
  ('1', '테스트회사', '김철수', '123-45-67890', '홍길동'),
  ('2', '샘플기업', '이영희', '234-56-78901', '김영수');
```

**방법 2: JavaScript로 일괄 업로드**
```javascript
// supabase-import.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_SERVICE_ROLE_KEY' // 서버 전용 키
);

async function importClients() {
    const clientsData = JSON.parse(fs.readFileSync('clients.json'));
    
    // id 필드 제거 (Supabase가 자동 생성)
    const cleanedData = clientsData.map(({ id, ...rest }) => rest);
    
    const { data, error } = await supabase
        .from('clients')
        .insert(cleanedData);
    
    if (error) {
        console.error('❌ Import failed:', error);
    } else {
        console.log(`✅ Imported ${cleanedData.length} clients`);
    }
}

importClients();
```

---

## 5. 프로젝트 설정 업데이트

### Step 5.1: Supabase 설정 파일 업데이트

`js/supabase-config.js` 파일 수정:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://xxxxx.supabase.co', // 실제 프로젝트 URL
    anonKey: 'eyJhbGc...' // 실제 anon key
};
```

### Step 5.2: 사용자 계정 생성

Supabase Auth에 사용자 추가:

**방법 1: Supabase Dashboard**
1. 왼쪽 메뉴: **Authentication** > **Users**
2. "Add user" 클릭
3. 이메일/비밀번호 입력
4. "Create user" 클릭

**방법 2: SQL로 추가**
```sql
-- Supabase Auth는 자동으로 관리하므로, 
-- 애플리케이션에서 회원가입 기능 사용 권장
```

---

## 6. HTML 파일 수정

### Step 6.1: Firebase 스크립트 제거

**모든 HTML 파일**에서 다음 줄 제거:

```html
<!-- 제거할 줄들 -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="js/firebase-config.js"></script>
<script src="js/firebase-auth.js"></script>
<script src="js/firebase-db.js"></script>
```

### Step 6.2: Supabase 스크립트 추가

**모든 HTML 파일**에 다음 줄 추가:

```html
<!-- Supabase JS SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
    // Supabase 전역 함수 선언 (CDN에서 로드)
    const { createClient } = supabase;
</script>

<!-- Supabase Configuration -->
<script src="js/supabase-config.js"></script>
<script src="js/supabase-auth.js"></script>
<script src="js/supabase-db.js"></script>
```

### Step 6.3: 수정 대상 파일 목록

```
✅ index.html (로그인)
✅ dashboard.html
✅ clients.html
✅ clients-terminated.html
✅ client-detail.html
✅ traders-data.html
✅ traders-checklist.html
✅ trader-detail.html
✅ traders-vat.html
✅ vat-calculator-standalone.html
```

---

## 7. 테스트

### Step 7.1: 로그인 테스트
1. `index.html` 열기
2. 이메일/비밀번호 입력
3. 로그인 성공 확인

### Step 7.2: 고객사 관리 테스트
1. 고객사 목록 확인
2. 고객사 추가
3. 고객사 수정
4. 고객사 삭제

### Step 7.3: 매매사업자 테스트
1. 매매사업자 목록 확인
2. 물건목록 추가
3. 필요경비 입력
4. 보고서 생성

### Step 7.4: 브라우저 콘솔 확인
```
✅ Supabase initialized successfully
✅ Supabase auth loaded
✅ Supabase DB API loaded
✅ 사용자 로그인: mail@atomtax.co.kr
```

---

## 8. 배포

### Step 8.1: Firebase Hosting 제거 (선택)

Firebase Hosting을 더 이상 사용하지 않는 경우:

```bash
# firebase.json 삭제 또는 수정
```

### Step 8.2: 다른 호스팅 서비스 사용

**추천 호스팅**:
- **Vercel** (무료, 추천)
- **Netlify** (무료)
- **GitHub Pages** (무료)

**Vercel 배포 예시**:
```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel
```

---

## 9. LocalStorage 마이그레이션 (선택)

현재 물건목록 데이터는 LocalStorage에 저장되어 있습니다.  
이를 Supabase로 이전하려면:

### Step 9.1: LocalStorage 데이터 추출

```javascript
// 브라우저 콘솔에서 실행
const allData = {};
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('trader_inventory_')) {
        allData[key] = JSON.parse(localStorage.getItem(key));
    }
}
console.log(JSON.stringify(allData, null, 2));
```

### Step 9.2: Supabase에 저장

```javascript
// trader-detail.js 수정
async function saveInventoryToSupabase() {
    const result = await SupabaseAPI.saveInventoryBatch(clientId, inventoryRows);
    if (result.success) {
        console.log('✅ Supabase에 저장 완료');
        // LocalStorage 삭제
        localStorage.removeItem(`trader_inventory_${clientId}`);
    }
}
```

---

## 10. 롤백 계획 (만약 문제 발생 시)

### Step 10.1: Firebase 백업 유지
- Firebase 프로젝트 삭제하지 말 것
- 데이터 백업 파일 보관

### Step 10.2: 빠른 롤백
1. Supabase 스크립트 제거
2. Firebase 스크립트 복원
3. `firebase-*.js` 파일 복원

---

## 11. 체크리스트

### 마이그레이션 전
- [ ] Firebase 데이터 백업 완료
- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 스키마 설정
- [ ] API 키 확인 및 저장

### 마이그레이션 중
- [ ] Firebase 데이터 내보내기
- [ ] Supabase로 데이터 가져오기
- [ ] 설정 파일 업데이트
- [ ] HTML 파일 스크립트 교체
- [ ] 사용자 계정 생성

### 마이그레이션 후
- [ ] 로그인 테스트
- [ ] 고객사 CRUD 테스트
- [ ] 물건목록 CRUD 테스트
- [ ] 보고서 생성 테스트
- [ ] 브라우저 콘솔 오류 확인
- [ ] 프로덕션 배포

---

## 12. 문제 해결

### Q1. "Supabase library not loaded" 오류
**해결**: HTML에서 Supabase CDN 스크립트가 올바르게 로드되었는지 확인

### Q2. "Invalid API key" 오류
**해결**: `supabase-config.js`에서 API 키가 정확한지 확인

### Q3. "Row Level Security" 오류
**해결**: Supabase Dashboard에서 RLS 정책 확인

### Q4. 로그인 실패
**해결**: Supabase Auth에 사용자가 생성되었는지 확인

---

## 13. 참고 자료

- **Supabase 공식 문서**: https://supabase.com/docs
- **Supabase JS Reference**: https://supabase.com/docs/reference/javascript
- **마이그레이션 가이드**: https://supabase.com/docs/guides/migrations

---

## 🎉 완료!

Firebase에서 Supabase로 성공적으로 마이그레이션되었습니다!

**다음 단계**:
1. 프로덕션 배포
2. 사용자 교육
3. 모니터링 설정

**질문이 있으시면 Supabase 커뮤니티나 문서를 참고하세요!** 💪
```
