import {
  Computer,
  DeliveryRecord,
  IncidentRecord,
  RepairRecord,
  MaintenanceAlert,
  AdminNotification,
  SystemStats,
  UserProfile,
} from '../types';

export const api = {
  // Stats
  async getStats(): Promise<SystemStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Error al obtener estadísticas');
    return res.json();
  },

  // Computers
  async getComputers(): Promise<Computer[]> {
    const res = await fetch('/api/computers');
    if (!res.ok) throw new Error('Error al obtener equipos');
    return res.json();
  },

  async getComputerDetail(id: string): Promise<{
    computer: Computer;
    history: {
      deliveries: DeliveryRecord[];
      incidents: IncidentRecord[];
      repairs: RepairRecord[];
    };
  }> {
    const res = await fetch(`/api/computers/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Error al obtener detalle del equipo');
    return res.json();
  },

  async createComputer(data: Partial<Computer>): Promise<Computer> {
    const res = await fetch('/api/computers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar equipo');
    }
    return res.json();
  },

  async updateComputer(id: string, data: Partial<Computer>): Promise<Computer> {
    const res = await fetch(`/api/computers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar equipo');
    return res.json();
  },

  // Deliveries
  async getDeliveries(params?: {
    teacherName?: string;
    startDate?: string;
    endDate?: string;
    pcNumber?: string;
    subjectName?: string;
    status?: string;
  }): Promise<DeliveryRecord[]> {
    const query = new URLSearchParams();
    if (params?.teacherName) query.append('teacherName', params.teacherName);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.pcNumber) query.append('pcNumber', params.pcNumber);
    if (params?.subjectName) query.append('subjectName', params.subjectName);
    if (params?.status) query.append('status', params.status);

    const res = await fetch(`/api/deliveries?${query.toString()}`);
    if (!res.ok) throw new Error('Error al obtener entregas');
    return res.json();
  },

  async createDelivery(data: {
    pcNumber: string;
    studentName: string;
    studentId: string;
    studentCareer?: string;
    teacherName: string;
    subjectName: string;
    observations?: string;
    expectedReturnTime?: string;
    registeredBy?: string;
    includesCharger?: boolean;
    chargerNumber?: string;
    onlyCharger?: boolean;
    includesMouse?: boolean;
    mouseNumber?: string;
    mouseBrand?: string;
    onlyMouse?: boolean;
  }): Promise<DeliveryRecord> {
    const res = await fetch('/api/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar entrega de PC');
    }
    return res.json();
  },

  async returnDelivery(
    id: string,
    data: {
      returnObservations?: string;
      reportedDamageOnReturn?: boolean;
      incidentDescription?: string;
      incidentSeverity?: string;
      incidentType?: string;
      chargerReturned?: boolean;
      mouseReturned?: boolean;
    }
  ): Promise<DeliveryRecord> {
    const res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/return`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar devolución');
    }
    return res.json();
  },

  async assignChargerToDelivery(
    id: string,
    data: {
      chargerNumber: string;
      reason?: string;
      registeredBy?: string;
    }
  ): Promise<DeliveryRecord> {
    const res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/assign-charger`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al asignar cargador');
    }
    return res.json();
  },

  async removeChargerFromDelivery(id: string): Promise<DeliveryRecord> {
    const res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/charger`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al quitar cargador');
    }
    return res.json();
  },

  async assignMouseToDelivery(
    id: string,
    data: {
      mouseNumber: string;
      mouseBrand?: string;
      reason?: string;
      registeredBy?: string;
    }
  ): Promise<DeliveryRecord> {
    const res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/assign-mouse`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al asignar mouse');
    }
    return res.json();
  },

  async removeMouseFromDelivery(id: string): Promise<DeliveryRecord> {
    const res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/mouse`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al quitar mouse');
    }
    return res.json();
  },

  async deleteDelivery(id: string): Promise<boolean> {
    const res = await fetch(`/api/deliveries/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar asignación de la planilla');
    }
    return true;
  },

  async returnCourseDeliveries(course: string, teacherName?: string): Promise<{ success: boolean; count: number }> {
    const res = await fetch('/api/deliveries/return-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course, teacherName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al finalizar clase del curso');
    }
    return res.json();
  },

  async deleteCourseDeliveries(course: string, teacherName?: string): Promise<{ success: boolean; count: number }> {
    const res = await fetch('/api/deliveries/delete-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course, teacherName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar alumnos del curso de la planilla');
    }
    return res.json();
  },

  // Incidents
  async getIncidents(pcNumber?: string): Promise<IncidentRecord[]> {
    const query = pcNumber ? `?pcNumber=${encodeURIComponent(pcNumber)}` : '';
    const res = await fetch(`/api/incidents${query}`);
    if (!res.ok) throw new Error('Error al obtener incidencias');
    return res.json();
  },

  async createIncident(data: {
    pcNumber: string;
    deliveryId?: string;
    reportedBy: string;
    type: string;
    severity: string;
    description: string;
    observations?: string;
  }): Promise<IncidentRecord> {
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al registrar incidencia');
    return res.json();
  },

  // Repairs
  async getRepairs(pcNumber?: string): Promise<RepairRecord[]> {
    const query = pcNumber ? `?pcNumber=${encodeURIComponent(pcNumber)}` : '';
    const res = await fetch(`/api/repairs${query}`);
    if (!res.ok) throw new Error('Error al obtener reparaciones');
    return res.json();
  },

  async createRepair(data: {
    pcNumber: string;
    technicianName: string;
    faultDiagnosis: string;
    workDone: string;
    replacedParts?: string[];
    costEstimate?: number;
    finalStatus?: string;
    observations?: string;
  }): Promise<RepairRecord> {
    const res = await fetch('/api/repairs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al registrar orden de reparación');
    return res.json();
  },

  async completeRepair(
    id: string,
    data: {
      workDone: string;
      replacedParts?: string[];
      costEstimate?: number;
      finalStatus: 'reparado' | 'requiere_baja';
      observations?: string;
    }
  ): Promise<RepairRecord> {
    const res = await fetch(`/api/repairs/${encodeURIComponent(id)}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al finalizar reparación');
    return res.json();
  },

  // Maintenance Alerts
  async getMaintenanceAlerts(): Promise<MaintenanceAlert[]> {
    const res = await fetch('/api/maintenance/alerts');
    if (!res.ok) throw new Error('Error al obtener alertas de mantenimiento');
    return res.json();
  },

  async getAlerts(): Promise<MaintenanceAlert[]> {
    return this.getMaintenanceAlerts();
  },

  async evaluateAlerts(): Promise<{ success: boolean; alerts: MaintenanceAlert[] }> {
    const res = await fetch('/api/maintenance/evaluate', { method: 'POST' });
    if (!res.ok) throw new Error('Error al evaluar alertas');
    return res.json();
  },

  async resolveAlert(id: string, status: 'atendida' | 'descartada'): Promise<void> {
    const res = await fetch(`/api/maintenance/alerts/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Error al resolver alerta');
  },

  // Notifications
  async getNotifications(): Promise<AdminNotification[]> {
    const res = await fetch('/api/notifications');
    if (!res.ok) throw new Error('Error al obtener notificaciones');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
  },

  async markAllNotificationsRead(): Promise<void> {
    await fetch('/api/notifications/read-all', { method: 'POST' });
  },

  async testPushNotification(data?: { title?: string; message?: string; pcNumber?: string }): Promise<AdminNotification> {
    const res = await fetch('/api/notifications/test-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
    return res.json();
  },

  async resetData(): Promise<void> {
    await fetch('/api/reset-data', { method: 'POST' });
  },

  // Users & Profiles
  async getUsers(): Promise<UserProfile[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Error al obtener lista de docentes');
    return res.json();
  },

  async loginUser(id: string, pin: string): Promise<{ success: boolean; user: UserProfile }> {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pin }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'PIN o usuario incorrecto');
    }
    return res.json();
  },

  async getUser(id: string): Promise<UserProfile> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Error al obtener perfil de usuario');
    return res.json();
  },

  async createUser(data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar docente');
    }
    return res.json();
  },

  async updateUser(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar perfil');
    }
    return res.json();
  },

  async changeUserPin(
    id: string,
    payload: { currentPin?: string; newPin: string; directReset?: boolean }
  ): Promise<{ success: boolean; message: string; user: UserProfile }> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}/change-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al cambiar PIN de acceso');
    }
    return res.json();
  },

  async deleteUser(id: string): Promise<boolean> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar usuario');
    }
    return true;
  },
};
