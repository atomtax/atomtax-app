// 테이블 렌더링 함수 - 12칼럼 버전
function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    
    if (inventoryRows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" style="padding: 20px; text-align: center; color: #9ca3af;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    <p style="font-size: 16px; margin: 0;">등록된 물건이 없습니다.</p>
                    <p style="font-size: 14px; margin-top: 8px; color: #9ca3af;">엑셀 파일을 업로드하거나 행 추가 버튼을 클릭하세요.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = inventoryRows.map((row, index) => {
        // Calculate transfer income
        const transferIncome = calculateTransferIncome(row.transfer_value, row.acquisition_value, row.other_expenses);
        row.transfer_income = transferIncome;
        
        // Calculate report deadline (2 months after transfer date)
        if (row.transfer_date && row.transfer_date.length === 8) {
            const year = parseInt(row.transfer_date.substring(0, 4));
            const month = parseInt(row.transfer_date.substring(4, 6));
            const day = parseInt(row.transfer_date.substring(6, 8));
            const transferDate = new Date(year, month - 1, day);
            transferDate.setMonth(transferDate.getMonth() + 2);
            row.report_deadline = transferDate.toISOString().split('T')[0];
        }
        
        return `
        <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td style="text-align: left;">
                <input type="text" class="trader-input" value="${row.address || ''}" 
                       onchange="updateInventoryRow(${index}, 'address', this.value)" 
                       placeholder="소재지 입력" style="text-align: left;">
            </td>
            <td>
                <input type="text" class="trader-input" value="${row.area || ''}" 
                       onchange="updateInventoryRow(${index}, 'area', this.value)" 
                       placeholder="0" style="text-align: right;">
            </td>
            <td>
                <input type="text" class="trader-input" value="${formatNumber(row.acquisition_value) || ''}" 
                       onchange="updateInventoryRow(${index}, 'acquisition_value', parseNumber(this.value))"
                       onblur="this.value = formatNumber(parseNumber(this.value))"
                       placeholder="0" style="text-align: right;">
            </td>
            <td>
                <input type="text" class="trader-input" value="${row.acquisition_date || ''}" 
                       onchange="updateInventoryRow(${index}, 'acquisition_date', this.value)"
                       onblur="formatAcquisitionDate(${index}, this)"
                       placeholder="20250101" maxlength="10" style="text-align: center;">
            </td>
            <td>
                <input type="text" class="trader-input" value="${formatNumber(row.transfer_value) || ''}" 
                       onchange="updateInventoryRow(${index}, 'transfer_value', parseNumber(this.value))"
                       onblur="this.value = formatNumber(parseNumber(this.value))"
                       placeholder="0" style="text-align: right;">
            </td>
            <td>
                <input type="text" class="trader-input" value="${row.transfer_date || ''}" 
                       onchange="updateInventoryRow(${index}, 'transfer_date', this.value)"
                       onblur="formatTransferDate(${index}, this)"
                       placeholder="20250405" maxlength="10" style="text-align: center;">
            </td>
            <td>
                <input type="text" class="trader-input" value="${formatNumber(row.other_expenses) || ''}" 
                       onchange="updateInventoryRow(${index}, 'other_expenses', parseNumber(this.value))"
                       onblur="this.value = formatNumber(parseNumber(this.value))"
                       placeholder="0" style="text-align: right;">
            </td>
            <td style="text-align: center;">
                <button class="icon-btn" onclick="openExpenseSection(${index})" title="필요경비 상세">
                    <i class="fas fa-dollar-sign"></i>
                </button>
            </td>
            <td>
                <input type="text" class="trader-input" value="${formatNumber(transferIncome) || ''}" 
                       readonly style="background: #fef3c7; text-align: right;">
            </td>
            <td style="text-align: center;">
                <select class="trader-input status-${row.progress_stage || '미확인'}" 
                        onchange="updateInventoryRow(${index}, 'progress_stage', this.value)" 
                        style="border: none; cursor: pointer; font-weight: 600; font-size: 12px;">
                    <option value="미확인" ${(row.progress_stage === '미확인' || !row.progress_stage) ? 'selected' : ''}>미확인</option>
                    <option value="확인" ${row.progress_stage === '확인' ? 'selected' : ''}>확인</option>
                    <option value="위하고입력" ${row.progress_stage === '위하고입력' ? 'selected' : ''}>위하고입력</option>
                    <option value="고객안내" ${row.progress_stage === '고객안내' ? 'selected' : ''}>고객안내</option>
                    <option value="신고완료" ${row.progress_stage === '신고완료' ? 'selected' : ''}>신고완료</option>
                </select>
            </td>
            <td style="text-align: center;">
                <div class="action-buttons">
                    <button class="icon-btn" onclick="showReferenceData(${index})" title="입력참고용">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="icon-btn" onclick="generatePropertyReport(${index})" title="보고서">
                        <i class="fas fa-file-alt"></i>
                    </button>
                    <button class="icon-btn" onclick="deleteInventoryRow(${index})" title="삭제" style="color: #ef4444;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
    
    // Save after rendering
    saveInventoryData();
}

// Calculate transfer income
function calculateTransferIncome(transferValue, acquisitionValue, otherExpenses) {
    const transfer = parseNumber(transferValue) || 0;
    const acquisition = parseNumber(acquisitionValue) || 0;
    const expenses = parseNumber(otherExpenses) || 0;
    return transfer - acquisition - expenses;
}

// Format acquisition date
function formatAcquisitionDate(index, input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length === 8) {
        // Validate date
        const year = parseInt(value.substring(0, 4));
        const month = parseInt(value.substring(4, 6));
        const day = parseInt(value.substring(6, 8));
        
        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            input.value = value;
            updateInventoryRow(index, 'acquisition_date', value);
        } else {
            alert('올바른 날짜 형식이 아닙니다. (YYYYMMDD)');
            input.value = '';
        }
    } else if (value.length > 0) {
        alert('날짜는 8자리 숫자여야 합니다. (예: 20250101)');
        input.value = '';
    }
}

// Format transfer date and calculate deadline
function formatTransferDate(index, input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length === 8) {
        // Validate date
        const year = parseInt(value.substring(0, 4));
        const month = parseInt(value.substring(4, 6));
        const day = parseInt(value.substring(6, 8));
        
        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            input.value = value;
            updateInventoryRow(index, 'transfer_date', value);
            
            // Calculate report deadline (2 months after)
            const transferDate = new Date(year, month - 1, day);
            transferDate.setMonth(transferDate.getMonth() + 2);
            const deadline = transferDate.toISOString().split('T')[0];
            updateInventoryRow(index, 'report_deadline', deadline);
            
            renderInventoryTable();
        } else {
            alert('올바른 날짜 형식이 아닙니다. (YYYYMMDD)');
            input.value = '';
        }
    } else if (value.length > 0) {
        alert('날짜는 8자리 숫자여야 합니다. (예: 20250405)');
        input.value = '';
    }
}

// Update inventory row
function updateInventoryRow(index, field, value) {
    if (inventoryRows[index]) {
        inventoryRows[index][field] = value;
        
        // Recalculate transfer income if necessary
        if (field === 'transfer_value' || field === 'acquisition_value' || field === 'other_expenses') {
            const transferIncome = calculateTransferIncome(
                inventoryRows[index].transfer_value,
                inventoryRows[index].acquisition_value,
                inventoryRows[index].other_expenses
            );
            inventoryRows[index].transfer_income = transferIncome;
        }
        
        saveInventoryData();
        renderInventoryTable();
    }
}

// Delete inventory row
function deleteInventoryRow(index) {
    if (confirm('이 물건을 삭제하시겠습니까?')) {
        inventoryRows.splice(index, 1);
        saveInventoryData();
        renderInventoryTable();
        showNotification('물건이 삭제되었습니다.', 'success');
    }
}

// Add inventory row
function addInventoryRow() {
    inventoryRows.push({
        property_name: '물건' + (inventoryRows.length + 1),
        address: '',
        area: '',
        acquisition_value: 0,
        acquisition_date: '',
        transfer_value: 0,
        transfer_date: '',
        other_expenses: 0,
        transfer_income: 0,
        progress_stage: '미확인',
        report_deadline: '',
        prepaid_income_tax: 0,
        prepaid_local_tax: 0,
        over_85: 'N',
        comparative_tax: 'N',
        expenses: []
    });
    saveInventoryData();
    renderInventoryTable();
    showNotification('새 행이 추가되었습니다.', 'success');
}
