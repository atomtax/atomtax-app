// 페이지 컨텍스트(MAIN world) 주입 — 위하고 응답 가로채기 (읽기 전용)
//
// 위하고는 자체 통신 모듈(luna-ufo/WebSquare)로 데이터를 가져오지만, 브라우저
// 최하단에서는 결국 XMLHttpRequest 또는 fetch를 쓴다. 그 둘을 document_start에
// (페이지 번들보다 먼저) 래핑해 "응답"만 복제해 읽는다. 위하고로 향하는 신규
// 요청은 절대 만들지 않고, 원본 동작도 그대로 통과시킨다(페이지 영향 0).
//
// ⚠️ DEBUG는 진단용 한시 플래그. config.js의 CONFIG.DEBUG와 값이 일치해야 한다
//    (interceptor는 MAIN world라 config.js를 import할 수 없어 별도 보관).
(function () {
  'use strict';
  const DEBUG = true;

  // 중복 주입 방지 + 진단 표시 (페이지 콘솔에서 window.__wehagoCollectorInstalled 확인)
  if (window.__wehagoCollectorInstalled) return;
  window.__wehagoCollectorInstalled = true;

  const HOST = 'api.wehago.com'; // 진단(seen) 대상: 위하고 API 전체
  const TARGET = 'api.wehago.com/smarta/'; // 실제 수집 대상: smarta 화면

  function isHost(url) {
    return typeof url === 'string' && url.indexOf(HOST) !== -1;
  }
  function isTarget(url) {
    return typeof url === 'string' && url.indexOf(TARGET) !== -1;
  }

  function seen(url) {
    // 본문·토큰·민감정보 없이 URL만 (진단용)
    if (DEBUG && isHost(url)) {
      try {
        console.debug('[wehago-collector] seen:', String(url));
      } catch (e) {
        /* 무시 */
      }
    }
  }

  function relay(url, body) {
    if (typeof body !== 'string' || body.length === 0) return;
    try {
      window.postMessage(
        { source: 'wehago-collector', url: String(url), body: body },
        window.location.origin,
      );
    } catch (e) {
      /* 무시 */
    }
  }

  // ── fetch 래핑 ──────────────────────────────────────────
  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = function () {
      const args = arguments;
      const p = origFetch.apply(this, args);
      try {
        const input = args[0];
        const url =
          input && typeof input === 'object' && 'url' in input ? input.url : input;
        seen(url);
        if (isTarget(url)) {
          p.then((response) => {
            response
              .clone()
              .text()
              .then((body) => relay(url, body))
              .catch(() => {});
          }).catch(() => {});
        }
      } catch (e) {
        /* 무시 */
      }
      return p; // 원본 Promise 그대로
    };
  }

  // ── XMLHttpRequest 래핑 ─────────────────────────────────
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    try {
      this.__wehagoUrl = url;
    } catch (e) {
      /* 무시 */
    }
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    try {
      const xhr = this;
      // loadend: 성공/실패/중단 모두 포함 — load 누락 케이스 방지
      xhr.addEventListener('loadend', function () {
        try {
          const url = xhr.__wehagoUrl;
          seen(url);
          if (!isTarget(url)) return;
          if (xhr.readyState !== 4 || xhr.status === 0) return;

          let body = null;
          const rt = xhr.responseType;
          if (rt === '' || rt === 'text') {
            // responseText 접근은 ''/'text'일 때만 안전
            body = xhr.responseText;
          } else if (rt === 'json') {
            body = xhr.response != null ? JSON.stringify(xhr.response) : null;
          } else {
            // arraybuffer/blob/document 등 — 우리가 쓰는 화면은 JSON이므로 무시
            return;
          }
          relay(url, body);
        } catch (e) {
          /* 무시 */
        }
      });
    } catch (e) {
      /* 무시 */
    }
    return origSend.apply(this, arguments);
  };

  if (DEBUG) {
    try {
      console.debug('[wehago-collector] interceptor installed in MAIN @', window.location.href);
    } catch (e) {
      /* 무시 */
    }
  }
})();
