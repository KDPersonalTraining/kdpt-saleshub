import { requireArea } from '@/lib/auth/session';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  await requireArea('client');
  return children;
}
