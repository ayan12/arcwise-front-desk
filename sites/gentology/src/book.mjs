// The Barber's Book: Gentology's style catalogue (names from their own "Barbersbook"), rewritten as one source
// for the website section and the printable PDF. Drawings are simple diagrams, not photos of people.

export const FAVOURITES = [
  { key: 'scumbag-boogie', name: 'Scumbag Boogie', also: 'Pompadour with a side part',
    text: 'Hair swept up off the face and worn high over the forehead, with a clean side part.', pairs: ['Low fade', 'Drop fade', 'Taper'] },
  { key: 'quiff', name: 'Quiff', also: 'The messier pompadour',
    text: 'Pompadour volume, but longer at the front, textured and hand-swept, receding to shorter hair at the back.', pairs: ['Mid fade'] },
  { key: 'crew-cut', name: 'Crew Cut', also: 'Short and graduated',
    text: 'Short on top, graduating from a small pomp at the hairline to shortest at the crown.', pairs: ['Mid fade', 'High fade'] },
  { key: 'faux-hawk', name: 'Faux Hawk', also: 'The fohawk',
    text: 'A longer strip through the centre, pushed up and slightly forward. Comb it over on office days.', pairs: ['Drop fade'] },
  { key: 'executive-contour', name: 'Executive Contour', also: 'The boardroom cut',
    text: 'A swept side part with no pomp, tapered down to mid-length on the sides and back.', pairs: ['Taper fade', 'Taper'] },
];

export const LENGTHS = [
  { key: 'shorter', name: 'Shorter', styles: [
    ['Jarhead', 'Clipper-short on top, sides taken right down.'],
    ['Buzz Cut', 'One clipper length all over.'],
    ['Flat Top', 'The top cut flat and square, like a deck.'],
  ] },
  { key: 'short', name: 'Short', styles: [
    ['French Crop', 'Short, textured top with a blunt fringe.'],
    ['Caesar Cut', 'Even length brushed forward to a straight fringe.'],
    ['Crew Cut', 'Short top graduating from front to crown.'],
    ['Spike', 'Short top styled up into points.'],
    ['Faux Hawk', 'A longer centre strip pushed up and forward.'],
    ['Flat Top Boogie', 'A flat top with extra length and shape.'],
    ['Scumbag Boogie', 'A pompadour with a hard side part.'],
  ] },
  { key: 'medium', name: 'Medium', styles: [
    ['Classic Haircut', 'Scissor-cut, neat all round, parted or not.'],
    ['Side Part', 'Combed to one side from a clean parting.'],
    ['Center Part', 'Parted down the middle, falling to both sides.'],
    ['Comb Over', 'Combed across from a low side parting.'],
    ['Pompadour', 'Swept up and back with height at the front.'],
    ['Slick Back', 'Combed straight back with a wet or matte finish.'],
    ['Jelly Roll', 'A tall rolled front in the rockabilly style.'],
    ['Psychobilly', 'A dramatic wedge of length over shaved sides.'],
    ['Executive Contour', 'A side part with no pomp, tapered sides.'],
  ] },
  { key: 'long', name: 'Long', styles: [
    ['The Flop', 'Long on top, falling loosely to one side.'],
    ['Layered Undercut', 'Layered length on top over short sides.'],
    ['Quiff', 'Volume at the front, textured and hand-swept.'],
    ['Two Block', 'A longer top over short sides, with no fade between.'],
    ['Fringe', 'Length brought forward over the forehead.'],
    ['Emo', 'A long fringe swept across one eye.'],
    ['Shaggy', 'Loose, choppy layers all over.'],
    ['Layered', 'Even layers for movement without bulk.'],
  ] },
  { key: 'longer', name: 'Longer', styles: [
    ['Swipe Side', 'Long length swept to one side.'],
    ['Mullet', 'Short at the front and sides, long at the back.'],
    ['Man Bun', 'Long hair tied up at the back of the head.'],
    ['Top Knot', 'Long top tied high, often over short sides.'],
  ] },
];

// Sides and back. y = where the fade line sits on the drawing (lower number = higher on the head).
export const SIDES = [
  { key: 'low', name: 'Low fade', y: 84, text: 'Starts just above the ear. Subtle, office-friendly.' },
  { key: 'mid', name: 'Mid fade', y: 70, text: 'Starts around the temple. The everyday favourite.' },
  { key: 'high', name: 'High fade', y: 54, text: 'Starts high on the head for a sharp contrast.' },
  { key: 'drop', name: 'Drop fade', y: 70, drop: true, text: 'Curves down behind the ear towards the nape.' },
  { key: 'temple', name: 'Temple taper', y: 78, temple: true, text: 'Faded only at the temples and around the ear.' },
  { key: 'taper', name: 'Taper', y: 96, text: 'Length kept, only the edges faded at the bottom.' },
];

export const NECKLINES = [
  { key: 'blocked', name: 'Blocked', text: 'A straight, squared-off line.' },
  { key: 'rounded', name: 'Rounded', text: 'Square, with the corners softened.' },
  { key: 'tapered', name: 'Tapered', text: 'Fades out naturally into the skin.' },
  { key: 'tapered-nape', name: 'Tapered nape', text: 'A clean line with the nape faded below.' },
  { key: 'v', name: 'V-shaped', text: 'Cut to a point at the centre of the nape.' },
];

export const DETAILS = [
  ['Hard Part', 'A parting shaved in with the razor for a sharp line.'],
  ['Hair Tattoo', 'A design cut into the fade. Gentology’s hair tattoo starts from IDR 60k.'],
  ['Pompadour', 'Height swept back in a full rounded curve.'],
  ['Wedge Pom', 'Height pushed straight up, flat at the front.'],
  ['Pullback Pom', 'Height angled back from the forehead.'],
];

export const BEARDS = ['Stubble', 'Goatee', 'Chinstrap', 'Horseshoe', 'Handlebar', 'Walrus', 'Chevron', 'Cowboy', 'Pencil', 'Scruffy'];

/* ---------- drawings ---------- */
// side profile, facing left: crown, forehead, nose, lips, chin, neck
const HEAD = 'M66 12C88 12 100 32 100 56V78C100 90 94 98 86 102V126H52V110C46 110 40 108 37 104C35 99 35 95 32 93L30 88C28 86 29 84 31 82L26 74L30 71C30 62 28 54 29 46C31 24 46 12 66 12Z';
// the face stays skin whatever the fade: everything in front of the hairline
const FACE = 'M0 40H36C34 46 33 52 33 58C33 64 36 70 38 74C40 84 44 96 52 110V130H0Z';
// Side profile (face to the left) with the hair above the fade line and skin below it.
export function fadeSvg(s, id) {
  const top = s.y, band = s.key === 'taper' ? 8 : 16;
  const g = `g-${id}`, c = `c-${id}`;
  const shape = s.drop
    ? `<path d="M10 ${top}C40 ${top} 60 ${top} 70 ${top}C82 ${top} 88 ${top + 14} 100 ${top + 30}V130H10Z"/>`
    : s.temple ? `<path d="M10 ${top - 10}C30 ${top - 10} 60 ${top} 76 ${top + 4}V${top + 34}H100V130H10Z"/>`
    : `<rect x="10" y="${top}" width="90" height="${130 - top}"/>`;
  return `<svg viewBox="0 0 120 130" class="fd" aria-hidden="true"><defs>
    <clipPath id="${c}"><path d="${HEAD}"/></clipPath>
    <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--fd-hair)"/><stop offset="${band / (130 - top)}" stop-color="var(--fd-skin)"/></linearGradient></defs>
    <g clip-path="url(#${c})"><rect width="120" height="130" fill="var(--fd-hair)"/><g fill="url(#${g})">${shape}</g><path d="${FACE}" fill="var(--fd-skin)"/></g>
    <path d="${HEAD}" class="fd-line"/><ellipse cx="68" cy="74" rx="6" ry="10" class="fd-ear"/></svg>`;
}
// Back of the head and neck, showing where the hair stops.
export function neckSvg(n) {
  const base = 92;
  const edge = {
    blocked: `M22 ${base}H98`,
    rounded: `M22 ${base - 8}Q22 ${base} 32 ${base}H88Q98 ${base} 98 ${base - 8}`,
    tapered: `M22 ${base}H98`,
    'tapered-nape': `M22 ${base}H98`,
    v: `M22 ${base - 4}L60 ${base + 14}L98 ${base - 4}`,
  }[n.key];
  const hairPath = {
    blocked: `M18 60C18 26 40 12 60 12C80 12 102 26 102 60V${base}H18Z`,
    rounded: `M18 60C18 26 40 12 60 12C80 12 102 26 102 60V${base - 8}Q102 ${base} 90 ${base}H30Q18 ${base} 18 ${base - 8}Z`,
    tapered: `M18 60C18 26 40 12 60 12C80 12 102 26 102 60V${base}H18Z`,
    'tapered-nape': `M18 60C18 26 40 12 60 12C80 12 102 26 102 60V${base}H18Z`,
    v: `M18 60C18 26 40 12 60 12C80 12 102 26 102 60V${base - 4}L60 ${base + 14}L18 ${base - 4}Z`,
  }[n.key];
  const fadeTo = n.key === 'tapered' ? `<rect x="18" y="${base - 18}" width="84" height="22" fill="url(#nk-fade)"/>`
    : n.key === 'tapered-nape' ? `<rect x="40" y="${base}" width="40" height="16" fill="url(#nk-fade2)"/>` : '';
  return `<svg viewBox="0 0 120 130" class="nk" aria-hidden="true">
    <path d="M30 80V126H90V80" class="nk-neck"/><path d="M18 60C18 26 40 12 60 12C80 12 102 26 102 60V80" class="nk-skin"/>
    <path d="${hairPath}" class="nk-hair"/>${fadeTo}
    <path d="${edge}" class="fd-line"/><path d="M18 60C18 26 40 12 60 12C80 12 102 26 102 60" class="fd-line"/>
    <ellipse cx="15" cy="64" rx="5" ry="10" class="fd-ear"/><ellipse cx="105" cy="64" rx="5" ry="10" class="fd-ear"/></svg>`;
}
// shared gradients for the neckline drawings (put once in the page)
export const NECK_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="nk-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--fd-hair)" stop-opacity="0"/><stop offset="1" stop-color="var(--fd-skin)"/></linearGradient>
  <linearGradient id="nk-fade2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--fd-hair)"/><stop offset="1" stop-color="var(--fd-hair)" stop-opacity="0"/></linearGradient></defs></svg>`;
