// The client projects shown on the dashboard. Add a project = add one entry.
// frontDesk: the Front Desk client id whose chats belong to this project (or null).
// indexable: false for concept links we hide from Google on purpose.

export const PROJECTS = [
  {
    id: 'arcwise', name: 'Arcwise Studios', kind: 'Our own site', stage: 'Live',
    url: 'https://arcwise-studios.vercel.app/', frontDesk: 'arcwise', indexable: true,
  },
  {
    id: 'moosh', name: 'Moosh Hair Studio', kind: 'Salon · Banjarbaru', stage: 'Won',
    url: 'https://moosh-concept.vercel.app/', frontDesk: null, indexable: false,
  },
  {
    id: 'gentology', name: 'Gentology Barbershop', kind: 'Barbershop · Jakarta', stage: 'Meeting set',
    url: 'https://gentology-concept.vercel.app/', frontDesk: 'gentology', indexable: false,
  },
  {
    id: 'brap', name: 'BRAP Helmet', kind: 'Helmet brand', stage: 'Concept',
    url: 'https://brap-site.vercel.app/', frontDesk: null, indexable: false,
  },
];
