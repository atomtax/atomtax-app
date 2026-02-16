# Firebase 설정 가이드

## 🔥 Firebase 프로젝트 설정

### 1. Firebase Console에서 프로젝트 생성
1. https://console.firebase.google.com/ 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `atom-tax-system` (원하는 이름)
4. Google Analytics 비활성화 (선택사항)
5. 프로젝트 생성 완료

### 2. Authentication 활성화
1. 왼쪽 메뉴 → **Authentication** 클릭
2. **시작하기** 클릭
3. **Sign-in method** 탭
4. **이메일/비밀번호** 활성화 → 저장

### 3. Firestore Database 생성
1. 왼쪽 메뉴 → **Firestore Database** 클릭
2. **데이터베이스 만들기** 클릭
3. **테스트 모드로 시작** 선택
4. 위치: **asia-northeast3 (서울)** 선택
5. 사용 설정 클릭

### 4. Firestore 보안 규칙 설정
Rules 탭에서 다음 규칙 적용:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 인증된 사용자만 접근 가능
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. 웹 앱 추가 및 설정 정보 복사
1. 프로젝트 설정 (톱니바퀴 아이콘)
2. 내 앱 섹션에서 **웹 아이콘 (</>)** 클릭
3. 앱 닉네임 입력: `atom-tax-web`
4. **Firebase SDK 구성** 정보 복사

예시:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "atom-tax-system.firebaseapp.com",
  projectId: "atom-tax-system",
  storageBucket: "atom-tax-system.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### 6. firebase-config.js 파일 수정
`js/firebase-config.js` 파일을 열고 위에서 복사한 설정 정보로 교체:

```javascript
const firebaseConfig = {
  apiKey: "여기에_실제_API_KEY",
  authDomain: "여기에_실제_AUTH_DOMAIN",
  projectId: "여기에_실제_PROJECT_ID",
  storageBucket: "여기에_실제_STORAGE_BUCKET",
  messagingSenderId: "여기에_실제_SENDER_ID",
  appId: "여기에_실제_APP_ID"
};
```

---

## 👤 초기 사용자 등록

### Firebase Console에서 수동 등록
1. Authentication → Users 탭
2. **사용자 추가** 클릭
3. 이메일: `admin@atom.com`
4. 비밀번호: `admin1234` (나중에 변경 권장)
5. 사용자 ID (UID) 복사

### Firestore에 사용자 정보 추가
1. Firestore Database → 데이터 탭
2. **컬렉션 시작** 클릭
3. 컬렉션 ID: `users`
4. 문서 ID: (위에서 복사한 UID 붙여넣기)
5. 필드 추가:
   - `email` (string): `admin@atom.com`
   - `name` (string): `관리자`
   - `role` (string): `admin`
   - `createdAt` (timestamp): (자동)

---

## 📊 localStorage 데이터 마이그레이션

기존 localStorage 데이터를 Firestore로 이동:

### 방법 1: 브라우저 콘솔에서 실행
1. 웹사이트 로그인 후 F12 → Console 탭
2. 다음 명령 실행:

```javascript
migrateFromLocalStorage().then(result => {
  console.log('마이그레이션 완료:', result);
});
```

### 방법 2: 관리 페이지 추가 (추천)
`admin-tools.html` 페이지에 마이그레이션 버튼 추가 (제공 예정)

---

## 🔒 보안 강화 (선택사항)

### 비밀번호 정책 강화
Authentication → Settings → Password policy
- 최소 길이: 8자
- 특수문자 요구

### Firestore 규칙 강화
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 정보는 읽기만 가능
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 고객사 정보
    match /clients/{clientId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // 재고 정보
    match /trader_inventory/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 📦 백업 설정

### 자동 백업 (Firebase 콘솔)
1. Firestore Database → Usage 탭
2. **내보내기** 클릭
3. Cloud Storage 버킷 선택
4. 정기 백업 일정 설정 (유료 플랜 필요)

### 수동 백업 (무료)
관리자 페이지에서 "전체 백업" 버튼 클릭
- JSON 파일로 다운로드
- 주기적으로 백업 권장 (주 1회)

---

## ✅ 테스트 체크리스트

- [ ] Firebase 프로젝트 생성 완료
- [ ] Authentication 활성화 완료
- [ ] Firestore Database 생성 완료
- [ ] firebase-config.js 설정 완료
- [ ] 초기 사용자 등록 완료
- [ ] 로그인 테스트 성공
- [ ] 데이터 저장 테스트 성공
- [ ] localStorage 마이그레이션 완료

---

## 🆘 문제 해결

### 로그인이 안 돼요
- Firebase Console에서 사용자가 올바르게 등록되었는지 확인
- firebase-config.js 설정이 올바른지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 데이터가 저장 안 돼요
- Firestore 보안 규칙 확인
- 네트워크 탭에서 요청 상태 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 이전 데이터가 보이지 않아요
- localStorage 마이그레이션 실행했는지 확인
- Firestore Console에서 데이터 직접 확인

---

## 📞 지원

문제가 해결되지 않으면:
1. 브라우저 콘솔 에러 메시지 캡처
2. Firebase Console 스크린샷
3. 문제 상황 상세히 설명

---

## 💰 비용 (무료 플랜 기준)

Firebase 무료 플랜(Spark):
- **Authentication**: 무제한 사용자
- **Firestore**: 
  - 50,000 읽기/일
  - 20,000 쓰기/일
  - 20,000 삭제/일
  - 1GB 저장공간
  
→ 소규모 팀(5-10명)은 무료로 충분합니다!

---

## 🚀 다음 단계

Firebase 설정이 완료되면:
1. 모든 내부 페이지에 Firebase SDK 추가
2. localStorage → Firestore 전환
3. 실시간 동기화 기능 활성화
4. 백업 자동화 설정
