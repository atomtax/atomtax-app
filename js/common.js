// Authentication (Supabase 통합)
function checkAuth() {
    // Supabase 인증 사용자 반환 (supabase-auth.js에서 관리)
    // 페이지 로드 시 즉시 체크하지 않고, Supabase onAuthStateChanged에서 처리
    return null; // 더 이상 sessionStorage 사용하지 않음
}

function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        // Supabase 로그아웃 사용
        if (typeof SupabaseAuth !== 'undefined') {
            SupabaseAuth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        } else {
            // Fallback: sessionStorage 정리
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    }
}

// Format number with commas
function formatNumber(num) {
    if (!num && num !== 0) return '-';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
}

// Format currency
function formatCurrency(amount) {
    if (!amount && amount !== 0) return '-';
    return formatNumber(amount) + '원';
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        }
        
        .notification-success {
            background: #10b981;
        }
        
        .notification-error {
            background: #ef4444;
        }
        
        .notification-warning {
            background: #f59e0b;
        }
        
        .notification-info {
            background: #3b82f6;
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
    
    if (!document.querySelector('style[data-notification-styles]')) {
        style.setAttribute('data-notification-styles', 'true');
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Toggle sidebar on mobile
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }
}

// Initialize active nav item
function initActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.classList.add('active');
        }
    });
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// API Helper Functions - Dual Write (Supabase + GenSpark)
const API = {
    // Get all clients (Primary: Supabase, Fallback: GenSpark)
    async getClients(params = {}) {
        try {
            // 1. Supabase에서 데이터 가져오기 (Primary)
            let query = supabaseClient.from('clients').select('*', { count: 'exact' });
            
            // Apply filters
            if (params.search) {
                query = query.or(`company_name.ilike.%${params.search}%,representative.ilike.%${params.search}%,business_number.ilike.%${params.search}%`);
            }
            
            // Apply sorting
            if (params.sort) {
                const [field, direction] = params.sort.split(':');
                query = query.order(field, { ascending: direction === 'asc' });
            } else {
                query = query.order('created_at', { ascending: false });
            }
            
            // Apply pagination
            const page = params.page || 1;
            const limit = params.limit || 1000;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);
            
            const { data, error, count } = await query;
            
            if (error) {
                console.warn('⚠️ Supabase 조회 실패, GenSpark로 폴백:', error.message);
                // Fallback to GenSpark
                return await this._getClientsFromGenSpark(params);
            }
            
            console.log('✅ Supabase에서 데이터 조회:', data.length, '개');
            return {
                data: data || [],
                total: count || 0,
                page: page,
                limit: limit,
                source: 'supabase'
            };
        } catch (error) {
            console.error('❌ Get clients error:', error);
            // Fallback to GenSpark
            return await this._getClientsFromGenSpark(params);
        }
    },
    
    // GenSpark Fallback
    async _getClientsFromGenSpark(params = {}) {
        try {
            if (!params.limit) params.limit = 1000;
            const queryString = new URLSearchParams(params).toString();
            const url = `tables/clients${queryString ? '?' + queryString : ''}`;
            const response = await fetch(url);
            const result = await response.json();
            console.log('✅ GenSpark에서 데이터 조회 (Fallback)');
            return { ...result, source: 'genspark' };
        } catch (error) {
            console.error('❌ GenSpark fallback 실패:', error);
            throw error;
        }
    },
    
    // Get single client
    async getClient(id) {
        try {
            const { data, error } = await supabaseClient
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get client error:', error);
            // Fallback to GenSpark
            const response = await fetch(`tables/clients/${id}`);
            return await response.json();
        }
    },
    
    // Supabase 스키마 정의 (실제 테이블 컬럼들)
    _supabaseSchema: [
        'id', 'number', 'company_name', 'business_number', 'representative',
        'manager', 'phone', 'address', 'business_type', 'business_item',
        'start_date', 'end_date', 'contract_amount', 'supply_amount',
        'tax_amount', 'is_terminated', 'termination_date', 'notes',
        'created_at', 'updated_at'
    ],
    
    // 데이터를 Supabase 스키마에 맞게 필터링
    _filterForSupabase(data) {
        const filtered = {};
        for (const key in data) {
            if (this._supabaseSchema.includes(key)) {
                filtered[key] = data[key];
            }
        }
        return filtered;
    },
    
    // Create client (Dual Write)
    async createClient(clientData) {
        console.log('💾 이중 저장 시작: Supabase + GenSpark');
        
        let supabaseSuccess = false;
        let gensparkSuccess = false;
        let supabaseData = null;
        let gensparkData = null;
        
        // 1. Supabase에 저장 (스키마에 맞게 필터링)
        try {
            const filteredData = this._filterForSupabase(clientData);
            console.log('📋 Supabase용 필터링된 데이터:', Object.keys(filteredData).length, '개 필드');
            
            const { data, error } = await supabaseClient
                .from('clients')
                .insert([filteredData])
                .select()
                .single();
            
            if (error) throw error;
            
            supabaseData = data;
            supabaseSuccess = true;
            console.log('✅ Supabase 저장 성공');
        } catch (error) {
            console.error('❌ Supabase 저장 실패:', error.message);
        }
        
        // 2. GenSpark에 저장
        try {
            const response = await fetch('tables/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
            gensparkData = await response.json();
            gensparkSuccess = true;
            console.log('✅ GenSpark 저장 성공');
        } catch (error) {
            console.error('❌ GenSpark 저장 실패:', error.message);
        }
        
        // 결과 처리
        if (supabaseSuccess || gensparkSuccess) {
            console.log('💾 이중 저장 완료:', {
                supabase: supabaseSuccess ? '✅' : '❌',
                genspark: gensparkSuccess ? '✅' : '❌'
            });
            return supabaseData || gensparkData;
        } else {
            throw new Error('양쪽 DB 모두 저장 실패');
        }
    },
    
    // Update client (Dual Write)
    async updateClient(id, clientData) {
        console.log('💾 이중 업데이트 시작: Supabase + GenSpark');
        
        let supabaseSuccess = false;
        let gensparkSuccess = false;
        let supabaseData = null;
        let gensparkData = null;
        
        // 1. Supabase 업데이트 (스키마에 맞게 필터링)
        try {
            const filteredData = this._filterForSupabase(clientData);
            console.log('📋 Supabase용 필터링된 데이터:', Object.keys(filteredData).length, '개 필드');
            
            const { data, error } = await supabaseClient
                .from('clients')
                .update(filteredData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            
            supabaseData = data;
            supabaseSuccess = true;
            console.log('✅ Supabase 업데이트 성공');
        } catch (error) {
            console.error('❌ Supabase 업데이트 실패:', error.message);
        }
        
        // 2. GenSpark 업데이트
        try {
            const response = await fetch(`tables/clients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
            gensparkData = await response.json();
            gensparkSuccess = true;
            console.log('✅ GenSpark 업데이트 성공');
        } catch (error) {
            console.error('❌ GenSpark 업데이트 실패:', error.message);
        }
        
        // 결과 처리
        if (supabaseSuccess || gensparkSuccess) {
            console.log('💾 이중 업데이트 완료:', {
                supabase: supabaseSuccess ? '✅' : '❌',
                genspark: gensparkSuccess ? '✅' : '❌'
            });
            return supabaseData || gensparkData;
        } else {
            throw new Error('양쪽 DB 모두 업데이트 실패');
        }
    },
    
    // Delete client (Dual Delete)
    async deleteClient(id) {
        console.log('🗑️ 이중 삭제 시작: Supabase + GenSpark');
        
        let supabaseSuccess = false;
        let gensparkSuccess = false;
        
        // 1. Supabase 삭제
        try {
            const { error } = await supabaseClient
                .from('clients')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            supabaseSuccess = true;
            console.log('✅ Supabase 삭제 성공');
        } catch (error) {
            console.error('❌ Supabase 삭제 실패:', error.message);
        }
        
        // 2. GenSpark 삭제
        try {
            const response = await fetch(`tables/clients/${id}`, {
                method: 'DELETE'
            });
            gensparkSuccess = response.ok;
            console.log('✅ GenSpark 삭제 성공');
        } catch (error) {
            console.error('❌ GenSpark 삭제 실패:', error.message);
        }
        
        // 결과 처리
        console.log('🗑️ 이중 삭제 완료:', {
            supabase: supabaseSuccess ? '✅' : '❌',
            genspark: gensparkSuccess ? '✅' : '❌'
        });
        
        return supabaseSuccess || gensparkSuccess;
    },
    
    // Get users
    async getUsers() {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*');
            
            if (error) throw error;
            return { data: data || [] };
        } catch (error) {
            console.error('Get users error:', error);
            // Fallback to GenSpark
            const response = await fetch('tables/users');
            return await response.json();
        }
    }
};

// Export to Excel
function exportToExcel(data, filename = 'export.xlsx') {
    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        showNotification('엑셀 라이브러리를 로드하는 중입니다...', 'info');
        
        // Load XLSX library dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = () => {
            exportToExcel(data, filename);
        };
        document.head.appendChild(script);
        return;
    }
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    // Generate file
    XLSX.writeFile(wb, filename);
    showNotification('엑셀 파일이 다운로드되었습니다.', 'success');
}

// Initialize common features
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initActiveNav();
    initDropdowns();
    
    // Initialize logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// Dropdown toggle
function toggleDropdown(event) {
    event.preventDefault();
    const dropdown = event.currentTarget.closest('.nav-dropdown');
    dropdown.classList.toggle('active');
}

// Initialize dropdowns
function initDropdowns() {
    // Check if current page is in dropdown
    const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    
    dropdownItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && currentPath.includes(href.split('/').pop())) {
            item.classList.add('active');
            item.closest('.nav-dropdown').classList.add('active');
        }
    });
}

// Confirm dialog
function confirmDialog(message) {
    return confirm(message);
}

// Loading overlay
function showLoading() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Search and filter helper
function filterData(data, searchTerm, fields) {
    if (!searchTerm) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
        return fields.some(field => {
            const value = item[field];
            return value && value.toString().toLowerCase().includes(term);
        });
    });
}

// Sort data
function sortData(data, field, direction = 'asc') {
    return [...data].sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Handle null/undefined
        if (!aVal) return 1;
        if (!bVal) return -1;
        
        // Convert to string for comparison
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
        
        if (direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
}

// Pagination helper
function paginateData(data, page = 1, perPage = 10) {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    return {
        data: data.slice(start, end),
        total: data.length,
        page: page,
        perPage: perPage,
        totalPages: Math.ceil(data.length / perPage)
    };
}

// Create pagination HTML
function createPagination(totalPages, currentPage, onPageChange) {
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    pagination.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 24px;
    `;
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.className = 'btn btn-secondary';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => onPageChange(currentPage - 1);
    pagination.appendChild(prevBtn);
    
    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentPage ? 'btn btn-primary' : 'btn btn-secondary';
        pageBtn.onclick = () => onPageChange(i);
        pagination.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.className = 'btn btn-secondary';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => onPageChange(currentPage + 1);
    pagination.appendChild(nextBtn);
    
    return pagination;
}
