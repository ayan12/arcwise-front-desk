// WhatsApp simulator for the Gentology booking demo. Talks to the same bot as real WhatsApp.
const $ = s => document.querySelector(s);
const chat = $('#chat'), input = $('#input'), screen = $('#screen'), nameEl = $('#name');
const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

let user = store.get('gq-sim-user');
if (!user) { user = Array.from(crypto.getRandomValues(new Uint8Array(10)), b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('') + 'sim'; store.set('gq-sim-user', user); }
nameEl.value = store.get('gq-sim-name') || 'Rizky';
nameEl.addEventListener('change', () => store.set('gq-sim-name', nameEl.value.trim() || 'Rizky'));

let seen = 0, waiting = false, msgs = [];

const time = t => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
function rich(el, text) {
  // *bold* and links, built safely as DOM nodes.
  String(text || '').split(/(\*[^*\n]+\*|https?:\/\/\S+)/g).forEach(part => {
    if (!part) return;
    if (/^\*[^*]+\*$/.test(part)) { const b = document.createElement('b'); b.textContent = part.slice(1, -1); el.appendChild(b); }
    else if (/^https?:\/\//.test(part)) { const a = document.createElement('a'); a.href = part; a.textContent = part.replace(/^https?:\/\//, ''); a.target = '_blank'; a.rel = 'noopener'; el.appendChild(a); }
    else el.appendChild(document.createTextNode(part));
  });
}

function render() {
  chat.textContent = '';
  const day = document.createElement('div'); day.className = 'day'; day.textContent = 'Today'; chat.appendChild(day);
  const note = document.createElement('div'); note.className = 'note';
  note.textContent = '🔒 Demo of Gentology’s WhatsApp booking. Messages here go to the real queue system.';
  chat.appendChild(note);
  msgs.forEach((m, i) => {
    const d = document.createElement('div'); d.className = 'msg ' + (m.from === 'me' ? 'me' : 'bot');
    rich(d, m.text);
    const t = document.createElement('span'); t.className = 't'; t.textContent = time(m.at) + (m.from === 'me' ? ' ✓✓' : ''); d.appendChild(t);
    chat.appendChild(d);
    const last = i === msgs.length - 1;
    if (m.from === 'bot' && (m.buttons?.length || m.list)) {
      const box = document.createElement('div'); box.className = 'acts';
      (m.buttons || []).forEach(b => {
        const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = '↩ ' + b.title; btn.disabled = !last;
        btn.addEventListener('click', () => sendChoice(b.id, b.title)); box.appendChild(btn);
      });
      if (m.list) {
        const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = '☰ ' + (m.list.button || 'Choose'); btn.disabled = !last;
        btn.addEventListener('click', () => openSheet(m.list)); box.appendChild(btn);
      }
      chat.appendChild(box);
    }
  });
  if (waiting) { const t = document.createElement('div'); t.className = 'typing'; t.innerHTML = '<i></i><i></i><i></i>'; chat.appendChild(t); }
  chat.scrollTop = chat.scrollHeight;
}

function openSheet(list) {
  const bg = document.createElement('div'); bg.className = 'sheet-bg';
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', list.title || 'Options');
  sh.innerHTML = '<div class="grab"></div><h3><span></span><button type="button">Close</button></h3>';
  sh.querySelector('h3 span').textContent = list.title || 'Options';
  const close = () => bg.remove();
  sh.querySelector('h3 button').addEventListener('click', close);
  list.rows.forEach(r => {
    const o = document.createElement('button'); o.type = 'button'; o.className = 'opt';
    const txt = document.createElement('span'); txt.textContent = r.title;
    if (r.desc) { const s = document.createElement('small'); s.textContent = r.desc; txt.appendChild(s); }
    o.appendChild(txt); o.appendChild(document.createElement('i'));
    o.addEventListener('click', () => { close(); sendChoice(r.id, r.title); });
    sh.appendChild(o);
  });
  bg.appendChild(sh); bg.addEventListener('click', e => { if (e.target === bg) close(); });
  screen.appendChild(bg); sh.querySelector('.opt')?.focus();
}

async function post(body) {
  waiting = true; render();
  try {
    const r = await fetch('/api/queue', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'sim-send', user, name: nameEl.value.trim() || 'Rizky', ...body }) });
    if (!r.ok) throw new Error(r.status);
  } catch (e) { waiting = false; msgs.push({ from: 'bot', text: 'Couldn’t send. Check your connection and try again.', at: Date.now() }); render(); return; }
  await poll(); waiting = false; render();
}
const sendText = t => { if (t.trim()) post({ text: t.trim() }); };
const sendChoice = (id, label) => post({ id, label });

async function poll() {
  try {
    const r = await fetch('/api/queue?action=sim-poll&user=' + user + '&from=' + seen);
    const d = await r.json();
    if (d.messages && d.messages.length) { msgs = msgs.concat(d.messages); seen += d.messages.length; render(); }
  } catch (e) {}
}

$('#form').addEventListener('submit', e => { e.preventDefault(); const t = input.value; input.value = ''; sendText(t); });
$('#restart').addEventListener('click', e => {
  e.preventDefault();
  user = Array.from(crypto.getRandomValues(new Uint8Array(10)), b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('') + 'sim';
  store.set('gq-sim-user', user); msgs = []; seen = 0; render(); input.focus();
});

render();
poll();
// Alerts and thank-you messages arrive when staff act on the tablet.
setInterval(() => { if (!waiting) poll(); }, 2500);
