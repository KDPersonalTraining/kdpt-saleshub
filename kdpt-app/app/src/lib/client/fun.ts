// The fun bit at the end of a workout: what the client lifted, or how far they
// went, compared with something random ("That's about 3 hippos", "2½ times the
// height of the Eiffel Tower"). Figures are rough, rounded averages.
//
// The pick is random but fixed for each workout (it's seeded by the session),
// so the summary, History and Kyle's view all say the same thing.

export type Thing = { one: string; many: string; kg: number };
export const WEIGHTS: Thing[] = [
  { one: 'pineapple', many: 'pineapples', kg: 1 }, { one: 'hedgehog', many: 'hedgehogs', kg: 1 },
  { one: 'bag of sugar', many: 'bags of sugar', kg: 1 }, { one: 'chihuahua', many: 'chihuahuas', kg: 2.5 },
  { one: 'house cat', many: 'house cats', kg: 4.5 }, { one: 'Christmas turkey', many: 'Christmas turkeys', kg: 7 },
  { one: 'bowling ball', many: 'bowling balls', kg: 7 }, { one: 'watermelon', many: 'watermelons', kg: 9 },
  { one: 'car tyre', many: 'car tyres', kg: 10 }, { one: 'corgi', many: 'corgis', kg: 12 },
  { one: 'Christmas tree', many: 'Christmas trees', kg: 25 }, { one: 'emperor penguin', many: 'emperor penguins', kg: 30 },
  { one: 'golden retriever', many: 'golden retrievers', kg: 30 }, { one: 'kangaroo', many: 'kangaroos', kg: 55 },
  { one: 'washing machine', many: 'washing machines', kg: 70 }, { one: 'sheep', many: 'sheep', kg: 75 },
  { one: 'giant panda', many: 'giant pandas', kg: 100 }, { one: 'baby elephant', many: 'baby elephants', kg: 110 },
  { one: 'reindeer', many: 'reindeer', kg: 150 }, { one: 'lion', many: 'lions', kg: 190 },
  { one: 'grizzly bear', many: 'grizzly bears', kg: 270 }, { one: 'vending machine', many: 'vending machines', kg: 300 },
  { one: 'polar bear', many: 'polar bears', kg: 450 }, { one: 'grand piano', many: 'grand pianos', kg: 480 },
  { one: 'horse', many: 'horses', kg: 500 }, { one: 'dairy cow', many: 'dairy cows', kg: 650 },
  { one: 'giraffe', many: 'giraffes', kg: 800 }, { one: 'Mini Cooper', many: 'Mini Coopers', kg: 1200 },
  { one: 'hippo', many: 'hippos', kg: 1500 }, { one: 'London black cab', many: 'London black cabs', kg: 2000 },
  { one: 'white rhino', many: 'white rhinos', kg: 2300 }, { one: 'great white shark', many: 'great white sharks', kg: 1100 },
  { one: 'African elephant', many: 'African elephants', kg: 6000 }, { one: 'T. rex', many: 'T. rexes', kg: 8000 },
  { one: 'double-decker bus', many: 'double-decker buses', kg: 12000 }, { one: 'humpback whale', many: 'humpback whales', kg: 30000 },
  { one: 'Boeing 737', many: 'Boeing 737s', kg: 41000 }, { one: 'blue whale', many: 'blue whales', kg: 150000 },
  { one: 'Statue of Liberty', many: 'Statues of Liberty', kg: 204000 },
];

// count: "12 football pitches"; height: "3 times the height of Big Ben";
// length: "the length of the Golden Gate Bridge".
export type Place = { name: string; m: number; kind: 'count' | 'height' | 'length'; many?: string };
export const DISTANCES: Place[] = [
  { name: 'double-decker bus', many: 'double-decker buses', m: 11, kind: 'count' },
  { name: 'tennis court', many: 'tennis courts', m: 24, kind: 'count' },
  { name: 'blue whale', many: 'blue whales', m: 30, kind: 'count' },
  { name: 'Olympic pool', many: 'Olympic pools', m: 50, kind: 'count' },
  { name: 'Big Ben', m: 96, kind: 'height' },
  { name: 'football pitch', many: 'football pitches', m: 105, kind: 'count' },
  { name: 'the Statue of Liberty', m: 93, kind: 'height' },
  { name: 'Blackpool Tower', m: 158, kind: 'height' },
  { name: 'Wembley’s arch', m: 133, kind: 'height' },
  { name: 'the Shard', m: 310, kind: 'height' },
  { name: 'the Eiffel Tower', m: 330, kind: 'height' },
  { name: 'the Empire State Building', m: 443, kind: 'height' },
  { name: 'Brighton Palace Pier', m: 525, kind: 'length' },
  { name: 'the Burj Khalifa', m: 828, kind: 'height' },
  { name: 'Snowdon', m: 1085, kind: 'height' },
  { name: 'Ben Nevis', m: 1345, kind: 'height' },
  { name: 'the Humber Bridge', m: 2220, kind: 'length' },
  { name: 'the Golden Gate Bridge', m: 2737, kind: 'length' },
  { name: 'Mount Everest', m: 8849, kind: 'height' },
  { name: 'the English Channel at Dover', m: 33000, kind: 'length' },
  { name: 'a marathon', m: 42195, kind: 'length' },
  { name: 'the Channel Tunnel', m: 50450, kind: 'length' },
  { name: 'Hadrian’s Wall', m: 117000, kind: 'length' },
  { name: 'the M25', m: 188000, kind: 'length' },
  { name: 'the River Thames', m: 346000, kind: 'length' },
];

// A small, stable random number from any text (the session id).
export function seeded(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
// Under 10 keeps a half (2½); from 10 up, whole numbers.
const nice = (raw: number) => (raw < 10 ? Math.floor(raw * 2) / 2 : Math.round(raw));
const say = (n: number) => `${Math.floor(n)}${n % 1 ? '½' : ''}`;

// Something there are between 2 and 20 of (the number feels earned without
// being silly). Very small totals fall back to the smallest thing.
export function liftedLike(kg: number, seed: string): { thing: Thing; count: number; words: string } | null {
  if (!(kg >= 2)) return null;
  const fits = WEIGHTS.filter(t => kg / t.kg >= 2 && kg / t.kg <= 20);
  const thing = fits.length ? fits[Math.floor(seeded(seed) * fits.length)] : [...WEIGHTS].sort((a, b) => b.kg - a.kg).find(t => kg / t.kg >= 2) ?? WEIGHTS[0];
  const count = nice(kg / thing.kg);
  return { thing, count, words: `${say(count)} ${count === 1 ? thing.one : thing.many}` };
}

// How far, compared with a place: anything from 1 to 20 times its size.
export function coveredLike(m: number, seed: string): { place: Place; words: string } | null {
  if (!(m >= 20)) return null;
  const fits = DISTANCES.filter(p => m / p.m >= 1 && m / p.m <= 20);
  const place = fits.length ? fits[Math.floor(seeded(seed + 'd') * fits.length)] : [...DISTANCES].sort((a, b) => b.m - a.m).find(p => m >= p.m) ?? DISTANCES[0];
  const n = nice(m / place.m), whole = n < 1.5;
  const words = place.kind === 'count' ? `${say(Math.max(1, n))} ${n < 1.5 ? place.name : place.many}`
    : place.kind === 'height' ? (whole ? `the height of ${place.name}` : `${say(n)} times the height of ${place.name}`)
    : whole ? `the length of ${place.name}` : `${say(n)} times the length of ${place.name}`;
  return { place, words };
}
