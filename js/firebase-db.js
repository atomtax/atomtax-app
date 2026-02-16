// Firebase Firestore Database Module

// ============================================
// Clients (고객사) CRUD
// ============================================

// 고객사 목록 가져오기
async function getClients() {
    try {
        const snapshot = await db.collection('clients').orderBy('company_name').get();
        const clients = [];
        snapshot.forEach(doc => {
            clients.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: clients };
    } catch (error) {
        console.error('Get clients error:', error);
        return { success: false, error: error.message };
    }
}

// 특정 고객사 가져오기
async function getClient(clientId) {
    try {
        const doc = await db.collection('clients').doc(clientId).get();
        if (doc.exists) {
            return { success: true, data: { id: doc.id, ...doc.data() } };
        } else {
            return { success: false, error: 'Client not found' };
        }
    } catch (error) {
        console.error('Get client error:', error);
        return { success: false, error: error.message };
    }
}

// 고객사 추가
async function addClient(clientData) {
    try {
        const docRef = await db.collection('clients').add({
            ...clientData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Add client error:', error);
        return { success: false, error: error.message };
    }
}

// 고객사 수정
async function updateClient(clientId, clientData) {
    try {
        await db.collection('clients').doc(clientId).update({
            ...clientData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Update client error:', error);
        return { success: false, error: error.message };
    }
}

// 고객사 삭제
async function deleteClient(clientId) {
    try {
        await db.collection('clients').doc(clientId).delete();
        return { success: true };
    } catch (error) {
        console.error('Delete client error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// Trader Inventory (매매사업자 재고) CRUD
// ============================================

// 재고 데이터 가져오기
async function getTraderInventory(clientId) {
    try {
        const doc = await db.collection('trader_inventory').doc(clientId).get();
        if (doc.exists) {
            return { success: true, data: doc.data().rows || [] };
        } else {
            return { success: true, data: [] };
        }
    } catch (error) {
        console.error('Get inventory error:', error);
        return { success: false, error: error.message };
    }
}

// 재고 데이터 저장
async function saveTraderInventory(clientId, inventoryRows) {
    try {
        await db.collection('trader_inventory').doc(clientId).set({
            rows: inventoryRows,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // localStorage에도 백업 (오프라인 지원)
        localStorage.setItem(`trader_inventory_${clientId}`, JSON.stringify(inventoryRows));
        
        return { success: true };
    } catch (error) {
        console.error('Save inventory error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 백업 및 복구
// ============================================

// 전체 데이터 백업
async function backupAllData() {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            clients: [],
            inventories: []
        };
        
        // 고객사 데이터
        const clientsSnapshot = await db.collection('clients').get();
        clientsSnapshot.forEach(doc => {
            backup.clients.push({ id: doc.id, ...doc.data() });
        });
        
        // 재고 데이터
        const inventorySnapshot = await db.collection('trader_inventory').get();
        inventorySnapshot.forEach(doc => {
            backup.inventories.push({ id: doc.id, ...doc.data() });
        });
        
        // JSON 파일로 다운로드
        const blob = new Blob([JSON.stringify(backup, null, 2)], 
                              { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `firebase_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        return { success: true };
    } catch (error) {
        console.error('Backup error:', error);
        return { success: false, error: error.message };
    }
}

// localStorage → Firestore 마이그레이션
async function migrateFromLocalStorage() {
    try {
        const migratedCount = { clients: 0, inventories: 0 };
        
        // localStorage의 모든 키를 확인
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            try {
                const data = JSON.parse(value);
                
                // trader_inventory_ 로 시작하는 키
                if (key.startsWith('trader_inventory_')) {
                    const clientId = key.replace('trader_inventory_', '');
                    await saveTraderInventory(clientId, data);
                    migratedCount.inventories++;
                    console.log(`✅ Migrated inventory: ${clientId}`);
                }
                
                // clients 데이터 (배열 형태)
                if (key === 'clients' && Array.isArray(data)) {
                    for (const client of data) {
                        const clientId = client.id;
                        delete client.id; // ID는 문서 ID로 사용
                        await db.collection('clients').doc(clientId).set(client);
                        migratedCount.clients++;
                    }
                    console.log(`✅ Migrated ${migratedCount.clients} clients`);
                }
            } catch (e) {
                // JSON 파싱 실패는 무시
            }
        }
        
        return { 
            success: true, 
            migrated: migratedCount 
        };
    } catch (error) {
        console.error('Migration error:', error);
        return { success: false, error: error.message };
    }
}

// 실시간 리스너 설정 (선택사항)
function listenToInventoryChanges(clientId, callback) {
    return db.collection('trader_inventory').doc(clientId)
        .onSnapshot((doc) => {
            if (doc.exists) {
                callback(doc.data().rows || []);
            }
        }, (error) => {
            console.error('Listen error:', error);
        });
}
