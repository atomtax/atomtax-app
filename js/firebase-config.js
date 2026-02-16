// Firebase Configuration
// Firebase SDK는 HTML에서 먼저 로드되어야 합니다

// SDK가 로드될 때까지 대기
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK가 로드되지 않았습니다. HTML에서 Firebase SDK를 먼저 로드해주세요.');
    throw new Error('Firebase SDK not loaded');
}

const firebaseConfig = {
    apiKey: "AIzaSyAf0Srj9cP9BCmUChteXktbWUvAxfiSaw4",
    authDomain: "atomtax-cffe3.firebaseapp.com",
    projectId: "atomtax-cffe3",
    storageBucket: "atomtax-cffe3.firebasestorage.app",
    messagingSenderId: "507976497891",
    appId: "1:507976497891:web:bd3e0b2f2c8f017a9da3d6",
    measurementId: "G-K6M9RXLD22"
};

// Firebase 초기화 (이미 초기화되었다면 건너뛰기)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
} else {
    console.log('✅ Firebase already initialized');
}

// Firebase 서비스
const auth = firebase.auth();
const db = firebase.firestore();

console.log('✅ Authentication initialized');
console.log('✅ Firestore initialized');
