/*! Arcwise Front Desk widget. Add to any site:
 *  <script src="https://arcwise-front-desk.vercel.app/widget.js" data-client="gentology" defer></script>
 *  Optional: data-lang="id|en", data-open="true", data-teaser="false",
 *  data-mobile-bottom="84" data-mobile-at="860" (lift the button above a site's own bottom bar on phones)
 *  data-mobile-launcher="off" (hide the floating button on phones when the site has its own chat button; open with the arcwise:open event)
 */
(function () {
  'use strict';
  var me = document.currentScript || document.querySelector('script[data-client][src*="widget.js"]');
  if (!me || window.__arcwiseFrontDesk) return;
  window.__arcwiseFrontDesk = true;

  var CLIENT = me.getAttribute('data-client');
  var API = (me.getAttribute('data-api') || new URL(me.src, location.href).origin).replace(/\/$/, '');
  var LANG = me.getAttribute('data-lang') || ((navigator.language || '').toLowerCase().indexOf('id') === 0 ? 'id' : 'en');
  var KEY = 'arcwise-fd2:' + CLIENT;
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cfg = null, history = [], busy = false, sent = 0, el = {};

  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function load() { try { return JSON.parse(ss(KEY) || '[]'); } catch (e) { return []; } }
  function save() { ss(KEY, JSON.stringify(history.slice(-30))); }
  var SID = ss(KEY + ':sid') || (function () { var v = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); ss(KEY + ':sid', v); return v; })();

  var T = {
    en: { open: 'Chat with us', close: 'Close chat', placeholder: 'Write a message\u2026', send: 'Send', status: 'Online \u00b7 replies in seconds', error: 'Couldn\u2019t reach us just now. Please try again.', by: 'AI receptionist by Arcwise', hi: 'How can we help?', or: 'or write your own question below', wa: 'Continue on WhatsApp', waSub: 'Your message is ready to send', ig: 'Continue on Instagram', igSub: 'Your message is copied: paste it in the DM', dismiss: 'Dismiss', you: 'You' },
    id: { open: 'Chat dengan kami', close: 'Tutup chat', placeholder: 'Tulis pesan\u2026', send: 'Kirim', status: 'Online \u00b7 balas dalam hitungan detik', error: 'Belum bisa terhubung. Coba lagi ya.', by: 'AI receptionist oleh Arcwise', hi: 'Ada yang bisa kami bantu?', or: 'atau tulis pertanyaan kamu di bawah', wa: 'Lanjut di WhatsApp', waSub: 'Pesan kamu sudah siap dikirim', ig: 'Lanjut di Instagram', igSub: 'Pesan kamu sudah tersalin: tempel di DM', dismiss: 'Tutup', you: 'Kamu' },
  };
  function t(k) { return (T[LANG] || T.en)[k]; }
  function L(o) { return o ? (o[LANG] || o.en || '') : ''; }

  var ICON = {
    chat: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20.5l1.3-4.2A8 8 0 1 1 20 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" stroke-width="2.6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    send: '<path d="M5 12h13M12 5l7 7-7 7"/>',
    queue: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    tag: '<path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z"/><circle cx="8.5" cy="8.5" r="1.5"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5"/>',
    layers: '<path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/>',
    arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
    ig: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
    wa: '<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z"/>',
  };
  function svg(name, size) {
    return '<svg width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[name] || ICON.spark) + '</svg>';
  }

  function css(th) {
    var dark = th.mode === 'dark';
    var bg = dark ? th.ink : th.paper, fg = dark ? th.paper : th.ink;
    var lift = (function () {
      var b = parseInt(me.getAttribute('data-mobile-bottom'), 10), at = parseInt(me.getAttribute('data-mobile-at'), 10) || 760;
      var off = me.getAttribute('data-mobile-launcher') === 'off' ? '@media (max-width:' + at + 'px){.dock{display:none!important}}' : '';
      return off + (b > 0 && b < 400 ? '@media (max-width:' + at + 'px){.dock{bottom:calc(' + b + 'px + env(safe-area-inset-bottom,0px))}}' : '');
    })();
    return '' +
      ':host{all:initial}*{box-sizing:border-box;font-family:inherit;margin:0}' +
      '.w{--a:' + th.accent + ';--oa:' + (th.onAccent || '#fff') + ';--bg:' + bg + ';--fg:' + fg + ';' +
      '--s1:color-mix(in srgb,var(--fg) 6%,var(--bg));--s2:color-mix(in srgb,var(--fg) 11%,var(--bg));--line:color-mix(in srgb,var(--fg) 13%,transparent);' +
      '--mute:color-mix(in srgb,var(--fg) 62%,var(--bg));--glow:color-mix(in srgb,var(--a) 28%,transparent);' +
      'font-family:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:15px;line-height:1.45;color:var(--fg);-webkit-font-smoothing:antialiased}' +
      'button{font:inherit;color:inherit;cursor:pointer;background:none;border:0}' +
      ':focus-visible{outline:2px solid var(--a);outline-offset:2px;border-radius:10px}' +

      /* dock: launcher + teaser */
      '.dock{position:fixed;right:calc(20px + env(safe-area-inset-right,0px));bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:2147483000;display:flex;flex-direction:column;align-items:flex-end;gap:12px}' +
      '.btn{position:relative;width:62px;height:62px;border-radius:50%;background:var(--bg);color:var(--a);display:grid;place-items:center;' +
      'box-shadow:0 0 0 1px var(--line),0 12px 32px rgba(0,0,0,.32),0 0 0 6px var(--glow);transition:transform .25s cubic-bezier(.2,.9,.3,1.2),box-shadow .25s}' +
      '.btn:hover{transform:translateY(-2px) scale(1.04)}' +
      '.btn .ic{position:absolute;display:grid;place-items:center;transition:transform .3s cubic-bezier(.2,.9,.3,1.2),opacity .2s}' +
      '.btn .ic-x{opacity:0;transform:rotate(-90deg) scale(.6);color:var(--fg)}' +
      '.open .btn .ic-c{opacity:0;transform:rotate(90deg) scale(.6)}.open .btn .ic-x{opacity:1;transform:none}' +
      '.btn .live{position:absolute;top:3px;right:3px;width:14px;height:14px;border-radius:50%;background:#3ccf7a;border:3px solid var(--bg)}' +
      '.btn .ring{position:absolute;inset:-6px;border-radius:50%;border:2px solid var(--a);opacity:0;animation:ping 2.6s cubic-bezier(0,0,.2,1) 1.5s 3}' +
      '@keyframes ping{0%{transform:scale(.85);opacity:.7}80%,100%{transform:scale(1.35);opacity:0}}' +
      '.teaser{max-width:min(290px,calc(100vw - 110px));background:var(--bg);color:var(--fg);border-radius:18px 18px 6px 18px;padding:13px 38px 13px 14px;position:relative;' +
      'box-shadow:0 0 0 1px var(--line),0 14px 34px rgba(0,0,0,.28);font-size:14px;cursor:pointer;animation:rise .45s cubic-bezier(.2,.9,.3,1.1) both;text-align:left}' +
      '.teaser b{display:block;font-size:12px;color:var(--a);font-weight:700;margin-bottom:2px;letter-spacing:.01em}' +
      '.teaser .tx{position:absolute;top:8px;right:8px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:var(--mute)}' +
      '.teaser .tx:hover{background:var(--s2)}' +

      /* panel */
      '.pn{position:fixed;right:calc(20px + env(safe-area-inset-right,0px));bottom:calc(98px + env(safe-area-inset-bottom,0px));z-index:2147483001;width:392px;max-width:calc(100vw - 32px);' +
      'height:min(640px,calc(100vh - 128px));background:var(--bg);border-radius:24px;overflow:hidden;display:flex;flex-direction:column;' +
      'box-shadow:0 0 0 1px var(--line),0 30px 80px rgba(0,0,0,.42);transform-origin:bottom right;transition:opacity .22s,transform .32s cubic-bezier(.2,.9,.3,1.1),visibility .32s}' +
      '.pn[hidden]{display:flex!important;opacity:0;transform:translateY(14px) scale(.94);pointer-events:none;visibility:hidden}' +
      '.hd{position:relative;padding:18px 16px 16px 18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--line);overflow:hidden}' +
      '.hd:before{content:"";position:absolute;inset:-60% -20% auto auto;width:260px;height:260px;background:radial-gradient(closest-side,var(--glow),transparent);pointer-events:none}' +
      '.av{position:relative;width:42px;height:42px;border-radius:14px;background:var(--a);color:var(--oa);display:grid;place-items:center;font-weight:800;font-size:18px;flex:none;letter-spacing:-.02em}' +
      '.av i{position:absolute;right:-3px;bottom:-3px;width:13px;height:13px;border-radius:50%;background:#3ccf7a;border:3px solid var(--bg)}' +
      '.who{min-width:0;flex:1;position:relative}' +
      '.who b{display:block;font-size:15.5px;font-weight:700;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.who small{display:block;color:var(--mute);font-size:12.5px}' +
      '.x{position:relative;width:36px;height:36px;border-radius:12px;display:grid;place-items:center;color:var(--mute);flex:none}.x:hover{background:var(--s2);color:var(--fg)}' +

      '.ms{flex:1;overflow-y:auto;padding:18px 16px 10px;display:flex;flex-direction:column;gap:6px;overscroll-behavior:contain;scrollbar-width:thin}' +
      '.intro{padding:4px 2px 10px;animation:rise .4s both}' +
      '.intro h2{font-size:22px;line-height:1.2;font-weight:750;letter-spacing:-.02em;margin-bottom:6px}' +
      '.intro p{color:var(--mute);font-size:14px}' +
      '.tiles{display:flex;flex-direction:column;gap:8px;margin:14px 0 4px}' +
      '.tile{display:grid;grid-template-columns:38px 1fr 18px;gap:12px;align-items:center;text-align:left;padding:12px;border-radius:16px;background:var(--s1);box-shadow:inset 0 0 0 1px var(--line);transition:background .15s,transform .15s}' +
      '.tile:hover{background:var(--s2);transform:translateX(2px)}' +
      '.tile .ti{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--a) 16%,transparent);color:var(--a)}' +
      '.tile b{display:block;font-size:14.5px;font-weight:650;color:var(--fg)}.tile span span{display:block;font-size:12.5px;color:var(--mute)}' +
      '.tile .go{color:var(--mute)}' +
      '.hint{font-size:12px;color:var(--mute);text-align:center;margin:8px 0 2px}' +

      '.row{display:flex;gap:8px;align-items:flex-end;animation:rise .3s both}' +
      '.row.u{justify-content:flex-end}' +
      '.row .mini{width:26px;height:26px;border-radius:9px;background:var(--a);color:var(--oa);display:grid;place-items:center;font-size:11.5px;font-weight:800;flex:none}' +
      '.row .mini.ghost{visibility:hidden}' +
      '.m{max-width:82%;padding:10px 14px;border-radius:18px;word-wrap:break-word;font-size:14.5px}' +
      '.m p+p,.m p+ul,.m ul+p{margin-top:6px}' +
      '.m ul{padding-left:0;list-style:none;display:flex;flex-direction:column;gap:3px}' +
      '.m li{position:relative;padding-left:14px}.m li:before{content:"";position:absolute;left:2px;top:.62em;width:5px;height:5px;border-radius:50%;background:var(--a)}' +
      '.b .m{background:var(--s1);box-shadow:inset 0 0 0 1px var(--line);border-bottom-left-radius:6px}' +
      '.u .m{background:var(--a);color:var(--oa);border-bottom-right-radius:6px;font-weight:500}' +
      '.time{font-size:11px;color:var(--mute);margin:2px 0 6px 34px}.time.r{margin:2px 2px 6px 0;text-align:right}' +
      '.wa{display:grid;grid-template-columns:40px 1fr 18px;gap:12px;align-items:center;margin:4px 0 4px 34px;padding:12px 14px;border-radius:16px;text-decoration:none;' +
      'background:#128c4b;color:#fff;box-shadow:0 8px 22px rgba(18,140,75,.3);max-width:calc(100% - 34px);animation:rise .35s both;transition:transform .15s,background .15s}' +
      '.wa:hover{background:#0f7a41;transform:translateY(-1px)}' +
      '.wa.ig{background:linear-gradient(120deg,#833ab4,#e1306c 55%,#f77737)}.wa.ig:hover{filter:brightness(1.08);background:linear-gradient(120deg,#833ab4,#e1306c 55%,#f77737)}' +
      '.wa .wi{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.16);display:grid;place-items:center}' +
      '.wa b{display:block;font-size:14px}.wa span{display:block;font-size:12px;opacity:.85}' +
      '.typ{display:flex;gap:4px;padding:13px 14px;background:var(--s1);box-shadow:inset 0 0 0 1px var(--line);border-radius:18px;border-bottom-left-radius:6px}' +
      '.typ i{width:7px;height:7px;border-radius:50%;background:var(--mute);animation:b 1.1s infinite}.typ i:nth-child(2){animation-delay:.15s}.typ i:nth-child(3){animation-delay:.3s}' +
      '@keyframes b{0%,60%,100%{opacity:.35;transform:none}30%{opacity:1;transform:translateY(-3px)}}' +
      '@keyframes rise{from{opacity:0;transform:translateY(8px)}}' +

      '.qr{display:flex;gap:6px;padding:2px 16px 10px;overflow-x:auto;scrollbar-width:none}.qr::-webkit-scrollbar{display:none}' +
      '.chip{flex:none;border-radius:999px;padding:8px 13px;font-size:13px;font-weight:600;background:var(--s1);box-shadow:inset 0 0 0 1px var(--line);white-space:nowrap;transition:background .15s}' +
      '.chip:hover{background:var(--s2)}' +
      '.f{margin:0 12px 10px;display:flex;align-items:center;gap:6px;padding:6px 6px 6px 16px;border-radius:18px;background:var(--s1);box-shadow:inset 0 0 0 1px var(--line);transition:box-shadow .15s}' +
      '.f:focus-within{box-shadow:inset 0 0 0 1.5px var(--a),0 0 0 4px var(--glow)}' +
      '.f input{flex:1;min-width:0;border:0;background:none;outline:none;color:var(--fg);font:inherit;font-size:16px;padding:8px 0}' +
      '.f input::placeholder{color:var(--mute)}' +
      '.f button{width:40px;height:40px;border-radius:13px;background:var(--s2);color:var(--mute);display:grid;place-items:center;transition:background .15s,color .15s,transform .15s;flex:none}' +
      '.f.ready button{background:var(--a);color:var(--oa)}.f.ready button:hover{transform:scale(1.05)}' +
      '.by{text-align:center;font-size:11px;color:var(--mute);padding:0 0 10px}.by a{color:inherit;text-decoration:none}.by a:hover{text-decoration:underline}' +

      '@media (max-width:520px){' +
      '.pn{right:0;bottom:0;width:100vw;max-width:100vw;height:100%;max-height:100%;border-radius:0;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}' +
      '.open .dock{display:none}.hd{padding-left:max(18px,env(safe-area-inset-left,0px))}}' +
      lift +
      '@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}';
  }

  var host = document.createElement('div');
  host.setAttribute('data-arcwise-front-desk', '');
  var root = host.attachShadow({ mode: 'open' });

  function build() {
    var th = cfg.theme || {};
    var initial = (cfg.assistant || cfg.name || 'A').trim().charAt(0).toUpperCase();
    root.innerHTML = '<style>' + css(th) + '</style>' +
      '<div class="w">' +
      '<div class="dock"><div class="teaser" role="button" tabindex="0" hidden><b></b><span class="tt"></span><button class="tx" type="button">' + svg('x', 14) + '</button></div>' +
      '<button class="btn" type="button" aria-expanded="false" aria-controls="fd-panel"><span class="ring"></span><span class="ic ic-c">' + svg('chat', 27) + '</span><span class="ic ic-x">' + svg('x', 24) + '</span><span class="live" aria-hidden="true"></span></button></div>' +
      '<section class="pn" id="fd-panel" role="dialog" aria-modal="false" hidden>' +
      '<header class="hd"><div class="av" aria-hidden="true"><span class="ini"></span><i></i></div><div class="who"><b></b><small></small></div><button class="x" type="button">' + svg('x', 18) + '</button></header>' +
      '<div class="ms" role="log" aria-live="polite"></div>' +
      '<div class="qr"></div>' +
      '<form class="f"><input type="text" autocomplete="off" maxlength="600" enterkeyhint="send"><button type="submit">' + svg('send', 18) + '</button></form>' +
      '<div class="by"><a href="https://arcwise-studios.vercel.app" target="_blank" rel="noopener"></a></div>' +
      '</section></div>';
    var q = function (s) { return root.querySelector(s); };
    el.w = q('.w'); el.btn = q('.btn'); el.pn = q('.pn'); el.ms = q('.ms'); el.qr = q('.qr'); el.form = q('.f');
    el.input = q('.f input'); el.send = q('.f button'); el.x = q('.x'); el.teaser = q('.teaser');
    el.btn.setAttribute('aria-label', t('open'));
    el.x.setAttribute('aria-label', t('close'));
    el.send.setAttribute('aria-label', t('send'));
    el.input.placeholder = t('placeholder'); el.input.setAttribute('aria-label', t('placeholder'));
    q('.ini').textContent = initial;
    q('.who b').textContent = cfg.assistant || cfg.name;
    q('.who small').textContent = t('status');
    el.pn.setAttribute('aria-label', cfg.assistant || cfg.name);
    q('.by a').textContent = t('by');
    q('.tx').setAttribute('aria-label', t('dismiss'));

    el.btn.addEventListener('click', function () { toggle(el.pn.hidden); });
    el.x.addEventListener('click', function () { toggle(false); el.btn.focus(); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !el.pn.hidden) { toggle(false); el.btn.focus(); } });
    el.form.addEventListener('submit', function (e) { e.preventDefault(); ask(el.input.value); });
    el.input.addEventListener('input', function () { el.form.classList.toggle('ready', !!el.input.value.trim()); });
    el.teaser.addEventListener('click', function (e) { if (e.target.closest('.tx')) { hideTeaser(true); return; } toggle(true); });
    el.teaser.addEventListener('keydown', function (e) { if (e.key === 'Enter') toggle(true); });

    history = load();
    render();
    document.body.appendChild(host);
    if (me.getAttribute('data-open') === 'true') toggle(true);
    else if (cfg.teaser && me.getAttribute('data-teaser') !== 'false' && !ss(KEY + ':teased') && !history.some(function (m) { return m.role === 'user'; })) {
      setTimeout(function () {
        if (!el.pn.hidden) return;
        q('.teaser b').textContent = cfg.assistant || cfg.name;
        q('.teaser .tt').textContent = L(cfg.teaser);
        el.teaser.hidden = false; ss(KEY + ':teased', '1');
      }, 7000);
    }
  }

  function hideTeaser() { el.teaser.hidden = true; }

  function toggle(open) {
    hideTeaser();
    el.pn.hidden = !open;
    el.w.classList.toggle('open', open);
    el.btn.setAttribute('aria-expanded', String(open));
    el.btn.setAttribute('aria-label', open ? t('close') : t('open'));
    if (open) { el.ms.scrollTop = el.ms.scrollHeight; setTimeout(function () { if (matchMedia('(hover:hover)').matches) el.input.focus(); }, 80); }
  }

  function fmtTime(ts) { try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }

  // Plain text with "\u2022" or "-" lines turned into a list. Built with DOM nodes only.
  function richText(box, text) {
    var lines = String(text || '').split('\n'), list = null, para = null;
    lines.forEach(function (line) {
      var m = line.match(/^\s*(?:[\u2022\-*]|\d+[.)])\s+(.*)$/);
      if (m) {
        if (!list) { list = document.createElement('ul'); box.appendChild(list); }
        var li = document.createElement('li'); li.textContent = m[1]; list.appendChild(li); para = null;
      } else if (line.trim()) {
        list = null;
        if (!para) { para = document.createElement('p'); box.appendChild(para); para.textContent = line; }
        else para.textContent += '\n' + line;
      } else { list = null; para = null; }
    });
    box.style.whiteSpace = 'pre-line';
  }

  function intro() {
    var d = document.createElement('div'); d.className = 'intro';
    var h = document.createElement('h2'); h.textContent = t('hi');
    var p = document.createElement('p'); p.textContent = L(cfg.greeting);
    d.appendChild(h); d.appendChild(p);
    if (cfg.tiles && cfg.tiles.length) {
      var box = document.createElement('div'); box.className = 'tiles';
      cfg.tiles.slice(0, 4).forEach(function (tl) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'tile';
        b.innerHTML = '<span class="ti">' + svg(tl.icon, 19) + '</span><span><b></b><span></span></span><span class="go">' + svg('send', 16) + '</span>';
        b.querySelector('b').textContent = L(tl.title);
        b.querySelector('b + span').textContent = L(tl.sub);
        b.addEventListener('click', function () { ask(L(tl.send) || L(tl.title)); });
        box.appendChild(b);
      });
      d.appendChild(box);
      var or = document.createElement('p'); or.className = 'hint'; or.textContent = t('or'); d.appendChild(or);
    }
    return d;
  }

  function row(m, showAvatar) {
    var r = document.createElement('div'); r.className = 'row ' + (m.role === 'user' ? 'u' : 'b');
    if (m.role !== 'user') {
      var a = document.createElement('span'); a.className = 'mini' + (showAvatar ? '' : ' ghost'); a.setAttribute('aria-hidden', 'true');
      a.textContent = (cfg.assistant || cfg.name || 'A').trim().charAt(0).toUpperCase(); r.appendChild(a);
    }
    var b = document.createElement('div'); b.className = 'm'; richText(b, m.text); r.appendChild(b);
    return r;
  }

  function render() {
    el.ms.textContent = '';
    el.ms.appendChild(intro());
    history.forEach(function (m, i) {
      var next = history[i + 1], prev = history[i - 1];
      el.ms.appendChild(row(m, !prev || prev.role !== m.role));
      (m.actions || []).forEach(function (a) {
        var ig = /^https:\/\/ig\.me\/m\/[\w.]+$/.test(a.url || '');
        if (!ig && !/^https:\/\/wa\.me\//.test(a.url || '')) return;   // only WhatsApp or Instagram DM links
        var l = document.createElement('a'); l.className = 'wa' + (ig ? ' ig' : ''); l.href = a.url; l.target = '_blank'; l.rel = 'noopener';
        l.innerHTML = '<span class="wi">' + svg(ig ? 'ig' : 'wa', 22) + '</span><span><b></b><span></span></span>' + svg('arrow', 18);
        l.querySelector('b').textContent = ig ? t('ig') + ' \u00b7 ' + String(a.label || '') : t('wa') + ' \u00b7 ' + String(a.label || '').replace(/^WhatsApp\s*/, '');
        l.querySelector('b + span').textContent = t(ig ? 'igSub' : 'waSub');
        if (ig && a.text) l.addEventListener('click', function () { try { navigator.clipboard.writeText(a.text); } catch (e) {} });
        el.ms.appendChild(l);
      });
      if (!next || next.role !== m.role) {
        var tm = document.createElement('div'); tm.className = 'time' + (m.role === 'user' ? ' r' : '');
        tm.textContent = (m.role === 'user' ? t('you') : (cfg.assistant || cfg.name)) + (m.at ? ' \u00b7 ' + fmtTime(m.at) : '');
        el.ms.appendChild(tm);
      }
    });
    var last = history[history.length - 1];
    chips(last && last.role === 'assistant' ? last.replies : (history.length ? [] : null));
    el.ms.scrollTop = el.ms.scrollHeight;
  }

  function chips(list) {
    el.qr.textContent = '';
    (list || []).slice(0, 3).forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = s;
      b.addEventListener('click', function () { ask(s); });
      el.qr.appendChild(b);
    });
    el.qr.hidden = !el.qr.children.length;
  }

  function typing(on) {
    var x = el.ms.querySelector('.typing');
    if (on && !x) {
      x = document.createElement('div'); x.className = 'row b typing';
      x.innerHTML = '<span class="mini" aria-hidden="true"></span><div class="typ"><i></i><i></i><i></i></div>';
      x.querySelector('.mini').textContent = (cfg.assistant || cfg.name || 'A').trim().charAt(0).toUpperCase();
      el.ms.appendChild(x); el.ms.scrollTop = el.ms.scrollHeight;
    }
    if (!on && x) x.remove();
  }

  function ask(text) {
    text = String(text || '').trim();
    if (!text || busy || sent >= 30) return;
    busy = true; sent++;
    el.input.value = ''; el.form.classList.remove('ready');
    history.push({ role: 'user', text: text.slice(0, 600), at: Date.now() });
    render(); chips([]); typing(true);
    var started = Date.now();
    fetch(API + '/api/chat', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client: CLIENT, sid: SID, page: location.host + location.pathname, messages: history.map(function (m) { return { role: m.role, text: m.text }; }) }),
    }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { return d; }, function () { return { text: t('error'), replies: (cfg.quickReplies || {})[LANG] || [] }; })
      .then(function (d) {
        // A short, natural pause so instant answers don't feel robotic.
        var wait = REDUCED ? 0 : Math.max(0, 650 - (Date.now() - started));
        setTimeout(function () {
          history.push({ role: 'assistant', text: d.text, actions: d.actions || [], replies: d.replies || [], at: Date.now() });
          busy = false; typing(false); save(); render();
          if (matchMedia('(hover:hover)').matches) el.input.focus();
        }, wait);
      });
  }

  // The host page can open the chat (and optionally send a first message) with:
  // document.dispatchEvent(new CustomEvent('arcwise:open', { detail: { text: '...' } }))
  document.addEventListener('arcwise:open', function (e) {
    if (!el.pn) return;
    toggle(true);
    var tx = e && e.detail && e.detail.text;
    if (tx) setTimeout(function () { ask(tx); }, 150);
  });

  fetch(API + '/api/config?client=' + encodeURIComponent(CLIENT))
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (c) { cfg = c; if (document.body) build(); else document.addEventListener('DOMContentLoaded', build); })
    .catch(function (e) { if (window.console) console.warn('Arcwise Front Desk: could not load', CLIENT, e); });
})();
