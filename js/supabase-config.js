// Supabase Configuration
// Supabase JS SDK는 HTML에서 먼저 로드되어야 합니다
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// SDK가 로드될 때까지 대기
if (typeof supabase === 'undefined') {
    console.error('❌ Supabase SDK가 로드되지 않았습니다. HTML에서 Supabase SDK를 먼저 로드해주세요.');
    throw new Error('Supabase SDK not loaded');
}

// ✅ Supabase 프로젝트 설정 (2026-02-15 설정 완료)
// Project: atomtax-app
// Region: Northeast Asia (Seoul)
const SUPABASE_URL = 'https://vdjyynwmnypuxvlhrcbk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkanl5bndtbnlwdXh2bGhyY2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjc4ODEsImV4cCI6MjA4Njc0Mzg4MX0.sGM2GIQ8blhON-EHAMnXyQABnMR46_4FpqhU0Z0pAx4';

// Supabase 클라이언트 초기화
let supabaseClient;

try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        db: {
            schema: 'public'
        }
    });
    
    console.log('✅ Supabase initialized successfully');
    console.log('📍 Supabase URL:', SUPABASE_URL);
} catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    throw error;
}

// Supabase 클라이언트 export
window.supabaseClient = supabaseClient;

// 유틸리티 함수들
const SupabaseUtils = {
    /**
     * 현재 로그인된 사용자 정보 가져오기
     */
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabaseClient.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    },

    /**
     * 세션 확인
     */
    async getSession() {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            return session;
        } catch (error) {
            console.error('Get session error:', error);
            return null;
        }
    },

    /**
     * 에러 메시지 한글화
     */
    getErrorMessage(error) {
        const errorMessages = {
            'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
            'Email not confirmed': '이메일 인증이 필요합니다.',
            'User already registered': '이미 등록된 이메일입니다.',
            'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
            'Unable to validate email address: invalid format': '유효하지 않은 이메일 형식입니다.',
            'Network request failed': '네트워크 연결을 확인해주세요.',
            'JWT expired': '세션이 만료되었습니다. 다시 로그인해주세요.'
        };

        const message = error?.message || error?.error_description || error;
        return errorMessages[message] || message || '알 수 없는 오류가 발생했습니다.';
    },

    /**
     * 로그아웃
     */
    async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            
            // localStorage 클리어 (선택사항)
            // localStorage.clear();
            
            console.log('✅ Successfully signed out');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
};

// Utils export
window.SupabaseUtils = SupabaseUtils;

console.log('✅ Supabase configuration loaded');
console.log('✅ Utils available: window.SupabaseUtils');
