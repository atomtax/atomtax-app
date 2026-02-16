// Supabase Authentication Module
// Firebase Auth를 Supabase Auth로 교체

// ============================================
// 로그인
// ============================================
async function signInWithEmail(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        console.log('✅ User logged in:', data.user.email);
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Login error:', error);
        return { 
            success: false, 
            error: SupabaseUtils.getErrorMessage(error) 
        };
    }
}

// ============================================
// 회원가입
// ============================================
async function signUpWithEmail(email, password, userData = {}) {
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: userData.name || '',
                    role: userData.role || 'user'
                }
            }
        });

        if (error) throw error;

        // users 테이블에 추가 정보 저장
        if (data.user) {
            const { error: dbError } = await supabaseClient
                .from('users')
                .insert([{
                    id: data.user.id,
                    email: data.user.email,
                    name: userData.name || '',
                    role: userData.role || 'user'
                }]);

            if (dbError) {
                console.error('User data insert error:', dbError);
            }
        }

        console.log('✅ User signed up:', data.user?.email);
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Sign up error:', error);
        return { 
            success: false, 
            error: SupabaseUtils.getErrorMessage(error) 
        };
    }
}

// ============================================
// 로그아웃
// ============================================
async function signOut() {
    return await SupabaseUtils.signOut();
}

// ============================================
// 현재 사용자 정보 가져오기
// ============================================
async function getCurrentUser() {
    return await SupabaseUtils.getCurrentUser();
}

// ============================================
// 인증 상태 변경 리스너
// ============================================
function onAuthStateChanged(callback) {
    // Supabase의 onAuthStateChange는 즉시 현재 세션도 콜백으로 전달
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
        async (event, session) => {
            console.log('🔐 Auth state changed:', event, session?.user?.email || 'No user');
            
            if (session?.user) {
                callback(session.user);
            } else {
                callback(null);
            }
        }
    );

    // Cleanup 함수 반환 (구독 해제용)
    return () => {
        subscription?.unsubscribe();
    };
}

// ============================================
// 비밀번호 재설정 요청
// ============================================
async function sendPasswordResetEmail(email) {
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });

        if (error) throw error;

        console.log('✅ Password reset email sent to:', email);
        return { success: true };
    } catch (error) {
        console.error('Password reset error:', error);
        return { 
            success: false, 
            error: SupabaseUtils.getErrorMessage(error) 
        };
    }
}

// ============================================
// 비밀번호 업데이트
// ============================================
async function updatePassword(newPassword) {
    try {
        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        console.log('✅ Password updated successfully');
        return { success: true };
    } catch (error) {
        console.error('Password update error:', error);
        return { 
            success: false, 
            error: SupabaseUtils.getErrorMessage(error) 
        };
    }
}

// ============================================
// Export (Global scope에 등록)
// ============================================
window.SupabaseAuth = {
    signInWithEmail,
    signUpWithEmail,
    signOut,
    getCurrentUser,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updatePassword
};

console.log('✅ Supabase Auth module loaded');
