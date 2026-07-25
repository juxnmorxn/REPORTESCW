'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileSpreadsheet, 
  Upload, 
  UserPlus, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  Edit3, 
  Lock, 
  Trash2, 
  X,
  Radio,
  Zap,
  Clock,
  AlertTriangle,
  ChevronRight,
  Wrench,
  Loader2
} from 'lucide-react';
import SupportDashboard from './SupportDashboard';
import TechDashboard from './TechDashboard';
import CustomersManager from './CustomersManager';
import IpChangesManager from './IpChangesManager';
import AppLayout from './AppLayout';

import ConfirmModal from './ConfirmModal';
import NotificationModal from './NotificationModal';
import LoadingModal from './LoadingModal';

interface UserItem {
  id: number;
  nombre: string;
  email_o_usuario: string;
  rol: 'SUPERADMIN' | 'SOPORTE' | 'TECNICO';
  region_asignada?: string;
  especialidad?: string;
  activo: number;
}

interface StatsData {
  totalVisitas: number;
  pendientes: number;
  enProceso: number;
  completadas: number;
  urgentes: number;
  totalClientes: number;
  totalTecnicos: number;
  totalAntenas: number;
  totalFibra: number;
}

interface AdminDashboardProps {
  user: {
    id: number;
    nombre: string;
    email_o_usuario: string;
    rol: 'SUPERADMIN' | 'SOPORTE' | 'TECNICO';
    region_asignada?: string;
  };
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('soporte');
  const [subTab, setSubTab] = useState<string>('visitas');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [usuarios, setUsuarios] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);

  // Modales de Confirmación y Notificación personalizados
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
    loading: false,
    onConfirm: () => {},
  });

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

  // Formulario Crear / Editar Usuario
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email_o_usuario: '',
    password: '',
    rol: 'TECNICO' as 'SUPERADMIN' | 'SOPORTE' | 'TECNICO',
    region_asignada: 'Todas',
    especialidad: 'Ambos' as 'Antena' | 'Fibra' | 'Ambos',
  });
  const [submittingUser, setSubmittingUser] = useState(false);

  // Formulario Excel WispHub
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [excelMessage, setExcelMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAdminData = async () => {
    try {
      if (user) {
        localStorage.setItem('offline_user_session', JSON.stringify(user));
      }
      const [resStats, resUsers] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/users'),
      ]);
      const dataStats = await resStats.json();
      const dataUsers = await resUsers.json();

      if (dataStats) {
        setStats(dataStats);
        localStorage.setItem('cached_admin_stats', JSON.stringify(dataStats));
      }
      if (dataUsers.users) setUsuarios(dataUsers.users);
    } catch (err) {
      console.warn('Sin conexión. Cargando datos administrativos desde memoria offline...');
      const cachedStats = localStorage.getItem('cached_admin_stats');
      if (cachedStats) setStats(JSON.parse(cachedStats));
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setFormData({
      nombre: '',
      email_o_usuario: '',
      password: '',
      rol: 'TECNICO',
      region_asignada: 'Todas',
      especialidad: 'Ambos',
    });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: UserItem) => {
    setEditingUser(u);
    setFormData({
      nombre: u.nombre,
      email_o_usuario: u.email_o_usuario,
      password: '', // Dejar vacío para no sobreescribir salvo que ingrese nueva
      rol: u.rol,
      region_asignada: u.region_asignada || 'Todas',
      especialidad: (u.especialidad as any) || 'Ambos',
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingUser(true);
      const isEdit = !!editingUser;
      const endpoint = '/api/users';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = isEdit ? { id: editingUser.id, ...formData } : formData;

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setShowUserModal(false);
        loadAdminData();
        notify(`Usuario ${isEdit ? 'actualizado' : 'creado'} correctamente`, 'success');
      } else {
        notify(data.error || 'Error al guardar usuario', 'error');
      }
    } catch (err) {
      notify('Error de conexión', 'error');
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleToggleUserActive = (u: UserItem) => {
    if (u.id === user.id) {
      notify('No puedes desactivar tu propio usuario actual.', 'warning', 'Acción Denegada');
      return;
    }

    const actionText = u.activo ? 'Desactivar' : 'Activar';
    setConfirmModal({
      isOpen: true,
      title: `¿${actionText} usuario?`,
      message: `¿Estás seguro de que deseas ${actionText.toLowerCase()} el usuario de "${u.nombre}"?`,
      confirmText: `${actionText} Usuario`,
      type: u.activo ? 'danger' : 'success',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        setTogglingUserId(u.id);
        try {
          const res = await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: u.id,
              nombre: u.nombre,
              email_o_usuario: u.email_o_usuario,
              rol: u.rol,
              region_asignada: u.region_asignada,
              especialidad: u.especialidad,
              activo: u.activo ? 0 : 1,
            }),
          });
          if (res.ok) {
            await loadAdminData();
            notify(`Usuario "${u.nombre}" ${u.activo ? 'desactivado' : 'activado'} correctamente`, 'success');
          } else {
            const data = await res.json();
            notify(data.error || 'Error al cambiar el estado del usuario', 'error');
          }
        } catch (err) {
          notify('Error de conexión al cambiar el estado del usuario', 'error');
        } finally {
          setTogglingUserId(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        }
      },
    });
  };

  const handleUploadExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) return;

    try {
      setUploadingExcel(true);
      setExcelMessage(null);
      const body = new FormData();
      body.append('file', excelFile);

      const res = await fetch('/api/customers/import-wisphub', {
        method: 'POST',
        body,
      });

      const data = await res.json();

      if (res.ok) {
        setExcelMessage({ type: 'success', text: data.message });
        notify(data.message || 'Importación completada con éxito.', 'success', 'Importación Masiva WispHub');
        setExcelFile(null);
        loadAdminData();
      } else {
        const errorDetail = data.error || 'Ocurrió un error al procesar el archivo Excel de WispHub.';
        setExcelMessage({ type: 'error', text: errorDetail });
        notify(
          `${errorDetail}\n\nAsegúrate de que el archivo contenga las columnas requeridas (Nombre, Ip, Plan Internet, Router, Dirección, Estado) y que no esté dañado.`,
          'error',
          'Error en Importación de Excel'
        );
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Error de conexión o el archivo excede el tiempo límite de espera.';
      setExcelMessage({ type: 'error', text: 'Error en la subida del archivo Excel' });
      notify(
        `Error al subir o procesar el archivo Excel:\n${errorMsg}`,
        'error',
        'Fallo de Procesamiento'
      );
    } finally {
      setUploadingExcel(false);
    }
  };

  return (
    <AppLayout
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      subTab={subTab}
      setSubTab={setSubTab}
      stats={stats}
    >
      {/* VISTA 1: SOPORTE EMBEBIDO (Visitas / Clientes / Cambios IP) */}
      {activeTab === 'soporte' && <SupportDashboard user={user} subTab={subTab} />}

      {/* VISTA 2: VISTA TÉCNICO EMBEBIDO */}
      {activeTab === 'tecnico' && <TechDashboard user={user} />}

      {/* VISTA 3: GESTIÓN DE USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h3 className="text-base font-bold text-white">Administración de Usuarios</h3>
              <p className="text-xs text-slate-400">Administra cuentas para SuperAdmins, Personal de Soporte y Técnicos.</p>
            </div>
            <button
              onClick={handleOpenNewUser}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-950 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {usuarios.map((u) => (
              <div
                key={u.id}
                className={`bg-slate-900 border rounded-2xl p-4 shadow-md flex items-center justify-between gap-3 ${
                  u.activo ? 'border-slate-800' : 'border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{u.nombre}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.rol === 'SUPERADMIN'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : u.rol === 'SOPORTE'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {u.rol}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Usuario: @{u.email_o_usuario}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Región: <strong className="text-slate-300">{u.region_asignada || 'Todas'}</strong> • Especialidad:{' '}
                    <strong className="text-slate-300">{u.especialidad || 'Ambos'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditUser(u)}
                    className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition"
                    title="Editar usuario"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleUserActive(u)}
                    disabled={togglingUserId === u.id}
                    className={`p-2 rounded-lg border transition text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 ${
                      u.activo
                        ? 'text-red-400 hover:bg-red-950/40 border-red-900/50'
                        : 'text-emerald-400 hover:bg-emerald-950/40 border-emerald-900/50'
                    }`}
                    title={u.activo ? 'Desactivar' : 'Activar'}
                  >
                    {togglingUserId === u.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <span>{u.activo ? 'Desactivar' : 'Activar'}</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 3: IMPORTADOR EXCEL WISPHUB */}
      {activeTab === 'importar' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Importador Masivo Excel de WispHub</h3>
              <p className="text-xs text-slate-400">
                Sube tu reporte estándar de WispHub (.xlsx). El sistema mapeará automáticamente Nombre, IP, Router y auto-detectará si es Antena o Fibra.
              </p>
            </div>
          </div>

          <form onSubmit={handleUploadExcel} className="space-y-4">
            <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center bg-slate-950/50 transition">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                className="hidden"
                id="excel-input"
              />
              <label htmlFor="excel-input" className="cursor-pointer space-y-2 block">
                <Upload className="w-10 h-10 mx-auto text-emerald-400" />
                <span className="block text-sm font-bold text-slate-200">
                  {excelFile ? excelFile.name : 'Haz clic para seleccionar el archivo Excel (.xlsx)'}
                </span>
                <span className="block text-xs text-slate-500">Columnas requeridas: Nombre, Ip, Plan Internet, Router, Dirección, Estado</span>
              </label>
            </div>

            {excelMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  excelMessage.type === 'success'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : 'bg-red-950/80 text-red-300 border border-red-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{excelMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!excelFile || uploadingExcel}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-950 transition flex items-center justify-center gap-2"
            >
              {uploadingExcel ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Procesando Excel WispHub...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Iniciar Importación Masiva</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Modal Crear / Editar Usuario */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingUser ? `Editar Usuario: ${editingUser.nombre}` : 'Nuevo Usuario del Sistema'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Usuario / Email</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: jperez"
                  value={formData.email_o_usuario}
                  onChange={(e) => setFormData({ ...formData, email_o_usuario: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Contraseña {editingUser && '(Dejar en blanco si no deseas cambiarla)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Rol</label>
                  <select
                    value={formData.rol}
                    onChange={(e: any) => setFormData({ ...formData, rol: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="TECNICO">TÉCNICO</option>
                    <option value="SOPORTE">SOPORTE</option>
                    <option value="SUPERADMIN">SUPERADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Especialidad</label>
                  <select
                    value={formData.especialidad}
                    onChange={(e: any) => setFormData({ ...formData, especialidad: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Ambos">Ambos (Antena/Fibra)</option>
                    <option value="Antena">📡 Solo Antena</option>
                    <option value="Fibra">🔌 Solo Fibra</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Región / Router Asignado</label>
                <input
                  type="text"
                  placeholder="Ej: RB-OLT-Actopan o 'Todas'"
                  value={formData.region_asignada}
                  onChange={(e) => setFormData({ ...formData, region_asignada: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-purple-950 flex items-center gap-1.5"
                >
                  {submittingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Usuario</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Carga / Spinner mientras procesa Excel */}
      <LoadingModal
        isOpen={uploadingExcel}
        title="Procesando Excel WispHub..."
        message="Analizando filas del archivo, extrayendo clientes, IPs y sincronizando con la base de datos."
      />

      {/* Modal de Confirmación Nativo */}
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

      {/* Modal de Notificación / Alertas Nativas */}
      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
      />
    </AppLayout>
  );
}
