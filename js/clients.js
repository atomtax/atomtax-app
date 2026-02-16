// Check authentication - Supabase 인증 사용
// Supabase onAuthStateChanged에서 처리하므로 여기서는 UI 업데이트만
// (clients.html의 SupabaseAuth.onAuthStateChanged가 인증 체크 담당)

// 페이지 타입 결정 (기장고객 vs 해임고객)
const isTerminatedPage = window.location.pathname.includes('clients-terminated');

// Global variables
let allClients = [];
let filteredClients = [];
let currentPage = 1;
let perPage = 25;
let currentSort = { field: 'number', direction: 'asc' };
let isEditing = false;

// Load clients
async function loadClients() {
    console.time('⏱️ Total Client Load Time');
    try {
        showLoading();
        console.time('⏱️ API Fetch Time');
        
        let response;
        try {
            response = await API.getClients();
            console.timeEnd('⏱️ API Fetch Time');
            allClients = response.data || [];
        } catch (fetchError) {
            console.timeEnd('⏱️ API Fetch Time');
            console.warn('API 호출 실패 - Preview 모드로 전환합니다:', fetchError);
            // Preview mode: use mock data
            allClients = createMockClients();
        }
        
        console.time('⏱️ Filter Time');
        // 페이지에 따라 필터링: 기장고객(is_terminated가 false 또는 없음) vs 해임고객(is_terminated가 true)
        allClients = allClients.filter(client => {
            const isTerminated = client.is_terminated === true || client.is_terminated === 'true';
            return isTerminatedPage ? isTerminated : !isTerminated;
        });
        console.timeEnd('⏱️ Filter Time');
        
        console.time('⏱️ Sort Time');
        // Sort by number (ascending) by default
        allClients.sort((a, b) => {
            const numA = parseInt(a.number) || 0;
            const numB = parseInt(b.number) || 0;
            return numA - numB;
        });
        console.timeEnd('⏱️ Sort Time');
        
        filteredClients = [...allClients];
        
        console.time('⏱️ Populate Filters Time');
        // Populate filters
        populateFilters();
        console.timeEnd('⏱️ Populate Filters Time');
        
        console.time('⏱️ Render Table Time');
        // Render table
        renderTable();
        console.timeEnd('⏱️ Render Table Time');
        
        hideLoading();
        console.timeEnd('⏱️ Total Client Load Time');
        console.log(`✅ Loaded ${allClients.length} clients successfully`);
    } catch (error) {
        console.timeEnd('⏱️ Total Client Load Time');
        console.error('Error loading clients:', error);
        showNotification('고객사 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
        hideLoading();
    }
}

// Populate filter dropdowns
function populateFilters() {
    // Managers
    const managers = [...new Set(allClients.map(c => c.manager).filter(m => m))].sort();
    const managerFilter = document.getElementById('managerFilter');
    managerFilter.innerHTML = '<option value="">전체 담당자</option>' + 
        managers.map(m => `<option value="${m}">${m}</option>`).join('');
}

// Apply filters
function applyFilters() {
    const managerFilter = document.getElementById('managerFilter').value;
    const companyNameSearch = document.getElementById('companyNameSearch').value;
    const searchTerm = document.getElementById('globalSearch').value;
    
    filteredClients = allClients.filter(client => {
        // Manager filter
        if (managerFilter && client.manager !== managerFilter) return false;
        
        // Company name search
        if (companyNameSearch) {
            const term = companyNameSearch.toLowerCase();
            const companyName = (client.company_name || '').toLowerCase();
            if (!companyName.includes(term)) return false;
        }
        
        // Global search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const searchFields = [
                'number', 'company_name', 'manager', 'ceo_name', 'business_number', 
                'business_type', 'phone', 'contact', 'email', 'address'
            ];
            const matches = searchFields.some(field => {
                const value = client[field];
                return value && value.toString().toLowerCase().includes(term);
            });
            if (!matches) return false;
        }
        
        return true;
    });
    
    // Sort by current sort settings (default: number ascending)
    if (currentSort.field === 'number') {
        filteredClients.sort((a, b) => {
            const numA = parseInt(a.number) || 0;
            const numB = parseInt(b.number) || 0;
            return currentSort.direction === 'asc' ? numA - numB : numB - numA;
        });
    } else {
        filteredClients.sort((a, b) => {
            let aVal = a[currentSort.field] || '';
            let bVal = b[currentSort.field] || '';
            
            if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    // Reset to page 1
    currentPage = 1;
    renderTable();
}

// Reset filters
function resetFilters() {
    document.getElementById('managerFilter').value = '';
    document.getElementById('companyNameSearch').value = '';
    document.getElementById('globalSearch').value = '';
    applyFilters();
}

// Sort clients
function sortClients(field) {
    if (currentSort.field === field) {
        // Toggle direction
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // New field, default to ascending
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    
    filteredClients.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Handle numeric sorting for number field
        if (field === 'number') {
            aVal = parseInt(aVal) || 0;
            bVal = parseInt(bVal) || 0;
        }
        
        // Handle null/undefined
        if (!aVal) aVal = '';
        if (!bVal) bVal = '';
        
        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    renderTable();
}

// Render table
function renderTable() {
    const tbody = document.getElementById('clientsTableBody');
    const clientCount = document.getElementById('clientCount');
    
    clientCount.textContent = filteredClients.length;
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const pageClients = filteredClients.slice(startIndex, endIndex);
    
    // Empty state
    if (pageClients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 40px; color: #9ca3af;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    ${filteredClients.length === 0 && allClients.length === 0 ? '등록된 고객사가 없습니다.' : '검색 결과가 없습니다.'}
                </td>
            </tr>
        `;
        document.getElementById('paginationContainer').innerHTML = '';
        return;
    }
    
    // Render rows
    tbody.innerHTML = pageClients.map(client => `
        <tr>
            <td style="font-weight: 600; color: #667eea;">${escapeHtml(client.number || '')}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <a href="javascript:void(0)" onclick="showQuickView('${client.id}')" style="color: #667eea; font-weight: 600; text-decoration: none;">
                        ${escapeHtml(client.company_name || '')}
                    </a>
                    <button onclick="showQuickView('${client.id}')" class="icon-btn" title="빠른 조회" style="color: #667eea;">
                        <i class="fas fa-eye"></i>
                    </button>
                    <a href="client-detail.html?id=${client.id}" class="icon-btn" title="상세 페이지로 이동" style="color: #6b7280;">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </td>
            <td>${escapeHtml(client.manager || '')}</td>
            <td style="font-family: monospace;">${formatBusinessNumber(client.business_number)}</td>
            <td>${escapeHtml(client.ceo_name || '')}</td>
            <td>
                <span class="badge badge-info">${escapeHtml(client.business_type || '')}</span>
            </td>
            <td>${formatPhoneNumber(client.contact || client.phone)}</td>
            <td style="text-align: center;">
                ${client.google_drive_folder ? `
                    <a href="${escapeHtml(client.google_drive_folder)}" target="_blank" class="btn btn-sm btn-success" title="기장 드라이브 열기" style="background: #34a853; border-color: #34a853;">
                        <i class="fab fa-google-drive"></i>
                    </a>
                ` : `
                    <span style="color: #d1d5db;" title="드라이브 폴더 없음">
                        <i class="fas fa-minus"></i>
                    </span>
                `}
            </td>
            <td style="text-align: center;">
                ${client.real_estate_drive_folder ? `
                    <a href="${escapeHtml(client.real_estate_drive_folder)}" target="_blank" class="btn btn-sm" title="부동산 드라이브 열기" style="background: #f59e0b; border-color: #f59e0b; color: white;">
                        <i class="fas fa-building"></i>
                    </a>
                ` : `
                    <span style="color: #d1d5db;" title="부동산 폴더 없음">
                        <i class="fas fa-minus"></i>
                    </span>
                `}
            </td>
            <td style="text-align: center;">
                <button class="btn btn-sm btn-secondary" onclick="editClient('${client.id}')" title="수정">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
            <td style="text-align: center;">
                <button class="btn btn-sm btn-danger" onclick="deleteClient('${client.id}', '${escapeHtml(client.company_name)}')" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Render pagination
    renderPagination();
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredClients.length / perPage);
    const container = document.getElementById('paginationContainer');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination">';
    
    // Previous button
    html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
    </button>`;
    
    // Page numbers
    const maxPages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    if (startPage > 1) {
        html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) html += '<span class="page-ellipsis">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span class="page-ellipsis">...</span>';
        html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
        <i class="fas fa-chevron-right"></i>
    </button>`;
    
    html += '</div>';
    container.innerHTML = html;
}

// Go to page
function goToPage(page) {
    const totalPages = Math.ceil(filteredClients.length / perPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
}

// Export to Excel
function exportToExcel() {
    if (filteredClients.length === 0) {
        showNotification('내보낼 데이터가 없습니다.', 'warning');
        return;
    }
    
    // Prepare data with Korean headers
    const headers = ['번호', '거래처명', '담당자', '사업자번호', '대표자', '업태', '종목', '업종코드', '연락처', '이메일', '우편번호', '주소', '법인등록번호', '공급가액', '세액', '최초출금월'];
    const data = filteredClients.map(client => [
        client.number || '',
        client.company_name || '',
        client.manager || '',
        client.business_number || '',
        client.ceo_name || '',
        client.business_type || '',
        client.business_item || '',
        client.business_code || '',
        client.phone || '',
        client.email || '',
        client.postal_code || '',
        client.address || '',
        client.corporate_number || '',
        client.supply_amount || '',
        client.tax_amount || '',
        client.first_withdrawal_month || ''
    ]);
    
    // Create workbook
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '고객사 목록');
    
    // Download
    const filename = `고객사목록_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    showNotification(`${filteredClients.length}개의 고객사 데이터를 다운로드했습니다.`, 'success');
}

// Open modal for new client
function openNewClientModal() {
    isEditing = false;
    document.getElementById('modalTitle').textContent = '고객사 추가';
    document.getElementById('clientForm').reset();
    document.getElementById('clientId').value = '';
    
    // 번호 필드를 비워둠 (자동 할당을 위해)
    document.getElementById('number').value = '';
    
    // Enable number field for manual editing
    document.getElementById('number').removeAttribute('readonly');
    
    // Reset tax amount field
    document.getElementById('tax_amount').value = '';
    
    // 해임여부 체크박스 초기화 (현재 페이지에 맞게 설정)
    document.getElementById('is_terminated').checked = isTerminatedPage;
    
    document.getElementById('clientModal').style.display = 'flex';
}

// Generate next number
function generateNextNumber() {
    if (allClients.length === 0) {
        document.getElementById('number').value = '1';
        return;
    }
    
    // Find max number
    const numbers = allClients
        .map(c => parseInt(c.number))
        .filter(n => !isNaN(n));
    
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    document.getElementById('number').value = (maxNumber + 1).toString();
}

// Edit client
async function editClient(clientId) {
    try {
        showLoading();
        const client = await API.getClient(clientId);
        
        isEditing = true;
        document.getElementById('modalTitle').textContent = '고객사 수정';
        document.getElementById('clientId').value = client.id;
        document.getElementById('number').value = client.number || '';
        document.getElementById('company_name').value = client.company_name || '';
        document.getElementById('manager').value = client.manager || '';
        document.getElementById('ceo_name').value = client.ceo_name || '';
        // Fix: use contact field instead of phone
        document.getElementById('phone').value = client.contact || client.phone || '';
        document.getElementById('email').value = client.email || '';
        document.getElementById('business_number').value = client.business_number || '';
        document.getElementById('resident_number').value = client.resident_number || '';
        document.getElementById('corporate_number').value = client.corporate_number || '';
        document.getElementById('business_type').value = client.business_type || '';
        document.getElementById('business_item').value = client.business_item || '';
        document.getElementById('business_code').value = client.business_code || '';
        document.getElementById('postal_code').value = client.postal_code || '';
        document.getElementById('address').value = client.address || '';
        document.getElementById('supply_amount').value = client.supply_amount || '';
        document.getElementById('tax_amount').value = client.tax_amount || '';
        document.getElementById('first_withdrawal_month').value = client.first_withdrawal_month || '';
        document.getElementById('hometax_id').value = client.hometax_id || '';
        document.getElementById('hometax_password').value = client.hometax_password || '';
        document.getElementById('google_drive_folder').value = client.google_drive_folder || '';
        document.getElementById('real_estate_drive_folder').value = client.real_estate_drive_folder || '';
        
        // 해임여부 체크박스 설정
        document.getElementById('is_terminated').checked = client.is_terminated === true || client.is_terminated === 'true';
        
        document.getElementById('clientModal').style.display = 'flex';
        hideLoading();
    } catch (error) {
        console.error('Error loading client:', error);
        showNotification('고객사 정보를 불러오는 중 오류가 발생했습니다.', 'error');
        hideLoading();
    }
}

// Save client
async function saveClient(event) {
    event.preventDefault();
    
    // 번호 입력 확인 및 빈 번호 자동 채우기
    let clientNumber = document.getElementById('number').value.trim();
    
    // 번호가 비어있으면 자동으로 빈 번호 찾아서 채우기
    if (!clientNumber && !isEditing) {
        clientNumber = await findNextAvailableNumber();
        console.log(`✅ 빈 번호 자동 할당: ${clientNumber}`);
    }
    
    // 🔹 번호 중복 체크 (신규 등록 또는 번호가 변경된 경우)
    const currentClientId = isEditing ? document.getElementById('clientId').value : null;
    const isDuplicate = await checkDuplicateNumber(clientNumber, currentClientId);
    
    if (isDuplicate) {
        alert(`⚠️ 번호 "${clientNumber}"은(는) 이미 사용 중입니다.\n다른 번호를 입력해주세요.`);
        document.getElementById('number').focus();
        return; // 저장 중단
    }
    
    const clientData = {
        number: clientNumber,
        company_name: document.getElementById('company_name').value.trim(),
        manager: document.getElementById('manager').value.trim(),
        ceo_name: document.getElementById('ceo_name').value.trim(),
        contact: document.getElementById('phone').value.trim(),  // Save as 'contact'
        email: document.getElementById('email').value.trim(),
        google_drive_folder: document.getElementById('google_drive_folder').value.trim(),
        real_estate_drive_folder: document.getElementById('real_estate_drive_folder').value.trim(),
        business_number: document.getElementById('business_number').value.trim(),
        resident_number: document.getElementById('resident_number').value.trim(),
        corporate_number: document.getElementById('corporate_number').value.trim(),
        business_type: document.getElementById('business_type').value.trim(),
        business_item: document.getElementById('business_item').value.trim(),
        business_code: document.getElementById('business_code').value.trim(),
        postal_code: document.getElementById('postal_code').value.trim(),
        address: document.getElementById('address').value.trim(),
        supply_amount: parseFloat(document.getElementById('supply_amount').value) || 0,
        tax_amount: parseFloat(document.getElementById('tax_amount').value) || 0,
        first_withdrawal_month: document.getElementById('first_withdrawal_month').value.trim(),
        hometax_id: document.getElementById('hometax_id').value.trim(),
        hometax_password: document.getElementById('hometax_password').value.trim(),
        is_terminated: document.getElementById('is_terminated').checked  // 해임여부 저장
    };
    
    try {
        showLoading();
        
        if (isEditing) {
            const clientId = document.getElementById('clientId').value;
            await API.updateClient(clientId, clientData);
            showNotification('고객사 정보가 수정되었습니다.', 'success');
        } else {
            await API.createClient(clientData);
            showNotification(`새 고객사가 등록되었습니다. (번호: ${clientNumber})`, 'success');
        }
        
        document.getElementById('clientModal').style.display = 'none';
        await loadClients();
        hideLoading();
    } catch (error) {
        console.error('Error saving client:', error);
        showNotification('저장 중 오류가 발생했습니다.', 'error');
        hideLoading();
    }
}

// 🔹 번호 중복 체크 함수 (해임고객 제외)
async function checkDuplicateNumber(number, currentClientId = null) {
    try {
        // 모든 고객사 데이터 가져오기
        const response = await API.getClients();
        const allClients = response.data || [];
        
        // 해임고객이 아닌 고객들 중에서 중복 체크
        const activeClients = allClients.filter(client => {
            const isTerminated = client.is_terminated === true || client.is_terminated === 'true';
            return !isTerminated; // 해임고객 제외
        });
        
        // 같은 번호를 가진 다른 고객이 있는지 확인
        const duplicate = activeClients.find(client => {
            // 현재 수정 중인 고객은 제외
            if (currentClientId && client.id === currentClientId) {
                return false;
            }
            return client.number === number;
        });
        
        return !!duplicate; // 중복이면 true, 아니면 false
    } catch (error) {
        console.error('Error checking duplicate number:', error);
        return false; // 오류 발생 시 저장 허용 (false 반환)
    }
}

// 빈 번호 찾기 함수 (1부터 순차적으로 확인)
async function findNextAvailableNumber() {
    try {
        // 모든 고객사 데이터 가져오기 (해임 포함)
        const response = await API.getClients();
        const allClients = response.data || [];
        
        // 기존 번호들을 숫자 배열로 변환
        const existingNumbers = allClients
            .map(client => parseInt(client.number))
            .filter(num => !isNaN(num) && num > 0)
            .sort((a, b) => a - b);
        
        // 1부터 시작하여 빈 번호 찾기
        let nextNumber = 1;
        for (const num of existingNumbers) {
            if (num === nextNumber) {
                nextNumber++;
            } else if (num > nextNumber) {
                // 빈 번호를 찾음
                break;
            }
        }
        
        return String(nextNumber);
    } catch (error) {
        console.error('Error finding next available number:', error);
        // 오류 발생 시 현재 최대 번호 + 1 반환
        return String(allClients.length + 1);
    }
}

// Delete client
async function deleteClient(clientId, companyName) {
    if (!confirm(`"${companyName}" 고객사를 삭제하시겠습니까?`)) return;
    
    try {
        showLoading();
        await API.deleteClient(clientId);
        showNotification('고객사가 삭제되었습니다.', 'success');
        await loadClients();
        hideLoading();
    } catch (error) {
        console.error('Error deleting client:', error);
        showNotification('삭제 중 오류가 발생했습니다.', 'error');
        hideLoading();
    }
}

// Close modal
function closeModal() {
    document.getElementById('clientModal').style.display = 'none';
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format business number (000-00-00000)
function formatBusinessNumber(number) {
    if (!number) return '';
    const cleaned = number.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) {
        return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 5) + '-' + cleaned.slice(5);
    }
    return number;
}

// Format phone number (000-0000-0000)
function formatPhoneNumber(number) {
    if (!number) return '';
    const cleaned = number.replace(/[^0-9]/g, '');
    if (cleaned.length === 11) {
        return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7) + '-' + cleaned.slice(7);
    }
    return number;
}

// Format resident/corp number (000000-0000000)
function formatIdentityNumber(number) {
    if (!number) return '';
    const cleaned = number.replace(/[^0-9]/g, '');
    if (cleaned.length === 13) {
        return cleaned.slice(0, 6) + '-' + cleaned.slice(6);
    }
    return number;
}

// Daum Postcode API
function openPostcodePopup() {
    new daum.Postcode({
        oncomplete: function(data) {
            // 우편번호와 주소 정보를 입력
            document.getElementById('postal_code').value = data.zonecode;
            document.getElementById('address').value = data.roadAddress || data.jibunAddress;
        }
    }).open();
}

// Auto-calculate tax amount (10% of supply amount)
function autoCalculateTax() {
    const supplyAmount = parseFloat(document.getElementById('supply_amount').value) || 0;
    const taxAmount = Math.round(supplyAmount * 0.1);
    document.getElementById('tax_amount').value = taxAmount;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Client page loaded, starting initialization...');
    // Load clients
    loadClients();
    
    // Filter events
    document.getElementById('managerFilter').addEventListener('change', applyFilters);
    document.getElementById('companyNameSearch').addEventListener('input', applyFilters);
    document.getElementById('globalSearch').addEventListener('input', applyFilters);
    
    // Sort events
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            sortClients(th.dataset.sort);
        });
    });
    
    // Per page change
    document.getElementById('perPageSelect').addEventListener('change', (e) => {
        perPage = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
    });
    
    // Export to Excel
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
    
    // Add client button
    document.getElementById('addClientBtn').addEventListener('click', openNewClientModal);
    
    // Modal events
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    // ⚠️ 모달 배경 클릭 시 닫기 기능 제거 (취소/저장 버튼만 동작)
    // document.getElementById('clientModal').addEventListener('click', (e) => {
    //     if (e.target.id === 'clientModal') closeModal();
    // });
    
    // Form submit
    document.getElementById('clientForm').addEventListener('submit', saveClient);
    
    // Postal code search
    document.getElementById('searchPostalCode').addEventListener('click', openPostcodePopup);
    
    // Auto-calculate tax when supply amount changes
    document.getElementById('supply_amount').addEventListener('input', autoCalculateTax);
    
    // Initialize column resizing
    initColumnResize();
});

// Create mock clients for preview mode
function createMockClients() {
    console.log('📦 Creating 100 mock clients for preview mode...');
    
    const managers = ['김철수', '이영희', '박민수', '정다은', '최준호', '강서연', '윤지훈', '임수빈'];
    const businessTypes = ['부동산 임대업', '부동산 매매업', '부동산 중개업', '건설업', '무역업', '제조업', '도소매업', '서비스업'];
    const districts = ['강남구', '서초구', '송파구', '강동구', '마포구', '용산구', '영등포구', '구로구', '금천구', '관악구'];
    const names = ['홍길동', '김영수', '이순신', '세종대왕', '장보고', '신사임당', '유관순', '안중근', '윤봉길', '김구'];
    
    const clients = [];
    for (let i = 1; i <= 100; i++) {
        const bizNum = `${String(100 + i).slice(-3)}-${String(10 + i).slice(-2)}-${String(10000 + i).slice(-5)}`;
        clients.push({
            id: `mock-client-${i}`,
            number: String(i),
            company_name: `테스트고객사${i}`,
            manager: managers[i % managers.length],
            business_number: bizNum,
            ceo_name: names[i % names.length],
            business_type: businessTypes[i % businessTypes.length],
            contact: `010-${String(1000 + i).slice(-4)}-${String(5000 + i).slice(-4)}`,
            email: `test${i}@example.com`,
            address: `서울시 ${districts[i % districts.length]} 테스트로 ${i * 10}`,
            business_code: i % 10 === 0 ? '703011' : i % 10 === 1 ? '703012' : '',
            supply_amount: (i * 100000),
            tax_amount: (i * 10000)
        });
    }
    
    return clients;
}

// Quick View Modal Functions
let currentQuickViewId = null;

async function showQuickView(clientId) {
    currentQuickViewId = clientId;
    const modal = document.getElementById('quickViewModal');
    const loading = document.getElementById('quickViewLoading');
    const content = document.getElementById('quickViewContent');
    
    modal.style.display = 'flex';
    loading.style.display = 'block';
    content.style.display = 'none';
    
    try {
        const client = await API.getClient(clientId);
        
        // Update title
        document.getElementById('quickViewTitle').textContent = client.company_name || '고객사 정보';
        
        // Basic info
        document.getElementById('qv-number').textContent = client.number || '-';
        document.getElementById('qv-company_name').textContent = client.company_name || '-';
        document.getElementById('qv-manager').textContent = client.manager || '-';
        document.getElementById('qv-ceo_name').textContent = client.ceo_name || '-';
        document.getElementById('qv-contact').textContent = formatPhoneNumber(client.contact || client.phone) || '-';
        document.getElementById('qv-email').textContent = client.email || '-';
        
        // Google Drive folder
        const driveElement = document.getElementById('qv-google_drive_folder');
        if (client.google_drive_folder) {
            driveElement.innerHTML = `
                <a href="${escapeHtml(client.google_drive_folder)}" target="_blank" style="color: #34a853; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fab fa-google-drive"></i>
                    <span>기장 드라이브 폴더 열기</span>
                    <i class="fas fa-external-link-alt" style="font-size: 12px;"></i>
                </a>
            `;
        } else {
            driveElement.textContent = '-';
        }
        
        // Real Estate Drive folder
        const realEstateElement = document.getElementById('qv-real_estate_drive_folder');
        if (client.real_estate_drive_folder) {
            realEstateElement.innerHTML = `
                <a href="${escapeHtml(client.real_estate_drive_folder)}" target="_blank" style="color: #f59e0b; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fas fa-building"></i>
                    <span>부동산 드라이브 폴더 열기</span>
                    <i class="fas fa-external-link-alt" style="font-size: 12px;"></i>
                </a>
            `;
        } else {
            realEstateElement.textContent = '-';
        }
        
        // Business info
        document.getElementById('qv-business_number').textContent = formatBusinessNumber(client.business_number) || '-';
        document.getElementById('qv-resident_number').textContent = formatIdentityNumber(client.resident_number) || '-';
        document.getElementById('qv-corp_number').textContent = formatIdentityNumber(client.corp_number || client.corporate_number) || '-';
        document.getElementById('qv-business_type').textContent = client.business_type || '-';
        document.getElementById('qv-business_item').textContent = client.business_item || '-';
        document.getElementById('qv-business_code').textContent = client.business_code || '-';
        document.getElementById('qv-postal_code').textContent = client.postal_code || '-';
        document.getElementById('qv-address').textContent = client.address || '-';
        
        // Tax info
        const supplyAmount = client.supply_amount || 0;
        const taxAmount = client.tax_amount || 0;
        document.getElementById('qv-supply_amount').textContent = supplyAmount.toLocaleString() + '원';
        document.getElementById('qv-tax_amount').textContent = taxAmount.toLocaleString() + '원';
        document.getElementById('qv-first_withdrawal_month').textContent = client.first_withdrawal_month || '-';
        document.getElementById('qv-hometax_id').textContent = client.hometax_id || '-';
        document.getElementById('qv-hometax_password').textContent = client.hometax_password || '••••••••';
        
        loading.style.display = 'none';
        content.style.display = 'block';
    } catch (error) {
        console.error('Error loading client:', error);
        showNotification('고객사 정보를 불러오는 중 오류가 발생했습니다.', 'error');
        closeQuickView();
    }
}

function closeQuickView() {
    document.getElementById('quickViewModal').style.display = 'none';
    currentQuickViewId = null;
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

function openDetailPage() {
    if (currentQuickViewId) {
        window.open(`client-detail.html?id=${currentQuickViewId}`, '_blank');
    }
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('quickViewModal');
    if (e.target === modal) {
        closeQuickView();
    }
});

// Column resize functionality
function initColumnResize() {
    const table = document.getElementById('clientsTable');
    if (!table) return;
    
    const ths = table.querySelectorAll('th');
    let currentTh = null;
    let startX = 0;
    let startWidth = 0;
    
    ths.forEach(th => {
        const resizeHandle = th.querySelector('.resize-handle');
        if (!resizeHandle) return;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentTh = th;
            startX = e.pageX;
            startWidth = th.offsetWidth;
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
    });
    
    function handleMouseMove(e) {
        if (!currentTh) return;
        
        const diff = e.pageX - startX;
        const newWidth = Math.max(50, startWidth + diff); // Minimum 50px
        currentTh.style.width = newWidth + 'px';
    }
    
    function handleMouseUp() {
        currentTh = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
}
