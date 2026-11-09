// One logged set in words: "80 × 12", "12 reps", or "2.4 km · 15 min".
export function setWords(r: { load_kg: number | null; reps: number | null; distance_m?: number | null; duration_s?: number | null }): string {
  if (r.distance_m != null) return `${Math.round(Number(r.distance_m) / 100) / 10} km${r.duration_s ? ` · ${Math.round(r.duration_s / 60)} min` : ''}`;
  return r.load_kg != null && Number(r.load_kg) > 0 ? `${Number(r.load_kg)} × ${r.reps ?? 0}` : `${r.reps ?? 0} reps`;
}
