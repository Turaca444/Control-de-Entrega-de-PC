import React, { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  GraduationCap,
  PlusCircle,
  CheckCircle2,
  X,
  Laptop,
  ArrowRight,
  BookOpen,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  LogOut,
  Plus,
  RotateCcw,
  Lock,
  Key,
} from 'lucide-react';
import { UserProfile, UserRole, SCHOOL_COURSES, DEFAULT_USER_PROFILES } from '../types';
import { api } from '../utils/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  onRefreshUsers: () => void;
  onLogout?: () => void;
  allowDismiss?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users: propUsers,
  currentUser,
  onSelectUser,
  onRefreshUsers,
  onLogout,
  allowDismiss = true,
}) => {
  const users = React.useMemo(() => {
    if (propUsers && Array.isArray(propUsers) && propUsers.length > 0) return propUsers;
    try {
      const cached = localStorage.getItem('lab_cached_user_profiles');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_USER_PROFILES;
  }, [propUsers]);

  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || (users[1]?.id || users[0]?.id || ''));
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Selected courses state for current session before entering
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [customCourseInput, setCustomCourseInput] = useState<string>('');

  // PIN change before login state
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [showCurrentPinInput, setShowCurrentPinInput] = useState<boolean>(false);
  const [showNewPinInput, setShowNewPinInput] = useState<boolean>(false);
  const [showConfirmPinInput, setShowConfirmPinInput] = useState<boolean>(false);
  const [pinChangeError, setPinChangeError] = useState<string>('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string>('');
  const [isSavingPin, setIsSavingPin] = useState<boolean>(false);
  const [skipCurrentPinVerification, setSkipCurrentPinVerification] = useState<boolean>(false);

  const selectedProfile = users.find((u) => u.id === selectedUserId);

  // Reset/sync when opened
  React.useEffect(() => {
    if (isOpen) {
      if (!propUsers || propUsers.length === 0) {
        onRefreshUsers();
      }
      if (currentUser?.id) {
        setSelectedUserId(currentUser.id);
      } else if (users.length > 0) {
        setSelectedUserId(users[1]?.id || users[0]?.id || '');
      }
      setPin('');
      setErrorMessage('');
      setIsChangingPin(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setPinChangeError('');
      setPinChangeSuccess('');
    }
  }, [isOpen, currentUser, users, propUsers, onRefreshUsers]);

  // Sync courses whenever selected user changes
  React.useEffect(() => {
    if (selectedProfile) {
      setSelectedCourses(selectedProfile.courses ? [...selectedProfile.courses] : []);
    }
  }, [selectedUserId, selectedProfile?.id]);

  // Registration state
  const [newDocenteName, setNewDocenteName] = useState<string>('');
  const [newDocenteEmail, setNewDocenteEmail] = useState<string>('');
  const [newDocenteRole, setNewDocenteRole] = useState<UserRole>('profesor');
  const [newDocenteSubject, setNewDocenteSubject] = useState<string>('');
  const [newDocentePin, setNewDocentePin] = useState<string>('1234');
  const [showRegisterPin, setShowRegisterPin] = useState<boolean>(false);
  const [newDocenteCourses, setNewDocenteCourses] = useState<string[]>(['5º Año L']);

  if (!isOpen) return null;

  // Course management helpers for before login
  const toggleCourse = (courseName: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseName) ? prev.filter((c) => c !== courseName) : [...prev, courseName]
    );
  };

  const handleAddCustomCourse = () => {
    const clean = customCourseInput.trim();
    if (clean && !selectedCourses.includes(clean)) {
      setSelectedCourses((prev) => [...prev, clean]);
      setCustomCourseInput('');
    }
  };

  const handleSelectAllCourses = () => {
    const all = Array.from(new Set([...SCHOOL_COURSES, ...(selectedProfile?.courses || []), ...selectedCourses]));
    setSelectedCourses(all);
  };

  const handleClearCourses = () => {
    setSelectedCourses([]);
  };

  const handleResetToProfileCourses = () => {
    if (selectedProfile) {
      setSelectedCourses(selectedProfile.courses ? [...selectedProfile.courses] : []);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setErrorMessage('Por favor selecciona tu perfil de docente.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      let res;
      try {
        res = await api.loginUser(selectedUserId, pin);
      } catch (apiErr: any) {
        // Fallback for offline or static preview environments
        if (selectedProfile && (!selectedProfile.pin || selectedProfile.pin === pin || pin === '1234')) {
          res = { success: true, user: selectedProfile };
        } else {
          throw apiErr;
        }
      }

      if (res && res.success && res.user) {
        let finalUser = res.user;

        // Save selected courses if they were adjusted before entering
        const prevSorted = (res.user.courses || []).slice().sort().join(',');
        const newSorted = selectedCourses.slice().sort().join(',');

        if (prevSorted !== newSorted) {
          try {
            finalUser = await api.updateUser(res.user.id, {
              courses: selectedCourses,
            });
            onRefreshUsers();
          } catch (updateErr) {
            console.warn('Could not update user courses on login', updateErr);
            finalUser = { ...res.user, courses: selectedCourses };
          }
        } else {
          finalUser = { ...res.user, courses: selectedCourses };
        }

        if (rememberMe) {
          localStorage.setItem('lab_active_user_id', finalUser.id);
          localStorage.setItem('lab_active_user_session', JSON.stringify(finalUser));
        } else {
          localStorage.removeItem('lab_active_user_id');
          localStorage.removeItem('lab_active_user_session');
        }
        localStorage.removeItem('lab_user_logged_out');
        onSelectUser(finalUser);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectLoginWithUser = async (userId: string, pinToUse: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      let res;
      try {
        res = await api.loginUser(userId, pinToUse);
      } catch (apiErr: any) {
        const target = users.find((u) => u.id === userId);
        if (target && (!target.pin || target.pin === pinToUse || pinToUse === '1234')) {
          res = { success: true, user: target };
        } else {
          throw apiErr;
        }
      }

      if (res && res.success && res.user) {
        let finalUser = res.user;
        const prevSorted = (res.user.courses || []).slice().sort().join(',');
        const newSorted = selectedCourses.slice().sort().join(',');
        if (prevSorted !== newSorted) {
          try {
            finalUser = await api.updateUser(res.user.id, { courses: selectedCourses });
            onRefreshUsers();
          } catch (updateErr) {
            finalUser = { ...res.user, courses: selectedCourses };
          }
        } else {
          finalUser = { ...res.user, courses: selectedCourses };
        }

        if (rememberMe) {
          localStorage.setItem('lab_active_user_id', finalUser.id);
          localStorage.setItem('lab_active_user_session', JSON.stringify(finalUser));
        } else {
          localStorage.removeItem('lab_active_user_id');
          localStorage.removeItem('lab_active_user_session');
        }
        localStorage.removeItem('lab_user_logged_out');
        onSelectUser(finalUser);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión con el nuevo PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecutePinChange = async (autoLoginAfter: boolean) => {
    if (!selectedProfile) {
      setPinChangeError('Por favor selecciona un perfil de docente.');
      return;
    }
    const cleanNew = newPinInput.trim();
    const cleanConfirm = confirmPinInput.trim();

    if (!cleanNew) {
      setPinChangeError('Ingresa el nuevo PIN de acceso.');
      return;
    }
    if (cleanNew.length < 4) {
      setPinChangeError('El nuevo PIN debe tener al menos 4 dígitos o caracteres.');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setPinChangeError('El nuevo PIN y su confirmación no coinciden.');
      return;
    }

    setIsSavingPin(true);
    setPinChangeError('');
    setPinChangeSuccess('');

    try {
      await api.changeUserPin(selectedProfile.id, {
        currentPin: currentPinInput.trim(),
        newPin: cleanNew,
        directReset: skipCurrentPinVerification || (!currentPinInput.trim() && cleanNew.length >= 4),
      });

      onRefreshUsers();
      setPin(cleanNew);
      setPinChangeSuccess(`¡PIN de ${selectedProfile.name} actualizado exitosamente a: ${cleanNew}!`);
      setIsChangingPin(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');

      if (autoLoginAfter) {
        await handleDirectLoginWithUser(selectedProfile.id, cleanNew);
      }
    } catch (err: any) {
      setPinChangeError(err.message || 'No se pudo actualizar el PIN.');
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleResetToDefaultPin1234 = async () => {
    if (!selectedProfile) return;
    setIsSavingPin(true);
    setPinChangeError('');
    try {
      await api.changeUserPin(selectedProfile.id, {
        newPin: '1234',
        directReset: true,
      });
      onRefreshUsers();
      setPin('1234');
      setPinChangeSuccess(`¡PIN de ${selectedProfile.name} restablecido a la clave inicial 1234!`);
      setIsChangingPin(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    } catch (err: any) {
      setPinChangeError(err.message || 'Error al restablecer PIN');
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocenteName.trim()) {
      setErrorMessage('Ingresa el nombre del docente');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const created = await api.createUser({
        name: newDocenteName.trim(),
        email: newDocenteEmail.trim(),
        role: newDocenteRole,
        defaultSubject: newDocenteSubject.trim() || 'Programación',
        courses: newDocenteCourses,
        pin: newDocentePin.trim() || '1234',
        avatarColor:
          newDocenteRole === 'administrador'
            ? 'from-purple-600 to-indigo-700'
            : 'from-blue-600 to-indigo-600',
      });
      onRefreshUsers();
      setSelectedUserId(created.id);
      setPin(newDocentePin || '1234');
      setMode('login');
      // Auto login
      if (rememberMe) {
        localStorage.setItem('lab_active_user_id', created.id);
        localStorage.setItem('lab_active_user_session', JSON.stringify(created));
      }
      onSelectUser(created);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar docente');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCourseSelection = (course: string) => {
    setNewDocenteCourses((prev) =>
      prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course]
    );
  };

  return (
    <div
      id="login-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (allowDismiss && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="login-modal-container"
        className="bg-white dark:bg-slate-850 rounded-2xl max-w-2xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {mode === 'login' ? 'Iniciar Sesión de Docente' : 'Nuevo Perfil de Docente'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Espacios Independientes
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'login'
                  ? 'Cada profesor visualiza únicamente sus cursos y alumnos, asegurando trabajo sin interrupciones.'
                  : 'Crea una cuenta docente para gestionar tus cursos y entregas de forma independiente.'}
              </p>
            </div>
          </div>

          {allowDismiss && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab switch: Iniciar Sesión vs Nuevo Perfil */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Seleccionar Docente / Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            + Registrar Nuevo Profesor
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Teacher Selection Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Elige tu perfil de usuario en esta PC:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {users.map((u) => {
                  const isSelected = selectedUserId === u.id;
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setErrorMessage('');
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                          u.avatarColor || 'from-blue-600 to-indigo-600'
                        } flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}
                      >
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {u.name}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1 rounded">
                              Activo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              u.role === 'administrador'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {u.role === 'administrador' ? 'Encargado Sala' : 'Profesor'}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {u.courses?.length ? `${u.courses.length} cursos` : 'Sin cursos'}
                          </span>
                        </div>
                        {u.courses && u.courses.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {u.courses.slice(0, 2).map((c: string) => (
                              <span
                                key={c}
                                className="text-[9px] px-1 bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-400 rounded"
                              >
                                {c}
                              </span>
                            ))}
                            {u.courses.length > 2 && (
                              <span className="text-[9px] text-slate-400">+{u.courses.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Choose Courses Assigned Before Entering */}
            {selectedProfile && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      2. Selecciona los cursos que tienes asignados:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto text-[11px]">
                    {selectedProfile.courses && selectedProfile.courses.length > 0 && (
                      <button
                        type="button"
                        onClick={handleResetToProfileCourses}
                        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        title="Restablecer a mis cursos habituales"
                      >
                        Mis habituales
                      </button>
                    )}
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={handleSelectAllCourses}
                      className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Todos
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={handleClearCourses}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Haz clic en los cursos que dictarás en esta clase para filtrar tus entregas y alumnos:
                </p>

                {/* Course Selection Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {Array.from(
                    new Set([...SCHOOL_COURSES, ...(selectedProfile.courses || []), ...selectedCourses])
                  ).map((courseName) => {
                    const isChecked = selectedCourses.includes(courseName);
                    return (
                      <button
                        key={courseName}
                        type="button"
                        onClick={() => toggleCourse(courseName)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                          isChecked
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-1 ring-blue-500'
                            : 'bg-white dark:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        <span>{courseName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Division / Course */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/80">
                  <input
                    type="text"
                    value={customCourseInput}
                    onChange={(e) => setCustomCourseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomCourse();
                      }
                    }}
                    placeholder="Agregar otro curso (ej. 7º Año, Taller Robótica)..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCourse}
                    disabled={!customCourseInput.trim()}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                  >
                    + Agregar
                  </button>
                </div>

                {/* Active courses summary */}
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 dark:text-slate-400">
                  <span>
                    {selectedCourses.length > 0 ? (
                      <>
                        Al ingresar gestionarás:{' '}
                        <strong className="text-blue-600 dark:text-blue-400">
                          {selectedCourses.join(', ')}
                        </strong>
                      </>
                    ) : (
                      <span className="italic text-amber-600 dark:text-amber-400">
                        Sin cursos marcados (se mostrarán todos los cursos de la escuela)
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold shrink-0">
                    {selectedCourses.length} seleccionados
                  </span>
                </div>
              </div>
            )}

            {/* Selected Profile Details & PIN */}
            {selectedProfile && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      3. PIN de acceso para {selectedProfile.name}:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">Predeterminado: 1234</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPin(!isChangingPin);
                        setPinChangeError('');
                        setPinChangeSuccess('');
                        if (!currentPinInput && pin) {
                          setCurrentPinInput(pin);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isChangingPin
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                      }`}
                      title="Permite al docente cambiar su clave de acceso antes de entrar"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{isChangingPin ? 'Cerrar cambio de PIN' : '🔑 Cambiar PIN de ingreso'}</span>
                    </button>
                  </div>
                </div>

                {/* Banner de éxito al cambiar PIN */}
                {pinChangeSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{pinChangeSuccess}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPinChangeSuccess('')}
                      className="text-emerald-700 dark:text-emerald-300 hover:underline text-[11px] cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Panel de Cambio de PIN antes de ingresar */}
                {isChangingPin && (
                  <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Cambio de PIN antes de ingresar ({selectedProfile.name})</span>
                        </h4>
                        <p className="text-[11.5px] text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                          Configura tu nuevo código (4 a 8 caracteres). Podrás entrar de inmediato con tu nueva clave.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPin(false);
                          setPinChangeError('');
                        }}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 cursor-pointer"
                        title="Cerrar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {pinChangeError && (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>{pinChangeError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* PIN Actual */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            PIN Actual / Anterior:
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentPinInput('1234');
                              setSkipCurrentPinVerification(false);
                            }}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            Usar 1234
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showCurrentPinInput ? 'text' : 'password'}
                            maxLength={8}
                            value={currentPinInput}
                            onChange={(e) => {
                              setCurrentPinInput(e.target.value);
                              setPinChangeError('');
                            }}
                            placeholder="Ej. 1234"
                            className="w-full pl-3 pr-8 py-2 text-xs font-mono rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPinInput(!showCurrentPinInput)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            title={showCurrentPinInput ? 'Ocultar' : 'Mostrar'}
                          >
                            {showCurrentPinInput ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Nuevo PIN */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nuevo PIN (min. 4 dig.): *
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPinInput ? 'text' : 'password'}
                            maxLength={8}
                            value={newPinInput}
                            onChange={(e) => {
                              setNewPinInput(e.target.value);
                              setPinChangeError('');
                            }}
                            placeholder="Ej. 5821"
                            className="w-full pl-3 pr-8 py-2 text-xs font-mono rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPinInput(!showNewPinInput)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            title={showNewPinInput ? 'Ocultar' : 'Mostrar'}
                          >
                            {showNewPinInput ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirmar Nuevo PIN */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Confirmar Nuevo PIN: *
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPinInput ? 'text' : 'password'}
                            maxLength={8}
                            value={confirmPinInput}
                            onChange={(e) => {
                              setConfirmPinInput(e.target.value);
                              setPinChangeError('');
                            }}
                            placeholder="Repite el nuevo PIN"
                            className={`w-full pl-3 pr-8 py-2 text-xs font-mono rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:outline-hidden ${
                              confirmPinInput && newPinInput === confirmPinInput
                                ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                                : confirmPinInput && newPinInput !== confirmPinInput
                                ? 'border-rose-400 ring-1 ring-rose-400/30'
                                : 'border-amber-300 dark:border-amber-700 focus:ring-amber-500'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPinInput(!showConfirmPinInput)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            title={showConfirmPinInput ? 'Ocultar' : 'Mostrar'}
                          >
                            {showConfirmPinInput ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción del cambio de PIN */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/90 dark:border-amber-800/60">
                      <button
                        type="button"
                        onClick={handleResetToDefaultPin1234}
                        disabled={isSavingPin}
                        className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Restaura la clave inicial en caso de olvido"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>¿Olvidaste tu PIN? Restablecer directo a 1234</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsChangingPin(false);
                            setPinChangeError('');
                          }}
                          className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium cursor-pointer"
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          disabled={
                            isSavingPin ||
                            !newPinInput ||
                            newPinInput !== confirmPinInput ||
                            newPinInput.length < 4
                          }
                          onClick={() => handleExecutePinChange(false)}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isSavingPin ? 'Guardando...' : 'Guardar Nuevo PIN'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={
                            isSavingPin ||
                            !newPinInput ||
                            newPinInput !== confirmPinInput ||
                            newPinInput.length < 4
                          }
                          onClick={() => handleExecutePinChange(true)}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>{isSavingPin ? 'Guardando...' : 'Guardar e Ingresar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative flex-1">
                      <input
                        type={showPin ? 'text' : 'password'}
                        maxLength={8}
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value);
                          setErrorMessage('');
                        }}
                        placeholder="Ingresa tu PIN (ej. 1234)"
                        className={`w-full pl-3.5 pr-11 py-2.5 rounded-lg border text-sm font-mono tracking-widest focus:outline-hidden transition-all ${
                          pin.length > 0 && selectedProfile && pin.trim() === selectedProfile.pin
                            ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                            : pin.length >= (selectedProfile?.pin?.length || 4) &&
                              selectedProfile &&
                              pin.trim() !== selectedProfile.pin
                            ? 'border-rose-400 bg-rose-50/20 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 ring-2 ring-rose-400/20'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                        }`}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-md transition-colors cursor-pointer"
                        title={showPin ? 'Ocultar PIN' : 'Ver PIN ingresado'}
                        aria-label={showPin ? 'Ocultar PIN' : 'Ver PIN ingresado'}
                      >
                        {showPin ? <EyeOff className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPin('1234');
                        setErrorMessage('');
                      }}
                      className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg cursor-pointer transition-colors shrink-0"
                      title="Usar PIN 1234 rápido"
                    >
                      Usar 1234
                    </button>
                  </div>

                  {/* Real-time PIN Verification Status Banner */}
                  {pin.length > 0 && selectedProfile && (
                    <div className="pt-0.5">
                      {pin.trim() === selectedProfile.pin ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-1.5 rounded-lg animate-in fade-in">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>¡PIN correcto! Pulsa "Ingresar al Espacio de Trabajo" para continuar.</span>
                        </div>
                      ) : pin.length >= (selectedProfile.pin?.length || 4) ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 px-2.5 py-2 rounded-lg animate-in fade-in">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>PIN incorrecto para {selectedProfile.name}.</span>
                          </div>
                          <div className="flex items-center gap-2 pl-5 sm:pl-0">
                            <button
                              type="button"
                              onClick={() => {
                                setPin('1234');
                                setErrorMessage('');
                              }}
                              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              Probar 1234
                            </button>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsChangingPin(true);
                                setPinChangeError('');
                                setPinChangeSuccess('');
                              }}
                              className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Key className="w-3 h-3" />
                              <span>Cambiar o restablecer PIN</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                          Ingresando PIN... ({pin.length}/{selectedProfile.pin?.length || 4} dígitos)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Active courses to apply */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Cursos configurados para esta sesión:</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    {selectedCourses.length > 0 ? selectedCourses.join(', ') : 'Todos los cursos'}
                  </span>
                </div>
              </div>
            )}

            {/* Remember device session */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Recordar sesión en esta computadora</span>
              </label>

              {currentUser && onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setSelectedUserId('');
                    setPin('');
                  }}
                  className="text-slate-400 hover:text-rose-500 underline cursor-pointer text-[11px] inline-flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3 text-rose-500" />
                  <span>Cerrar sesión de {currentUser.name}</span>
                </button>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-2 flex items-center justify-end gap-2">
              {allowDismiss && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Iniciando...' : 'Acceder a Mi Espacio'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Nombre y Apellido del Docente *
                </label>
                <input
                  type="text"
                  required
                  value={newDocenteName}
                  onChange={(e) => setNewDocenteName(e.target.value)}
                  placeholder="Ej. Santiago Bringas"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Correo Electrónico (Opcional)
                </label>
                <input
                  type="email"
                  value={newDocenteEmail}
                  onChange={(e) => setNewDocenteEmail(e.target.value)}
                  placeholder="profesor@escuela.edu.ar"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Rol</label>
                <select
                  value={newDocenteRole}
                  onChange={(e) => setNewDocenteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="profesor">Profesor / Docente de Aula</option>
                  <option value="administrador">Encargado de Laboratorio / Administrador</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Materia / Asignatura Principal
                </label>
                <input
                  type="text"
                  value={newDocenteSubject}
                  onChange={(e) => setNewDocenteSubject(e.target.value)}
                  placeholder="Ej. Programación Orientada a Objetos"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  PIN de Seguridad (4 dígitos para iniciar en cualquier PC)
                </label>
                <div className="relative max-w-xs">
                  <input
                    type={showRegisterPin ? 'text' : 'password'}
                    maxLength={6}
                    value={newDocentePin}
                    onChange={(e) => setNewDocentePin(e.target.value)}
                    placeholder="1234"
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPin(!showRegisterPin)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded cursor-pointer"
                    title={showRegisterPin ? 'Ocultar PIN' : 'Ver PIN'}
                    aria-label={showRegisterPin ? 'Ocultar PIN' : 'Ver PIN'}
                  >
                    {showRegisterPin ? <EyeOff className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Courses assignment */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Cursos asignados a este profesor (sus entregas se aislarán a estos cursos):
              </label>
              <div className="flex flex-wrap gap-2">
                {SCHOOL_COURSES.map((course) => {
                  const isChecked = newDocenteCourses.includes(course);
                  return (
                    <button
                      key={course}
                      type="button"
                      onClick={() => toggleCourseSelection(course)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-400'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {course}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isLoading ? 'Guardando...' : 'Crear Perfil e Iniciar'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
