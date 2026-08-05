'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wifi, 
  Shield, 
  UserCheck, 
  Wrench, 
  Users, 
  FileSpreadsheet, 
  Radio, 
  Activity, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Menu, 
  X,
  Ticket,
  Sun,
  Moon,
  Network,
  LogIn,
  LayoutDashboard,
  Headphones,
  Settings,
  Upload,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { processOfflineQueue } from '@/lib/offlineDb';

interface AppLayoutProps {
  user: {
    id: number;
    nombre: string;
    email_o_usuario: string;
    rol: 'SUPERADMIN' | 'SOPORTE' | 'TECNICO' | 'INVITADO';
    region_asignada?: string;
    especialidad?: string;
    isGuest?: boolean;
  };
  activeTab: string;
  setActiveTab: (tab: string) => void;
  subTab?: string;
  setSubTab?: (subTab: string) => void;
  stats?: {
    totalClientes: number;
    totalVisitas: number;
    pendientes: number;
    totalTecnicos: number;
  } | null;
  children: React.ReactNode;
}

export default function AppLayout({
  user,
  activeTab,
  setActiveTab,
  subTab,
  setSubTab,
  stats,
  children,
}: AppLayoutProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [soporteExpanded, setSoporteExpanded] = useState(true);

  const isGuest = user.rol === 'INVITADO';
  const isAdmin = user.rol === 'SUPERADMIN';
  const isTecnico = user.rol === 'TECNICO' || user.rol === 'SUPERADMIN';

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        processOfflineQueue();
      };
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const navigate = (tab: string, sub?: string) => {
    setActiveTab(tab);
    if (sub && setSubTab) setSubTab(sub);
    setMobileMenuOpen(false);
  };

  // Section title for header
  const getSectionTitle = () => {
    if (activeTab === 'vlans') return '🌐 IPs & VLANs';
    if (activeTab === 'dashboard') return '📊 Dashboard';
    if (activeTab === 'soporte' && subTab === 'visitas') return '🎟️ Órdenes de Visita';
    if (activeTab === 'soporte' && subTab === 'clientes') return '📋 Directorio Clientes';
    if (activeTab === 'soporte' && subTab === 'cambios_ip') return '🔄 Bitácora IP';
    if (activeTab === 'soporte' && subTab === 'antenas') return '📡 Antenas & APs';
    if (activeTab === 'soporte') return '🎟️ Soporte';
    if (activeTab === 'tecnico') return '🔧 Mis Visitas';
    if (activeTab === 'usuarios') return '👤 Usuarios';
    if (activeTab === 'importar') return '📥 Importar CSV';
    return '🌐 ISP Control';
  };

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case 'SUPERADMIN':
        return <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold"><Shield className="w-3 h-3" /> SUPER ADMIN</span>;
      case 'SOPORTE':
        return <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold"><UserCheck className="w-3 h-3" /> SOPORTE</span>;
      case 'TECNICO':
        return <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold"><Wrench className="w-3 h-3" /> TÉCNICO</span>;
      case 'INVITADO':
        return <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">🌐 MODO LIBRE</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">

      {/* ── OVERLAY MÓVIL ── */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ── SIDEBAR LATERAL – DESKTOP ── */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand */}
        <div className="overflow-y-auto flex-1">
          <div className={`p-3 border-b border-slate-800 flex items-center ${collapsed ? 'flex-col gap-2 p-2 justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-sky-600/20 border border-sky-500/30 rounded-xl text-sky-400 shrink-0">
                <Wifi className="w-5 h-5 animate-pulse" />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="font-extrabold text-base text-white tracking-tight leading-none flex items-center gap-1.5">
                    ISP Control <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1 py-0.5 rounded font-mono">PWA</span>
                  </h1>
                  <p className="text-[11px] text-slate-400 font-medium">Gestión Técnica</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition"
              title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="p-2 space-y-1">

            {/* IPs & VLANs — siempre visible, primero */}
            {!collapsed && <div className="px-2.5 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">🌐 Red & IPs</div>}
            <button
              onClick={() => navigate('vlans')}
              className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start px-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                activeTab === 'vlans'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Gestor de IPs & VLANs"
            >
              <Network className={`w-4 h-4 shrink-0 ${activeTab === 'vlans' ? 'text-white' : 'text-emerald-400'} animate-pulse`} />
              {!collapsed && <span>IPs & VLANs</span>}
            </button>

            {/* Dashboard — solo autenticados */}
            {!isGuest && (
              <button
                onClick={() => navigate('dashboard')}
                className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start px-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                  activeTab === 'dashboard'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                title="Dashboard de Resumen"
              >
                <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-white' : 'text-sky-400'}`} />
                {!collapsed && <span>Dashboard</span>}
              </button>
            )}

            {/* Soporte & Campo — solo autenticados */}
            {!isGuest && (
              <div className="pt-2">
                {!collapsed ? (
                  <button
                    onClick={() => setSoporteExpanded(!soporteExpanded)}
                    className="w-full px-2.5 py-1 text-[10px] font-extrabold text-slate-500 hover:text-slate-300 uppercase tracking-wider flex items-center justify-between transition"
                  >
                    <span>📋 Soporte & Campo</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${soporteExpanded ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <div className="my-2 border-t border-slate-800/80" />
                )}

                {(soporteExpanded || collapsed) && (
                  <div className="space-y-1 pt-0.5">
                    <button
                      onClick={() => navigate('soporte', 'visitas')}
                      className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start pl-4 pr-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                        activeTab === 'soporte' && subTab === 'visitas'
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-950'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                      title="Órdenes de Visita"
                    >
                      <Activity className={`w-4 h-4 shrink-0 ${activeTab === 'soporte' && subTab === 'visitas' ? 'text-white' : 'text-sky-400'}`} />
                      {!collapsed && (
                        <div className="flex items-center justify-between w-full">
                          <span>Órdenes de Visita</span>
                          {stats?.totalVisitas !== undefined && (
                            <span className="text-[10px] bg-slate-950/80 text-slate-300 px-1.5 rounded-full font-mono border border-slate-800">
                              {stats.totalVisitas}
                            </span>
                          )}
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => navigate('soporte', 'clientes')}
                      className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start pl-4 pr-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                        activeTab === 'soporte' && subTab === 'clientes'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                      title="Directorio de Clientes"
                    >
                      <Users className={`w-4 h-4 shrink-0 ${activeTab === 'soporte' && subTab === 'clientes' ? 'text-white' : 'text-purple-400'}`} />
                      {!collapsed && (
                        <div className="flex items-center justify-between w-full">
                          <span>Directorio Clientes</span>
                          {stats?.totalClientes !== undefined && (
                            <span className="text-[10px] bg-slate-950/80 text-slate-300 px-1.5 rounded-full font-mono border border-slate-800">
                              {stats.totalClientes}
                            </span>
                          )}
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => navigate('soporte', 'cambios_ip')}
                      className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start pl-4 pr-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                        activeTab === 'soporte' && subTab === 'cambios_ip'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                      title="Bitácora Cambios IP / AP"
                    >
                      <Radio className={`w-4 h-4 shrink-0 ${activeTab === 'soporte' && subTab === 'cambios_ip' ? 'text-white' : 'text-amber-400'}`} />
                      {!collapsed && <span>Bitácora Cambios IP</span>}
                    </button>

                    <button
                      onClick={() => navigate('soporte', 'antenas')}
                      className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start pl-4 pr-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                        activeTab === 'soporte' && subTab === 'antenas'
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-950'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                      title="Antenas & APs"
                    >
                      <Radio className={`w-4 h-4 shrink-0 ${activeTab === 'soporte' && subTab === 'antenas' ? 'text-white' : 'text-sky-400'} animate-pulse`} />
                      {!collapsed && <span>Antenas & APs</span>}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Módulo Técnico */}
            {isTecnico && !isGuest && (
              <div className="pt-2">
                {!collapsed && <div className="px-2.5 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">🔧 Técnico</div>}
                <button
                  onClick={() => navigate('tecnico')}
                  className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start px-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                    activeTab === 'tecnico'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Mis Visitas Asignadas"
                >
                  <Wrench className={`w-4 h-4 shrink-0 ${activeTab === 'tecnico' ? 'text-white' : 'text-blue-400'}`} />
                  {!collapsed && <span>Mis Visitas Asignadas</span>}
                </button>
              </div>
            )}

            {/* Administración — solo SUPERADMIN */}
            {isAdmin && (
              <div className="pt-2">
                {!collapsed && <div className="px-2.5 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">⚙️ Administración</div>}

                <button
                  onClick={() => navigate('usuarios')}
                  className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start px-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                    activeTab === 'usuarios'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Usuarios Sistema"
                >
                  <Shield className={`w-4 h-4 shrink-0 ${activeTab === 'usuarios' ? 'text-white' : 'text-purple-400'}`} />
                  {!collapsed && <span>Usuarios Sistema</span>}
                </button>

                <button
                  onClick={() => navigate('importar')}
                  className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start px-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                    activeTab === 'importar'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Importar CSV WispHub"
                >
                  <Upload className={`w-4 h-4 shrink-0 ${activeTab === 'importar' ? 'text-white' : 'text-emerald-400'}`} />
                  {!collapsed && <span>Importar WispHub</span>}
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Footer usuario en sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
          {isGuest ? (
            <button
              onClick={() => router.push('/login')}
              className={`w-full flex items-center ${collapsed ? 'justify-center p-2' : 'justify-center gap-2 py-2'} bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black transition active:scale-95`}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Iniciar Sesión</span>}
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300 text-xs shrink-0">
                  {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
                {!collapsed && (
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-xs text-white truncate leading-tight">{user.nombre}</h3>
                    <div className="mt-0.5">{getRoleBadge(user.rol)}</div>
                  </div>
                )}
              </div>
              {!collapsed && (
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── TOP HEADER (móvil y desktop) ── */}
        <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
          <div className="px-3 sm:px-5 h-14 flex items-center justify-between gap-3">

            {/* Izquierda: hamburguesa + título */}
            <div className="flex items-center gap-3 overflow-hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 active:scale-95 shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-sm sm:text-base font-extrabold text-white leading-tight truncate">
                  {getSectionTitle()}
                </span>
              </div>
            </div>

            {/* Derecha: indicadores + botón sesión */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Tema día/noche */}
              <button
                onClick={toggleTheme}
                className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 ${
                  theme === 'light'
                    ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                    : 'bg-slate-950 text-amber-300 border-slate-800 hover:bg-slate-800'
                }`}
                title={theme === 'light' ? 'Cambiar a Modo Noche' : 'Cambiar a Modo Día'}
              >
                {theme === 'light' ? (
                  <><Sun className="w-3.5 h-3.5 text-amber-600" /><span>Día</span></>
                ) : (
                  <><Moon className="w-3.5 h-3.5 text-amber-400" /><span>Noche</span></>
                )}
              </button>

              {/* Solo icono de tema en móvil */}
              <button
                onClick={toggleTheme}
                className={`sm:hidden p-2 rounded-xl text-xs border transition ${
                  theme === 'light'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-950 text-amber-300 border-slate-800'
                }`}
              >
                {theme === 'light' ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4 text-amber-400" />}
              </button>

              {/* Indicador online */}
              <div className={`hidden lg:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl border ${
                isOnline
                  ? 'bg-slate-950 text-slate-300 border-slate-800'
                  : 'bg-amber-950/80 text-amber-300 border-amber-800/80 animate-pulse font-bold'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>

              {/* Punto online en móvil */}
              <div className="lg:hidden" title={isOnline ? 'Online' : 'Offline'}>
                <span className={`block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
              </div>

              {/* Botón de sesión — SIEMPRE VISIBLE */}
              {isGuest ? (
                <button
                  onClick={() => router.push('/login')}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-black text-xs px-3 py-2 rounded-xl border border-sky-500/50 flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-sky-950"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Iniciar Sesión</span>
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-xs px-3 py-1.5 rounded-xl font-bold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <main className="flex-1 p-3 sm:p-5 w-full max-w-[1600px] mx-auto pb-24 md:pb-5">
          {children}
        </main>

        {/* ── BOTTOM NAV — SOLO MÓVIL ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl">
          <div className="flex items-stretch">
            {/* IPs — siempre visible */}
            <button
              onClick={() => navigate('vlans')}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-black transition relative ${
                activeTab === 'vlans' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeTab === 'vlans' && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-emerald-500 rounded-full" />}
              <Network className="w-5 h-5" />
              <span>IPs</span>
            </button>

            {/* Dashboard — solo autenticados */}
            {!isGuest && (
              <button
                onClick={() => navigate('dashboard')}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-black transition relative ${
                  activeTab === 'dashboard' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === 'dashboard' && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-sky-500 rounded-full" />}
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
            )}

            {/* Soporte — solo autenticados */}
            {!isGuest && (
              <button
                onClick={() => navigate('soporte', subTab || 'visitas')}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-black transition relative ${
                  activeTab === 'soporte' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === 'soporte' && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-purple-500 rounded-full" />}
                <Headphones className="w-5 h-5" />
                <span>Soporte</span>
              </button>
            )}

            {/* Técnico — para técnicos y admins */}
            {isTecnico && !isGuest && (
              <button
                onClick={() => navigate('tecnico')}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-black transition relative ${
                  activeTab === 'tecnico' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === 'tecnico' && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-blue-500 rounded-full" />}
                <Wrench className="w-5 h-5" />
                <span>Técnico</span>
              </button>
            )}

            {/* Admin — solo SUPERADMIN */}
            {isAdmin && (
              <button
                onClick={() => navigate('usuarios')}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-black transition relative ${
                  activeTab === 'usuarios' || activeTab === 'importar' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {(activeTab === 'usuarios' || activeTab === 'importar') && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-amber-500 rounded-full" />}
                <Settings className="w-5 h-5" />
                <span>Admin</span>
              </button>
            )}

            {/* Iniciar sesión en bottom nav para invitados */}
            {isGuest && (
              <button
                onClick={() => router.push('/login')}
                className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-black text-sky-400 transition"
              >
                <LogIn className="w-5 h-5" />
                <span>Ingresar</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
