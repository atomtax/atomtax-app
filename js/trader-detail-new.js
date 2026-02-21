// ============================================
// 매매사업자 상세 페이지 - 완전한 작동 버전
// ============================================

console.log('🚀 trader-detail-new.js 로드 시작');

// Get client ID from URL
const urlParams = new URLSearchParams(window.location.search);
let clientId = urlParams.get('id');

// Global variables
let clientData = null;
let inventoryRows = [];
let currentPropertyIndex = -1;
let detailExpenseRows = [];
const EXPENSE_ROW_COUNT = 10;
let expandedRows = new Set();

// ============================================
// Utility Functions
// ============================================

function formatNumber(num) {
    if (!num || num === '' || isNaN(num)) return '';
    return Number(num).toLocaleString('ko-KR');
}

function parseNumber(str) {
    if (!str || str === '') return 0;
    return Number(String(str).replace(/,/g, ''));
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message);
}

// ============================================
// Data Loading Functions
// ============================================

async function loadClientData() {
    try {
        console.log('📊 클라이언트 데이터 로드 시작:', clientId);
        showLoading();
        
        if (!clientId) {
            console.error('❌ Client ID가 없습니다');
            showNotification('잘못된 접근입니다. 매매사업자 목록으로 이동합니다.', 'error');
            setTimeout(() => { window.location.href = 'traders-data.html'; }, 1500);
            return;
        }

        // Fetch from Supabase
        const { data, error } = await supabaseClient
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();
        
        if (error) {
            console.error('❌ Supabase 조회 실패:', error);
            throw error;
        }
        
        clientData = data;
        console.log('✅ 클라이언트 데이터 로드 성공:', clientData.company_name);
        
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        const docTitle = document.getElementById('clientName');
        if (pageTitle) pageTitle.textContent = clientData.company_name || '매매사업자 상세';
        if (docTitle) docTitle.textContent = clientData.company_name || '매매사업자 상세';
        document.title = `${clientData.company_name} - 매매사업자 상세`;
        
        // Update all fields
        updateClientFields();
        
        // Setup Real Estate Drive button
        setupRealEstateDriveBtn();
        
        // Load inventory data
        await loadInventoryData();
        
        hideLoading();
    } catch (error) {
        console.error('❌ 클라이언트 데이터 로드 오류:', error);
        showNotification('데이터를 불러오는 중 오류가 발생했습니다: ' + error.message, 'error');
        hideLoading();
    }
}

function updateClientFields() {
    const fields = {
        'clientName': clientData.company_name,
        'businessNumber': clientData.business_number,
        'representative': clientData.representative || clientData.ceo_name,
        'businessCode': clientData.business_code,
        'address': clientData.address,
        'manager': clientData.manager,
        'phone': clientData.contact || clientData.phone,
        'email': clientData.email
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = value || '';
            } else {
                element.textContent = value || '-';
            }
        }
    });
    
    console.log('✅ 클라이언트 필드 업데이트 완료');
}

function setupRealEstateDriveBtn() {
    const realEstateDriveBtn = document.getElementById('realEstateDriveBtn');
    if (!realEstateDriveBtn) return;
    
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
}

async function loadInventoryData() {
    try {
        console.log('📦 재고 데이터 로드 시작');
        
        const { data, error } = await supabaseClient
            .from('trader_inventory')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        inventoryRows = data || [];
        console.log(`✅ 재고 데이터 ${inventoryRows.length}개 로드 완료`);
        
        renderInventoryTable();
    } catch (error) {
        console.error('❌ 재고 데이터 로드 오류:', error);
        inventoryRows = [];
        renderInventoryTable();
    }
}

// ============================================
// Inventory Table Rendering
// ============================================

function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) {
        console.warn('⚠️ inventoryTableBody 요소를 찾을 수 없습니다');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (inventoryRows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    <p style="font-size: 16px; margin: 0;">등록된 물건이 없습니다.</p>
                    <p style="font-size: 14px; margin-top: 8px; color: #9ca3af;">엑셀 파일을 업로드하여 물건을 등록하세요.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    inventoryRows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center;">${index + 1}</td>
            <td>${escapeHtml(row.address || '-')}</td>
            <td>${escapeHtml(row.area || '-')}</td>
            <td style="text-align: right;">${formatNumber(row.acquisition_price)}</td>
            <td style="text-align: center;">${row.acquisition_date || '-'}</td>
            <td style="text-align: right;">${formatNumber(row.disposal_price)}</td>
            <td style="text-align: center;">${row.disposal_date || '-'}</td>
            <td style="text-align: right;">${formatNumber(row.necessary_expenses)}</td>
            <td style="text-align: center;">
                <button class="icon-btn" onclick="openExpenseDetail(${index})" title="상세보기">
                    <i class="fas fa-file-invoice-dollar"></i>
                </button>
            </td>
            <td style="text-align: right;">${formatNumber(row.transfer_income)}</td>
            <td style="text-align: center;">${row.report_status || '-'}</td>
            <td style="text-align: center;">
                <button class="icon-btn" onclick="editInventoryRow(${index})" title="수정">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn" onclick="deleteInventoryRow(${index})" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    console.log(`✅ 재고 테이블 렌더링 완료 (${inventoryRows.length}개 행)`);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Excel Upload Functions
// ============================================

function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📤 엑셀 파일 업로드 시작:', file.name);
    showLoading();
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
            
            console.log(`✅ 엑셀 파싱 완료: ${jsonData.length}개 행`);
            
            processExcelData(jsonData);
        } catch (error) {
            console.error('❌ 엑셀 파싱 오류:', error);
            showNotification('엑셀 파일을 읽는 중 오류가 발생했습니다: ' + error.message, 'error');
            hideLoading();
        }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset input
    event.target.value = '';
}

async function processExcelData(jsonData) {
    try {
        console.log('🔄 엑셀 데이터 처리 시작');
        
        const newRows = [];
        
        for (let i = 0; i < jsonData.length; i++) {
            const excelRow = jsonData[i];
            
            // Skip empty rows
            if (!excelRow['소재지'] && !excelRow['address'] && !excelRow['주소']) {
                continue;
            }
            
            const inventoryItem = {
                client_id: clientId,
                address: excelRow['소재지'] || excelRow['address'] || excelRow['주소'] || '',
                area: excelRow['면적(㎡)'] || excelRow['area'] || excelRow['면적'] || '',
                acquisition_price: parseNumber(excelRow['취득가액'] || excelRow['acquisition_price'] || excelRow['취득가'] || 0),
                acquisition_date: excelRow['취득일자'] || excelRow['acquisition_date'] || excelRow['취득일'] || '',
                disposal_price: parseNumber(excelRow['양도가액'] || excelRow['disposal_price'] || excelRow['양도가'] || 0),
                disposal_date: excelRow['양도일자'] || excelRow['disposal_date'] || excelRow['양도일'] || '',
                necessary_expenses: parseNumber(excelRow['필요경비'] || excelRow['necessary_expenses'] || 0),
                transfer_income: parseNumber(excelRow['양도소득금액'] || excelRow['transfer_income'] || 0),
                report_status: excelRow['신고여부'] || excelRow['report_status'] || '미신고'
            };
            
            newRows.push(inventoryItem);
        }
        
        console.log(`✅ ${newRows.length}개 데이터 변환 완료`);
        
        if (newRows.length === 0) {
            showNotification('업로드할 데이터가 없습니다.', 'warning');
            hideLoading();
            return;
        }
        
        // Insert into Supabase
        const { data, error } = await supabaseClient
            .from('trader_inventory')
            .insert(newRows)
            .select();
        
        if (error) throw error;
        
        console.log(`✅ Supabase에 ${data.length}개 저장 완료`);
        showNotification(`${data.length}개의 물건이 추가되었습니다.`, 'success');
        
        // Reload inventory
        await loadInventoryData();
        
        hideLoading();
    } catch (error) {
        console.error('❌ 엑셀 데이터 처리 오류:', error);
        showNotification('데이터 저장 중 오류가 발생했습니다: ' + error.message, 'error');
        hideLoading();
    }
}

// ============================================
// Inventory CRUD Operations
// ============================================

function addInventoryRow() {
    const newRow = {
        id: null, // Will be created when saved
        client_id: clientId,
        address: '',
        area: '',
        acquisition_price: 0,
        acquisition_date: '',
        disposal_price: 0,
        disposal_date: '',
        necessary_expenses: 0,
        transfer_income: 0,
        report_status: '미신고'
    };
    
    inventoryRows.unshift(newRow);
    renderInventoryTable();
    
    console.log('➕ 새 행 추가됨');
}

async function saveInventoryRow(index) {
    try {
        showLoading();
        
        const row = inventoryRows[index];
        
        if (row.id) {
            // Update existing
            const { data, error } = await supabaseClient
                .from('trader_inventory')
                .update(row)
                .eq('id', row.id)
                .select()
                .single();
            
            if (error) throw error;
            
            inventoryRows[index] = data;
            console.log('✅ 행 업데이트 완료:', row.id);
        } else {
            // Insert new
            const { data, error } = await supabaseClient
                .from('trader_inventory')
                .insert([row])
                .select()
                .single();
            
            if (error) throw error;
            
            inventoryRows[index] = data;
            console.log('✅ 행 삽입 완료:', data.id);
        }
        
        showNotification('저장되었습니다.', 'success');
        renderInventoryTable();
        hideLoading();
    } catch (error) {
        console.error('❌ 저장 오류:', error);
        showNotification('저장 중 오류가 발생했습니다: ' + error.message, 'error');
        hideLoading();
    }
}

function editInventoryRow(index) {
    console.log('✏️ 행 편집:', index);
    // Implement inline editing if needed
    showNotification('행 편집 기능은 필요경비 상세 버튼을 사용하세요.', 'info');
}

async function deleteInventoryRow(index) {
    if (!confirm('이 물건을 삭제하시겠습니까?')) return;
    
    try {
        showLoading();
        
        const row = inventoryRows[index];
        
        if (row.id) {
            const { error } = await supabaseClient
                .from('trader_inventory')
                .delete()
                .eq('id', row.id);
            
            if (error) throw error;
            
            console.log('✅ 행 삭제 완료:', row.id);
        }
        
        inventoryRows.splice(index, 1);
        renderInventoryTable();
        
        showNotification('삭제되었습니다.', 'success');
        hideLoading();
    } catch (error) {
        console.error('❌ 삭제 오류:', error);
        showNotification('삭제 중 오류가 발생했습니다: ' + error.message, 'error');
        hideLoading();
    }
}

// ============================================
// Expense Detail Functions
// ============================================

function openExpenseDetail(index) {
    currentPropertyIndex = index;
    const row = inventoryRows[index];
    
    console.log('💰 필요경비 상세 열기:', index);
    
    // Update modal title
    const modalTitle = document.getElementById('expenseModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `필요경비 상세 - ${row.address || '물건 ' + (index + 1)}`;
    }
    
    // Load expense details
    loadExpenseDetails(row);
    
    // Show modal
    const modal = document.getElementById('expenseModal');
    if (modal) modal.style.display = 'block';
}

function loadExpenseDetails(row) {
    // Initialize with empty rows
    detailExpenseRows = [];
    
    for (let i = 0; i < EXPENSE_ROW_COUNT; i++) {
        detailExpenseRows.push({
            category: '',
            description: '',
            amount: 0
        });
    }
    
    // Parse existing expense data if available
    if (row.expense_details) {
        try {
            const parsed = JSON.parse(row.expense_details);
            if (Array.isArray(parsed)) {
                parsed.forEach((item, i) => {
                    if (i < EXPENSE_ROW_COUNT) {
                        detailExpenseRows[i] = item;
                    }
                });
            }
        } catch (e) {
            console.warn('⚠️ 필요경비 데이터 파싱 실패:', e);
        }
    }
    
    renderExpenseTable();
    updateExpenseTotal();
}

function renderExpenseTable() {
    const tbody = document.getElementById('expenseTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    detailExpenseRows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center;">${index + 1}</td>
            <td>
                <input type="text" 
                    class="expense-input" 
                    value="${escapeHtml(row.category)}"
                    onchange="updateExpenseRow(${index}, 'category', this.value)"
                    placeholder="비용 구분">
            </td>
            <td>
                <input type="text" 
                    class="expense-input" 
                    value="${escapeHtml(row.description)}"
                    onchange="updateExpenseRow(${index}, 'description', this.value)"
                    placeholder="내역">
            </td>
            <td>
                <input type="text" 
                    class="expense-input" 
                    style="text-align: right;"
                    value="${formatNumber(row.amount)}"
                    onchange="updateExpenseRow(${index}, 'amount', this.value)"
                    placeholder="0">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateExpenseRow(index, field, value) {
    if (field === 'amount') {
        detailExpenseRows[index][field] = parseNumber(value);
    } else {
        detailExpenseRows[index][field] = value;
    }
    updateExpenseTotal();
}

function updateExpenseTotal() {
    const total = detailExpenseRows.reduce((sum, row) => sum + (row.amount || 0), 0);
    const totalElement = document.getElementById('expenseTotal');
    if (totalElement) {
        totalElement.textContent = formatNumber(total);
    }
}

async function saveExpenseDetails() {
    try {
        showLoading();
        
        const row = inventoryRows[currentPropertyIndex];
        
        // Save expense details as JSON
        row.expense_details = JSON.stringify(detailExpenseRows);
        
        // Calculate total necessary expenses
        row.necessary_expenses = detailExpenseRows.reduce((sum, item) => sum + (item.amount || 0), 0);
        
        // Calculate transfer income
        row.transfer_income = row.disposal_price - row.acquisition_price - row.necessary_expenses;
        
        // Update in database
        if (row.id) {
            const { error } = await supabaseClient
                .from('trader_inventory')
                .update({
                    expense_details: row.expense_details,
                    necessary_expenses: row.necessary_expenses,
                    transfer_income: row.transfer_income
                })
                .eq('id', row.id);
            
            if (error) throw error;
        }
        
        console.log('✅ 필요경비 저장 완료');
        showNotification('필요경비가 저장되었습니다.', 'success');
        
        // Close modal
        closeExpenseModal();
        
        // Refresh table
        renderInventoryTable();
        
        hideLoading();
    } catch (error) {
        console.error('❌ 필요경비 저장 오류:', error);
        showNotification('저장 중 오류가 발생했습니다: ' + error.message, 'error');
        hideLoading();
    }
}

function closeExpenseModal() {
    const modal = document.getElementById('expenseModal');
    if (modal) modal.style.display = 'none';
    currentPropertyIndex = -1;
}

// ============================================
// Event Listeners & Initialization
// ============================================

// Make functions global
window.handleExcelUpload = handleExcelUpload;
window.addInventoryRow = addInventoryRow;
window.saveInventoryRow = saveInventoryRow;
window.editInventoryRow = editInventoryRow;
window.deleteInventoryRow = deleteInventoryRow;
window.openExpenseDetail = openExpenseDetail;
window.updateExpenseRow = updateExpenseRow;
window.saveExpenseDetails = saveExpenseDetails;
window.closeExpenseModal = closeExpenseModal;

// Initialize on auth ready
console.log('⏳ 인증 대기 중...');
SupabaseAuth.onAuthStateChanged(async (user) => {
    if (!user) {
        console.warn('⚠️ 사용자 인증 안됨 - 로그인 페이지로 이동');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('✅ 사용자 인증 완료:', user.email);
    
    // Update user info in UI
    const userEmail = user.email || '';
    const userName = userEmail.split('@')[0] || '사용자';
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) userNameElement.textContent = userName;
    if (userAvatarElement) userAvatarElement.textContent = userName.charAt(0).toUpperCase();
    
    const userRoleElement = document.getElementById('userRole');
    if (userRoleElement) userRoleElement.textContent = '매니저';
    
    // Load client data
    await loadClientData();
});

console.log('✅ trader-detail-new.js 로드 완료');
