import { isDemo } from '@/lib/demo';
import { clientOptions, myProgrammes } from '@/lib/coach/live';
import { DEMO_CLIENT_OPTIONS } from '@/lib/coach/sample-data';
import { StartersView } from './starters-view';

export default async function ProgrammesPage() {
  if (isDemo()) return <StartersView clients={DEMO_CLIENT_OPTIONS} demo />;
  const [clients, mine] = await Promise.all([clientOptions(), myProgrammes()]);
  return <StartersView clients={clients} mine={mine} demo={false} />;
}
