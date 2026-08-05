'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wifi,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Shield,
  Wrench,
  UserCheck,
  Zap,
  Network,
  Copy,
  Check,
  CheckCircle2,
  Search,
  Loader2,
  ChevronRight
} from 'lucide-react';

interface Vlan {
  id: number;
  nombre: string;
  vlan_id: number;
  rango_red: string;
}

interface IpItemPreview {
  ip: string;
  vlan_id: number;
  vlan_nombre: string;
  estado: 'DISPONIBLE' | 'OCUPADA';
  cliente_nombre?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);

  // VLAN IP Quick Search Widget State (On Login Page)
  const [vlans, setVlans] = useState<Vlan[]>([]);
  const [selectedVlan, setSelectedVlan] = useState<string>('todas');
  const [previewIps, setPreviewIps] = useState<IpItemPreview[]>([]);
  const [previewSummary, setPreviewSummary] = useState({ disponibles: 0, ocupadas: 0, total: 0 });
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [previewFilter, setPreviewFilter] = useState<'disponibles' | 'ocupadas' | 'todas'>('disponibles');

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

  const handleQuickLogin = async (rol: 'SUPERADMIN' | 'SOPORTE' | 'TECNICO' = 'SUPERADMIN') => {
    try {
      setQuickLoading(true);
      setError('');
      const res = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol }),
      });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError('Error al iniciar sesión sin contraseña');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setQuickLoading(false);
    }
  };

  const loadPreviewIps = async () => {
    try {
      setLoadingPreview(true);
      const params = new URLSearchParams();
      if (selectedVlan !== 'todas') params.append('vlan_id', selectedVlan);
      params.append('status', previewFilter);

      const res = await fetch(`/api/vlans/ips?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setVlans(data.vlans || []);
        setPreviewIps(data.ips || []);
        if (data.summary) {
          setPreviewSummary({
            disponibles: data.summary.disponibles,
            ocupadas: data.summary.ocupadas,
            total: data.summary.totalIps,
          });
        }
      }
    } catch (err) {
      console.error('Error cargando vista previa de IPs en login:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    loadPreviewIps();
  }, [selectedVlan, previewFilter]);

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const fillDemoAccount = (user: string, pass: string) => {
    setUsuario(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
      {/* Background glow graphics */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
        
        {/* COLUMNA IZQUIERDA / CENTRAL: FORMULARIO Y BOTÓN DE ACCESO DIRECTO SIN CONTRASEÑA */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Brand logo & header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-sky-500/20 border border-sky-500/30 rounded-2xl mx-auto flex items-center justify-center text-sky-400 shadow-lg shadow-sky-950">
              <Wifi className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">ISP Control PWA</h1>
            <p className="text-xs text-slate-400">Sistema de Asignación de Visitas, VLANs e Inventario de IPs</p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* BOTÓN PROMINENTE DE ENTRAR DIRECTO SIN CONTRASEÑA */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/80 to-purple-950/80 border border-emerald-500/40 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="text-xs font-extrabold text-white">Acceso Rápido Sin Contraseña</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Entra instantáneamente al sistema sin ingresar credenciales.
            </p>
            <button
              onClick={() => handleQuickLogin('SUPERADMIN')}
              disabled={quickLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-emerald-950 transition active:scale-98 flex items-center justify-center gap-2"
            >
              {quickLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Entrando al Sistema...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>⚡ Entrar Directo (Sin Contraseña)</span>
                </>
              )}
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-bold uppercase">O inicia con credenciales</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Usuario / Email</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Ingresa tu usuario (ej: admin)"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-sky-950 transition active:scale-98 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Accounts Quick Helper */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="block text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
              Cuentas de Prueba Con 1 Clic
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleQuickLogin('SUPERADMIN')}
                className="p-2 bg-purple-950/40 hover:bg-purple-950/70 border border-purple-800/50 rounded-xl text-left transition"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-purple-300">
                  <Shield className="w-3 h-3" /> Admin
                </div>
                <span className="text-[9px] text-slate-400 block font-mono">1-Clic Entrar</span>
              </button>

              <button
                onClick={() => handleQuickLogin('SOPORTE')}
                className="p-2 bg-blue-950/40 hover:bg-blue-950/70 border border-blue-800/50 rounded-xl text-left transition"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-300">
                  <UserCheck className="w-3 h-3" /> Soporte
                </div>
                <span className="text-[9px] text-slate-400 block font-mono">1-Clic Entrar</span>
              </button>

              <button
                onClick={() => handleQuickLogin('TECNICO')}
                className="p-2 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/50 rounded-xl text-left transition"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                  <Wrench className="w-3 h-3" /> Técnico
                </div>
                <span className="text-[9px] text-slate-400 block font-mono">1-Clic Entrar</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: WIDGET DE CONSULTA RÁPIDA DE IPS DISPONIBLES Y OCUPADAS POR VLAN */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                <Network className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-white">Consulta Rápida de IPs por VLAN</h3>
                <p className="text-[11px] text-slate-400">Verifica IPs libres antes de asignar nuevos clientes.</p>
              </div>
            </div>
          </div>

          {/* Filtros de la vista previa en Login */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">VLAN / Subred</label>
              <select
                value={selectedVlan}
                onChange={(e) => setSelectedVlan(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-xl p-2 focus:outline-none focus:border-sky-500"
              >
                <option value="todas">🌐 Todas las VLANs</option>
                {vlans.map((v) => (
                  <option key={v.id} value={String(v.vlan_id)}>
                    VLAN {v.vlan_id} ({v.rango_red})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Mostrar Estado</label>
              <select
                value={previewFilter}
                onChange={(e: any) => setPreviewFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-xl p-2 focus:outline-none focus:border-sky-500"
              >
                <option value="disponibles">🟢 Solo Disponibles ({previewSummary.disponibles})</option>
                <option value="ocupadas">🔴 Solo Ocupadas ({previewSummary.ocupadas})</option>
                <option value="todas">⚪ Todas las IPs ({previewSummary.total})</option>
              </select>
            </div>
          </div>

          {/* Badges de Resumen */}
          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Disponibles: <strong>{previewSummary.disponibles}</strong>
            </span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Ocupadas: <strong>{previewSummary.ocupadas}</strong>
            </span>
            <span className="text-slate-400 font-bold">
              Total: <strong>{previewSummary.total}</strong>
            </span>
          </div>

          {/* Lista de IPs Filtradas en Login */}
          {loadingPreview ? (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <Loader2 className="w-6 h-6 mx-auto text-emerald-400 animate-spin" />
              <span>Escaneando VLANs...</span>
            </div>
          ) : previewIps.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
              No hay direcciones IP que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 border border-slate-800 rounded-xl bg-slate-950">
              {previewIps.slice(0, 40).map((item) => {
                const isLibre = item.estado === 'DISPONIBLE';
                return (
                  <div
                    key={`${item.vlan_id}-${item.ip}`}
                    className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-900/60 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">{item.ip}</span>
                        <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                          VLAN {item.vlan_id}
                        </span>
                      </div>
                      <div className="text-[10px] mt-0.5">
                        {isLibre ? (
                          <span className="text-emerald-400 font-bold">🟢 Disponible para asignar</span>
                        ) : (
                          <span className="text-amber-400 font-bold">
                            🔴 Ocupada por: {item.cliente_nombre || 'Cliente'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyIp(item.ip)}
                        className={`p-1.5 rounded-lg text-[11px] font-bold border transition ${
                          copiedIp === item.ip
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                        title="Copiar IP"
                      >
                        {copiedIp === item.ip ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleQuickLogin('SUPERADMIN')}
                        className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-extrabold transition flex items-center gap-1"
                        title="Entrar para gestionar esta IP"
                      >
                        <span>Entrar</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              onClick={() => handleQuickLogin('SUPERADMIN')}
              className="text-xs text-sky-400 hover:text-sky-300 font-extrabold flex items-center justify-center gap-1 mx-auto"
            >
              <span>Abrir Administrador Completo de VLANs & IPs</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
