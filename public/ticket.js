const id = new URLSearchParams(location.search).get('id') || '';
const $ = s => document.getElementById(s);
const SVC = { fade: 'Fade signature haircut', signature: 'Signature haircut', shave: 'Traditional shaving', tattoo: 'Hair tattoo', polish: 'Hair polish' };
let confirming = false;

function show(d) {
  const t = d.ticket, b = d.branch;
  $('where').textContent = b.full + ' · ticket';
  $('num').textContent = t.no;
  $('name').textContent = t.name;
  $('svc').textContent = SVC[t.service] || '';
  const st = $('state'), sub = $('sub');
  if (t.status === 'waiting') {
    if (t.waitMins <= 0 || t.position === 1 && t.waitMins <= 5) { st.innerHTML = 'It’s <i>your turn</i> next'; sub.textContent = 'Come to the counter and show this number.'; }
    else { st.textContent = `Number ${t.position} in line`; sub.textContent = `About ${t.waitMins} minutes. We’ll WhatsApp you around 15 minutes before.`; }
  } else if (t.status === 'chair') { st.innerHTML = 'You’re <i>in the chair</i>'; sub.textContent = 'Enjoy the cut.'; }
  else if (t.status === 'done') { st.innerHTML = 'Thanks for <i>coming in</i>'; sub.innerHTML = ''; const a = document.createElement('a'); a.href = '/review?b=' + b.key + '&t=' + t.id; a.textContent = 'Rate your visit ★'; a.style.cssText = 'display:inline-block;margin-top:10px;background:#C9A15A;color:#15130E;padding:12px 18px;border-radius:14px;font-weight:700;text-decoration:none'; sub.appendChild(a); }
  else if (t.status === 'noshow') { st.textContent = 'We missed you'; sub.textContent = 'Your number was called. Message the branch for a new spot.'; }
  else { st.textContent = 'Spot cancelled'; sub.textContent = 'Join again any time on WhatsApp.'; }
  const prog = $('prog'); prog.textContent = ''; prog.hidden = t.status !== 'waiting';
  (d.serving || []).forEach(n => { const s = document.createElement('span'); s.className = 'chair'; s.textContent = n; prog.appendChild(s); });
  if (t.status === 'waiting') for (let i = 1; i <= Math.min(t.position, 12); i++) { const s = document.createElement('span'); if (i === t.position) { s.className = 'me'; s.textContent = t.no; } prog.appendChild(s); }
  let cd = document.getElementById('card');
  if (!cd) { cd = document.createElement('div'); cd.id = 'card'; cd.style.cssText = 'margin:18px auto 0;max-width:340px;padding:16px 18px;border-radius:18px;background:#1D1A14;box-shadow:inset 0 0 0 1px #332D23;text-align:center'; $('prog').after(cd); }
  if (d.card) {
    const c = d.card;
    cd.hidden = false;
    cd.innerHTML = '<div style="font-size:13px;color:#A39A88;margin-bottom:10px">Loyalty card · 5 cuts, the 6th is free</div><div class="st" style="display:flex;gap:8px;justify-content:center"></div><div class="tx" style="margin-top:10px;font-weight:600;font-size:15px"></div>';
    const st = cd.querySelector('.st');
    for (let i = 0; i < 6; i++) { const s = document.createElement('span'); const on = i < c.stamps || (i === 5 && c.free); s.textContent = i === 5 ? '🎁' : '✂'; s.style.cssText = 'width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:16px;' + (i === 5 ? 'background:' + (c.free ? '#C9A15A' : 'transparent') + ';box-shadow:inset 0 0 0 1.5px #C9A15A' : on ? 'background:#C9A15A;color:#15130E' : 'box-shadow:inset 0 0 0 1.5px #5a4a2c;color:#5a4a2c'); st.appendChild(s); }
    cd.querySelector('.tx').textContent = c.free ? 'This cut is FREE 🎉' : (c.paid - c.stamps) + ' more cut' + (c.paid - c.stamps === 1 ? '' : 's') + ' to a free one';
  } else cd.hidden = true;
  $('info').hidden = false;
  $('bname').textContent = b.full; $('addr').textContent = b.address;
  $('maps').href = b.maps; $('wa').href = 'https://wa.me/' + b.e164;
  $('cancelRow').hidden = t.status !== 'waiting';
}

async function load() {
  try {
    const r = await fetch('/api/queue?action=ticket&id=' + encodeURIComponent(id));
    if (!r.ok) throw new Error(r.status);
    show(await r.json());
  } catch (e) { $('where').textContent = 'We couldn’t find this ticket. It may be from an earlier day.'; }
}
$('cancel').addEventListener('click', async () => {
  const b = $('cancel');
  if (!confirming) { confirming = true; b.textContent = 'Tap again to cancel'; setTimeout(() => { confirming = false; b.textContent = 'Cancel my spot'; }, 4000); return; }
  b.disabled = true;
  await fetch('/api/queue', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'cancel-ticket', id }) }).catch(() => {});
  b.disabled = false; confirming = false; load();
});
load();
setInterval(load, 10000);
