/*! Arcwise Front Desk widget. Add to any site:
 *  <script src="https://YOUR-ENGINE/widget.js" data-client="gentology" defer></script>
 *  Optional: data-lang="id|en", data-open="true",
 *  data-mobile-bottom="84" data-mobile-at="860" (lift the button above a site's own bottom bar on phones)
 */
(function () {
  'use strict';
  var me = document.currentScript || document.querySelector('script[data-client][src*="widget.js"]');
  if (!me || window.__arcwiseFrontDesk) return;
  window.__arcwiseFrontDesk = true;

  var CLIENT = me.getAttribute('data-client');
  var API = (me.getAttribute('data-api') || new URL(me.src, location.href).origin).replace(/\/$/, '');
  var LANG = me.getAttribute('data-lang') ||
    ((navigator.language || '').toLowerCase().indexOf('id') === 0 ? 'id' : 'en');
  var KEY = 'arcwise-fd:' + CLIENT;
  var cfg = null, history = [], busy = false, sent = 0;
  var SID = (function () {
    var k = KEY + ':sid', v = null;
    try { v = sessionStorage.getItem(k); } catch (e) {}
    if (!v) { v = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); try { sessionStorage.setItem(k, v); } catch (e) {} }
    return v;
  })();

  function load() { try { return JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-30))); } catch (e) {} }

  var T = {
    en: { open: 'Chat with us', close: 'Close chat', placeholder: 'Type a message', send: 'Send', status: 'Replies instantly', error: 'Couldn’t reach us just now. Please try again.', by: 'AI receptionist by Arcwise' },
    id: { open: 'Chat dengan kami', close: 'Tutup chat', placeholder: 'Tulis pesan', send: 'Kirim', status: 'Balas seketika', error: 'Belum bisa terhubung. Coba lagi ya.', by: 'AI receptionist oleh Arcwise' },
  };
  function t(k) { return (T[LANG] || T.en)[k]; }

  var host = document.createElement('div');
  host.setAttribute('data-arcwise-front-desk', '');
  var root = host.attachShadow({ mode: 'open' });

  function css(th) {
    return '' +
      ':host{all:initial}' +
      '*{box-sizing:border-box;font-family:inherit}' +
      '.w{--a:' + th.accent + ';--i:' + th.ink + ';--p:' + th.paper + ';--oa:' + (th.onAccent || '#fff') + ';' +
      'font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:15px;line-height:1.45;color:var(--i)}' +
      '.btn{position:fixed;right:calc(20px + env(safe-area-inset-right,0px));bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:2147483000;' +
      'width:60px;height:60px;border-radius:50%;border:0;background:var(--a);color:var(--oa);cursor:pointer;display:grid;place-items:center;' +
      'box-shadow:0 10px 30px rgba(0,0,0,.28);transition:transform .2s}' +
      '.btn:hover{transform:translateY(-2px)}.btn:focus-visible,.x:focus-visible,.f button:focus-visible,.chip:focus-visible,.act:focus-visible,.f input:focus-visible{outline:3px solid var(--a);outline-offset:2px}' +
      '.btn .dot{position:absolute;top:4px;right:4px;width:14px;height:14px;border-radius:50%;background:#5fbf73;border:2px solid var(--a)}' +
      '.pn{position:fixed;right:calc(20px + env(safe-area-inset-right,0px));bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:2147483001;' +
      'width:380px;max-width:calc(100vw - 32px);height:600px;max-height:calc(100vh - 120px);background:var(--p);border-radius:20px;overflow:hidden;' +
      'display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(0,0,0,.3);transform-origin:bottom right;transition:opacity .2s,transform .2s}' +
      '.pn[hidden]{display:flex!important;opacity:0;transform:scale(.96) translateY(8px);pointer-events:none;visibility:hidden}' +
      '.hd{background:var(--i);color:var(--p);padding:16px 16px 14px;display:flex;align-items:center;gap:12px}' +
      '.av{width:38px;height:38px;border-radius:50%;background:var(--a);color:var(--oa);display:grid;place-items:center;font-weight:700;flex:none}' +
      '.hd b{display:block;font-size:15px}.hd small{opacity:.75;font-size:12.5px}.hd small:before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#5fbf73;margin-right:6px;vertical-align:1px}' +
      '.x{margin-left:auto;background:transparent;border:0;color:var(--p);width:36px;height:36px;border-radius:50%;cursor:pointer;display:grid;place-items:center}' +
      '.x:hover{background:rgba(255,255,255,.1)}' +
      '.ms{flex:1;overflow-y:auto;padding:18px 14px 8px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}' +
      '.m{max-width:85%;padding:10px 13px;border-radius:16px;white-space:pre-line;word-wrap:break-word}' +
      '.m.b{background:#fff;align-self:flex-start;border-bottom-left-radius:5px;box-shadow:0 1px 2px rgba(0,0,0,.06)}' +
      '.m.u{background:var(--i);color:var(--p);align-self:flex-end;border-bottom-right-radius:5px}' +
      '.acts{display:flex;flex-direction:column;gap:6px;align-self:flex-start;max-width:85%}' +
      '.act{display:flex;align-items:center;gap:8px;text-decoration:none;background:#1f8f4e;color:#fff;padding:9px 14px;border-radius:12px;font-weight:600;font-size:14px}' +
      '.act:hover{background:#18763f}' +
      '.typ{align-self:flex-start;background:#fff;border-radius:16px;padding:12px 14px;display:flex;gap:4px}' +
      '.typ i{width:7px;height:7px;border-radius:50%;background:#9a9184;animation:b 1s infinite}.typ i:nth-child(2){animation-delay:.15s}.typ i:nth-child(3){animation-delay:.3s}' +
      '@keyframes b{0%,60%,100%{opacity:.3;transform:none}30%{opacity:1;transform:translateY(-3px)}}' +
      '.qr{display:flex;flex-wrap:wrap;gap:6px;padding:4px 14px 10px}' +
      '.chip{border:1.5px solid var(--i);background:transparent;color:var(--i);border-radius:999px;padding:7px 12px;font-size:13.5px;cursor:pointer;font-weight:600}' +
      '.chip:hover{background:var(--i);color:var(--p)}' +
      '.f{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(0,0,0,.08);background:#fff}' +
      '.f input{flex:1;min-width:0;border:1px solid rgba(0,0,0,.15);border-radius:999px;padding:10px 14px;font-size:16px;background:#fff;color:#17150F}' +
      '.f button{width:42px;height:42px;flex:none;border-radius:50%;border:0;background:var(--a);color:var(--oa);cursor:pointer;display:grid;place-items:center}' +
      '.f button:disabled{opacity:.5;cursor:default}' +
      '.by{text-align:center;font-size:11px;color:#8a8275;padding:0 0 8px;background:#fff}.by a{color:inherit}' +
      '@media (max-width:520px){.pn{right:0;bottom:0;width:100vw;max-width:100vw;height:100%;max-height:100%;border-radius:0;' +
      'padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}.hd{padding-left:max(16px,env(safe-area-inset-left,0px))}}' +
      liftCss() +
      '@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}';
  }

  function liftCss() {
    var b = parseInt(me.getAttribute('data-mobile-bottom'), 10), at = parseInt(me.getAttribute('data-mobile-at'), 10) || 760;
    if (!(b > 0 && b < 400)) return '';
    return '@media (max-width:' + at + 'px){.btn{bottom:calc(' + b + 'px + env(safe-area-inset-bottom,0px))}}';
  }

  var ICON_CHAT = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5v-8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 9.5h7M8.5 12.5h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var ICON_X = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_SEND = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12Z" fill="currentColor"/></svg>';
  var ICON_WA = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z"/></svg>';

  var el = {};
  function build() {
    var th = cfg.theme || {};
    var initial = (cfg.assistant || cfg.name || 'A').trim().charAt(0).toUpperCase();
    root.innerHTML = '<style>' + css(th) + '</style>' +
      '<div class="w">' +
      '<button class="btn" type="button" aria-expanded="false" aria-controls="fd-panel"></button>' +
      '<section class="pn" id="fd-panel" role="dialog" aria-modal="false" hidden>' +
      '<header class="hd"><div class="av" aria-hidden="true"></div><div><b></b><small></small></div>' +
      '<button class="x" type="button"></button></header>' +
      '<div class="ms" role="log" aria-live="polite"></div>' +
      '<div class="qr"></div>' +
      '<form class="f"><input type="text" autocomplete="off" maxlength="600"><button type="submit"></button></form>' +
      '<div class="by"><a href="https://arcwise-studios.vercel.app" target="_blank" rel="noopener"></a></div>' +
      '</section></div>';
    el.btn = root.querySelector('.btn'); el.pn = root.querySelector('.pn');
    el.ms = root.querySelector('.ms'); el.qr = root.querySelector('.qr');
    el.form = root.querySelector('.f'); el.input = root.querySelector('.f input');
    el.send = root.querySelector('.f button'); el.x = root.querySelector('.x');
    el.btn.innerHTML = ICON_CHAT + '<span class="dot" aria-hidden="true"></span>';
    el.btn.setAttribute('aria-label', t('open'));
    el.x.innerHTML = ICON_X; el.x.setAttribute('aria-label', t('close'));
    el.send.innerHTML = ICON_SEND; el.send.setAttribute('aria-label', t('send'));
    el.input.placeholder = t('placeholder'); el.input.setAttribute('aria-label', t('placeholder'));
    root.querySelector('.av').textContent = initial;
    root.querySelector('.hd b').textContent = cfg.assistant || cfg.name;
    root.querySelector('.hd small').textContent = t('status');
    el.pn.setAttribute('aria-label', cfg.assistant || cfg.name);
    root.querySelector('.by a').textContent = t('by');

    el.btn.addEventListener('click', function () { toggle(el.pn.hidden); });
    el.x.addEventListener('click', function () { toggle(false); el.btn.focus(); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !el.pn.hidden) { toggle(false); el.btn.focus(); } });
    el.form.addEventListener('submit', function (e) { e.preventDefault(); ask(el.input.value); });

    history = load();
    if (!history.length) history.push({ role: 'assistant', text: (cfg.greeting || {})[LANG] || (cfg.greeting || {}).en || 'Hi!', replies: (cfg.quickReplies || {})[LANG] || [] });
    render();
    document.body.appendChild(host);
    if (me.getAttribute('data-open') === 'true') toggle(true);
  }

  function toggle(open) {
    el.pn.hidden = !open;
    el.btn.setAttribute('aria-expanded', String(open));
    var dot = el.btn.querySelector('.dot'); if (dot && open) dot.remove();
    if (open) { el.ms.scrollTop = el.ms.scrollHeight; setTimeout(function () { el.input.focus(); }, 50); }
  }

  function bubble(m) {
    var d = document.createElement('div');
    d.className = 'm ' + (m.role === 'user' ? 'u' : 'b');
    d.textContent = m.text;
    el.ms.appendChild(d);
    if (m.actions && m.actions.length) {
      var box = document.createElement('div'); box.className = 'acts';
      m.actions.forEach(function (a) {
        if (!/^https:\/\/wa\.me\//.test(a.url || '')) return;   // only WhatsApp links
        var l = document.createElement('a');
        l.className = 'act'; l.href = a.url; l.target = '_blank'; l.rel = 'noopener';
        l.innerHTML = ICON_WA; l.appendChild(document.createTextNode(a.label));
        box.appendChild(l);
      });
      el.ms.appendChild(box);
    }
  }

  function render() {
    el.ms.textContent = '';
    history.forEach(bubble);
    var last = history[history.length - 1];
    chips(last && last.role === 'assistant' ? last.replies : []);
    el.ms.scrollTop = el.ms.scrollHeight;
  }

  function chips(list) {
    el.qr.textContent = '';
    (list || []).slice(0, 3).forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = s;
      b.addEventListener('click', function () { ask(s); });
      el.qr.appendChild(b);
    });
  }

  function typing(on) {
    var x = el.ms.querySelector('.typ');
    if (on && !x) { x = document.createElement('div'); x.className = 'typ'; x.innerHTML = '<i></i><i></i><i></i>'; el.ms.appendChild(x); el.ms.scrollTop = el.ms.scrollHeight; }
    if (!on && x) x.remove();
  }

  function ask(text) {
    text = String(text || '').trim();
    if (!text || busy) return;
    if (sent >= 30) return;
    busy = true; sent++;
    el.input.value = ''; el.send.disabled = true;
    history.push({ role: 'user', text: text.slice(0, 600) });
    render(); chips([]); typing(true);
    fetch(API + '/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client: CLIENT, sid: SID, page: location.host + location.pathname, messages: history.map(function (m) { return { role: m.role, text: m.text }; }) }),
    }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { history.push({ role: 'assistant', text: d.text, actions: d.actions || [], replies: d.replies || [] }); })
      .catch(function () { history.push({ role: 'assistant', text: t('error'), replies: (cfg.quickReplies || {})[LANG] || [] }); })
      .then(function () { busy = false; el.send.disabled = false; typing(false); save(); render(); el.input.focus(); });
  }

  fetch(API + '/api/config?client=' + encodeURIComponent(CLIENT))
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (c) {
      cfg = c;
      if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
    })
    .catch(function (e) { if (window.console) console.warn('Arcwise Front Desk: could not load', CLIENT, e); });
})();
