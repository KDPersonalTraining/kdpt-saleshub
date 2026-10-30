import { requireArea } from '@/lib/auth/session';
import { ClientShell } from '@/components/client/shell';
import './client.css';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const me = await requireArea('client');
  return <ClientShell me={me}>{children}</ClientShell>;
}
