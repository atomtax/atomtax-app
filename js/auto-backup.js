// 자동 백업 스크립트
// 매일 자동으로 데이터를 백업합니다

/**
 * 전체 데이터 백업
 */
async function autoBackup() {
    try {
        console.log('🔄 자동 백업 시작...');
        
        const timestamp = new Date().toISOString().split('T')[0];
        
        // 1. Supabase 데이터 백업
        const { data: clients, error: clientsError } = await supabaseClient
            .from('clients')
            .select('*');
        
        if (clientsError) throw clientsError;
        
        const { data: inventory, error: inventoryError } = await supabaseClient
            .from('trader_inventory')
            .select('*');
        
        if (inventoryError) throw inventoryError;
        
        // 2. 백업 데이터 구성
        const backup = {
            backup_date: new Date().toISOString(),
            source: 'Supabase',
            clients: clients || [],
            trader_inventory: inventory || [],
            summary: {
                clients_count: clients?.length || 0,
                inventory_count: inventory?.length || 0
            }
        };
        
        // 3. JSON 파일로 다운로드
        const blob = new Blob([JSON.stringify(backup, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ 백업 완료!');
        console.log('📊 고객:', backup.summary.clients_count);
        console.log('📊 물건:', backup.summary.inventory_count);
        
        // 4. localStorage에도 저장 (최근 백업 정보)
        localStorage.setItem('last_backup_date', new Date().toISOString());
        localStorage.setItem('last_backup_summary', JSON.stringify(backup.summary));
        
        return backup;
    } catch (error) {
        console.error('❌ 백업 실패:', error);
        throw error;
    }
}

/**
 * 백업 상태 확인
 */
function getBackupStatus() {
    const lastBackup = localStorage.getItem('last_backup_date');
    const summary = localStorage.getItem('last_backup_summary');
    
    if (!lastBackup) {
        return {
            hasBackup: false,
            message: '백업 기록 없음'
        };
    }
    
    const backupDate = new Date(lastBackup);
    const now = new Date();
    const daysSince = Math.floor((now - backupDate) / (1000 * 60 * 60 * 24));
    
    return {
        hasBackup: true,
        lastBackup: backupDate.toLocaleString('ko-KR'),
        daysSince: daysSince,
        summary: JSON.parse(summary || '{}'),
        needsBackup: daysSince >= 7  // 7일 이상 지났으면 백업 필요
    };
}

/**
 * 백업 알림 표시
 */
function showBackupReminder() {
    const status = getBackupStatus();
    
    if (status.needsBackup || !status.hasBackup) {
        console.log('⚠️ 백업이 필요합니다!');
        console.log('💡 autoBackup()을 실행해주세요.');
        
        // UI에 알림 표시 (선택사항)
        if (typeof showNotification === 'function') {
            showNotification(
                '데이터 백업이 필요합니다. Console에서 autoBackup()을 실행해주세요.',
                'warning'
            );
        }
    } else {
        console.log('✅ 최근 백업:', status.lastBackup);
        console.log('📊 백업 데이터:', status.summary);
    }
}

// 페이지 로드 시 백업 상태 확인
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(showBackupReminder, 2000);
    });
} else {
    setTimeout(showBackupReminder, 2000);
}

// Export functions
window.autoBackup = autoBackup;
window.getBackupStatus = getBackupStatus;
window.showBackupReminder = showBackupReminder;

console.log('✅ 자동 백업 모듈 로드됨');
console.log('💡 사용법: autoBackup() - 즉시 백업');
console.log('💡 사용법: getBackupStatus() - 백업 상태 확인');
