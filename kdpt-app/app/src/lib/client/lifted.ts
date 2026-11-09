// "You lifted about 2 hippos": the total weight of a workout compared with an
// animal, for a bit of fun at the end of a session. Weights are rough adult
// averages, rounded.
export type Animal = { one: string; many: string; kg: number };
export const ANIMALS: Animal[] = [
  { one: 'blue whale', many: 'blue whales', kg: 100000 },
  { one: 'African elephant', many: 'African elephants', kg: 6000 },
  { one: 'hippo', many: 'hippos', kg: 1500 },
  { one: 'giraffe', many: 'giraffes', kg: 800 },
  { one: 'polar bear', many: 'polar bears', kg: 450 },
  { one: 'grizzly bear', many: 'grizzly bears', kg: 270 },
  { one: 'giant panda', many: 'giant pandas', kg: 100 },
  { one: 'kangaroo', many: 'kangaroos', kg: 55 },
  { one: 'golden retriever', many: 'golden retrievers', kg: 30 },
  { one: 'corgi', many: 'corgis', kg: 12 },
  { one: 'cat', many: 'cats', kg: 4.5 },
  { one: 'hedgehog', many: 'hedgehogs', kg: 1 },
];

// The biggest animal there are at least 2 of, so the number feels earned.
// Under 10 it keeps a half (2½ hippos); above that it's a whole number.
export function liftedLike(kg: number): { animal: Animal; count: number; words: string } | null {
  if (!(kg >= 2)) return null;
  const animal = ANIMALS.find(a => kg / a.kg >= 2) ?? ANIMALS[ANIMALS.length - 1];
  const raw = kg / animal.kg;
  const count = raw < 10 ? Math.floor(raw * 2) / 2 : Math.round(raw);
  const whole = Math.floor(count), half = count % 1 ? '½' : '';
  return { animal, count, words: `${whole}${half} ${animal.many}` };
}
