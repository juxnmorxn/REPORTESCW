'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  X, 
  Radio, 
  Zap, 
  Ticket, 
  ArrowUpDown, 
  List, 
  LayoutGrid, 
  Loader2, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  UserCheck,
  CheckSquare,
  Square,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import NotificationModal from './NotificationModal';

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

interface CustomersManagerProps {
  user: {
    id: number;
    nombre: string;
    email_o_usuario: string;
    rol: 'SUPERADMIN' | 'SOPORTE' | 'TECNICO';
  };
  onOpenCreateVisitForCustomer?: (customer: Customer) => void;
}

export default function CustomersManager({ user, onOpenCreateVisitForCustomer }: CustomersManagerProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [regiones, setRegiones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Selección de Clientes para Asignación Masiva
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
  const [tecnicosList, setTecnicosList] = useState<{ id: number; nombre: string; region_asignada?: string }[]>([]);

  // Vista (Tabla vs Tarjetas)
  const [viewStyle, setViewStyle] = useState<'table' | 'grid'>('table');

  // Filtros, Orden y Paginación
  const [search, setSearch] = useState('');
  const [filtroRegion, setFiltroRegion] = useState('Todas');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC'); // ASC: 1 al N, DESC: N al 1
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);

  // Modal Crear / Editar Cliente
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ip: '',
    tipo_servicio: 'Fibra' as 'Antena' | 'Fibra',
    plan: 'Estándar 50M',
    region: 'RB-OLT-Actopan',
    direccion: '',
    estado: 'Activo',
  });
  const [submitting, setSubmitting] = useState(false);

  // Modal Cambio Directo de IP/AP desde la tabla
  const [showIpModal, setShowIpModal] = useState(false);
  const [ipFormData, setIpFormData] = useState({
    cliente_id: 0,
    cliente_nombre: '',
    region: '',
    ip_anterior: '',
    ip_nueva: '',
    ap_anterior: '',
    ap_nuevo: '',
    motivo_notas: '',
    auto_update_cliente: true,
  });
  const [submittingIp, setSubmittingIp] = useState(false);

  // Modal Asignación Masiva de Visitas por Lote a un Técnico
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchFormData, setBatchFormData] = useState({
    tecnico_id: '',
    prioridad: 'Normal',
    motivo_reporte: 'Revisión masiva de antenas y mantenimientos en campo',
  });
  const [submittingBatch, setSubmittingBatch] = useState(false);

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

  // Cargar lista de técnicos registrados
  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => {
        if (d.users) {
          setTecnicosList(d.users.filter((u: any) => u.rol === 'TECNICO' || u.rol === 'SUPERADMIN'));
        }
      })
      .catch(console.error);
  }, []);

  const cacheCustomersLocally = (data: Customer[]) => {
    try {
      localStorage.setItem('cached_customers', JSON.stringify(data));
    } catch (e) {
      console.error('Error al guardar en caché local:', e);
    }
  };

  const getLocalCachedCustomers = async (): Promise<Customer[]> => {
    const data = localStorage.getItem('cached_customers');
    return data ? JSON.parse(data) : [];
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search);
      if (filtroRegion !== 'Todas') params.append('region', filtroRegion);
      if (filtroTipo !== 'Todos') params.append('tipo', filtroTipo);
      if (filtroEstado !== 'Todos') params.append('estado', filtroEstado);
      params.append('sortDir', sortDir);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();

      if (data.customers) {
        setCustomers(data.customers);
        cacheCustomersLocally(data.customers);
      }
      if (data.regiones) setRegiones(data.regiones);
      if (data.total !== undefined) setTotal(data.total);
      if (data.totalPages !== undefined) setTotalPages(data.totalPages);
    } catch (err) {
      console.warn('Sin conexión. Cargando directorio de clientes desde memoria offline...');
      const local = await getLocalCachedCustomers();
      if (local.length > 0) {
        setCustomers(local);
        setTotal(local.length);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, filtroRegion, filtroTipo, filtroEstado, sortDir, page, limit]);

  // Manejo de Selección de Clientes para Lote
  const toggleSelectCustomer = (id: number) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllOnPage = () => {
    const currentIds = customers.map((c) => c.id);
    const allSelected = currentIds.every((id) => selectedCustomerIds.includes(id));
    if (allSelected) {
      setSelectedCustomerIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      setSelectedCustomerIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleOpenNewModal = () => {
    setEditingCustomer(null);
    setFormData({
      nombre: '',
      ip: '',
      tipo_servicio: 'Fibra',
      plan: 'Estándar 50M',
      region: regiones.length > 0 ? regiones[0] : 'RB-OLT-Actopan',
      direccion: '',
      estado: 'Activo',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      nombre: c.nombre,
      ip: c.ip || '',
      tipo_servicio: c.tipo_servicio,
      plan: c.plan || '',
      region: c.region,
      direccion: c.direccion || '',
      estado: c.estado,
    });
    setShowModal(true);
  };

  // Abrir modal de Cambio de IP de 1-clic para un cliente
  const handleOpenIpChangeForCustomer = (c: Customer) => {
    let subnetPrefix = '';
    if (c.ip && c.ip.includes('.')) {
      subnetPrefix = c.ip.substring(0, c.ip.lastIndexOf('.') + 1);
    }

    setIpFormData({
      cliente_id: c.id,
      cliente_nombre: c.nombre,
      region: c.region,
      ip_anterior: c.ip || '',
      ip_nueva: subnetPrefix || '',
      ap_anterior: c.tipo_servicio || '',
      ap_nuevo: '',
      motivo_notas: `Cambio de IP/AP en campo para cliente ${c.nombre} (#${c.id})`,
      auto_update_cliente: true,
    });
    setShowIpModal(true);
  };

  const handleSaveIpChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipFormData.ip_nueva.trim()) {
      notify('Debes ingresar la nueva IP', 'warning');
      return;
    }

    try {
      setSubmittingIp(true);
      const res = await fetch('/api/ip-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ipFormData),
      });

      const data = await res.json();
      if (res.ok) {
        setShowIpModal(false);
        fetchCustomers();
        notify('Cambio de IP/AP registrado e historiado correctamente', 'success', 'Bitácora Actualizada');
      } else {
        notify(data.error || 'Error al guardar cambio de IP', 'error');
      }
    } catch (err) {
      notify('Error de conexión', 'error');
    } finally {
      setSubmittingIp(false);
    }
  };

  // Guardar Lote de Visitas Asignadas a un Técnico
  const handleSaveBatchVisits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomerIds.length === 0) return;

    if (!batchFormData.motivo_reporte.trim()) {
      notify('Especifica el motivo o detalles de la revisión en campo.', 'warning');
      return;
    }

    try {
      setSubmittingBatch(true);
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_ids: selectedCustomerIds,
          tecnico_id: batchFormData.tecnico_id ? Number(batchFormData.tecnico_id) : null,
          prioridad: batchFormData.prioridad,
          motivo_reporte: batchFormData.motivo_reporte,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowBatchModal(false);
        const count = selectedCustomerIds.length;
        setSelectedCustomerIds([]);
        notify(
          `Se crearon y enviaron ${count} órdenes de visita al técnico seleccionado.`,
          'success',
          'Lote de Mantenimiento Creado'
        );
      } else {
        notify(data.error || 'Error al asignar el lote de visitas', 'error');
      }
    } catch (err) {
      notify('Error de conexión', 'error');
    } finally {
      setSubmittingBatch(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.region.trim()) {
      notify('Nombre y Región son obligatorios', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const isEdit = !!editingCustomer;
      const url = '/api/customers';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { ...formData, id: editingCustomer.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        fetchCustomers();
        notify(`Cliente ${isEdit ? 'actualizado' : 'registrado'} correctamente`, 'success');
      } else {
        notify(data.error || 'Error al guardar cliente', 'error');
      }
    } catch (err) {
      notify('Error de conexión con el servidor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);
  const allCurrentPageSelected =
    customers.length > 0 && customers.every((c) => selectedCustomerIds.includes(c.id));

  return (
    <div className="space-y-4 pb-20">
      {/* Header Resumen y Acciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            📋 Directorio General de Clientes ({total})
          </h2>
          <p className="text-xs text-slate-400">
            Selección múltiple por lote para asignación masiva de revisiones a un técnico por región.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Alternar Vista Tabla vs Grid */}
          <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewStyle('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewStyle === 'table' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista de Lista (Tabla)"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">Lista</span>
            </button>
            <button
              onClick={() => setViewStyle('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewStyle === 'grid' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista de Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Tarjetas</span>
            </button>
          </div>

          {/* Botón de Orden ASC / DESC */}
          <button
            onClick={() => setSortDir((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))}
            className="p-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            title={sortDir === 'ASC' ? 'Ordenando del 1 al N' : 'Ordenando del N al 1'}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortDir === 'ASC' ? '1 ➔ N' : 'N ➔ 1'}</span>
          </button>

          <button
            onClick={fetchCustomers}
            title="Refrescar lista"
            className="p-2.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {(user.rol === 'SUPERADMIN' || user.rol === 'SOPORTE') && (
            <button
              onClick={handleOpenNewModal}
              className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-950 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* BANNER FLOTANTE DE ACCIÓN MASIVA DE LOTE CUANDO HAY SELECCIÓN */}
      {selectedCustomerIds.length > 0 && (
        <div className="bg-sky-950/90 border border-sky-500/50 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl animate-pulse-red">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 border border-sky-400/40 rounded-xl text-sky-300">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                {selectedCustomerIds.length} Clientes Seleccionados para Revisión
              </h3>
              <p className="text-xs text-sky-300">
                Puedes enviar esta lista de antenas con problema como un lote de trabajo a un solo técnico de región.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCustomerIds([])}
              className="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 rounded-xl border border-slate-700"
            >
              Desmarcar Todo
            </button>
            <button
              onClick={() => {
                setBatchFormData((prev) => ({
                  ...prev,
                  motivo_reporte: `Revisión masiva de antenas con señal deficiente (${selectedCustomerIds.length} clientes en región ${filtroRegion})`,
                }));
                setShowBatchModal(true);
              }}
              className="bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <Wrench className="w-4 h-4" />
              <span>Asignar Lote a un Técnico</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros Multicampo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Nombre, IP, Plan o Dirección..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
          />
        </div>

        <select
          value={filtroRegion}
          onChange={(e) => {
            setFiltroRegion(e.target.value);
            setPage(1);
          }}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500 font-medium"
        >
          <option value="Todas">Todas las Regiones ({regiones.length})</option>
          {regiones.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={filtroTipo}
          onChange={(e) => {
            setFiltroTipo(e.target.value);
            setPage(1);
          }}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500 font-medium"
        >
          <option value="Todos">Todas las Tecnologías</option>
          <option value="Antena">📡 Antena</option>
          <option value="Fibra">🔌 Fibra Óptica</option>
        </select>

        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500 font-medium"
        >
          <option value={50}>50 por página</option>
          <option value={100}>100 por página</option>
          <option value={250}>250 por página</option>
          <option value={500}>500 por página</option>
        </select>
      </div>

      {/* Contenido Principal: VISTA DE TABLA LISTA (Default) o GRID */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse space-y-2">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-500" />
          <p>Cargando directorio de clientes...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-2">
          <Users className="w-10 h-10 mx-auto text-purple-500/60" />
          <h3 className="text-slate-300 font-bold text-base">No se encontraron clientes</h3>
          <p className="text-xs text-slate-500">Prueba ajustando los filtros de búsqueda o registra un nuevo cliente.</p>
        </div>
      ) : viewStyle === 'table' ? (
        /* VISTA DE LISTA / TABLA DE ALTA DENSIDAD CON CHECKBOX MASIVO */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      onClick={selectAllOnPage}
                      className="text-slate-400 hover:text-white"
                      title="Seleccionar todos los de esta página"
                    >
                      {allCurrentPageSelected ? (
                        <CheckSquare className="w-4 h-4 text-sky-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4">Cliente / Nombre</th>
                  <th className="py-3 px-3">IP</th>
                  <th className="py-3 px-3">Tecnología</th>
                  <th className="py-3 px-3">Plan</th>
                  <th className="py-3 px-3">Región / Router</th>
                  <th className="py-3 px-4">Dirección</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {customers.map((c, idx) => {
                  const numOrdinal = (page - 1) * limit + idx + 1;
                  const isAntena = c.tipo_servicio === 'Antena';
                  const isSelected = selectedCustomerIds.includes(c.id);

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isSelected ? 'bg-sky-950/40 font-bold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCustomer(c.id)}
                          className="w-4 h-4 rounded border-slate-700 text-sky-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono font-bold">{numOrdinal}</td>
                      <td className="py-2.5 px-4 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{c.nombre}</span>
                          <span className="text-[10px] text-slate-500 font-mono">#{c.id}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-sky-400 whitespace-nowrap">
                        {c.ip ? c.ip : <span className="text-slate-600">-</span>}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isAntena ? (
                          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[11px] px-2 py-0.5 rounded-full font-bold">
                            <Radio className="w-3 h-3" /> Antena
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] px-2 py-0.5 rounded-full font-bold">
                            <Zap className="w-3 h-3" /> Fibra
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{c.plan || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                          {c.region}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 max-w-xs truncate" title={c.direccion}>
                        {c.direccion || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* BOTÓN RÁPIDO 1-CLIC: CAMBIO DE IP / AP EN CAMPO */}
                          <button
                            onClick={() => handleOpenIpChangeForCustomer(c)}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] px-2 py-1 rounded-lg flex items-center gap-1 shadow transition active:scale-95"
                            title="Registrar cambio de IP/AP en campo para este cliente"
                          >
                            <Radio className="w-3.5 h-3.5" />
                            <span>Cambio IP</span>
                          </button>

                          {(user.rol === 'SUPERADMIN' || user.rol === 'SOPORTE') && (
                            <button
                              onClick={() => handleOpenEditModal(c)}
                              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                              title="Editar cliente"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onOpenCreateVisitForCustomer && (
                            <button
                              onClick={() => onOpenCreateVisitForCustomer(c)}
                              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow transition active:scale-95"
                              title="Crear reporte técnico para este cliente"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>Ticket</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA DE TARJETAS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {customers.map((c, idx) => {
            const numOrdinal = (page - 1) * limit + idx + 1;
            const isAntena = c.tipo_servicio === 'Antena';
            const isSelected = selectedCustomerIds.includes(c.id);

            return (
              <div
                key={c.id}
                className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition shadow-lg ${
                  isSelected ? 'border-sky-500 bg-sky-950/20' : 'border-slate-800 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectCustomer(c.id)}
                      className="w-4 h-4 rounded border-slate-700 text-sky-600 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">#{numOrdinal}</span>
                        <h3 className="font-bold text-white text-sm">{c.nombre}</h3>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 mt-1 inline-block">
                        {c.region}
                      </span>
                    </div>
                  </div>

                  {isAntena ? (
                    <span className="bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Radio className="w-3 h-3" /> Antena
                    </span>
                  ) : (
                    <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Fibra
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">IP</span>
                    <strong className="text-sky-400 text-xs">{c.ip || 'Sin IP'}</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 truncate">
                    <span className="text-[10px] text-slate-500 block uppercase">Plan</span>
                    <strong className="text-slate-300 text-xs">{c.plan || '-'}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleOpenIpChangeForCustomer(c)}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow transition"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Cambiar IP</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {(user.rol === 'SUPERADMIN' || user.rol === 'SOPORTE') && (
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onOpenCreateVisitForCustomer && (
                      <button
                        onClick={() => onOpenCreateVisitForCustomer(c)}
                        className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Ticket</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginador Backend */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow-xl">
        <div className="text-xs text-slate-400">
          Mostrando <strong className="text-white">{startRecord}</strong> - <strong className="text-white">{endRecord}</strong> de <strong className="text-white">{total}</strong> clientes
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="p-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl border border-slate-700 transition flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <span className="text-xs font-bold text-purple-400 px-3">
            Página {page} de {totalPages}
          </span>

          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="p-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl border border-slate-700 transition flex items-center gap-1"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal Lote: Asignación Masiva a un Técnico */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-sky-400" />
                Asignación Masiva de Visitas ({selectedCustomerIds.length} Clientes)
              </h3>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchVisits} className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-white block text-sm">
                  Lista de {selectedCustomerIds.length} Clientes Seleccionados
                </strong>
                <p className="text-xs text-slate-400">
                  Se generará una orden de visita individual para cada cliente y se enviarán directamente al técnico asignado.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Técnico Asignado para la Región *</label>
                <select
                  required
                  value={batchFormData.tecnico_id}
                  onChange={(e) => setBatchFormData({ ...batchFormData, tecnico_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-sky-500 font-medium"
                >
                  <option value="">-- Selecciona el Técnico para esta zona --</option>
                  {tecnicosList.map((t) => (
                    <option key={t.id} value={t.id}>
                      👤 {t.nombre} ({t.region_asignada || 'Todas las regiones'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Prioridad del Lote</label>
                <select
                  value={batchFormData.prioridad}
                  onChange={(e) => setBatchFormData({ ...batchFormData, prioridad: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-sky-500 font-medium"
                >
                  <option value="Normal">🟢 Normal</option>
                  <option value="Urgente">🔴 Urgente (Atención Inmediata)</option>
                  <option value="Baja">🔵 Baja</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Motivo / Instrucciones de la Revisión *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalles sobre los problemas de señal, antenas desalineadas o mantenimiento masivo..."
                  value={batchFormData.motivo_reporte}
                  onChange={(e) => setBatchFormData({ ...batchFormData, motivo_reporte: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingBatch}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-sky-950 flex items-center gap-1.5"
                >
                  {submittingBatch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Asignando...</span>
                    </>
                  ) : (
                    <span>Enviar Ruta al Técnico</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCustomer ? `Editar Cliente #${editingCustomer.id}` : 'Registrar Nuevo Cliente'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Manuel Morán"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Dirección IP</label>
                  <input
                    type="text"
                    placeholder="Ej: 192.168.10.45"
                    value={formData.ip}
                    onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tecnología *</label>
                  <select
                    value={formData.tipo_servicio}
                    onChange={(e) => setFormData({ ...formData, tipo_servicio: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-purple-500 font-medium"
                  >
                    <option value="Fibra">🔌 Fibra Óptica</option>
                    <option value="Antena">📡 Antena</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Región / Router *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: RB-OLT-Actopan"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Plan de Velocidad</label>
                <input
                  type="text"
                  placeholder="Ej: Pakete Basic 40M"
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Dirección / Ubicación</label>
                <textarea
                  rows={2}
                  placeholder="Calle, Número, Colonia, Municipio..."
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                />
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
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-purple-950 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Cambio Directo de IP / AP en Campo desde la Tabla */}
      {showIpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-400" />
                Cambio de IP / AP en Campo
              </h3>
              <button onClick={() => setShowIpModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIpChange} className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-white block text-sm">{ipFormData.cliente_nombre}</strong>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Región: <strong className="text-amber-400">{ipFormData.region}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">IP Actual</label>
                  <input
                    type="text"
                    disabled
                    value={ipFormData.ip_anterior || 'Sin IP'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">IP Nueva *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 172.19.8.150"
                    value={ipFormData.ip_nueva}
                    onChange={(e) => setIpFormData({ ...ipFormData, ip_nueva: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">AP Previo (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Sector North"
                    value={ipFormData.ap_anterior}
                    onChange={(e) => setIpFormData({ ...ipFormData, ap_anterior: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nuevo AP / Sector (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: AP-PiedraHongo-Sec2"
                    value={ipFormData.ap_nuevo}
                    onChange={(e) => setIpFormData({ ...ipFormData, ap_nuevo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notas del Cambio</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre la reconfiguración realizada..."
                  value={ipFormData.motivo_notas}
                  onChange={(e) => setIpFormData({ ...ipFormData, motivo_notas: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIpModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingIp}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-950 flex items-center gap-1.5"
                >
                  {submittingIp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Registrar e Historiar Cambio</span>
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
