// 팝업 — on/off, 토큰 저장, 최근 수집 로그.
// 토큰 원문은 화면 입력 후 storage.local에만 저장하고, 이후엔 마스킹만 표시한다.
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  function maskToken(token) {
    if (!token) return '';
    const tail = token.slice(-4);
    return '••••••••' + tail;
  }

  function resultIcon(result) {
    if (result === '신규 저장' || result === '회사정보 갱신' || result === '저장') return '✅';
    if (result === '변경 없음') return 'ℹ️';
    return '❌';
  }

  function fmtTime(t) {
    const d = new Date(t);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return hh + ':' + mm;
  }

  function renderLogs(logs) {
    const ul = $('logs');
    const empty = $('logsEmpty');
    ul.innerHTML = '';
    const recent = (logs || []).slice(0, 5);
    if (recent.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    for (const log of recent) {
      const li = document.createElement('li');
      const label = (typeof SCREEN_LABELS !== 'undefined' && SCREEN_LABELS[log.screen]) || log.screen;
      const time = document.createElement('span');
      time.className = 'time';
      time.textContent = fmtTime(log.t);
      const scr = document.createElement('span');
      scr.className = 'scr';
      scr.textContent = label;
      const res = document.createElement('span');
      res.className = 'res';
      res.textContent = resultIcon(log.result) + ' ' + log.result;
      li.appendChild(time);
      li.appendChild(scr);
      li.appendChild(res);
      ul.appendChild(li);
    }
  }

  function renderTokenStatus(token) {
    $('tokenStatus').textContent = token ? '저장됨: ' + maskToken(token) : '토큰이 없습니다.';
  }

  // 초기 로드
  async function init() {
    $('server').textContent = new URL(CONFIG.INGEST_URL).host;

    const { enabled = true, token = '', logs = [] } = await chrome.storage.local.get([
      'enabled',
      'token',
      'logs',
    ]);
    $('toggle').checked = enabled;
    renderTokenStatus(token);
    renderLogs(logs);
  }

  // 토글
  $('toggle').addEventListener('change', function () {
    chrome.storage.local.set({ enabled: this.checked });
  });

  // 토큰 저장
  $('save').addEventListener('click', async function () {
    const input = $('token');
    const value = input.value.trim();
    if (!value) return;
    await chrome.storage.local.set({ token: value });
    input.value = '';
    renderTokenStatus(value);
    $('tokenStatus').style.color = '#059669';
    setTimeout(() => ($('tokenStatus').style.color = ''), 1500);
  });

  // 로그 실시간 갱신 (팝업 열려 있는 동안)
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === 'local' && changes.logs) {
      renderLogs(changes.logs.newValue || []);
    }
  });

  init();
})();
