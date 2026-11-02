// Koka Tattoo (Gede Adi Muliana, Bali). Facts taken from instagram.com/kokatattoo_ and posts tagging him, 2026-11-02.
// The agent may not say anything that is not in `knowledge`. Bookings go to his Instagram DMs.

const TOUR_START = Date.UTC(2026, 10, 3), TOUR_END = Date.UTC(2026, 10, 13, 16, 59); // 3–13 Nov 2026, Jakarta time
const tourStatus = () => {
  const now = Date.now();
  if (now > TOUR_END) return 'The Jakarta tour (3–13 November 2026) has ENDED. Do not offer tour sessions; offer a booking in Bali or the next tour (ask Koka in DM).';
  if (now >= TOUR_START) return 'The Jakarta tour is happening RIGHT NOW (3–13 November 2026).';
  return 'The Jakarta tour starts soon: 3–13 November 2026.';
};

const quickReplies = {
  en: ['Book a Jakarta tour session', 'How much is a session?', 'What styles does Koka do?'],
  id: ['Booking sesi tour Jakarta', 'Berapa harga per sesi?', 'Koka bisa gaya apa saja?'],
};

export default {
  id: 'koka',
  name: 'Koka Tattoo',
  assistant: 'Koka Tattoo',
  theme: { accent: '#C8A253', ink: '#120D0B', paper: '#F1E7D6', onAccent: '#120D0B', mode: 'dark' },
  tagline: { en: 'Large-scale tattoos · Bali & Jakarta tour', id: 'Tato skala besar · Bali & tour Jakarta' },
  teaser: { en: 'Jakarta tour: only 10 sessions, 3–13 Nov. Want one?', id: 'Tour Jakarta: cuma 10 sesi, 3–13 Nov. Mau ambil satu?' },
  tiles: [
    { icon: 'queue', title: { en: 'Book a tour session', id: 'Booking sesi tour' }, sub: { en: 'Jakarta, 3–13 November · 10 sessions', id: 'Jakarta, 3–13 November · 10 sesi' }, send: { en: 'I want to book a Jakarta tour session', id: 'Saya mau booking sesi tour Jakarta' } },
    { icon: 'tag', title: { en: 'Price', id: 'Harga' }, sub: { en: 'Rp 8.999K per session on tour', id: 'Rp 8.999K per sesi saat tour' }, send: { en: 'How much is a session?', id: 'Berapa harga per sesi?' } },
    { icon: 'spark', title: { en: 'My tattoo idea', id: 'Ide tato saya' }, sub: { en: 'Tell us the idea, size and placement', id: 'Ceritakan ide, ukuran dan posisinya' }, send: { en: 'I have a tattoo idea', id: 'Saya punya ide tato' } },
  ],
  greeting: {
    en: "Hi! I'm Koka's booking assistant. I can tell you about the Jakarta tour, prices and styles, and get your idea ready to send to Koka. What are you thinking of getting?",
    id: 'Halo! Saya asisten booking Koka. Saya bisa jelaskan tour Jakarta, harga dan gaya tatonya, lalu siapkan ide kamu untuk dikirim ke Koka. Mau bikin tato apa?',
  },
  quickReplies,
  allowedOrigins: [
    'https://arcwise-front-desk.vercel.app',
  ],
  contacts: [
    { key: 'koka', name: 'Koka', ig: 'kokatattoo_', note: 'Gede Adi Muliana, books through Instagram DM @kokatattoo_' },
  ],
  handoff: {
    book: {
      when: 'the visitor wants to book, claim a tour session, get a quote, or has an idea ready',
      en: 'Hi Koka, I want to book a session.',
      id: 'Halo Koka, saya mau booking sesi.',
      nameLine: { en: ' My name is {name}.', id: ' Nama saya {name}.' },
      noName: { en: ' My name is ', id: ' Nama saya ' },
      aboutLine: { en: ' Idea: {about}.', id: ' Ide: {about}.' },
    },
    question: {
      when: 'any other question for Koka',
      en: 'Hi Koka, ', id: 'Halo Koka, ',
      nameLine: { en: 'this is {name}. ', id: 'saya {name}. ' },
      aboutLine: { en: '{about}', id: '{about}' },
    },
  },
  get knowledge() {
    return `
Koka Tattoo is the work of Gede Adi Muliana ("Koka", also "Adi"), a tattoo artist from Bali, Indonesia (Denpasar). Verified Instagram: @kokatattoo_.
He has tattooed since 2023 and has already won awards at the conventions he attends.
- 1st place, Best Color, at the Amplitude Skatepark 10th anniversary tattoo competition (featured by Magic Ink).
- Artist of the Month at Bali Butter.
- Guest artist at Denpasar Tattoo Fest 2026 (DYouth Fest), 24–25 July 2026.
He co-founded Blustereast Tattoo Studio in Bali with a friend.

Styles: his favourite is black and grey realism; he also does bold Japanese colour work. He specialises in large-scale pieces: full backs, full sleeves (full arm) and full legs, for example tiger, lion, dragon and samurai backpieces, hannya, phoenix and koi sleeves and legs. One full Japanese back was done in 3 days back to back.
Every piece is designed for the client's body; clients send the idea, placement, size and reference photos.

JAKARTA TATTOO TOUR: ${tourStatus()}
- Dates: 3–13 November 2026. Location: Green Lake City, America Cluster (Jakarta). Only 10 sessions.
- Price: Rp 8.999K (Rp 8,999,000) per session.
- The first 2 people to book get Rp 1,500,000 off per session (ask Koka in DM whether this is still available).
- Booking and questions: Instagram DM @kokatattoo_.
Outside the tour he tattoos in Bali (Denpasar); prices there are quoted per piece in DM.
Not known (never guess; say Koka will confirm in DM): deposit, how many sessions a piece needs, session length, exact Bali address, aftercare details, availability of specific dates.`.trim();
  },
  agentRules: `- Goal: help the visitor book. Find out (one question at a time) the idea, placement and rough size, and whether they want a Jakarta tour session or Bali. Then call whatsapp_button with purpose book and put a short summary of their idea in "about" (the button opens Koka's Instagram DM and copies the message).
- Remind people the tour has only 10 sessions when relevant, but never say how many are left.
- Never invent prices beyond the tour price; for anything else say Koka quotes in DM.`,
  dailyCap: 300,

  offline(text, lang, h) {
    const t = text.toLowerCase();
    const id = lang === 'id';
    if (/(price|cost|how much|harga|biaya|berapa|rp|budget)/.test(t)) {
      return {
        text: id
          ? 'Saat tour Jakarta (3–13 November 2026) harganya Rp 8.999K per sesi. 2 orang pertama yang booking dapat potongan Rp 1,5 juta per sesi. Di Bali, harga dikasih per karya lewat DM.'
          : 'On the Jakarta tour (3–13 November 2026) a session is Rp 8.999K. The first 2 people to book get Rp 1.5 million off per session. In Bali, Koka quotes per piece in DM.',
        actions: [h.handoff('koka', 'book', lang)], replies: quickReplies[lang].filter((_, i) => i !== 1),
      };
    }
    if (/(style|gaya|realism|japanese|jepang|color|warna|black|hitam)/.test(t)) {
      return {
        text: id
          ? 'Favorit Koka adalah black & grey realism, dan dia juga mengerjakan Japanese berwarna. Spesialisasinya karya besar: full back, full sleeve dan full leg.'
          : "Koka's favourite is black & grey realism, and he also does bold Japanese colour. He specialises in big work: full backs, full sleeves and full legs.",
        actions: [], replies: quickReplies[lang].filter((_, i) => i !== 2),
      };
    }
    return {
      text: id
        ? 'Tour Jakarta 3–13 November 2026 di Green Lake City, cuma 10 sesi. Kirim ide, posisi dan ukuran tato kamu ke Koka lewat DM Instagram untuk booking.'
        : 'The Jakarta tour runs 3–13 November 2026 at Green Lake City, with only 10 sessions. Send Koka your idea, placement and size by Instagram DM to book.',
      actions: [h.handoff('koka', 'book', lang)],
      replies: quickReplies[lang].slice(1),
    };
  },
};
