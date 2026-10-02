// server/store.ts
import fs from "fs";
import path from "path";

// src/types.ts
var DEFAULT_USER_PROFILES = [
  {
    id: "admin-lab",
    name: "Encargado de Laboratorio (Admin)",
    email: "admin.laboratorio@escuela.edu.ar",
    role: "administrador",
    pin: "1234",
    courses: ["4\xBA A\xF1o I", "4\xBA A\xF1o K", "5\xBA A\xF1o K", "5\xBA A\xF1o L", "6\xBA A\xF1o E", "6\xBA A\xF1o J"],
    defaultSubject: "Coordinaci\xF3n Sala de Inform\xE1tica",
    avatarColor: "from-purple-600 to-indigo-700"
  },
  {
    id: "prof-jorge-medina",
    name: "Jorge Medina",
    email: "jorge.medina@escuela.edu.ar",
    role: "profesor",
    pin: "1234",
    courses: ["5\xBA A\xF1o L", "5\xBA A\xF1o K"],
    defaultSubject: "",
    avatarColor: "from-blue-600 to-cyan-600"
  },
  {
    id: "prof-laura-rojano",
    name: "Laura Rojano",
    email: "laura.rojano@escuela.edu.ar",
    role: "profesor",
    pin: "1234",
    courses: ["4\xBA A\xF1o I", "4\xBA A\xF1o K"],
    defaultSubject: "Algoritmos y Estructuras de Datos",
    avatarColor: "from-pink-600 to-rose-600"
  },
  {
    id: "prof-gaston-frossasco",
    name: "Gast\xF3n Frossasco",
    email: "gaston.frossasco@escuela.edu.ar",
    role: "profesor",
    pin: "1234",
    courses: ["6\xBA A\xF1o E", "6\xBA A\xF1o J"],
    defaultSubject: "Desarrollo Web & Bases de Datos",
    avatarColor: "from-emerald-600 to-teal-600"
  },
  {
    id: "prof-maximiliano-romero",
    name: "Maximiliano Romero",
    email: "maximiliano.romero@escuela.edu.ar",
    role: "profesor",
    pin: "1234",
    courses: ["5\xBA A\xF1o L", "6\xBA A\xF1o E"],
    defaultSubject: "Laboratorio de Programaci\xF3n Avanzada",
    avatarColor: "from-amber-600 to-orange-600"
  },
  {
    id: "prof-mirian-gomez",
    name: "Mirian Gomez",
    email: "mirian.gomez@escuela.edu.ar",
    role: "profesor",
    pin: "1234",
    courses: ["4\xBA A\xF1o K", "5\xBA A\xF1o K"],
    defaultSubject: "Tecnolog\xEDas de la Informaci\xF3n y Comunicaci\xF3n",
    avatarColor: "from-violet-600 to-purple-600"
  },
  {
    id: "prof-moises-tinte",
    name: "Moises Tinte",
    email: "moises.tinte@escuela.edu.ar",
    role: "profesor",
    pin: "1234",
    courses: ["6\xBA A\xF1o J", "4\xBA A\xF1o I"],
    defaultSubject: "Redes y Telecomunicaciones",
    avatarColor: "from-sky-600 to-blue-700"
  },
  {
    id: "prof-german-gomez",
    name: "German Gomez",
    email: "german.gomez@escuela.edu.ar",
    role: "profesor",
    pin: "1234",
    courses: ["5\xBA A\xF1o K", "6\xBA A\xF1o E"],
    defaultSubject: "Programaci\xF3n Orientada a Objetos",
    avatarColor: "from-lime-600 to-emerald-700"
  },
  {
    id: "prof-bringas-santiago",
    name: "Bringas Santiago",
    email: "bringas.santiago@escuela.edu.ar",
    role: "profesor",
    pin: "1234",
    courses: ["4\xBA A\xF1o I", "5\xBA A\xF1o L"],
    defaultSubject: "Arquitectura de Computadoras y Hardware",
    avatarColor: "from-red-600 to-amber-700"
  }
];
var DEFAULT_COMPUTERS = Array.from({ length: 25 }, (_, i) => {
  const num = i + 1;
  const pad = num < 10 ? `0${num}` : `${num}`;
  const pcNumber = `PC-${pad}`;
  const rowLetters = ["A", "B", "C", "D", "E"];
  const rowIndex = Math.floor(i / 5);
  const seatIndex = i % 5 + 1;
  const rowLetter = rowLetters[rowIndex] || "E";
  const locationRow = `Fila ${rowLetter} - Puesto 0${seatIndex}`;
  let model = "Dell OptiPlex 7090 Tower";
  let processor = "Intel Core i7-11700 (8C/16T, 2.50 GHz)";
  let ram = "16 GB DDR4 3200MHz";
  let storage = "512 GB NVMe M.2 SSD";
  const os = "Dual Boot: Ubuntu 24.04 LTS / Windows 11 Pro";
  if (rowLetter === "B") {
    model = "Lenovo ThinkCentre M70s Gen 3";
    processor = "Intel Core i5-12500 (6C/12T, 3.00 GHz)";
    ram = "16 GB DDR4 3200MHz";
    storage = "512 GB PCIe M.2 SSD";
  } else if (rowLetter === "C") {
    model = "HP ProDesk 600 G6 Microtower";
    processor = "AMD Ryzen 7 PRO 4750G (8C/16T, 3.60 GHz)";
    ram = "32 GB DDR4 3200MHz";
    storage = "1 TB NVMe SSD";
  } else if (rowLetter === "D") {
    model = "Dell OptiPlex 7090 Tower";
    processor = "Intel Core i7-11700 (8C/16T, 2.50 GHz)";
    ram = "16 GB DDR4 3200MHz";
    storage = "512 GB NVMe M.2 SSD";
  } else if (rowLetter === "E") {
    model = "HP ProDesk 600 G6 Microtower";
    processor = "Intel Core i7-10700 (8C/16T, 2.90 GHz)";
    ram = "16 GB DDR4 3200MHz";
    storage = "512 GB NVMe SSD";
  }
  return {
    id: pcNumber,
    pcNumber,
    model,
    processor,
    ram,
    storage,
    os,
    status: "disponible",
    locationRow,
    lastMaintenanceDate: "2026-03-01T08:00:00.000Z",
    totalLoansCount: 0,
    totalUsageHours: 12 + i,
    healthScore: 100,
    notes: "Configurado con IDEs de programaci\xF3n (VS Code, Python, GCC, Node.js)"
  };
});

// server/store.ts
var DATA_DIR = path.join(process.cwd(), "data");
var DATA_FILE = path.join(DATA_DIR, "lab_records.json");
var INITIAL_COMPUTERS = Array.from({ length: 25 }, (_, i) => {
  const num = i + 1;
  const pad = num < 10 ? `0${num}` : `${num}`;
  const pcNumber = `PC-${pad}`;
  const rowLetters = ["A", "B", "C", "D", "E"];
  const rowIndex = Math.floor(i / 5);
  const seatIndex = i % 5 + 1;
  const rowLetter = rowLetters[rowIndex] || "E";
  const locationRow = `Fila ${rowLetter} - Puesto 0${seatIndex}`;
  let model = "Dell OptiPlex 7090 Tower";
  let processor = "Intel Core i7-11700 (8C/16T, 2.50 GHz)";
  let ram = "16 GB DDR4 3200MHz";
  let storage = "512 GB NVMe M.2 SSD";
  const os = "Dual Boot: Ubuntu 24.04 LTS / Windows 11 Pro";
  if (rowLetter === "B") {
    model = "Lenovo ThinkCentre M70s Gen 3";
    processor = "Intel Core i5-12500 (6C/12T, 3.00 GHz)";
    ram = "16 GB DDR4 3200MHz";
    storage = "512 GB PCIe M.2 SSD";
  } else if (rowLetter === "C") {
    model = "HP ProDesk 600 G6 Microtower";
    processor = "AMD Ryzen 7 PRO 4750G (8C/16T, 3.60 GHz)";
    ram = "32 GB DDR4 3200MHz";
    storage = "1 TB NVMe SSD";
  } else if (rowLetter === "D") {
    model = "Dell OptiPlex 7090 Tower";
    processor = "Intel Core i7-11700 (8C/16T, 2.50 GHz)";
    ram = "16 GB DDR4 3200MHz";
    storage = "512 GB NVMe M.2 SSD";
  } else if (rowLetter === "E") {
    model = "HP ProDesk 600 G6 Microtower";
    processor = "Intel Core i7-10700 (8C/16T, 2.90 GHz)";
    ram = "16 GB DDR4 3200MHz";
    storage = "512 GB NVMe SSD";
  }
  return {
    id: pcNumber,
    pcNumber,
    model,
    processor,
    ram,
    storage,
    os,
    status: "disponible",
    locationRow,
    lastMaintenanceDate: "2026-09-01T08:00:00.000Z",
    totalLoansCount: 0,
    totalUsageHours: 0,
    healthScore: 100,
    notes: "Equipo verificado y listo para programaci\xF3n"
  };
});
var STUDENTS_4_I = [
  "Agudelo Juan Martin",
  "Aguirre Samuel",
  "Allende Aguero Benjamin",
  "Alvarez Gael",
  "Franco Jazmin",
  "Franco Jeremias",
  "Lazo Fernandez Martina",
  "Lesta Juan Cruz",
  "L\xF3pez Lautaro",
  "Moriconi Octavio",
  "Palacios Uriel",
  "Puchi Ludmila",
  "Reyna Thiago Benjamin",
  "Robles Luciano",
  "Romero Benjamin",
  "Sanchez Ortega",
  "Soria Ingrid",
  "Sosa Lapenta Mateo",
  "Torres Martiniano"
];
var MOUSE_CODES_ASSIGNED = [
  "LF79",
  "N249",
  "N3Z9",
  "N219",
  "LFE9",
  "LFA9",
  "LFF9",
  "LF89",
  "N3T9",
  "N239"
];
var INITIAL_DELIVERIES = STUDENTS_4_I.map((studentName, idx) => {
  const pcNum = idx + 1;
  const pcNumber = `PC-${String(pcNum).padStart(2, "0")}`;
  const mouseCode = MOUSE_CODES_ASSIGNED[idx];
  const includesMouse = Boolean(mouseCode);
  return {
    id: `DEL-2026-${String(idx + 1).padStart(3, "0")}`,
    pcNumber,
    computerId: pcNumber,
    studentName,
    studentId: "4\xBA A\xF1o I",
    studentCareer: "Programaci\xF3n I",
    teacherName: "Bringas Santiago",
    subjectName: "Arquitectura de Computadoras y Hardware",
    deliveryDate: (/* @__PURE__ */ new Date("2026-09-28T08:00:00.000Z")).toISOString(),
    expectedReturnTime: (/* @__PURE__ */ new Date("2026-09-28T12:00:00.000Z")).toISOString(),
    returnDate: (/* @__PURE__ */ new Date("2026-09-28T12:00:00.000Z")).toISOString(),
    status: "devuelto_bien",
    observations: "Equipo entregado en condiciones \xF3ptimas. Sin da\xF1os previos detectados.",
    returnObservations: "Devoluci\xF3n completa en \xF3ptimas condiciones al finalizar la clase.",
    reportedDamageOnReturn: false,
    includesCharger: true,
    chargerNumber: `Cargador ${String(pcNum).padStart(2, "0")}`,
    chargerReturned: true,
    includesMouse,
    mouseNumber: mouseCode || void 0,
    mouseBrand: includesMouse ? "Logitech M90" : void 0,
    mouseReturned: true,
    registeredBy: "Encargado de Laboratorio"
  };
});
var INITIAL_INCIDENTS = [];
var INITIAL_REPAIRS = [];
var INITIAL_ALERTS = [];
var INITIAL_NOTIFICATIONS = [];
var DatabaseStore = class {
  constructor() {
    this.sseClients = [];
    this.data = this.loadData();
    this.evaluateAutomaticMaintenanceAlerts();
  }
  loadData() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.computers) && Array.isArray(parsed.deliveries)) {
          if (parsed.deliveries.length === 0 && INITIAL_DELIVERIES.length > 0) {
            parsed.deliveries = INITIAL_DELIVERIES;
            parsed.computers.forEach((comp) => {
              const activeDelivery = parsed.deliveries.find(
                (d) => d.status === "activo" && d.pcNumber === comp.pcNumber
              );
              if (activeDelivery) {
                comp.status = "en_uso";
                comp.totalLoansCount = Math.max(comp.totalLoansCount || 0, 1);
              }
            });
            this.saveDataDirect(parsed);
          }
          if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
            parsed.users = DEFAULT_USER_PROFILES;
            this.saveDataDirect(parsed);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read existing data file, initializing default dataset:", e);
    }
    const initial = {
      computers: INITIAL_COMPUTERS,
      deliveries: INITIAL_DELIVERIES,
      incidents: INITIAL_INCIDENTS,
      repairs: INITIAL_REPAIRS,
      maintenanceAlerts: INITIAL_ALERTS,
      notifications: INITIAL_NOTIFICATIONS,
      users: DEFAULT_USER_PROFILES,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.saveDataDirect(initial);
    return initial;
  }
  saveDataDirect(state) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write database file:", e);
    }
  }
  save() {
    this.data.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    this.saveDataDirect(this.data);
    this.broadcast("sync", {
      lastUpdated: this.data.lastUpdated,
      stats: this.getStats()
    });
  }
  subscribeSSE(clientHandler) {
    this.sseClients.push(clientHandler);
    return () => {
      this.sseClients = this.sseClients.filter((c) => c !== clientHandler);
    };
  }
  broadcast(event, payload) {
    for (const client of this.sseClients) {
      try {
        client(event, payload);
      } catch (err) {
      }
    }
  }
  // --- Computers ---
  getComputers(filterStatus) {
    if (!this.data.computers || !Array.isArray(this.data.computers) || this.data.computers.length === 0) {
      this.data.computers = DEFAULT_COMPUTERS;
      this.save();
    }
    const activePcNumbers = new Set(
      (this.data.deliveries || []).filter((d) => d.status === "activo" && !d.pcNumber.startsWith("SOLO-")).map((d) => d.pcNumber)
    );
    for (const comp of this.data.computers) {
      if (comp.status !== "en_reparacion" && comp.status !== "mantenimiento" && comp.status !== "de_baja") {
        comp.status = activePcNumbers.has(comp.pcNumber) ? "en_uso" : "disponible";
      }
    }
    if (filterStatus) {
      const lower = filterStatus.toLowerCase();
      if (lower === "disponible" || lower === "available" || lower === "libres") {
        return this.data.computers.filter((c) => c.status === "disponible");
      }
      return this.data.computers.filter((c) => c.status.toLowerCase() === lower);
    }
    return this.data.computers;
  }
  getAvailablePcNumbers() {
    return this.getComputers("disponible").map((c) => c.pcNumber);
  }
  getComputerById(id) {
    return this.data.computers.find((c) => c.id === id || c.pcNumber === id);
  }
  addComputer(comp) {
    const id = comp.pcNumber.trim();
    const newComp = {
      ...comp,
      id,
      lastMaintenanceDate: comp.lastMaintenanceDate || (/* @__PURE__ */ new Date()).toISOString(),
      totalLoansCount: comp.totalLoansCount || 0,
      totalUsageHours: comp.totalUsageHours || 0,
      healthScore: comp.healthScore || 100
    };
    this.data.computers.push(newComp);
    this.save();
    this.broadcast("computer_created", newComp);
    return newComp;
  }
  updateComputer(id, updates) {
    const idx = this.data.computers.findIndex((c) => c.id === id || c.pcNumber === id);
    if (idx === -1) return null;
    this.data.computers[idx] = { ...this.data.computers[idx], ...updates };
    this.save();
    this.broadcast("computer_updated", this.data.computers[idx]);
    return this.data.computers[idx];
  }
  // --- Deliveries ---
  getDeliveries(filter) {
    let list = [...this.data.deliveries];
    if (!filter) return list.sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());
    if (filter.teacherName) {
      const q = filter.teacherName.toLowerCase().trim();
      list = list.filter((d) => d.teacherName.toLowerCase().includes(q));
    }
    if (filter.subjectName) {
      const q = filter.subjectName.toLowerCase().trim();
      list = list.filter((d) => d.subjectName.toLowerCase().includes(q));
    }
    if (filter.pcNumber) {
      const q = filter.pcNumber.toLowerCase().trim();
      list = list.filter((d) => d.pcNumber.toLowerCase().includes(q));
    }
    if (filter.status) {
      list = list.filter((d) => d.status === filter.status);
    }
    if (filter.startDate) {
      const start = new Date(filter.startDate).getTime();
      list = list.filter((d) => new Date(d.deliveryDate).getTime() >= start);
    }
    if (filter.endDate) {
      const end = new Date(filter.endDate).getTime();
      list = list.filter((d) => new Date(d.deliveryDate).getTime() <= end);
    }
    return list.sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());
  }
  createDelivery(payload) {
    const deliveryId = `DEL-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(this.data.deliveries.length + 1).padStart(3, "0")}`;
    const onlyCharger = Boolean(
      payload.onlyCharger || payload.pcNumber === "SOLO-CARGADOR" || payload.pcNumber?.startsWith("SOLO-CARGADOR")
    );
    const onlyMouse = Boolean(
      payload.onlyMouse || payload.pcNumber === "SOLO-MOUSE" || payload.pcNumber?.startsWith("SOLO-MOUSE")
    );
    const isPeripheralsOnly = onlyCharger || onlyMouse;
    const includesCharger = onlyCharger || Boolean(payload.includesCharger || payload.chargerNumber && payload.chargerNumber.trim() !== "");
    const chargerNumber = includesCharger ? payload.chargerNumber?.trim() || (onlyCharger ? "Cargador 01" : `Cargador ${payload.pcNumber.replace(/\D/g, "") || "01"}`) : void 0;
    const includesMouse = onlyMouse || Boolean(payload.includesMouse || payload.mouseNumber && payload.mouseNumber.trim() !== "");
    const mouseNumber = includesMouse ? payload.mouseNumber?.trim() || (onlyMouse ? "LF79" : `Mouse ${payload.pcNumber.replace(/\D/g, "") || "01"}`) : void 0;
    const mouseBrand = includesMouse ? payload.mouseBrand?.trim() || "Logitech M90" : void 0;
    let pcNumber = payload.pcNumber;
    if (onlyCharger && onlyMouse) {
      pcNumber = "SOLO-CARGADOR-MOUSE";
    } else if (onlyCharger) {
      pcNumber = "SOLO-CARGADOR";
    } else if (onlyMouse) {
      pcNumber = "SOLO-MOUSE";
    }
    let defaultObs = "Equipo entregado en condiciones est\xE1ndar.";
    if (onlyCharger && onlyMouse) {
      defaultObs = "Pr\xE9stamo de cargador y mouse \xF3ptico USB (el alumno trajo su propia PC).";
    } else if (onlyCharger) {
      defaultObs = "Pr\xE9stamo exclusivo de cargador (el alumno trajo su propia PC/Netbook).";
    } else if (onlyMouse) {
      defaultObs = "Pr\xE9stamo exclusivo de mouse \xF3ptico USB (el alumno trajo su propia PC/Netbook).";
    }
    const newRecord = {
      id: deliveryId,
      pcNumber,
      computerId: pcNumber,
      studentName: payload.studentName.trim(),
      studentId: payload.studentId.trim(),
      studentCareer: payload.studentCareer?.trim() || "Ingenier\xEDa",
      teacherName: payload.teacherName.trim(),
      subjectName: payload.subjectName.trim(),
      deliveryDate: (/* @__PURE__ */ new Date()).toISOString(),
      expectedReturnTime: payload.expectedReturnTime || void 0,
      returnDate: null,
      status: "activo",
      observations: payload.observations?.trim() || defaultObs,
      returnObservations: "",
      reportedDamageOnReturn: false,
      includesCharger,
      chargerNumber,
      chargerReturned: false,
      onlyCharger,
      includesMouse,
      mouseNumber,
      mouseBrand,
      mouseReturned: false,
      onlyMouse,
      registeredBy: payload.registeredBy || "Administrador de Sala"
    };
    this.data.deliveries.unshift(newRecord);
    if (!isPeripheralsOnly && !pcNumber.startsWith("SOLO-")) {
      const comp = this.getComputerById(payload.pcNumber);
      if (comp) {
        comp.status = "en_uso";
        comp.totalLoansCount = (comp.totalLoansCount || 0) + 1;
      }
      this.evaluateAutomaticMaintenanceAlerts();
    }
    this.save();
    this.broadcast("delivery_created", newRecord);
    return newRecord;
  }
  returnDelivery(id, payload) {
    const delivery = this.data.deliveries.find((d) => d.id === id || d.pcNumber === id && d.status === "activo");
    if (!delivery) return null;
    delivery.returnDate = (/* @__PURE__ */ new Date()).toISOString();
    delivery.returnObservations = payload.returnObservations || "Devuelto por el usuario.";
    delivery.reportedDamageOnReturn = !!payload.reportedDamageOnReturn;
    if (delivery.includesCharger) {
      delivery.chargerReturned = payload.chargerReturned !== void 0 ? !!payload.chargerReturned : true;
    }
    if (delivery.includesMouse) {
      delivery.mouseReturned = payload.mouseReturned !== void 0 ? !!payload.mouseReturned : true;
    }
    delivery.status = payload.reportedDamageOnReturn ? "devuelto_con_novedad" : "devuelto_bien";
    const start = new Date(delivery.deliveryDate).getTime();
    const end = new Date(delivery.returnDate).getTime();
    const hours = Math.max(0.5, Math.round((end - start) / (1e3 * 60 * 60) * 10) / 10);
    if (!delivery.onlyCharger && !delivery.onlyMouse && !delivery.pcNumber.startsWith("SOLO-")) {
      const comp = this.getComputerById(delivery.pcNumber);
      if (comp) {
        comp.totalUsageHours = (comp.totalUsageHours || 0) + hours;
        if (payload.reportedDamageOnReturn) {
          comp.status = "mantenimiento";
          comp.healthScore = Math.max(30, (comp.healthScore || 80) - 15);
        } else {
          comp.status = "disponible";
        }
      }
    }
    if (payload.reportedDamageOnReturn) {
      this.createIncident({
        pcNumber: delivery.pcNumber,
        deliveryId: delivery.id,
        reportedBy: `${delivery.studentName} (Alumno) / Docente: ${delivery.teacherName}`,
        type: payload.incidentType || "dano_fisico",
        severity: payload.incidentSeverity || "media",
        description: payload.incidentDescription || payload.returnObservations || "Da\xF1o o novedad reportada al devolver el equipo.",
        observations: `Registrado en devoluci\xF3n de materia ${delivery.subjectName}. Observaciones: ${payload.returnObservations || "Ninguna"}`
      });
      this.addNotification({
        title: `\u{1F6A8} Da\xF1o reportado en ${delivery.pcNumber}`,
        message: `El equipo ${delivery.pcNumber} fue devuelto con novedades por ${delivery.studentName} (Materia: ${delivery.subjectName}).`,
        type: "damage",
        priority: "alta",
        pcNumber: delivery.pcNumber
      });
    }
    this.evaluateAutomaticMaintenanceAlerts();
    this.save();
    this.broadcast("delivery_returned", delivery);
    return delivery;
  }
  assignChargerToDelivery(id, payload) {
    const delivery = this.data.deliveries.find((d) => d.id === id || d.pcNumber === id && d.status === "activo");
    if (!delivery) return null;
    const chargerNumber = payload.chargerNumber?.trim() || `Cargador ${delivery.pcNumber.replace(/\D/g, "") || "01"}`;
    delivery.includesCharger = true;
    delivery.chargerNumber = chargerNumber;
    delivery.chargerReturned = false;
    delivery.chargerAssignedLater = true;
    delivery.chargerAssignedAt = (/* @__PURE__ */ new Date()).toISOString();
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const reasonText = payload.reason?.trim() || "Bater\xEDa agotada en clase";
    const chargerNote = ` [\u26A1 Cargador asignado en uso (${timestamp}): ${chargerNumber} - ${reasonText}]`;
    if (delivery.observations) {
      if (!delivery.observations.includes(chargerNumber)) {
        delivery.observations += chargerNote;
      }
    } else {
      delivery.observations = `Equipo entregado originalmente sin cargador.${chargerNote}`;
    }
    this.addNotification({
      title: `\u26A1 Cargador asignado a ${delivery.pcNumber}`,
      message: `Se asign\xF3 ${chargerNumber} a ${delivery.studentName} (${delivery.studentId}) por quedarse sin bater\xEDa en clase.`,
      type: "maintenance",
      priority: "normal",
      pcNumber: delivery.pcNumber
    });
    this.save();
    this.broadcast("delivery_updated", delivery);
    return delivery;
  }
  removeChargerFromDelivery(id) {
    const delivery = this.data.deliveries.find((d) => d.id === id || d.pcNumber === id && d.status === "activo");
    if (!delivery) return null;
    delivery.includesCharger = false;
    delivery.chargerNumber = void 0;
    delivery.chargerReturned = void 0;
    delivery.chargerAssignedLater = false;
    delivery.chargerAssignedAt = void 0;
    this.save();
    this.broadcast("delivery_updated", delivery);
    return delivery;
  }
  assignMouseToDelivery(id, payload) {
    const delivery = this.data.deliveries.find((d) => d.id === id || d.pcNumber === id && d.status === "activo");
    if (!delivery) return null;
    const mouseNumber = payload.mouseNumber?.trim() || `Mouse ${delivery.pcNumber.replace(/\D/g, "") || "01"}`;
    const mouseBrand = payload.mouseBrand?.trim() || delivery.mouseBrand || "Logitech M90";
    delivery.includesMouse = true;
    delivery.mouseNumber = mouseNumber;
    delivery.mouseBrand = mouseBrand;
    delivery.mouseReturned = false;
    delivery.mouseAssignedLater = true;
    delivery.mouseAssignedAt = (/* @__PURE__ */ new Date()).toISOString();
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const reasonText = payload.reason?.trim() || "Solicitud de mouse para trabajo en clase";
    const mouseNote = ` [\u{1F5B1}\uFE0F Mouse asignado en uso (${timestamp}): ${mouseNumber} (${mouseBrand}) - ${reasonText}]`;
    if (delivery.observations) {
      if (!delivery.observations.includes(mouseNumber)) {
        delivery.observations += mouseNote;
      }
    } else {
      delivery.observations = `Equipo entregado originalmente sin mouse.${mouseNote}`;
    }
    this.addNotification({
      title: `\u{1F5B1}\uFE0F Mouse asignado a ${delivery.pcNumber}`,
      message: `Se asign\xF3 ${mouseNumber} (${mouseBrand}) a ${delivery.studentName} (${delivery.studentId}) para su trabajo en clase.`,
      type: "maintenance",
      priority: "normal",
      pcNumber: delivery.pcNumber
    });
    this.save();
    this.broadcast("delivery_updated", delivery);
    return delivery;
  }
  removeMouseFromDelivery(id) {
    const delivery = this.data.deliveries.find((d) => d.id === id);
    if (!delivery) return null;
    delivery.includesMouse = false;
    delivery.mouseNumber = void 0;
    delivery.mouseBrand = void 0;
    delivery.mouseReturned = void 0;
    delivery.mouseAssignedLater = false;
    delivery.mouseAssignedAt = void 0;
    this.save();
    this.broadcast("delivery_updated", delivery);
    return delivery;
  }
  deleteDelivery(id) {
    const index = this.data.deliveries.findIndex((d) => d.id === id);
    if (index === -1) return false;
    const delivery = this.data.deliveries[index];
    if (delivery.status === "activo") {
      const comp = this.getComputerById(delivery.pcNumber);
      if (comp && comp.status === "en_uso") {
        comp.status = "disponible";
      }
    }
    this.data.deliveries.splice(index, 1);
    this.evaluateAutomaticMaintenanceAlerts();
    this.save();
    this.broadcast("delivery_deleted", { id });
    return true;
  }
  returnCourseDeliveries(courseName, teacherName) {
    const updated = [];
    const normalizedCourse = courseName.trim().toLowerCase();
    const normalizedTeacher = teacherName ? teacherName.trim().toLowerCase() : null;
    for (const delivery of this.data.deliveries) {
      const matchCourse = delivery.studentId.trim().toLowerCase() === normalizedCourse || delivery.studentId.trim().toLowerCase().includes(normalizedCourse);
      const matchTeacher = !normalizedTeacher || delivery.teacherName.trim().toLowerCase() === normalizedTeacher;
      if (delivery.status === "activo" && matchCourse && matchTeacher) {
        delivery.returnDate = (/* @__PURE__ */ new Date()).toISOString();
        delivery.status = "devuelto_bien";
        delivery.returnObservations = `Devuelto al finalizar la clase de ${courseName}${delivery.teacherName ? ` con Prof. ${delivery.teacherName}` : ""}.`;
        if (delivery.includesCharger) {
          delivery.chargerReturned = true;
        }
        const comp = this.getComputerById(delivery.pcNumber);
        if (comp && comp.status === "en_uso") {
          comp.status = "disponible";
        }
        updated.push(delivery);
      }
    }
    if (updated.length > 0) {
      this.evaluateAutomaticMaintenanceAlerts();
      this.save();
      this.broadcast("course_deliveries_returned", {
        courseName,
        teacherName,
        count: updated.length
      });
    }
    return updated;
  }
  deleteCourseDeliveries(courseName, teacherName) {
    const normalizedCourse = courseName.trim().toLowerCase();
    const normalizedTeacher = teacherName ? teacherName.trim().toLowerCase() : null;
    const toDelete = this.data.deliveries.filter((d) => {
      const matchCourse = d.studentId.trim().toLowerCase() === normalizedCourse || d.studentId.trim().toLowerCase().includes(normalizedCourse);
      const matchTeacher = !normalizedTeacher || d.teacherName.trim().toLowerCase() === normalizedTeacher;
      return matchCourse && matchTeacher;
    });
    for (const delivery of toDelete) {
      if (delivery.status === "activo") {
        const comp = this.getComputerById(delivery.pcNumber);
        if (comp && comp.status === "en_uso") {
          comp.status = "disponible";
        }
      }
    }
    this.data.deliveries = this.data.deliveries.filter((d) => !toDelete.includes(d));
    this.evaluateAutomaticMaintenanceAlerts();
    this.save();
    this.broadcast("course_deliveries_deleted", {
      courseName,
      teacherName,
      count: toDelete.length
    });
    return toDelete.length;
  }
  // --- Incidents ---
  getIncidents(pcNumber) {
    if (pcNumber) {
      return this.data.incidents.filter((i) => i.pcNumber === pcNumber);
    }
    return this.data.incidents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  createIncident(payload) {
    const incId = `INC-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(this.data.incidents.length + 1).padStart(2, "0")}`;
    const newInc = {
      id: incId,
      pcNumber: payload.pcNumber,
      deliveryId: payload.deliveryId,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      reportedBy: payload.reportedBy,
      type: payload.type || "hardware",
      severity: payload.severity || "media",
      description: payload.description,
      observations: payload.observations || "",
      resolved: false
    };
    this.data.incidents.unshift(newInc);
    this.addNotification({
      title: `Incidencia registrada: ${payload.pcNumber}`,
      message: `Nueva falla detectada (${payload.type} - ${payload.severity}): ${payload.description}`,
      type: "damage",
      priority: payload.severity === "critica" || payload.severity === "alta" ? "urgente" : "normal",
      pcNumber: payload.pcNumber
    });
    this.evaluateAutomaticMaintenanceAlerts();
    this.save();
    this.broadcast("incident_created", newInc);
    return newInc;
  }
  // --- Technical Repairs ---
  getRepairs(pcNumber) {
    if (pcNumber) {
      return this.data.repairs.filter((r) => r.pcNumber === pcNumber);
    }
    return this.data.repairs.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }
  createRepair(payload) {
    const repId = `REP-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(this.data.repairs.length + 1).padStart(2, "0")}`;
    const newRep = {
      id: repId,
      pcNumber: payload.pcNumber,
      startDate: (/* @__PURE__ */ new Date()).toISOString(),
      technicianName: payload.technicianName,
      faultDiagnosis: payload.faultDiagnosis,
      workDone: payload.workDone,
      replacedParts: payload.replacedParts || [],
      costEstimate: payload.costEstimate,
      finalStatus: payload.finalStatus || "en_progreso",
      observations: payload.observations || ""
    };
    this.data.repairs.unshift(newRep);
    const comp = this.getComputerById(payload.pcNumber);
    if (comp) {
      if (newRep.finalStatus === "reparado") {
        comp.status = "disponible";
        comp.healthScore = Math.min(100, (comp.healthScore || 70) + 20);
        comp.lastMaintenanceDate = (/* @__PURE__ */ new Date()).toISOString();
        newRep.endDate = (/* @__PURE__ */ new Date()).toISOString();
      } else if (newRep.finalStatus === "requiere_baja") {
        comp.status = "de_baja";
        comp.healthScore = 0;
      } else {
        comp.status = "en_reparacion";
      }
    }
    this.addNotification({
      title: `Orden T\xE9cnica ${newRep.id} - ${payload.pcNumber}`,
      message: `T\xE9cnico ${payload.technicianName} registr\xF3 servicio para ${payload.pcNumber} (${newRep.finalStatus}).`,
      type: "repair",
      priority: "normal",
      pcNumber: payload.pcNumber
    });
    this.save();
    this.broadcast("repair_created", newRep);
    return newRep;
  }
  completeRepair(id, payload) {
    const rep = this.data.repairs.find((r) => r.id === id);
    if (!rep) return null;
    rep.endDate = (/* @__PURE__ */ new Date()).toISOString();
    rep.workDone = payload.workDone || rep.workDone;
    if (payload.replacedParts) rep.replacedParts = payload.replacedParts;
    if (payload.costEstimate !== void 0) rep.costEstimate = payload.costEstimate;
    rep.finalStatus = payload.finalStatus;
    if (payload.observations) rep.observations = payload.observations;
    const comp = this.getComputerById(rep.pcNumber);
    if (comp) {
      if (payload.finalStatus === "reparado") {
        comp.status = "disponible";
        comp.healthScore = Math.min(100, (comp.healthScore || 70) + 25);
        comp.lastMaintenanceDate = (/* @__PURE__ */ new Date()).toISOString();
      } else {
        comp.status = "de_baja";
        comp.healthScore = 0;
      }
    }
    this.addNotification({
      title: `\u2705 Reparaci\xF3n Finalizada: ${rep.pcNumber}`,
      message: `El equipo ${rep.pcNumber} fue reparado exitosamente y vuelve al inventario disponible.`,
      type: "repair",
      priority: "normal",
      pcNumber: rep.pcNumber
    });
    this.save();
    this.broadcast("repair_updated", rep);
    return rep;
  }
  // --- Maintenance Alerts ---
  getMaintenanceAlerts() {
    return this.data.maintenanceAlerts;
  }
  resolveMaintenanceAlert(id, status) {
    const alt = this.data.maintenanceAlerts.find((a) => a.id === id);
    if (!alt) return false;
    alt.status = status;
    this.save();
    this.broadcast("alert_updated", alt);
    return true;
  }
  evaluateAutomaticMaintenanceAlerts() {
    const now = Date.now();
    for (const comp of this.data.computers) {
      if (comp.totalLoansCount >= 30) {
        const existing = this.data.maintenanceAlerts.find(
          (a) => a.pcNumber === comp.pcNumber && a.ruleType === "usage_threshold" && a.status === "activa"
        );
        if (!existing) {
          const newAlert = {
            id: `ALT-USE-${comp.pcNumber}-${Date.now().toString().slice(-4)}`,
            pcNumber: comp.pcNumber,
            ruleType: "usage_threshold",
            priority: comp.totalLoansCount > 50 ? "urgente" : "alta",
            title: `Alerta de Mantenimiento Preventivo: ${comp.pcNumber}`,
            message: `El equipo acumula ${comp.totalLoansCount} pr\xE9stamos y ${comp.totalUsageHours} horas de uso. Super\xF3 el umbral preventivo.`,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            status: "activa",
            suggestedAction: "Programar limpieza de ventiladores, cambio de pasta t\xE9rmica y diagn\xF3stico de disco SSD."
          };
          this.data.maintenanceAlerts.unshift(newAlert);
          this.addNotification({
            title: `Alerta Preventiva Autom\xE1tica: ${comp.pcNumber}`,
            message: newAlert.message,
            type: "maintenance",
            priority: "alta",
            pcNumber: comp.pcNumber
          });
        }
      }
      const lastMaint = new Date(comp.lastMaintenanceDate).getTime();
      const daysSince = Math.floor((now - lastMaint) / (1e3 * 60 * 60 * 24));
      if (daysSince > 90) {
        const existing = this.data.maintenanceAlerts.find(
          (a) => a.pcNumber === comp.pcNumber && a.ruleType === "days_since_service" && a.status === "activa"
        );
        if (!existing) {
          const newAlert = {
            id: `ALT-DAYS-${comp.pcNumber}-${Date.now().toString().slice(-4)}`,
            pcNumber: comp.pcNumber,
            ruleType: "days_since_service",
            priority: daysSince > 120 ? "urgente" : "media",
            title: `Revisi\xF3n Peri\xF3dica Vencida: ${comp.pcNumber}`,
            message: `Han pasado ${daysSince} d\xEDas desde el \xFAltimo mantenimiento preventivo registrado.`,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            status: "activa",
            suggestedAction: "Inspecci\xF3n f\xEDsica completa de cableado, fuentes y actualizaci\xF3n de im\xE1genes de SO."
          };
          this.data.maintenanceAlerts.unshift(newAlert);
        }
      }
    }
  }
  // --- Notifications ---
  getNotifications() {
    return this.data.notifications;
  }
  addNotification(payload) {
    const notif = {
      ...payload,
      id: `NOTIF-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      read: false
    };
    this.data.notifications.unshift(notif);
    if (this.data.notifications.length > 50) {
      this.data.notifications = this.data.notifications.slice(0, 50);
    }
    this.save();
    this.broadcast("push_notification", notif);
    return notif;
  }
  markNotificationRead(id) {
    const n = this.data.notifications.find((item) => item.id === id);
    if (!n) return false;
    n.read = true;
    this.save();
    return true;
  }
  markAllNotificationsRead() {
    for (const n of this.data.notifications) {
      n.read = true;
    }
    this.save();
    this.broadcast("notifications_cleared", {});
  }
  // --- Stats ---
  getStats() {
    const computers = this.getComputers();
    const totalComputers = computers.length;
    const availableComputersList = computers.filter((c) => c.status === "disponible");
    const availableComputers = availableComputersList.length;
    const availablePcNumbers = availableComputersList.map((c) => c.pcNumber);
    const inUseComputersList = computers.filter((c) => c.status === "en_uso");
    const inUseComputers = inUseComputersList.length;
    const inUsePcNumbers = inUseComputersList.map((c) => c.pcNumber);
    const inMaintenanceComputers = computers.filter((c) => c.status === "mantenimiento").length;
    const inRepairComputers = computers.filter((c) => c.status === "en_reparacion").length;
    const activeDeliveriesCount = (this.data.deliveries || []).filter((d) => d.status === "activo").length;
    const pendingAlertsCount = (this.data.maintenanceAlerts || []).filter((a) => a.status === "activa").length;
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const totalLoansToday = (this.data.deliveries || []).filter((d) => d.deliveryDate.startsWith(todayStr)).length;
    return {
      totalComputers,
      availableComputers,
      availablePcNumbers,
      inUseComputers,
      inUsePcNumbers,
      inMaintenanceComputers,
      inRepairComputers,
      activeDeliveriesCount,
      pendingAlertsCount,
      totalLoansToday
    };
  }
  // --- User Profiles & Authentication ---
  getUsers() {
    if (!this.data.users || !Array.isArray(this.data.users) || this.data.users.length === 0) {
      this.data.users = DEFAULT_USER_PROFILES;
      this.save();
    }
    return this.data.users;
  }
  getUserById(id) {
    return (this.data.users || []).find((u) => u.id === id);
  }
  authenticateUser(id, pin) {
    const user = this.getUserById(id);
    if (!user) {
      return { success: false, error: "Usuario docente no encontrado" };
    }
    if (user.pin && user.pin !== pin) {
      return { success: false, error: "PIN o clave incorrecta" };
    }
    user.lastLogin = (/* @__PURE__ */ new Date()).toISOString();
    this.save();
    return { success: true, user };
  }
  createUser(userData) {
    const cleanName = (userData.name || "Docente").trim();
    const id = userData.id || `prof-${cleanName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now().toString().slice(-4)}`;
    const newUser = {
      id,
      name: cleanName,
      email: userData.email || "",
      role: userData.role || "profesor",
      pin: userData.pin || "1234",
      courses: userData.courses || [],
      defaultSubject: userData.defaultSubject || "Materia General",
      avatarColor: userData.avatarColor || "from-indigo-600 to-blue-600",
      lastLogin: (/* @__PURE__ */ new Date()).toISOString(),
      phone: userData.phone || ""
    };
    if (!this.data.users) {
      this.data.users = [];
    }
    this.data.users.push(newUser);
    this.save();
    this.broadcast("user_created", { user: newUser });
    return newUser;
  }
  updateUser(id, updates) {
    const user = this.getUserById(id);
    if (!user) return null;
    if (updates.name !== void 0) user.name = updates.name.trim();
    if (updates.email !== void 0) user.email = updates.email.trim();
    if (updates.role !== void 0) user.role = updates.role;
    if (updates.pin !== void 0) user.pin = updates.pin.trim();
    if (updates.courses !== void 0) user.courses = updates.courses;
    if (updates.defaultSubject !== void 0) user.defaultSubject = updates.defaultSubject.trim();
    if (updates.avatarColor !== void 0) user.avatarColor = updates.avatarColor;
    if (updates.phone !== void 0) user.phone = updates.phone;
    this.save();
    this.broadcast("user_updated", { user });
    return user;
  }
  deleteUser(id) {
    if (!this.data.users) return false;
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u.id !== id);
    if (this.data.users.length < initialLen) {
      this.save();
      this.broadcast("user_deleted", { id });
      return true;
    }
    return false;
  }
  resetToDefaults() {
    this.data = {
      computers: INITIAL_COMPUTERS,
      deliveries: INITIAL_DELIVERIES,
      incidents: INITIAL_INCIDENTS,
      repairs: INITIAL_REPAIRS,
      maintenanceAlerts: INITIAL_ALERTS,
      notifications: INITIAL_NOTIFICATIONS,
      users: DEFAULT_USER_PROFILES,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.save();
    this.broadcast("data_reset", {});
  }
};
var dbStore = new DatabaseStore();
export {
  DatabaseStore,
  dbStore
};
