// 콘텐츠 스크립트(ISOLATED world) — 페이지에서 올라온 메시지를 background로 중계.
//
// interceptor.js(MAIN world)가 가로챈 응답을 window.postMessage로 보내면,
// 여기서 받아 chrome.runtime.sendMessage로 service worker에 넘긴다.
// 페이지에서 온 메시지만 신뢰한다.
(function () {
  'use strict';
  window.addEventListener('message', function (event) {
    // 같은 창에서 온 메시지만 (다른 origin/iframe의 위조 차단)
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== 'wehago-collector') return;
    if (typeof data.url !== 'string' || typeof data.body !== 'string') return;

    try {
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
