'use client';

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Search, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  X, 
  Key, 
  Eye, 
  EyeOff, 
  Network, 
  Loader2, 
  Trash2, 
  Cpu, 
  ShieldCheck, 
  Wifi,
  Server,
  Zap
} from 'lucide-react';
import NotificationModal from './NotificationModal';

interface Antenna {
  id: number;
  nombre_ap: string;
  ip_gestion: string;
  region: string;
  modelo_equipo: string;
  usuario_acceso: string;
  password_acceso: string;
  conectado_a: string;
  estado: string;
  notas: string;
  fecha_registro: string;
}

interface AntennasTopologyManagerProps {
  user: {
    id: number;
    nombre: string;
    email_o_usuario: string;
    rol: 'SUPERADMIN' | 'SOPORTE' | 'TECNICO' | 'INVITADO';
  };
}

export default function AntennasTopologyManager({ user }: AntennasTopologyManagerProps) {
  const [antenas, setAntenas] = useState<Antenna[]>([]);
  const [regionesList, setRegionesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [filtroRegion, setFiltroRegion] = useState('Todas');

  // Mostrar Contraseñas
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});

  // Modal Agregar / Editar
  const [showModal, setShowModal] = useState(false);
  const [editingAntenna, setEditingAntenna] = useState<Antenna | null>(null);
  const [formData, setFormData] = useState({
    nombre_ap: '',
    ip_gestion: '',
    region: 'RB-PIEDRADELHONGO',
    modelo_equipo: 'Ubiquiti Rocket AC',
    usuario_acceso: 'admin',
    password_acceso: '',
    conectado_a: 'Router Principal (RB)',
    estado: 'En Línea',
    notas: '',
  });
  const [submitting, setSubmitting] = useState(false);

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

  // Cargar lista de regiones reales
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

  const fetchAntenas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search);
      if (filtroRegion !== 'Todas') params.append('region', filtroRegion);

      const res = await fetch(`/api/antennas?${params.toString()}`);
      const data = await res.json();

      if (data.antenas) setAntenas(data.antenas);
    } catch (err) {
      console.error('Error al cargar inventario de antenas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAntenas();
  }, [search, filtroRegion]);

  const handleOpenNewModal = () => {
    setEditingAntenna(null);
    setFormData({
      nombre_ap: '',
      ip_gestion: '',
      region: regionesList.length > 0 ? regionesList[0] : 'RB-PIEDRADELHONGO',
      modelo_equipo: 'Ubiquiti Rocket AC',
      usuario_acceso: 'admin',
      password_acceso: '',
      conectado_a: 'Router Principal (RB)',
      estado: 'En Línea',
      notas: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (a: Antenna) => {
    setEditingAntenna(a);
    setFormData({
      nombre_ap: a.nombre_ap,
      ip_gestion: a.ip_gestion,
      region: a.region,
      modelo_equipo: a.modelo_equipo,
      usuario_acceso: a.usuario_acceso,
      password_acceso: a.password_acceso,
      conectado_a: a.conectado_a,
      estado: a.estado,
      notas: a.notas || '',
    });
    setShowModal(true);
  };

  const handleSaveAntenna = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre_ap.trim() || !formData.ip_gestion.trim() || !formData.region.trim()) {
      notify('Nombre del AP, IP de Gestión y Región son obligatorios.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const isEdit = !!editingAntenna;
      const url = '/api/antennas';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { ...formData, id: editingAntenna.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        fetchAntenas();
        notify(
          `Equipo ${isEdit ? 'actualizado' : 'registrado'} en la red correctamente.`,
          'success',
          'Inventario de Red'
        );
      } else {
        notify(data.error || 'Error al guardar antena', 'error');
      }
    } catch (err) {
      notify('Error de conexión', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAntenna = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la antena "${nombre}" del inventario?`)) return;

    try {
      const res = await fetch(`/api/antennas?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAntenas();
        notify(`Antena ${nombre} eliminada`, 'info');
      }
    } catch (err) {
      notify('Error al eliminar antena', 'error');
    }
  };

  const toggleShowPassword = (id: number) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Resumen y Acciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            📡 Inventario de Antenas & APs de Red (Topología)
          </h2>
          <p className="text-xs text-slate-400">
            Registro de antenas transmisoras, IPs de gestión, credenciales y diagrama de conexión por región.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchAntenas}
            title="Refrescar lista"
            className="p-2.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenNewModal}
            className="flex-1 sm:flex-none bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-950 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nueva Antena / AP</span>
          </button>
        </div>
      </div>

      {/* Banner Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Radio className="w-3 h-3 text-sky-400" /> Total APs Registrados
          </span>
          <div className="text-xl font-black text-white mt-0.5">{antenas.length}</div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 bg-emerald-950/20 p-3 rounded-2xl shadow-md">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> APs En Línea (Operativos)
          </span>
          <div className="text-xl font-black text-emerald-300 mt-0.5">
            {antenas.filter((a) => a.estado === 'En Línea').length}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Network className="w-3 h-3 text-purple-400" /> Regiones de Red Cobertas
          </span>
          <div className="text-xl font-black text-purple-300 mt-0.5">{regionesList.length} Regiones</div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Nombre de AP, IP de Gestión, Modelo o Dispositivo Padre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
          />
        </div>

        <select
          value={filtroRegion}
          onChange={(e) => setFiltroRegion(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500 font-medium"
        >
          <option value="Todas">Todas las Regiones ({regionesList.length})</option>
          {regionesList.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Contenido Grid Tarjetas de Topología */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse space-y-2">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-sky-500" />
          <p>Cargando inventario de infraestructura de red...</p>
        </div>
      ) : antenas.length === 0 ? (
        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-2">
          <Radio className="w-10 h-10 mx-auto text-sky-500/60" />
          <h3 className="text-slate-300 font-bold text-base">No hay Antenas / APs registrados</h3>
          <p className="text-xs text-slate-500">Registra tus antenas emisoras para armar el mapa topológico de tu ISP.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {antenas.map((a) => {
            const isVisiblePass = !!showPasswords[a.id];
            return (
              <div
                key={a.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-sky-500/40 transition shadow-xl relative"
              >
                {/* Header Tarjeta */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-sm leading-tight">{a.nombre_ap}</h3>
                      <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 mt-0.5 inline-block">
                        {a.region}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      a.estado === 'En Línea'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {a.estado}
                  </span>
                </div>

                {/* Datos de Red e IP */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">IP de Gestión</span>
                    <strong className="text-sky-400 text-xs">{a.ip_gestion}</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 truncate">
                    <span className="text-[10px] text-slate-500 block uppercase">Modelo Equipo</span>
                    <strong className="text-slate-300 text-xs">{a.modelo_equipo}</strong>
                  </div>
                </div>

                {/* Topología Conexión Padre */}
                <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 text-xs flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-purple-400" />
                    <span>Conectado a:</span>
                  </span>
                  <strong className="text-purple-300 text-xs">{a.conectado_a || 'Router Principal'}</strong>
                </div>

                {/* Credenciales de Acceso */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-400" /> Usuario: <strong className="text-white">{a.usuario_acceso}</strong>
                    </span>
                    <button
                      onClick={() => toggleShowPassword(a.id)}
                      className="text-slate-400 hover:text-white p-0.5"
                      title={isVisiblePass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {isVisiblePass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="font-mono text-slate-300 text-[11px]">
                    Clave: {isVisiblePass ? <span className="text-amber-300 font-bold">{a.password_acceso || 'Sin clave'}</span> : '••••••••'}
                  </div>
                </div>

                {/* Botones Acciones */}
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenEditModal(a)}
                    className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                    title="Editar datos de la antena"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {user.rol === 'SUPERADMIN' && (
                    <button
                      onClick={() => handleDeleteAntenna(a.id, a.nombre_ap)}
                      className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/50 rounded-lg border border-red-900/40 transition"
                      title="Eliminar antena"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Registrar / Editar Antena */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-sky-400" />
                {editingAntenna ? `Editar Antena / AP #${editingAntenna.id}` : 'Registrar Antena / AP de Red'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAntenna} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre del AP / Antena *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: AP-PiedraHongo-Sector1"
                  value={formData.nombre_ap}
                  onChange={(e) => setFormData({ ...formData, nombre_ap: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">IP de Gestión *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 192.168.10.1"
                    value={formData.ip_gestion}
                    onChange={(e) => setFormData({ ...formData, ip_gestion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-sky-400 font-bold focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Región / Router *</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-sky-500 font-medium"
                  >
                    {regionesList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Modelo de Equipo</label>
                  <input
                    type="text"
                    placeholder="Ej: Rocket AC Lite"
                    value={formData.modelo_equipo}
                    onChange={(e) => setFormData({ ...formData, modelo_equipo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Conectado A (Padre)</label>
                  <input
                    type="text"
                    placeholder="Ej: RB-PIEDRADELHONGO-Port2"
                    value={formData.conectado_a}
                    onChange={(e) => setFormData({ ...formData, conectado_a: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-purple-300 focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Usuario Acceso</label>
                  <input
                    type="text"
                    placeholder="admin"
                    value={formData.usuario_acceso}
                    onChange={(e) => setFormData({ ...formData, usuario_acceso: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Contraseña Acceso</label>
                  <input
                    type="text"
                    placeholder="Clave Wisp/Mikrotik"
                    value={formData.password_acceso}
                    onChange={(e) => setFormData({ ...formData, password_acceso: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-300 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
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
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-sky-950 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingAntenna ? 'Guardar Cambios' : 'Registrar Equipo'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Notificación */}
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
