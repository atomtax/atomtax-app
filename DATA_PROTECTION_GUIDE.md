# 데이터 보호 가이드

## 🔐 보안 설정

### ✅ 완료된 보안 조치:

1. **이중 저장 (Dual Write)**
   - ✅ Supabase + GenSpark 동시 저장
   - ✅ 한쪽 실패해도 데이터 보존
   
2. **RLS (Row Level Security)**
   - ✅ 인증된 사용자만 접근 가능
   - ✅ 비로그인 시 데이터 접근 불가

3. **자동 백업 시스템**
   - ✅ `js/auto-backup.js` 추가
   - ✅ Console에서 `autoBackup()` 실행 가능
   - ✅ 7일마다 백업 알림

---

## 📦 정기 백업 루틴

### **주간 백업 (권장):**

**매주 금요일:**

1. 사이트 로그인
2. F12 → Console
3. 실행:
   ```javascript
   autoBackup()
   ```
4. JSON 파일 다운로드
5. 안전한 곳에 보관 (Google Drive, 외장하드 등)

---

### **월간 백업 (필수):**

**매월 1일:**

1. Supabase Dashboard → Database → Backups
2. "Create backup" 클릭
3. 백업 완료 확인

**또는:**

1. Console에서:
   ```javascript
   autoBackup()
   ```
2. 파일명을 `backup_monthly_2026-02.json`로 변경

---

## 🚨 긴급 복구 방법

### **시나리오 1: Supabase 데이터 손실**

1. GenSpark가 정상이면 → GenSpark에서 조회 (자동 Fallback)
2. 백업 파일 사용:
   ```javascript
   // Console에서 실행
   const backup = /* 백업 파일 내용 붙여넣기 */;
   
   for (const client of backup.clients) {
       await supabaseClient.from('clients').insert([client]);
   }
   ```

---

### **시나리오 2: GenSpark 데이터 손실**

1. Supabase에서 데이터 Export
2. GenSpark API로 재업로드

---

### **시나리오 3: 양쪽 모두 손실**

1. 최근 백업 파일 찾기 (`backup_YYYY-MM-DD.json`)
2. Supabase로 복원:
   ```javascript
   const backup = /* 백업 파일 */;
   
   for (const client of backup.clients) {
       await API.createClient(client);
   }
   ```

---

## 📊 백업 파일 관리

### **파일명 규칙:**

```
backup_2026-02-16.json          (자동 백업)
backup_monthly_2026-02.json     (월간 백업)
backup_before_migration.json    (마이그레이션 전)
backup_emergency_2026-02-16.json (긴급 백업)
```

### **보관 위치:**

1. **로컬 컴퓨터** (즉시 접근)
2. **Google Drive** (클라우드 백업)
3. **외장 하드** (오프라인 백업)

**최소 3곳에 보관 (3-2-1 백업 원칙)**

---

## 🔍 데이터 무결성 확인

### **Console에서 실행:**

```javascript
async function verifyDataIntegrity() {
    console.log('🔍 데이터 무결성 검사 시작...');
    
    // Supabase 데이터
    const { data: supabaseClients } = await supabaseClient
        .from('clients')
        .select('id, company_name');
    
    // GenSpark 데이터
    const gensparkRes = await fetch('tables/clients?limit=1000');
    const gensparkData = await gensparkRes.json();
    
    console.log('📊 Supabase:', supabaseClients.length, '개');
    console.log('📊 GenSpark:', gensparkData.data.length, '개');
    
    if (supabaseClients.length === gensparkData.data.length) {
        console.log('✅ 데이터 개수 일치!');
    } else {
        console.log('⚠️ 데이터 개수 불일치!');
        console.log('차이:', Math.abs(supabaseClients.length - gensparkData.data.length), '개');
    }
}

verifyDataIntegrity();
```

---

## ⚡ 빠른 참조

### **백업 명령어:**

```javascript
// 즉시 백업
autoBackup()

// 백업 상태 확인
getBackupStatus()

// 데이터 무결성 검사
verifyDataIntegrity()
```

### **복구 명령어:**

```javascript
// Supabase에서 데이터 가져오기
const { data } = await supabaseClient.from('clients').select('*');

// GenSpark에서 데이터 가져오기
const res = await fetch('tables/clients?limit=1000');
const data = await res.json();
```

---

## 📞 긴급 연락처

**데이터 손실 발생 시:**

1. 즉시 작업 중단
2. 최근 백업 파일 확인
3. Console에서 데이터 확인
4. 복구 절차 실행

---

**마지막 업데이트:** 2026-02-16
