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
  Search,
  RefreshCw,
  Sun,
  Moon,
  Network,
  LogIn,
  Lock
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

  // Estado para desplegar subcategorías en el Sidebar
  const [soporteExpanded, setSoporteExpanded] = useState(true);

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

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case 'SUPERADMIN':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
            <Shield className="w-3 h-3" /> SUPER ADMIN
          </span>
        );
      case 'SOPORTE':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
            <UserCheck className="w-3 h-3" /> SOPORTE
          </span>
        );
      case 'TECNICO':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
            <Wrench className="w-3 h-3" /> TÉCNICO
          </span>
        );
      case 'INVITADO':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
            🌐 MODO LIBRE
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* OVERLAY MÓVIL */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden" 
        />
      )}

      {/* SIDEBAR LATERAL IZQUIERDO CON SUBCATEGORÍAS ANIDADAS */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Header Marca */}
        <div className="overflow-y-auto">
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

          {/* MENÚ DE NAVEGACIÓN ANIDADO CON SUBCATEGORÍAS */}
          <nav className="p-2 space-y-1">
            {/* GRUPO 1: GESTIÓN DE SOPORTE & CAMPO (DESPLEGABLE) */}
            <div>
              {!collapsed ? (
                <button
                  onClick={() => setSoporteExpanded(!soporteExpanded)}
                  className="w-full px-2.5 py-2 text-[11px] font-extrabold text-slate-400 hover:text-white uppercase tracking-wider flex items-center justify-between transition"
                >
                  <span>📋 Soporte & Campo</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${soporteExpanded ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <div className="my-2 border-t border-slate-800/80" />
              )}

              {(soporteExpanded || collapsed) && (
                <div className="space-y-1 pt-0.5">
                  {/* SOLO VISIBLE SI ESTÁ AUTENTICADO */}
                  {user.rol !== 'INVITADO' && (
                    <>
                      {/* Sub 1.1: Órdenes de Visita */}
                      <button
                        onClick={() => {
                          setActiveTab('soporte');
                          if (setSubTab) setSubTab('visitas');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start pl-4 pr-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                          activeTab === 'soporte' && subTab === 'visitas'
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-950'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                        }`}
                        title="Órdenes de Visita Técnica"
                      >
                        <Activity className="w-4 h-4 shrink-0 text-sky-400" />
                        {!collapsed && (
                          <div className="flex items-center justify-between w-full">
                            <span>Órdenes de Visita</span>
                            {stats?.totalVisitas !== undefined && (
                              <span className="text-[10px] bg-slate-950/80 text-slate-300 px-1.5 py-0.2 rounded-full font-mono border border-slate-800">
                                {stats.totalVisitas}
                              </span>
                            )}
                          </div>
                        )}
                      </button>

                      {/* Sub 1.2: Directorio de Clientes */}
                      <button
                        onClick={() => {
                          setActiveTab('soporte');
                          if (setSubTab) setSubTab('clientes');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start pl-4 pr-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                          activeTab === 'soporte' && subTab === 'clientes'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                        }`}
                        title="Directorio de Clientes"
                      >
                        <Users className="w-4 h-4 shrink-0 text-purple-400" />
                        {!collapsed && (
                          <div className="flex items-center justify-between w-full">
                            <span>Directorio Clientes</span>
                            {stats?.totalClientes !== undefined && (
                              <span className="text-[10px] bg-slate-950/80 text-slate-300 px-1.5 py-0.2 rounded-full font-mono border border-slate-800">
                                {stats.totalClientes}
                              </span>
                            )}
                          </div>
                        )}
                      </button>

                      {/* Sub 1.3: Bitácora Cambios IP / AP */}
                      <button
                        onClick={() => {
                          setActiveTab('soporte');
                          if (setSubTab) setSubTab('cambios_ip');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start pl-4 pr-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                          activeTab === 'soporte' && subTab === 'cambios_ip'
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                        }`}
                        title="Bitácora Cambios IP / AP"
                      >
                        <Radio className="w-4 h-4 shrink-0 text-amber-400" />
                        {!collapsed && <span>Bitácora Cambios IP</span>}
                      </button>

                      {/* Sub 1.4: Inventario Antenas & APs de Red */}
                      <button
                        onClick={() => {
                          setActiveTab('soporte');
                          if (setSubTab) setSubTab('antenas');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start pl-4 pr-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                          activeTab === 'soporte' && subTab === 'antenas'
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-950'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                        }`}
                        title="Inventario Antenas & APs (Topología)"
                      >
                        <Radio className="w-4 h-4 shrink-0 text-sky-400 animate-pulse" />
                        {!collapsed && <span>Antenas & APs (Red)</span>}
                      </button>
                    </>
                  )}

                  {/* Sub 1.5: Gestor de IPs & VLANs (SIEMPRE ACCESIBLE LIBREMENTE) */}
                  <button
                    onClick={() => {
                      setActiveTab('soporte');
                      if (setSubTab) setSubTab('vlans');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start pl-4 pr-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                      activeTab === 'soporte' && subTab === 'vlans'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                    title="Gestor e Inventario de IPs y VLANs"
                  >
                    <Network className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse" />
                    {!collapsed && <span>Gestor IPs & VLANs</span>}
                  </button>
                </div>
              )}
            </div>

            {/* GRUPO 2: TÉCNICO DE CAMPO (SOLO SI TIENE ROL) */}
            {user.rol !== 'INVITADO' && (
              <div className="pt-2">
                {!collapsed ? (
                  <div className="px-2.5 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    🔧 Módulo Técnico
                  </div>
                ) : (
                  <div className="my-2 border-t border-slate-800/80" />
                )}

                <button
                  onClick={() => {
                    setActiveTab('tecnico');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start px-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                    activeTab === 'tecnico'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Vista Técnico (Campo)"
                >
                  <Wrench className="w-4 h-4 shrink-0 text-blue-400" />
                  {!collapsed && <span>Mis Visitas Asignadas</span>}
                </button>
              </div>
            )}

            {/* GRUPO 3: ADMINISTRACIÓN (SUPERADMIN) */}
            {user.rol === 'SUPERADMIN' && (
              <div className="pt-2">
                {!collapsed ? (
                  <div className="px-2.5 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    ⚙️ Administración
                  </div>
                ) : (
                  <div className="my-2 border-t border-slate-800/80" />
                )}

                <button
                  onClick={() => {
                    setActiveTab('usuarios');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start px-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                    activeTab === 'usuarios'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Gestión de Usuarios"
                >
                  <Shield className="w-4 h-4 shrink-0 text-purple-400" />
                  {!collapsed && <span>Usuarios Sistema</span>}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('importar');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-start px-3 py-2 gap-2.5'} rounded-xl font-bold text-xs transition ${
                    activeTab === 'importar'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Importación Masiva WispHub"
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-400" />
                  {!collapsed && <span>Importar WispHub</span>}
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Footer Usuario */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
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
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL CON HEADER LIMPIO */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER NAVBAR (LIMPIO Y OPTIMIZADO PARA MÓVILES) */}
        <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3 sm:px-6 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Título y Badge de la Sección Actual */}
            <div className="flex items-center gap-2 overflow-hidden">
              <h2 className="text-xs sm:text-base font-extrabold text-white leading-tight truncate max-w-[150px] sm:max-w-none">
                {activeTab === 'soporte' && subTab === 'visitas' && '🎟️ Visitas'}
                {activeTab === 'soporte' && subTab === 'clientes' && '📋 Clientes'}
                {activeTab === 'soporte' && subTab === 'cambios_ip' && '🔄 Bitácora IP'}
                {activeTab === 'soporte' && subTab === 'antenas' && '📡 Antenas & APs'}
                {activeTab === 'soporte' && subTab === 'vlans' && '🌐 Gestor IPs & VLANs'}
                {activeTab === 'tecnico' && '🔧 Técnico'}
                {activeTab === 'usuarios' && '👤 Usuarios'}
                {activeTab === 'importar' && '📥 WispHub'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* SWITCH PALETA DE COLORES DÍA / NOCHE */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition shadow-sm active:scale-95 ${
                theme === 'light'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-slate-950 text-amber-300 border-slate-800 hover:bg-slate-800'
              }`}
              title={theme === 'light' ? 'Cambiar a Modo Noche Oscuro' : 'Cambiar a Paleta Día Hueso Cálido'}
            >
              {theme === 'light' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="hidden sm:inline">☀️ Día (Hueso)</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">🌙 Noche</span>
                </>
              )}
            </button>

            {/* Estado Online / Offline */}
            <div className={`flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-xl border transition ${
              isOnline 
                ? 'bg-slate-950 text-slate-300 border-slate-800' 
                : 'bg-amber-950/80 text-amber-300 border-amber-800/80 animate-pulse font-bold'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="hidden lg:inline">{isOnline ? 'Turso Cloud Sync • Online' : '📡 Modo Offline (Señal de Campo)'}</span>
            </div>

            {/* BOTÓN DE SESIÓN */}
            {user.rol === 'INVITADO' ? (
              <button
                onClick={() => router.push('/login')}
                className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl border border-sky-500/50 flex items-center gap-1.5 transition active:scale-95"
                title="Iniciar Sesión con Usuario y Contraseña"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">🔑 Iniciar Sesión</span>
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-xs px-3 py-1.5 rounded-xl font-bold transition"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-3 sm:p-5 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
