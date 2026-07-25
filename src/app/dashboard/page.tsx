import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import TechDashboard from '@/components/TechDashboard';
import SupportDashboard from '@/components/SupportDashboard';
import AdminDashboard from '@/components/AdminDashboard';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {user.rol === 'SUPERADMIN' && <AdminDashboard user={user} />}
      {user.rol === 'SOPORTE' && <AdminDashboard user={user} />}
      {user.rol === 'TECNICO' && <TechDashboard user={user} />}

      <PWAInstallPrompt />
    </div>
  );
}
