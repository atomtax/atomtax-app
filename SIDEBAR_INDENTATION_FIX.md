# 매매사업자 체크리스트 사이드바 들여쓰기 수정

## 🚨 문제 발견

### 캡처 이미지 비교

**첫 번째 이미지** (문제):
```
매매사업자 관리 ▼
  매매사업자 데이터      ← 들여쓰기 많음
  ✓ 매매사업자 체크리스트  ← 들여쓰기 많음  
  부가가치세 계산        ← 들여쓰기 적음 (다름!)
```

**두 번째 이미지** (정상):
```
매매사업자 관리 ▼
  매매사업자 데이터      ← 동일한 들여쓰기
  매매사업자 체크리스트  ← 동일한 들여쓰기
  부가가치세 계산        ← 동일한 들여쓰기
```

---

## 🔍 원인 분석

### 문제의 근본 원인
**traders-checklist.html에 CSS가 중복 정의되어 사이드바 스타일을 덮어씀!**

### 충돌하는 CSS
```css
/* traders-checklist.html 내부 <style> 태그 */
.dropdown-item {
    padding: 8px 12px;  /* ← 사이드바 스타일 덮어씀! */
    cursor: pointer;
    border-radius: 4px;
    font-size: 13px;
    color: #374151;
}
```

### 원래 의도한 CSS (css/style.css)
```css
.dropdown-item {
    padding: 12px 20px 12px 60px;  /* ← 이것이 무시됨! */
    ...
}
```

---

## ✅ 해결 방법

### CSS 클래스 이름 변경
페이지 내부의 드롭다운 스타일과 사이드바 드롭다운 스타일을 구분하기 위해 클래스 이름을 변경:

**Before**:
```css
/* traders-checklist.html */
.dropdown-item {  /* ← 사이드바와 충돌! */
    padding: 8px 12px;
    ...
}
```

**After**:
```css
/* traders-checklist.html */
.filter-dropdown-item {  /* ← 구체적인 이름으로 변경! */
    padding: 8px 12px;
    ...
}
```

---

## 📊 CSS 우선순위

### 문제 상황
```
1. css/style.css 로드 (외부 CSS)
   .dropdown-item { padding: 60px; }

2. traders-checklist.html <style> 로드 (인라인 CSS)
   .dropdown-item { padding: 12px; }  ← 이게 우선!

결과: 사이드바의 .dropdown-item도 padding: 12px 적용!
```

### 해결 후
```
1. css/style.css 로드
   .dropdown-item { padding: 60px; }  ← 사이드바에 적용

2. traders-checklist.html <style> 로드
   .filter-dropdown-item { padding: 12px; }  ← 페이지 내부용

결과: 사이드바는 60px 들여쓰기 정상!
```

---

## 🎯 변경 사항

### 변경된 파일
- ✅ `traders-checklist.html`

### 변경 내용
```css
/* Before */
.dropdown-item {
    padding: 8px 12px;
    ...
}

.dropdown-item:hover {
    background: #f3f4f6;
}

/* After */
.filter-dropdown-item {
    padding: 8px 12px;
    ...
}

.filter-dropdown-item:hover {
    background: #f3f4f6;
}
```

---

## ✅ 검증

### 사이드바 들여쓰기 (정상 복구!)
```
매매사업자 관리 ▼
  매매사업자 데이터      (60px) ✅
  매매사업자 체크리스트  (60px) ✅
  부가가치세 계산        (60px) ✅
```

### CSS 적용 확인
```css
/* css/style.css - 사이드바 전용 */
.dropdown-item {
    padding: 12px 20px 12px 60px;  /* 왼쪽 60px */
}

.dropdown-item:hover {
    padding-left: 60px;  /* 호버 시에도 60px */
}

.dropdown-item.active {
    padding-left: 60px;  /* 활성 시에도 60px */
}
```

---

## 🎉 결과

### Before (문제)
- ❌ 들여쓰기 불일치 (데이터/체크리스트 ≠ 계산)
- ❌ CSS 충돌로 사이드바 스타일 깨짐
- ❌ 시각적 불일치

### After (해결)
- ✅ 모든 하위 메뉴 **60px 통일**
- ✅ CSS 충돌 해결 (클래스 이름 분리)
- ✅ 시각적 일관성 확보

---

## 💡 교훈

### CSS 네이밍 베스트 프랙티스
1. **구체적인 이름 사용**: `.dropdown-item` → `.filter-dropdown-item`
2. **네임스페이스 활용**: 페이지별 고유 접두사
3. **BEM 방법론**: `.block__element--modifier`
4. **인라인 CSS 최소화**: 외부 CSS 파일 사용 권장

### 방지책
```css
/* Good: 구체적이고 명확한 클래스 이름 */
.checklist-filter-dropdown-item { }
.sidebar-dropdown-item { }

/* Bad: 너무 일반적인 이름 */
.dropdown-item { }
.item { }
```

---

**완료! 사이드바 들여쓰기가 모든 페이지에서 통일되었습니다! ✅**
