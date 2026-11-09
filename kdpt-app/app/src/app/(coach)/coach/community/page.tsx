import { isDemo } from '@/lib/demo';
import { requireArea } from '@/lib/auth/session';
import { DemoCommunity } from './demo-community';
import { LiveCommunity } from './live-community';

export default async function CommunityPage() {
  if (isDemo()) return <DemoCommunity />;
  const me = await requireArea('coach');
  return <LiveCommunity me={me.id} />;
}
