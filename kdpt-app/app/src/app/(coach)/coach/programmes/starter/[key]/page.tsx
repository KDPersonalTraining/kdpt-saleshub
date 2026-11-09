import { notFound } from 'next/navigation';
import { isDemo } from '@/lib/demo';
import { clientOptions } from '@/lib/coach/live';
import { DEMO_CLIENT_OPTIONS } from '@/lib/coach/sample-data';
import { starterByKey } from '@/lib/programmes/starters';
import { StarterDetail } from './starter-detail';

export default async function StarterPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!starterByKey(key)) notFound();
  const demo = isDemo();
  return <StarterDetail k={key} clients={demo ? DEMO_CLIENT_OPTIONS : await clientOptions()} demo={demo} />;
}
