import { isDemo } from '@/lib/demo';
import { clientOptions } from '@/lib/coach/live';
import { DEMO_CLIENT_OPTIONS } from '@/lib/coach/sample-data';
import { StartersView } from './starters-view';

export default async function ProgrammesPage() {
  if (isDemo()) return <StartersView clients={DEMO_CLIENT_OPTIONS} demo />;
  return <StartersView clients={await clientOptions()} demo={false} />;
}
