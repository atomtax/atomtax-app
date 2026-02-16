// Check authentication
(function() {
    const user = checkAuth();
    if (user) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userRole').textContent = user.role === 'admin' ? '관리자' : '매니저';
        document.getElementById('userAvatar').textContent = user.name.charAt(0);
    }
})();

// Get client ID from URL
const urlParams = new URLSearchParams(window.location.search);
let clientId = urlParams.get('id');

// Preview mode: generate a temporary ID if none provided
if (!clientId) {
    console.warn('⚠️ No client ID provided - entering Preview mode');
    clientId = 'preview-mode-' + Date.now();
    // Don't redirect, just use preview mode
}

let clientData = null;
let inventoryRows = [];
let currentPropertyIndex = -1; // 현재 편집 중인 물건 인덱스
let detailExpenseRows = [];
const EXPENSE_ROW_COUNT = 10; // 엑셀처럼 미리 생성할 행 수
let expandedRows = new Set(); // 펼쳐진 행 추적

// Format number with commas
function formatNumber(num) {
    if (!num || num === '' || isNaN(num)) return '';
    return Number(num).toLocaleString('ko-KR');
}

// Parse number from formatted string
function parseNumber(str) {
    if (!str || str === '') return 0;
    return Number(String(str).replace(/,/g, ''));
}

// Load client data
async function loadClientData() {
    try {
        showLoading();
        
        // Try to fetch from API
        try {
            const response = await fetch(`tables/clients/${clientId}`);
            if (!response.ok) throw new Error('데이터 로드 실패');
            
            clientData = await response.json();
        } catch (fetchError) {
            console.warn('API 호출 실패 - Preview 모드로 전환합니다:', fetchError);
            // Preview mode: use mock data
            clientData = {
                id: clientId,
                company_name: '테스트 매매사업자 (Preview 모드)',
                manager: '김철수',
                business_code: '703011',
                ceo_name: '홍길동',
                contact: '010-1234-5678',
                address: '서울시 강남구 테헤란로 123'
            };
        }
        
        document.getElementById('pageTitle').textContent = clientData.company_name || '매매사업자 상세';
        
        // Setup Real Estate Drive button
        const realEstateDriveBtn = document.getElementById('realEstateDriveBtn');
        if (clientData.real_estate_drive_folder) {
            realEstateDriveBtn.setAttribute('data-url', clientData.real_estate_drive_folder);
            realEstateDriveBtn.disabled = false;
            realEstateDriveBtn.style.opacity = '1';
            realEstateDriveBtn.style.cursor = 'pointer';
        } else {
            realEstateDriveBtn.setAttribute('data-url', '');
            realEstateDriveBtn.disabled = true;
            realEstateDriveBtn.style.opacity = '0.5';
            realEstateDriveBtn.style.cursor = 'not-allowed';
            realEstateDriveBtn.title = '부동산 폴더 URL이 설정되지 않았습니다';
        }
        
        // Load inventory data
        await loadInventoryData();
        
        hideLoading();
    } catch (error) {
        console.error('Error loading client:', error);
        showNotification('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
        hideLoading();
    }
}

// Calculate report deadline (양도일의 말일로부터 2개월)
function calculateReportDeadline(transferDate) {
    if (!transferDate) return '';
    
    try {
        const date = new Date(transferDate);
        // Get last day of the month
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        // Add 2 months
        const deadline = new Date(lastDay.getFullYear(), lastDay.getMonth() + 3, 0);
        
        const year = deadline.getFullYear();
        const month = String(deadline.getMonth() + 1).padStart(2, '0');
        const day = String(deadline.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch {
        return '';
    }
}

// Format date input: 20250405 -> 2025-04-05
function formatDateInput(value) {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // If 8 digits, format as YYYY-MM-DD
    if (numbers.length === 8) {
        const year = numbers.substring(0, 4);
        const month = numbers.substring(4, 6);
        const day = numbers.substring(6, 8);
        return `${year}-${month}-${day}`;
    }
    
    return value;
}

// Calculate transfer income: 양도가액 - 취득가액 - 기타필요경비
function calculateTransferIncome(transferValue, acquisitionValue, otherExpenses) {
    const transfer = parseNumber(transferValue) || 0;
    const acquisition = parseNumber(acquisitionValue) || 0;
    const other = parseNumber(otherExpenses) || 0;
    return transfer - acquisition - other;
}

// Add inventory row
function addInventoryRow() {
    const row = {
        property_name: '물건' + (inventoryRows.length + 1),
        address: '',
        acquisition_value: 0,
        other_expenses: 0,
        transfer_value: 0,
        transfer_income: 0,
        acquisition_date: '',       // 취득일
        transfer_date: '',
        report_deadline: '',
        prepaid_income_tax: 0,      // 기납부 종소세
        prepaid_local_tax: 0,       // 기납부 지방소득세
        over_85: 'N',
        comparative_tax: 'N',       // 비교과세 여부
        progress_stage: '미확인',   // 진행단계
        expenses: [] // 물건별 필요경비 상세
    };
    
    inventoryRows.push(row);
    
    // Auto-save to localStorage
    localStorage.setItem(`trader_inventory_${clientId}`, JSON.stringify(inventoryRows));
    
    renderInventoryTable();
}

// Render inventory table
function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    
    if (inventoryRows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="padding: 20px; text-align: center; color: #9ca3af;">
                    데이터를 입력하세요.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = inventoryRows.map((row, index) => {
        // Calculate transfer income
        const transferIncome = calculateTransferIncome(row.transfer_value, row.acquisition_value, row.other_expenses);
        row.transfer_income = transferIncome;
        
        return `
        <!-- 첫 번째 줄: 기본 정보 (클릭 가능) -->
        <tr onclick="toggleDetailRow(${index})" style="cursor: pointer; background: ${index % 2 === 0 ? 'white' : '#f9fafb'};">
            <td>
                <a href="javascript:void(0)" class="property-link" onclick="event.stopPropagation(); openExpenseSection(${index})">
                    ${row.property_name || '물건' + (index + 1)}
                </a>
            </td>
            <td style="background: #f0f9ff;">
                <input type="text" class="trader-input" value="${formatNumber(row.acquisition_value) || ''}" 
                       readonly onclick="event.stopPropagation()" style="background: #f0f9ff; text-align: right;">
            </td>
            <td style="background: #f0fdf4;">
                <input type="text" class="trader-input" value="${formatNumber(row.other_expenses) || ''}" 
                       readonly onclick="event.stopPropagation()" style="background: #f0fdf4; text-align: right;">
            </td>
            <td>
                <input type="text" class="trader-input" value="${formatNumber(row.transfer_value) || ''}" 
                       onchange="updateInventoryRow(${index}, 'transfer_value', parseNumber(this.value))"
                       onblur="this.value = formatNumber(parseNumber(this.value))"
                       onclick="event.stopPropagation()"
                       placeholder="0" style="text-align: right;">
            </td>
            <td style="background: #fef3c7;">
                <input type="text" class="trader-input" value="${formatNumber(transferIncome) || ''}" 
                       readonly onclick="event.stopPropagation()" style="background: #fef3c7; text-align: right;">
            </td>
            <td>
                <input type="text" class="trader-input" value="${row.acquisition_date || ''}" 
                       onchange="updateInventoryRow(${index}, 'acquisition_date', this.value)"
                       onblur="formatAcquisitionDate(${index}, this)"
                       onclick="event.stopPropagation()"
                       placeholder="20250101" maxlength="10" style="text-align: center;">
            </td>
            <td>
                <input type="text" class="trader-input" value="${row.transfer_date || ''}" 
                       onchange="updateInventoryRow(${index}, 'transfer_date', this.value)"
                       onblur="formatTransferDate(${index}, this)"
                       onclick="event.stopPropagation()"
                       placeholder="20250405" maxlength="10" style="text-align: center;">
            </td>
            <td style="background: #fef3c7;">
                <input type="date" class="trader-input" value="${row.report_deadline || ''}" readonly
                       onclick="event.stopPropagation()" style="background: #fef3c7; text-align: center;">
            </td>
        </tr>
        <!-- 두 번째 줄: 상세 정보 (접을 수 있음) -->
        <tr id="detail-row-${index}" style="display: none; background: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
            <td colspan="8" style="padding: 12px 20px;">
                <div style="display: grid; grid-template-columns: 2fr repeat(4, 1fr); gap: 12px; align-items: end;">
                    <div>
                        <label style="font-size: 11px; color: #6b7280; font-weight: 600; display: block; margin-bottom: 4px;">소재지</label>
                        <input type="text" class="trader-input" value="${row.address || ''}" 
                               onchange="updateInventoryRow(${index}, 'address', this.value)" 
                               placeholder="소재지">
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #6b7280; font-weight: 600; display: block; margin-bottom: 4px;">기납부 종소세</label>
                        <input type="text" class="trader-input" value="${formatNumber(row.prepaid_income_tax || 0)}" 
                               onchange="updateInventoryRow(${index}, 'prepaid_income_tax', parseNumber(this.value))"
                               onblur="this.value = formatNumber(parseNumber(this.value))"
                               placeholder="0" style="text-align: right;">
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #6b7280; font-weight: 600; display: block; margin-bottom: 4px;">기납부 지방소득세</label>
                        <input type="text" class="trader-input" value="${formatNumber(row.prepaid_local_tax || 0)}" 
                               onchange="updateInventoryRow(${index}, 'prepaid_local_tax', parseNumber(this.value))"
                               onblur="this.value = formatNumber(parseNumber(this.value))"
                               placeholder="0" style="text-align: right;">
                    </div>
                    <div style="display: flex; gap: 8px; align-items: end;">
                        <div style="flex: 1;">
                            <label style="font-size: 11px; color: #6b7280; font-weight: 600; display: block; margin-bottom: 4px;">85초과</label>
                            <select class="trader-input" onchange="updateInventoryRow(${index}, 'over_85', this.value)" style="text-align: center;">
                                <option value="Y" ${row.over_85 === 'Y' ? 'selected' : ''}>Y</option>
                                <option value="N" ${row.over_85 === 'N' ? 'selected' : ''}>N</option>
                            </select>
                        </div>
                        <div style="flex: 1;">
                            <label style="font-size: 11px; color: #6b7280; font-weight: 600; display: block; margin-bottom: 4px;">비교과세</label>
                            <select class="trader-input" onchange="updateInventoryRow(${index}, 'comparative_tax', this.value)" style="text-align: center;">
                                <option value="Y" ${row.comparative_tax === 'Y' ? 'selected' : ''}>Y</option>
                                <option value="N" ${(row.comparative_tax === 'N' || !row.comparative_tax) ? 'selected' : ''}>N</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #6b7280; font-weight: 600; display: block; margin-bottom: 4px;">진행단계</label>
                        <select class="trader-input status-${row.progress_stage || '미확인'}" 
                                onchange="updateInventoryRow(${index}, 'progress_stage', this.value)" 
                                style="text-align: center; border: none; cursor: pointer; font-weight: 600;">
                            <option value="미확인" ${(row.progress_stage === '미확인' || !row.progress_stage) ? 'selected' : ''}>미확인</option>
                            <option value="확인" ${row.progress_stage === '확인' ? 'selected' : ''}>확인</option>
                            <option value="위하고입력" ${row.progress_stage === '위하고입력' ? 'selected' : ''}>위하고입력</option>
                            <option value="고객안내" ${row.progress_stage === '고객안내' ? 'selected' : ''}>고객안내</option>
                            <option value="신고완료" ${row.progress_stage === '신고완료' ? 'selected' : ''}>신고완료</option>
                        </select>
                    </div>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="trader-btn btn-upload-document" onclick="event.stopPropagation(); document.getElementById('documentUpload_${index}').click()" 
                            style="padding: 6px 12px; font-size: 12px;">
                        <i class="fas fa-file-upload"></i> 서류 업로드
                    </button>
                    <input type="file" id="documentUpload_${index}" accept=".pdf,.jpg,.jpeg,.png" multiple style="display: none;" 
                           onchange="handlePropertyDocumentUpload(event, ${index})">
                    <button class="trader-btn trader-btn-info" onclick="event.stopPropagation(); showReferenceData(${index})" 
                            style="padding: 6px 12px; font-size: 12px; background: #3b82f6; border-color: #3b82f6; color: white;">
                        <i class="fas fa-info-circle"></i> 입력참고용
                    </button>
                    <button class="trader-btn trader-btn-primary" onclick="event.stopPropagation(); calculateTaxesWithoutClose(${index})" 
                            style="padding: 6px 12px; font-size: 12px;">
                        <i class="fas fa-calculator"></i> 세금계산
                    </button>
                    <button class="trader-btn trader-btn-success" onclick="event.stopPropagation(); generatePropertyReport(${index})" 
                            style="padding: 6px 12px; font-size: 12px; background: #10b981;">
                        <i class="fas fa-file-alt"></i> 보고서
                    </button>
                    <button class="trader-btn" onclick="event.stopPropagation(); deleteInventoryRow(${index})" 
                            style="padding: 6px 12px; font-size: 12px; background: #ef4444; border-color: #ef4444; color: white;">
                        <i class="fas fa-trash-alt"></i> 삭제
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
    
    // Restore expanded rows
    expandedRows.forEach(index => {
        const detailRow = document.getElementById(`detail-row-${index}`);
        if (detailRow) {
            detailRow.style.display = 'table-row';
        }
    });
}

// Format transfer date on blur
function formatTransferDate(index, element) {
    const formatted = formatDateInput(element.value);
    element.value = formatted;
    updateInventoryRow(index, 'transfer_date', formatted);
}

// Format acquisition date on blur
function formatAcquisitionDate(index, element) {
    const formatted = formatDateInput(element.value);
    element.value = formatted;
    updateInventoryRow(index, 'acquisition_date', formatted);
}

// Delete inventory row with confirmation
function deleteInventoryRow(index) {
    const property = inventoryRows[index];
    const propertyName = property.property_name || '물건' + (index + 1);
    
    if (confirm(`정말로 "${propertyName}" 행을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
        inventoryRows.splice(index, 1);
        
        // Auto-save to localStorage
        localStorage.setItem(`trader_inventory_${clientId}`, JSON.stringify(inventoryRows));
        
        // Re-render table
        renderInventoryTable();
        
        showNotification('물건이 삭제되었습니다.', 'success');
    }
}

// Toggle detail row visibility
function toggleDetailRow(index) {
    const detailRow = document.getElementById(`detail-row-${index}`);
    
    if (detailRow.style.display === 'none') {
        detailRow.style.display = 'table-row';
        expandedRows.add(index);
    } else {
        detailRow.style.display = 'none';
        expandedRows.delete(index);
    }
}

// Calculate taxes without closing the detail row
function calculateTaxesWithoutClose(index) {
    calculateTaxes(index);
    // Don't toggle - keep the row open
}

// Update inventory row
function updateInventoryRow(index, field, value) {
    inventoryRows[index][field] = value;
    
    // Auto-calculate report deadline when transfer_date changes
    if (field === 'transfer_date') {
        inventoryRows[index].report_deadline = calculateReportDeadline(value);
    }
    
    // Auto-save to localStorage
    localStorage.setItem(`trader_inventory_${clientId}`, JSON.stringify(inventoryRows));
    
    // Re-render to update calculated values
    renderInventoryTable();
}

// Open expense section for a property
function openExpenseSection(index) {
    currentPropertyIndex = index;
    const property = inventoryRows[index];
    
    // Set property name input
    document.getElementById('expensePropertyNameInput').value = property.property_name || '물건' + (index + 1);
    
    // Load expenses for this property (or create empty rows)
    initializeDetailExpenseRows(property.expenses || []);
    
    renderDetailExpensesTable();
    calculateDetailExpenseTotals();
    
    // Show section - 부드러운 애니메이션 없이 즉시 표시
    const section = document.getElementById('expenseDetailSection');
    section.classList.add('active');
    
    // 즉시 스크롤 (smooth 제거)
    section.scrollIntoView({ block: 'nearest' });
}

// Close expense section
function closeExpenseSection() {
    document.getElementById('expenseDetailSection').classList.remove('active');
    currentPropertyIndex = -1;
}

// Update property name
function updatePropertyName() {
    if (currentPropertyIndex === -1) return;
    
    const newName = document.getElementById('expensePropertyNameInput').value.trim();
    if (newName) {
        inventoryRows[currentPropertyIndex].property_name = newName;
        renderInventoryTable();
    }
}

// Initialize detail expense rows (10 rows like Excel)
function initializeDetailExpenseRows(existingData = []) {
    detailExpenseRows = [];
    
    for (let i = 0; i < EXPENSE_ROW_COUNT; i++) {
        if (i < existingData.length) {
            // Use existing data
            detailExpenseRows.push({
                no: i + 1,
                expense_name: existingData[i].expense_name || '',
                category: existingData[i].category || '취득가액',
                amount: existingData[i].amount || 0,
                preliminary_approved: existingData[i].preliminary_approved || 'O',
                income_tax_approved: existingData[i].income_tax_approved || 'O',
                note: existingData[i].note || ''
            });
        } else {
            // Create empty row
            detailExpenseRows.push({
                no: i + 1,
                expense_name: '',
                category: '취득가액',
                amount: 0,
                preliminary_approved: 'O',
                income_tax_approved: 'O',
                note: ''
            });
        }
    }
}

// Render detail expenses table
function renderDetailExpensesTable() {
    const tbody = document.getElementById('expenseDetailTableBody');
    
    tbody.innerHTML = detailExpenseRows.map((row, index) => `
        <tr>
            <td style="text-align: center; font-weight: 600; color: #667eea;">
                ${row.no}
            </td>
            <td>
                <select class="trader-input" onchange="updateDetailExpenseRow(${index}, 'expense_name', this.value)">
                    <option value="" ${!row.expense_name ? 'selected' : ''}>선택</option>
                    <option value="취득가액" ${row.expense_name === '취득가액' ? 'selected' : ''}>취득가액</option>
                    <option value="취득세 등" ${row.expense_name === '취득세 등' ? 'selected' : ''}>취득세 등</option>
                    <option value="신탁말소비용" ${row.expense_name === '신탁말소비용' ? 'selected' : ''}>신탁말소비용</option>
                    <option value="중개수수료" ${row.expense_name === '중개수수료' ? 'selected' : ''}>중개수수료</option>
                    <option value="관리비 정산" ${row.expense_name === '관리비 정산' ? 'selected' : ''}>관리비 정산</option>
                    <option value="기타비용" ${row.expense_name === '기타비용' ? 'selected' : ''}>기타비용</option>
                </select>
            </td>
            <td>
                <select class="trader-input" onchange="updateDetailExpenseRow(${index}, 'category', this.value)">
                    <option value="취득가액" ${row.category === '취득가액' ? 'selected' : ''}>취득가액</option>
                    <option value="기타필요경비" ${row.category === '기타필요경비' ? 'selected' : ''}>기타필요경비</option>
                </select>
            </td>
            <td>
                <input type="text" class="trader-input" value="${formatNumber(row.amount) || ''}" 
                       onchange="updateDetailExpenseRow(${index}, 'amount', parseNumber(this.value))"
                       onblur="this.value = formatNumber(parseNumber(this.value))"
                       placeholder="0" style="text-align: right;">
            </td>
            <td>
                <select class="trader-input" onchange="updateDetailExpenseRow(${index}, 'preliminary_approved', this.value)">
                    <option value="O" ${row.preliminary_approved === 'O' ? 'selected' : ''}>O</option>
                    <option value="X" ${row.preliminary_approved === 'X' ? 'selected' : ''}>X</option>
                </select>
            </td>
            <td>
                <select class="trader-input" onchange="updateDetailExpenseRow(${index}, 'income_tax_approved', this.value)">
                    <option value="O" ${row.income_tax_approved === 'O' ? 'selected' : ''}>O</option>
                    <option value="X" ${row.income_tax_approved === 'X' ? 'selected' : ''}>X</option>
                </select>
            </td>
            <td>
                <input type="text" class="trader-input" value="${row.note || ''}" 
                       onchange="updateDetailExpenseRow(${index}, 'note', this.value)" 
                       placeholder="비고">
            </td>
            <td style="text-align: center;">
                <button class="trader-btn trader-btn-danger" onclick="clearDetailExpenseRow(${index})" 
                        style="padding: 4px 8px; font-size: 11px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Clear detail expense row (초기화)
function clearDetailExpenseRow(index) {
    detailExpenseRows[index] = {
        no: index + 1,
        expense_name: '',
        category: '취득가액',
        amount: 0,
        preliminary_approved: 'O',
        income_tax_approved: 'O',
        note: ''
    };
    renderDetailExpensesTable();
    calculateDetailExpenseTotals();
    showNotification(`${index + 1}번 행이 초기화되었습니다.`, 'success');
}

// Update detail expense row
function updateDetailExpenseRow(index, field, value) {
    detailExpenseRows[index][field] = value;
    calculateDetailExpenseTotals();
}

// Calculate detail expense totals
function calculateDetailExpenseTotals() {
    let acquisitionTotal = 0;
    let otherExpensesTotal = 0;
    
    detailExpenseRows.forEach(row => {
        const amount = parseNumber(row.amount) || 0;
        // Only count if row has expense_name AND 예정신고 비용인정이 'O' (not empty row)
        if (row.expense_name && row.expense_name.trim() !== '' && row.preliminary_approved === 'O') {
            if (row.category === '취득가액') {
                acquisitionTotal += amount;
            } else if (row.category === '기타필요경비') {
                otherExpensesTotal += amount;
            }
        }
    });
    
    document.getElementById('detailAcquisitionTotal').textContent = formatNumber(acquisitionTotal) + '원';
    document.getElementById('detailOtherExpensesTotal').textContent = formatNumber(otherExpensesTotal) + '원';
}

// Save detail expenses and update inventory
function saveDetailExpenses() {
    if (currentPropertyIndex === -1) return;
    
    // Filter out empty rows
    const validExpenses = detailExpenseRows.filter(row => 
        row.expense_name && row.expense_name.trim() !== ''
    );
    
    // Save expenses to current property
    inventoryRows[currentPropertyIndex].expenses = validExpenses;
    
    // Calculate totals
    let acquisitionTotal = 0;
    let otherExpensesTotal = 0;
    
    validExpenses.forEach(row => {
        const amount = parseNumber(row.amount) || 0;
        // Only count if 예정신고 비용인정 = 'O'
        if (row.preliminary_approved === 'O') {
            if (row.category === '취득가액') {
                acquisitionTotal += amount;
            } else if (row.category === '기타필요경비') {
                otherExpensesTotal += amount;
            }
        }
    });
    
    // Update inventory row with calculated totals
    inventoryRows[currentPropertyIndex].acquisition_value = acquisitionTotal;
    inventoryRows[currentPropertyIndex].other_expenses = otherExpensesTotal;
    
    // Save to localStorage immediately
    localStorage.setItem(`trader_inventory_${clientId}`, JSON.stringify(inventoryRows));
    console.log('Auto-saved inventory data to localStorage');
    
    // Re-render inventory table (will recalculate transfer income)
    renderInventoryTable();
    
    // Don't close section - keep it open for continued editing
    // closeExpenseSection();
    
    showNotification('필요경비가 저장되고 재고자산 정리에 반영되었습니다.', 'success');
}

// Load inventory data
async function loadInventoryData() {
    try {
        console.log('🔄 Loading inventory data for clientId:', clientId);
        
        // Load from localStorage
        const storageKey = `trader_inventory_${clientId}`;
        const savedData = localStorage.getItem(storageKey);
        
        console.log('📦 Storage key:', storageKey);
        console.log('📦 Raw data:', savedData ? savedData.substring(0, 200) + '...' : 'null');
        
        if (savedData) {
            inventoryRows = JSON.parse(savedData);
            console.log('✅ Loaded inventory data:', inventoryRows.length, 'rows');
            console.log('📊 Sample data:', inventoryRows[0]);
        } else {
            console.warn('⚠️ No saved data found in localStorage');
            inventoryRows = [];
            
            // Show notification to user
            showNotification('저장된 데이터가 없습니다. "엑셀 업로드" 버튼으로 데이터를 추가하세요.', 'info');
        }
        
        renderInventoryTable();
    } catch (error) {
        console.error('❌ Error loading inventory data:', error);
        inventoryRows = [];
        renderInventoryTable();
        showNotification('데이터 로드 중 오류가 발생했습니다.', 'error');
    }
}

// Save inventory data
async function saveInventoryData() {
    try {
        showLoading();
        
        // Save to localStorage
        localStorage.setItem(`trader_inventory_${clientId}`, JSON.stringify(inventoryRows));
        console.log('Saved inventory data to localStorage:', inventoryRows);
        
        // TODO: Save to API when backend is ready
        // const response = await fetch(`tables/trader_inventory`, {
        //     method: 'POST',
        //     headers: {'Content-Type': 'application/json'},
        //     body: JSON.stringify({
        //         client_id: clientId,
        //         inventory: inventoryRows
        //     })
        // });
        
        showNotification('재고자산 정리 데이터가 저장되었습니다.', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error saving inventory:', error);
        showNotification('저장 중 오류가 발생했습니다.', 'error');
        hideLoading();
    }
}

// Add CSS for table inputs (simplified)
const style = document.createElement('style');
style.textContent = `
    .mr-2 {
        margin-right: 8px;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Storage event listener for cross-tab synchronization
// Note: storage event only fires in OTHER tabs, not the current tab
window.addEventListener('storage', function(e) {
    // Check if it's our trader inventory data
    if (e.key === `trader_inventory_${clientId}` && e.newValue) {
        console.log('✅ localStorage changed by another tab - reloading data');
        
        // Reload inventory data
        try {
            const newData = JSON.parse(e.newValue);
            inventoryRows = newData;
            renderInventoryTable();
            
            // Show notification
            showNotification('다른 탭에서 데이터가 업데이트되었습니다.', 'info');
        } catch (error) {
            console.error('Failed to reload inventory data:', error);
        }
    }
});

// Debug localStorage
window.debugLocalStorage = function() {
    console.clear();
    console.log('🔍 ========== localStorage Debug ==========');
    console.log('📌 Current Client ID:', clientId);
    console.log('📌 Expected Storage Key:', `trader_inventory_${clientId}`);
    console.log('');
    
    // List all trader inventory keys
    console.log('📦 All trader_inventory keys:');
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('trader_inventory_'));
    
    if (allKeys.length === 0) {
        console.warn('⚠️ No trader inventory data found in localStorage!');
    } else {
        allKeys.forEach(key => {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                console.log(`  ✅ ${key}: ${data.length} items`);
                
                if (data.length > 0) {
                    console.log(`     첫 번째 물건:`, data[0].property_name);
                }
            } catch (e) {
                console.error(`  ❌ ${key}: Parse error`);
            }
        });
    }
    
    console.log('');
    console.log('📊 Current inventoryRows:', inventoryRows.length, 'items');
    if (inventoryRows.length > 0) {
        console.log('   첫 번째 물건:', inventoryRows[0]);
    }
    
    console.log('');
    console.log('🔧 All localStorage keys:');
    Object.keys(localStorage).forEach(key => {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        console.log(`  - ${key}: ${(size / 1024).toFixed(2)} KB`);
    });
    
    console.log('');
    console.log('💡 Tip: localStorage에 데이터가 없다면:');
    console.log('   1) "매매사업자 데이터" 페이지로 이동');
    console.log('   2) "엑셀 업로드" 버튼으로 데이터 추가');
    console.log('   3) 또는 "체크리스트" 페이지에서 데이터 확인');
    console.log('==========================================');
    
    // Show alert with summary
    const summary = allKeys.length === 0 
        ? '⚠️ localStorage에 매매사업자 데이터가 없습니다!\n\n"매매사업자 데이터" 페이지에서 "엑셀 업로드"로 데이터를 추가하세요.'
        : `📦 총 ${allKeys.length}개의 고객 데이터 발견\n\n현재 고객 (${clientId}):\n- 물건 수: ${inventoryRows.length}개\n\n자세한 내용은 콘솔(F12)을 확인하세요.`;
    
    alert(summary);
};

// Custom event for same-tab synchronization (optional enhancement)
window.addEventListener('trader_inventory_updated', function(e) {
    if (e.detail && e.detail.clientId === clientId) {
        console.log('✅ Custom event received - reloading data');
        inventoryRows = e.detail.data;
        renderInventoryTable();
    }
});

// Helper function to show notifications
function showNotification(message, type = 'info') {
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    const icon = icons[type] || icons.info;
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `${icon} ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// 엑셀 업로드/다운로드 기능
// ============================================

// 엑셀 양식 다운로드
function downloadExcelTemplate() {
    // SheetJS 라이브러리 체크 (더 명확한 오류 메시지)
    if (typeof XLSX === 'undefined') {
        alert('엑셀 라이브러리가 로드되지 않았습니다.\n페이지를 새로고침한 후 다시 시도해주세요.');
        console.error('XLSX library not loaded');
        return;
    }
    
    try {
        // 워크북 생성
        const wb = XLSX.utils.book_new();
        
        // Sheet 1: 물건목록
        const inventoryData = [
            ['거래처명*', '물건명', '소재지', '취득일(YYYYMMDD)', '양도일(YYYYMMDD)', '양도가액', '기납부 종소세', '기납부 지방소득세', '신고기한', '85초과(O/X)', '비고'],
            ['예: (주)아톰세무회계', '예: 서울시 강남구 아파트', '서울시 강남구 테헤란로 123', '20240115', '20250115', '150000000', '1000000', '100000', '', 'O', '참고사항'],
            ['', '', '', '', '', '', '', '', '', '', '']
        ];
        
        const ws1 = XLSX.utils.aoa_to_sheet(inventoryData);
        
        // 컬럼 너비 설정
        ws1['!cols'] = [
            {wch: 20}, // 거래처명
            {wch: 25}, // 물건명
            {wch: 35}, // 소재지
            {wch: 18}, // 취득일
            {wch: 18}, // 양도일
            {wch: 15}, // 양도가액
            {wch: 15}, // 기납부 종소세
            {wch: 18}, // 기납부 지방소득세
            {wch: 15}, // 신고기한
            {wch: 12}, // 85초과
            {wch: 20}  // 비고
        ];
        
        XLSX.utils.book_append_sheet(wb, ws1, '물건목록');
        
        // Sheet 2: 필요경비 상세
        const expenseData = [
            ['거래처명*', '물건명*', '번호', '비용명', '구분(취득가액/기타필요경비)', '금액', '비용인정(O/X)', '비고'],
            ['예: (주)아톰세무회계', '예: 서울시 강남구 아파트', '1', '취득가액', '취득가액', '100000000', 'O', ''],
            ['예: (주)아톰세무회계', '예: 서울시 강남구 아파트', '2', '취득세 등', '취득가액', '5000000', 'O', ''],
            ['예: (주)아톰세무회계', '예: 서울시 강남구 아파트', '3', '중개수수료', '기타필요경비', '2000000', 'O', ''],
            ['예: (주)아톰세무회계', '예: 서울시 강남구 아파트', '4', '신탁말소비용', '기타필요경비', '1000000', 'O', ''],
            ['', '', '', '', '', '', '', '']
        ];
        
        const ws2 = XLSX.utils.aoa_to_sheet(expenseData);
        
        // 컬럼 너비 설정
        ws2['!cols'] = [
            {wch: 20}, // 거래처명
            {wch: 25}, // 물건명
            {wch: 8},  // 번호
            {wch: 20}, // 비용명
            {wch: 28}, // 구분
            {wch: 15}, // 금액
            {wch: 15}, // 비용인정
            {wch: 20}  // 비고
        ];
        
        XLSX.utils.book_append_sheet(wb, ws2, '필요경비상세');
        
        // 파일 다운로드
        const fileName = `매매사업자_물건목록_양식_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showNotification('엑셀 양식이 다운로드되었습니다.', 'success');
    } catch (error) {
        console.error('Excel template download error:', error);
        alert('엑셀 양식 다운로드 중 오류가 발생했습니다.\n' + error.message);
    }
}

// 엑셀 업로드 처리
async function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // SheetJS 라이브러리 체크
    if (typeof XLSX === 'undefined') {
        alert('엑셀 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.');
        event.target.value = '';
        return;
    }
    
    try {
        showNotification('엑셀 파일을 읽는 중...', 'info');
        
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        
        // Sheet 1: 물건목록
        const inventorySheet = workbook.Sheets['물건목록'];
        if (!inventorySheet) {
            throw new Error('물건목록 시트를 찾을 수 없습니다.');
        }
        
        const inventoryJson = XLSX.utils.sheet_to_json(inventorySheet, { defval: '' });
        
        // Sheet 2: 필요경비상세
        const expenseSheet = workbook.Sheets['필요경비상세'];
        const expenseJson = expenseSheet ? XLSX.utils.sheet_to_json(expenseSheet, { defval: '' }) : [];
        
        // 데이터 검증 및 변환
        const result = await processExcelData(inventoryJson, expenseJson);
        
        if (result.success) {
            showNotification(`성공적으로 업로드되었습니다!\n물건: ${result.inventoryCount}개, 경비: ${result.expenseCount}개`, 'success');
            
            // 데이터 리로드
            await loadClientData();
        } else {
            throw new Error(result.message || '데이터 처리 중 오류가 발생했습니다.');
        }
        
    } catch (error) {
        console.error('엑셀 업로드 실패:', error);
        showNotification(`업로드 실패: ${error.message}`, 'error');
    } finally {
        event.target.value = ''; // 파일 입력 초기화
    }
}

// 엑셀 데이터 처리 및 저장
async function processExcelData(inventoryData, expenseData) {
    try {
        // 현재 거래처명 가져오기
        let companyName = '';
        
        if (clientData && clientData.company_name) {
            companyName = clientData.company_name.trim();
        }
        
        // 물건목록 처리
        const processedInventory = [];
        
        for (const row of inventoryData) {
            // 거래처명 확인 (첫 번째 컬럼 이름이 다를 수 있으므로 유연하게 처리)
            const rowCompanyName = (row['거래처명*'] || row['거래처명'] || row['회사명'] || '').toString().trim();
            
            // 현재 거래처와 일치하는 데이터만 처리
            if (companyName && rowCompanyName && rowCompanyName !== companyName) {
                continue; // 다른 거래처 데이터는 스킵
            }
            
            // 물건명이 없으면 스킵
            if (!row['물건명'] || row['물건명'].trim() === '') {
                continue;
            }
            
            // 취득일 변환 (YYYYMMDD → YYYY-MM-DD)
            let acquisitionDate = '';
            const acqDateStr = (row['취득일(YYYYMMDD)'] || row['취득일'] || '').toString().replace(/[^0-9]/g, '');
            if (acqDateStr.length === 8) {
                acquisitionDate = `${acqDateStr.substr(0, 4)}-${acqDateStr.substr(4, 2)}-${acqDateStr.substr(6, 2)}`;
            }
            
            // 양도일 변환 (YYYYMMDD → YYYY-MM-DD)
            let transferDate = '';
            const dateStr = (row['양도일(YYYYMMDD)'] || row['양도일'] || '').toString().replace(/[^0-9]/g, '');
            if (dateStr.length === 8) {
                transferDate = `${dateStr.substr(0, 4)}-${dateStr.substr(4, 2)}-${dateStr.substr(6, 2)}`;
            }
            
            // 신고기한 계산 (양도일이 속한 달의 말일로부터 2개월 후)
            let reportDeadline = '';
            if (transferDate) {
                const date = new Date(transferDate);
                date.setMonth(date.getMonth() + 3); // 2개월 후
                date.setDate(0); // 전 달의 마지막 날
                reportDeadline = date.toISOString().split('T')[0];
            }
            
            // 85초과 검증 (O/X 형식으로 변경)
            let over85 = (row['85초과(O/X)'] || row['85초과'] || 'X').toString().toUpperCase();
            // O/X 또는 Y/N 모두 허용
            if (over85 === 'O' || over85 === 'Y') {
                over85 = 'Y';
            } else {
                over85 = 'N';
            }
            
            const inventoryRow = {
                property_name: row['물건명'] || '',
                address: row['소재지'] || '',
                acquisition_value: 0, // 필요경비 상세에서 자동 계산
                other_expenses: 0, // 필요경비 상세에서 자동 계산
                transfer_value: parseFloat(row['양도가액'] || 0) || 0,
                transfer_income: 0, // 자동 계산
                acquisition_date: acquisitionDate,
                transfer_date: transferDate,
                report_deadline: reportDeadline,
                prepaid_income_tax: parseFloat(row['기납부 종소세'] || 0) || 0,
                prepaid_local_tax: parseFloat(row['기납부 지방소득세'] || 0) || 0,
                over_85: over85,
                progress_stage: '미확인',
                remarks: row['비고'] || '',
                expenses: [] // 나중에 매칭
            };
            
            // 양도소득 자동 계산
            inventoryRow.transfer_income = 
                inventoryRow.transfer_value - 
                inventoryRow.acquisition_value - 
                inventoryRow.other_expenses;
            
            processedInventory.push(inventoryRow);
        }
        
        // 필요경비 상세 처리 및 매칭
        for (const expenseRow of expenseData) {
            const rowCompanyName = (expenseRow['거래처명*'] || expenseRow['거래처명'] || expenseRow['회사명'] || '').toString().trim();
            const propertyName = (expenseRow['물건명*'] || expenseRow['물건명'] || '').toString().trim();
            
            // 현재 거래처와 일치하는 데이터만 처리
            if (companyName && rowCompanyName && rowCompanyName !== companyName) {
                continue;
            }
            
            // 물건명이 없으면 스킵
            if (!propertyName) {
                continue;
            }
            
            // 해당 물건 찾기
            const inventory = processedInventory.find(inv => inv.property_name === propertyName);
            if (!inventory) {
                continue; // 매칭되는 물건이 없으면 스킵
            }
            
            // 구분 검증
            let category = expenseRow['구분(취득가액/기타필요경비)'] || expenseRow['구분'] || '취득가액';
            if (category !== '취득가액' && category !== '기타필요경비') {
                category = '취득가액';
            }
            
            // 비용인정 검증
            let preliminary = (expenseRow['비용인정(O/X)'] || expenseRow['비용인정'] || 'O').toString().toUpperCase();
            if (preliminary !== 'O' && preliminary !== 'X') {
                preliminary = 'O';
            }
            
            const expense = {
                no: (inventory.expenses.length + 1),
                expense_name: expenseRow['비용명'] || '',
                category: category,
                amount: parseFloat(expenseRow['금액'] || 0) || 0,
                preliminary_approved: preliminary,
                remarks: expenseRow['비고'] || ''
            };
            
            inventory.expenses.push(expense);
        }
        
        // 필요경비에서 취득가액/기타필요경비 재계산
        for (const inventory of processedInventory) {
            let acquisitionSum = 0;
            let otherExpensesSum = 0;
            
            for (const expense of inventory.expenses) {
                if (expense.category === '취득가액') {
                    acquisitionSum += expense.amount;
                } else if (expense.category === '기타필요경비') {
                    otherExpensesSum += expense.amount;
                }
            }
            
            // 필요경비 상세가 있으면 합계로 덮어쓰기
            if (inventory.expenses.length > 0) {
                inventory.acquisition_value = acquisitionSum;
                inventory.other_expenses = otherExpensesSum;
                
                // 양도소득 재계산
                inventory.transfer_income = 
                    inventory.transfer_value - 
                    inventory.acquisition_value - 
                    inventory.other_expenses - 
                    inventory.disposal_cost;
            }
        }
        
        // localStorage에 저장 (기존 데이터 유지하면서 추가!)
        if (processedInventory.length > 0) {
            const storageKey = `trader_inventory_${clientId}`;
            
            // 🔹 기존 데이터 로드
            const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // 🔹 신규 데이터를 기존 데이터 뒤에 추가 (덮어쓰지 않음!)
            existingData.push(...processedInventory);
            
            // 🔹 합쳐진 데이터 저장
            inventoryRows = existingData;
            localStorage.setItem(storageKey, JSON.stringify(inventoryRows));
            
            return {
                success: true,
                inventoryCount: processedInventory.length,
                expenseCount: expenseData.length
            };
        } else {
            return {
                success: false,
                message: '처리할 데이터가 없습니다. 사업자번호를 확인해주세요.'
            };
        }
        
    } catch (error) {
        console.error('데이터 처리 오류:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Load on page load
loadClientData();

// Attach event listeners after page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Page loaded - attaching event listeners');
    
    // Make sure debugLocalStorage is accessible globally
    if (typeof window.debugLocalStorage !== 'function') {
        console.error('❌ debugLocalStorage not found!');
    } else {
        console.log('✅ debugLocalStorage is ready');
    }
});

// Calculate taxes (기납부 종소세 및 지방소득세)
function calculateTaxes(index) {
    const row = inventoryRows[index];
    
    // 비교과세일 경우 세금 0
    if (row.comparative_tax === 'Y') {
        row.prepaid_income_tax = 0;
        row.prepaid_local_tax = 0;
        renderInventoryTable();
        showNotification('비교과세 물건입니다. 세금이 0원으로 설정되었습니다.', 'info');
        return;
    }
    
    const transferIncome = row.transfer_income || 0;
    
    if (transferIncome <= 0) {
        showNotification('양도소득이 0 이하입니다. 세금을 계산할 수 없습니다.', 'error');
        return;
    }
    
    // 2024년 종합소득세율표
    const taxBrackets = [
        { limit: 14000000, rate: 0.06, deduction: 0 },
        { limit: 50000000, rate: 0.15, deduction: 1260000 },
        { limit: 88000000, rate: 0.24, deduction: 5760000 },
        { limit: 150000000, rate: 0.35, deduction: 15440000 },
        { limit: 300000000, rate: 0.38, deduction: 19940000 },
        { limit: 500000000, rate: 0.40, deduction: 25940000 },
        { limit: 1000000000, rate: 0.42, deduction: 35940000 },
        { limit: Infinity, rate: 0.45, deduction: 65940000 }
    ];
    
    // 과세표준에 해당하는 세율 찾기
    let taxRate = 0.06;
    let deduction = 0;
    
    for (const bracket of taxBrackets) {
        if (transferIncome <= bracket.limit) {
            taxRate = bracket.rate;
            deduction = bracket.deduction;
            break;
        }
    }
    
    // 종소세 계산: 양도소득 × 세율 - 누진공제 (1단위 버림)
    const incomeTax = Math.max(0, Math.floor((transferIncome * taxRate - deduction) / 10) * 10);
    
    // 지방소득세 계산: 종소세의 10% (1단위 버림)
    const localTax = Math.floor(incomeTax * 0.1 / 10) * 10;
    
    // 값 업데이트
    row.prepaid_income_tax = incomeTax;
    row.prepaid_local_tax = localTax;
    
    // 테이블 다시 렌더링
    renderInventoryTable();
    
    // 알림 표시
    showNotification(
        `세금 계산 완료!\n` +
        `기납부 종소세: ${formatNumber(incomeTax)}원\n` +
        `기납부 지방소득세: ${formatNumber(localTax)}원\n` +
        `(적용 세율: ${(taxRate * 100).toFixed(0)}%, 누진공제: ${formatNumber(deduction)}원)`,
        'success'
    );
}

// Generate property report
async function generatePropertyReport(index) {
    const property = inventoryRows[index];
    
    if (!property) {
        showNotification('물건 정보를 찾을 수 없습니다.', 'error');
        return;
    }
    
    // Calculate tax rate
    const transferIncome = property.transfer_income || 0;
    const taxBrackets = [
        { limit: 14000000, rate: 6, deduction: 0 },
        { limit: 50000000, rate: 15, deduction: 1260000 },
        { limit: 88000000, rate: 24, deduction: 5760000 },
        { limit: 150000000, rate: 35, deduction: 15440000 },
        { limit: 300000000, rate: 38, deduction: 19940000 },
        { limit: 500000000, rate: 40, deduction: 25940000 },
        { limit: 1000000000, rate: 42, deduction: 35940000 },
        { limit: Infinity, rate: 45, deduction: 65940000 }
    ];
    
    let taxRate = 6;
    let deduction = 0;
    
    for (const bracket of taxBrackets) {
        if (transferIncome <= bracket.limit) {
            taxRate = bracket.rate;
            deduction = bracket.deduction;
            break;
        }
    }
    
    const incomeTax = property.comparative_tax === 'Y' ? 0 : Math.floor((transferIncome * (taxRate / 100) - deduction) / 10) * 10;
    const localTax = Math.floor(incomeTax * 0.1 / 10) * 10;
    
    const expenses = property.expenses || [];
    
    // Helper function for formatting
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Generate report HTML (same structure as checklist report)
    const reportHTML = `
        <div style="font-family: 'Inter', sans-serif; max-width: 700px; margin: 0 auto;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #667eea;">
                <h1 style="font-size: 28px; font-weight: 800; color: #1f2937; margin: 0 0 10px 0;">토지등 매매차익 예정신고 보고서</h1>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <!-- Client Info -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">고객사명</div>
                        <div style="font-size: 16px; color: #1f2937; font-weight: 600;">${escapeHtml(clientData?.company_name || '-')}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">물건명</div>
                        <div style="font-size: 16px; color: #1f2937; font-weight: 600;">${escapeHtml(property.property_name)}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">양도일</div>
                        <div style="font-size: 16px; color: #1f2937; font-weight: 600;">${formatDateDisplay(property.transfer_date)}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">취득일</div>
                        <div style="font-size: 16px; color: #1f2937; font-weight: 600;">${formatDateDisplay(property.acquisition_date || '-')}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">납부기한</div>
                        <div style="font-size: 16px; color: #1f2937; font-weight: 600;">${formatDateDisplay(property.report_deadline)}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">비교과세</div>
                        <div>
                            <span style="padding: 4px 12px; border-radius: 6px; font-size: 14px; font-weight: 700; 
                                         background: ${property.comparative_tax === 'Y' ? '#dcfce7' : '#f3f4f6'}; 
                                         color: ${property.comparative_tax === 'Y' ? '#166534' : '#6b7280'};">
                                ${property.comparative_tax === 'Y' ? 'Y' : 'N'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Data Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: #667eea;">
                        <th style="padding: 12px; text-align: left; color: white; font-weight: 700; font-size: 14px; border: 1px solid #5568d3;">항목</th>
                        <th style="padding: 12px; text-align: right; color: white; font-weight: 700; font-size: 14px; border: 1px solid #5568d3;">금액</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background: white;">
                        <td style="padding: 12px; font-weight: 600; color: #1f2937; border: 1px solid #e5e7eb;">양도가액</td>
                        <td style="padding: 12px; text-align: right; font-weight: 600; color: #1f2937; border: 1px solid #e5e7eb;">${formatNumber(property.transfer_value || 0)}원</td>
                    </tr>
                    <tr style="background: #f9fafb;">
                        <td style="padding: 12px; font-weight: 600; color: #1f2937; border: 1px solid #e5e7eb;">취득가액</td>
                        <td style="padding: 12px; text-align: right; font-weight: 600; color: #1f2937; border: 1px solid #e5e7eb;">${formatNumber(property.acquisition_value || 0)}원</td>
                    </tr>
                    <tr style="background: white;">
                        <td style="padding: 12px; font-weight: 600; color: #1f2937; border: 1px solid #e5e7eb;">필요경비</td>
                        <td style="padding: 12px; text-align: right; font-weight: 600; color: #1f2937; border: 1px solid #e5e7eb;">${formatNumber(property.other_expenses || 0)}원</td>
                    </tr>
                    <tr style="background: #fef3c7;">
                        <td style="padding: 12px; font-weight: 700; color: #1f2937; border: 1px solid #e5e7eb;">양도차익 (양도소득)</td>
                        <td style="padding: 12px; text-align: right; font-weight: 700; color: #d97706; font-size: 16px; border: 1px solid #e5e7eb;">${formatNumber(transferIncome)}원</td>
                    </tr>
                    <tr style="background: #dbeafe;">
                        <td style="padding: 12px; font-weight: 700; color: #1f2937; border: 1px solid #e5e7eb;">세율</td>
                        <td style="padding: 12px; text-align: right; font-weight: 700; color: #1e40af; font-size: 16px; border: 1px solid #e5e7eb;">${taxRate}%</td>
                    </tr>
                    <tr style="background: #e0e7ff;">
                        <td style="padding: 12px; font-weight: 700; color: #1f2937; border: 1px solid #e5e7eb;">종합소득세</td>
                        <td style="padding: 12px; text-align: right; font-weight: 700; color: #1e40af; font-size: 16px; border: 1px solid #e5e7eb;">${formatNumber(incomeTax)}원</td>
                    </tr>
                    <tr style="background: #e0e7ff;">
                        <td style="padding: 12px; font-weight: 700; color: #1f2937; border: 1px solid #e5e7eb;">지방소득세</td>
                        <td style="padding: 12px; text-align: right; font-weight: 700; color: #1e40af; font-size: 16px; border: 1px solid #e5e7eb;">${formatNumber(localTax)}원</td>
                    </tr>
                    <tr style="background: #fef3c7;">
                        <td style="padding: 12px; font-weight: 700; color: #1f2937; border: 1px solid #e5e7eb;">💰 총 세금</td>
                        <td style="padding: 12px; text-align: right; font-weight: 700; color: #d97706; font-size: 18px; border: 1px solid #e5e7eb;">${formatNumber(incomeTax + localTax)}원</td>
                    </tr>
                </tbody>
            </table>
            
            ${expenses.length > 0 ? `
            <!-- Expenses Detail -->
            <div style="margin-top: 30px;">
                <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #667eea;">필요경비 상세</h3>
                
                ${(() => {
                    // 취득가액과 기타필요경비로 분류
                    const acquisitionExpenses = expenses.filter(exp => exp.category === '취득가액');
                    const otherExpenses = expenses.filter(exp => exp.category === '기타필요경비');
                    
                    // 소계 계산
                    const acquisitionSubtotal = acquisitionExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                    const otherSubtotal = otherExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                    const grandTotal = acquisitionSubtotal + otherSubtotal;
                    
                    return `
                        ${acquisitionExpenses.length > 0 ? `
                        <!-- 취득가액 -->
                        <div style="margin-bottom: 20px;">
                            <h4 style="font-size: 14px; font-weight: 700; color: #1e40af; margin-bottom: 8px; padding: 8px; background: #dbeafe; border-radius: 4px;">📌 취득가액</h4>
                            <table style="width: 100%; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid #9ca3af;">
                                <thead>
                                    <tr style="background: #667eea;">
                                        <th style="padding: 10px; text-align: left; color: white; font-weight: 600; font-size: 13px; border: 1px solid #6b7280;">비용명</th>
                                        <th style="padding: 10px; text-align: right; color: white; font-weight: 600; font-size: 13px; border: 1px solid #6b7280;">금액</th>
                                        <th style="padding: 10px; text-align: center; color: white; font-weight: 600; font-size: 13px; border: 1px solid #6b7280;">예정신고 비용인정</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${acquisitionExpenses.map((exp, idx) => `
                                        <tr style="background: ${idx % 2 === 0 ? 'white' : '#f9fafb'};">
                                            <td style="padding: 10px; color: #1f2937; font-weight: 500; border: 1px solid #d1d5db;">${escapeHtml(exp.expense_name || '-')}</td>
                                            <td style="padding: 10px; text-align: right; color: #1f2937; font-weight: 600; border: 1px solid #d1d5db;">${formatNumber(exp.amount || 0)}원</td>
                                            <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">
                                                <span style="padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; 
                                                             background: ${exp.income_tax_approved === 'O' ? '#dcfce7' : '#fee2e2'}; 
                                                             color: ${exp.income_tax_approved === 'O' ? '#166534' : '#991b1b'};">
                                                    ${exp.income_tax_approved === 'O' ? 'O' : 'X'}
                                                </span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                    <tr style="background: #dbeafe;">
                                        <td style="padding: 10px; font-weight: 700; color: #1e40af; border: 1px solid #d1d5db;">소계</td>
                                        <td style="padding: 10px; text-align: right; font-weight: 700; color: #1e40af; border: 1px solid #d1d5db;">${formatNumber(acquisitionSubtotal)}원</td>
                                        <td style="padding: 10px; border: 1px solid #d1d5db;"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        ` : ''}
                        
                        ${otherExpenses.length > 0 ? `
                        <!-- 기타필요경비 -->
                        <div style="margin-bottom: 20px;">
                            <h4 style="font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 8px; padding: 8px; background: #fef3c7; border-radius: 4px;">📌 기타필요경비</h4>
                            <table style="width: 100%; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid #9ca3af;">
                                <thead>
                                    <tr style="background: #667eea;">
                                        <th style="padding: 10px; text-align: left; color: white; font-weight: 600; font-size: 13px; border: 1px solid #6b7280;">비용명</th>
                                        <th style="padding: 10px; text-align: right; color: white; font-weight: 600; font-size: 13px; border: 1px solid #6b7280;">금액</th>
                                        <th style="padding: 10px; text-align: center; color: white; font-weight: 600; font-size: 13px; border: 1px solid #6b7280;">예정신고 비용인정</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${otherExpenses.map((exp, idx) => `
                                        <tr style="background: ${idx % 2 === 0 ? 'white' : '#f9fafb'};">
                                            <td style="padding: 10px; color: #1f2937; font-weight: 500; border: 1px solid #d1d5db;">${escapeHtml(exp.expense_name || '-')}</td>
                                            <td style="padding: 10px; text-align: right; color: #1f2937; font-weight: 600; border: 1px solid #d1d5db;">${formatNumber(exp.amount || 0)}원</td>
                                            <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">
                                                <span style="padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; 
                                                             background: ${exp.income_tax_approved === 'O' ? '#dcfce7' : '#fee2e2'}; 
                                                             color: ${exp.income_tax_approved === 'O' ? '#166534' : '#991b1b'};">
                                                    ${exp.income_tax_approved === 'O' ? 'O' : 'X'}
                                                </span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                    <tr style="background: #fef3c7;">
                                        <td style="padding: 10px; font-weight: 700; color: #92400e; border: 1px solid #d1d5db;">소계</td>
                                        <td style="padding: 10px; text-align: right; font-weight: 700; color: #92400e; border: 1px solid #d1d5db;">${formatNumber(otherSubtotal)}원</td>
                                        <td style="padding: 10px; border: 1px solid #d1d5db;"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        ` : ''}
                        
                        <!-- 전체 비용 합계 -->
                        <div style="margin-top: 16px; padding: 12px 16px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="color: #4b5563; font-size: 14px; font-weight: 600;">💰 전체 비용 합계</div>
                                <div style="color: #1f2937; font-size: 16px; font-weight: 700;">${formatNumber(grandTotal)}원</div>
                            </div>
                        </div>
                    `;
                })()}
            </div>
            ` : ''}
        </div>
    `;
    
    // Show modal
    document.getElementById('reportContent').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'flex';
    
    // Store current property for download
    window.currentReportProperty = property;
}

// Format date for display
function formatDateDisplay(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// Close report modal
function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

// Download property report as PNG
async function downloadPropertyReport() {
    const reportContent = document.getElementById('reportContent');
    
    try {
        showNotification('보고서를 생성하는 중입니다...', 'info');
        
        const canvas = await html2canvas(reportContent, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        });
        
        // Convert to PNG and download
        const link = document.createElement('a');
        const property = window.currentReportProperty;
        const fileName = `토지등매매차익예정신고보고서_${clientData?.company_name || '고객사'}_${property.property_name}_${new Date().toISOString().split('T')[0]}.png`;
        
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showNotification('보고서가 다운로드되었습니다.', 'success');
    } catch (error) {
        console.error('Report download error:', error);
        showNotification('보고서 다운로드 중 오류가 발생했습니다.', 'error');
    }
}

// Open Real Estate Drive folder
function openRealEstateDrive() {
    const btn = document.getElementById('realEstateDriveBtn');
    const url = btn.getAttribute('data-url');
    
    if (url) {
        window.open(url, '_blank');
    } else {
        showNotification('부동산 드라이브 폴더 URL이 등록되지 않았습니다.', 'error');
    }
}

// Check if XLSX library is loaded
if (typeof XLSX !== 'undefined') {
    console.log('✅ SheetJS (XLSX) library loaded successfully');
} else {
    console.error('❌ SheetJS (XLSX) library failed to load');
    console.warn('엑셀 업로드/다운로드 기능이 제한될 수 있습니다.');
}

// ============================================================================
// OCR 데이터 추출 및 자동 입력
// ============================================================================

// Handle property document upload
async function handlePropertyDocumentUpload(event, propertyIndex) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    console.log(`📂 물건 ${propertyIndex}번 - ${files.length}개 파일 업로드 시작`);
    showNotification(`${files.length}개 파일을 처리하는 중입니다...`, 'info');
    
    try {
        // Process all files
        const extractedData = await processDocumentFiles(files);
        
        // Auto-fill property data
        if (extractedData) {
            await autoFillPropertyData(propertyIndex, extractedData);
            showNotification('서류 데이터가 자동으로 입력되었습니다.', 'success');
        } else {
            showNotification('데이터 추출에 실패했습니다. 수동으로 입력해주세요.', 'warning');
        }
    } catch (error) {
        console.error('Document upload error:', error);
        showNotification('파일 처리 중 오류가 발생했습니다.', 'error');
    } finally {
        // Reset file input
        event.target.value = '';
    }
}

// Process document files (OCR extraction)
async function processDocumentFiles(files) {
    const extractedData = {
        // 물건목록 데이터
        property_name: '',
        address: '',
        acquisition_value: 0,
        other_expenses: 0,
        transfer_value: 0,
        acquisition_date: '',
        transfer_date: '',
        over_85: 'N',
        area: 0, // 면적 (85초과 판단용)
        
        // 필요경비 상세 데이터
        expenses: []
    };
    
    console.log(`🔍 ${files.length}개 파일 OCR 처리 중...`);
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📄 파일 ${i+1}: ${file.name} (${file.type})`);
        
        try {
            // Convert file to base64
            const fileData = await fileToBase64(file);
            
            // Analyze with OCR
            const ocrResult = await analyzeDocumentOCR(fileData, file.name);
            
            // Merge results
            if (ocrResult) {
                extractedData.property_name = ocrResult.property_name || extractedData.property_name;
                extractedData.address = ocrResult.address || extractedData.address;
                
                // 취득가액: 더 큰 값으로 업데이트 (중복 업로드 시 최대값 선택)
                if (ocrResult.acquisition_value > 0) {
                    extractedData.acquisition_value = Math.max(extractedData.acquisition_value, ocrResult.acquisition_value);
                }
                
                extractedData.other_expenses += ocrResult.other_expenses || 0;
                extractedData.transfer_value = ocrResult.transfer_value || extractedData.transfer_value;
                extractedData.acquisition_date = ocrResult.acquisition_date || extractedData.acquisition_date;
                extractedData.transfer_date = ocrResult.transfer_date || extractedData.transfer_date;
                extractedData.area = ocrResult.area || extractedData.area;
                
                // Add expenses (중복 제거)
                if (ocrResult.expenses && ocrResult.expenses.length > 0) {
                    ocrResult.expenses.forEach(newExpense => {
                        // 같은 비용명이 이미 있는지 확인
                        const exists = extractedData.expenses.some(e => 
                            e.expense_name === newExpense.expense_name && 
                            e.amount === newExpense.amount
                        );
                        
                        if (!exists) {
                            extractedData.expenses.push(newExpense);
                        } else {
                            console.log(`⚠️ 중복 필요경비 제거: ${newExpense.expense_name} (${newExpense.amount.toLocaleString()}원)`);
                        }
                    });
                }
            }
        } catch (error) {
            console.error(`파일 ${file.name} 처리 오류:`, error);
        }
    }
    
    // 85초과 판단
    if (extractedData.area > 0) {
        extractedData.over_85 = extractedData.area > 85 ? 'Y' : 'N';
        console.log(`📐 면적: ${extractedData.area}㎡ → 85초과: ${extractedData.over_85}`);
    }
    
    console.log('✅ OCR 추출 완료:', extractedData);
    return extractedData;
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Analyze document with OCR (시뮬레이션)
async function analyzeDocumentOCR(fileData, fileName) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`🤖 OCR 분석 중: ${fileName}`);
    
    // 실제 OCR API를 사용할 경우:
    // const response = await fetch('/api/ocr/analyze', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ image: fileData, fileName })
    // });
    // return await response.json();
    
    // 시뮬레이션: 파일명으로 서류 종류 판단
    const result = {
        property_name: '',
        address: '',
        acquisition_value: 0,
        other_expenses: 0,
        transfer_value: 0,
        acquisition_date: '',
        transfer_date: '',
        area: 0,
        expenses: []
    };
    
    const lowerFileName = fileName.toLowerCase();
    
    // 1️⃣ 매각대금 완납증명원
    if (lowerFileName.includes('완납') || lowerFileName.includes('매각대금')) {
        console.log('📋 서류 종류: 매각대금 완납증명원');
        result.acquisition_value = 256900000; // 매각대금 → 취득가액
        result.acquisition_date = '2025-12-16'; // 매각대금 완납일 → 취득일
        
        // ✅ 필요경비 상세에도 추가
        result.expenses.push({
            expense_name: '취득가액',
            category: '취득가액',
            amount: 256900000,
            preliminary_approved: 'O',
            income_tax_approved: 'O',
            note: '매각대금 완납증명원'
        });
        
        console.log('💰 매각대금 필요경비 상세 추가: 256,900,000원');
    }
    
    // 2️⃣ 부동산의 표시
    else if (lowerFileName.includes('표시') || lowerFileName.includes('등기')) {
        console.log('📋 서류 종류: 부동산의 표시');
        // 소재지와 물건명은 사용자가 직접 입력
        // result.address = ''; // 비워둠
        // result.property_name = ''; // 비워둠
        result.area = 84.8954; // 면적 (시뮬레이션)
        console.log('⚠️ 소재지와 물건명은 직접 입력이 필요합니다.');
    }
    
    // 3️⃣ 부동산(주거용) 매매 전자계약서
    else if (lowerFileName.includes('계약') || lowerFileName.includes('매매')) {
        console.log('📋 서류 종류: 부동산 매매 전자계약서');
        result.transfer_value = 294000000; // 매매대금 → 양도가액
        result.transfer_date = '2026-01-28'; // 잔금일 → 양도일
        result.area = 84.8954; // 면적
    }
    
    // 4️⃣ 등기비용내역서
    else if (lowerFileName.includes('등기비용') || lowerFileName.includes('내역')) {
        console.log('📋 서류 종류: 등기비용내역서');
        result.other_expenses = 4439530; // 총계 → 기타필요경비
        
        // 필요경비 상세 추가
        result.expenses.push({
            expense_name: '취득세',
            category: '취득가액',
            amount: 4439530,
            preliminary_approved: 'O',
            income_tax_approved: 'O',
            note: '등기비용내역서'
        });
        
        console.log('💰 등기비용 필요경비 상세 추가: 취득세 4,439,530원');
    }
    
    // 5️⃣ 중개수수료 영수증
    else if (lowerFileName.includes('중개') || lowerFileName.includes('수수료')) {
        console.log('📋 서류 종류: 중개수수료 영수증');
        // 금액은 사용자가 직접 입력 (0원으로 비워둠)
        
        result.expenses.push({
            expense_name: '중개수수료',
            category: '양도비용',
            amount: 0,
            preliminary_approved: 'O',
            income_tax_approved: 'O',
            note: '중개수수료 영수증 (금액 직접 입력 필요)'
        });
        
        console.log('💰 중개수수료 필요경비 상세 추가: 금액 입력 필요');
    }
    
    // 6️⃣ 법무사 비용 (영수증/청구서)
    else if (lowerFileName.includes('법무사') || lowerFileName.includes('법무비용')) {
        console.log('📋 서류 종류: 법무사 비용');
        // 금액은 사용자가 직접 입력 (0원으로 비워둠)
        
        result.expenses.push({
            expense_name: '취득세 등',
            category: '취득가액',
            amount: 0,
            preliminary_approved: 'O',
            income_tax_approved: 'O',
            note: '법무사 영수증 (금액 직접 입력 필요)'
        });
        
        console.log('💰 법무사 필요경비 상세 추가: 취득세 등 (금액 입력 필요)');
    }
    
    // 7️⃣ 신탁 관련 비용
    else if (lowerFileName.includes('신탁')) {
        console.log('📋 서류 종류: 신탁 관련 비용');
        // 금액은 사용자가 직접 입력 (0원으로 비워둠)
        
        result.expenses.push({
            expense_name: '신탁말소비용',
            category: '양도비용',
            amount: 0,
            preliminary_approved: 'O',
            income_tax_approved: 'O',
            note: '신탁말소비용 영수증 (금액 직접 입력 필요)'
        });
        
        console.log('💰 신탁말소 필요경비 상세 추가: 금액 입력 필요');
    }
    
    // 8️⃣ 관리비 정산
    else if (lowerFileName.includes('관리비')) {
        console.log('📋 서류 종류: 관리비 정산');
        // 금액은 사용자가 직접 입력 (0원으로 비워둠)
        
        result.expenses.push({
            expense_name: '관리비 정산',
            category: '양도비용',
            amount: 0,
            preliminary_approved: 'O',
            income_tax_approved: 'O',
            note: '관리비 정산서 (금액 직접 입력 필요)'
        });
        
        console.log('💰 관리비 필요경비 상세 추가: 금액 입력 필요');
    }
    
    // ❌ 학습하지 않은 서류 - 무시
    else {
        console.log('⚠️ 학습하지 않은 서류입니다. 무시하고 넘어갑니다:', fileName);
    }
    
    return result;
}

// Auto-fill property data
async function autoFillPropertyData(propertyIndex, extractedData) {
    const row = inventoryRows[propertyIndex];
    if (!row) {
        console.error(`❌ 물건 ${propertyIndex}번이 존재하지 않습니다.`);
        return;
    }
    
    console.log(`✏️ 물건 ${propertyIndex}번 자동 입력 시작:`, extractedData);
    
    // Update property data
    if (extractedData.property_name) {
        row.property_name = extractedData.property_name;
        console.log(`📝 물건명 입력: ${extractedData.property_name}`);
    }
    
    if (extractedData.address) {
        row.address = extractedData.address;
        console.log(`📍 소재지 입력: ${extractedData.address}`);
    }
    
    if (extractedData.acquisition_value > 0) {
        // ⚠️ 누적이 아닌 덮어쓰기로 변경 (취득가액 중복 방지)
        row.acquisition_value = extractedData.acquisition_value;
        console.log(`💰 취득가액 입력: ${extractedData.acquisition_value.toLocaleString()}원`);
    }
    
    if (extractedData.other_expenses > 0) {
        row.other_expenses += extractedData.other_expenses;
        console.log(`💸 기타필요경비 추가: ${extractedData.other_expenses.toLocaleString()}원`);
    }
    
    if (extractedData.transfer_value > 0) {
        row.transfer_value = extractedData.transfer_value;
        console.log(`💵 양도가액 입력: ${extractedData.transfer_value.toLocaleString()}원`);
    }
    
    if (extractedData.acquisition_date) {
        row.acquisition_date = extractedData.acquisition_date;
        console.log(`📅 취득일 입력: ${extractedData.acquisition_date}`);
    }
    
    if (extractedData.transfer_date) {
        row.transfer_date = extractedData.transfer_date;
        row.report_deadline = calculateReportDeadline(extractedData.transfer_date);
        console.log(`📅 양도일 입력: ${extractedData.transfer_date} → 신고기한: ${row.report_deadline}`);
    }
    
    if (extractedData.over_85) {
        row.over_85 = extractedData.over_85;
        console.log(`📐 85초과 판단: ${extractedData.over_85}`);
    }
    
    // Calculate transfer income
    row.transfer_income = row.transfer_value - row.acquisition_value - row.other_expenses;
    
    // Add expenses to property
    if (extractedData.expenses && extractedData.expenses.length > 0) {
        if (!row.expenses) row.expenses = [];
        row.expenses.push(...extractedData.expenses);
        console.log(`💰 필요경비 ${extractedData.expenses.length}개 추가됨`);
        
        // 필요경비 상세 내용 출력
        extractedData.expenses.forEach((exp, idx) => {
            console.log(`  ${idx + 1}. ${exp.expense_name}: ${exp.amount.toLocaleString()}원 (${exp.category})`);
        });
    }
    
    // Save to localStorage
    localStorage.setItem(`trader_inventory_${clientId}`, JSON.stringify(inventoryRows));
    
    // Re-render table
    renderInventoryTable();
    
    // Show detail row
    toggleDetailRow(propertyIndex);
    
    // 필요경비가 있으면 자동으로 필요경비 섹션 열기
    if (extractedData.expenses && extractedData.expenses.length > 0) {
        setTimeout(() => {
            openExpenseSection(propertyIndex);
        }, 500);
    }
    
    // 요약 알림 표시
    const summary = [];
    if (extractedData.property_name) summary.push(`물건명: ${extractedData.property_name}`);
    if (extractedData.address) summary.push(`소재지: ${extractedData.address}`);
    if (extractedData.acquisition_value > 0) summary.push(`취득가액: ${extractedData.acquisition_value.toLocaleString()}원`);
    if (extractedData.other_expenses > 0) summary.push(`기타필요경비: ${extractedData.other_expenses.toLocaleString()}원`);
    if (extractedData.transfer_value > 0) summary.push(`양도가액: ${extractedData.transfer_value.toLocaleString()}원`);
    if (extractedData.expenses.length > 0) summary.push(`필요경비 ${extractedData.expenses.length}개 항목`);
    
    const summaryText = summary.join('\n');
    console.log(`📊 입력 요약:\n${summaryText}`);
    
    console.log(`✅ 물건 ${propertyIndex}번 자동 입력 완료`);
}

// ============================================
// 입력참고용 모달
// ============================================

// 입력참고용 모달 열기
function showReferenceData(propertyIndex) {
    const property = inventoryRows[propertyIndex];
    
    if (!clientData) {
        alert('거래처 정보를 불러올 수 없습니다.');
        return;
    }
    
    // 계산된 값들
    const salePrice = property.transfer_value || 0; // 매매가액
    const requiredValue = property.acquisition_value + property.other_expenses; // 필요경비 계산 (취득가액+기타)
    const capitalGainValue = salePrice - requiredValue; // 경기보유특별공제 전 토지등매매차익
    const totalSpecialDeduction = Math.round(capitalGainValue * 0.15); // 양도소득특별공제 (15%)
    const netCapitalGain = capitalGainValue - totalSpecialDeduction; // 토지등 매매차익 합계액
    const preliminaryTaxBase = netCapitalGain; // 예정신고 과세표준
    
    // 신고 날짜 정보
    const transferDate = property.transfer_date || '';
    const reportDeadline = property.report_deadline || '';
    
    const content = `
        <div style="font-family: 'Inter', sans-serif;">
            <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
                <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600;">
                    <i class="fas fa-lightbulb"></i> 안내
                </h4>
                <p style="margin: 0; color: #1e3a8a; font-size: 13px; line-height: 1.5;">
                    현재 입력된 데이터를 기반으로 토지등 매매차익 예정신고서의 예상 값을 보여줍니다.<br>
                    실제 신고 시에는 정확한 계산을 다시 확인해주세요.
                </p>
            </div>
            
            <!-- 표 1: 토지등 매매차익 예정신고서 -->
            <h3 style="font-size: 16px; font-weight: 700; color: #1f2937; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">
                3. 토지등 매매차익 예정신고서
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 13px;">
                <thead>
                    <tr style="background: #f9fafb;">
                        <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600; color: #374151;">구분</th>
                        <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center; font-weight: 600; color: #374151; width: 80px;">번호</th>
                        <th style="border: 1px solid #d1d5db; padding: 10px; text-align: right; font-weight: 600; color: #374151;">금액 (원)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #fef3c7; font-weight: 600;">매매가액<br>(실거래가액)</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">5</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right; font-weight: 600; color: #b91c1c;">${formatNumber(salePrice)}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px;">필요경비</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">6</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">${formatNumber(requiredValue)}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px;">경기보유특별공제 전<br>토지등매매차익</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">7</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right; color: #666;">(= 5 - 6)</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px;">토지등 매매차익</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">8</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">${formatNumber(capitalGainValue)}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px;">기본공제(공제)된<br>매매차익합계액</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">9</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right; color: #666;"></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #fef3c7; font-weight: 600;">토지등 매매차익<br>합계액(8+9)</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">10</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right; font-weight: 600; color: #b91c1c;">${formatNumber(capitalGainValue)}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #dcfce7;">양도소득특별공제</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; background: #dcfce7;">11</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right; background: #dcfce7; font-weight: 600; color: #15803d;">15%</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px;">산출세액</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">12</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">${formatNumber(totalSpecialDeduction)}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px;">가산세</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">13</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right; color: #666;"></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px;">기납부세액</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">14</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right; color: #666;"></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #f0fdf4; font-weight: 600;">납부할 종액<br>(12+13-14)</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; background: #f0fdf4;">15</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right; background: #f0fdf4; font-weight: 600; color: #15803d;">${formatNumber(totalSpecialDeduction)}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px;">신고기한 내<br>납부할종액(15-16)</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">17</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">${formatNumber(totalSpecialDeduction)}</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- 표 2: 부동산거래계약 정보 -->
            <h3 style="font-size: 16px; font-weight: 700; color: #1f2937; margin: 32px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">
                (8) 부동산거래계약
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 13px;">
                <tbody>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; font-weight: 600; width: 150px;">(9) 거래일자</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; font-weight: 600; width: 80px;">양도일</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${transferDate || '-'}</td>
                        <td rowspan="2" style="border: 1px solid #d1d5db; padding: 10px; text-align: center; vertical-align: middle;">
                            <i class="fas fa-calendar-alt" style="color: #6b7280; font-size: 32px;"></i>
                        </td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; font-weight: 600;"></td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; font-weight: 600;">취득일</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${property.acquisition_date || '-'}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #fef3c7; font-weight: 600;" rowspan="2">(10) 양도면적</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; font-weight: 600;">토지</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${property.land_area || '-'} m²</td>
                        <td rowspan="2" style="border: 1px solid #d1d5db; padding: 10px; text-align: center; vertical-align: middle;">
                            <div style="color: #6b7280;">충면적</div>
                            <div style="font-weight: 600; color: #1f2937; font-size: 14px;">${formatNumber((property.land_area || 0) + (property.building_area || 0))} m²</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; font-weight: 600;">건물</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${property.building_area || '-'} m²</td>
                    </tr>
                    <tr style="background: #fef3c7;">
                        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 600;">(11) 매매가액</td>
                        <td colspan="3" style="border: 1px solid #d1d5db; padding: 10px; text-align: right; font-weight: 700; color: #b91c1c; font-size: 15px;">
                            ${formatNumber(salePrice)}원
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <!-- 표 3: 필요경비 요약 -->
            <h3 style="font-size: 16px; font-weight: 700; color: #1f2937; margin: 32px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">
                필요경비
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <tbody>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; font-weight: 600; width: 150px;">(12) 취득가액</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right; font-weight: 600;">${formatNumber(property.acquisition_value || 0)}원</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; font-weight: 600;">(13) 자본적 지출액</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">-</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; font-weight: 600;">(14) 양도비</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">${formatNumber(property.disposal_cost || 0)}원</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; font-weight: 600;">(15) 감정자금충당이자</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">-</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; font-weight: 600;">(16) 공과금</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">-</td>
                    </tr>
                    <tr style="background: #fef3c7;">
                        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 700;">(17) 필요경비 계<br>(11) - (17)</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right; font-weight: 700; color: #b91c1c; font-size: 15px;">
                            ${formatNumber(requiredValue)}원
                        </td>
                    </tr>
                    <tr style="background: #dcfce7;">
                        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 700;">(11) - (17) 계</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right; font-weight: 700; color: #15803d; font-size: 15px;">
                            ${formatNumber(capitalGainValue)}원
                        </td>
                    </tr>
                    <tr style="background: #f0fdf4;">
                        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 700;">(18) 경기보유특별공제<br>(11)-(17)-(18)</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">-</td>
                    </tr>
                    <tr style="background: #dbeafe;">
                        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 700; color: #1e40af;">(19) 매매차익<br>(11)-(17)-(18)</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right; font-weight: 700; color: #1e40af; font-size: 15px;">
                            ${formatNumber(capitalGainValue)}원
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 24px; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600;">
                    <i class="fas fa-calculator"></i> 신고 정보
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                    <div>
                        <div style="color: #6b7280; margin-bottom: 4px;">양도일</div>
                        <div style="font-weight: 600; color: #1f2937;">${transferDate || '-'}</div>
                    </div>
                    <div>
                        <div style="color: #6b7280; margin-bottom: 4px;">신고기한</div>
                        <div style="font-weight: 600; color: #dc2626;">${reportDeadline || '-'}</div>
                    </div>
                    <div>
                        <div style="color: #6b7280; margin-bottom: 4px;">예정신고 과세표준</div>
                        <div style="font-weight: 600; color: #1f2937;">${formatNumber(preliminaryTaxBase)}원</div>
                    </div>
                    <div>
                        <div style="color: #6b7280; margin-bottom: 4px;">납부세액 (15%)</div>
                        <div style="font-weight: 600; color: #15803d;">${formatNumber(totalSpecialDeduction)}원</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('referenceContent').innerHTML = content;
    document.getElementById('referenceModal').style.display = 'flex';
}

// 입력참고용 모달 닫기
function closeReferenceModal() {
    document.getElementById('referenceModal').style.display = 'none';
}

