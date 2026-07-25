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
  Menu, 
  X,
  Ticket,
  Search,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { processOfflineQueue } from '@/lib/offlineDb';

interface AppLayoutProps {
  user: {
    id: number;
    nombre: string;
    email_o_usuario: string;
    rol: 'SUPERADMIN' | 'SOPORTE' | 'TECNICO';
    region_asignada?: string;
    especialidad?: string;
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
      default:
        return null;
    }
  };

  // Sub-pantallas según la categoría seleccionada
  const getSubTabs = () => {
    if (activeTab === 'soporte') {
      return [
        { id: 'visitas', label: 'Órdenes de Visita', icon: Activity, badge: stats?.totalVisitas },
        { id: 'clientes', label: 'Directorio de Clientes', icon: Users, badge: stats?.totalClientes },
        { id: 'cambios_ip', label: 'Bitácora Cambios IP / AP', icon: Radio },
        { id: 'antenas', label: '📡 Antenas & APs (Topología)', icon: Radio },
      ];
    }
    return [];
  };

  const currentSubTabs = getSubTabs();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* OVERLAY MÓVIL */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden" 
        />
      )}

      {/* SIDEBAR LATERAL IZQUIERDO */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-52'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Header Marca */}
        <div>
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

          {/* Menú de Navegación Módulos */}
          <nav className="p-2 space-y-1">
            {!collapsed ? (
              <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Módulos Principales
              </div>
            ) : (
              <div className="my-2 border-t border-slate-800/80" />
            )}

            {/* Opción 1: Gestión de Soporte */}
            <button
              onClick={() => {
                setActiveTab('soporte');
                if (setSubTab) setSubTab('visitas');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center ${collapsed ? 'justify-center p-3' : 'justify-start px-3 py-2.5 gap-3'} rounded-xl font-bold text-xs transition ${
                activeTab === 'soporte' && subTab === 'visitas'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Órdenes de Visita Técnica"
            >
              <Activity className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Órdenes de Visita</span>}
            </button>

            {/* Opción 2: Directorio Directo Clientes */}
            <button
              onClick={() => {
                setActiveTab('soporte');
                if (setSubTab) setSubTab('clientes');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center ${collapsed ? 'justify-center p-3' : 'justify-start px-3 py-2.5 gap-3'} rounded-xl font-bold text-xs transition ${
                activeTab === 'soporte' && subTab === 'clientes'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Directorio de Clientes"
            >
              <Users className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Directorio Clientes</span>}
            </button>

            {/* Opción 3: Bitácora Cambios IP / AP */}
            <button
              onClick={() => {
                setActiveTab('soporte');
                if (setSubTab) setSubTab('cambios_ip');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center ${collapsed ? 'justify-center p-3' : 'justify-start px-3 py-2.5 gap-3'} rounded-xl font-bold text-xs transition ${
                activeTab === 'soporte' && subTab === 'cambios_ip'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Bitácora Cambios IP / AP"
            >
              <Radio className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Bitácora Cambios IP</span>}
            </button>

            {/* Opción 4: Inventario Antenas & APs de Red */}
            <button
              onClick={() => {
                setActiveTab('soporte');
                if (setSubTab) setSubTab('antenas');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center ${collapsed ? 'justify-center p-3' : 'justify-start px-3 py-2.5 gap-3'} rounded-xl font-bold text-xs transition ${
                activeTab === 'soporte' && subTab === 'antenas'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Inventario Antenas & APs (Topología)"
            >
              <Radio className="w-5 h-5 shrink-0 text-sky-400" />
              {!collapsed && <span>Antenas & APs (Red)</span>}
            </button>

            {/* Opción 4: Vista Técnico Campo */}
            <button
              onClick={() => {
                setActiveTab('tecnico');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center ${collapsed ? 'justify-center p-3' : 'justify-start px-3 py-2.5 gap-3'} rounded-xl font-bold text-xs transition ${
                activeTab === 'tecnico'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Vista Técnico (Campo)"
            >
              <Wrench className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Técnico (Campo)</span>}
            </button>

            {/* Módulos de Administración (SuperAdmin) */}
            {user.rol === 'SUPERADMIN' && (
              <>
                {!collapsed ? (
                  <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Administración
                  </div>
                ) : (
                  <div className="my-2 border-t border-slate-800/80" />
                )}

                <button
                  onClick={() => {
                    setActiveTab('usuarios');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center ${collapsed ? 'justify-center p-3' : 'justify-start px-3 py-2.5 gap-3'} rounded-xl font-bold text-xs transition ${
                    activeTab === 'usuarios'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Gestión de Usuarios"
                >
                  <Shield className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>Usuarios Sistema</span>}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('importar');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center ${collapsed ? 'justify-center p-3' : 'justify-start px-3 py-2.5 gap-3'} rounded-xl font-bold text-xs transition ${
                    activeTab === 'importar'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Importar WispHub Excel"
                >
                  <FileSpreadsheet className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>Importar WispHub</span>}
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Footer Sidebar Perfil Usuario y Toggle de Tema */}
        <div className="p-2 border-t border-slate-800 space-y-2">
          {/* Botón Switch Modo Día / Noche en Sidebar */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'} rounded-xl text-xs font-bold transition border ${
              theme === 'light'
                ? 'bg-amber-100/80 text-amber-900 border-amber-300/70 hover:bg-amber-200/80'
                : 'bg-slate-950 text-amber-300 border-slate-800 hover:bg-slate-800'
            }`}
            title={theme === 'light' ? 'Cambiar a Modo Noche Oscuro' : 'Cambiar a Modo Día Hueso Cálido'}
          >
            <div className="flex items-center gap-2">
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-600 animate-spin-slow shrink-0" />
              ) : (
                <Moon className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              {!collapsed && (
                <span>{theme === 'light' ? 'Día (Hueso)' : 'Modo Noche'}</span>
              )}
            </div>
            {!collapsed && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/40 border border-current">
                {theme === 'light' ? 'Luz Sol' : 'Dark'}
              </span>
            )}
          </button>

          <div className={`bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2 ${collapsed ? 'p-2 justify-center' : 'p-2.5'}`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold flex items-center justify-center shrink-0 text-xs">
                {user.nombre.charAt(0)}
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">{user.nombre}</div>
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

      {/* ÁREA DE CONTENIDO PRINCIPAL CON HEADER NAVBAR DINÁMICO */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER NAVBAR CON SUB-PESTAÑAS FLOTANTES */}
        <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Sub-pestañas flotantes arriba si la categoría actual las tiene */}
            {currentSubTabs.length > 0 ? (
              <div className="bg-slate-950 border border-slate-800 p-1 rounded-2xl flex items-center gap-1 overflow-x-auto">
                {currentSubTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = subTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSubTab && setSubTab(tab.id)}
                      className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      {tab.badge !== undefined && tab.badge !== null && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold transition border ${
                          isActive 
                            ? 'bg-white/25 text-white border-white/40' 
                            : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <h2 className="text-base font-extrabold text-white leading-tight">
                  {activeTab === 'tecnico' && '🔧 Módulo Técnico de Campo'}
                  {activeTab === 'usuarios' && '👥 Administración de Usuarios'}
                  {activeTab === 'importar' && '📥 Importación Masiva WispHub'}
                </h2>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* SWITCH PALETA DE COLORES DÍA / NOCHE EN NAVBAR */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition shadow-sm active:scale-95 ${
                theme === 'light'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-slate-950 text-amber-300 border-slate-800 hover:bg-slate-800'
              }`}
              title={theme === 'light' ? 'Cambiar a Modo Noche Oscuro' : 'Cambiar a Paleta Día Hueso Cálido'}
            >
              {theme === 'light' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>☀️ Día (Hueso)</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>🌙 Noche</span>
                </>
              )}
            </button>

            <div className={`hidden lg:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl border transition ${
              isOnline 
                ? 'bg-slate-950 text-slate-300 border-slate-800' 
                : 'bg-amber-950/80 text-amber-300 border-amber-800/80 animate-pulse font-bold'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isOnline ? 'Turso Cloud Sync • Online' : '📡 Modo Offline (Señal de Campo)'}</span>
            </div>

            <button
              onClick={handleLogout}
              className="md:hidden flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/30 text-xs px-3 py-1.5 rounded-xl font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
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
