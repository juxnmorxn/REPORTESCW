'use client';

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Zap, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Calendar,
  Send,
  X,
  Phone,
  FileText,
  Building,
  UserCheck,
  Loader2
} from 'lucide-react';

import NotificationModal from './NotificationModal';

interface Visit {
  id: number;
  cliente_id: number;
  tecnico_id: number | null;
  creado_por_id: number;
  estado_visita: 'Pendiente' | 'En Proceso' | 'Completada' | 'Cancelada';
  prioridad: 'Baja' | 'Normal' | 'Urgente';
  fecha_asignacion: string;
  fecha_completado?: string;
  motivo_reporte: string;
  diagnostico_tecnico?: string;
  cliente_nombre: string;
  cliente_ip?: string;
  cliente_tipo_servicio: 'Antena' | 'Fibra';
  cliente_plan?: string;
  cliente_region: string;
  cliente_direccion?: string;
  tecnico_nombre?: string;
  creado_por_nombre?: string;
}

interface TechDashboardProps {
  user: {
    id: number;
    nombre: string;
    email_o_usuario: string;
    rol: 'SUPERADMIN' | 'SOPORTE' | 'TECNICO';
    region_asignada?: string;
    especialidad?: 'Antena' | 'Fibra' | 'Ambos';
  };
}

export default function TechDashboard({ user }: TechDashboardProps) {
  const [visitas, setVisitas] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabTecnologia, setTabTecnologia] = useState<'Todos' | 'Antena' | 'Fibra'>('Todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [diagnostico, setDiagnostico] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState<'En Proceso' | 'Completada'>('Completada');
  const [submitting, setSubmitting] = useState(false);

  // Modales de Notificación personalizados
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type?: 'error' | 'success' | 'info' | 'warning';
  }>({
    isOpen: false,
    message: '',
  });

  const notify = (message: string, type: 'error' | 'success' | 'info' | 'warning' = 'error', title?: string) => {
    setNotification({ isOpen: true, message, type, title });
  };

  const fetchVisitas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (tabTecnologia !== 'Todos') params.append('tipo', tabTecnologia);
      if (filtroEstado !== 'Todos') params.append('estado', filtroEstado);
      if (busqueda.trim()) params.append('search', busqueda);

      const res = await fetch(`/api/visits?${params.toString()}`);
      const data = await res.json();
      if (data.visitas) {
        setVisitas(data.visitas);
      }
    } catch (err) {
      console.error('Error al cargar visitas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitas();
  }, [tabTecnologia, filtroEstado, busqueda]);

  const handleOpenCompleteModal = (visit: Visit) => {
    setSelectedVisit(visit);
    setDiagnostico(visit.diagnostico_tecnico || '');
    setNuevoEstado(visit.estado_visita === 'En Proceso' ? 'Completada' : 'En Proceso');
  };

  const handleSaveDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/visits/${selectedVisit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado_visita: nuevoEstado,
          diagnostico_tecnico: diagnostico,
          tecnico_id: selectedVisit.tecnico_id || user.id, // Auto-asignar si estaba libre
        }),
      });
      if (res.ok) {
        setSelectedVisit(null);
        setDiagnostico('');
        fetchVisitas();
        notify('Diagnóstico actualizado correctamente', 'success');
      } else {
        notify('Error al guardar el diagnóstico', 'error');
      }
    } catch (err) {
      console.error(err);
      notify('Error de conexión', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openGoogleMaps = (direccion?: string, clienteNombre?: string) => {
    const query = encodeURIComponent(direccion || clienteNombre || '');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const countAntenas = visitas.filter((v) => v.cliente_tipo_servicio === 'Antena').length;
  const countFibra = visitas.filter((v) => v.cliente_tipo_servicio === 'Fibra').length;
  const countUrgentes = visitas.filter((v) => v.prioridad === 'Urgente' && v.estado_visita !== 'Completada').length;

  return (
    <div className="space-y-4 pb-20">
      {/* Header Resumen del Técnico */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              👷‍♂️ Hola, {user.nombre.split(' ')[0]}
            </h2>
            <p className="text-xs text-slate-400">
              Región: <span className="font-semibold text-slate-200">{user.region_asignada || 'Todas'}</span>
              {user.especialidad && ` • Esp: ${user.especialidad}`}
            </p>
          </div>
          {countUrgentes > 0 && (
            <div className="animate-pulse-red bg-red-500/20 border border-red-500/50 text-red-300 font-extrabold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-400" />
              {countUrgentes} Urgente{countUrgentes > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Pestañas rápidas de Tecnología: [ Todos ] [ 📡 Antena ] [ 🔌 Fibra ] */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            onClick={() => setTabTecnologia('Todos')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tabTecnologia === 'Todos'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({visitas.length})
          </button>
          <button
            onClick={() => setTabTecnologia('Antena')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tabTecnologia === 'Antena'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'text-blue-400 hover:bg-blue-950/40'
            }`}
          >
            📡 Antena ({countAntenas})
          </button>
          <button
            onClick={() => setTabTecnologia('Fibra')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tabTecnologia === 'Fibra'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                : 'text-emerald-400 hover:bg-emerald-950/40'
            }`}
          >
            🔌 Fibra ({countFibra})
          </button>
        </div>
      </div>

      {/* Buscador de Visitas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, IP, dirección o reporte..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
        >
          <option value="Todos">Todos los Estados</option>
          <option value="Pendiente">Pendientes</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Completada">Completadas</option>
        </select>
      </div>

      {/* Lista de Tarjetas de Visitas Técnicas */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
          Cargando visitas asignadas...
        </div>
      ) : visitas.length === 0 ? (
        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/60" />
          <h3 className="text-slate-300 font-bold text-base">¡No hay visitas pendientes!</h3>
          <p className="text-xs text-slate-500">Estás al día con todos los reportes de tu zona.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visitas.map((v) => {
            const isAntena = v.cliente_tipo_servicio === 'Antena';
            const isUrgente = v.prioridad === 'Urgente';

            return (
              <div
                key={v.id}
                className={`bg-slate-900 border rounded-2xl p-4 shadow-lg transition hover:border-slate-700 ${
                  isUrgente && v.estado_visita !== 'Completada'
                    ? 'border-red-500/60 shadow-red-950/20'
                    : 'border-slate-800'
                }`}
              >
                {/* Cabecera Tarjeta */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isAntena ? (
                      <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        <Radio className="w-3 h-3" /> Antena
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        <Zap className="w-3 h-3" /> Fibra Óptica
                      </span>
                    )}

                    {isUrgente ? (
                      <span className="bg-red-500/30 text-red-200 border border-red-500 text-xs px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                        🚨 URGENTE
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                        {v.prioridad}
                      </span>
                    )}

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        v.estado_visita === 'Completada'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : v.estado_visita === 'En Proceso'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {v.estado_visita}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">Ticket #{v.id}</span>
                </div>

                {/* Info Cliente */}
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-white">{v.cliente_nombre}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                    {v.cliente_ip && (
                      <span className="bg-slate-950 text-sky-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
                        IP: {v.cliente_ip}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-400">
                      <Building className="w-3 h-3 text-slate-500" />
                      {v.cliente_region}
                    </span>
                  </div>

                  {v.cliente_direccion && (
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-slate-400 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <span>{v.cliente_direccion}</span>
                      </p>
                      <button
                        onClick={() => openGoogleMaps(v.cliente_direccion, v.cliente_nombre)}
                        className="text-[11px] text-sky-400 hover:text-sky-300 bg-sky-950/60 border border-sky-800 px-2 py-1 rounded-lg shrink-0 flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" /> Maps
                      </button>
                    </div>
                  )}
                </div>

                {/* Motivo Falla */}
                <div className="mt-3 p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                    Motivo de reporte:
                  </span>
                  <p className="text-slate-200 mt-1 leading-relaxed">{v.motivo_reporte}</p>
                </div>

                {/* Diagnóstico técnico grabado */}
                {v.diagnostico_tecnico && (
                  <div className="mt-2 p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/60 text-xs">
                    <span className="text-emerald-400 font-bold block text-[10px] uppercase tracking-wider">
                      Diagnóstico Registrado:
                    </span>
                    <p className="text-emerald-200 mt-1 leading-relaxed">{v.diagnostico_tecnico}</p>
                  </div>
                )}

                {/* Botón de Acción Principal */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Asignado a: <strong className="text-slate-200">{v.tecnico_nombre || 'Sin Asignar'}</strong>
                  </span>

                  <button
                    onClick={() => handleOpenCompleteModal(v)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{v.estado_visita === 'Completada' ? 'Editar Reporte' : 'Atender / Diagnosticar'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Completar Visita / Diagnóstico */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Reporte de Visita Técnica #{selectedVisit.id}
              </h3>
              <button onClick={() => setSelectedVisit(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="text-slate-300 font-bold text-sm">{selectedVisit.cliente_nombre}</p>
              <p className="text-slate-400">
                IP: <span className="text-sky-400 font-mono">{selectedVisit.cliente_ip || 'S/N'}</span> • Región: {selectedVisit.cliente_region}
              </p>
              <p className="text-slate-400 italic">Reporte: {selectedVisit.motivo_reporte}</p>
            </div>

            <form onSubmit={handleSaveDiagnosis} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Estado de la Visita</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('En Proceso')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                      nuevoEstado === 'En Proceso'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    🚧 En Proceso
                  </button>
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('Completada')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                      nuevoEstado === 'Completada'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    ✅ Completada
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Diagnóstico Técnico / Solución Aplicada *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe la solución realizada (Ej: Se reemplazó conector RJ45 y se restableció potencia de antena en -62 dBm)..."
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedVisit(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando Reporte...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Guardar Reporte</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Notificación / Alertas Nativas */}
      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
