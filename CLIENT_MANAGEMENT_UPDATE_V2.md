# 📋 고객사 관리 개선 사항 v2

**수정 완료일**: 2026-02-11  
**버전**: 2.0

---

## 🔧 수정 내용

### **1️⃣ 모달 자동 닫힘 방지**

#### **문제점**:
- 고객사 수정/추가 팝업에서 모달 배경을 클릭하면 팝업이 닫힘
- 입력 중 실수로 배경 클릭 시 데이터 손실

#### **해결 방법**:
```javascript
// ⚠️ 이전: 모달 배경 클릭 시 자동으로 닫힘
document.getElementById('clientModal').addEventListener('click', (e) => {
    if (e.target.id === 'clientModal') closeModal();
});

// ✅ 수정 후: 모달 배경 클릭 시 닫히지 않음 (주석 처리)
// document.getElementById('clientModal').addEventListener('click', (e) => {
//     if (e.target.id === 'clientModal') closeModal();
// });
```

**결과**:
- ✅ 모달은 **"취소" 또는 "저장" 버튼**을 클릭할 때만 닫힘
- ✅ **X 버튼** 클릭 시에도 닫힘
- ❌ 배경 클릭으로는 닫히지 않음

---

### **2️⃣ 번호 중복 체크 기능 추가**

#### **문제점**:
- 같은 번호를 가진 고객사가 여러 개 생성됨
- 번호 관리가 어려워짐

#### **해결 방법**:

##### **1. 중복 체크 함수 추가**

```javascript
// 🔹 번호 중복 체크 함수 (해임고객 제외)
async function checkDuplicateNumber(number, currentClientId = null) {
    try {
        // 모든 고객사 데이터 가져오기
        const response = await API.getClients();
        const allClients = response.data || [];
        
        // 해임고객이 아닌 고객들 중에서 중복 체크
        const activeClients = allClients.filter(client => {
            const isTerminated = client.is_terminated === true || client.is_terminated === 'true';
            return !isTerminated; // 해임고객 제외
        });
        
        // 같은 번호를 가진 다른 고객이 있는지 확인
        const duplicate = activeClients.find(client => {
            // 현재 수정 중인 고객은 제외
            if (currentClientId && client.id === currentClientId) {
                return false;
            }
            return client.number === number;
        });
        
        return !!duplicate; // 중복이면 true, 아니면 false
    } catch (error) {
        console.error('Error checking duplicate number:', error);
        return false; // 오류 발생 시 저장 허용 (false 반환)
    }
}
```

##### **2. 저장 전 중복 체크 수행**

```javascript
async function saveClient(event) {
    event.preventDefault();
    
    // ... 번호 입력 받기 ...
    
    // 🔹 번호 중복 체크 (신규 등록 또는 번호가 변경된 경우)
    const currentClientId = isEditing ? document.getElementById('clientId').value : null;
    const isDuplicate = await checkDuplicateNumber(clientNumber, currentClientId);
    
    if (isDuplicate) {
        alert(`⚠️ 번호 "${clientNumber}"은(는) 이미 사용 중입니다.\n다른 번호를 입력해주세요.`);
        document.getElementById('number').focus();
        return; // 저장 중단
    }
    
    // ... 저장 로직 계속 ...
}
```

---

### **3️⃣ 해임고객 번호 처리**

#### **규칙**:

1. ✅ **기장고객 (is_terminated = false)**:
   - 번호 중복 불가
   - 번호가 비어있으면 자동 할당

2. ✅ **해임고객 (is_terminated = true)**:
   - 번호 중복 허용 (중복 체크에서 제외)
   - 번호가 비어있어도 됨

#### **구현**:

```javascript
// 해임고객이 아닌 고객들 중에서 중복 체크
const activeClients = allClients.filter(client => {
    const isTerminated = client.is_terminated === true || client.is_terminated === 'true';
    return !isTerminated; // 해임고객 제외
});
```

---

## 📊 동작 흐름

### **시나리오 1: 신규 고객사 추가**

```
1. "고객사 추가" 버튼 클릭
   ↓
2. 모달 팝업 열림
   ↓
3. 고객 정보 입력
   - 번호: 5
   - 거래처명: 테스트회사
   - ...
   ↓
4. "저장" 버튼 클릭
   ↓
5. 번호 중복 체크 수행
   - checkDuplicateNumber("5", null)
   - 기장고객 중 번호 "5"가 있는지 확인
   ↓
6-A. 중복이면:
   ⚠️ 알림: "번호 5는 이미 사용 중입니다."
   → 저장 중단
   → 번호 입력 칸으로 포커스 이동

6-B. 중복이 아니면:
   ✅ 고객사 생성
   → 모달 닫기
   → 목록 새로고침
```

---

### **시나리오 2: 기존 고객사 수정**

```
1. 고객사 행의 "수정" 버튼 클릭
   ↓
2. 모달 팝업 열림 (기존 데이터 표시)
   - 현재 번호: 10
   ↓
3. 번호를 5로 변경
   ↓
4. "저장" 버튼 클릭
   ↓
5. 번호 중복 체크 수행
   - checkDuplicateNumber("5", "client-id-123")
   - 자기 자신(client-id-123)은 제외하고 확인
   ↓
6-A. 다른 고객이 번호 5를 사용 중이면:
   ⚠️ 알림: "번호 5는 이미 사용 중입니다."
   → 저장 중단

6-B. 중복이 아니면:
   ✅ 고객사 정보 업데이트
   → 모달 닫기
   → 목록 새로고침
```

---

### **시나리오 3: 해임고객 처리**

```
1. 고객사 수정 팝업
   ↓
2. "해임 여부" 체크박스 체크
   ↓
3. "저장" 버튼 클릭
   ↓
4. is_terminated = true로 저장
   ↓
5. 해임고객 페이지로 이동
   ↓
6. 해당 고객의 번호는 다른 기장고객이 사용 가능
   (중복 체크에서 제외됨)
```

---

## ✅ 적용 완료 항목

1. ✅ **모달 배경 클릭 방지**
   - 배경 클릭 시 닫히지 않음
   - 취소/저장/X 버튼만 동작

2. ✅ **번호 중복 체크**
   - 저장 전 자동 체크
   - 중복 시 알림 표시 및 저장 중단
   - 번호 입력 칸으로 자동 포커스

3. ✅ **해임고객 번호 처리**
   - 해임고객은 중복 체크에서 제외
   - 해임고객의 번호는 다른 고객이 사용 가능

4. ✅ **수정 시 자기 자신 제외**
   - 고객사 수정 시 자기 자신의 번호는 중복으로 간주하지 않음

---

## 🎯 개선 효과

### **Before**:
```
❌ 문제점:
- 실수로 배경 클릭 시 데이터 손실
- 같은 번호의 고객사가 여러 개 생성
- 번호 관리 혼란
```

### **After**:
```
✅ 개선:
- 안전한 데이터 입력 (실수 방지)
- 고유한 번호 관리
- 해임고객 번호 재사용 가능
- 명확한 오류 메시지
```

---

## 📝 사용자 안내

### **고객사 추가/수정 시**:

1. **번호 입력**:
   - 비어있으면 자동으로 빈 번호 할당
   - 수동 입력 시 중복 체크 수행

2. **중복 번호 입력 시**:
   ```
   ⚠️ 번호 "5"은(는) 이미 사용 중입니다.
   다른 번호를 입력해주세요.
   ```

3. **모달 닫기**:
   - ✅ "취소" 버튼 클릭
   - ✅ "저장" 버튼 클릭 (저장 후)
   - ✅ X 버튼 클릭
   - ❌ 배경 클릭 (동작하지 않음)

4. **해임고객 처리**:
   - 해임 여부 체크 시 번호는 비워도 됨
   - 해임 후 번호는 다른 고객이 사용 가능

---

## 🎉 완료!

고객사 관리 페이지가 더 안전하고 사용하기 편리해졌습니다! 🚀
