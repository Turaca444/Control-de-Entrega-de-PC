import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbStore } from './server/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // CORS headers for flexibility
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // --- REST API ENDPOINTS ---

  // 1. Health check & API specification
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'API Control Entrega PC - Sala de Programación',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // API Documentation specification endpoint
  app.get('/api/docs', (req: Request, res: Response) => {
    res.json({
      title: 'API de Control de Entrega de PC - Sala de Programación',
      description: 'API REST para control de asignaciones, historiales por equipo, incidencias técnicas y alertas preventivas.',
      endpoints: [
        { method: 'GET', path: '/api/stats', description: 'Métricas en tiempo real de la sala de cómputo' },
        { method: 'GET', path: '/api/computers', description: 'Listar todos los equipos de la sala con estado y métricas de uso' },
        { method: 'POST', path: '/api/computers', description: 'Registrar un nuevo equipo en el inventario' },
        { method: 'PUT', path: '/api/computers/:id', description: 'Actualizar especificaciones o estado de un equipo' },
        { method: 'GET', path: '/api/deliveries', description: 'Consultar asignaciones y préstamos (Filtros: teacherName, startDate, endDate, pcNumber, subjectName, status)' },
        { method: 'POST', path: '/api/deliveries', description: 'Registrar nueva entrega de PC a alumno con docente, materia y observaciones de daños previos' },
        { method: 'PUT', path: '/api/deliveries/:id/return', description: 'Registrar devolución del equipo, observaciones y reporte de fallas' },
        { method: 'GET', path: '/api/incidents', description: 'Listado de incidencias y fallas reportadas por equipo' },
        { method: 'POST', path: '/api/incidents', description: 'Registro rápido de nueva incidencia técnica' },
        { method: 'GET', path: '/api/repairs', description: 'Historial técnico de reparaciones y mantenimientos' },
        { method: 'POST', path: '/api/repairs', description: 'Registrar orden de reparación o servicio técnico' },
        { method: 'PUT', path: '/api/repairs/:id/complete', description: 'Finalizar reparación técnica y devolver equipo a disponible' },
        { method: 'GET', path: '/api/maintenance/alerts', description: 'Alertas automáticas de mantenimiento preventivo' },
        { method: 'POST', path: '/api/maintenance/alerts/:id/resolve', description: 'Resolver o descartar alerta de mantenimiento' },
        { method: 'GET', path: '/api/notifications', description: 'Notificaciones push y avisos al administrador' },
        { method: 'GET', path: '/api/events', description: 'Canal SSE en tiempo real (Server-Sent Events) para sincronización continua' },
      ],
    });
  });

  // 2. Stats
  app.get('/api/stats', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(dbStore.getStats());
  });

  // 3. Computers
  // Available computers dedicated endpoints
  const handleAvailableComputers = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const availableComputers = dbStore.getComputers('disponible');
    const availablePcNumbers = availableComputers.map((c) => c.pcNumber);
    res.json({
      count: availableComputers.length,
      availablePcNumbers,
      computers: availableComputers,
    });
  };

  app.get('/api/computers/available', handleAvailableComputers);
  app.get('/api/computers/disponibles', handleAvailableComputers);
  app.get('/api/available-pcs', handleAvailableComputers);

  app.get('/api/computers', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const status = req.query.status as string | undefined;
    const onlyAvailable = req.query.available === 'true';
    if (status || onlyAvailable) {
      res.json(dbStore.getComputers(status || 'disponible'));
    } else {
      res.json(dbStore.getComputers());
    }
  });

  // Liberate / make all computers available
  app.post('/api/computers/liberate-all', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const computers = dbStore.getComputers();
    // Return all active deliveries
    const activeDeliveries = dbStore.getDeliveries({ status: 'activo' });
    activeDeliveries.forEach((d) => {
      dbStore.returnDelivery(d.id, {
        returnObservations: 'Devolución de equipo registrada. Todas las computadoras liberadas.',
        chargerReturned: true,
        mouseReturned: true,
      });
    });
    computers.forEach((c) => {
      dbStore.updateComputer(c.id, { status: 'disponible' });
    });
    return res.json({
      success: true,
      message: 'Todas las computadoras (PC-01 a PC-25) han sido liberadas y se encuentran disponibles.',
      availableCount: 25,
      computers: dbStore.getComputers(),
    });
  });

  app.get('/api/computers/:id', (req: Request, res: Response) => {
    const comp = dbStore.getComputerById(req.params.id);
    if (!comp) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    const deliveries = dbStore.getDeliveries({ pcNumber: comp.pcNumber });
    const incidents = dbStore.getIncidents(comp.pcNumber);
    const repairs = dbStore.getRepairs(comp.pcNumber);
    res.json({
      computer: comp,
      history: {
        deliveries,
        incidents,
        repairs,
      },
    });
  });

  app.post('/api/computers', (req: Request, res: Response) => {
    const { pcNumber, model, processor, ram, storage, os, locationRow, notes } = req.body;
    if (!pcNumber) {
      return res.status(400).json({ error: 'El número de PC es requerido (ej. PC-09)' });
    }
    const existing = dbStore.getComputerById(pcNumber);
    if (existing) {
      return res.status(409).json({ error: `El equipo ${pcNumber} ya existe en el sistema` });
    }
    const created = dbStore.addComputer({
      pcNumber,
      model: model || 'Torre Genérica Sala',
      processor: processor || 'Intel Core i5 / AMD Ryzen 5',
      ram: ram || '16 GB DDR4',
      storage: storage || '512 GB SSD',
      os: os || 'Ubuntu 22.04 LTS',
      status: 'disponible',
      locationRow: locationRow || 'Fila A',
      lastMaintenanceDate: new Date().toISOString(),
      totalLoansCount: 0,
      totalUsageHours: 0,
      healthScore: 100,
      notes: notes || '',
    });
    res.status(201).json(created);
  });

  app.put('/api/computers/:id', (req: Request, res: Response) => {
    const updated = dbStore.updateComputer(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.json(updated);
  });

  // 4. Deliveries / Loans
  app.get('/api/deliveries', (req: Request, res: Response) => {
    const { teacherName, startDate, endDate, pcNumber, subjectName, status } = req.query;
    const deliveries = dbStore.getDeliveries({
      teacherName: teacherName as string,
      startDate: startDate as string,
      endDate: endDate as string,
      pcNumber: pcNumber as string,
      subjectName: subjectName as string,
      status: status as string,
    });
    res.json(deliveries);
  });

  const handleCreateDelivery = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const {
      pcNumber,
      studentName,
      studentId,
      studentCareer,
      teacherName,
      subjectName,
      observations,
      expectedReturnTime,
      registeredBy,
      includesCharger,
      chargerNumber,
      onlyCharger,
      includesMouse,
      mouseNumber,
      mouseBrand,
      onlyMouse,
    } = req.body;

    let targetPcNumber = (pcNumber || '').trim();
    if (/^\d+$/.test(targetPcNumber)) {
      targetPcNumber = `PC-${targetPcNumber.padStart(2, '0')}`;
    } else if (/^PC-\d$/.test(targetPcNumber)) {
      targetPcNumber = `PC-0${targetPcNumber.slice(3)}`;
    }

    const isOnlyCharger = Boolean(
      onlyCharger || targetPcNumber === 'SOLO-CARGADOR' || targetPcNumber.startsWith('SOLO-CARGADOR')
    );
    const isOnlyMouse = Boolean(
      onlyMouse || targetPcNumber === 'SOLO-MOUSE' || targetPcNumber.startsWith('SOLO-MOUSE')
    );
    const isPeripheralsOnly = isOnlyCharger || isOnlyMouse;

    if ((!targetPcNumber && !isPeripheralsOnly) || !studentName || !studentId || !teacherName || !subjectName) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes: pcNumber (o solo cargador/mouse), studentName, studentId, teacherName, subjectName',
      });
    }

    if (!isPeripheralsOnly && !targetPcNumber.startsWith('SOLO-')) {
      const comp = dbStore.getComputerById(targetPcNumber);
      if (!comp) {
        return res.status(404).json({ error: `Equipo ${targetPcNumber} no existe` });
      }
      if (comp.status === 'en_reparacion' || comp.status === 'de_baja') {
        return res.status(400).json({ error: `El equipo ${targetPcNumber} está inoperativo (${comp.status}) y no se puede prestar` });
      }
      // If computer was somehow still marked in use, release previous active delivery so user is never blocked
      if (comp.status === 'en_uso') {
        const prev = dbStore.getDeliveries({ pcNumber: targetPcNumber, status: 'activo' });
        prev.forEach((p) => {
          dbStore.returnDelivery(p.id, {
            returnObservations: 'Devolución automática por reasignación de equipo',
          });
        });
      }
    }

    const record = dbStore.createDelivery({
      pcNumber: isOnlyCharger && isOnlyMouse
        ? 'SOLO-CARGADOR-MOUSE'
        : isOnlyCharger
        ? 'SOLO-CARGADOR'
        : isOnlyMouse
        ? 'SOLO-MOUSE'
        : targetPcNumber,
      studentName,
      studentId,
      studentCareer,
      teacherName,
      subjectName,
      observations,
      expectedReturnTime,
      registeredBy,
      includesCharger: isOnlyCharger ? true : includesCharger,
      chargerNumber,
      onlyCharger: isOnlyCharger,
      includesMouse: isOnlyMouse ? true : includesMouse,
      mouseNumber,
      mouseBrand,
      onlyMouse: isOnlyMouse,
    });
    return res.status(201).json(record);
  };

  app.post('/api/deliveries', handleCreateDelivery);
  app.post('/api/deliveries/create', handleCreateDelivery);

  const handleReturnDeliveryRoute = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const id = req.params.id || req.body.id || req.body.deliveryId;
    if (!id) return res.status(400).json({ error: 'ID de préstamo requerido' });
    const returned = dbStore.returnDelivery(id, req.body);
    if (!returned) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    return res.json(returned);
  };

  app.put('/api/deliveries/:id/return', handleReturnDeliveryRoute);
  app.post('/api/deliveries/:id/return', handleReturnDeliveryRoute);
  app.post('/api/deliveries/return', handleReturnDeliveryRoute);

  const handleAssignCharger = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const id = req.params.id || req.body.id || req.body.deliveryId;
    const { chargerNumber, reason, registeredBy } = req.body;
    if (!chargerNumber || !chargerNumber.trim()) {
      return res.status(400).json({ error: 'Debe especificar el número o código del cargador' });
    }
    if (!id) {
      return res.status(400).json({ error: 'ID de préstamo requerido' });
    }
    const updated = dbStore.assignChargerToDelivery(id, {
      chargerNumber,
      reason,
      registeredBy,
    });
    if (!updated) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    return res.json(updated);
  };

  app.put('/api/deliveries/:id/assign-charger', handleAssignCharger);
  app.post('/api/deliveries/:id/assign-charger', handleAssignCharger);
  app.post('/api/deliveries/assign-charger', handleAssignCharger);

  const handleRemoveCharger = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const id = req.params.id || req.body.id || req.body.deliveryId;
    if (!id) return res.status(400).json({ error: 'ID de préstamo requerido' });
    const updated = dbStore.removeChargerFromDelivery(id);
    if (!updated) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    return res.json(updated);
  };

  app.delete('/api/deliveries/:id/charger', handleRemoveCharger);
  app.post('/api/deliveries/:id/charger', handleRemoveCharger);
  app.post('/api/deliveries/remove-charger', handleRemoveCharger);

  const handleAssignMouse = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const id = req.params.id || req.body.id || req.body.deliveryId;
    const { mouseNumber, mouseBrand, reason, registeredBy } = req.body;
    if (!mouseNumber || !mouseNumber.trim()) {
      return res.status(400).json({ error: 'Debe especificar el número o código del mouse' });
    }
    if (!id) {
      return res.status(400).json({ error: 'ID de préstamo requerido' });
    }
    const updated = dbStore.assignMouseToDelivery(id, {
      mouseNumber,
      mouseBrand,
      reason,
      registeredBy,
    });
    if (!updated) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    return res.json(updated);
  };

  app.put('/api/deliveries/:id/assign-mouse', handleAssignMouse);
  app.post('/api/deliveries/:id/assign-mouse', handleAssignMouse);
  app.post('/api/deliveries/assign-mouse', handleAssignMouse);

  const handleRemoveMouse = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const id = req.params.id || req.body.id || req.body.deliveryId;
    if (!id) return res.status(400).json({ error: 'ID de préstamo requerido' });
    const updated = dbStore.removeMouseFromDelivery(id);
    if (!updated) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    return res.json(updated);
  };

  app.delete('/api/deliveries/:id/mouse', handleRemoveMouse);
  app.post('/api/deliveries/:id/mouse', handleRemoveMouse);
  app.post('/api/deliveries/remove-mouse', handleRemoveMouse);

  const handleDeleteDeliveryRoute = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const id = req.params.id || req.body.id || req.body.deliveryId;
    if (!id) return res.status(400).json({ error: 'ID de préstamo requerido' });
    const success = dbStore.deleteDelivery(id);
    if (!success) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    return res.json({ success: true, message: 'Registro de préstamo eliminado de la planilla' });
  };

  app.delete('/api/deliveries/:id', handleDeleteDeliveryRoute);
  app.post('/api/deliveries/:id/delete', handleDeleteDeliveryRoute);
  app.post('/api/deliveries/delete', handleDeleteDeliveryRoute);

  app.post('/api/deliveries/return-course', (req: Request, res: Response) => {
    const { course, teacherName } = req.body;
    if (!course) {
      return res.status(400).json({ error: 'Debe especificar el curso a finalizar' });
    }
    const returned = dbStore.returnCourseDeliveries(course, teacherName);
    res.json({ success: true, count: returned.length, returned });
  });

  app.post('/api/deliveries/delete-course', (req: Request, res: Response) => {
    const { course, teacherName } = req.body;
    if (!course) {
      return res.status(400).json({ error: 'Debe especificar el curso a eliminar' });
    }
    const count = dbStore.deleteCourseDeliveries(course, teacherName);
    res.json({ success: true, count });
  });

  // 5. Incidents
  app.get('/api/incidents', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const { pcNumber } = req.query;
    res.json(dbStore.getIncidents(pcNumber as string));
  });

  const handleCreateIncident = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const { pcNumber, deliveryId, reportedBy, type, severity, description, observations } = req.body;
    if (!pcNumber || !description) {
      return res.status(400).json({ error: 'pcNumber y description son campos obligatorios' });
    }
    const created = dbStore.createIncident({
      pcNumber,
      deliveryId,
      reportedBy: reportedBy || 'Operador de Sala',
      type: type || 'hardware',
      severity: severity || 'media',
      description,
      observations: observations || '',
    });
    return res.status(201).json(created);
  };

  app.post('/api/incidents', handleCreateIncident);
  app.post('/api/incidents/create', handleCreateIncident);
  app.post('/api/incidents/new', handleCreateIncident);
  app.put('/api/incidents', handleCreateIncident);

  // 6. Technical Repairs
  app.get('/api/repairs', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const { pcNumber } = req.query;
    res.json(dbStore.getRepairs(pcNumber as string));
  });

  const handleCreateRepair = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const { pcNumber, technicianName, faultDiagnosis, workDone, replacedParts, costEstimate, finalStatus, observations } = req.body;
    if (!pcNumber || !technicianName || !faultDiagnosis || !workDone) {
      return res.status(400).json({
        error: 'pcNumber, technicianName, faultDiagnosis y workDone son requeridos',
      });
    }
    const created = dbStore.createRepair({
      pcNumber,
      technicianName,
      faultDiagnosis,
      workDone,
      replacedParts: Array.isArray(replacedParts) ? replacedParts : (replacedParts ? [replacedParts] : []),
      costEstimate: costEstimate ? Number(costEstimate) : undefined,
      finalStatus: finalStatus || 'en_progreso',
      observations,
    });
    return res.status(201).json(created);
  };

  app.post('/api/repairs', handleCreateRepair);
  app.post('/api/repairs/create', handleCreateRepair);
  app.post('/api/repairs/new', handleCreateRepair);
  app.put('/api/repairs', handleCreateRepair);

  const handleCompleteRepair = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const id = req.params.id || req.body.id || req.body.repairId;
    if (!id) return res.status(400).json({ error: 'ID de orden de reparación requerido' });
    const completed = dbStore.completeRepair(id, req.body);
    if (!completed) {
      return res.status(404).json({ error: 'Orden de reparación no encontrada' });
    }
    return res.json(completed);
  };

  app.put('/api/repairs/:id/complete', handleCompleteRepair);
  app.post('/api/repairs/:id/complete', handleCompleteRepair);
  app.post('/api/repairs/complete', handleCompleteRepair);

  // 7. Maintenance Alerts
  app.get(['/api/maintenance/alerts', '/api/alerts'], (req: Request, res: Response) => {
    res.json(dbStore.getMaintenanceAlerts());
  });

  app.post(['/api/maintenance/evaluate', '/api/alerts/evaluate'], (req: Request, res: Response) => {
    dbStore.evaluateAutomaticMaintenanceAlerts();
    res.json({ success: true, alerts: dbStore.getMaintenanceAlerts() });
  });

  app.post('/api/maintenance/alerts/:id/resolve', (req: Request, res: Response) => {
    const { status } = req.body; // 'atendida' | 'descartada'
    const ok = dbStore.resolveMaintenanceAlert(req.params.id, status || 'atendida');
    if (!ok) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    res.json({ success: true, message: 'Alerta actualizada' });
  });

  // 8. Push Notifications
  app.get('/api/notifications', (req: Request, res: Response) => {
    res.json(dbStore.getNotifications());
  });

  app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
    const ok = dbStore.markNotificationRead(req.params.id);
    res.json({ success: ok });
  });

  app.post('/api/notifications/read-all', (req: Request, res: Response) => {
    dbStore.markAllNotificationsRead();
    res.json({ success: true });
  });

  app.post('/api/notifications/test-push', (req: Request, res: Response) => {
    const notif = dbStore.addNotification({
      title: req.body.title || '🔔 Prueba de Notificación Push',
      message: req.body.message || 'Sistema de alerta en tiempo real funcionando correctamente.',
      type: req.body.type || 'maintenance',
      priority: req.body.priority || 'alta',
      pcNumber: req.body.pcNumber || 'SALA-01',
    });
    res.json(notif);
  });

  // 8.5 User Profiles & Roles Authentication
  app.get('/api/users', (req: Request, res: Response) => {
    const users = dbStore.getUsers().map((u) => {
      // Retornar perfil
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        courses: u.courses || [],
        defaultSubject: u.defaultSubject || '',
        avatarColor: u.avatarColor || 'from-blue-600 to-indigo-600',
        lastLogin: u.lastLogin,
        phone: u.phone,
        pin: u.pin || '1234',
      };
    });
    res.json(users);
  });

  app.post('/api/users/login', (req: Request, res: Response) => {
    const { id, pin } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Debe especificar el usuario docente' });
    }
    const result = dbStore.authenticateUser(id, pin || '');
    if (!result.success) {
      return res.status(401).json({ error: result.error || 'Credenciales no válidas' });
    }
    res.json({
      success: true,
      user: {
        id: result.user!.id,
        name: result.user!.name,
        email: result.user!.email,
        role: result.user!.role,
        courses: result.user!.courses,
        defaultSubject: result.user!.defaultSubject,
        avatarColor: result.user!.avatarColor,
        lastLogin: result.user!.lastLogin,
        pin: result.user!.pin || '1234',
      },
    });
  });

  // Change PIN before or after logging in
  const handleChangePin = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const id = req.params.id || req.body.id || (req.query.id as string);
    const { currentPin, newPin, directReset } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Debe especificar el usuario docente' });
    }

    let user = dbStore.getUserById(id);
    if (!user) {
      user = dbStore.getUsers().find(
        (u) => u.id.toLowerCase() === id.toLowerCase() || u.name.toLowerCase() === id.toLowerCase()
      );
    }

    if (!user) {
      return res.status(404).json({ error: 'Perfil de docente no encontrado' });
    }

    if (!newPin || !newPin.trim()) {
      return res.status(400).json({ error: 'Debe ingresar un nuevo PIN (mínimo 4 caracteres)' });
    }
    if (newPin.trim().length < 4) {
      return res.status(400).json({ error: 'El PIN debe tener al menos 4 dígitos o caracteres' });
    }

    // If currentPin is required and not direct reset, verify it matches
    const existingPin = user.pin || '1234';
    if (!directReset && currentPin !== undefined && currentPin !== null && currentPin.trim() !== '') {
      if (currentPin.trim() !== existingPin) {
        return res.status(400).json({
          error: 'El PIN actual no coincide. Si nunca lo habías cambiado, el PIN inicial es 1234.',
        });
      }
    }

    const updated = dbStore.updateUser(user.id, { pin: newPin.trim() });
    return res.json({
      success: true,
      message: `PIN actualizado correctamente para ${user.name}`,
      user: {
        id: updated!.id,
        name: updated!.name,
        email: updated!.email,
        role: updated!.role,
        courses: updated!.courses,
        defaultSubject: updated!.defaultSubject,
        avatarColor: updated!.avatarColor,
        lastLogin: updated!.lastLogin,
        pin: updated!.pin,
      },
    });
  };

  app.post('/api/users/:id/change-pin', handleChangePin);
  app.post('/api/users/change-pin', handleChangePin);

  app.get('/api/users/:id', (req: Request, res: Response) => {
    const user = dbStore.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Perfil de usuario no encontrado' });
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      courses: user.courses,
      defaultSubject: user.defaultSubject,
      avatarColor: user.avatarColor,
      lastLogin: user.lastLogin,
      phone: user.phone,
    });
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const { name, role, pin, courses, defaultSubject, email, avatarColor, phone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del docente es obligatorio' });
    }
    const created = dbStore.createUser({
      name,
      role: role || 'profesor',
      pin: pin || '1234',
      courses: Array.isArray(courses) ? courses : [],
      defaultSubject: defaultSubject || '',
      email: email || '',
      avatarColor: avatarColor || 'from-indigo-600 to-blue-600',
      phone: phone || '',
    });
    res.status(201).json(created);
  });

  app.put('/api/users/:id', (req: Request, res: Response) => {
    const updated = dbStore.updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(updated);
  });

  app.delete('/api/users/:id', (req: Request, res: Response) => {
    if (req.params.id === 'admin-lab') {
      return res.status(400).json({ error: 'No se puede eliminar la cuenta principal de administración' });
    }
    const success = dbStore.deleteUser(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ success: true, message: 'Perfil de docente eliminado' });
  });

  // 9. Reset data
  app.post('/api/reset-data', (req: Request, res: Response) => {
    dbStore.resetToDefaults();
    res.json({ success: true, message: 'Datos de prueba restablecidos correctamente' });
  });

  // 10. Real-time Server-Sent Events (SSE)
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Initial keep-alive ping
    res.write(`event: connected\ndata: ${JSON.stringify({ connected: true, timestamp: Date.now() })}\n\n`);

    const unsubscribe = dbStore.subscribeSSE((eventName: string, payload: any) => {
      res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
    });

    const keepAliveTimer = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAliveTimer);
      unsubscribe();
    });
  });

  // --- VITE MIDDLEWARE OR STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor API Sala de Programación ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer();
