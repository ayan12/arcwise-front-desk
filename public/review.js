const qs = new URLSearchParams(location.search);
const $ = s => document.getElementById(s);
const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
let lang = store.get('gq-lang') || ((navigator.language || '').toLowerCase().startsWith('id') ? 'id' : 'en');
let info = null, stars = 0, picks = new Set(), variant = 0;

const T = {
  en: {
    title: n => `How was your cut${n ? ', ' + n : ''}?`, lead: 'Tap the stars. We’ll help you write a short review for Google in 20 seconds.',
    labels: ['', 'Poor', 'Not great', 'Okay', 'Great', 'Excellent'], tap: 'Tap to rate',
    pickGood: 'What did you like? Pick any', pickBad: 'What should we fix? Pick any',
    barber: 'Who cut your hair? (optional)', note: 'Anything to add in your own words? (optional)',
    draft: 'Write my review', drafting: 'Writing…', draftTitle: 'Your review', again: 'Another version',
    edit: 'It’s your review: change anything you like before posting.',
    post: 'Copy & open Google', copied: 'Copied! Opening Google…',
    how: s => [`Google opens on <b>Gentology’s review page</b>`, `Tap <b>${'★'.repeat(s)}</b> (${s} star${s > 1 ? 's' : ''})`, `Press and hold the text box, tap <b>Paste</b>, then <b>Post</b>`],
    ownerTitle: 'Want the owner to put it right?', ownerText: 'Tell the branch what happened and they’ll get back to you. You can still post on Google: honest reviews help us improve.',
    ownerBtn: 'Message the branch on WhatsApp', ownerMsg: (b, s) => `Hi ${b}, I just rated my visit ${s}/5 and wanted to tell you what happened: `,
    thanksTitle: 'Thank you!', thanksText: 'Your review is copied. If Google didn’t open, tap below and paste it in.', reopen: 'Open Google reviews',
    foot: 'Your review is posted by you, on Google, in your own name.',
  },
  id: {
    title: n => `Gimana potongannya${n ? ', ' + n : ''}?`, lead: 'Tap bintangnya. Kami bantu tulis review singkat untuk Google dalam 20 detik.',
    labels: ['', 'Buruk', 'Kurang', 'Lumayan', 'Bagus', 'Mantap banget'], tap: 'Tap untuk kasih nilai',
    pickGood: 'Apa yang kamu suka? Pilih sebanyak-banyaknya', pickBad: 'Apa yang perlu kami perbaiki? Pilih saja',
    barber: 'Siapa yang potong? (opsional)', note: 'Mau tambah kata-kata sendiri? (opsional)',
    draft: 'Buatkan review', drafting: 'Menulis…', draftTitle: 'Review kamu', again: 'Versi lain',
    edit: 'Ini review kamu: ubah apa saja sebelum diposting.',
    post: 'Salin & buka Google', copied: 'Tersalin! Membuka Google…',
    how: s => [`Google terbuka di <b>halaman review Gentology</b>`, `Tap <b>${'★'.repeat(s)}</b> (${s} bintang)`, `Tekan lama kotak teks, tap <b>Tempel</b>, lalu <b>Posting</b>`],
    ownerTitle: 'Mau owner bantu perbaiki?', ownerText: 'Ceritakan ke cabang apa yang terjadi, nanti mereka hubungi kamu. Kamu tetap bisa posting di Google: review jujur membantu kami jadi lebih baik.',
    ownerBtn: 'Chat cabang via WhatsApp', ownerMsg: (b, s) => `Halo ${b}, saya baru kasih nilai ${s}/5 dan mau cerita apa yang terjadi: `,
    thanksTitle: 'Terima kasih!', thanksText: 'Review kamu sudah tersalin. Kalau Google belum terbuka, tap di bawah lalu tempel.', reopen: 'Buka review Google',
    foot: 'Review diposting oleh kamu sendiri, di Google, atas nama kamu.',
  },
};
const t = () => T[lang];

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.1l-5.7 3.2 1.2-6.4L2.8 9.5l6.4-.8z" stroke-linejoin="round"/></svg>';

function chips() {
  const set = stars >= 4 ? info.points.good : info.points.bad;
  const box = $('chips'); box.textContent = '';
  Object.entries(set).forEach(([k, v]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (picks.has(k) ? ' on' : '');
    b.textContent = v[lang].replace(/^./, c => c.toUpperCase()); b.setAttribute('aria-pressed', picks.has(k));
    b.addEventListener('click', () => { picks.has(k) ? picks.delete(k) : picks.add(k); chips(); });
    box.appendChild(b);
  });
}

function paint() {
  const L = t();
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.l === lang));
  $('title').textContent = L.title(info?.name);
  $('lead').textContent = L.lead;
  $('rlabel').innerHTML = stars ? L.labels[stars] : '<span>' + L.tap + '</span>';
  document.querySelectorAll('.star').forEach((s, i) => { s.classList.toggle('on', i < stars); s.setAttribute('aria-checked', i + 1 === stars); s.setAttribute('aria-label', (i + 1) + ' · ' + L.labels[i + 1]); });
  $('pickTitle').textContent = stars >= 4 ? L.pickGood : L.pickBad;
  $('barberL').textContent = L.barber; $('noteL').textContent = L.note;
  $('draftBtn').textContent = L.draft; $('draftTitle').textContent = L.draftTitle; $('again').textContent = L.again;
  $('editHint').textContent = L.edit; $('post').textContent = L.post;
  $('how').innerHTML = L.how(stars || 5).map(x => '<li><span>' + x + '</span></li>').join('');
  $('ownerTitle').textContent = L.ownerTitle; $('ownerText').textContent = L.ownerText; $('ownerBtn').textContent = L.ownerBtn;
  if (info) $('ownerBtn').href = 'https://wa.me/' + info.branch.e164 + '?text=' + encodeURIComponent(L.ownerMsg(info.branch.full, stars));
  $('thanksTitle').textContent = L.thanksTitle; $('thanksText').textContent = L.thanksText; $('reopen').textContent = L.reopen;
  $('foot').textContent = L.foot;
  if (stars) chips();
}

async function draft() {
  const btn = variant ? $('again') : $('draftBtn');
  btn.disabled = true; const old = btn.textContent; btn.textContent = t().drafting;
  try {
    const r = await fetch('/api/queue', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'review-draft', branch: info.branch.key, stars, picks: [...picks], barber: $('barber').value, note: $('note').value, lang, variant }) });
    const d = await r.json();
    if (d.text) { $('draft').value = d.text; $('step3').hidden = false; $('step3').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  } catch (e) {}
  btn.disabled = false; btn.textContent = old;
}

async function post() {
  const text = $('draft').value.trim();
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {}
  if (!ok) { const d = $('draft'); d.focus(); d.select(); try { ok = document.execCommand('copy'); } catch (e) {} }
  $('post').textContent = t().copied;
  window.open(info.google, '_blank', 'noopener');
  fetch('/api/queue', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'review-posted', branch: info.branch.key }) }).catch(() => {});
  setTimeout(() => { $('thanks').hidden = false; $('post').textContent = t().post; $('thanks').scrollIntoView({ behavior: 'smooth' }); }, 900);
}

async function init() {
  const b = qs.get('b') || 'cideng';
  try {
    const r = await fetch('/api/queue?action=review-info&b=' + encodeURIComponent(b) + (qs.get('t') ? '&t=' + encodeURIComponent(qs.get('t')) : ''));
    info = await r.json();
    if (info.error) throw new Error(info.error);
  } catch (e) { $('title').textContent = 'Review link not found'; return; }
  $('bname').textContent = info.branch.full;
  $('reopen').href = info.google;
  const box = $('stars');
  for (let i = 1; i <= 5; i++) {
    const s = document.createElement('button'); s.type = 'button'; s.className = 'star'; s.setAttribute('role', 'radio'); s.innerHTML = STAR;
    s.addEventListener('click', () => {
      const flip = stars && ((stars >= 4) !== (i >= 4));
      stars = i; if (flip) picks.clear();
      $('step2').hidden = false; $('owner').hidden = stars > 3; $('step3').hidden = true; $('thanks').hidden = true; variant = 0;
      paint();
    });
    box.appendChild(s);
  }
  paint();
}

document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => { lang = b.dataset.l; store.set('gq-lang', lang); paint(); }));
$('draftBtn').addEventListener('click', () => { variant = 0; draft(); });
$('again').addEventListener('click', () => { variant++; draft(); });
$('post').addEventListener('click', post);
init();
