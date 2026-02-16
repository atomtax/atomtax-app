# 물건 목록 컬럼 추가 및 기장총괄표 분석

## ✅ 1단계 완료: 물건 목록에 컬럼 추가

### 추가된 컬럼
- **기납부 종소세** (prepaid_income_tax)
- **기납부 지방소득세** (prepaid_local_tax)

### 변경된 파일

#### 1. `trader-detail.html`
**테이블 헤더 수정**:
```html
<th style="width: 110px;">기납부 종소세</th>
<th style="width: 110px;">기납부 지방소득세</th>
```

**위치**: 신고기한 다음, 85초과 이전

**컬럼 순서**:
1. 물건명
2. 소재지
3. 취득가액
4. 기타필요경비
5. 양도가액
6. 양도소득
7. 양도일
8. 신고기한
9. **기납부 종소세** ⭐ NEW
10. **기납부 지방소득세** ⭐ NEW
11. 85초과
12. 진행단계

#### 2. `js/trader-detail.js`
**데이터 모델 수정**:
```javascript
const row = {
    property_name: '물건' + (inventoryRows.length + 1),
    address: '',
    acquisition_value: 0,
    other_expenses: 0,
    transfer_value: 0,
    transfer_income: 0,
    transfer_date: '',
    report_deadline: '',
    prepaid_income_tax: 0,      // ⭐ NEW
    prepaid_local_tax: 0,       // ⭐ NEW
    over_85: 'N',
    progress_status: '미확인',
    expenses: []
};
```

**렌더링 추가**:
```javascript
<td>
    <input type="text" class="trader-input" value="${formatNumber(row.prepaid_income_tax || 0)}" 
           onchange="updateInventoryRow(${index}, 'prepaid_income_tax', parseNumber(this.value))"
           onblur="this.value = formatNumber(parseNumber(this.value))"
           placeholder="0" style="text-align: right;">
</td>
<td>
    <input type="text" class="trader-input" value="${formatNumber(row.prepaid_local_tax || 0)}" 
           onchange="updateInventoryRow(${index}, 'prepaid_local_tax', parseNumber(this.value))"
           onblur="this.value = formatNumber(parseNumber(this.value))"
           placeholder="0" style="text-align: right;">
</td>
```

#### 3. `traders-data.html` (일괄 업로드 양식)
**엑셀 양식 헤더 수정**:
```javascript
['사업자번호*', '물건명', '소재지', '취득가액', '기타필요경비', '양도가액', '처분비', '양도소득', 
 '양도일(YYYYMMDD)', '신고기한', '기납부 종소세', '기납부 지방소득세', '85초과(Y/N)', '진행단계', '비고']
```

**예시 데이터**:
```javascript
['123-45-67890', '서울시 강남구 아파트', '서울시 강남구 테헤란로 123', 
 '100000000', '5000000', '150000000', '2000000', '', '20250115', '', 
 '1500000', '150000', 'Y', '확인', '']
```

**업로드 처리 추가**:
```javascript
prepaid_income_tax: parseNumber(row['기납부 종소세']) || 0,
prepaid_local_tax: parseNumber(row['기납부 지방소득세']) || 0,
```

---

## 🔍 2단계: 기장총괄표 분석

### 파일 정보
- **파일명**: 기장총괄표.xlsx
- **크기**: 1,291,228 bytes (약 1.23 MB)
- **형식**: Excel (.xlsx)

### 분석 도구 생성
**파일**: `analyze_excel.html`

#### 기능
1. **파일 업로드**: 기장총괄표.xlsx 파일 선택
2. **구조 분석**:
   - 시트 목록 및 개수
   - 각 시트의 행/열 정보
   - 헤더(컬럼명) 확인
   - 데이터 미리보기 (첫 10행)
   - JSON 형식 샘플 (처음 3개)
3. **일괄업로드 양식 생성**: 1-20번 데이터 추출 및 변환

### 사용 방법
1. 브라우저에서 `analyze_excel.html` 열기
2. "📂 파일 선택" 버튼 클릭
3. `기장총괄표_원본.xlsx` 파일 선택
4. "🔍 파일 분석" 버튼 클릭
5. 분석 결과 확인:
   - 어떤 시트에 데이터가 있는지
   - 컬럼명이 무엇인지
   - 사업자번호, 물건명, 양도가액 등이 어느 컬럼인지

### 다음 단계
분석 결과를 확인한 후, 다음 정보를 알려주세요:
1. **시트명**: 어떤 시트에 데이터가 있나요?
2. **사업자번호**: 어느 컬럼에 있나요?
3. **물건명**: 어느 컬럼에 있나요?
4. **소재지**: 어느 컬럼에 있나요?
5. **취득가액**: 어느 컬럼에 있나요?
6. **양도가액**: 어느 컬럼에 있나요?
7. **기납부 종소세**: 어느 컬럼에 있나요?
8. **기납부 지방소득세**: 어느 컬럼에 있나요?
9. **양도일**: 어느 컬럼에 있나요?

이 정보를 기반으로 자동 변환 스크립트를 작성하겠습니다!

---

## 📊 예상 워크플로우

```
[기장총괄표.xlsx]
    ↓
[analyze_excel.html로 분석]
    ↓
[컬럼 매핑 확인]
    ↓
[자동 변환 스크립트 실행]
    ↓
[매매사업자_일괄업로드_양식.xlsx 생성]
    ↓
[traders-data.html에서 일괄 업로드]
    ↓
[완료! 🎉]
```

---

## 📁 변경/생성된 파일
1. ✏️ `trader-detail.html` (테이블 헤더 + colspan 수정)
2. ✏️ `js/trader-detail.js` (데이터 모델 + 렌더링 수정)
3. ✏️ `traders-data.html` (엑셀 양식 + 업로드 처리 수정)
4. 📥 `기장총괄표_원본.xlsx` (원본 파일 다운로드)
5. 📄 `analyze_excel.html` (분석 도구)
6. 📄 `ADD_PREPAID_TAX_COLUMNS.md` (이 문서)

---

## 🎯 다음 액션
`analyze_excel.html`을 열어서 기장총괄표를 분석하고, 컬럼 매핑 정보를 알려주세요!

---

*작성 날짜: 2026-01-29*
