# 📋 체크리스트 물건 상세 정보 확장 기능 완료 (v3.5)

## ✅ 구현 완료

체크리스트에서 행을 클릭하면 물건 상세 정보를 바로 확인할 수 있습니다!

---

## 🎯 주요 기능

### 1️⃣ 행 클릭 시 상세 정보 확장
- 체크리스트 테이블의 **행을 클릭**하면 바로 아래에 상세 정보 탭이 펼쳐짐
- 한 줄로 깔끔하게 정보 표시
- 다시 클릭하면 닫힘

### 2️⃣ 물건 상세 정보 표시
**8개 정보 카드:**
1. 물건명
2. 취득가액
3. 기타필요경비
4. 양도가액
5. 양도소득 (강조 표시)
6. 기납부 종소세
7. 기납부 지방소득세
8. 비과세 여부 (Y/N 배지)

### 3️⃣ 불러오기 버튼
- 해당 고객사의 상세 페이지로 이동
- 새 탭에서 열림

### 4️⃣ 보고서 버튼
- 물건 정보를 정리한 간단한 보고서 표시
- 향후 PDF 다운로드 기능 추가 예정

---

## 🖥️ 화면 구성

### 체크리스트 테이블

```
┌────────────────────────────────────────────────────────────┐
│ 고객사명 │ 담당자 │ 물건명 │ ... │ 진행단계 │ 폴더 │  ← 클릭!
├────────────────────────────────────────────────────────────┤
│ [물건 상세 정보 확장 탭]                                    │
│ ┌──────────┬──────────┬──────────┬──────────┐            │
│ │ 물건명   │ 취득가액 │ 기타경비 │ 양도가액 │            │
│ │ 강남아파트│500,000,000│50,000,000│1,000,000,000│         │
│ └──────────┴──────────┴──────────┴──────────┘            │
│ ┌──────────┬──────────┬──────────┬──────────┐            │
│ │ 양도소득 │ 종소세   │ 지방소득세│ 비과세   │            │
│ │ 450,000,000│100,000,000│10,000,000│   N     │            │
│ └──────────┴──────────┴──────────┴──────────┘            │
│                            [불러오기] [보고서]            │
└────────────────────────────────────────────────────────────┘
```

---

## 📋 사용 방법

### ✅ 물건 상세 정보 확인하기

#### 1단계: 체크리스트 열기
```
매매사업자 관리 → 매매사업자 체크리스트
```

#### 2단계: 행 클릭
```
진행 중인 항목 테이블에서 원하는 물건 행을 클릭
→ 바로 아래에 상세 정보 탭 펼쳐짐
```

#### 3단계: 정보 확인
```
물건명, 취득가액, 양도가액, 양도소득, 세금 등 한눈에 확인
```

#### 4단계: 불러오기/보고서
```
[불러오기]: 상세 페이지로 이동하여 수정 가능
[보고서]: 간단한 보고서 확인
```

---

## 💡 기능 상세

### 1️⃣ 클릭 가능한 행

**구현 방식:**
- 행 전체가 클릭 가능 (`clickable-row` 클래스)
- 호버 시 배경색 변경으로 시각적 피드백
- 드롭다운 및 링크는 이벤트 전파 중지 (`event.stopPropagation()`)

**예외 처리:**
- 고객사명 링크 클릭: 상세 페이지로 이동 (탭 펼쳐지지 않음)
- 진행단계 드롭다운: 드롭다운만 작동 (탭 펼쳐지지 않음)
- 폴더 버튼: 드라이브 폴더로 이동 (탭 펼쳐지지 않음)

---

### 2️⃣ 물건 상세 정보 카드

**8개 정보:**

| 카드 | 필드 | 설명 |
|------|------|------|
| 1 | 물건명 | property_name |
| 2 | 취득가액 | acquisition_value |
| 3 | 기타필요경비 | other_expenses |
| 4 | 양도가액 | transfer_value |
| 5 | 양도소득 | transfer_income (보라색 강조) |
| 6 | 기납부 종소세 | prepaid_income_tax |
| 7 | 기납부 지방소득세 | prepaid_local_tax |
| 8 | 비과세 | non_taxable (Y=초록, N=회색) |

**스타일:**
- 배경: 흰색 카드
- 테두리: 연한 회색
- 레이블: 작은 회색 텍스트
- 값: 큰 검은색 텍스트
- 숫자는 천 단위 콤마 포맷

---

### 3️⃣ 불러오기 버튼

**기능:**
```javascript
function loadToDetail(rowId) {
    // 해당 고객사의 trader-detail.html로 이동
    const url = `trader-detail.html?id=${item.client_id}`;
    window.open(url, '_blank');
}
```

**사용 시나리오:**
```
1. 체크리스트에서 물건 정보 확인
2. 수정이 필요하면 "불러오기" 클릭
3. 새 탭에서 상세 페이지 열림
4. 물건 정보 수정 후 저장
5. 체크리스트 새로고침하면 자동 반영
```

---

### 4️⃣ 보고서 버튼

**현재 기능:**
```
간단한 텍스트 보고서를 alert로 표시

=== 양도소득세 신고 보고서 ===

[고객 정보]
고객사명: ㈜금아실업
담당자: 김철수

[물건 정보]
물건명: 강남 아파트
85타입 초과: 초과
비과세 여부: 과세

[금액 정보]
취득가액: 500,000,000원
기타필요경비: 50,000,000원
양도가액: 1,000,000,000원
양도소득: 450,000,000원

[세금 정보]
기납부 종소세: 114,060,000원
기납부 지방소득세: 11,406,000원

[일정 정보]
양도일: 2025-12-31
신고기한: 2026-02-28

[진행 상태]
진행단계: 위하고입력
```

**향후 개선 예정:**
- 📄 PDF 다운로드
- 🖨️ 인쇄 기능
- 📧 이메일 전송
- 📋 클립보드 복사

---

## 🎨 디자인 가이드

### CSS 클래스

```css
/* 클릭 가능한 행 */
.clickable-row {
    cursor: pointer;
    transition: background 0.2s;
}

.clickable-row:hover {
    background: #f9fafb;
}

/* 상세 정보 행 */
.detail-row {
    display: none;
    background: #f9fafb;
    border-top: 2px solid #667eea;
}

.detail-row.show {
    display: table-row;
}

/* 정보 카드 */
.detail-item {
    background: white;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
}

.detail-label {
    font-size: 11px;
    color: #6b7280;
    margin-bottom: 4px;
    font-weight: 600;
}

.detail-value {
    font-size: 14px;
    color: #1f2937;
    font-weight: 500;
}
```

---

## 🔧 기술 구현

### traders-checklist.html

#### 데이터 수집 시 필드 추가
```javascript
const item = {
    client_id: trader.id,
    client_name: trader.company_name,
    property_name: row.property_name,
    address: row.address,
    acquisition_value: row.acquisition_value || 0,
    other_expenses: row.other_expenses || 0,
    transfer_value: row.transfer_value || 0,
    transfer_income: row.transfer_income || 0,
    over_85: row.over_85,
    non_taxable: row.non_taxable || 'N',      // 🆕
    prepaid_income_tax: row.prepaid_income_tax || 0,  // 🆕
    prepaid_local_tax: row.prepaid_local_tax || 0,    // 🆕
    transfer_date: row.transfer_date,
    report_deadline: row.report_deadline,
    manager: trader.manager,
    progress_status: row.progress_status,
    real_estate_drive_folder: trader.real_estate_drive_folder
};
```

#### 행 렌더링
```javascript
function renderTableRow(item) {
    const rowId = `${item.client_id}_${item.property_name.replace(/\s/g, '_')}`;
    
    return `
        <!-- 일반 행 (클릭 가능) -->
        <tr class="clickable-row" onclick="toggleDetailRow('${rowId}')">
            <td>...</td>
            <!-- onclick="event.stopPropagation()" 필수! -->
        </tr>
        
        <!-- 상세 정보 행 (처음에는 숨김) -->
        <tr class="detail-row" id="detail-${rowId}">
            <td colspan="8">
                <div class="detail-content">
                    <!-- 8개 정보 카드 -->
                    <!-- 불러오기/보고서 버튼 -->
                </div>
            </td>
        </tr>
    `;
}
```

#### 토글 함수
```javascript
function toggleDetailRow(rowId) {
    const detailRow = document.getElementById(`detail-${rowId}`);
    if (detailRow) {
        detailRow.classList.toggle('show');
    }
}
```

#### 불러오기 함수
```javascript
function loadToDetail(rowId) {
    const item = allItems.find(i => {
        const itemRowId = `${i.client_id}_${i.property_name.replace(/\s/g, '_')}`;
        return itemRowId === rowId;
    });
    
    if (!item) {
        showNotification('항목을 찾을 수 없습니다.', 'error');
        return;
    }
    
    const url = `trader-detail.html?id=${item.client_id}`;
    window.open(url, '_blank');
}
```

---

## 🚀 업데이트 내역

### v3.5 (2026-02-04)
- ✅ 체크리스트 행 클릭 시 상세 정보 확장 탭 표시
- ✅ 물건 정보 8개 카드로 표시
- ✅ 불러오기 버튼 구현 (상세 페이지로 이동)
- ✅ 보고서 버튼 기초 구현 (텍스트 보고서)
- ✅ 클릭 가능한 행 스타일 추가
- ✅ 이벤트 전파 중지 처리 (링크/드롭다운/버튼)
- ✅ formatNumber 함수 추가 (천 단위 콤마)
- ✅ 비과세 여부 필드 체크리스트에 포함

---

## 📞 지원

문제가 발생하거나 개선 요청이 있으면 시스템 관리자에게 문의하세요.

**관련 파일:**
- `traders-checklist.html`

**관련 기능:**
- 체크리스트 행 클릭
- 물건 상세 정보 확장
- 불러오기 버튼
- 보고서 버튼
