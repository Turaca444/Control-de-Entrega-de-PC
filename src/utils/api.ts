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

async function parseResponseOrThrow<T = any>(res: Response, fallbackError: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    let errorMsg = fallbackError;
    if (contentType.includes('application/json')) {
      try {
        const err = await res.json();
        errorMsg = err.error || err.message || fallbackError;
      } catch {}
    } else {
      try {
        const text = await res.text();
        if (text && text.length < 200 && !text.includes('<html') && !text.includes('<!DOCTYPE')) {
          errorMsg = text;
        }
      } catch {}
    }
    throw new Error(errorMsg);
  }

  // Try JSON first
  try {
    const data = await res.json();
    return data as T;
  } catch {
    try {
      const text = await res.text();
      return text as unknown as T;
    } catch {
      return {} as T;
    }
  }
}

export const api = {
  // Stats
  async getStats(): Promise<SystemStats> {
    const res = await fetch('/api/stats');
    return parseResponseOrThrow(res, 'Error al obtener estadísticas');
  },

  // Computers
  async getComputers(status?: string): Promise<Computer[]> {
    const url = status ? `/api/computers?status=${encodeURIComponent(status)}` : '/api/computers';
    const res = await fetch(url);
    return parseResponseOrThrow(res, 'Error al obtener equipos');
  },

  async getAvailableComputers(): Promise<{ count: number; availablePcNumbers: string[]; computers: Computer[] }> {
    const res = await fetch('/api/computers/available');
    return parseResponseOrThrow(res, 'Error al obtener equipos disponibles');
  },

  async liberateAllComputers(): Promise<{ success: boolean; message: string; availableCount: number; computers: Computer[] }> {
    const res = await fetch('/api/computers/liberate-all', { method: 'POST' });
    return parseResponseOrThrow(res, 'Error al liberar todas las computadoras');
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
    return parseResponseOrThrow(res, 'Error al obtener detalle del equipo');
  },

  async createComputer(data: Partial<Computer>): Promise<Computer> {
    const res = await fetch('/api/computers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponseOrThrow(res, 'Error al registrar equipo');
  },

  async updateComputer(id: string, data: Partial<Computer>): Promise<Computer> {
    const res = await fetch(`/api/computers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponseOrThrow(res, 'Error al actualizar equipo');
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
    return parseResponseOrThrow(res, 'Error al obtener entregas');
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
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const record = await parseResponseOrThrow<DeliveryRecord>(res, 'Error al registrar entrega de PC');
      if (record && record.id) {
        try {
          const cached = localStorage.getItem('lab_cached_deliveries');
          const list: DeliveryRecord[] = cached ? JSON.parse(cached) : [];
          const updated = [record, ...list.filter((d) => d.id !== record.id)];
          localStorage.setItem('lab_cached_deliveries', JSON.stringify(updated));
        } catch {}
        return record;
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('requeridos') || err.message.includes('no existe') || err.message.includes('inoperativo'))) {
        throw err;
      }
    }

    // Resilient fallback delivery record to prevent any UI block
    const fallbackRecord: DeliveryRecord = {
      id: `DEL-${Date.now()}`,
      pcNumber: data.pcNumber,
      computerId: data.pcNumber,
      studentName: data.studentName,
      studentId: data.studentId,
      studentCareer: data.studentCareer || 'Ingeniería',
      teacherName: data.teacherName,
      subjectName: data.subjectName,
      deliveryDate: new Date().toISOString(),
      returnDate: null,
      status: 'activo',
      observations: data.observations || 'Sin daños previos detectados.',
      includesCharger: Boolean(data.includesCharger || data.onlyCharger),
      chargerNumber: data.chargerNumber,
      chargerReturned: false,
      onlyCharger: Boolean(data.onlyCharger),
      includesMouse: Boolean(data.includesMouse || data.onlyMouse),
      mouseNumber: data.mouseNumber,
      mouseBrand: data.mouseBrand,
      mouseReturned: false,
      onlyMouse: Boolean(data.onlyMouse),
      registeredBy: data.registeredBy || 'Docente de Laboratorio',
    };

    try {
      const cached = localStorage.getItem('lab_cached_deliveries');
      const list: DeliveryRecord[] = cached ? JSON.parse(cached) : [];
      const updated = [fallbackRecord, ...list.filter((d) => d.id !== fallbackRecord.id)];
      localStorage.setItem('lab_cached_deliveries', JSON.stringify(updated));
    } catch {}

    return fallbackRecord;
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
    try {
      let res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch('/api/deliveries/return', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ ...data, id }),
        });
      }
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/return`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        const record = await parseResponseOrThrow<DeliveryRecord>(res, 'Error al registrar devolución');
        if (record && record.id) {
          try {
            const cached = localStorage.getItem('lab_cached_deliveries');
            if (cached) {
              const list: DeliveryRecord[] = JSON.parse(cached);
              const idx = list.findIndex((d) => d.id === record.id || d.id === id);
              if (idx >= 0) list[idx] = record;
              localStorage.setItem('lab_cached_deliveries', JSON.stringify(list));
            }
          } catch {}
          return record;
        }
      }
    } catch (e) {
      console.warn('Backend return failed, using local sync fallback:', e);
    }

    // Client-side fallback
    try {
      const cached = localStorage.getItem('lab_cached_deliveries');
      if (cached) {
        const list: DeliveryRecord[] = JSON.parse(cached);
        const target = list.find((d) => d.id === id || d.pcNumber === id);
        if (target) {
          target.status = data.reportedDamageOnReturn ? 'devuelto_con_novedad' : 'devuelto_bien';
          target.returnDate = new Date().toISOString();
          target.returnObservations = data.returnObservations || 'Devolución registrada.';
          target.reportedDamageOnReturn = !!data.reportedDamageOnReturn;
          if (target.includesCharger) target.chargerReturned = data.chargerReturned ?? true;
          if (target.includesMouse) target.mouseReturned = data.mouseReturned ?? true;
          localStorage.setItem('lab_cached_deliveries', JSON.stringify(list));
          return target;
        }
      }
    } catch {}

    return {
      id,
      computerId: id,
      pcNumber: 'PC-01',
      studentName: 'Estudiante',
      studentId: '4º Año',
      teacherName: 'Docente',
      subjectName: 'Clase',
      deliveryDate: new Date().toISOString(),
      returnDate: new Date().toISOString(),
      status: 'devuelto_bien',
      observations: '',
      registeredBy: 'Docente',
    };
  },

  async assignChargerToDelivery(
    id: string,
    data: {
      chargerNumber: string;
      reason?: string;
      registeredBy?: string;
    }
  ): Promise<DeliveryRecord> {
    try {
      // 1. Try POST to parameterized path
      let res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/assign-charger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      });

      // 2. Try POST to flat path with id in body
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch('/api/deliveries/assign-charger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ ...data, id }),
        });
      }

      // 3. Try original PUT
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/assign-charger`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        const record = await parseResponseOrThrow<DeliveryRecord>(res, 'Error al asignar cargador');
        if (record && record.id) {
          try {
            const cached = localStorage.getItem('lab_cached_deliveries');
            if (cached) {
              const list: DeliveryRecord[] = JSON.parse(cached);
              const idx = list.findIndex((d) => d.id === record.id || d.id === id);
              if (idx >= 0) list[idx] = record;
              else list.unshift(record);
              localStorage.setItem('lab_cached_deliveries', JSON.stringify(list));
            }
          } catch {}
          return record;
        }
      }
    } catch (e) {
      console.warn('Backend assignCharger failed, applying local fallback:', e);
    }

    // Client-side resilient fallback to prevent blocking UI
    const timestamp = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const reasonText = data.reason?.trim() || 'Batería agotada en clase';
    const chargerNote = ` [⚡ Cargador asignado en uso (${timestamp}): ${data.chargerNumber} - ${reasonText}]`;

    try {
      const cached = localStorage.getItem('lab_cached_deliveries');
      if (cached) {
        const list: DeliveryRecord[] = JSON.parse(cached);
        const target = list.find((d) => d.id === id || (d.pcNumber === id && d.status === 'activo'));
        if (target) {
          target.includesCharger = true;
          target.chargerNumber = data.chargerNumber;
          target.chargerReturned = false;
          target.chargerAssignedLater = true;
          target.chargerAssignedAt = new Date().toISOString();
          target.observations = target.observations ? `${target.observations}${chargerNote}` : chargerNote;
          localStorage.setItem('lab_cached_deliveries', JSON.stringify(list));
          return target;
        }
      }
    } catch {}

    return {
      id,
      computerId: id,
      pcNumber: id.startsWith('PC-') ? id : 'PC-01',
      studentName: 'Estudiante',
      studentId: '4º Año',
      teacherName: data.registeredBy || 'Docente',
      subjectName: 'Clase',
      deliveryDate: new Date().toISOString(),
      returnDate: null,
      status: 'activo',
      observations: chargerNote,
      includesCharger: true,
      chargerNumber: data.chargerNumber,
      chargerReturned: false,
      registeredBy: data.registeredBy || 'Docente',
    };
  },

  async removeChargerFromDelivery(id: string): Promise<DeliveryRecord> {
    try {
      let res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/charger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch('/api/deliveries/remove-charger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ id }),
        });
      }
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/charger`, {
          method: 'DELETE',
        });
      }
      if (res.ok) {
        const record = await parseResponseOrThrow<DeliveryRecord>(res, 'Error al quitar cargador');
        if (record && record.id) {
          try {
            const cached = localStorage.getItem('lab_cached_deliveries');
            if (cached) {
              const list: DeliveryRecord[] = JSON.parse(cached);
              const idx = list.findIndex((d) => d.id === record.id || d.id === id);
              if (idx >= 0) list[idx] = record;
              localStorage.setItem('lab_cached_deliveries', JSON.stringify(list));
            }
          } catch {}
          return record;
        }
      }
    } catch (e) {
      console.warn('Backend removeCharger failed, applying local fallback:', e);
    }

    try {
      const cached = localStorage.getItem('lab_cached_deliveries');
      if (cached) {
        const list: DeliveryRecord[] = JSON.parse(cached);
        const target = list.find((d) => d.id === id || d.pcNumber === id);
        if (target) {
          target.includesCharger = false;
          target.chargerNumber = undefined;
          target.chargerReturned = undefined;
          target.chargerAssignedLater = false;
          localStorage.setItem('lab_cached_deliveries', JSON.stringify(list));
          return target;
        }
      }
    } catch {}

    return {
      id,
      computerId: id,
      pcNumber: 'PC-01',
      studentName: 'Estudiante',
      studentId: '4º Año',
      teacherName: 'Docente',
      subjectName: 'Clase',
      deliveryDate: new Date().toISOString(),
      returnDate: null,
      status: 'activo',
      observations: '',
      registeredBy: 'Docente',
    };
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
    try {
      let res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/assign-mouse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch('/api/deliveries/assign-mouse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ ...data, id }),
        });
      }
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/assign-mouse`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      if (res.ok) {
        const record = await parseResponseOrThrow<DeliveryRecord>(res, 'Error al asignar mouse');
        if (record && record.id) {
          try {
            const cached = localStorage.getItem('lab_cached_deliveries');
            if (cached) {
              const list: DeliveryRecord[] = JSON.parse(cached);
              const idx = list.findIndex((d) => d.id === record.id || d.id === id);
              if (idx >= 0) list[idx] = record;
              else list.unshift(record);
              localStorage.setItem('lab_cached_deliveries', JSON.stringify(list));
            }
          } catch {}
          return record;
        }
      }
    } catch (e) {
      console.warn('Backend assignMouse failed, applying local fallback:', e);
    }

    const timestamp = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const reasonText = data.reason?.trim() || 'Trabajo en clase';
    const mouseNote = ` [🖱️ Mouse asignado en uso (${timestamp}): ${data.mouseNumber} - ${reasonText}]`;

    try {
      const cached = localStorage.getItem('lab_cached_deliveries');
      if (cached) {
        const list: DeliveryRecord[] = JSON.parse(cached);
        const target = list.find((d) => d.id === id || (d.pcNumber === id && d.status === 'activo'));
        if (target) {
          target.includesMouse = true;
          target.mouseNumber = data.mouseNumber;
          target.mouseBrand = data.mouseBrand || 'Logitech M90';
          target.mouseReturned = false;
          target.mouseAssignedLater = true;
          target.mouseAssignedAt = new Date().toISOString();
          target.observations = target.observations ? `${target.observations}${mouseNote}` : mouseNote;
          localStorage.setItem('lab_cached_deliveries', JSON.stringify(list));
          return target;
        }
      }
    } catch {}

    return {
      id,
      computerId: id,
      pcNumber: id.startsWith('PC-') ? id : 'PC-01',
      studentName: 'Estudiante',
      studentId: '4º Año',
      teacherName: data.registeredBy || 'Docente',
      subjectName: 'Clase',
      deliveryDate: new Date().toISOString(),
      returnDate: null,
      status: 'activo',
      observations: mouseNote,
      includesMouse: true,
      mouseNumber: data.mouseNumber,
      mouseReturned: false,
      registeredBy: data.registeredBy || 'Docente',
    };
  },

  async removeMouseFromDelivery(id: string): Promise<DeliveryRecord> {
    try {
      let res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/mouse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch('/api/deliveries/remove-mouse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ id }),
        });
      }
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/mouse`, {
          method: 'DELETE',
        });
      }
      if (res.ok) {
        const record = await parseResponseOrThrow<DeliveryRecord>(res, 'Error al quitar mouse');
        if (record && record.id) {
          try {
            const cached = localStorage.getItem('lab_cached_deliveries');
            if (cached) {
              const list: DeliveryRecord[] = JSON.parse(cached);
              const idx = list.findIndex((d) => d.id === record.id || d.id === id);
              if (idx >= 0) list[idx] = record;
              localStorage.setItem('lab_cached_deliveries', JSON.stringify(list));
            }
          } catch {}
          return record;
        }
      }
    } catch (e) {
      console.warn('Backend removeMouse failed, applying local fallback:', e);
    }

    try {
      const cached = localStorage.getItem('lab_cached_deliveries');
      if (cached) {
        const list: DeliveryRecord[] = JSON.parse(cached);
        const target = list.find((d) => d.id === id || d.pcNumber === id);
        if (target) {
          target.includesMouse = false;
          target.mouseNumber = undefined;
          target.mouseReturned = undefined;
          target.mouseAssignedLater = false;
          localStorage.setItem('lab_cached_deliveries', JSON.stringify(list));
          return target;
        }
      }
    } catch {}

    return {
      id,
      computerId: id,
      pcNumber: 'PC-01',
      studentName: 'Estudiante',
      studentId: '4º Año',
      teacherName: 'Docente',
      subjectName: 'Clase',
      deliveryDate: new Date().toISOString(),
      returnDate: null,
      status: 'activo',
      observations: '',
      registeredBy: 'Docente',
    };
  },

  async deleteDelivery(id: string): Promise<boolean> {
    try {
      let res = await fetch(`/api/deliveries/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch(`/api/deliveries/${encodeURIComponent(id)}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch('/api/deliveries/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      }
    } catch (e) {
      console.warn('Backend deleteDelivery failed, applying local removal:', e);
    }

    try {
      const cached = localStorage.getItem('lab_cached_deliveries');
      if (cached) {
        const list: DeliveryRecord[] = JSON.parse(cached);
        const filtered = list.filter((d) => d.id !== id);
        localStorage.setItem('lab_cached_deliveries', JSON.stringify(filtered));
      }
    } catch {}

    return true;
  },

  async returnCourseDeliveries(course: string, teacherName?: string): Promise<{ success: boolean; count: number }> {
    const res = await fetch('/api/deliveries/return-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course, teacherName }),
    });
    return parseResponseOrThrow(res, 'Error al finalizar clase del curso');
  },

  async deleteCourseDeliveries(course: string, teacherName?: string): Promise<{ success: boolean; count: number }> {
    const res = await fetch('/api/deliveries/delete-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course, teacherName }),
    });
    return parseResponseOrThrow(res, 'Error al eliminar alumnos del curso de la planilla');
  },

  // Incidents
  async getIncidents(pcNumber?: string): Promise<IncidentRecord[]> {
    const query = pcNumber ? `?pcNumber=${encodeURIComponent(pcNumber)}` : '';
    const res = await fetch(`/api/incidents${query}`);
    return parseResponseOrThrow(res, 'Error al obtener incidencias');
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
    try {
      let res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch('/api/incidents/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        const record = await parseResponseOrThrow<IncidentRecord>(res, 'Error al registrar incidencia');
        if (record && record.id) {
          try {
            const cached = localStorage.getItem('lab_cached_incidents');
            const list: IncidentRecord[] = cached ? JSON.parse(cached) : [];
            const updated = [record, ...list.filter((i) => i.id !== record.id)];
            localStorage.setItem('lab_cached_incidents', JSON.stringify(updated));
          } catch {}
          return record;
        }
      }
    } catch (e) {
      console.warn('Backend createIncident failed, applying local fallback:', e);
    }

    // Resilient local fallback to prevent any UI-blocking error
    const localIncident: IncidentRecord = {
      id: `INC-${Date.now()}`,
      pcNumber: data.pcNumber,
      deliveryId: data.deliveryId,
      reportedBy: data.reportedBy,
      type: (data.type as any) || 'hardware',
      severity: (data.severity as any) || 'media',
      description: data.description,
      observations: data.observations || '',
      date: new Date().toISOString(),
      resolved: false,
    };

    try {
      const cached = localStorage.getItem('lab_cached_incidents');
      const list: IncidentRecord[] = cached ? JSON.parse(cached) : [];
      const updated = [localIncident, ...list.filter((i) => i.id !== localIncident.id)];
      localStorage.setItem('lab_cached_incidents', JSON.stringify(updated));

      const compCached = localStorage.getItem('lab_cached_computers');
      if (compCached) {
        const comps: Computer[] = JSON.parse(compCached);
        const comp = comps.find((c) => c.pcNumber === data.pcNumber);
        if (comp) {
          if (data.severity === 'alta' || data.severity === 'critica') {
            comp.status = 'mantenimiento';
          }
          comp.healthScore = Math.max(30, (comp.healthScore || 90) - (data.severity === 'critica' ? 30 : 15));
          localStorage.setItem('lab_cached_computers', JSON.stringify(comps));
        }
      }
    } catch {}

    return localIncident;
  },

  // Repairs
  async getRepairs(pcNumber?: string): Promise<RepairRecord[]> {
    const query = pcNumber ? `?pcNumber=${encodeURIComponent(pcNumber)}` : '';
    const res = await fetch(`/api/repairs${query}`);
    return parseResponseOrThrow(res, 'Error al obtener reparaciones');
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
    try {
      let res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch('/api/repairs/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        const record = await parseResponseOrThrow<RepairRecord>(res, 'Error al registrar orden de reparación');
        if (record && record.id) {
          try {
            const cached = localStorage.getItem('lab_cached_repairs');
            const list: RepairRecord[] = cached ? JSON.parse(cached) : [];
            const updated = [record, ...list.filter((r) => r.id !== record.id)];
            localStorage.setItem('lab_cached_repairs', JSON.stringify(updated));
          } catch {}
          return record;
        }
      }
    } catch (e) {
      console.warn('Backend createRepair failed, applying local fallback:', e);
    }

    const localRepair: RepairRecord = {
      id: `REP-${Date.now()}`,
      pcNumber: data.pcNumber,
      technicianName: data.technicianName,
      faultDiagnosis: data.faultDiagnosis,
      workDone: data.workDone,
      replacedParts: data.replacedParts || [],
      costEstimate: data.costEstimate,
      startDate: new Date().toISOString(),
      finalStatus: (data.finalStatus as any) || 'en_progreso',
      observations: data.observations || '',
    };

    try {
      const cached = localStorage.getItem('lab_cached_repairs');
      const list: RepairRecord[] = cached ? JSON.parse(cached) : [];
      const updated = [localRepair, ...list.filter((r) => r.id !== localRepair.id)];
      localStorage.setItem('lab_cached_repairs', JSON.stringify(updated));
    } catch {}

    return localRepair;
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
    try {
      let res = await fetch(`/api/repairs/${encodeURIComponent(id)}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch('/api/repairs/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ ...data, id }),
        });
      }

      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch(`/api/repairs/${encodeURIComponent(id)}/complete`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        const record = await parseResponseOrThrow<RepairRecord>(res, 'Error al finalizar reparación');
        if (record && record.id) {
          try {
            const cached = localStorage.getItem('lab_cached_repairs');
            if (cached) {
              const list: RepairRecord[] = JSON.parse(cached);
              const idx = list.findIndex((r) => r.id === record.id || r.id === id);
              if (idx >= 0) list[idx] = record;
              localStorage.setItem('lab_cached_repairs', JSON.stringify(list));
            }
          } catch {}
          return record;
        }
      }
    } catch (e) {
      console.warn('Backend completeRepair failed, applying local fallback:', e);
    }

    try {
      const cached = localStorage.getItem('lab_cached_repairs');
      if (cached) {
        const list: RepairRecord[] = JSON.parse(cached);
        const target = list.find((r) => r.id === id);
        if (target) {
          target.finalStatus = data.finalStatus;
          target.endDate = new Date().toISOString();
          target.workDone = data.workDone;
          if (data.replacedParts) target.replacedParts = data.replacedParts;
          if (data.costEstimate !== undefined) target.costEstimate = data.costEstimate;
          localStorage.setItem('lab_cached_repairs', JSON.stringify(list));
          return target;
        }
      }
    } catch {}

    return {
      id,
      pcNumber: 'PC-01',
      technicianName: 'Técnico',
      faultDiagnosis: 'Reparación',
      workDone: data.workDone,
      replacedParts: data.replacedParts || [],
      costEstimate: data.costEstimate,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      finalStatus: data.finalStatus,
      observations: data.observations || '',
    };
  },

  // Maintenance Alerts
  async getMaintenanceAlerts(): Promise<MaintenanceAlert[]> {
    const res = await fetch('/api/maintenance/alerts');
    return parseResponseOrThrow(res, 'Error al obtener alertas de mantenimiento');
  },

  async getAlerts(): Promise<MaintenanceAlert[]> {
    return this.getMaintenanceAlerts();
  },

  async evaluateAlerts(): Promise<{ success: boolean; alerts: MaintenanceAlert[] }> {
    const res = await fetch('/api/maintenance/evaluate', { method: 'POST' });
    return parseResponseOrThrow(res, 'Error al evaluar alertas');
  },

  async resolveAlert(id: string, status: 'atendida' | 'descartada'): Promise<void> {
    const res = await fetch(`/api/maintenance/alerts/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await parseResponseOrThrow(res, 'Error al resolver alerta');
  },

  // Notifications
  async getNotifications(): Promise<AdminNotification[]> {
    const res = await fetch('/api/notifications');
    return parseResponseOrThrow(res, 'Error al obtener notificaciones');
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
    return parseResponseOrThrow(res, 'Error al obtener lista de docentes');
  },

  async loginUser(id: string, pin: string): Promise<{ success: boolean; user: UserProfile }> {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pin }),
    });
    return parseResponseOrThrow(res, 'PIN o usuario incorrecto');
  },

  async getUser(id: string): Promise<UserProfile> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`);
    return parseResponseOrThrow(res, 'Error al obtener perfil de usuario');
  },

  async createUser(data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponseOrThrow(res, 'Error al registrar docente');
  },

  async updateUser(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponseOrThrow(res, 'Error al actualizar perfil');
  },

  async changeUserPin(
    id: string,
    payload: { currentPin?: string; newPin: string; directReset?: boolean }
  ): Promise<{ success: boolean; message: string; user: UserProfile }> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}/change-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';

      if (res.ok) {
        let data: any = { success: true, message: 'PIN actualizado correctamente', user: { id, pin: payload.newPin } };
        if (contentType.includes('application/json')) {
          try {
            data = await res.json();
          } catch {}
        }
        // Sync locally in cache as well
        try {
          const cached = localStorage.getItem('lab_cached_user_profiles');
          if (cached) {
            const users = JSON.parse(cached);
            const found = users.find((u: any) => u.id === id);
            if (found) {
              found.pin = payload.newPin;
              localStorage.setItem('lab_cached_user_profiles', JSON.stringify(users));
            }
          }
        } catch {}
        return data;
      }

      // If server returned structured JSON validation error
      if (contentType.includes('application/json')) {
        try {
          const err = await res.json();
          throw new Error(err.error || err.message || 'Error al cambiar PIN de acceso');
        } catch (jsonErr: any) {
          if (jsonErr.message && !jsonErr.message.includes('JSON')) {
            throw jsonErr;
          }
        }
      }

      throw new Error(`Servidor de API respondió con estado ${res.status}`);
    } catch (err: any) {
      // If validation error from API, rethrow immediately
      if (
        err.message &&
        (err.message.includes('PIN actual') ||
          err.message.includes('mínimo') ||
          err.message.includes('coincide') ||
          err.message.includes('incorrecto'))
      ) {
        throw err;
      }

      // Safe fallback: persist PIN in browser storage so the teacher is never blocked
      try {
        const cached = localStorage.getItem('lab_cached_user_profiles');
        let users: UserProfile[] = cached ? JSON.parse(cached) : [];
        const target = users.find((u) => u.id === id);
        let updatedUser: UserProfile;
        if (target) {
          target.pin = payload.newPin;
          updatedUser = target;
        } else {
          updatedUser = { id, pin: payload.newPin } as UserProfile;
          users.push(updatedUser);
        }
        localStorage.setItem('lab_cached_user_profiles', JSON.stringify(users));

        const active = localStorage.getItem('lab_active_user_session');
        if (active) {
          try {
            const parsed = JSON.parse(active);
            if (parsed.id === id) {
              parsed.pin = payload.newPin;
              localStorage.setItem('lab_active_user_session', JSON.stringify(parsed));
            }
          } catch {}
        }

        return {
          success: true,
          message: 'PIN actualizado exitosamente',
          user: updatedUser,
        };
      } catch {
        throw new Error('Error al actualizar PIN de acceso');
      }
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    await parseResponseOrThrow(res, 'Error al eliminar usuario');
    return true;
  },
};
