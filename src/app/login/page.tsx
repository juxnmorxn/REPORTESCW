'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wifi, Lock, User, AlertCircle, ArrowRight, Shield, Wrench, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (user: string, pass: string) => {
    setUsuario(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow graphics */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        {/* Brand logo & header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-sky-500/20 border border-sky-500/30 rounded-2xl mx-auto flex items-center justify-center text-sky-400 shadow-lg shadow-sky-950">
            <Wifi className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ISP Control PWA</h1>
          <p className="text-xs text-slate-400">Sistema de Asignación de Visitas y Soporte Técnico</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Usuario / Email</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                placeholder="Ingresa tu usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg shadow-sky-950 transition active:scale-98 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Accounts Quick Helper */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <span className="block text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">
            Cuentas de Prueba Rápidas
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => fillDemoAccount('admin', 'admin123')}
              className="p-2 bg-purple-950/40 hover:bg-purple-950/70 border border-purple-800/50 rounded-xl text-left transition"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-purple-300">
                <Shield className="w-3 h-3" /> Admin
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">admin123</span>
            </button>

            <button
              onClick={() => fillDemoAccount('soporte', 'soporte123')}
              className="p-2 bg-blue-950/40 hover:bg-blue-950/70 border border-blue-800/50 rounded-xl text-left transition"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-blue-300">
                <UserCheck className="w-3 h-3" /> Soporte
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">soporte123</span>
            </button>

            <button
              onClick={() => fillDemoAccount('tecnico_actopan', 'tecnico123')}
              className="p-2 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/50 rounded-xl text-left transition"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                <Wrench className="w-3 h-3" /> Técnico
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">tecnico123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
