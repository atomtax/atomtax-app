// service worker — 화이트리스트 필터 + 해시 dedupe + 아톰베이스 수신 API 전송.
//
// 위하고로는 아무것도 보내지 않는다. content.js가 중계한 응답만 처리한다.
importScripts('config.js');

// ── 유틸 ────────────────────────────────────────────────
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function screenCodeFromUrl(url) {
  const m = /\/smarta\/([a-z0-9]+)/i.exec(url);
  return m ? m[1] : null;
}

function ccodeFromUrl(url) {
  try {
    return new URL(url).searchParams.get('ccode') || '';
  } catch (e) {
    return '';
  }
}

async function addLog(screen, result) {
  const { logs = [] } = await chrome.storage.local.get(['logs']);
  logs.unshift({ t: Date.now(), screen: screen, result: result });
  await chrome.storage.local.set({ logs: logs.slice(0, 20) });
}

// ── 메시지 수신 ─────────────────────────────────────────
chrome.runtime.onMessage.addListener(function (msg) {
  if (!msg || msg.source !== 'wehago-collector') return;
  // 비동기 처리 (응답 필요 없음)
  handle(msg.url, msg.body);
});

async function handle(url, body) {
  // 1. 화이트리스트 화면코드만
  const screen = screenCodeFromUrl(url);
  if (!screen || CONFIG.SCREEN_WHITELIST.indexOf(screen) === -1) {
    if (CONFIG.DEBUG && screen) {
      console.debug('[wehago-collector] ignored (not whitelisted):', screen);
    }
    return;
  }
  if (CONFIG.DEBUG) console.debug('[wehago-collector] received:', screen);

  // 2. on/off + 토큰
  const { enabled = true, token } = await chrome.storage.local.get(['enabled', 'token']);
  if (!enabled || !token) return;

  // JSON 형태인지 확인 (비 JSON은 조용히 무시)
  let payload;
  try {
    payload = JSON.parse(body);
  } catch (e) {
    return;
  }

  // 3. 로컬 해시 2차 방어 — 동일 데이터면 전송 생략
  const ccode = ccodeFromUrl(url);
  const hashKey = 'lastHash:' + screen + ':' + ccode;
  const hash = await sha256Hex(body);
  const stored = await chrome.storage.local.get([hashKey]);
  if (stored[hashKey] === hash) return;

  // 4. 수신 API 전송 (토큰은 헤더로만, 로그/콘솔에 출력 금지)
  let result;
  try {
    const res = await fetch(CONFIG.INGEST_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-wehago-token': token,
      },
      body: JSON.stringify({ url: url, payload: payload }),
    });
    let json = {};
    try {
      json = await res.json();
    } catch (e) {
      /* 빈 응답 */
    }
    if (res.ok && json.ok) {
      result = json.result || '저장';
      // 성공 시에만 해시 갱신 (실패 시 다음에 재전송되도록)
      await chrome.storage.local.set({ [hashKey]: hash });
    } else {
      result = '실패(' + res.status + ')';
    }
  } catch (e) {
    // 네트워크 실패 — 재시도하지 않고 로그만 (과도한 재시도 금지)
    result = '전송실패';
  }

  if (CONFIG.DEBUG) console.debug('[wehago-collector] sent:', screen, result);
  await addLog(screen, result);
}
