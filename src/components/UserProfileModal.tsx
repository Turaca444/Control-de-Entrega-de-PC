import React, { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  GraduationCap,
  BookOpen,
  Check,
  X,
  Plus,
  Trash2,
  Lock,
  Save,
  Palette,
  Users,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';
import { UserProfile, UserRole, SCHOOL_COURSES, DEFAULT_USER_PROFILES } from '../types';
import { api } from '../utils/api';
import { ConfirmModal } from './ConfirmModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onUpdateCurrentUser: (user: UserProfile) => void;
  onRefreshAllUsers: () => void;
  onLogout?: () => void;
}

const AVATAR_COLORS = [
  { label: 'Azul Programación', value: 'from-blue-600 to-indigo-700' },
  { label: 'Cian Algoritmos', value: 'from-blue-600 to-cyan-600' },
  { label: 'Esmeralda Desarrollo', value: 'from-emerald-600 to-teal-700' },
  { label: 'Púrpura Coordinación', value: 'from-purple-600 to-indigo-700' },
  { label: 'Rosa Sistemas', value: 'from-pink-600 to-rose-600' },
  { label: 'Ámbar Hardware', value: 'from-amber-600 to-orange-700' },
  { label: 'Rojo Arquitectura', value: 'from-red-600 to-amber-700' },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onUpdateCurrentUser,
  onRefreshAllUsers,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'admin_users'>('profile');
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email || '');
  const [defaultSubject, setDefaultSubject] = useState(
    currentUser.defaultSubject === 'Programación y Sistemas Informáticos'
      ? ''
      : currentUser.defaultSubject || ''
  );
  const [courses, setCourses] = useState<string[]>(currentUser.courses || []);
  const [customCourseInput, setCustomCourseInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || AVATAR_COLORS[0].value);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Admin user editing state
  const [selectedAdminUser, setSelectedAdminUser] = useState<UserProfile | null>(null);
  const [adminUserPin, setAdminUserPin] = useState('');
  const [showAdminUserPin, setShowAdminUserPin] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserProfile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  if (!isOpen) return null;

  const toggleCourse = (c: string) => {
    setCourses((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  const handleAddCustomCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customCourseInput.trim();
    if (clean && !courses.includes(clean)) {
      setCourses((prev) => [...prev, clean]);
      setCustomCourseInput('');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const updates: Partial<UserProfile> = {
        name: name.trim(),
        email: email.trim(),
        defaultSubject: defaultSubject.trim(),
        courses,
        avatarColor,
      };
      if (newPin.trim()) {
        updates.pin = newPin.trim();
      }

      const updated = await api.updateUser(currentUser.id, updates);
      onUpdateCurrentUser(updated);
      onRefreshAllUsers();
      localStorage.setItem('lab_active_user_session', JSON.stringify(updated));
      setStatusMessage({ text: 'Perfil y cursos actualizados correctamente', type: 'success' });
      setNewPin('');
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error al guardar cambios', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdminUpdateUser = async (userToUpdate: UserProfile) => {
    try {
      const updates: Partial<UserProfile> = {};
      if (adminUserPin) {
        updates.pin = adminUserPin;
      }
      await api.updateUser(userToUpdate.id, updates);
      onRefreshAllUsers();
      setSelectedAdminUser(null);
      setAdminUserPin('');
      setStatusMessage({ text: 'Usuario actualizado con éxito', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: `Error: ${err.message}`, type: 'error' });
    }
  };

  const handleAdminDeleteUser = (user: UserProfile) => {
    if (user.id === 'admin-lab' || user.id === currentUser.id) {
      setStatusMessage({ text: 'No puedes eliminar este usuario', type: 'error' });
      return;
    }
    setDeleteTargetUser(user);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteTargetUser) return;
    try {
      setIsDeletingUser(true);
      await api.deleteUser(deleteTargetUser.id);
      onRefreshAllUsers();
      setStatusMessage({ text: `Docente ${deleteTargetUser.name} eliminado con éxito`, type: 'success' });
      setDeleteTargetUser(null);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error al eliminar usuario', type: 'error' });
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div
      id="profile-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="profile-modal-card"
        className="bg-white dark:bg-slate-850 rounded-2xl max-w-2xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-base font-bold shadow-md shadow-blue-500/20 shrink-0`}
            >
              {name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Mi Perfil y Cursos de Trabajo
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    currentUser.role === 'administrador'
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {currentUser.role === 'administrador' ? 'Administrador' : 'Profesor'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configura los cursos asignados a tu cuenta para filtrar automáticamente tus entregas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch for Administrator */}
        {currentUser.role === 'administrador' && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Mi Configuración Personal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin_users')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'admin_users'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Gestión de Profesores ({allUsers.length})
            </button>
          </div>
        )}

        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs border shrink-0 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Correo Institucional
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="profesor@escuela.edu.ar"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Materia o Asignatura Habitual
                  </label>
                  <input
                    type="text"
                    value={defaultSubject}
                    onChange={(e) => setDefaultSubject(e.target.value)}
                    placeholder="Ej. Programación y Algoritmos"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Esta materia se preseleccionará automáticamente cuando prestes una computadora a un alumno.
                  </p>
                </div>
              </div>

              {/* Courses Selection */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Mis Cursos Asignados (Independencia de Trabajo):
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {courses.length} seleccionados
                  </span>
                </div>

                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug">
                  Al marcar tus cursos, la pantalla principal filtrará solo tus alumnos y cuando finalices la clase, únicamente devolverás los equipos de tu grupo.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {SCHOOL_COURSES.map((course) => {
                    const isSelected = courses.includes(course);
                    return (
                      <button
                        key={course}
                        type="button"
                        onClick={() => toggleCourse(course)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{course}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom courses addition */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/80">
                  <input
                    type="text"
                    value={customCourseInput}
                    onChange={(e) => setCustomCourseInput(e.target.value)}
                    placeholder="Agregar otro curso / división (ej. 7º Año A)"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCourse}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* PIN Change & Avatar Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Cambiar PIN de Acceso
                      </label>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="Dejar en blanco para mantener"
                      className="w-full pl-3 pr-9 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                      title={showNewPin ? 'Ocultar PIN' : 'Ver PIN'}
                    >
                      {showNewPin ? <EyeOff className="w-3.5 h-3.5 text-blue-600" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>PIN actual: <strong>{showCurrentPin ? currentUser.pin : '••••'}</strong></span>
                    <button
                      type="button"
                      onClick={() => setShowCurrentPin(!showCurrentPin)}
                      className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      {showCurrentPin ? 'Ocultar' : 'Ver PIN actual'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-500" />
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Color de Perfil
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setAvatarColor(c.value)}
                        className={`w-6 h-6 rounded-full bg-gradient-to-br ${c.value} cursor-pointer transition-transform ${
                          avatarColor === c.value ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-700">
                {onLogout ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
                    title={`Cerrar sesión de ${currentUser.name}`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Guardando...' : 'Guardar Mis Cambios'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Admin tab: Manage all teachers */
            <div className="space-y-3 text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                Como Administrador / Encargado de la Sala de Programación, puedes supervisar las cuentas docentes, restablecer contraseñas o gestionar asignaciones:
              </p>

              <div className="space-y-2">
                {((allUsers && allUsers.length > 0) ? allUsers : DEFAULT_USER_PROFILES).map((u) => (
                  <div
                    key={u.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                          u.avatarColor || 'from-blue-600 to-indigo-600'
                        } flex items-center justify-center text-white text-xs font-bold shrink-0`}
                      >
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {u.name}
                          </p>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              u.role === 'administrador'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {u.role === 'administrador' ? 'Admin' : 'Docente'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {u.courses?.join(', ') || 'Sin cursos'} • {u.defaultSubject && u.defaultSubject !== 'Programación y Sistemas Informáticos' ? u.defaultSubject : 'Materia general'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {selectedAdminUser?.id === u.id ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              type={showAdminUserPin ? 'text' : 'password'}
                              maxLength={6}
                              value={adminUserPin}
                              onChange={(e) => setAdminUserPin(e.target.value)}
                              placeholder="Nuevo PIN"
                              className="w-28 pl-2 pr-7 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowAdminUserPin(!showAdminUserPin)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                              title={showAdminUserPin ? 'Ocultar PIN' : 'Ver PIN'}
                            >
                              {showAdminUserPin ? <EyeOff className="w-3.5 h-3.5 text-blue-600" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAdminUpdateUser(u)}
                            className="px-2 py-1 rounded bg-emerald-600 text-white font-semibold cursor-pointer text-xs"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedAdminUser(null)}
                            className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAdminUser(u);
                            setAdminUserPin('');
                          }}
                          className="px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 cursor-pointer font-medium"
                        >
                          Restablecer PIN
                        </button>
                      )}

                      {u.id !== 'admin-lab' && u.id !== currentUser.id && (
                        <button
                          type="button"
                          onClick={() => handleAdminDeleteUser(u)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Confirmar eliminación de perfil docente */}
      <ConfirmModal
        isOpen={!!deleteTargetUser}
        title="¿Eliminar perfil docente?"
        message={`¿Estás seguro de que deseas eliminar permanentemente el usuario de ${deleteTargetUser?.name}? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar Docente"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingUser}
        onCancel={() => setDeleteTargetUser(null)}
        onConfirm={handleConfirmDeleteUser}
      />
    </div>
  );
};
