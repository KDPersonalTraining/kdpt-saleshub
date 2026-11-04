import {
  AlarmClock, ArrowLeftRight, ArrowUp, Bell, Calendar, CalendarClock, Camera, ChartNoAxesColumn, Check, ChevronDown, ChevronLeft,
  ChevronRight, ClipboardCheck, ClipboardList, CreditCard, Droplet, Dumbbell, Equal, ExternalLink, Film, Flame, Heart, House, Info,
  Layers, LibraryBig, MapPin, Megaphone, MessageCircle, Moon, PersonStanding, Play, Plus, Reply, Search, Send, Shirt, SkipForward,
  SlidersHorizontal, Sparkles, Utensils, Square, Sun, Trash2, TriangleAlert, Trophy, User, Users, Weight, WifiOff, X, Zap, type LucideIcon,
} from 'lucide-react';

// One icon family everywhere (Lucide line icons, 1.75 stroke; see DESIGN.md).
// Screens refer to icons by these names.
const ICONS: Record<string, LucideIcon> = {
  home: House, today: House, train: Dumbbell, machine: Dumbbell, fuel: Utensils, progress: ChartNoAxesColumn, community: Users, clients: Users,
  user: User, chat: MessageCircle, messages: MessageCircle, play: Play, video: Play, clock: AlarmClock, snooze: AlarmClock, layers: Layers,
  swap: ArrowLeftRight, pain: TriangleAlert, check: Check, back: ChevronLeft, right: ChevronRight, up: ArrowUp, arrowup: ArrowUp,
  down: ChevronDown, equal: Equal, close: X, plus: Plus, camera: Camera, cal: Calendar, schedule: Calendar, calup: CalendarClock,
  clip: ClipboardCheck, checkins: ClipboardCheck, spark: Sparkles, pin: MapPin, info: Info, trophy: Trophy, flame: Flame, bolt: Zap,
  automation: Zap, weight: Weight, send: Send, skip: SkipForward, stop: Square, bell: Bell, body: PersonStanding, card: CreditCard,
  payments: CreditCard, heart: Heart, gear: SlidersHorizontal, megaphone: Megaphone, shirt: Shirt, moon: Moon, sun: Sun, drop: Droplet,
  programmes: ClipboardList, library: LibraryBig, film: Film, reply: Reply, open: ExternalLink, trash: Trash2, wifi: WifiOff, search: Search,
};

export function Icon({ name, className = 'ic', style, size }: { name: string; className?: string; style?: React.CSSProperties; size?: number }) {
  const C = ICONS[name] ?? Info;
  return <C className={className} style={size ? { width: size, height: size, ...style } : style} strokeWidth={1.75} aria-hidden="true" />;
}
