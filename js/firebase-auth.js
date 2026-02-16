// Firebase Authentication Module

// 현재 로그인한 사용자
let currentUser = null;

// 인증 상태 변경 리스너
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log('✅ User logged in:', user.email);
        currentUser = user;
        
        // Firestore에서 사용자 정보 가져오기
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            currentUser.displayName = userData.name;
            currentUser.role = userData.role;
        }
    } else {
        console.log('❌ User logged out');
        currentUser = null;
    }
});

// 로그인
async function firebaseLogin(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// 로그아웃
async function firebaseLogout() {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// 사용자 등록 (관리자만 사용)
async function registerUser(email, password, name, role = 'manager') {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Firestore에 사용자 정보 저장
        await db.collection('users').doc(user.uid).set({
            email: email,
            name: name,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true, user: user };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

// 현재 사용자 확인
function getCurrentUser() {
    return currentUser;
}

// 로그인 필수 체크
function requireAuth() {
    if (!currentUser) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// 관리자 권한 체크
function requireAdmin() {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('관리자 권한이 필요합니다.');
        return false;
    }
    return true;
}
