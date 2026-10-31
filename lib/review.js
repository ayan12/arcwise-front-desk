// Drafts a short Google review from what the customer picked. The customer always edits and posts it
// themselves: the draft only uses their own choices, never invents details, and never hides low ratings.

export const POINTS = {
  good: {
    cut: { en: 'the haircut came out exactly how I wanted', id: 'hasil potongannya persis seperti yang saya mau' },
    fade: { en: 'a clean, sharp fade', id: 'fade-nya rapi dan tajam' },
    detail: { en: 'the barber’s attention to detail', id: 'barbernya teliti dan detail' },
    towel: { en: 'the hot towel and head massage', id: 'hot towel dan pijatnya' },
    vibe: { en: 'the classic Roaring 20s atmosphere', id: 'suasana klasik ala Roaring 20s' },
    staff: { en: 'friendly, professional staff', id: 'staf yang ramah dan profesional' },
    queue: { en: 'joining the waiting list on WhatsApp, with no long wait', id: 'antri lewat WhatsApp jadi gak perlu nunggu lama' },
    value: { en: 'good value for the price', id: 'harganya sepadan' },
    clean: { en: 'a clean, comfortable place', id: 'tempatnya bersih dan nyaman' },
  },
  bad: {
    wait: { en: 'the wait was longer than expected', id: 'waktu tunggunya lebih lama dari perkiraan' },
    result: { en: 'the cut wasn’t quite what I asked for', id: 'hasil potongannya kurang sesuai permintaan' },
    rushed: { en: 'the service felt rushed', id: 'pelayanannya terasa terburu-buru' },
    price: { en: 'the price felt high for what I got', id: 'harganya terasa mahal untuk hasilnya' },
    clean: { en: 'the place could be cleaner', id: 'tempatnya bisa lebih bersih' },
    staff: { en: 'the staff could be friendlier', id: 'stafnya bisa lebih ramah' },
  },
};

const clean = s => String(s || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();

function template({ stars, picks, barber, note, lang, branch }) {
  const id = lang === 'id';
  const set = stars >= 4 ? POINTS.good : POINTS.bad;
  const items = picks.map(k => set[k]?.[lang]).filter(Boolean);
  const join = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + (id ? ' dan ' : ' and ') + a[a.length - 1];
  const b = barber ? (id ? ` Dipotong sama ${barber}.` : ` ${barber} did my cut.`) : '';
  let t;
  if (stars >= 4) t = id ? `Pengalaman yang menyenangkan di ${branch}. ${items.length ? 'Yang paling saya suka: ' + join(items) + '.' : ''}${b}` : `Great visit to ${branch}. ${items.length ? 'What I liked most: ' + join(items) + '.' : ''}${b}`;
  else if (stars === 3) t = id ? `Cukup oke di ${branch}.${b} ${items.length ? 'Masukan saya: ' + join(items) + '.' : ''}` : `Decent visit to ${branch}.${b} ${items.length ? 'Room to improve: ' + join(items) + '.' : ''}`;
  else t = id ? `Kunjungan saya ke ${branch} kurang memuaskan. ${items.length ? join(items).replace(/^./, c => c.toUpperCase()) + '.' : ''}${b}` : `My visit to ${branch} didn’t go well. ${items.length ? join(items).replace(/^./, c => c.toUpperCase()) + '.' : ''}${b}`;
  return clean(t + (note ? ' ' + note : ''));
}

export async function draftReview(env, input) {
  const stars = Math.max(1, Math.min(5, Math.round(Number(input.stars) || 5)));
  const lang = input.lang === 'id' ? 'id' : 'en';
  const set = stars >= 4 ? POINTS.good : POINTS.bad;
  const picks = (Array.isArray(input.picks) ? input.picks : []).filter(k => set[k]).slice(0, 6);
  const barber = clean(input.barber).replace(/[^\p{L} .'-]/gu, '').slice(0, 30);
  const note = clean(input.note).slice(0, 300);
  const branch = clean(input.branch).slice(0, 60);
  const base = { stars, picks, barber, note, lang, branch };
  if (!env.ANTHROPIC_API_KEY) return { text: template(base), source: 'template' };

  const points = picks.map(k => set[k][lang]);
  const prompt = `Write a short Google review that a customer will post themselves, in ${lang === 'id' ? 'casual, natural Bahasa Indonesia' : 'natural, casual English'}.
Business: ${branch} (Gentology Barbershop, Jakarta). Star rating: ${stars} of 5.
The customer's own points: ${points.length ? points.join('; ') : '(none picked)'}.
${barber ? `Barber's name: ${barber}.` : ''}${note ? `\nCustomer's own words (keep their meaning): "${note}"` : ''}
Rules: first person; 2 to 3 sentences, under 60 words; use ONLY the points above and invent nothing else: no prices, dates or names they didn't give, and no added feelings, results or claims (for example don't say it made them feel confident or that it's the best in town unless they picked it); tone must match ${stars} stars${stars <= 3 ? ', honest and polite, constructive' : ''}; no hashtags, no quotation marks, at most one emoji; vary the wording${input.variant ? ' (this is another version, phrase it differently)' : ''}.
Reply with the review text only.`;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: env.FRONT_DESK_MODEL || 'claude-haiku-5-5', max_tokens: 200, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();
    const text = clean((d.content || []).filter(b => b.type === 'text').map(b => b.text).join(' ')).replace(/^["“]|["”]$/g, '');
    return text ? { text: text.slice(0, 600), source: 'ai' } : { text: template(base), source: 'template' };
  } catch { return { text: template(base), source: 'template' }; }
}
