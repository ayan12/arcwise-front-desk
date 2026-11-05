// Front desk configs for the Miami med spa concept sites, one per spa in miami-data.js.
// Concept stage: the agent knows only the facts in the prospect list and hands bookings off by text message.
import { SPAS, SAMPLE_MENU, digits } from './miami-data.js';

const THEMES = {
  biscayne: { accent: '#1F6F6B', ink: '#0E2A2C', paper: '#EEF4F2', onAccent: '#FFFFFF', mode: 'light' },
  deco: { accent: '#7D4A6E', ink: '#2A1D27', paper: '#F7ECE4', onAccent: '#FFFFFF', mode: 'light' },
  night: { accent: '#B9D8CF', ink: '#0F171A', paper: '#E9EFEE', onAccent: '#0F171A', mode: 'dark' },
  sage: { accent: '#55693F', ink: '#20261C', paper: '#F0F1E8', onAccent: '#FFFFFF', mode: 'light' },
};

const TEASER = {
  hours: 'Closed right now? Ask here and we’ll text you back.',
  booking: 'Want an appointment? I can set up your request.',
  volume: 'Questions about a treatment? Ask here.',
  bilingual: 'Questions? Ask in English or Spanish.',
};

function make(s) {
  const qr = ['Book a consultation', 'What treatments do you offer?', 'Where are you?'];
  const menu = (s.menu || SAMPLE_MENU).map(m => m[0]).join(', ');
  const real = !!s.menu;
  return {
    id: `miami-${s.slug}`,
    name: s.name,
    assistant: s.name,
    theme: THEMES[s.palette],
    tagline: { en: `Med spa · ${s.area}, Miami` },
    teaser: { en: TEASER[s.angle] || 'Questions about a treatment? Ask here.' },
    tiles: [
      { icon: 'queue', title: { en: 'Book a consultation' }, sub: { en: 'Pick a treatment and a time' }, send: { en: 'I want to book a consultation' } },
      { icon: 'spark', title: { en: 'Treatments' }, sub: { en: 'What we do and how it works' }, send: { en: 'What treatments do you offer?' } },
      { icon: 'tag', title: { en: 'Prices' }, sub: { en: 'Quoted at your consultation' }, send: { en: 'How much does it cost?' } },
    ],
    greeting: { en: `Hi! I’m the front desk for ${s.name}. I can tell you about treatments and set up an appointment request. What are you interested in?` },
    quickReplies: { en: qr },
    allowedOrigins: ['https://arcwise-front-desk.vercel.app'],
    contacts: [{ key: 'spa', name: s.name, sms: s.phone ? '1' + digits(s.phone) : null, note: s.phone ? `Text or call ${s.phone}` : 'Contact details to be added' }],
    handoff: {
      book: {
        when: 'the visitor wants to book, asks about availability, or wants a consultation',
        en: `Hi ${s.name}, I’d like to book an appointment.`,
        nameLine: { en: ' My name is {name}.' },
        noName: { en: ' My name is ' },
        aboutLine: { en: ' Treatment: {about}.' },
      },
      question: {
        when: 'any other question for the team',
        en: `Hi ${s.name}, `,
        nameLine: { en: 'this is {name}. ' },
        aboutLine: { en: '{about}' },
      },
    },
    knowledge: `
${s.name} is a med spa ${/\b(St|Ave|Blvd|Hwy)\b/.test(s.area) ? 'on' : 'in'} ${s.area}, Miami, Florida.${s.since ? ` In business since ${s.since}.` : ''}${s.lead ? ` Led by ${s.lead}.` : ''}${s.team ? ` Team: ${s.team}.` : ''}
${s.rating ? `Google rating: ${s.rating} from ${s.reviews} reviews.` : ''}
${s.phone ? `Phone (call or text): ${s.phone}.` : 'Phone: not listed here yet.'}
${s.hours ? `Hours: ${s.hours}` : 'Exact opening hours: not known (the team confirms by text).'}
Treatments ${real ? 'offered' : 'shown on this concept site (examples, the spa confirms its real menu)'}: ${menu}.
Not known (never guess; say the team will confirm by text): prices, specials, which provider does what, availability, exact address, aftercare, financing.
Medical questions (is a treatment safe for me, pregnancy, medication): never advise; say the provider answers that at the consultation.`.trim(),
    agentRules: `- Goal: help the visitor request an appointment. Ask (one question at a time) which treatment and which day suits them, then their first name. Then call whatsapp_button with purpose book and put the treatment and preferred day in "about" (the button opens a text message to the spa).
- Never give prices, results, or medical advice.
- Answer in the visitor's language (English or Spanish).`,
    dailyCap: 60,
    offline(text, lang, h) {
      const t = text.toLowerCase();
      if (/(price|cost|how much|cuanto|precio)/.test(t)) {
        return { text: `Prices depend on the treatment and the amount needed, so ${s.name} quotes them at your consultation. Want me to set up a request?`, actions: [h.handoff('spa', 'book', 'en')], replies: [qr[1], qr[2]] };
      }
      if (/(where|address|location|located|donde)/.test(t)) {
        return { text: `We’re ${/\b(St|Ave|Blvd|Hwy)\b/.test(s.area) ? 'on' : 'in'} ${s.area}, Miami.${s.phone ? ` Call or text ${s.phone} for directions.` : ''}${s.hours ? ` ${s.hours}` : ''}`, actions: [], replies: [qr[0], qr[1]] };
      }
      if (/(treat|offer|service|botox|filler|facial|laser|iv)/.test(t)) {
        return { text: `${real ? 'We offer' : 'Popular treatments here include'} ${menu}. Which one are you thinking about?`, actions: [], replies: [qr[0], qr[2]] };
      }
      return { text: `Tell me the treatment and a day that suits you, and I’ll get your request ready to send to ${s.name} by text.`, actions: [h.handoff('spa', 'book', 'en')], replies: [qr[1], qr[2]] };
    },
  };
}

export const MIAMI = Object.fromEntries(SPAS.map(s => [`miami-${s.slug}`, make(s)]));
