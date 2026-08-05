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
  Server,
  Settings
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
  const [showManageVlansModal, setShowManageVlansModal] = useState(false);

  // Vista activa: 'ips' = navegador de IPs | 'vlans' = gestión de VLANs
  const [viewMode, setViewMode] = useState<'ips' | 'vlans'>('ips');

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
    <div className="space-y-4 pb-20">

      {/* ── TAB SWITCHER PRINCIPAL ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex gap-1.5">
        <button
          onClick={() => setViewMode('ips')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-black transition active:scale-95 ${
            viewMode === 'ips'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>🌐 IPs Disponibles</span>
          {viewMode === 'ips' && (
            <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-black px-1.5 py-0.5 rounded-lg font-mono">
              {summary.disponibles}
            </span>
          )}
        </button>
        <button
          onClick={() => setViewMode('vlans')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-black transition active:scale-95 ${
            viewMode === 'vlans'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>⚙️ Gestión VLANs</span>
          {viewMode === 'vlans' && (
            <span className="bg-purple-500/30 text-purple-200 text-[10px] font-black px-1.5 py-0.5 rounded-lg font-mono">
              {summary.totalVlans}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════
          VISTA 1: NAVEGADOR DE IPs (pantalla completa)
      ══════════════════════════════════════════ */}
      {viewMode === 'ips' && (
        <>
          {/* Barra de Filtros */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-200">Filtrar IPs</span>
              <button
                onClick={fetchIpInventory}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition"
                title="Recargar inventario"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {/* Selector VLAN */}
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Segmento VLAN</label>
                <select
                  value={selectedVlanId}
                  onChange={(e) => setSelectedVlanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500"
                >
                  <option value="todas">Todas las VLANs ({summary.totalVlans})</option>
                  {vlans.map((v) => (
                    <option key={v.id} value={String(v.vlan_id)}>
                      VLAN {v.vlan_id} — {v.rango_red}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Estado */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Estado</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('disponibles')}
                    className={`py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                      statusFilter === 'disponibles'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Libres ({summary.disponibles})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ocupadas')}
                    className={`py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                      statusFilter === 'ocupadas'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Usadas ({summary.ocupadas})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('todas')}
                    className={`py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                      statusFilter === 'todas'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>Todas ({summary.totalIps})</span>
                  </button>
                </div>
              </div>

              {/* Búsqueda */}
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Buscar</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="IP o nombre cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-sky-500 placeholder-slate-500"
                  />
                </div>
              </div>
            </div>
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
                className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between transition relative overflow-hidden ${
                  isDisponible
                    ? 'border-emerald-600/40 bg-slate-900'
                    : 'border-slate-800 bg-slate-900'
                }`}
              >
                {/* Decorative status top line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isDisponible ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />

                <div className="space-y-3 pt-1">
                  {/* IP and VLAN Badge Header */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-lg font-black text-white font-mono tracking-tight flex items-center gap-1.5">
                      {item.ip}
                    </span>
                    <span className="text-[11px] font-black bg-slate-950 text-slate-200 border border-slate-700 px-2.5 py-0.5 rounded-lg font-mono">
                      VLAN {item.vlan_id}
                    </span>
                  </div>

                  {/* Estado Badge */}
                  <div>
                    {isDisponible ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-950/90 text-emerald-300 border border-emerald-600/60 text-xs px-2.5 py-1 rounded-lg font-black">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-amber-950/90 text-amber-300 border border-amber-600/60 text-xs px-2.5 py-1 rounded-lg font-black">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Ocupada
                      </span>
                    )}
                  </div>

                  {/* Customer Information if Occupied */}
                  {!isDisponible && (
                    <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Cliente:</span>
                      <h4 className="font-extrabold text-xs text-white leading-snug">{item.cliente_nombre}</h4>
                      <p className="text-[11px] text-slate-300 flex items-center gap-1 font-medium">
                        <span>{item.cliente_tipo_servicio === 'Antena' ? '📡 Antena' : '🔌 Fibra'}</span>
                        <span>• {item.cliente_region || 'N/A'}</span>
                      </p>
                      {item.cliente_plan && (
                        <p className="text-[10px] text-sky-400 font-bold">Plan: {item.cliente_plan}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopyIp(item.ip)}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                      copiedIp === item.ip
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-700'
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
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  {isDisponible ? (
                    <button
                      onClick={() => handleOpenAssignCustomer(item)}
                      className="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-emerald-950"
                      title="Asignar o Usar IP para un cliente"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Usar IP</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCopyIp(item.ip)}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1"
                    >
                      <span>Info</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

        </> /* end viewMode === 'ips' */
      )}

      {/* ══════════════════════════════════════════
          VISTA 2: GESTIÓN DE VLANs + DESGLOSE GENERAL
      ══════════════════════════════════════════ */}
      {viewMode === 'vlans' && (
        <div className="space-y-4">

          {/* Estadísticas resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">VLANs Configuradas</span>
              <span className="text-3xl font-black text-white font-mono">{summary.totalVlans}</span>
            </div>
            <div className="bg-emerald-950/80 border border-emerald-700/60 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wide">IPs Libres</span>
              <span className="text-3xl font-black text-emerald-400 font-mono">{summary.disponibles}</span>
            </div>
            <div className="bg-amber-950/80 border border-amber-700/60 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-wide">IPs Ocupadas</span>
              <span className="text-3xl font-black text-amber-400 font-mono">{summary.ocupadas}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] font-black text-purple-300 uppercase tracking-wide">Total Hosts</span>
              <span className="text-3xl font-black text-purple-400 font-mono">{summary.totalIps}</span>
            </div>
          </div>

          {/* Desglose por VLAN */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-white">Segmentos VLAN Registrados</h3>
                <p className="text-[11px] text-slate-400">{vlans.length} VLANs · {summary.totalIps} hosts totales en subredes</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchIpInventory}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition"
                  title="Recargar"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleOpenNewVlan}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-purple-950"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>➕ Nueva VLAN</span>
                </button>
              </div>
            </div>

            {vlans.length === 0 ? (
              <div className="p-8 text-center space-y-3 bg-slate-950 rounded-xl border border-slate-800">
                <Network className="w-10 h-10 mx-auto text-slate-500" />
                <p className="text-xs text-slate-400 font-medium">No hay VLANs configuradas aún.</p>
                <button
                  onClick={handleOpenNewVlan}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition"
                >
                  Crear Primera VLAN
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {vlans.map((v) => {
                  const totalIpsVlan = summary.totalIps / (summary.totalVlans || 1);
                  return (
                    <div
                      key={v.id}
                      className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-sky-400 font-mono bg-sky-950/50 border border-sky-900/60 px-2 py-0.5 rounded-lg">
                              VLAN {v.vlan_id}
                            </span>
                            <span className="text-xs font-bold text-white truncate">{v.nombre}</span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                            <span className="text-[11px] text-slate-300 font-mono">
                              📡 Rango: <strong className="text-emerald-400">{v.rango_red}</strong>
                            </span>
                            {v.gateway && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                GW: <strong className="text-slate-200">{v.gateway}</strong>
                              </span>
                            )}
                          </div>
                          {v.descripcion && (
                            <p className="text-[10px] text-slate-500 mt-1">{v.descripcion}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setViewMode('ips');
                              setSelectedVlanId(String(v.vlan_id));
                              setStatusFilter('disponibles');
                            }}
                            className="py-1.5 px-2.5 text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/50 rounded-lg border border-emerald-900/60 transition text-[10px] font-black flex items-center gap-1"
                            title="Ver IPs de esta VLAN"
                          >
                            <Network className="w-3.5 h-3.5" />
                            <span>Ver IPs</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditVlan(v)}
                            className="p-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
                            title="Editar VLAN"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteVlan(v)}
                            className="p-2 text-slate-300 hover:text-red-400 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
                            title="Eliminar VLAN"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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

      {/* MODAL DE GESTIÓN Y ADMINISTRACIÓN DE VLANS */}
      {showManageVlansModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Administración de Segmentos VLAN</h3>
                  <p className="text-xs text-slate-400">Configura, edita o elimina rangos de red guardados en la BD.</p>
                </div>
              </div>

              <button onClick={() => setShowManageVlansModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs font-bold text-slate-300">VLANs Configuradas ({vlans.length})</span>
              <button
                onClick={() => {
                  setShowManageVlansModal(false);
                  handleOpenNewVlan();
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>➕ Agregar VLAN</span>
              </button>
            </div>

            {vlans.length === 0 ? (
              <div className="p-6 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <p className="text-xs text-slate-400">No hay VLANs configuradas en la base de datos.</p>
                <button
                  onClick={() => {
                    setShowManageVlansModal(false);
                    handleOpenNewVlan();
                  }}
                  className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-xl"
                >
                  Crear Primera VLAN
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {vlans.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-white">VLAN {v.vlan_id} — {v.nombre}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Rango: <strong className="text-sky-400">{v.rango_red}</strong> {v.gateway && `• Gateway: ${v.gateway}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setShowManageVlansModal(false);
                          handleOpenEditVlan(v);
                        }}
                        className="p-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 transition flex items-center gap-1 text-xs font-bold"
                        title="Editar VLAN"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteVlan(v)}
                        className="p-2 text-slate-300 hover:text-red-400 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 transition flex items-center gap-1 text-xs font-bold"
                        title="Eliminar VLAN"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowManageVlansModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Cerrar
              </button>
            </div>
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
