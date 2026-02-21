# 테이블 헤더 오버플로우 긴급 수정

**날짜**: 2026-02-21 22:45  
**파일**: `trader-detail.html`  
**상태**: ✅ 완료

---

## 🚨 문제 상황

사용자가 보고한 **빨간색 박스**처럼 튀어나온 헤더 문제:

### 증상
- 테이블 우측 끝 4개 칼럼(필요경비 상세, 양도소득금액, 신고여부, 작업)이 빨간색 박스처럼 튀어나와 있음
- 나머지 칼럼은 정상이지만 마지막 4개만 레이아웃이 깨짐

### 원인 분석
```css
/* 문제 코드 */
.trader-table {
    table-layout: fixed;  /* ← 고정 레이아웃 */
}

.trader-table th:nth-child(1) { width: 40px; }
.trader-table th:nth-child(2) { width: 180px; }
/* ... */
.trader-table th:nth-child(9) { width: 80px; }
.trader-table th:nth-child(10) { width: 100px; }
.trader-table th:nth-child(11) { width: 90px; }
.trader-table th:nth-child(12) { width: 120px; }
```

**문제점**:
1. `table-layout: fixed` 사용 시 **테이블 전체 너비**가 고정됨
2. 12개 칼럼의 합 = `40 + 180 + 80 + 100*5 + 80 + 100 + 90 + 120 = 1,190px`
3. 컨테이너 너비보다 합계가 크면 **마지막 칼럼들이 튀어나옴**
4. `overflow-x: auto` 있어도 fixed 레이아웃에선 효과 없음

---

## ✅ 해결 방법

### 1. `table-layout: fixed` 제거
```css
/* 수정 전 */
.trader-table {
    table-layout: fixed;  /* ← 제거 */
}

/* 수정 후 */
.trader-table {
    width: 100%;
    border-collapse: collapse;
    /* 자동 레이아웃으로 변경 */
}
```

### 2. 개별 칼럼 너비 지정 제거
```css
/* 수정 전 - 삭제 */
.trader-table th:nth-child(1) { width: 40px; }
.trader-table th:nth-child(2) { width: 180px; }
/* ... 12개 전부 삭제 */

/* 수정 후 - 최소 너비만 지정 */
.trader-table th {
    min-width: 70px;  /* 최소 너비 */
}
```

### 3. 소재지 칼럼만 특별 처리
```css
.trader-table td:nth-child(2) {
    text-align: left;
    padding-left: 10px;
    min-width: 150px;  /* 긴 주소 대비 */
}
```

---

## 📊 수정 전/후 비교

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| **레이아웃 방식** | `table-layout: fixed` | 자동 (auto) |
| **칼럼 너비** | 개별 지정 (12개) | 최소 너비만 (70px) |
| **소재지 칼럼** | 180px 고정 | 150px 최소 + 자동 확장 |
| **오버플로우** | 튀어나옴 ❌ | 정상 표시 ✅ |
| **반응형** | 깨짐 | 자동 조정 |

---

## 🔍 왜 이렇게 수정했나?

### `table-layout: fixed`의 문제
- **장점**: 렌더링 빠름, 칼럼 너비 일정
- **단점**: 
  - 전체 너비 계산 복잡
  - 칼럼 개수가 많으면 오버플로우 발생
  - 반응형 어려움

### `table-layout: auto`의 장점
- **장점**:
  - 내용에 맞게 자동 조정
  - 오버플로우 없음
  - 반응형 자동 지원
- **단점**: 렌더링 약간 느림 (무시 가능한 수준)

### 결론
- **데이터 테이블**처럼 칼럼이 많고 내용 길이가 다양할 때는 **자동 레이아웃**이 더 안전함
- **최소 너비**만 지정하면 너무 좁아지는 것도 방지 가능

---

## ✅ 테스트 체크리스트

### 기능 테스트
- [x] 테이블 헤더가 정상적으로 정렬되는가?
- [x] 12개 칼럼이 모두 보이는가?
- [x] 빨간색 박스/튀어나옴 현상이 사라졌는가?
- [x] 엑셀 업로드 정상 작동
- [x] 행 추가/삭제 정상 작동
- [x] 필요경비 상세 모달 정상 작동
- [x] 보고서 생성 정상 작동

### 다양한 화면 크기 테스트
- [ ] 1920px (Full HD) 모니터
- [ ] 1366px (노트북)
- [ ] 1024px (태블릿)
- [ ] 가로 스크롤 정상 작동

---

## 🚀 배포 방법

### 1. GitHub 커밋
```bash
git add trader-detail.html README.md TABLE_OVERFLOW_FIX_2026-02-21.md
git commit -m "Fix: 테이블 헤더 오버플로우 긴급 수정 (table-layout auto로 변경)"
git push origin main
```

### 2. Netlify 자동 배포
- https://app.netlify.com/sites/atomtax-app/deploys
- "Published" 확인 (1~2분)

### 3. 브라우저 캐시 초기화
- **Ctrl + Shift + R** (하드 리프레시)
- 또는 **시크릿 모드**에서 테스트

---

## 📝 예방 방법

앞으로 이런 문제를 예방하려면:

1. **칼럼이 많은 테이블**은 `table-layout: auto` 사용
2. **최소 너비**만 지정 (`min-width`)
3. **개별 너비**는 꼭 필요할 때만 사용
4. **테스트**: 다양한 화면 크기에서 확인

---

## ✅ 완료

- **문제**: 테이블 헤더 4개 칼럼 튀어나옴
- **원인**: `table-layout: fixed` + 너비 합계 초과
- **해결**: 자동 레이아웃 + 최소 너비만 지정
- **결과**: 정상 표시, 모든 기능 작동
- **다음**: GitHub 커밋 → Netlify 배포
