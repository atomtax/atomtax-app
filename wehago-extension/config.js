// 아톰베이스 위하고 수집기 — 설정
// 수신 API URL과 수집 대상 화면코드 화이트리스트.
// background.js(importScripts)와 popup.js(<script>)에서 공유.
const CONFIG = {
  INGEST_URL: 'https://atomtax-app.vercel.app/api/wehago/ingest',
  SCREEN_WHITELIST: ['sabc0102', 'sacl0106', 'swsa0105', 'saas0106', 'swbu0111'],
  // 진단용 한시 플래그 — 검증 후 false로 되돌린다.
  // ⚠️ interceptor.js(MAIN world)는 config.js를 import할 수 없어 자체 DEBUG 상수를
  //    별도로 가진다. 둘의 값을 항상 같이 바꿔야 한다.
  DEBUG: true,
};

// 화면코드 → 한글명 (팝업 로그 표시용)
const SCREEN_LABELS = {
  sabc0102: '회사정보',
  sacl0106: '손익계산서',
  swsa0105: '급여대장',
  saas0106: '고정자산',
  swbu0111: '사업소득',
};
