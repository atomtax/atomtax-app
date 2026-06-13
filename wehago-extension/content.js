// 콘텐츠 스크립트(ISOLATED world) — interceptor 주입 + 메시지 중계.
//
// 매니페스트 world:"MAIN" content_script가 위하고 환경(CSP/타이밍)에서 적용 안 되는
// 케이스가 있어, ISOLATED에서 확실히 실행되는 이 스크립트가 직접 <script> 태그로
// interceptor.js를 페이지(MAIN) 컨텍스트에 꽂는다. (chrome-extension:// 스크립트는
// 페이지 CSP에 막히지 않음). 주입 후 태그는 즉시 self-remove(DOM 변경 없음).
(function () {
  'use strict';

  // 1. interceptor를 MAIN 컨텍스트로 주입 (document_start)
  (function injectInterceptor() {
    try {
      const s = document.createElement('script');
      s.src = chrome.runtime.getURL('interceptor.js');
      s.onload = function () {
        s.remove();
      };
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {
      // page CSP 등 — 조용히 무시
    }
  })();

  // 2. 페이지에서 올라온 응답을 background로 중계 (fire-and-forget)
  window.addEventListener('message', function (event) {
    if (event.source !== window) return; // 같은 창 메시지만 신뢰
    const data = event.data;
    if (!data || data.source !== 'wehago-collector') return;
    if (typeof data.url !== 'string' || typeof data.body !== 'string') return;

    try {
      // 콜백 없이 전송 — 응답을 기다리지 않아 "message channel closed" 에러 없음
      chrome.runtime.sendMessage({
        source: 'wehago-collector',
        url: data.url,
        body: data.body,
      });
    } catch (e) {
      // 확장 컨텍스트 무효화 등 — 조용히 무시
    }
  });
})();
