// Gentology Barbershop. Facts checked against gentology-barbershop.com on 2026-10-22.
// The agent may not say anything that is not in `knowledge`.

const services = [
  ['Fade avant-garde signature haircut', 'IDR 90k'],
  ['Avant-garde signature haircut', 'IDR 80k'],
  ['Traditional shaving', 'IDR 30–60k'],
  ['Hair tattoo', 'from IDR 60k'],
  ['Hair polish', 'IDR 80k'],
];
const hours = [
  ['Monday', '11:00–22:00'], ['Tuesday', '11:00–22:00'], ['Wednesday', '11:00–22:00'],
  ['Thursday', '11:00–22:00'], ['Friday', '14:00–22:00'], ['Saturday', '09:00–20:00'],
  ['Sunday', '11:00–22:00'],
];
const contacts = [
  { key: 'cideng', name: 'Cideng', e164: '6281770003750', tel: '0817 7000 3750',
    address: 'Jl. Cideng Timur Raya No. 90, Petojo Selatan, Gambir, Jakarta 10160' },
  { key: 'tanjung-duren', name: 'Tanjung Duren', e164: '6287886934674', tel: '0878 8693 4674',
    address: 'Jl. Tanjung Duren Raya Lama No. 823, Grogol Petamburan, Jakarta Barat 11470' },
  { key: 'cipete', name: 'Silverhawk Cipete', e164: '6287778136435', tel: '0877 7813 6435',
    address: 'Jl. Puri Mutiara No. 10A, Cipete, Jakarta Selatan 12410' },
].map(c => ({ ...c, note: `${c.address}, phone/WhatsApp ${c.tel}` }));

const quickReplies = {
  en: ['Join the waiting list', 'Prices', 'Branches and hours'],
  id: ['Masuk waiting list', 'Harga', 'Cabang dan jam buka'],
};

export default {
  id: 'gentology',
  name: 'Gentology Barbershop',
  assistant: 'Gentology Front Desk',
  theme: { accent: '#C9A15A', ink: '#15130E', paper: '#F3EBDC', onAccent: '#15130E', mode: 'dark' },
  tagline: { en: 'Roaring 20s barbershop', id: 'Barbershop ala Roaring 20s' },
  teaser: { en: 'Skip the phone call: join today’s waiting list here.', id: 'Gak perlu telepon: masuk waiting list hari ini di sini.' },
  tiles: [
    { icon: 'queue', title: { en: 'Join the waiting list', id: 'Masuk waiting list' }, sub: { en: 'Cideng, Tanjung Duren or Cipete', id: 'Cideng, Tanjung Duren atau Cipete' }, send: { en: 'I want to join the waiting list', id: 'Saya mau masuk waiting list' } },
    { icon: 'tag', title: { en: 'Prices', id: 'Harga' }, sub: { en: 'Haircuts from IDR 80k', id: 'Haircut mulai IDR 80k' }, send: { en: 'What are your prices?', id: 'Berapa harganya?' } },
    { icon: 'pin', title: { en: 'Branches and hours', id: 'Cabang dan jam buka' }, sub: { en: 'Addresses and opening times', id: 'Alamat dan jam buka' }, send: { en: 'Where are your branches and when are you open?', id: 'Cabangnya di mana dan jam berapa buka?' } },
  ],
  greeting: {
    en: 'Hi, welcome to Gentology. I can tell you our prices and hours, or put you on the waiting list at Cideng, Tanjung Duren or Cipete.',
    id: 'Halo, selamat datang di Gentology. Saya bisa bantu info harga, jam buka, atau masuk waiting list di Cideng, Tanjung Duren atau Cipete.',
  },
  quickReplies,
  allowedOrigins: [
    'https://gentology-concept.vercel.app',
    'https://arcwise-front-desk.vercel.app',
  ],
  contacts,
  handoff: {
    waitlist: {
      when: 'the customer wants to join the waiting list / queue at a branch',
      en: "Hi {client} {contact}, I'd like to join today's waiting list.",
      id: 'Halo {client} {contact}, saya mau masuk waiting list hari ini.',
      nameLine: { en: ' Name: {name}.', id: ' Nama: {name}.' },
      noName: { en: ' Name: ', id: ' Nama: ' },
    },
    question: {
      when: 'anything else the branch must answer (promos, a specific barber, live queue)',
      en: 'Hi {client} {contact}, ', id: 'Halo {client} {contact}, ',
      nameLine: { en: 'this is {name}. ', id: 'saya {name}. ' },
    },
  },
  knowledge: `
Gentology Barbershop is a Roaring 20s style gentlemen's barbershop in Jakarta, founded by Ricky Andi Wardana and Bob Christoper.
Every haircut includes hair vitamin, hot towel, massage and pomade styling.
The signature haircut starts with a head-reading, then detailed hair-crafting. Fades can be low, mid or high.
There are no fixed appointments. Customers join the branch's waiting list (by phone or WhatsApp) and come in close to their turn.
Opening hours are the same published hours for all branches.
Email: gentology.barbershop@gmail.com. Instagram: @gentology.roaring20s.barber

Services and prices:
${services.map(([n, p]) => `${n}: ${p}`).join('\n')}

Opening hours:
${hours.map(([d, h]) => `${d}: ${h}`).join('\n')}`.trim(),
  agentRules: `- You cannot see the live queue and cannot confirm a place yourself. To join the waiting list: find out which branch (and their name if given), then call whatsapp_button with purpose waitlist.`,
  dailyCap: 400,

  // Answers used when the AI is off, down or over a limit.
  offline(text, lang, h) {
    const t = text.toLowerCase();
    const id = lang === 'id';
    const branch = h.findContact(t);
    const wantsQueue = /(waiting|antri|antre|queue|daftar|book|reserv|slot|masuk)/.test(t);
    const wantsPrice = /(harga|price|berapa|cost|biaya|haircut|fade|shav|cukur|tattoo|polish|layanan|service|menu)/.test(t);
    const wantsInfo = /(jam|buka|tutup|open|close|hour|cabang|branch|lokasi|location|alamat|address|where|mana|maps)/.test(t);
    if (wantsQueue || (branch && !wantsPrice && !wantsInfo)) {
      const list = branch ? [branch] : contacts;
      return {
        text: branch
          ? (id ? `Siap. Tap di bawah untuk kirim ke ${branch.name} via WhatsApp, tulis nama kamu, dan mereka akan kasih nomor antrian.`
                : `Sure. Tap below to message ${branch.name} on WhatsApp, add your name, and they'll give you your place in the queue.`)
          : (id ? 'Mau di cabang mana? Tap cabangnya, lalu kirim pesannya di WhatsApp dengan nama kamu.'
                : 'Which branch? Tap one below and send the message on WhatsApp with your name.'),
        actions: list.map(b => h.handoff(b.key, 'waitlist', lang)),
        replies: [],
      };
    }
    if (wantsPrice) {
      return {
        text: (id ? 'Harga kami:\n' : 'Our prices:\n') + services.map(([n, p]) => `• ${n}: ${p}`).join('\n') +
          (id ? '\n\nSemua haircut sudah termasuk hair vitamin, hot towel, pijat dan styling pomade.'
              : '\n\nEvery haircut includes hair vitamin, hot towel, massage and pomade styling.'),
        actions: [], replies: quickReplies[lang].filter((_, i) => i !== 1),
      };
    }
    if (wantsInfo) {
      return {
        text: (id ? 'Cabang kami:\n' : 'Our branches:\n') + contacts.map(b => `• ${b.name}: ${b.address} (${b.tel})`).join('\n') +
          (id ? '\n\nJam buka:\n' : '\n\nOpening hours:\n') + hours.map(([d, x]) => `${d} ${x}`).join('\n'),
        actions: [], replies: quickReplies[lang].filter((_, i) => i !== 2),
      };
    }
    return {
      text: id
        ? 'Saya bisa bantu soal harga, jam buka, lokasi cabang, atau masuk waiting list. Untuk pertanyaan lain, chat langsung cabangnya di WhatsApp.'
        : 'I can help with prices, opening hours, branch locations or joining the waiting list. For anything else, message the branch on WhatsApp.',
      actions: contacts.map(b => h.handoff(b.key, 'question', lang)),
      replies: quickReplies[lang],
    };
  },
};
