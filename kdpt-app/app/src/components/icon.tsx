import { ICONS } from './icon-paths';

// <Icon name="train" /> renders one of the shared icons. Colour comes from
// `currentColor`, so set `color` on the icon or its parent.
export function Icon({ name, className = 'ic', style, size }: { name: string; className?: string; style?: React.CSSProperties; size?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={size ? { width: size, height: size, ...style } : style}
      dangerouslySetInnerHTML={{ __html: ICONS[name] ?? '' }} />
  );
}
