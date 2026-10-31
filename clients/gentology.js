// Gentology Barbershop. Facts checked against gentology-barbershop.com on 2026-10-22.
// Edit facts here only. The agent may not say anything that is not in `facts`.

export default {
  id: 'gentology',
  name: 'Gentology Barbershop',
  assistant: 'Gentology Front Desk',
  theme: { accent: '#B4873A', ink: '#17150F', paper: '#F6F0E4', onAccent: '#17150F' },
  greeting: {
    en: 'Hi, welcome to Gentology. I can tell you our prices and hours, or put you on the waiting list at Cideng, Tanjung Duren or Cipete.',
    id: 'Halo, selamat datang di Gentology. Saya bisa bantu info harga, jam buka, atau masuk waiting list di Cideng, Tanjung Duren atau Cipete.',
  },
  quickReplies: {
    en: ['Join the waiting list', 'Prices', 'Branches and hours'],
    id: ['Masuk waiting list', 'Harga', 'Cabang dan jam buka'],
  },
  // Sites allowed to load this client's chat. Add the client's real domain before launch.
  allowedOrigins: [
    'https://gentology-concept.vercel.app',
    'https://arcwise-front-desk.vercel.app',
    'https://arcwise-studios.vercel.app',
  ],
  // Branches the agent can hand a chat to, on WhatsApp.
  branches: [
    { key: 'cideng', name: 'Cideng', e164: '6281770003750', tel: '0817 7000 3750',
      address: 'Jl. Cideng Timur Raya No. 90, Petojo Selatan, Gambir, Jakarta 10160' },
    { key: 'tanjung-duren', name: 'Tanjung Duren', e164: '6287886934674', tel: '0878 8693 4674',
      address: 'Jl. Tanjung Duren Raya Lama No. 823, Grogol Petamburan, Jakarta Barat 11470' },
    { key: 'cipete', name: 'Silverhawk Cipete', e164: '6287778136435', tel: '0877 7813 6435',
      address: 'Jl. Puri Mutiara No. 10A, Cipete, Jakarta Selatan 12410' },
  ],
  hours: [
    ['Monday', '11:00–22:00'], ['Tuesday', '11:00–22:00'], ['Wednesday', '11:00–22:00'],
    ['Thursday', '11:00–22:00'], ['Friday', '14:00–22:00'], ['Saturday', '09:00–20:00'],
    ['Sunday', '11:00–22:00'],
  ],
  services: [
    ['Fade avant-garde signature haircut', 'IDR 90k'],
    ['Avant-garde signature haircut', 'IDR 80k'],
    ['Traditional shaving', 'IDR 30–60k'],
    ['Hair tattoo', 'from IDR 60k'],
    ['Hair polish', 'IDR 80k'],
  ],
  facts: `
Gentology Barbershop is a Roaring 20s style gentlemen's barbershop in Jakarta, founded by Ricky Andi Wardana and Bob Christoper.
Every haircut includes hair vitamin, hot towel, massage and pomade styling.
The signature haircut starts with a head-reading, then detailed hair-crafting. Fades can be low, mid or high.
There are no fixed appointments. Customers join the branch's waiting list (by phone or WhatsApp) and come in close to their turn.
Opening hours are the same published hours for all branches.
Email: gentology.barbershop@gmail.com. Instagram: @gentology.roaring20s.barber
`.trim(),
  dailyCap: 400,
};
