// Supabase Database API Module
// Firebase Firestore를 Supabase PostgreSQL로 교체

// ============================================
// Clients (고객사) CRUD
// ============================================

/**
 * 고객사 목록 가져오기
 * @param {Object} options - 쿼리 옵션 (orderBy, limit 등)
 * @returns {Promise<Object>} { success, data, error }
 */
async function getClients(options = {}) {
    try {
        let query = supabaseClient
            .from('clients')
            .select('*');

        // 정렬 (기본: company_name)
        const orderBy = options.orderBy || 'company_name';
        const ascending = options.ascending !== false;
        query = query.order(orderBy, { ascending });

        // 제한
        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        console.log(`✅ Loaded ${data.length} clients`);
        return { success: true, data };
    } catch (error) {
        console.error('Get clients error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 특정 고객사 가져오기
 * @param {string} clientId - 고객사 ID
 * @returns {Promise<Object>} { success, data, error }
 */
async function getClient(clientId) {
    try {
        const { data, error } = await supabaseClient
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

        if (error) throw error;

        console.log(`✅ Loaded client: ${data.company_name}`);
        return { success: true, data };
    } catch (error) {
        console.error('Get client error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 고객사 추가
 * @param {Object} clientData - 고객사 데이터
 * @returns {Promise<Object>} { success, id, data, error }
 */
async function addClient(clientData) {
    try {
        const { data, error } = await supabaseClient
            .from('clients')
            .insert([clientData])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Added client: ${data.company_name} (ID: ${data.id})`);
        return { success: true, id: data.id, data };
    } catch (error) {
        console.error('Add client error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 고객사 수정
 * @param {string} clientId - 고객사 ID
 * @param {Object} clientData - 수정할 데이터
 * @returns {Promise<Object>} { success, data, error }
 */
async function updateClient(clientId, clientData) {
    try {
        const { data, error } = await supabaseClient
            .from('clients')
            .update(clientData)
            .eq('id', clientId)
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Updated client: ${data.company_name}`);
        return { success: true, data };
    } catch (error) {
        console.error('Update client error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 고객사 삭제
 * @param {string} clientId - 고객사 ID
 * @returns {Promise<Object>} { success, error }
 */
async function deleteClient(clientId) {
    try {
        const { error } = await supabaseClient
            .from('clients')
            .delete()
            .eq('id', clientId);

        if (error) throw error;

        console.log(`✅ Deleted client: ${clientId}`);
        return { success: true };
    } catch (error) {
        console.error('Delete client error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 번호 중복 체크 (해임 고객 제외)
 * @param {string} number - 확인할 번호
 * @param {string} excludeId - 제외할 ID (수정 시 자기 자신 제외)
 * @returns {Promise<boolean>} 중복 여부
 */
async function isClientNumberDuplicate(number, excludeId = null) {
    try {
        let query = supabaseClient
            .from('clients')
            .select('id')
            .eq('number', number)
            .eq('is_terminated', false);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data.length > 0;
    } catch (error) {
        console.error('Check duplicate number error:', error);
        return false;
    }
}

// ============================================
// Trader Inventory (매매사업자 재고) CRUD
// ============================================

/**
 * 특정 고객의 물건 목록 가져오기
 * @param {string} clientId - 고객사 ID
 * @returns {Promise<Object>} { success, data, error }
 */
async function getTraderInventory(clientId) {
    try {
        const { data, error } = await supabaseClient
            .from('trader_inventory')
            .select(`
                *,
                expenses (*)
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`✅ Loaded ${data.length} inventory items for client ${clientId}`);
        return { success: true, data };
    } catch (error) {
        console.error('Get inventory error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 물건 추가
 * @param {string} clientId - 고객사 ID
 * @param {Object} inventoryData - 물건 데이터
 * @returns {Promise<Object>} { success, id, data, error }
 */
async function addInventoryItem(clientId, inventoryData) {
    try {
        const itemData = {
            client_id: clientId,
            ...inventoryData
        };

        const { data, error } = await supabaseClient
            .from('trader_inventory')
            .insert([itemData])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Added inventory item: ${data.property_name} (ID: ${data.id})`);
        return { success: true, id: data.id, data };
    } catch (error) {
        console.error('Add inventory error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 물건 여러 개 일괄 추가
 * @param {string} clientId - 고객사 ID
 * @param {Array} inventoryArray - 물건 데이터 배열
 * @returns {Promise<Object>} { success, data, error }
 */
async function addInventoryItems(clientId, inventoryArray) {
    try {
        const items = inventoryArray.map(item => ({
            client_id: clientId,
            ...item
        }));

        const { data, error } = await supabaseClient
            .from('trader_inventory')
            .insert(items)
            .select();

        if (error) throw error;

        console.log(`✅ Added ${data.length} inventory items for client ${clientId}`);
        return { success: true, data };
    } catch (error) {
        console.error('Add inventory items error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 물건 수정
 * @param {string} inventoryId - 물건 ID
 * @param {Object} inventoryData - 수정할 데이터
 * @returns {Promise<Object>} { success, data, error }
 */
async function updateInventoryItem(inventoryId, inventoryData) {
    try {
        const { data, error } = await supabaseClient
            .from('trader_inventory')
            .update(inventoryData)
            .eq('id', inventoryId)
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Updated inventory item: ${data.property_name}`);
        return { success: true, data };
    } catch (error) {
        console.error('Update inventory error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 물건 삭제
 * @param {string} inventoryId - 물건 ID
 * @returns {Promise<Object>} { success, error }
 */
async function deleteInventoryItem(inventoryId) {
    try {
        const { error } = await supabaseClient
            .from('trader_inventory')
            .delete()
            .eq('id', inventoryId);

        if (error) throw error;

        console.log(`✅ Deleted inventory item: ${inventoryId}`);
        return { success: true };
    } catch (error) {
        console.error('Delete inventory error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// Expenses (필요경비) CRUD
// ============================================

/**
 * 특정 물건의 필요경비 목록 가져오기
 * @param {string} inventoryId - 물건 ID
 * @returns {Promise<Object>} { success, data, error }
 */
async function getExpenses(inventoryId) {
    try {
        const { data, error } = await supabaseClient
            .from('expenses')
            .select('*')
            .eq('inventory_id', inventoryId)
            .order('no', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Get expenses error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 필요경비 추가
 * @param {string} inventoryId - 물건 ID
 * @param {Object} expenseData - 필요경비 데이터
 * @returns {Promise<Object>} { success, id, data, error }
 */
async function addExpense(inventoryId, expenseData) {
    try {
        const itemData = {
            inventory_id: inventoryId,
            ...expenseData
        };

        const { data, error } = await supabaseClient
            .from('expenses')
            .insert([itemData])
            .select()
            .single();

        if (error) throw error;

        return { success: true, id: data.id, data };
    } catch (error) {
        console.error('Add expense error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 필요경비 수정
 * @param {string} expenseId - 필요경비 ID
 * @param {Object} expenseData - 수정할 데이터
 * @returns {Promise<Object>} { success, data, error }
 */
async function updateExpense(expenseId, expenseData) {
    try {
        const { data, error } = await supabaseClient
            .from('expenses')
            .update(expenseData)
            .eq('id', expenseId)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Update expense error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 필요경비 삭제
 * @param {string} expenseId - 필요경비 ID
 * @returns {Promise<Object>} { success, error }
 */
async function deleteExpense(expenseId) {
    try {
        const { error } = await supabaseClient
            .from('expenses')
            .delete()
            .eq('id', expenseId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Delete expense error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// Documents (서류) CRUD
// ============================================

/**
 * 특정 물건의 서류 목록 가져오기
 * @param {string} inventoryId - 물건 ID
 * @returns {Promise<Object>} { success, data, error }
 */
async function getDocuments(inventoryId) {
    try {
        const { data, error } = await supabaseClient
            .from('documents')
            .select('*')
            .eq('inventory_id', inventoryId)
            .order('upload_date', { ascending: false });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Get documents error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 서류 추가
 * @param {string} inventoryId - 물건 ID
 * @param {Object} documentData - 서류 데이터
 * @returns {Promise<Object>} { success, id, data, error }
 */
async function addDocument(inventoryId, documentData) {
    try {
        const itemData = {
            inventory_id: inventoryId,
            ...documentData
        };

        const { data, error } = await supabaseClient
            .from('documents')
            .insert([itemData])
            .select()
            .single();

        if (error) throw error;

        return { success: true, id: data.id, data };
    } catch (error) {
        console.error('Add document error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 서류 삭제
 * @param {string} documentId - 서류 ID
 * @returns {Promise<Object>} { success, error }
 */
async function deleteDocument(documentId) {
    try {
        const { error } = await supabaseClient
            .from('documents')
            .delete()
            .eq('id', documentId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Delete document error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 백업 및 복구
// ============================================

/**
 * 전체 데이터 백업 (JSON 다운로드)
 */
async function backupAllData() {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            clients: [],
            inventory: [],
            expenses: []
        };

        // 고객사 데이터
        const { data: clients } = await supabaseClient
            .from('clients')
            .select('*');
        backup.clients = clients || [];

        // 재고 데이터
        const { data: inventory } = await supabaseClient
            .from('trader_inventory')
            .select('*');
        backup.inventory = inventory || [];

        // 필요경비 데이터
        const { data: expenses } = await supabaseClient
            .from('expenses')
            .select('*');
        backup.expenses = expenses || [];

        // JSON 파일로 다운로드
        const blob = new Blob([JSON.stringify(backup, null, 2)], 
                              { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `supabase_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        console.log('✅ Backup completed');
        return { success: true };
    } catch (error) {
        console.error('Backup error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * localStorage → Supabase 마이그레이션
 * @param {string} clientId - 고객사 ID
 * @returns {Promise<Object>} { success, count, error }
 */
async function migrateFromLocalStorage(clientId) {
    try {
        const key = `trader_inventory_${clientId}`;
        const localData = localStorage.getItem(key);

        if (!localData) {
            return { success: true, count: 0, message: 'No data to migrate' };
        }

        const inventoryArray = JSON.parse(localData);
        
        if (!Array.isArray(inventoryArray) || inventoryArray.length === 0) {
            return { success: true, count: 0, message: 'No valid data to migrate' };
        }

        // Supabase에 일괄 추가
        const result = await addInventoryItems(clientId, inventoryArray);

        if (result.success) {
            console.log(`✅ Migrated ${result.data.length} items from localStorage to Supabase`);
            return { 
                success: true, 
                count: result.data.length,
                message: `${result.data.length}개 물건이 마이그레이션되었습니다.`
            };
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Migration error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 실시간 리스너 (Realtime)
// ============================================

/**
 * 특정 고객의 물건 목록 실시간 구독
 * @param {string} clientId - 고객사 ID
 * @param {Function} callback - 변경 시 호출될 콜백 함수
 * @returns {Function} 구독 해제 함수
 */
function listenToInventoryChanges(clientId, callback) {
    const channel = supabaseClient
        .channel(`inventory_${clientId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'trader_inventory',
                filter: `client_id=eq.${clientId}`
            },
            (payload) => {
                console.log('🔔 Inventory changed:', payload);
                callback(payload);
            }
        )
        .subscribe();

    // 구독 해제 함수 반환
    return () => {
        supabaseClient.removeChannel(channel);
    };
}

// ============================================
// Export (Global scope에 등록)
// ============================================
window.SupabaseDB = {
    // Clients
    getClients,
    getClient,
    addClient,
    updateClient,
    deleteClient,
    isClientNumberDuplicate,
    
    // Inventory
    getTraderInventory,
    addInventoryItem,
    addInventoryItems,
    updateInventoryItem,
    deleteInventoryItem,
    
    // Expenses
    getExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    
    // Documents
    getDocuments,
    addDocument,
    deleteDocument,
    
    // Backup & Migration
    backupAllData,
    migrateFromLocalStorage,
    
    // Realtime
    listenToInventoryChanges
};

console.log('✅ Supabase DB module loaded');
