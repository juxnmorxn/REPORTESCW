'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Wifi, Shield, UserCheck, Wrench, RefreshCw } from 'lucide-react';

interface NavbarProps {
  user: {
    id: number;
    nombre: string;
    email_o_usuario: string;
    rol: 'SUPERADMIN' | 'SOPORTE' | 'TECNICO';
    region_asignada?: string;
    especialidad?: string;
  };
  onRefresh?: () => void;
}

export default function Navbar({ user, onRefresh }: NavbarProps) {
  const router = useRouter();

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
          <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs px-2 py-0.5 rounded-full font-bold">
            <Shield className="w-3 h-3" /> SUPER ADMIN
          </span>
        );
      case 'SOPORTE':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs px-2 py-0.5 rounded-full font-bold">
            <UserCheck className="w-3 h-3" /> SOPORTE
          </span>
        );
      case 'TECNICO':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2 py-0.5 rounded-full font-bold">
            <Wrench className="w-3 h-3" /> TÉCNICO
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand logo & title */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-600/20 border border-sky-500/30 rounded-xl text-sky-400">
            <Wifi className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-tight leading-none flex items-center gap-1.5">
              ISP Control <span className="text-xs bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded font-mono">PWA</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Gestión & Soporte Técnico</p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Recargar datos"
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-200">{user.nombre}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {getRoleBadge(user.rol)}
              {user.region_asignada && (
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  {user.region_asignada}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-3 py-2 rounded-lg font-medium transition active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
