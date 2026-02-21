// Check authentication
(function() {
    const user = checkAuth();
    if (user) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userRole').textContent = user.role === 'admin' ? '관리자' : '매니저';
        if (document.getElementById('userAvatar')) {
            document.getElementById('userAvatar').textContent = user.name.charAt(0);
        }
    }
})();

// Get client ID from URL
const urlParams = new URLSearchParams(window.location.search);
let clientId = urlParams.get('id');

// Preview mode: generate a temporary ID if none provided
if (!clientId) {
    console.warn('⚠️ No client ID provided - entering Preview mode');
    clientId = 'preview-mode-' + Date.now();
}

let clientData = null;
let inventoryRows = [];
let currentPropertyIndex = -1;
let detailExpenseRows = [];
const EXPENSE_ROW_COUNT = 10;

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
        
        try {
            const { data, error } = await supabaseClient
                .from('clients')
                .select('*')
                .eq('id', clientId)
                .single();
            
            if (error) throw error;
            clientData = data;
        } catch (fetchError) {
            console.warn('Supabase 조회 실패 - Preview 모드:', fetchError);
            clientData = {
                id: clientId,
                company_name: '테스트 매매사업자 (Preview)',
                representative: '홍길동',
                business_code: '703011',
                phone: '010-1234-5678'
            };
        }
        
        document.getElementById('pageTitle').textContent = clientData.company_name || '매매사업자 상세';
        document.getElementById('companyName').textContent = clientData.company_name || '-';
        document.getElementById('representative').textContent = clientData.representative || clientData.ceo_name || '-';
        document.getElementById('businessCode').textContent = clientData.business_code || '-';
        document.getElementById('phone').textContent = clientData.phone || clientData.contact || '-';
        
        // Setup Real Estate Drive button
        const realEstateDriveBtn = document.getElementById('realEstateDriveBtn');
        if (clientData.real_estate_drive_folder) {
            realEstateDriveBtn.setAttribute('data-url', clientData.real_estate_drive_folder);
            realEstateDriveBtn.disabled = false;
            realEstateDriveBtn.style.opacity = '1';
        } else {
            realEstateDriveBtn.disabled = true;
            realEstateDriveBtn.style.opacity = '0.5';
            realEstateDriveBtn.title = '부동산 폴더 URL이 설정되지 않았습니다';
        }
        
        await loadInventoryData();
        
        document.getElementById('clientInfoCard').style.display = 'block';
        document.getElementById('inventoryCard').style.display = 'block';
        
        hideLoading();
    } catch (error) {
        console.error('Error loading client:', error);
        showNotification('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
        hideLoading();
    }
}

// Calculate report deadline
function calculateReportDeadline(transferDate) {
    if (!transferDate) return '';
    
    try {
        const date = new Date(transferDate);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
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
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 8) {
        const year = numbers.substring(0, 4);
        const month = numbers.substring(4, 6);
        const day = numbers.substring(6, 8);
        return `${year}-${month}-${day}`;
    }
    
    return value;
}

// Calculate transfer income
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
        area: 0,
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
    };
    
    inventoryRows.push(row);
    localStorage.setItem(`trader_inventory_${clientId}`, JSON.stringify(inventoryRows));
    renderInventoryTable();
    showNotification('새 행이 추가되었습니다.', 'success');
}

// 🔥 **12칼럼 렌더링 함수 (완전히 새로 작성)**
function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    
    if (inventoryRows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>등록된 물건이 없습니다.</p>
                    <p style="font-size: 14px; color: #9ca3af;">엑셀 파일을 업로드하여 물건 정보를 추가하세요.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = inventoryRows.map((row, index) => {
        // Calculate transfer income
        const transferIncome = calculateTransferIncome(row.transfer_value, row.acquisition_value, row.other_expenses);
        row.transfer_income = transferIncome;
        
        // Status badge styling
        const statusClass = {
            '미확인': 'status-unconfirmed',
            '확인': 'status-confirmed',
            '위하고입력': 'status-input',
            '고객안내': 'status-customer',
            '신고완료': 'status-complete'
        }[row.progress_stage || '미확인'] || 'status-unconfirmed';
        
        return `
        <tr>
            <!-- 1. No -->
            <td style="text-align: center; font-weight: 600; color: #667eea;">
                ${index + 1}
            </td>
            
            <!-- 2. 소재지 -->
            <td style="text-align: left;">
                <input type="text" class="trader-input" value="${row.address || ''}" 
                       onchange="updateInventoryRow(${index}, 'address', this.value)" 
                       placeholder="소재지 입력" style="text-align: left;">
            </td>
            
            <!-- 3. 면적(㎡) -->
            <td>
                <input type="text" class="trader-input" value="${formatNumber(row.area) || ''}" 
                       onchange="updateInventoryRow(${index}, 'area', parseNumber(this.value))"
                       onblur="this.value = formatNumber(parseNumber(this.value))"
                       placeholder="0" style="text-align: right;">
            </td>
            
            <!-- 4. 취득가액 -->
            <td>
                <input type="text" class="trader-input" value="${formatNumber(row.acquisition_value) || ''}" 
                       onchange="updateInventoryRow(${index}, 'acquisition_value', parseNumber(this.value))"
                       onblur="this.value = formatNumber(parseNumber(this.value))"
                       placeholder="0" style="text-align: right; background: #f0f9ff;">
            </td>
            
            <!-- 5. 취득일자 -->
            <td>
                <input type="text" class="trader-input" value="${row.acquisition_date || ''}" 
                       onchange="updateInventoryRow(${index}, 'acquisition_date', this.value)"
                       onblur="formatAcquisitionDate(${index}, this)"
                       placeholder="20250101" maxlength="10" style="text-align: center;">
            </td>
            
            <!-- 6. 양도가액 -->
            <td>
                <input type="text" class="trader-input" value="${formatNumber(row.transfer_value) || ''}" 
                       onchange="updateInventoryRow(${index}, 'transfer_value', parseNumber(this.value))"
                       onblur="this.value = formatNumber(parseNumber(this.value))"
                       placeholder="0" style="text-align: right;">
            </td>
            
            <!-- 7. 양도일자 -->
            <td>
                <input type="text" class="trader-input" value="${row.transfer_date || ''}" 
                       onchange="updateInventoryRow(${index}, 'transfer_date', this.value)"
                       onblur="formatTransferDate(${index}, this)"
                       placeholder="20250405" maxlength="10" style="text-align: center;">
            </td>
            
            <!-- 8. 필요경비 -->
            <td>
                <input type="text" class="trader-input" value="${formatNumber(row.other_expenses) || ''}" 
                       readonly style="text-align: right; background: #f0fdf4;">
            </td>
            
            <!-- 9. 필요경비 상세 -->
            <td style="text-align: center;">
                <button class="action-btn action-btn-detail" onclick="openExpenseSection(${index})" 
                        style="padding: 6px 12px; font-size: 12px;">
                    <i class="fas fa-list"></i> 상세
                </button>
            </td>
            
            <!-- 10. 양도소득금액 -->
            <td>
                <input type="text" class="trader-input" value="${formatNumber(transferIncome) || ''}" 
                       readonly style="text-align: right; background: #fef3c7; font-weight: 600;">
            </td>
            
            <!-- 11. 신고여부 -->
            <td style="text-align: center;">
                <select class="trader-input ${statusClass}" 
                        onchange="updateInventoryRow(${index}, 'progress_stage', this.value)" 
                        style="text-align: center; padding: 6px 8px; font-size: 12px; font-weight: 600; border: none;">
                    <option value="미확인" ${(row.progress_stage === '미확인' || !row.progress_stage) ? 'selected' : ''}>미확인</option>
                    <option value="확인" ${row.progress_stage === '확인' ? 'selected' : ''}>확인</option>
                    <option value="위하고입력" ${row.progress_stage === '위하고입력' ? 'selected' : ''}>위하고입력</option>
                    <option value="고객안내" ${row.progress_stage === '고객안내' ? 'selected' : ''}>고객안내</option>
                    <option value="신고완료" ${row.progress_stage === '신고완료' ? 'selected' : ''}>신고완료</option>
                </select>
            </td>
            
            <!-- 12. 작업 -->
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn-calc" onclick="calculateTaxes(${index})" 
                            style="padding: 6px 10px; font-size: 12px;">
                        <i class="fas fa-calculator"></i> 계산
                    </button>
                    <button class="action-btn action-btn-report" onclick="generatePropertyReport(${index})" 
                            style="padding: 6px 10px; font-size: 12px;">
                        <i class="fas fa-file-alt"></i> 보고서
                    </button>
                    <button class="action-btn action-btn-delete" onclick="deleteInventoryRow(${index})" 
                            style="padding: 6px 10px; font-size: 12px;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// Format transfer date
function formatTransferDate(index, element) {
    const formatted = formatDateInput(element.value);
    element.value = formatted;
    updateInventoryRow(index, 'transfer_date', formatted);
}

// Format acquisition date
function formatAcquisitionDate(index, element) {
    const formatted = formatDateInput(element.value);
    element.value = formatted;
    updateInventoryRow(index, 'acquisition_date', formatted);
}

// Delete inventory row
function deleteInventoryRow(index) {
    const property = inventoryRows[index];
    const propertyName = property.property_name || property.address || '물건' + (index + 1);
    
    if (confirm(`정말로 "${propertyName}" 행을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
        inventoryRows.splice(index, 1);
        localStorage.setItem(`trader_inventory_${clientId}`, JSON.stringify(inventoryRows));
        renderInventoryTable();
        showNotification('물건이 삭제되었습니다.', 'success');
    }
}

// Update inventory row
function updateInventoryRow(index, field, value) {
    inventoryRows[index][field] = value;
    
    // Auto-calculate report deadline when transfer_date changes
    if (field === 'transfer_date') {
        inventoryRows[index].report_deadline = calculateReportDeadline(value);
    }
    
    localStorage.setItem(`trader_inventory_${clientId}`, JSON.stringify(inventoryRows));
    renderInventoryTable();
}

// Open expense section
function openExpenseSection(index) {
    currentPropertyIndex = index;
    const property = inventoryRows[index];
    
    // Create expense section UI
    const section = document.getElementById('expenseSection');
    if (!section) {
        console.error('Expense section not found');
        return;
    }
    
    // Initialize expense rows
    initializeDetailExpenseRows(property.expenses || []);
    renderDetailExpensesTable();
    calculateDetailExpenseTotals();
    
    section.classList.add('active');
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Close expense section
function closeExpenseSection() {
    const section = document.getElementById('expenseSection');
    if (section) {
        section.classList.remove('active');
    }
    currentPropertyIndex = -1;
}

// Initialize detail expense rows
function initializeDetailExpenseRows(existingData = []) {
    detailExpenseRows = [];
    
    for (let i = 0; i < EXPENSE_ROW_COUNT; i++) {
        if (i < existingData.length) {
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
    const container = document.getElementById('expenseTableContainer');
    if (!container) return;
    
    container.innerHTML = `
        <table class="trader-table" style="margin-top: 0;">
            <thead>
                <tr>
                    <th style="width: 50px;">No</th>
                    <th style="width: 150px;">비용명</th>
                    <th style="width: 120px;">구분</th>
                    <th style="width: 120px;">금액</th>
                    <th style="width: 100px;">예정신고</th>
                    <th style="width: 100px;">확정신고</th>
                    <th>비고</th>
                    <th style="width: 80px;">작업</th>
                </tr>
            </thead>
            <tbody id="expenseDetailTableBody">
                ${detailExpenseRows.map((row, index) => `
                <tr>
                    <td style="text-align: center; font-weight: 600;">${row.no}</td>
                    <td>
                        <select class="trader-input" onchange="updateDetailExpenseRow(${index}, 'expense_name', this.value)" style="width: 100%;">
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
                        <select class="trader-input" onchange="updateDetailExpenseRow(${index}, 'category', this.value)" style="width: 100%;">
                            <option value="취득가액" ${row.category === '취득가액' ? 'selected' : ''}>취득가액</option>
                            <option value="기타필요경비" ${row.category === '기타필요경비' ? 'selected' : ''}>기타필요경비</option>
                        </select>
                    </td>
                    <td>
                        <input type="text" class="trader-input" value="${formatNumber(row.amount) || ''}" 
                               onchange="updateDetailExpenseRow(${index}, 'amount', parseNumber(this.value))"
                               onblur="this.value = formatNumber(parseNumber(this.value))"
                               placeholder="0" style="text-align: right; width: 100%;">
                    </td>
                    <td>
                        <select class="trader-input" onchange="updateDetailExpenseRow(${index}, 'preliminary_approved', this.value)" style="width: 100%; text-align: center;">
                            <option value="O" ${row.preliminary_approved === 'O' ? 'selected' : ''}>O</option>
                            <option value="X" ${row.preliminary_approved === 'X' ? 'selected' : ''}>X</option>
                        </select>
                    </td>
                    <td>
                        <select class="trader-input" onchange="updateDetailExpenseRow(${index}, 'income_tax_approved', this.value)" style="width: 100%; text-align: center;">
                            <option value="O" ${row.income_tax_approved === 'O' ? 'selected' : ''}>O</option>
                            <option value="X" ${row.income_tax_approved === 'X' ? 'selected' : ''}>X</option>
                        </select>
                    </td>
                    <td>
                        <input type="text" class="trader-input" value="${row.note || ''}" 
                               onchange="updateDetailExpenseRow(${index}, 'note', this.value)" 
                               placeholder="비고" style="width: 100%;">
                    </td>
                    <td style="text-align: center;">
                        <button class="trader-btn trader-btn-danger" onclick="clearDetailExpenseRow(${index})" 
                                style="padding: 6px 10px; font-size: 12px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f9fafb; border-radius: 8px;">
            <div>
                <strong>취득가액 합계:</strong> <span id="detailAcquisitionTotal" style="color: #667eea; font-size: 18px; font-weight: 700;">0원</span>
                <span style="margin: 0 20px;">|</span>
                <strong>기타필요경비 합계:</strong> <span id="detailOtherExpensesTotal" style="color: #10b981; font-size: 18px; font-weight: 700;">0원</span>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="trader-btn trader-btn-secondary" onclick="closeExpenseSection()">
                    <i class="fas fa-times"></i> 닫기
                </button>
                <button class="trader-btn trader-btn-success" onclick="saveDetailExpenses()">
                    <i class="fas fa-save"></i> 저장 및 반영
                </button>
            </div>
        </div>
    `;
}

// Clear detail expense row
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
        if (row.expense_name && row.expense_name.trim() !== '' && row.preliminary_approved === 'O') {
            if (row.category === '취득가액') {
                acquisitionTotal += amount;
            } else if (row.category === '기타필요경비') {
                otherExpensesTotal += amount;
            }
        }
    });
    
    const acquisitionEl = document.getElementById('detailAcquisitionTotal');
    const otherEl = document.getElementById('detailOtherExpensesTotal');
    
    if (acquisitionEl) acquisitionEl.textContent = formatNumber(acquisitionTotal) + '원';
    if (otherEl) otherEl.textContent = formatNumber(otherExpensesTotal) + '원';
}

// Save detail expenses
function saveDetailExpenses() {
    if (currentPropertyIndex === -1) return;
    
    const validExpenses = detailExpenseRows.filter(row => 
        row.expense_name && row.expense_name.trim() !== ''
    );
    
    inventoryRows[currentPropertyIndex].expenses = validExpenses;
    
    let acquisitionTotal = 0;
    let otherExpensesTotal = 0;
    
    validExpenses.forEach(row => {
        const amount = parseNumber(row.amount) || 0;
        if (row.preliminary_approved === 'O') {
            if (row.category === '취득가액') {
                acquisitionTotal += amount;
            } else if (row.category === '기타필요경비') {
                otherExpensesTotal += amount;
            }
        }
    });
    
    inventoryRows[currentPropertyIndex].acquisition_value = acquisitionTotal;
    inventoryRows[currentPropertyIndex].other_expenses = otherExpensesTotal;
    
    localStorage.setItem(`trader_inventory_${clientId}`, JSON.stringify(inventoryRows));
    renderInventoryTable();
    
    showNotification('필요경비가 저장되고 물건 목록에 반영되었습니다.', 'success');
}

// Load inventory data
async function loadInventoryData() {
    try {
        console.log('🔄 Loading inventory data for clientId:', clientId);
        
        const storageKey = `trader_inventory_${clientId}`;
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
            inventoryRows = JSON.parse(savedData);
            console.log('✅ Loaded inventory data:', inventoryRows.length, 'rows');
        } else {
            console.warn('⚠️ No saved data found');
            inventoryRows = [];
        }
        
        renderInventoryTable();
    } catch (error) {
        console.error('❌ Error loading inventory data:', error);
        inventoryRows = [];
        renderInventoryTable();
    }
}

// Helper functions
function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.add('active');
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.remove('active');
}

function showNotification(message, type = 'info') {
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    alert(`${icons[type] || 'ℹ️'} ${message}`);
}

// Open Real Estate Drive
function openRealEstateDrive() {
    const btn = document.getElementById('realEstateDriveBtn');
    const url = btn.getAttribute('data-url');
    
    if (url && url.trim() !== '') {
        window.open(url, '_blank');
    } else {
        showNotification('부동산 폴더 URL이 설정되지 않았습니다.', 'warning');
    }
}

// Download Excel template
function downloadExcelTemplate() {
    showNotification('엑셀 템플릿 다운로드 기능은 준비 중입니다.', 'info');
}

// Handle Excel upload
function handleExcelUpload(event) {
    showNotification('엑셀 업로드 기능은 준비 중입니다.', 'info');
}

// Calculate taxes
function calculateTaxes(index) {
    showNotification('세금 계산 기능은 준비 중입니다.', 'info');
}

// Generate property report
function generatePropertyReport(index) {
    showNotification('보고서 생성 기능은 준비 중입니다.', 'info');
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Trader Detail Page - 12 Column Version');
    loadClientData();
});
