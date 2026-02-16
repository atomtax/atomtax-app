# 매매사업자 관리 드롭다운 기본 상태 변경

## 📋 요청 사항

**요청**: 매매사업자 관리 섹션의 드롭박스를 디폴트값이 **닫혀있는 상태**로 변경

## ✅ 변경 내용

### 1. 일반 페이지 (기본적으로 닫힘)
드롭다운을 **닫힌 상태**로 설정:

**변경된 페이지**:
- ✅ `clients.html` - 고객사 관리 페이지
- ✅ `dashboard.html` - 대시보드 페이지
- ✅ `client-detail.html` - 고객사 상세 페이지

**변경 내용**:
```html
<!-- Before: 항상 열려있음 -->
<div class="nav-dropdown active">

<!-- After: 기본적으로 닫혀있음 -->
<div class="nav-dropdown">
```

### 2. 매매사업자 관련 페이지 (자동으로 열림)
현재 매매사업자 관리 메뉴에 있을 때는 드롭다운이 **펼쳐진 상태**로 유지:

**유지된 페이지** (active 클래스 유지):
- ✅ `traders-data.html` - 매매사업자 데이터
- ✅ `traders-checklist.html` - 매매사업자 체크리스트
- ✅ `traders-vat-calculator.html` - 부가가치세 계산
- ✅ `trader-detail.html` - 매매사업자 상세

**유지된 내용**:
```html
<!-- 매매사업자 관련 페이지에서는 펼쳐진 상태 유지 -->
<div class="nav-dropdown active">
```

## 🎯 사용자 경험 (UX)

### Before (이전 요구사항)
```
모든 페이지에서:
🏪 매매사업자 관리 ▼  ← 항상 열려있음
  ├─ 📊 매매사업자 데이터
  ├─ ☑️ 매매사업자 체크리스트
  └─ 🧮 부가가치세 계산
```

### After (현재)

**일반 페이지** (dashboard, clients, client-detail):
```
🏪 매매사업자 관리 ▶  ← 닫혀있음 (클릭하면 펼쳐짐)
```

**매매사업자 관련 페이지** (traders-data, traders-checklist, etc.):
```
🏪 매매사업자 관리 ▼  ← 자동으로 열려있음
  ├─ 📊 매매사업자 데이터  ← 현재 페이지
  ├─ ☑️ 매매사업자 체크리스트
  └─ 🧮 부가가치세 계산
```

## 💡 작동 원리

### CSS 상태 전환
```css
/* 기본 상태: 닫힘 */
.dropdown-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
}

/* active 클래스 추가 시: 열림 */
.nav-dropdown.active .dropdown-content {
    max-height: 300px;
}
```

### JavaScript 토글
```javascript
// js/common.js의 toggleDropdown 함수
function toggleDropdown(event) {
    event.preventDefault();
    const dropdown = event.currentTarget.parentElement;
    dropdown.classList.toggle('active');
}
```

## 📊 페이지별 상태 요약

| 페이지 | 드롭다운 상태 | active 클래스 |
|--------|--------------|---------------|
| dashboard.html | 닫힘 | ❌ 없음 |
| clients.html | 닫힘 | ❌ 없음 |
| client-detail.html | 닫힘 | ❌ 없음 |
| traders-data.html | 열림 | ✅ 있음 |
| traders-checklist.html | 열림 | ✅ 있음 |
| traders-vat-calculator.html | 열림 | ✅ 있음 |
| trader-detail.html | 열림 | ✅ 있음 |

## ✨ 개선 효과

### 장점
1. **깔끔한 사이드바**: 기본적으로 메뉴가 닫혀있어 사이드바가 간결함
2. **공간 절약**: 다른 메뉴 항목들이 더 잘 보임
3. **컨텍스트 인지**: 매매사업자 페이지에 있을 때만 하위 메뉴가 보임
4. **사용자 제어**: 필요할 때 클릭하여 펼칠 수 있음

### 사용 방법
1. **메뉴 펼치기**: "매매사업자 관리" 클릭 → 하위 메뉴 표시
2. **메뉴 접기**: 다시 "매매사업자 관리" 클릭 → 하위 메뉴 숨김
3. **자동 펼침**: 매매사업자 관련 페이지로 이동하면 자동으로 열림

## 🎉 결론

**매매사업자 관리 드롭다운이 기본적으로 닫힌 상태로 변경되었습니다!**

- 일반 페이지: 닫혀있음 (클릭하면 펼쳐짐)
- 매매사업자 페이지: 자동으로 열려있음
- 깔끔하고 직관적인 사용자 경험 제공
