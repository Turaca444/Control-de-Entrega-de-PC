import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Radio,
  PlusCircle,
  Wrench,
  RotateCcw,
  FileText,
  Laptop,
  CheckCheck,
  User,
  GraduationCap,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AdminNotification, UserProfile } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: AdminNotification[];
  currentUser: UserProfile | null;
  onOpenNewDelivery: () => void;
  onOpenQuickIncident: () => void;
  onOpenUserProfile: () => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onRefreshData: () => void;
  realtimeConnected: boolean;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllRead: () => void;
  onTestPush: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  notifications,
  currentUser,
  onOpenNewDelivery,
  onOpenQuickIncident,
  onOpenUserProfile,
  onOpenLoginModal,
  onLogout,
  onRefreshData,
  realtimeConnected,
  onMarkNotificationRead,
  onMarkAllRead,
  onTestPush,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      setPushPermission(res);
      if (res === 'granted') {
        new Notification('Notificaciones Push Habilitadas', {
          body: 'Recibirás alertas automáticas de fallas en equipos y mantenimiento preventivo.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo and system title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Control de PC - Sala de Programación
                </h1>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-950 text-blue-300 border border-blue-800">
                  API REST v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Asignaciones por docente y materia • Historial de daños • Alertas preventivas
              </p>
            </div>
          </div>

          {/* Center/Right utilities: Real-time status, Quick Actions & Notifications */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time synchronization indicator */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                realtimeConnected
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                  : 'bg-amber-950/60 text-amber-400 border-amber-800/80'
              }`}
              title={realtimeConnected ? 'Sincronizado en tiempo real vía SSE' : 'Conectando al servidor...'}
            >
              <span className="relative flex h-2 w-2">
                {realtimeConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    realtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <span className="text-[11px]">
                {realtimeConnected ? 'En Vivo (Sincronizado)' : 'Reconectando...'}
              </span>
            </div>

            {/* Quick action: Nueva Entrega */}
            <button
              id="btn-quick-delivery"
              onClick={onOpenNewDelivery}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Entregar PC</span>
            </button>

            {/* Quick action: Reportar Incidencia */}
            <button
              id="btn-quick-incident"
              onClick={onOpenQuickIncident}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 border border-rose-800/80 transition-colors cursor-pointer"
              title="Registrar incidencia técnica rápida"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Incidencia Rápida</span>
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                id="btn-notifications-toggle"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Centro de Notificaciones Push"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 text-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Notificaciones Push ({unreadCount} nuevas)
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllRead}
                        className="text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                      >
                        Marcar todas
                      </button>
                    )}
                  </div>

                  {/* Browser Push Permission Banner */}
                  {pushPermission !== 'granted' && (
                    <div className="px-3 py-2 bg-blue-950/40 border-b border-blue-900/40 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-blue-200">
                        Activa las notificaciones en el navegador para recibir alertas en tiempo real.
                      </span>
                      <button
                        onClick={requestPushPermission}
                        className="px-2 py-0.5 text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded cursor-pointer shrink-0"
                      >
                        Permitir
                      </button>
                    </div>
                  )}

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No hay notificaciones recientes.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors ${
                            n.read ? 'bg-slate-900/40 text-slate-400' : 'bg-slate-850 text-slate-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span
                              className={`font-semibold ${
                                n.priority === 'urgente'
                                  ? 'text-rose-400'
                                  : n.priority === 'alta'
                                  ? 'text-amber-400'
                                  : 'text-blue-400'
                              }`}
                            >
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {new Date(n.timestamp).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[11.5px] leading-relaxed text-slate-300 mb-2">
                            {n.message}
                          </p>
                          <div className="flex items-center justify-between text-[10px]">
                            {n.pcNumber && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300">
                                {n.pcNumber}
                              </span>
                            )}
                            {!n.read && (
                              <button
                                onClick={() => onMarkNotificationRead(n.id)}
                                className="text-blue-400 hover:text-blue-300 cursor-pointer"
                              >
                                Marcar leída
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
                    <button
                      onClick={onTestPush}
                      className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Probar Notificación Push
                    </button>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Teacher Workstation Capsule */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                <button
                  id="btn-user-profile"
                  onClick={onOpenUserProfile}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-left transition-colors cursor-pointer group"
                  title="Configurar mis cursos y perfil"
                >
                  <div
                    className={`w-7 h-7 rounded-md bg-gradient-to-br ${
                      currentUser.avatarColor || 'from-blue-600 to-indigo-600'
                    } flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0`}
                  >
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden md:block leading-tight pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors truncate max-w-[120px]">
                        {currentUser.name}
                      </span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
                          currentUser.role === 'administrador'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {currentUser.role === 'administrador' ? 'Admin' : 'Docente'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                      {currentUser.courses && currentUser.courses.length > 0
                        ? currentUser.courses.join(', ')
                        : 'Todos los cursos'}
                    </span>
                  </div>
                </button>

                {/* Switch teacher / login button */}
                <button
                  id="btn-switch-user"
                  onClick={onOpenLoginModal}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Cambiar de profesor en esta PC"
                >
                  <Users className="w-4 h-4" />
                </button>

                {/* Logout button */}
                <button
                  id="btn-logout-teacher"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800/70 transition-colors cursor-pointer"
                  title={`Cerrar sesión de ${currentUser.name}`}
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-login-prompt"
                onClick={onOpenLoginModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Ingresar Docente</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar text-xs sm:text-sm font-medium">
          <button
            id="tab-deliveries"
            onClick={() => setActiveTab('deliveries')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'deliveries'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCheck className="w-4 h-4" />
            <span>Entregas y Devolución</span>
          </button>

          <button
            id="tab-computers"
            onClick={() => setActiveTab('computers')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'computers'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Historial por Equipo</span>
          </button>

          <button
            id="tab-reports"
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Reportes PDF (Docente & Fecha)</span>
          </button>

          <button
            id="tab-incidents"
            onClick={() => setActiveTab('incidents')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'incidents'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Incidencias y Reparaciones</span>
          </button>

          <button
            id="tab-alerts"
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Alertas Preventivas</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
