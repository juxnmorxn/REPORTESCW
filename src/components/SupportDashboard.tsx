'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  UserCheck, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  X, 
  MapPin, 
  Radio, 
  Zap,
  Users,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';

import NotificationModal from './NotificationModal';
import CustomersManager from './CustomersManager';
import IpChangesManager from './IpChangesManager';
import AntennasTopologyManager from './AntennasTopologyManager';
import VlanIpManager from './VlanIpManager';

interface Visit {
  id: number;
  cliente_id: number;
  tecnico_id: number | null;
  creado_por_id?: number;
  estado_visita?: 'Pendiente' | 'En Proceso' | 'Completada' | 'Cancelada';
  estado?: 'Pendiente' | 'En Proceso' | 'Completada' | 'Cancelada';
  prioridad?: 'Baja' | 'Normal' | 'Urgente';
  es_urgente?: number;
  fecha_asignacion?: string;
  fecha_creacion?: string;
  fecha_completado?: string;
  motivo_reporte: string;
  diagnostico_tecnico?: string;
  diagnostico?: string;
  cliente_nombre: string;
  cliente_ip?: string;
  ip?: string;
  cliente_tipo_servicio?: 'Antena' | 'Fibra';
  tipo_servicio?: 'Antena' | 'Fibra';
  cliente_plan?: string;
  plan?: string;
  cliente_region?: string;
  region?: string;
  cliente_direccion?: string;
  direccion?: string;
  tecnico_nombre?: string;
  tecnico_especialidad?: string;
  tecnico_region?: string;
  creado_por_nombre?: string;
}

interface Customer {
  id: number;
  nombre: string;
  ip: string;
  tipo_servicio: 'Antena' | 'Fibra';
  plan: string;
  region: string;
  direccion: string;
  estado: string;
}

interface UserTech {
  id: number;
  nombre: string;
  region_asignada?: string;
  especialidad?: string;
}

interface SupportDashboardProps {
  user: {
    id: number;
    nombre: string;
    email_o_usuario: string;
    rol: 'SUPERADMIN' | 'SOPORTE' | 'TECNICO';
    region_asignada?: string;
  };
  subTab?: string;
}

export default function SupportDashboard({ user, subTab }: SupportDashboardProps) {
  const [viewMode, setViewMode] = useState<'visitas' | 'clientes' | 'cambios_ip' | 'antenas' | 'vlans'>((subTab as any) || 'visitas');

  useEffect(() => {
    if (subTab) {
      setViewMode(subTab as any);
    }
  }, [subTab]);
  const [visitas, setVisitas] = useState<Visit[]>([]);
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [tecnicos, setTecnicos] = useState<UserTech[]>([]);
  const [regiones, setRegiones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Filtros
  const [search, setSearch] = useState('');
  const [filtroRegion, setFiltroRegion] = useState('Todas');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroTecnico, setFiltroTecnico] = useState('Todos');

  // Modal para Crear Visita
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchModal, setCustomerSearchModal] = useState('');
  const [selectedTecnicoId, setSelectedTecnicoId] = useState<string>('');
  const [prioridad, setPrioridad] = useState<'Baja' | 'Normal' | 'Urgente'>('Normal');
  const [motivoReporte, setMotivoReporte] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal para Crear Cliente
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustData, setNewCustData] = useState({
    nombre: '',
    ip: '',
    tipo_servicio: 'Fibra' as 'Antena' | 'Fibra',
    plan: 'Estándar',
    region: 'RB-OLT-Actopan',
    direccion: '',
  });
  const [submittingCust, setSubmittingCust] = useState(false);

  // Modal para Asignar Técnico a Visita Existente
  const [assigningVisit, setAssigningVisit] = useState<Visit | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search);
      if (filtroRegion !== 'Todas') params.append('region', filtroRegion);
      if (filtroTipo !== 'Todos') params.append('tipo', filtroTipo);
      if (filtroEstado !== 'Todos') params.append('estado', filtroEstado);
      if (filtroTecnico !== 'Todos') params.append('tecnicoId', filtroTecnico);

      const [resVisits, resCust, resUsers] = await Promise.all([
        fetch(`/api/visits?${params.toString()}`),
        fetch(`/api/customers`),
        fetch(`/api/users`),
      ]);

      const dataVisits = await resVisits.json();
      const dataCust = await resCust.json();
      const dataUsers = await resUsers.json();

      if (dataVisits.visitas) setVisitas(dataVisits.visitas);
      if (dataCust.customers) setClientes(dataCust.customers);
      if (dataCust.regiones) setRegiones(dataCust.regiones);
      if (dataUsers.users) {
        const techs = dataUsers.users.filter((u: any) => u.rol === 'TECNICO' && u.activo === 1);
        setTecnicos(techs);
      }
    } catch (err) {
      console.error('Error cargando datos de Soporte:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, filtroRegion, filtroTipo, filtroEstado, filtroTecnico]);

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !motivoReporte.trim()) {
      notify('Por favor selecciona un cliente e ingresa el motivo del reporte', 'warning', 'Campos requeridos');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: selectedCustomer.id,
          tecnico_id: selectedTecnicoId ? Number(selectedTecnicoId) : null,
          prioridad,
          motivo_reporte: motivoReporte,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setSelectedCustomer(null);
        setMotivoReporte('');
        setSelectedTecnicoId('');
        loadData();
        notify('Orden de visita creada correctamente', 'success');
      } else {
        const data = await res.json();
        notify(data.error || 'Error al crear orden de visita', 'error');
      }
    } catch (err) {
      notify('Error de conexión al servidor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTechnician = async (visitId: number, techId: string) => {
    try {
      const res = await fetch(`/api/visits/${visitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tecnico_id: techId ? Number(techId) : null,
        }),
      });
      if (res.ok) {
        setAssigningVisit(null);
        loadData();
        notify('Técnico asignado correctamente', 'success');
      } else {
        notify('Error al reasignar técnico', 'error');
      }
    } catch (err) {
      notify('Error al reasignar técnico', 'error');
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustData.nombre.trim() || !newCustData.region.trim()) {
      notify('Nombre y Región (Router) son obligatorios', 'warning', 'Campos requeridos');
      return;
    }
    try {
      setSubmittingCust(true);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustData),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCustomerModal(false);
        setNewCustData({
          nombre: '',
          ip: '',
          tipo_servicio: 'Fibra',
          plan: 'Estándar',
          region: regiones[0] || 'RB-OLT-Actopan',
          direccion: '',
        });
        loadData();
        notify('Cliente registrado correctamente', 'success');
      } else {
        notify(data.error || 'Error al registrar cliente', 'error');
      }
    } catch (err) {
      notify('Error de conexión', 'error');
    } finally {
      setSubmittingCust(false);
    }
  };

  const filteredCustomersForModal = clientes.filter(c =>
    c.nombre.toLowerCase().includes(customerSearchModal.toLowerCase()) ||
    (c.ip && c.ip.includes(customerSearchModal)) ||
    (c.region && c.region.toLowerCase().includes(customerSearchModal.toLowerCase()))
  );

  return (
    <div className="space-y-5 pb-20">
      {viewMode === 'clientes' ? (
        <CustomersManager
          user={user}
          onOpenCreateVisitForCustomer={(c) => {
            setSelectedCustomer(c);
            setShowCreateModal(true);
            setViewMode('visitas');
          }}
        />
      ) : viewMode === 'cambios_ip' ? (
        <IpChangesManager user={user} />
      ) : viewMode === 'antenas' ? (
        <AntennasTopologyManager user={user} />
      ) : viewMode === 'vlans' ? (
        <VlanIpManager user={user} />
      ) : (
        <>
          {/* Action Bar Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                🎧 Panel de Soporte Técnico
              </h2>
              <p className="text-xs text-slate-400">
                Creación de tickets, asignación de visitas y monitoreo de diagnósticos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {(user.rol === 'SUPERADMIN' || user.rol === 'SOPORTE') && (
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-950 transition active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  <span>Nuevo Cliente</span>
                </button>
              )}

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 sm:flex-none bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-950 transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nueva Visita Técnica</span>
              </button>
            </div>
          </div>

      {/* Buscador y Filtros Avanzados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Cliente, IP o Dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={filtroRegion}
          onChange={(e) => setFiltroRegion(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500"
        >
          <option value="Todas">Todas las Regiones / Routers</option>
          {regiones.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500"
        >
          <option value="Todos">Todas las Tecnologías</option>
          <option value="Antena">📡 Antena</option>
          <option value="Fibra">🔌 Fibra Óptica</option>
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500"
        >
          <option value="Todos">Todos los Estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Completada">Completada</option>
        </select>
      </div>

      {/* Lista de Visitas / Órdenes */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
          Cargando listado de visitas...
        </div>
      ) : visitas.length === 0 ? (
        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 mx-auto text-sky-500/60" />
          <h3 className="text-slate-300 font-bold text-base">No hay visitas registradas</h3>
          <p className="text-xs text-slate-500">Crea una nueva orden de visita con el botón superior.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visitas.map((v) => {
            const isAntena = v.cliente_tipo_servicio === 'Antena';
            const isUrgente = v.prioridad === 'Urgente';

            return (
              <div
                key={v.id}
                className={`bg-slate-900 border rounded-2xl p-4 shadow-md flex flex-col justify-between transition hover:border-slate-700 ${
                  isUrgente && v.estado_visita !== 'Completada'
                    ? 'border-red-500/60'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Encabezado con Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isAntena ? (
                        <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          📡 Antena
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          🔌 Fibra Óptica
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

                  {/* Nombre del Cliente & Datos */}
                  <h3 className="font-bold text-base text-white">{v.cliente_nombre}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-1">
                    {v.cliente_ip && <span className="text-sky-400 font-mono">IP: {v.cliente_ip}</span>}
                    <span>• Region: {v.cliente_region}</span>
                  </div>

                  {v.cliente_direccion && (
                    <p className="text-xs text-slate-400 flex items-start gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span>{v.cliente_direccion}</span>
                    </p>
                  )}

                  {/* Motivo */}
                  <div className="mt-2.5 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Motivo del reporte:</span>
                    <p className="text-slate-200 mt-0.5">{v.motivo_reporte}</p>
                  </div>

                  {/* Diagnóstico si existe */}
                  {v.diagnostico_tecnico && (
                    <div className="mt-2 p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-900/60 text-xs">
                      <span className="text-emerald-400 font-bold block text-[10px] uppercase">Diagnóstico del Técnico:</span>
                      <p className="text-emerald-200 mt-0.5">{v.diagnostico_tecnico}</p>
                    </div>
                  )}
                </div>

                {/* Footer asignación técnico */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-400">
                    Técnico: <strong className="text-slate-200">{v.tecnico_nombre || 'Sin Asignar'}</strong>
                  </div>

                  <button
                    onClick={() => setAssigningVisit(v)}
                    className="bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition"
                  >
                    {v.tecnico_nombre ? 'Reasignar' : 'Asignar Técnico'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear Nueva Visita */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-sky-400" />
                Crear Orden de Visita Técnica
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="space-y-4">
              {/* Seleccionar Cliente */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  1. Buscar y Seleccionar Cliente <span className="text-red-400">*</span>
                </label>

                {selectedCustomer ? (
                  <div className="p-3 bg-sky-950/60 border border-sky-500/50 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{selectedCustomer.nombre}</h4>
                      <p className="text-xs text-sky-300">
                        {selectedCustomer.tipo_servicio === 'Antena' ? '📡 Antena' : '🔌 Fibra'} | IP: {selectedCustomer.ip || 'S/N'} | {selectedCustomer.region}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-xs text-red-400 hover:underline font-medium"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Escribe el nombre o IP del cliente para filtrar..."
                      value={customerSearchModal}
                      onChange={(e) => setCustomerSearchModal(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />

                    <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 divide-y divide-slate-900">
                      {filteredCustomersForModal.slice(0, 30).map((c) => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCustomer(c)}
                          className="p-2.5 hover:bg-slate-900 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-200">{c.nombre}</span>
                            <div className="text-[10px] text-slate-400">
                              {c.ip && `IP: ${c.ip} • `} Router: {c.region}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              c.tipo_servicio === 'Antena'
                                ? 'bg-blue-950 text-blue-300'
                                : 'bg-emerald-950 text-emerald-300'
                            }`}
                          >
                            {c.tipo_servicio}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Asignar Técnico */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  2. Asignar Técnico de Campo (Opcional)
                </label>
                <select
                  value={selectedTecnicoId}
                  onChange={(e) => setSelectedTecnicoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">Dejar sin asignar (Cualquier técnico de la zona)</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} ({t.region_asignada || 'Todas'} - Esp: {t.especialidad || 'Ambos'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">3. Nivel de Prioridad</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Baja', 'Normal', 'Urgente'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrioridad(p)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                        prioridad === p
                          ? p === 'Urgente'
                            ? 'bg-red-600 text-white border-red-500 shadow-md'
                            : 'bg-sky-600 text-white border-sky-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {p === 'Urgente' ? '🚨 Urgente' : p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motivo del reporte */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  4. Motivo de la Visita / Falla Reportada <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe la falla reportada por el cliente..."
                  value={motivoReporte}
                  onChange={(e) => setMotivoReporte(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-sky-950 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <span>Crear Orden</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reasignar Técnico */}
      {assigningVisit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Asignar Técnico a Visita #{assigningVisit.id}</h3>
              <button onClick={() => setAssigningVisit(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">Cliente: <strong className="text-white">{assigningVisit.cliente_nombre}</strong></p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Selecciona el Técnico:</label>
              <select
                defaultValue={assigningVisit.tecnico_id || ''}
                onChange={(e) => handleAssignTechnician(assigningVisit.id, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
              >
                <option value="">-- Sin Asignar --</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({t.region_asignada || 'Todas'} - Esp: {t.especialidad || 'Ambos'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Nuevo Cliente Manualmente */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Registrar Nuevo Cliente
              </h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Completo del Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: María López"
                  value={newCustData.nombre}
                  onChange={(e) => setNewCustData({ ...newCustData, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Dirección IP</label>
                  <input
                    type="text"
                    placeholder="Ej: 192.168.1.50"
                    value={newCustData.ip}
                    onChange={(e) => setNewCustData({ ...newCustData, ip: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tecnología</label>
                  <select
                    value={newCustData.tipo_servicio}
                    onChange={(e: any) => setNewCustData({ ...newCustData, tipo_servicio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Fibra">🔌 Fibra Óptica</option>
                    <option value="Antena">📡 Antena</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Región / Router Asignado *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: RB-OLT-Actopan"
                    value={newCustData.region}
                    onChange={(e) => setNewCustData({ ...newCustData, region: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Plan Contratado</label>
                  <input
                    type="text"
                    placeholder="Ej: 50 Megas"
                    value={newCustData.plan}
                    onChange={(e) => setNewCustData({ ...newCustData, plan: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Dirección / Ubicación</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Hidalgo #123, Col. Centro"
                  value={newCustData.direccion}
                  onChange={(e) => setNewCustData({ ...newCustData, direccion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCust}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-purple-950 flex items-center gap-1.5"
                >
                  {submittingCust ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cliente</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
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
