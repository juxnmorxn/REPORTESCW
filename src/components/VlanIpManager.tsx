'use client';

import React, { useState, useEffect } from 'react';
import {
  Network,
  Search,
  PlusCircle,
  Edit3,
  Trash2,
  Copy,
  Check,
  UserPlus,
  Radio,
  Users,
  Shield,
  Layers,
  CheckCircle2,
  X,
  RefreshCw,
  Loader2,
  ArrowRight,
  Filter,
  Info,
  Server
} from 'lucide-react';
import NotificationModal from './NotificationModal';
import ConfirmModal from './ConfirmModal';

export interface Vlan {
  id: number;
  nombre: string;
  vlan_id: number;
  rango_red: string;
  gateway?: string;
  descripcion?: string;
}

export interface IpItem {
  ip: string;
  vlan_id: number;
  vlan_nombre: string;
  estado: 'DISPONIBLE' | 'OCUPADA';
  cliente_id?: number;
  cliente_nombre?: string;
  cliente_plan?: string;
  cliente_region?: string;
  cliente_tipo_servicio?: string;
  cliente_direccion?: string;
  gateway?: string;
}

interface VlanIpManagerProps {
  user: {
    id: number;
    nombre: string;
    email_o_usuario: string;
    rol: 'SUPERADMIN' | 'SOPORTE' | 'TECNICO' | 'INVITADO';
    region_asignada?: string;
  };
  initialVlanId?: string;
  onSelectIpForNewClient?: (ip: string, vlanId: number) => void;
}

export default function VlanIpManager({ user, initialVlanId, onSelectIpForNewClient }: VlanIpManagerProps) {
  const [vlans, setVlans] = useState<Vlan[]>([]);
  const [ips, setIps] = useState<IpItem[]>([]);
  const [summary, setSummary] = useState({
    totalIps: 0,
    disponibles: 0,
    ocupadas: 0,
    totalVlans: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedVlanId, setSelectedVlanId] = useState<string>(initialVlanId || 'todas');
  const [statusFilter, setStatusFilter] = useState<'disponibles' | 'ocupadas' | 'todas'>('disponibles');
  const [search, setSearch] = useState('');

  // Copy feedback state
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // Admin VLAN Modal State
  const [showVlanModal, setShowVlanModal] = useState(false);
  const [editingVlan, setEditingVlan] = useState<Vlan | null>(null);
  const [vlanForm, setVlanForm] = useState({
    nombre: '',
    vlan_id: '',
    rango_red: '',
    gateway: '',
    descripcion: '',
  });
  const [submittingVlan, setSubmittingVlan] = useState(false);

  // New Client from IP Modal State
  const [assigningIpItem, setAssigningIpItem] = useState<IpItem | null>(null);
  const [newCustForm, setNewCustForm] = useState({
    nombre: '',
    tipo_servicio: 'Fibra' as 'Antena' | 'Fibra',
    plan: 'Plan 20M Estándar',
    region: 'RB-OLT-Actopan',
    direccion: '',
  });
  const [submittingNewCust, setSubmittingNewCust] = useState(false);

  // Notifications & Confirmations
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type?: 'error' | 'success' | 'info' | 'warning';
  }>({
    isOpen: false,
    message: '',
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: 'warning' | 'danger' | 'info' | 'success';
    loading?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const notify = (message: string, type: 'error' | 'success' | 'info' | 'warning' = 'error', title?: string) => {
    setNotification({ isOpen: true, message, type, title });
  };

  const fetchIpInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedVlanId !== 'todas') params.append('vlan_id', selectedVlanId);
      params.append('status', statusFilter);
      if (search.trim()) params.append('search', search);

      const res = await fetch(`/api/vlans/ips?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setVlans(data.vlans || []);
        setIps(data.ips || []);
        if (data.summary) setSummary(data.summary);
      } else {
        notify(data.error || 'Error al obtener inventario de IPs', 'error');
      }
    } catch (err) {
      notify('Error al conectar con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIpInventory();
  }, [selectedVlanId, statusFilter, search]);

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // VLAN CRUD Functions
  const handleOpenNewVlan = () => {
    setEditingVlan(null);
    setVlanForm({
      nombre: '',
      vlan_id: '',
      rango_red: '172.19.1.0/24',
      gateway: '172.19.1.1',
      descripcion: '',
    });
    setShowVlanModal(true);
  };

  const handleOpenEditVlan = (vlan: Vlan) => {
    setEditingVlan(vlan);
    setVlanForm({
      nombre: vlan.nombre,
      vlan_id: String(vlan.vlan_id),
      rango_red: vlan.rango_red,
      gateway: vlan.gateway || '',
      descripcion: vlan.descripcion || '',
    });
    setShowVlanModal(true);
  };

  const handleSaveVlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vlanForm.nombre || !vlanForm.vlan_id || !vlanForm.rango_red) {
      notify('Nombre, ID de VLAN y Rango de Red son obligatorios', 'warning');
      return;
    }

    try {
      setSubmittingVlan(true);
      const isEdit = !!editingVlan;
      const endpoint = '/api/vlans';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = isEdit
        ? { id: editingVlan.id, ...vlanForm, vlan_id: Number(vlanForm.vlan_id) }
        : { ...vlanForm, vlan_id: Number(vlanForm.vlan_id) };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setShowVlanModal(false);
        fetchIpInventory();
        notify(`VLAN ${isEdit ? 'actualizada' : 'creada'} correctamente`, 'success');
      } else {
        notify(data.error || 'Error al guardar VLAN', 'error');
      }
    } catch (err) {
      notify('Error de conexión al guardar VLAN', 'error');
    } finally {
      setSubmittingVlan(false);
    }
  };

  const handleDeleteVlan = (vlan: Vlan) => {
    setConfirmModal({
      isOpen: true,
      title: `¿Eliminar VLAN ${vlan.vlan_id}?`,
      message: `¿Estás seguro de que deseas eliminar la configuración de "${vlan.nombre}" (${vlan.rango_red})? Esto no eliminará a los clientes.`,
      confirmText: 'Eliminar VLAN',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/vlans?id=${vlan.id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchIpInventory();
            notify('VLAN eliminada correctamente', 'success');
          } else {
            const data = await res.json();
            notify(data.error || 'Error al eliminar VLAN', 'error');
          }
        } catch (err) {
          notify('Error de conexión', 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Assign Available IP to New Customer
  const handleOpenAssignCustomer = (item: IpItem) => {
    if (onSelectIpForNewClient) {
      onSelectIpForNewClient(item.ip, item.vlan_id);
      return;
    }

    setAssigningIpItem(item);
    setNewCustForm({
      nombre: '',
      tipo_servicio: 'Fibra',
      plan: 'Plan 20M Estándar',
      region: item.vlan_nombre.includes('Rincón') ? 'RB-Rinkon' : 'RB-OLT-Actopan',
      direccion: '',
    });
  };

  const handleSaveCustomerForIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningIpItem || !newCustForm.nombre.trim()) {
      notify('El nombre del cliente es obligatorio', 'warning');
      return;
    }

    try {
      setSubmittingNewCust(true);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newCustForm.nombre,
          ip: assigningIpItem.ip,
          tipo_servicio: newCustForm.tipo_servicio,
          plan: newCustForm.plan,
          region: newCustForm.region,
          direccion: newCustForm.direccion,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAssigningIpItem(null);
        fetchIpInventory();
        notify(`IP ${assigningIpItem.ip} asignada a "${newCustForm.nombre}" exitosamente.`, 'success', '¡IP Asignada!');
      } else {
        notify(data.error || 'Error al registrar cliente', 'error');
      }
    } catch (err) {
      notify('Error de conexión al asignar cliente', 'error');
    } finally {
      setSubmittingNewCust(false);
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* HEADER PRINCIPAL Y ESTADÍSTICAS EN CABECERA */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                <Network className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  Gestión e Inventario de IPs por VLAN
                </h2>
                <p className="text-xs text-slate-400">
                  Control en tiempo real de IPs disponibles y asignadas a la base de datos de clientes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={fetchIpInventory}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              title="Recargar inventario"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {(user.rol === 'SUPERADMIN' || user.rol === 'SOPORTE') && (
              <button
                onClick={handleOpenNewVlan}
                className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Configurar Nueva VLAN</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI CARDS (RESUMEN RÁPIDO) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">VLANs Activas</span>
              <span className="text-lg font-black text-white font-mono">{summary.totalVlans}</span>
            </div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-800/50 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-emerald-300 uppercase">IPs Disponibles</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{summary.disponibles}</span>
            </div>
          </div>

          <div className="bg-amber-950/30 border border-amber-800/50 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-amber-300 uppercase">IPs Ocupadas</span>
              <span className="text-lg font-black text-amber-400 font-mono">{summary.ocupadas}</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Total en Subred</span>
              <span className="text-lg font-black text-white font-mono">{summary.totalIps}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE CONTROL, SELECCIÓN DE VLAN Y FILTROS */}
      <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {/* Selector de VLAN */}
          <div className="sm:col-span-1">
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Filtrar por VLAN</label>
            <select
              value={selectedVlanId}
              onChange={(e) => setSelectedVlanId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500"
            >
              <option value="todas">🌐 Todas las VLANs ({summary.totalVlans})</option>
              {vlans.map((v) => (
                <option key={v.id} value={String(v.vlan_id)}>
                  VLAN {v.vlan_id} — {v.nombre} ({v.rango_red})
                </option>
              ))}
            </select>
          </div>

          {/* Toggle de Estado (Disponibles / Ocupadas / Todas) */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Estado de Direcciones IP</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setStatusFilter('disponibles')}
                className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  statusFilter === 'disponibles'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Disponibles ({summary.disponibles})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('ocupadas')}
                className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  statusFilter === 'ocupadas'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Ocupadas ({summary.ocupadas})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('todas')}
                className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  statusFilter === 'todas'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Todas ({summary.totalIps})</span>
              </button>
            </div>
          </div>

          {/* Buscador Rápido */}
          <div className="sm:col-span-1">
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Buscar IP o Cliente</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Ej: 172.19.1.45 o 'Hotel'..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* LISTADO DE VLANS CONFIGURADAS (PÍDOLA CON BOTONES DE EDICIÓN PARA ADMIN) */}
        {vlans.length > 0 && (
          <div className="pt-2 border-t border-slate-800/60">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
              Segmentos VLAN Registrados:
            </span>
            <div className="flex flex-wrap gap-2">
              {vlans.map((v) => (
                <div
                  key={v.id}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-2 transition ${
                    selectedVlanId === String(v.vlan_id)
                      ? 'bg-sky-950 text-sky-200 border-sky-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  <span
                    className="cursor-pointer"
                    onClick={() => setSelectedVlanId(selectedVlanId === String(v.vlan_id) ? 'todas' : String(v.vlan_id))}
                  >
                    VLAN <strong className="text-sky-400 font-mono">{v.vlan_id}</strong> ({v.rango_red})
                  </span>

                  {(user.rol === 'SUPERADMIN' || user.rol === 'SOPORTE') && (
                    <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-800">
                      <button
                        onClick={() => handleOpenEditVlan(v)}
                        className="text-slate-400 hover:text-white transition"
                        title="Editar rango VLAN"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteVlan(v)}
                        className="text-slate-400 hover:text-red-400 transition"
                        title="Eliminar VLAN"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GRID / LISTA DE RESULTADOS DE IPS */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <Loader2 className="w-8 h-8 mx-auto text-emerald-400 animate-spin" />
          <p className="text-xs font-bold">Escaneando subredes y cruzando con base de datos de clientes...</p>
        </div>
      ) : ips.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <Info className="w-10 h-10 mx-auto text-slate-500" />
          <h3 className="text-base font-bold text-white">No se encontraron direcciones IP</h3>
          <p className="text-xs text-slate-400">
            Intenta cambiando los filtros de búsqueda o agrega un nuevo rango de VLAN.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ips.map((item) => {
            const isDisponible = item.estado === 'DISPONIBLE';

            return (
              <div
                key={`${item.vlan_id}-${item.ip}`}
                className={`bg-slate-900 border rounded-2xl p-3.5 flex flex-col justify-between transition hover:border-slate-700 relative overflow-hidden ${
                  isDisponible
                    ? 'border-emerald-900/60 bg-emerald-950/10'
                    : 'border-slate-800 bg-slate-900'
                }`}
              >
                {/* Decorative status top line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isDisponible ? 'bg-emerald-500' : 'bg-amber-500/70'
                  }`}
                />

                <div className="space-y-2 pt-1">
                  {/* IP and VLAN Badge Header */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-base font-black text-white font-mono tracking-tight flex items-center gap-1.5">
                      {item.ip}
                    </span>
                    <span className="text-[10px] font-extrabold bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md font-mono">
                      VLAN {item.vlan_id}
                    </span>
                  </div>

                  {/* Estado Badge */}
                  <div>
                    {isDisponible ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        🟢 IP Libre / Disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        🔴 Asignada a Cliente
                      </span>
                    )}
                  </div>

                  {/* Customer Information if Occupied */}
                  {!isDisponible ? (
                    <div className="mt-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Cliente Actual:</span>
                      <h4 className="font-extrabold text-xs text-white leading-snug">{item.cliente_nombre}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span>{item.cliente_tipo_servicio === 'Antena' ? '📡 Antena' : '🔌 Fibra'}</span>
                        <span>• {item.cliente_region || 'N/A'}</span>
                      </p>
                      {item.cliente_plan && (
                        <p className="text-[10px] text-sky-400 font-medium">Plan: {item.cliente_plan}</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 p-2.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-[11px] text-emerald-300 font-medium">
                      ✓ Lista para asignar a un cliente nuevo o realizar cambio de IP.
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleCopyIp(item.ip)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                      copiedIp === item.ip
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                    title="Copiar IP al portapapeles"
                  >
                    {copiedIp === item.ip ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar IP</span>
                      </>
                    )}
                  </button>

                  {isDisponible ? (
                    <button
                      onClick={() => handleOpenAssignCustomer(item)}
                      className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1 active:scale-95"
                      title="Asignar IP a un cliente nuevo"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Asignar</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCopyIp(item.ip)}
                      className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1"
                    >
                      <span>Ver Info</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CONFIGURAR NUEVA / EDITAR VLAN */}
      {showVlanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Network className="w-5 h-5 text-purple-400" />
                {editingVlan ? `Editar VLAN ${editingVlan.vlan_id}` : 'Configurar Nueva VLAN'}
              </h3>
              <button onClick={() => setShowVlanModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVlan} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre / Identificador de la VLAN *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: VLAN 510 - Zona Actopan"
                  value={vlanForm.nombre}
                  onChange={(e) => setVlanForm({ ...vlanForm, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">ID de VLAN *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 510"
                    value={vlanForm.vlan_id}
                    onChange={(e) => setVlanForm({ ...vlanForm, vlan_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Gateway Default</label>
                  <input
                    type="text"
                    placeholder="Ej: 172.19.1.1"
                    value={vlanForm.gateway}
                    onChange={(e) => setVlanForm({ ...vlanForm, gateway: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Rango de Red / Subred * <span className="text-purple-400 font-normal">(Ej: 172.19.1.0/24 o 172.19.1.1 - 172.19.1.254)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 172.19.1.0/24"
                  value={vlanForm.rango_red}
                  onChange={(e) => setVlanForm({ ...vlanForm, rango_red: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notas / Descripción</label>
                <input
                  type="text"
                  placeholder="Ej: Subred exclusiva para clientes de fibra en Actopan"
                  value={vlanForm.descripcion}
                  onChange={(e) => setVlanForm({ ...vlanForm, descripcion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVlanModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingVlan}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5"
                >
                  {submittingVlan ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar VLAN</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA ASIGNAR IP DISPONIBLE A NUEVO CLIENTE */}
      {assigningIpItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Asignar IP {assigningIpItem.ip} a Cliente
              </h3>
              <button onClick={() => setAssigningIpItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-xs space-y-1">
              <span className="text-emerald-300 font-bold block">IP Seleccionada:</span>
              <div className="text-white font-mono font-black text-sm">{assigningIpItem.ip} (VLAN {assigningIpItem.vlan_id})</div>
              <p className="text-[11px] text-slate-400">{assigningIpItem.vlan_nombre}</p>
            </div>

            <form onSubmit={handleSaveCustomerForIp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Completo del Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Roberto Gómez"
                  value={newCustForm.nombre}
                  onChange={(e) => setNewCustForm({ ...newCustForm, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tecnología de Servicio</label>
                  <select
                    value={newCustForm.tipo_servicio}
                    onChange={(e: any) => setNewCustForm({ ...newCustForm, tipo_servicio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Fibra">🔌 Fibra Óptica</option>
                    <option value="Antena">📡 Antena</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Región / Router</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: RB-OLT-Actopan"
                    value={newCustForm.region}
                    onChange={(e) => setNewCustForm({ ...newCustForm, region: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Plan de Internet</label>
                <input
                  type="text"
                  placeholder="Ej: Plan 20M Estándar"
                  value={newCustForm.plan}
                  onChange={(e) => setNewCustForm({ ...newCustForm, plan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Dirección del Cliente</label>
                <input
                  type="text"
                  placeholder="Ej: Calle Principal #45"
                  value={newCustForm.direccion}
                  onChange={(e) => setNewCustForm({ ...newCustForm, direccion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningIpItem(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingNewCust}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5"
                >
                  {submittingNewCust ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando Cliente...</span>
                    </>
                  ) : (
                    <span>Confirmar Asignación</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATION AND CONFIRMATION MODALS */}
      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
