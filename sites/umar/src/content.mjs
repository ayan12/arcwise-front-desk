// Umar Sardar concept: all copy and data in one place.
export const site = {
  name: 'Umar Sardar',
  url: 'https://umar-sardar-concept.vercel.app',
  role: 'Property investment advisor in Dubai and Abu Dhabi',
  brn: '77293',
  instagram: 'umarsardar_',
  youtube: 'https://youtu.be/IcGT-al8NK8',
  youtubeId: 'IcGT-al8NK8',
  // WhatsApp number goes here once confirmed (digits only, with country code). Empty = Instagram DM.
  wa: '',
};

export const proof = [
  ['Aldar Elite Awards Q3 2026', 'International Market Champion'],
  ['Top Sales Partner', 'Majid Al Futtaim'],
  ['4 awards in one day', 'from the UAE’s biggest developer'],
  ['29.6K investors', 'follow his market breakdowns'],
];

export const ledger = [
  ['Q3 2026', 'International Market Champion, Aldar Elite Awards'],
  ['4', 'Awards in one day from the UAE’s biggest developer'],
  ['Top', 'Sales Partner for Majid Al Futtaim'],
  ['29.6K', 'Investors follow his market breakdowns'],
];

export const goals = [
  ['visa', 'Golden Visa', 'A 10-year residency through property'],
  ['yield', 'Rental income', 'Steady rent, high tenant demand'],
  ['growth', 'Capital growth', 'Buy early, sell or hold at handover'],
  ['home', 'A home to live in', 'Space, schools and community'],
];

// Budget tiers in AED. Areas list which tiers they typically suit. Indicative only.
export const tiers = [
  ['entry', 'Under AED 1.5M', 0, 1.5e6],
  ['mid', 'AED 1.5M – 3M', 1.5e6, 3e6],
  ['prime', 'AED 3M – 6M', 3e6, 6e6],
  ['ultra', 'AED 6M+', 6e6, Infinity],
];

export const areas = [
  { id: 'jvc', short: 'JVC', name: 'Jumeirah Village Circle', em: 'Dubai', tiers: ['entry', 'mid'], goals: ['yield'], type: 'Apartments, ready and off-plan', why: 'One of Dubai’s deepest rental markets, with entry prices that keep yields healthy.' },
  { id: 'creek', short: 'Creek Harbour', name: 'Dubai Creek Harbour', em: 'Dubai', tiers: ['mid', 'prime'], goals: ['growth', 'visa', 'home'], type: 'Waterfront apartments, off-plan', why: 'A master-planned waterfront still being delivered, so early buyers capture the growth.' },
  { id: 'hills', name: 'Dubai Hills Estate', em: 'Dubai', tiers: ['mid', 'prime', 'ultra'], goals: ['home', 'growth', 'visa'], type: 'Apartments, townhouses & villas', why: 'Parks, schools and a mall on site. A proven community families actually want to live in.' },
  { id: 'beach', name: 'Emaar Beachfront', em: 'Dubai', tiers: ['prime', 'ultra'], goals: ['visa', 'yield', 'growth'], type: 'Beachfront apartments', why: 'Private beach living between Palm Jumeirah and Dubai Marina, strong short-let demand.' },
  { id: 'difc', name: 'DIFC & Downtown', em: 'Dubai', tiers: ['prime', 'ultra'], goals: ['visa', 'growth'], type: 'Branded & ultra-luxury residences', why: 'Three tiers, from branded residences to entry luxury. Picking the right tier is the whole game.' },
  { id: 'palm', name: 'Palm Jumeirah', em: 'Dubai', tiers: ['ultra'], goals: ['visa', 'growth', 'home'], type: 'Signature villas & penthouses', why: 'Limited supply of trophy assets that hold value through every cycle.' },
  { id: 'east', short: 'Silicon Oasis', name: 'New launches near Silicon Oasis', em: 'Dubai', tiers: ['entry', 'mid'], goals: ['growth', 'yield'], type: 'Master community, off-plan', why: 'A brand-new master community. Award partners get priority passes before public launch.' },
  { id: 'yas', name: 'Yas Island', em: 'Abu Dhabi', tiers: ['entry', 'mid', 'prime'], goals: ['yield', 'home', 'growth'], type: 'Apartments, townhouses & villas', why: 'Abu Dhabi’s entertainment island, popular with tenants and first-time investors.' },
  { id: 'reem', name: 'Al Reem Island', em: 'Abu Dhabi', tiers: ['entry', 'mid'], goals: ['yield', 'home'], type: 'City apartments, ready and off-plan', why: 'Minutes from the business district, with a large professional tenant base.' },
  { id: 'saadiyat', name: 'Saadiyat Island', em: 'Abu Dhabi', tiers: ['prime', 'ultra'], goals: ['home', 'visa', 'growth'], type: 'Beach & cultural district residences', why: 'Museums, beaches and low density. Abu Dhabi’s most sought-after address.' },
  { id: 'ramhan', name: 'Ramhan Island', em: 'Abu Dhabi', tiers: ['ultra'], goals: ['growth', 'home'], type: 'Island villas, off-plan', why: 'A new island community with limited plots, priced for buyers who think long term.' },
];

// Order of stations on the map, west (Abu Dhabi) to east (Dubai). Not to scale.
export const route = { ad: ['reem', 'saadiyat', 'ramhan', 'yas'], dxb: ['beach', 'palm', 'jvc', 'hills', 'difc', 'creek', 'east'] };

export const plans = [
  ['60/40', 'Pay 60% during construction, 40% on handover', [10, 50, 40, 0]],
  ['70/30', 'Pay 70% during construction, 30% on handover', [10, 60, 30, 0]],
  ['50/50', 'Pay 50% during construction, 50% on handover', [10, 40, 50, 0]],
  ['Post-handover', '20% down, 40% during construction, 40% over 2 years after handover', [20, 40, 0, 40]],
];

export const after = [
  ['Shortlist & due diligence', 'Developer track record, escrow, real comparables and what is still unconfirmed.'],
  ['Booking & paperwork', 'Reservation, SPA and registration, signed in person or remotely.'],
  ['Construction updates', 'Progress and payment reminders until the keys are ready.'],
  ['Handover & snagging', 'Inspection, defects list and handover on your behalf if you are abroad.'],
  ['Golden Visa', 'Eligibility checked before you buy, then the application handled with you.'],
  ['Lease or resell', 'Tenants, short-let set-up or an exit when the numbers are right.'],
];

export const insights = [
  ['Island E', 'Bay Estate vs Bay Villas: not the same project', 'The mix-up that can cost buyers, with real numbers and comparables.'],
  ['DIFC', 'Where to actually buy in DIFC', 'Ultra luxury, branded and entry luxury: three tiers, three strategies.'],
  ['Golden Visa', '“You don’t qualify.” A month too late', 'Why eligibility must be checked before booking, not after.'],
];

export const faqs = [
  ['Can foreigners buy property in Dubai and Abu Dhabi?', 'Yes. Foreign buyers can own freehold property in designated areas of both emirates, including all the communities on this page.'],
  ['How does the Golden Visa through property work?', 'A property investment of AED 2 million or more can qualify you for a 10-year residency visa. Conditions apply depending on the property and how it is paid, so eligibility is confirmed before you commit.'],
  ['Is off-plan safe?', 'In Dubai, payments for off-plan projects go into regulated escrow accounts tied to construction. The real risk is choosing the wrong developer or project, which is what due diligence is for.'],
  ['Can I buy without flying to the UAE?', 'Yes. Viewings can be done by video, and contracts can be signed digitally or through a power of attorney.'],
  ['What fees should I budget for?', 'In Dubai, the Land Department fee is 4% of the price, plus admin fees. In Abu Dhabi, registration is around 2%. Buying off-plan directly from the developer usually means no agency fee for you.'],
];
