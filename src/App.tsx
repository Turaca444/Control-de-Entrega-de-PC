import React, { useState, useEffect, useCallback } from 'react';
import {
  Laptop,
  AlertTriangle,
  RotateCw,
  Bell,
  CheckCircle2,
  X,
  Radio,
} from 'lucide-react';
import {
  Computer,
  DeliveryRecord,
  IncidentRecord,
  RepairRecord,
  MaintenanceAlert,
  AdminNotification,
  SystemStats,
  UserProfile,
  DEFAULT_USER_PROFILES,
} from './types';
import { api } from './utils/api';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { DeliveriesView } from './components/DeliveriesView';
import { ComputersView } from './components/ComputersView';
import { ReportsView } from './components/ReportsView';
import { IncidentsView } from './components/IncidentsView';
import { AlertsView } from './components/AlertsView';
import { NewDeliveryModal } from './components/NewDeliveryModal';
import { QuickIncidentModal } from './components/QuickIncidentModal';
import { LoginModal } from './components/LoginModal';
import { UserProfileModal } from './components/UserProfileModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('deliveries');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('lab_cached_user_profiles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_USER_PROFILES;
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('lab_active_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.defaultSubject === 'Programación y Sistemas Informáticos') {
          parsed.defaultSubject = '';
          localStorage.setItem('lab_active_user_session', JSON.stringify(parsed));
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; message: string; type: 'info' | 'warn' | 'success' | 'error' } | null>(null);

  // Modals
  const [isNewDeliveryModalOpen, setIsNewDeliveryModalOpen] = useState<boolean>(false);
  const [isQuickIncidentOpen, setIsQuickIncidentOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState<boolean>(false);

  // Show browser push notification helper
  const triggerBrowserPush = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Browser notification error:', e);
      }
    }
  };

  const showToast = (title: string, message: string, type: 'info' | 'warn' | 'success' | 'error' = 'info') => {
    setToastMessage({ title, message, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.title === title ? null : prev));
    }, 5000);
  };

  // Load all initial data from server
  const loadAllData = useCallback(async () => {
    try {
      const [sData, cData, dData, iData, rData, aData, nData, uData] = await Promise.all([
        api.getStats(),
        api.getComputers(),
        api.getDeliveries(),
        api.getIncidents(),
        api.getRepairs(),
        api.getAlerts(),
        api.getNotifications(),
        api.getUsers().catch(() => []),
      ]);

      setStats(sData);
      setComputers(cData);
      setDeliveries(dData);
      setIncidents(iData);
      setRepairs(rData);
      setAlerts(aData);
      setNotifications(nData);
      const resolvedUsers = (uData && Array.isArray(uData) && uData.length > 0) ? uData : DEFAULT_USER_PROFILES;
      const sanitizedUsers = resolvedUsers.map((u: UserProfile) =>
        u.defaultSubject === 'Programación y Sistemas Informáticos'
          ? { ...u, defaultSubject: '' }
          : u
      );
      setUsers(sanitizedUsers);
      try {
        localStorage.setItem('lab_cached_user_profiles', JSON.stringify(sanitizedUsers));
      } catch {}

      // Maintain active user or restore session unless explicitly logged out
      setCurrentUser((prev) => {
        if (prev) {
          const found = sanitizedUsers.find((u: UserProfile) => u.id === prev.id);
          if (found) return found;
        }
        const isExplicitlyLoggedOut = localStorage.getItem('lab_user_logged_out') === 'true';
        if (isExplicitlyLoggedOut) {
          return null;
        }
        try {
          const saved = localStorage.getItem('lab_active_user_session');
          if (saved) {
            const parsed = JSON.parse(saved);
            const found = sanitizedUsers.find((u: UserProfile) => u.id === parsed.id);
            if (found) return found;
          }
        } catch (e) {
          console.warn(e);
        }
        const defaultProf = sanitizedUsers.find((u: UserProfile) => u.role === 'profesor') || sanitizedUsers[0];
        return defaultProf || null;
      });
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Real-time EventSource connection
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          setRealtimeConnected(true);
        };

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'connected') return;

            // Handle real-time push events from database store
            if (data.type === 'delivery:created') {
              showToast('Nueva Asignación de PC', `${data.payload.studentName} ha recibido ${data.payload.pcNumber} para ${data.payload.subjectName}.`, 'info');
              loadAllData();
            } else if (data.type === 'delivery:returned') {
              showToast('Equipo Devuelto', `Equipo ${data.payload.pcNumber} devuelto por ${data.payload.studentName}.`, 'success');
              loadAllData();
            } else if (data.type === 'incident:created') {
              showToast('Alerta de Incidencia / Falla', `Falla en ${data.payload.pcNumber}: ${data.payload.description}`, 'warn');
              triggerBrowserPush(`Alerta en ${data.payload.pcNumber}`, data.payload.description);
              loadAllData();
            } else if (data.type === 'alert:created') {
              showToast('Alerta Mantenimiento Preventivo', `${data.payload.pcNumber}: ${data.payload.triggerReason}`, 'warn');
              triggerBrowserPush(`Mantenimiento Preventivo: ${data.payload.pcNumber}`, data.payload.suggestedAction);
              loadAllData();
            } else if (data.type === 'notification:push') {
              triggerBrowserPush(data.payload.title, data.payload.message);
              loadAllData();
            } else if (data.type === 'repair:created' || data.type === 'repair:completed') {
              loadAllData();
            }
          } catch (err) {
            console.error('Error parsing SSE event:', err);
          }
        };

        eventSource.onerror = () => {
          setRealtimeConnected(false);
          eventSource?.close();
          // Try reconnecting in 4 seconds
          reconnectTimeout = setTimeout(connectSSE, 4000);
        };
      } catch (err) {
        console.error('Failed to setup SSE:', err);
        setRealtimeConnected(false);
      }
    };

    connectSSE();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, [loadAllData]);

  // User Authentication Handlers
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    try {
      localStorage.setItem('lab_active_user_session', JSON.stringify(user));
      localStorage.setItem('lab_active_user_id', user.id);
      localStorage.removeItem('lab_user_logged_out');
    } catch (e) {
      console.warn('Could not persist user session', e);
    }
    setIsLoginModalOpen(false);
    const coursesSummary =
      user.courses && user.courses.length > 0
        ? `Cursos activos: ${user.courses.join(', ')}.`
        : 'Todos los cursos del laboratorio habilitados.';
    showToast(
      'Sesión Iniciada',
      `Bienvenido(a) Prof. ${user.name}. ${coursesSummary}`,
      'success'
    );
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('lab_active_user_session');
      localStorage.removeItem('lab_active_user_id');
      localStorage.setItem('lab_user_logged_out', 'true');
    } catch (e) {
      console.warn('Could not remove user session', e);
    }
    setCurrentUser(null);
    setIsLoginModalOpen(true);
    showToast('Sesión Finalizada', 'Has cerrado tu sesión docente correctamente.', 'info');
  };

  const handleUpdateCurrentUser = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('lab_active_user_session', JSON.stringify(user));
    } catch (e) {
      console.warn('Could not persist updated session', e);
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    showToast('Perfil Actualizado', 'Tus cursos y preferencias han sido actualizados.', 'success');
  };

  // Handlers
  const handleCreateDelivery = async (data: any) => {
    await api.createDelivery(data);
    await loadAllData();
    const isOnlyCharger = data.onlyCharger || data.pcNumber === 'SOLO-CARGADOR';
    const isOnlyMouse = data.onlyMouse || data.pcNumber === 'SOLO-MOUSE';
    let title = 'Asignación Creada';
    let message = `PC ${data.pcNumber} asignada a ${data.studentName}.`;
    if (isOnlyCharger) {
      title = '⚡ Cargador Prestado';
      message = `${data.chargerNumber || 'Cargador'} prestado a ${data.studentName} (PC propia).`;
    } else if (isOnlyMouse) {
      title = '🖱️ Mouse Prestado';
      const brandSuffix = data.mouseBrand ? ` (${data.mouseBrand})` : '';
      message = `${data.mouseNumber || 'Mouse'}${brandSuffix} prestado a ${data.studentName} (PC propia).`;
    }
    showToast(title, message, 'success');
  };

  const handleReturnDelivery = async (deliveryId: string, returnData: any) => {
    await api.returnDelivery(deliveryId, returnData);
    await loadAllData();
  };

  const handleAssignCharger = async (
    deliveryId: string,
    chargerData: { chargerNumber: string; reason?: string }
  ) => {
    try {
      const updated = await api.assignChargerToDelivery(deliveryId, {
        ...chargerData,
        registeredBy: currentUser?.name || 'Operador',
      });
      await loadAllData();
      showToast(
        '⚡ Cargador Asignado',
        `Se asignó ${chargerData.chargerNumber} a ${updated.studentName} (${updated.pcNumber}) por batería baja.`,
        'success'
      );
    } catch (err: any) {
      showToast('Error al asignar cargador', err.message || 'No se pudo asignar el cargador.', 'error');
    }
  };

  const handleAssignMouse = async (
    deliveryId: string,
    mouseData: { mouseNumber: string; mouseBrand?: string; reason?: string }
  ) => {
    try {
      const updated = await api.assignMouseToDelivery(deliveryId, {
        ...mouseData,
        registeredBy: currentUser?.name || 'Operador',
      });
      await loadAllData();
      const brandLabel = mouseData.mouseBrand ? ` (${mouseData.mouseBrand})` : '';
      showToast(
        '🖱️ Mouse Asignado',
        `Se asignó ${mouseData.mouseNumber}${brandLabel} a ${updated.studentName} (${updated.pcNumber}).`,
        'success'
      );
    } catch (err: any) {
      showToast('Error al asignar mouse', err.message || 'No se pudo asignar el mouse.', 'error');
    }
  };

  const handleDeleteDelivery = async (deliveryId: string) => {
    try {
      await api.deleteDelivery(deliveryId);
      await loadAllData();
      showToast('Registro Eliminado', 'Se eliminó el préstamo de la planilla y se liberó el equipo.', 'info');
    } catch (err: any) {
      showToast('Error al eliminar', err.message || 'No se pudo eliminar el registro.', 'error');
    }
  };

  const handleReturnCourse = async (courseName: string, teacherName?: string) => {
    try {
      const res = await api.returnCourseDeliveries(courseName, teacherName);
      await loadAllData();
      showToast(
        'Fin de Clase',
        teacherName
          ? `Se devolvieron ${res.count || 0} computadoras del curso ${courseName} (Prof. ${teacherName}).`
          : `Se devolvieron ${res.count || 0} computadoras del curso ${courseName}.`,
        'success'
      );
    } catch (err: any) {
      showToast('Error al devolver curso', err.message || 'No se pudieron devolver los equipos.', 'error');
    }
  };

  const handleDeleteCourse = async (courseName: string, teacherName?: string) => {
    try {
      const res = await api.deleteCourseDeliveries(courseName, teacherName);
      await loadAllData();
      showToast(
        'Curso Finalizado',
        teacherName
          ? `Se eliminaron los registros de tu clase en ${courseName} (Prof. ${teacherName}).`
          : `Se eliminaron ${res.count || 0} alumnos del curso ${courseName} de la planilla.`,
        'info'
      );
    } catch (err: any) {
      showToast('Error al eliminar curso', err.message || 'No se pudieron eliminar los registros.', 'error');
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleTestPush = async () => {
    try {
      await api.testPushNotification();
      showToast('Push Enviado', 'Se ha emitido una notificación push de prueba al panel y navegador.', 'info');
      triggerBrowserPush('Prueba de Notificación Push Admin', 'El canal de notificaciones en tiempo real del laboratorio está operativo.');
      loadAllData();
    } catch (e: any) {
      showToast('Error de Notificación', e.message || 'Error al emitir push', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        currentUser={currentUser}
        onOpenNewDelivery={() => setIsNewDeliveryModalOpen(true)}
        onOpenQuickIncident={() => setIsQuickIncidentOpen(true)}
        onOpenUserProfile={() => setIsUserProfileModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onRefreshData={loadAllData}
        realtimeConnected={realtimeConnected}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllRead}
        onTestPush={handleTestPush}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* KPI Stats Bar */}
        <StatsBar
          stats={stats}
          onFilterStatus={(status) => {
            setActiveTab('computers');
          }}
        />

        {/* Dynamic View based on Active Tab */}
        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700 space-y-3">
            <RotateCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Cargando base de datos del laboratorio de cómputo...
            </p>
          </div>
        ) : (
          <div>
            {activeTab === 'deliveries' && (
              <DeliveriesView
                deliveries={deliveries}
                computers={computers}
                currentUser={currentUser}
                onOpenNewDelivery={() => setIsNewDeliveryModalOpen(true)}
                onReturnDelivery={handleReturnDelivery}
                onAssignCharger={handleAssignCharger}
                onAssignMouse={handleAssignMouse}
                onDeleteDelivery={handleDeleteDelivery}
                onReturnCourse={handleReturnCourse}
                onDeleteCourse={handleDeleteCourse}
                onRefresh={loadAllData}
                onLogout={handleLogout}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
              />
            )}

            {activeTab === 'computers' && (
              <ComputersView
                computers={computers}
                deliveries={deliveries}
                incidents={incidents}
                repairs={repairs}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView deliveries={deliveries} />
            )}

            {activeTab === 'incidents' && (
              <IncidentsView
                incidents={incidents}
                repairs={repairs}
                computers={computers}
                onRefresh={loadAllData}
                onOpenQuickIncident={() => setIsQuickIncidentOpen(true)}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsView
                alerts={alerts}
                computers={computers}
                onRefresh={loadAllData}
                onTestPush={handleTestPush}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Real-time Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-xl p-4 shadow-2xl border border-slate-700 flex items-start justify-between gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-2.5">
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : toastMessage.type === 'warn' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Bell className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-slate-100">{toastMessage.title}</h5>
              <p className="text-[11.5px] text-slate-300 leading-snug">{toastMessage.message}</p>
            </div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal: Nueva Asignación / Entrega */}
      <NewDeliveryModal
        isOpen={isNewDeliveryModalOpen}
        onClose={() => setIsNewDeliveryModalOpen(false)}
        computers={computers}
        currentUser={currentUser}
        onSubmit={handleCreateDelivery}
      />

      {/* Modal: Registro Rápido de Incidencia */}
      <QuickIncidentModal
        isOpen={isQuickIncidentOpen}
        onClose={() => setIsQuickIncidentOpen(false)}
        computers={computers}
        onSuccess={loadAllData}
      />

      {/* Modal: Inicio de Sesión y Selección de Docente */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onRefreshUsers={loadAllData}
        onLogout={handleLogout}
      />

      {/* Modal: Configuración de Perfil Docente y Cursos Asignados */}
      {currentUser && (
        <UserProfileModal
          isOpen={isUserProfileModalOpen}
          onClose={() => setIsUserProfileModalOpen(false)}
          currentUser={currentUser}
          allUsers={users}
          onUpdateCurrentUser={handleUpdateCurrentUser}
          onRefreshAllUsers={loadAllData}
          onLogout={handleLogout}
        />
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Sistema de Control de Entrega de PC — Sala de Programación & Laboratorio de Cómputo
          </span>
          <div className="flex items-center gap-3">
            <span>Sincronización en la Nube en Tiempo Real</span>
            <span>•</span>
            <span>Exportación en PDF</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
