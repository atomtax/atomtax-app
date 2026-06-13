// 페이지 컨텍스트(MAIN world) 주입 — 위하고 응답 가로채기 (읽기 전용)
//
// 위하고가 api.wehago.com/smarta/* 를 fetch/XHR로 호출할 때, 직원의 정상 요청에
// 대한 "응답"만 복제해 읽는다. 위하고로 향하는 신규 요청은 절대 만들지 않는다.
// 원본 fetch/XHR 동작은 그대로 통과시켜 페이지 동작에 영향이 0이 되도록 한다.
(function () {
  'use strict';
  const TARGET = 'api.wehago.com/smarta/';

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

  function isTarget(url) {
    return typeof url === 'string' && url.indexOf(TARGET) !== -1;
  }

  // ── fetch 래핑 ──────────────────────────────────────────
  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = function (...args) {
      const p = origFetch.apply(this, args);
      try {
        const input = args[0];
        const url = input && typeof input === 'object' && 'url' in input ? input.url : input;
        if (isTarget(url)) {
          p.then((response) => {
            // 응답을 복제해서 읽기만 — 원본 스트림은 페이지가 그대로 사용
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
      return p; // 원본 Promise 그대로 반환
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
      xhr.addEventListener('load', function () {
        try {
          const url = xhr.__wehagoUrl;
          if (!isTarget(url)) return;
          const rt = xhr.responseType;
          if (rt === '' || rt === 'text') {
            relay(url, xhr.responseText);
          } else if (rt === 'json' && xhr.response != null) {
            relay(url, JSON.stringify(xhr.response));
          }
        } catch (e) {
          /* 무시 */
        }
      });
    } catch (e) {
      /* 무시 */
    }
    return origSend.apply(this, arguments);
  };
})();
