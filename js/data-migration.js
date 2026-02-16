// ===================================
// 🔄 데이터 마이그레이션 및 백업 시스템
// ===================================
// localStorage 데이터를 Firestore로 마이그레이션하고
// 자동 백업을 수행하는 모듈

/**
 * 🔄 localStorage의 trader_inventory 데이터를 Firestore로 마이그레이션
 */
async function migrateLocalStorageToFirestore(userId) {
    console.log('🔄 Starting data migration to Firestore...');
    
    try {
        const migratedData = {
            migrationTime: new Date().toISOString(),
            inventories: {},
            successCount: 0,
            errorCount: 0,
            errors: []
        };

        // Get all localStorage keys
        const keys = Object.keys(localStorage);
        
        // Find all trader_inventory keys
        const inventoryKeys = keys.filter(key => key.startsWith('trader_inventory_'));
        
        console.log(`Found ${inventoryKeys.length} inventory data in localStorage`);
        
        for (const key of inventoryKeys) {
            try {
                const clientId = key.replace('trader_inventory_', '');
                const data = localStorage.getItem(key);
                
                if (!data) continue;
                
                const inventoryData = JSON.parse(data);
                
                // Save to Firestore
                await saveInventoryData(clientId, inventoryData);
                
                migratedData.inventories[clientId] = {
                    itemCount: inventoryData.length,
                    status: 'success'
                };
                migratedData.successCount++;
                
                console.log(`✅ Migrated ${clientId}: ${inventoryData.length} items`);
                
            } catch (error) {
                console.error(`❌ Failed to migrate ${key}:`, error);
                migratedData.errors.push({
                    key: key,
                    error: error.message
                });
                migratedData.errorCount++;
            }
        }
        
        // Save migration log to Firestore
        await db.collection('migration_logs').add({
            userId: userId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            ...migratedData
        });
        
        console.log('✅ Migration completed:', migratedData);
        return migratedData;
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

/**
 * 💾 인벤토리 데이터를 Firestore에 저장
 */
async function saveInventoryData(clientId, inventoryData) {
    const docRef = db.collection('trader_inventories').doc(clientId);
    
    await docRef.set({
        clientId: clientId,
        inventory: inventoryData,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: auth.currentUser?.uid || 'system'
    }, { merge: true });
}

/**
 * 📥 Firestore에서 인벤토리 데이터 로드
 */
async function loadInventoryData(clientId) {
    try {
        const docRef = db.collection('trader_inventories').doc(clientId);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log(`✅ Loaded inventory for ${clientId} from Firestore`);
            return data.inventory || [];
        } else {
            console.log(`ℹ️ No Firestore data found for ${clientId}, checking localStorage...`);
            
            // Fallback to localStorage
            const localData = localStorage.getItem(`trader_inventory_${clientId}`);
            if (localData) {
                const inventory = JSON.parse(localData);
                console.log(`📦 Found in localStorage, migrating to Firestore...`);
                await saveInventoryData(clientId, inventory);
                return inventory;
            }
            
            return [];
        }
    } catch (error) {
        console.error('❌ Error loading inventory:', error);
        
        // Fallback to localStorage
        const localData = localStorage.getItem(`trader_inventory_${clientId}`);
        return localData ? JSON.parse(localData) : [];
    }
}

/**
 * 🔄 데이터 동기화: localStorage ↔ Firestore
 */
async function syncInventoryData(clientId, inventoryData) {
    try {
        // Save to Firestore
        await saveInventoryData(clientId, inventoryData);
        
        // Also save to localStorage for offline access
        localStorage.setItem(`trader_inventory_${clientId}`, JSON.stringify(inventoryData));
        
        console.log(`✅ Synced inventory for ${clientId}`);
        return true;
    } catch (error) {
        console.error('❌ Sync failed:', error);
        
        // At least save to localStorage
        localStorage.setItem(`trader_inventory_${clientId}`, JSON.stringify(inventoryData));
        throw error;
    }
}

/**
 * 💾 자동 백업 생성
 */
async function createBackup(userId, description = 'Auto backup') {
    console.log('💾 Creating backup...');
    
    try {
        const backupData = {
            userId: userId,
            description: description,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            data: {}
        };
        
        // Get all localStorage data
        const keys = Object.keys(localStorage);
        
        for (const key of keys) {
            // Skip auth tokens and temporary data
            if (key.startsWith('firebase:') || key.startsWith('_')) continue;
            
            try {
                const value = localStorage.getItem(key);
                if (value) {
                    backupData.data[key] = value;
                }
            } catch (error) {
                console.warn(`Skipping ${key}:`, error);
            }
        }
        
        // Save backup to Firestore
        const backupRef = await db.collection('backups').add(backupData);
        
        console.log('✅ Backup created:', backupRef.id);
        return backupRef.id;
        
    } catch (error) {
        console.error('❌ Backup failed:', error);
        throw error;
    }
}

/**
 * 📥 백업 복원
 */
async function restoreBackup(backupId) {
    console.log('📥 Restoring backup:', backupId);
    
    try {
        const backupDoc = await db.collection('backups').doc(backupId).get();
        
        if (!backupDoc.exists) {
            throw new Error('Backup not found');
        }
        
        const backupData = backupDoc.data();
        
        // Restore data to localStorage
        for (const [key, value] of Object.entries(backupData.data)) {
            localStorage.setItem(key, value);
        }
        
        console.log('✅ Backup restored successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Restore failed:', error);
        throw error;
    }
}

/**
 * 📋 백업 목록 조회
 */
async function getBackupList(userId, limit = 10) {
    try {
        const snapshot = await db.collection('backups')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        
        const backups = [];
        snapshot.forEach(doc => {
            backups.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return backups;
        
    } catch (error) {
        console.error('❌ Failed to get backup list:', error);
        return [];
    }
}

/**
 * ⏰ 자동 백업 스케줄러 시작
 */
function startAutoBackup(userId, intervalHours = 24) {
    console.log(`⏰ Starting auto backup (every ${intervalHours} hours)...`);
    
    // Initial backup
    createBackup(userId, 'Auto backup on login').catch(console.error);
    
    // Schedule periodic backups
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    const backupInterval = setInterval(() => {
        createBackup(userId, `Auto backup (${new Date().toLocaleString()})`)
            .catch(error => {
                console.error('Auto backup failed:', error);
            });
    }, intervalMs);
    
    // Store interval ID to window for cleanup
    window._backupInterval = backupInterval;
    
    return backupInterval;
}

/**
 * 🛑 자동 백업 중지
 */
function stopAutoBackup() {
    if (window._backupInterval) {
        clearInterval(window._backupInterval);
        window._backupInterval = null;
        console.log('🛑 Auto backup stopped');
    }
}

/**
 * 📊 백업 통계
 */
async function getBackupStats(userId) {
    try {
        const snapshot = await db.collection('backups')
            .where('userId', '==', userId)
            .get();
        
        let totalSize = 0;
        let oldestBackup = null;
        let newestBackup = null;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const dataSize = JSON.stringify(data.data).length;
            totalSize += dataSize;
            
            const timestamp = data.timestamp?.toDate();
            if (timestamp) {
                if (!oldestBackup || timestamp < oldestBackup) {
                    oldestBackup = timestamp;
                }
                if (!newestBackup || timestamp > newestBackup) {
                    newestBackup = timestamp;
                }
            }
        });
        
        return {
            count: snapshot.size,
            totalSize: totalSize,
            averageSize: snapshot.size > 0 ? Math.round(totalSize / snapshot.size) : 0,
            oldestBackup: oldestBackup,
            newestBackup: newestBackup
        };
        
    } catch (error) {
        console.error('❌ Failed to get backup stats:', error);
        return null;
    }
}

/**
 * 🗑️ 오래된 백업 삭제 (최근 N개만 유지)
 */
async function cleanupOldBackups(userId, keepCount = 30) {
    console.log(`🗑️ Cleaning up old backups (keeping ${keepCount} most recent)...`);
    
    try {
        const snapshot = await db.collection('backups')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .get();
        
        if (snapshot.size <= keepCount) {
            console.log(`ℹ️ Only ${snapshot.size} backups found, no cleanup needed`);
            return 0;
        }
        
        const batch = db.batch();
        let deleteCount = 0;
        
        snapshot.docs.slice(keepCount).forEach(doc => {
            batch.delete(doc.ref);
            deleteCount++;
        });
        
        await batch.commit();
        
        console.log(`✅ Deleted ${deleteCount} old backups`);
        return deleteCount;
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        migrateLocalStorageToFirestore,
        saveInventoryData,
        loadInventoryData,
        syncInventoryData,
        createBackup,
        restoreBackup,
        getBackupList,
        startAutoBackup,
        stopAutoBackup,
        getBackupStats,
        cleanupOldBackups
    };
}
