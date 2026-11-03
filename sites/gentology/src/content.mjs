// Single source of facts for every page.
// Everything here was checked against gentology-barbershop.com (home, /services-and-products,
// /how-to-book) on 2026-10-22. Do not add anything that is not published there.

export const SOURCE = 'https://www.gentology-barbershop.com';

export const SOCIAL = {
  facebook: 'https://www.facebook.com/gentology.barbershop/',
  instagram: 'https://www.instagram.com/gentology.barbershop/',
};
export const EMAIL = 'gentology.barbershop@gmail.com';

// Published hours (one set, listed for the shop as a whole). Day numbers: 0 = Sunday.
export const HOURS = [
  { d: 1, day: 'Monday', schema: 'Monday', open: '11:00', close: '22:00' },
  { d: 2, day: 'Tuesday', schema: 'Tuesday', open: '11:00', close: '22:00' },
  { d: 3, day: 'Wednesday', schema: 'Wednesday', open: '11:00', close: '22:00' },
  { d: 4, day: 'Thursday', schema: 'Thursday', open: '11:00', close: '22:00' },
  { d: 5, day: 'Friday', schema: 'Friday', open: '14:00', close: '22:00' },
  { d: 6, day: 'Saturday', schema: 'Saturday', open: '09:00', close: '20:00' },
  { d: 0, day: 'Sunday', schema: 'Sunday', open: '11:00', close: '22:00' },
];

export const BRANCHES = [
  {
    slug: 'cideng',
    name: 'Cideng',
    full: 'Gentology Barbershop Cideng',
    street: 'Jl. Cideng Timur Raya No. 90',
    area: 'Petojo Selatan, Gambir',
    postal: '10160',
    region: 'Jakarta',
    tel: '0817 7000 3750',
    e164: '+6281770003750',
    maps: 'https://www.google.com/maps/search/?api=1&query=Gentology+Barbershop+Jl.+Cideng+Timur+Raya+No.+90',
    lede: 'The Cideng parlour sits on Jl. Cideng Timur Raya in Petojo Selatan, Gambir. Ring the branch, take your number on the waiting list and arrive close to your time.',
    near: 'Gambir, Petojo and the streets around Cideng',
    img: 'b',
  },
  {
    slug: 'tanjung-duren',
    name: 'Tanjung Duren',
    full: 'Gentology Barbershop Tanjung Duren',
    street: 'Jl. Tanjung Duren Raya Lama No. 823',
    area: 'Grogol Petamburan, Jakarta Barat',
    postal: '11470',
    region: 'Jakarta Barat',
    tel: '0878 8693 4674',
    e164: '+6287886934674',
    maps: 'https://www.google.com/maps/search/?api=1&query=Gentology+Barbershop+Jl.+Tanjung+Duren+Raya+Lama+No.+823',
    lede: 'The West Jakarta parlour is on Jl. Tanjung Duren Raya Lama in Grogol Petamburan. Ring the branch for your place on the waiting list and the time to come in.',
    near: 'Tanjung Duren, Grogol Petamburan and the rest of West Jakarta',
    img: 'a',
  },
  {
    slug: 'cipete',
    name: 'Silverhawk Cipete',
    full: 'Gentology Barbershop Silverhawk Cipete',
    street: 'Jl. Puri Mutiara No. 10A',
    area: 'Cipete, Jakarta Selatan',
    postal: '12410',
    region: 'Jakarta Selatan',
    tel: '0877 7813 6435',
    e164: '+6287778136435',
    maps: 'https://www.google.com/maps/search/?api=1&query=Gentology+Barbershop+Silverhawk+Jl.+Puri+Mutiara+No.+10A+Cipete',
    lede: 'The South Jakarta parlour, Silverhawk, is on Jl. Puri Mutiara in Cipete. Ring the branch to join its waiting list and hear your estimated time.',
    near: 'Cipete and the neighbourhoods of South Jakarta',
    img: 'c',
  },
];

// Services exactly as published. The official services page lists "IDR 90k" and "IDR 80k"
// after the list without placing them beside a named haircut; `confirm` marks those.
export const HAIRCUTS = [
  { name: 'Fade avant-garde signature haircut', price: 'IDR 90k', confirm: true, note: 'Low, mid or high fade, crafted on request.' },
  { name: 'Avant-garde signature haircut', price: 'IDR 80k', confirm: true, note: 'Starts with a head-reading, then detailed hair-crafting.' },
];
export const HAIRCUT_INCLUDES = ['hair vitamin', 'hot towel', 'massage', 'pomade styling'];
export const OTHER_SERVICES = [
  { name: 'Traditional shaving', price: 'IDR 30–60k' },
  { name: 'Hair tattoo', price: 'from IDR 60k' },
  { name: 'Hair polish', price: 'IDR 80k' },
];

export const BRAND = {
  name: 'Gentology Barbershop',
  founders: ['Ricky Andi Wardana', 'Bob Christoper'],
};
