// Miami med spa prospects (from miami_medspa_prospects.csv, directory data checked 2026-11-04).
// Only facts from that list. Anything else on the concept pages is marked as an example.
// palette: biscayne | deco | night | sage

export const SPAS = [
  { slug: 'babyface', name: 'Babyface Med Spa', area: 'Brickell', since: 2011, palette: 'deco', angle: 'site' },
  { slug: 'viva-miami', name: 'Viva Miami Medspa', area: 'Miami and Coral Gables', palette: 'biscayne', angle: 'site', tiktok: 'vivamiamimedspa' },
  { slug: 'yanet', name: 'Yanet Med Spa', area: 'W Flagler St', phone: '(786) 486-6376', rating: '5.0', reviews: 254, lead: 'Yanet Torres, NP', palette: 'sage', angle: 'booking' },
  { slug: 'miami-wellness', name: 'Miami Wellness Medspa', area: 'SW 107th Ave', phone: '(786) 624-7723', palette: 'biscayne', angle: 'booking',
    menu: [
      ['IV therapy', 'Hydration and vitamin drips, sitting comfortably in the lounge.'],
      ['Hyperbaric oxygen', 'Sessions in a pressurised chamber, booked in blocks.'],
      ['Dermal fillers', 'Lips, cheeks and jawline, planned at a consultation.'],
      ['Wrinkle relaxers', 'Forehead, frown lines and crow’s feet.'],
    ] },
  { slug: 'aesthetics-med-spa', name: 'Aesthetics Med Spa', area: 'SW 120th St', phone: '(305) 490-7879', rating: '5.0', reviews: 203, team: '3 providers', palette: 'night', angle: 'hours',
    hours: 'Monday to Friday, with a half day on Saturday. Closed Sunday.' },
  { slug: 'amedor', name: 'Amed’or Medspa', area: 'South Miami', phone: '(954) 371-9023', rating: '5.0', reviews: 153, palette: 'deco', angle: 'site' },
  { slug: 'gables-med-spa', name: 'Gables Med Spa', area: 'SW 8th St', phone: '(786) 815-1521', rating: '5.0', reviews: 10, lead: 'Dr. Justin Jeter, MD', palette: 'night', angle: 'trust' },
  { slug: 'danico', name: 'Danico Med Spa', area: 'Ponce de Leon Blvd', phone: '(305) 989-6133', palette: 'sage', angle: 'hours',
    hours: 'Monday to Friday, 10am to 4pm.' },
  { slug: 'miami-aesthetic-specialists', name: 'Miami Aesthetic Specialists', area: 'SW 84th St', phone: '(305) 590-5300', palette: 'biscayne', angle: 'hours',
    hours: 'Closed Tuesday, Thursday and Sunday.' },
  { slug: 'miami-elegance', name: 'Miami Elegance Medspa', area: 'NW 112th Ave', phone: '(305) 992-7667', team: '2 to 3 providers', palette: 'deco', angle: 'refresh' },
  { slug: 'ae-med-spa', name: 'A&E Med Spa', area: 'SW 8th St', phone: '(786) 254-7100', rating: '4.9', reviews: 315, lead: 'Dr. Orlando Llorente, MD', palette: 'night', angle: 'bilingual' },
  { slug: 'dermal-era', name: 'Dermal Era Holistic Med Spa', area: 'Coral Gables', phone: '(786) 403-6103', rating: '5.0', reviews: 347, palette: 'sage', angle: 'site' },
  { slug: 'asha', name: 'Asha Esthetic & Medspa', area: 'Brickell', phone: '(305) 505-7853', rating: '5.0', reviews: 289, palette: 'night', angle: 'refresh' },
  { slug: '4beauty', name: '4Beauty Medspa', area: 'S Dixie Hwy', phone: '(786) 496-9444', team: '6 providers', palette: 'biscayne', angle: 'volume' },
  { slug: 'lavish-laser', name: 'Lavish Laser Med Spa', area: 'Midtown', phone: '(305) 850-7691', palette: 'night', angle: 'site' },
  { slug: 'facial-mania', name: 'Facial Mania Med Spa', area: 'Coral Gables', phone: '(305) 376-7261', palette: 'deco', angle: 'site' },
  { slug: 'hermes', name: 'Hermes Med Spa', area: 'Miami', phone: '(305) 440-4011', palette: 'sage', angle: 'site' },
  { slug: 'varua', name: 'Varua Med Spa', area: 'SW 27th Ave', phone: '(786) 208-4059', palette: 'biscayne', angle: 'site' },
  { slug: 'lab-skin', name: 'Lab Skin Med Spa', area: 'North Miami Beach', phone: '(786) 401-3831', palette: 'sage', angle: 'site' },
  { slug: 'omg-med-glam', name: 'OMG! Only Med Glam', area: 'Coral Gables', phone: '(786) 355-7770', rating: '5.0', reviews: 11, palette: 'deco', angle: 'site' },
];

// The example menu used when we don't know a spa's real treatments.
export const SAMPLE_MENU = [
  ['Wrinkle relaxers', 'Forehead, frown lines and crow’s feet, in about 20 minutes.'],
  ['Dermal fillers', 'Lips, cheeks and jawline, planned at a consultation first.'],
  ['Facials and peels', 'From a monthly glow facial to a medical-grade peel.'],
  ['Laser and skin', 'Hair removal, sun spots and texture, as a course of sessions.'],
];

export const digits = p => String(p || '').replace(/\D/g, '');
