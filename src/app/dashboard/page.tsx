import { getCurrentUser } from '@/lib/auth';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import TechDashboard from '@/components/TechDashboard';
import AdminDashboard from '@/components/AdminDashboard';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Guest session for unauthenticated visitors (only VLAN & IP manager accessible for security)
  const activeUser = user || {
    id: 0,
    nombre: 'Consulta Libre VLANs',
    email_o_usuario: 'invitado',
    rol: 'INVITADO' as any,
    isGuest: true,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {activeUser.rol === 'TECNICO' ? (
        <TechDashboard user={activeUser} />
      ) : (
        <AdminDashboard user={activeUser} />
      )}

      <PWAInstallPrompt />
    </div>
  );
}
