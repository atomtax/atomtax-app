# 이중 저장 → Supabase 단독 전환 가이드

## 📋 개요

현재 **이중 저장 (Supabase + GenSpark)**을 사용 중입니다.  
충분히 검증한 후 **Supabase만 사용**하도록 전환할 수 있습니다.

---

## ✅ 전환 준비 체크리스트

### **1. 데이터 일관성 확인**

```javascript
// Console에서 실행
async function verifyDataConsistency() {
  // Supabase 데이터
  const supabaseData = await supabaseClient.from('clients').select('*');
  
  // GenSpark 데이터
  const gensparkRes = await fetch('tables/clients?limit=1000');
  const gensparkData = await gensparkRes.json();
  
  console.log('Supabase 개수:', supabaseData.data.length);
  console.log('GenSpark 개수:', gensparkData.data.length);
  
  if (supabaseData.data.length === gensparkData.data.length) {
    console.log('✅ 데이터 개수 일치');
  } else {
    console.log('❌ 데이터 개수 불일치!');
  }
}

verifyDataConsistency();
```

### **2. 충분한 테스트 기간**

- [ ] 1주일 이상 이중 저장 사용
- [ ] CRUD 모든 기능 테스트 완료
- [ ] Console 로그에 오류 없음
- [ ] 사용자 피드백 정상

### **3. 백업 완료**

- [ ] GenSpark 최종 백업 완료
- [ ] Supabase 스냅샷 생성

---

## 🔧 전환 방법

### **js/common.js 수정**

**현재 (이중 저장):**
```javascript
// Create client (Dual Write)
async createClient(clientData) {
  // Supabase에 저장
  // GenSpark에도 저장
}
```

**변경 후 (Supabase 단독):**
```javascript
// Create client (Supabase Only)
async createClient(clientData) {
  try {
    const { data, error } = await supabaseClient
      .from('clients')
      .insert([clientData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Create client error:', error);
    throw error;
  }
}
```

---

## 📝 전환 단계

### **1단계: 백업**

```bash
# GenSpark 최종 백업
await exportGenSparkData();
```

### **2단계: js/common.js에서 GenSpark 코드 제거**

- `_getClientsFromGenSpark()` 제거
- `createClient()` GenSpark 부분 제거
- `updateClient()` GenSpark 부분 제거
- `deleteClient()` GenSpark 부분 제거

### **3단계: 테스트**

- [ ] 고객 조회
- [ ] 고객 추가
- [ ] 고객 수정
- [ ] 고객 삭제

### **4단계: 배포**

---

## 🔄 **롤백 방법**

문제 발생 시 이중 저장으로 복귀:

1. `js/common.js`를 현재 버전으로 복원
2. GenSpark 백업에서 데이터 복원
3. 데이터 일관성 확인

---

## 📊 **예상 이점**

| 항목 | 개선 |
|------|------|
| 성능 | 저장 속도 2배 향상 |
| 비용 | API 호출 절반으로 감소 |
| 복잡도 | 코드 간소화 |
| 유지보수 | 단일 DB 관리 |

---

**권장 전환 시기:** 2-4주 후
