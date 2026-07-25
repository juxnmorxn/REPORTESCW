'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  X, 
  Radio, 
  Zap, 
  Copy, 
  Check, 
  Loader2, 
  SlidersHorizontal,
  Building,
  ShieldCheck,
  AlertCircle,
  Printer
} from 'lucide-react';
import NotificationModal from './NotificationModal';

interface IpChange {
  id: number;
  cliente_id: number | null;
  cliente_nombre: string;
  region: string;
  ip_anterior: string;
  ip_nueva: string;
  ap_anterior: string;
  ap_nuevo: string;
  motivo_notas: string;
  registrado_por: string;
  sincronizado_wisphub: number;
  fecha_cambio: string;
}

interface CustomerOption {
  id: number;
  nombre: string;
  ip: string;
  region: string;
  direccion?: string;
  plan?: string;
  tipo_servicio?: string;
}

interface IpChangesManagerProps {
  user: {
    id: number;
    nombre: string;
    email_o_usuario: string;
    rol: 'SUPERADMIN' | 'SOPORTE' | 'TECNICO';
  };
}

export default function IpChangesManager({ user }: IpChangesManagerProps) {
  const [cambios, setCambios] = useState<IpChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendientesCount, setPendientesCount] = useState(0);

  // Regiones reales desde la base de datos
  const [regionesList, setRegionesList] = useState<string[]>([]);

  // Filtros
  const [search, setSearch] = useState('');
  const [filtroRegion, setFiltroRegion] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('0'); // Default: '0' (Pendientes)

  // Clientes para autocomplete inteligente
  const [customersList, setCustomersList] = useState<CustomerOption[]>([]);
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

  // Modal Registrar Cambio
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    region: 'RB-PIEDRADELHONGO',
    ip_anterior: '',
    ip_nueva: '',
    ap_anterior: '',
    ap_nuevo: '',
    motivo_notas: '',
    auto_update_cliente: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Copiado al portapapeles
  const [copied, setCopied] = useState(false);

  // Modal Notificaciones
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

  // Cargar regiones reales desde el servidor
  useEffect(() => {
    fetch('/api/customers?limit=1')
      .then((r) => r.json())
      .then((d) => {
        if (d.regiones && Array.isArray(d.regiones)) {
          setRegionesList(d.regiones);
          if (d.regiones.length > 0) {
            setFormData((prev) => ({ ...prev, region: d.regiones[0] }));
          }
        }
      })
      .catch(console.error);
  }, []);

  const fetchCambios = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search);
      if (filtroRegion !== 'Todas') params.append('region', filtroRegion);
      if (filtroEstado !== 'todos') params.append('sincronizado', filtroEstado);

      const res = await fetch(`/api/ip-changes?${params.toString()}`);
      const data = await res.json();

      if (data.cambios) setCambios(data.cambios);
      if (data.pendientesCount !== undefined) setPendientesCount(data.pendientesCount);
      if (data.regiones && Array.isArray(data.regiones)) {
        setRegionesList(data.regiones);
        if (data.regiones.length > 0 && !formData.region) {
          setFormData((prev) => ({ ...prev, region: data.regiones[0] }));
        }
      }
    } catch (err) {
      console.error('Error al cargar bitácora de cambios de IP:', err);
    } finally {
      setLoading(false);
    }
  };

  // Motor de Búsqueda Autocomplete Inteligente (Nombre o IP parcial)
  useEffect(() => {
    if (customerQuery.trim().length > 1) {
      fetch(`/api/customers?search=${encodeURIComponent(customerQuery)}&limit=15`)
        .then((r) => r.json())
        .then((d) => {
          if (d.customers) setCustomersList(d.customers);
        })
        .catch(console.error);
    } else {
      setCustomersList([]);
    }
  }, [customerQuery]);

  useEffect(() => {
    fetchCambios();
  }, [search, filtroRegion, filtroEstado]);

  // AUTO-LLENADO AUTOMÁTICO DE TODOS LOS CAMPOS AL SELECCIONAR UN CLIENTE
  const handleSelectCustomer = (c: CustomerOption) => {
    setSelectedCustomer(c);

    // Calcular prefijo de subred si existe IP
    let subnetPrefix = '';
    if (c.ip && c.ip.includes('.')) {
      subnetPrefix = c.ip.substring(0, c.ip.lastIndexOf('.') + 1);
    }

    setFormData((prev) => ({
      ...prev,
      cliente_nombre: c.nombre,
      ip_anterior: c.ip || '',
      ip_nueva: subnetPrefix || prev.ip_nueva,
      region: c.region || prev.region,
      motivo_notas: `Mantenimiento en campo en región ${c.region || ''} - Cambio de IP / AP`,
    }));
    setCustomerQuery(c.nombre);
    setCustomersList([]);
  };

  const handleOpenNewModal = () => {
    setSelectedCustomer(null);
    setCustomerQuery('');
    setFormData({
      cliente_nombre: '',
      region: regionesList.length > 0 ? regionesList[0] : 'RB-PIEDRADELHONGO',
      ip_anterior: '',
      ip_nueva: '',
      ap_anterior: '',
      ap_nuevo: '',
      motivo_notas: 'Mantenimiento preventivo en campo / Reconfiguración de antena',
      auto_update_cliente: true,
    });
    setShowModal(true);
  };

  const handleSaveChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = selectedCustomer ? selectedCustomer.nombre : formData.cliente_nombre.trim();

    if (!nombre || !formData.ip_nueva.trim() || !formData.region.trim()) {
      notify('Nombre del Cliente, Nueva IP y Región son obligatorios.', 'warning', 'Campos vacíos');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/ip-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cliente_id: selectedCustomer ? selectedCustomer.id : null,
          cliente_nombre: nombre,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        fetchCambios();
        notify('Cambio de IP/AP registrado en bitácora correctamente.', 'success', 'Bitácora Actualizada');
      } else {
        notify(data.error || 'Error al guardar el registro', 'error');
      }
    } catch (err) {
      notify('Error de conexión con el servidor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSincronizado = async (c: IpChange) => {
    try {
      setTogglingId(c.id);
      const newStatus = c.sincronizado_wisphub === 1 ? 0 : 1;
      const res = await fetch('/api/ip-changes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, sincronizado_wisphub: newStatus }),
      });

      if (res.ok) {
        fetchCambios();
        notify(
          newStatus ? 'Registro marcado como "Aplicado en WispHub".' : 'Registro marcado como "Pendiente".',
          'success'
        );
      } else {
        notify('Error al actualizar estado en WispHub', 'error');
      }
    } catch (err) {
      notify('Error de conexión', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCopyPendientes = () => {
    const pendientes = cambios.filter((c) => c.sincronizado_wisphub === 0);
    if (pendientes.length === 0) {
      notify('No hay cambios pendientes de actualizar en WispHub.', 'info');
      return;
    }

    const texto = pendientes
      .map(
        (c, i) =>
          `${i + 1}. ${c.cliente_nombre} (${c.region})\n   - IP Anterior: ${c.ip_anterior || 'N/A'} ➔ Nueva IP: ${c.ip_nueva}\n   - AP Anterior: ${c.ap_anterior || 'N/A'} ➔ Nuevo AP: ${c.ap_nuevo || 'N/A'}\n   - Notas: ${c.motivo_notas || 'Sin notas'}`
      )
      .join('\n\n');

    navigator.clipboard.writeText(`📋 PENDIENTES DE ACTUALIZAR EN WISPHUB (${pendientes.length}):\n\n` + texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    notify(`Se copiaron ${pendientes.length} registros pendientes al portapapeles.`, 'success');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Resumen y Acciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            🔄 Bitácora de Cambio de IPs y APs en Campo
          </h2>
          <p className="text-xs text-slate-400">
            Documentación de cambios de IP y antenas en mantenimientos de campo para actualización posterior en WispHub.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
            title="Exportar bitácora a PDF o Imprimir"
          >
            <Printer className="w-4 h-4 text-purple-400" />
            <span>Exportar PDF</span>
          </button>

          <button
            onClick={handleCopyPendientes}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
            title="Copiar lista de cambios pendientes para WispHub"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Pendientes WispHub'}</span>
          </button>

          <button
            onClick={fetchCambios}
            title="Refrescar lista"
            className="p-2.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenNewModal}
            className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-950 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Cambio IP/AP</span>
          </button>
        </div>
      </div>

      {/* Banner de Estado WispHub */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Cambios Documentados</span>
          <div className="text-xl font-black text-white mt-0.5">{cambios.length}</div>
        </div>

        <div className="bg-slate-900 border border-amber-900/40 bg-amber-950/20 p-3 rounded-2xl shadow-md">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pendientes de aplicar en WispHub
          </span>
          <div className="text-xl font-black text-amber-300 mt-0.5">{pendientesCount}</div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 bg-emerald-950/20 p-3 rounded-2xl shadow-md">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Sincronizados con WispHub
          </span>
          <div className="text-xl font-black text-emerald-300 mt-0.5">
            {cambios.filter((c) => c.sincronizado_wisphub === 1).length}
          </div>
        </div>
      </div>

      {/* Barra de Filtros con Buscador Parcial de IP & Regiones Dinámicas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Nombre, IP (ej: 172.19, .8.10), AP o Notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>

        {/* Desplegable Dinámico de Regiones Reales */}
        <select
          value={filtroRegion}
          onChange={(e) => setFiltroRegion(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 font-medium"
        >
          <option value="Todas">Todas las Regiones / Routers ({regionesList.length})</option>
          {regionesList.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 font-medium"
        >
          <option value="0">⏳ Pendientes de WispHub</option>
          <option value="1">✅ Aplicados en WispHub</option>
          <option value="todos">Todos los registros</option>
        </select>
      </div>

      {/* Tabla Bitácora */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse space-y-2">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-500" />
          <p>Cargando bitácora de cambios de IP/AP...</p>
        </div>
      ) : cambios.length === 0 ? (
        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-2">
          <ShieldCheck className="w-10 h-10 mx-auto text-amber-500/60" />
          <h3 className="text-slate-300 font-bold text-base">No hay registros de cambio de IP</h3>
          <p className="text-xs text-slate-500">Registra un nuevo cambio realizado en campo cuando hagas mantenimiento.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4">Fecha & Hora</th>
                  <th className="py-3 px-4">Cliente / Región</th>
                  <th className="py-3 px-4">IP Anterior ➔ Nueva IP</th>
                  <th className="py-3 px-3">AP / Sector</th>
                  <th className="py-3 px-3">Registrado Por</th>
                  <th className="py-3 px-3 text-center">Estado WispHub</th>
                  <th className="py-3 px-3 text-right">Acción WispHub</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {cambios.map((c, idx) => {
                  const isDone = c.sincronizado_wisphub === 1;
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 text-center text-slate-500 font-mono font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(c.fecha_cambio).toLocaleString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-white">{c.cliente_nombre}</div>
                        <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {c.region}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 line-through">{c.ip_anterior || 'Sin IP'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-300 font-extrabold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                            {c.ip_nueva}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                        {c.ap_nuevo ? (
                          <div className="flex items-center gap-1">
                            <Radio className="w-3 h-3 text-sky-400" />
                            <span>{c.ap_nuevo}</span>
                            {c.ap_anterior && <span className="text-[10px] text-slate-500">(Previo: {c.ap_anterior})</span>}
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">{c.registrado_por}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Aplicado en WispHub
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                            <Clock className="w-3 h-3 animate-pulse" /> Pendiente WispHub
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleToggleSincronizado(c)}
                          disabled={togglingId === c.id}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 justify-end ml-auto disabled:opacity-50 ${
                            isDone
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950'
                          }`}
                        >
                          {togglingId === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isDone ? (
                            <span>Marcar Pendiente</span>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Marcar Aplicado</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Registrar Cambio de IP / AP con Autocomplete Inteligente */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-400" />
                Registrar Cambio de IP / AP en Campo
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChange} className="space-y-3">
              {/* Autocomplete de Cliente (Búsqueda por Nombre o IP Parcial) */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Buscar por Nombre o IP Parcial (ej: 172.19, Manuel, etc.) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Escribe Nombre o IP parcial..."
                  value={customerQuery || formData.cliente_nombre}
                  onChange={(e) => {
                    setCustomerQuery(e.target.value);
                    setFormData({ ...formData, cliente_nombre: e.target.value });
                    setSelectedCustomer(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />

                {customersList.length > 0 && (
                  <div className="absolute z-10 w-full bg-slate-900 border border-slate-800 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-2xl divide-y divide-slate-800">
                    {customersList.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className="p-2.5 hover:bg-amber-950/30 cursor-pointer text-xs flex items-center justify-between transition"
                      >
                        <div>
                          <strong className="text-white block">{c.nombre}</strong>
                          <span className="text-[10px] text-slate-400">
                            {c.region} • {c.plan || c.tipo_servicio}
                          </span>
                        </div>
                        <span className="text-amber-400 font-mono text-[11px] font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                          {c.ip || 'Sin IP'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Región / Router *</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-amber-500 font-medium"
                >
                  {regionesList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">IP Anterior (Auto-llenado)</label>
                  <input
                    type="text"
                    placeholder="Ej: 172.19.8.100"
                    value={formData.ip_anterior}
                    onChange={(e) => setFormData({ ...formData, ip_anterior: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">IP Nueva *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 172.19.8.150"
                    value={formData.ip_nueva}
                    onChange={(e) => setFormData({ ...formData, ip_nueva: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">AP Previo (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: AP-Sector-North"
                    value={formData.ap_anterior}
                    onChange={(e) => setFormData({ ...formData, ap_anterior: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nuevo AP / Sector (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: AP-PiedraHongo-Sec2"
                    value={formData.ap_nuevo}
                    onChange={(e) => setFormData({ ...formData, ap_nuevo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notas / Motivo del Cambio</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el cambio manual en campo..."
                  value={formData.motivo_notas}
                  onChange={(e) => setFormData({ ...formData, motivo_notas: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="auto_update"
                  checked={formData.auto_update_cliente}
                  onChange={(e) => setFormData({ ...formData, auto_update_cliente: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-800 text-amber-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="auto_update" className="text-xs text-slate-300 cursor-pointer font-medium">
                  Actualizar IP en el perfil del cliente en el sistema inmediatamente
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-950 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Registrar Cambio</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Notificación */}
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
