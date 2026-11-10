// The picture for a comparison: a row of them for small numbers (with a half
// where there is one), or one big one with "×17" for large numbers.
export function FunPictures({ e, count }: { e: string; count: number }) {
  if (count > 8) return <span className="fun-pics" aria-hidden="true"><span className="big">{e}</span><b className="num">×{Math.round(count)}</b></span>;
  const whole = Math.max(1, Math.floor(count)), half = count % 1 >= 0.5;
  return (
    <span className="fun-pics" aria-hidden="true">
      {Array.from({ length: whole }, (_, i) => <span key={i} style={{ animationDelay: `${i * 70}ms` }}>{e}</span>)}
      {half && <span className="half" style={{ animationDelay: `${whole * 70}ms` }}>{e}</span>}
    </span>
  );
}
