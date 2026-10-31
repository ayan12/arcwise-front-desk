// Arcwise Studios: our own site. Facts taken from arcwise-studios.vercel.app on 2026-10-31.

const quickReplies = {
  en: ['Get a free concept', 'What do you build?', 'How much does it cost?'],
  id: ['Minta konsep gratis', 'Bisa bikin apa saja?', 'Berapa biayanya?'],
};

export default {
  id: 'arcwise',
  name: 'Arcwise Studios',
  assistant: 'Arcwise Studios',
  theme: { accent: '#D4A85A', ink: '#14130F', paper: '#F4EFE6', onAccent: '#14130F' },
  greeting: {
    en: 'Hi! I can tell you what we build, how it works and what it costs, or start your free concept. What does your business do?',
    id: 'Halo! Saya bisa jelaskan apa yang kami buat, cara kerjanya dan biayanya, atau mulai konsep gratis kamu. Usaha kamu di bidang apa?',
  },
  quickReplies,
  allowedOrigins: [
    'https://arcwise-studios.vercel.app',
    'https://arcwise-front-desk.vercel.app',
  ],
  contacts: [
    { key: 'ayan', name: 'Arcwise', e164: '601164169355', note: 'Muhammad Ayan Akram, founder, WhatsApp +60 11-6416 9355' },
  ],
  handoff: {
    concept: {
      when: 'the visitor wants a free concept, a quote, or to start a project',
      en: "Hi Arcwise, I'd like a free concept for my business.",
      id: 'Halo Arcwise, saya mau minta konsep gratis untuk usaha saya.',
      nameLine: { en: ' My name is {name}.', id: ' Nama saya {name}.' },
      noName: { en: ' My name is  and my business is ', id: ' Nama saya  dan usaha saya ' },
      aboutLine: { en: ' About us: {about}.', id: ' Tentang usaha saya: {about}.' },
    },
    question: {
      when: 'any other question for the team',
      en: 'Hi Arcwise, ', id: 'Halo Arcwise, ',
      nameLine: { en: 'this is {name}. ', id: 'saya {name}. ' },
      aboutLine: { en: '{about}', id: '{about}' },
    },
  },
  knowledge: `
Arcwise Studios builds websites, AI automation and marketing for businesses worldwide. Work so far spans Indonesia, Malaysia, Singapore and Pakistan. Founder: Muhammad Ayan Akram.
Promise: we build what brings you customers. Websites that turn visitors into bookings, AI that answers and books on WhatsApp, and marketing that keeps new people coming.

Why Arcwise:
- Concept first: a live working concept for your business before any payment. Free, and you owe nothing if it isn't right.
- One studio: website, AI automation and ads working together.
- Fixed price: a written scope agreed upfront.
- Yours to keep: your domain (registered in your name), your code, your name on it.

Services:
- Websites (booking-focused, mobile-first, any language; we write in English and Bahasa Indonesia). Clients can edit prices, hours, promos and photos from a simple panel on their phone.
- AI automation: AI assistants for WhatsApp, Instagram and websites that answer questions and take bookings (like this chat).
- Marketing: ads and content.
- Launch kit (with every Growth and Signature project): Google Business profile set up, QR poster for the counter, WhatsApp auto-replies, Instagram launch posts, a review booster link/QR, and your own domain and email.

Process:
1. A short chat by message or a 15-minute call; we send three concrete ideas, free.
2. Free concept: a website on a live link, an AI assistant you can chat with, or an ad plan, made from your own photos and words.
3. Deposit and build: you approve the written scope, pay 50%, and we finish with two rounds of revisions.
4. Launch and care: the site goes live on your own domain, and we keep it fast, secure and up to date.

Pricing: every project gets a fixed, written quote after a short chat, usually within one business day. There are website packages and monthly services. Quotes in USD, EUR, GBP, SGD, MYR or IDR. Payment: 50% deposit, 50% before launch, by bank transfer, Wise or card. Never give a price figure; offer the free concept / quote instead.
Timeline: depends on the package and how quickly content arrives; it is written into the quote and kept to.
Different country: no problem, everything happens online with a live link, written updates and calls in the client's time zone.
Contact: WhatsApp +60 11-6416 9355, email hello@arcwisestudios.com. Replies within one business day.`.trim(),
  agentRules: `- Your goal is to understand what the visitor's business needs (type of business, what they want: website, AI, marketing) and then move them to a free concept with whatsapp_button purpose concept. Ask at most one question at a time.
- Never quote a price. Explain that quotes are fixed and written after a short chat, and offer the free concept.`,
  dailyCap: 300,

  offline(text, lang, h) {
    const t = text.toLowerCase();
    const id = lang === 'id';
    if (/(price|cost|how much|harga|biaya|berapa|budget|quote)/.test(t)) {
      return {
        text: id
          ? 'Setiap proyek dapat penawaran tetap dan tertulis setelah ngobrol singkat, biasanya dalam 1 hari kerja. Konsepnya gratis, jadi kamu bisa lihat hasilnya dulu sebelum bayar.'
          : 'Every project gets a fixed, written quote after a short chat, usually within one business day. The concept is free, so you see it working before you pay.',
        actions: [h.handoff('ayan', 'concept', lang)], replies: [],
      };
    }
    if (/(what do you|build|service|layanan|bikin|buat apa|website|ai|marketing|ads|iklan)/.test(t)) {
      return {
        text: id
          ? 'Kami membuat website yang menghasilkan booking, AI assistant untuk WhatsApp dan Instagram yang menjawab dan menerima booking, serta marketing (iklan dan konten). Semua dimulai dengan konsep gratis.'
          : 'We build websites that turn visitors into bookings, AI assistants for WhatsApp and Instagram that answer and book, and marketing (ads and content). Everything starts with a free concept.',
        actions: [], replies: quickReplies[lang].filter((_, i) => i !== 1),
      };
    }
    return {
      text: id
        ? 'Ceritakan sedikit tentang usaha kamu di WhatsApp, dan kami kirim ide pertama dalam 1 hari kerja, gratis.'
        : "Tell us a little about your business on WhatsApp and we'll send first ideas within one business day, free.",
      actions: [h.handoff('ayan', 'concept', lang)],
      replies: quickReplies[lang].slice(1),
    };
  },
};
