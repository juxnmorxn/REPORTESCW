import { getCurrentUser } from '@/lib/auth';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import TechDashboard from '@/components/TechDashboard';
import AdminDashboard from '@/components/AdminDashboard';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Fallback to active Admin session if no login cookie is present
  const activeUser = user || {
    id: 1,
    nombre: 'Super Administrador',
    email_o_usuario: 'admin',
    rol: 'SUPERADMIN' as const,
    region_asignada: 'Todas',
    especialidad: 'Ambos' as const,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {activeUser.rol === 'SUPERADMIN' && <AdminDashboard user={activeUser} />}
      {activeUser.rol === 'SOPORTE' && <AdminDashboard user={activeUser} />}
      {activeUser.rol === 'TECNICO' && <TechDashboard user={activeUser} />}

      <PWAInstallPrompt />
    </div>
  );
}
