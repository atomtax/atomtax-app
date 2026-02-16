# 매매사업자 관리 사이드바 노출 수정

## 📋 문제점

**현상**: 일부 페이지(dashboard.html, client-detail.html, clients.html)에서 "매매사업자 관리" 메뉴가 보이지 않음

**원인**:
1. **clients.html**: 드롭다운 구조는 있으나 `active` 클래스 누락 → 기본적으로 닫힌 상태
2. **dashboard.html**: 매매사업자 관리 메뉴 자체가 없음
3. **client-detail.html**: 매매사업자 관리 메뉴 자체가 없음

## ✅ 해결 방법

### 1. clients.html
**변경 전**:
```html
<div class="nav-dropdown">  <!-- active 클래스 없음 -->
    <a href="#" class="nav-item" onclick="toggleDropdown(event)">
        <i class="fas fa-store"></i>
        <span>매매사업자 관리</span>
        <i class="fas fa-chevron-down dropdown-arrow"></i>
    </a>
    ...
</div>
```

**변경 후**:
```html
<div class="nav-dropdown active">  <!-- active 클래스 추가 -->
    <a href="#" class="nav-item" onclick="toggleDropdown(event)">
        <i class="fas fa-store"></i>
        <span>매매사업자 관리</span>
        <i class="fas fa-chevron-down dropdown-arrow"></i>
    </a>
    ...
</div>
```

### 2. dashboard.html & client-detail.html
**추가된 메뉴 구조**:
```html
<!-- 매매사업자 관리 (드롭다운) -->
<div class="nav-dropdown active">
    <a href="#" class="nav-item" onclick="toggleDropdown(event)">
        <i class="fas fa-store"></i>
        <span>매매사업자 관리</span>
        <i class="fas fa-chevron-down dropdown-arrow"></i>
    </a>
    <div class="dropdown-content">
        <a href="traders-data.html" class="dropdown-item">
            <i class="fas fa-database"></i>
            <span>매매사업자 데이터</span>
        </a>
        <a href="traders-checklist.html" class="dropdown-item">
            <i class="fas fa-check-square"></i>
            <span>매매사업자 체크리스트</span>
        </a>
        <a href="traders-vat-calculator.html" class="dropdown-item">
            <i class="fas fa-calculator"></i>
            <span>부가가치세 계산</span>
        </a>
    </div>
</div>
```

## 📊 CSS 작동 원리

### 기본 상태 (active 없음)
```css
.dropdown-content {
    max-height: 0;        /* 숨김 */
    overflow: hidden;
    transition: max-height 0.3s ease;
}
```

### 펼친 상태 (active 있음)
```css
.nav-dropdown.active .dropdown-content {
    max-height: 300px;    /* 표시 */
}
```

## 🎯 최종 결과

### 변경된 파일
- ✅ `clients.html` - active 클래스 추가
- ✅ `dashboard.html` - 매매사업자 관리 메뉴 추가
- ✅ `client-detail.html` - 매매사업자 관리 메뉴 추가

### 기존 파일 (이미 정상)
- ✅ `traders-data.html`
- ✅ `traders-checklist.html`
- ✅ `traders-vat-calculator.html`
- ✅ `trader-detail.html`

### 사이드바 메뉴 구조 (모든 페이지 통일)
```
📊 대시보드
🏢 고객사 관리
🏪 매매사업자 관리 ▼  ← 항상 표시됨!
  ├─ 📊 매매사업자 데이터
  ├─ ☑️ 매매사업자 체크리스트
  └─ 🧮 부가가치세 계산
💼 세무 관리
📈 통계 분석
⚙️ 설정
```

## 💡 추가 정보

### toggleDropdown 함수
- 위치: `js/common.js` (263번째 줄)
- 기능: 드롭다운 메뉴 접기/펼치기 토글
- 사용: `onclick="toggleDropdown(event)"`

### CSS 스타일
- 위치: `css/style.css`
- 드롭다운 색상: 흰색 `rgba(255, 255, 255, 0.95)`
- 들여쓰기: 모든 상태 `60px`로 통일
- 애니메이션: `max-height` 0.3초 transition

## ✨ 개선 효과

### Before (문제)
- ❌ 고객사 관리를 클릭해야만 매매사업자 관리 보임
- ❌ dashboard, client-detail에서 매매사업자 관리 접근 불가
- ❌ 일관되지 않은 사용자 경험

### After (해결)
- ✅ 모든 페이지에서 매매사업자 관리 항상 노출
- ✅ 클릭 없이 바로 하위 메뉴 확인 가능
- ✅ 통일된 사이드바 구조 (UX 개선)
- ✅ 빠른 네비게이션 (클릭 1회 절약)

## 🎉 결론

**모든 페이지에서 매매사업자 관리 메뉴가 기본적으로 펼쳐진 상태로 표시됩니다!**

사용자가 고객사 관리를 클릭하지 않아도 매매사업자 관리 메뉴와 하위 항목들이 항상 보입니다.
