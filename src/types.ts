export type EquipmentStatus = 'disponible' | 'en_uso' | 'mantenimiento' | 'en_reparacion' | 'de_baja';

export type DeliveryStatus = 'activo' | 'devuelto_bien' | 'devuelto_con_novedad';

export type IncidentSeverity = 'baja' | 'media' | 'alta' | 'critica';

export type IncidentType = 'hardware' | 'software' | 'periferico' | 'dano_fisico' | 'red_conectividad' | 'otro';

export type AlertPriority = 'baja' | 'media' | 'alta' | 'urgente';

export interface Computer {
  id: string; // e.g. "PC-01"
  pcNumber: string; // "PC-01"
  brand?: string; // e.g. "Dell"
  model: string; // e.g. "Dell OptiPlex 7090"
  serialNumber?: string; // e.g. "SN-DEL-98421"
  processor: string; // e.g. "Intel Core i7-11700"
  ram: string; // "16GB DDR4"
  storage: string; // "512GB NVMe SSD"
  os: string; // "Ubuntu 22.04 LTS / Windows 11"
  status: EquipmentStatus;
  locationRow: string; // "Fila A - Puesto 03"
  lastMaintenanceDate: string; // ISO date
  totalLoansCount: number;
  totalUsageHours: number;
  healthScore: number; // 0 - 100
  notes?: string;
}

export interface DeliveryRecord {
  id: string;
  pcNumber: string;
  computerId: string;
  studentName: string;
  studentId: string; // Curso / División del alumno (ej. 4º Año I, 5º Año K, etc.)
  studentCareer?: string;
  teacherName: string;
  subjectName: string;
  deliveryDate: string; // ISO String (Date and time of checkout)
  expectedReturnTime?: string;
  returnDate?: string | null; // ISO String (Date and time of return)
  status: DeliveryStatus;
  observations: string; // "Fallas o daño previo registrado"
  returnObservations?: string;
  reportedDamageOnReturn?: boolean;
  includesCharger?: boolean; // Si la PC está descargada y se presta con cargador
  chargerNumber?: string; // Número o código del cargador prestado (ej. "Cargador 05")
  chargerReturned?: boolean; // Confirmación de devolución del cargador
  chargerAssignedLater?: boolean; // Si se le asignó un cargador en uso posterior por batería baja
  chargerAssignedAt?: string; // Fecha y hora de asignación posterior del cargador
  onlyCharger?: boolean; // True si el alumno tiene su propia PC y solo se le prestó cargador
  includesMouse?: boolean; // Si el préstamo incluye mouse óptico USB
  mouseNumber?: string; // Número o código del mouse prestado (ej. "LF79", "N249", etc.)
  mouseBrand?: string; // Marca / modelo del mouse (ej. "Logitech M90", "M90 Logitech")
  mouseReturned?: boolean; // Confirmación de devolución del mouse
  mouseAssignedLater?: boolean; // Si se le asignó un mouse posteriormente en clase
  mouseAssignedAt?: string; // Fecha y hora de asignación posterior del mouse
  onlyMouse?: boolean; // True si el alumno tiene su propia PC y solo se le prestó mouse
  registeredBy: string; // Admin / Operador de sala
}

// Códigos identificatorios oficiales de los mouses del laboratorio
export const LAB_MOUSE_CODES = [
  'LF79',
  'N249',
  'N3Z9',
  'N219',
  'LFE9',
  'LFA9',
  'LFF9',
  'LF89',
  'N3T9',
  'N239',
  'N3T9N239',
] as const;

export const DEFAULT_MOUSE_BRAND = 'Logitech M90';

export const COMMON_MOUSE_BRANDS = [
  'Logitech M90',
  'M90 Logitech',
  'Logitech B100',
  'Genius DX-120',
  'Genius DX-110',
  'HP 1000',
  'Dell MS116',
  'Genérico USB',
] as const;

export const SCHOOL_COURSES = [
  '4º Año I',
  '4º Año K',
  '5º Año K',
  '5º Año L',
  '6º Año E',
  '6º Año J',
] as const;

export const STUDENTS_BY_COURSE: Record<string, string[]> = {
  '4º Año I': [
    'Agudelo Juan Martin',
    'Aguirre Samuel',
    'Allende Aguero Benjamin',
    'Alvarez Gael',
    'Franco Jazmin',
    'Franco Jeremias',
    'Gomez Valentino',
    'Lazo Fernandez Martina',
    'Lesta Juan Cruz',
    'López Lautaro',
    'Moriconi Octavio',
    'Palacios Uriel',
    'Puchi Ludmila',
    'Reyna Thiago Benjamin',
    'Robles Luciano',
    'Romero Benjamin',
    'Sanchez Ortega',
    'Soria Ingrid',
    'Sosa Lapenta Mateo',
    'Torres Martiniano',
  ],
  '5º Año L': [
    'Acuña Bianca Agostina',
    'Cano Benjamin',
    'Chiquilito Lara Jazmin',
    'Chiquilito Valentina Tiziana',
    'Ferrero Lola',
    'Herrera Francisco',
    'León Antonella',
    'Moreno Sofia',
    'Romero Maximo',
    'Sanchez Sebastián',
    'Tschinki Jairo',
    'Valdez Franco',
  ],
  '6º Año J': [
    'Audisio Pablo',
    'Blanco Santiago',
    'Bustos Brisa Belen',
    'Ceballos Enzo',
    'Choque Facundo',
    'Córdoba Matias',
    'Cruces Julian',
    'Cuello Agustina',
    'Farias Vacchiano Francesco',
    'Gigena Marcos',
    'Gimenez Matias',
    'Heredia Ariadna Steffi',
    'Jordan Lara',
    'Maldonado Benjamin',
    'Navarro Isaias',
    'Paez Mendoza',
    'Passetti Santiago',
    'Raviche Sofia',
    'Rojas Ludmila',
    'Sanchez Lautaro',
    'Tardino Domingo',
    'Torres Facundo',
  ],
};

const STORAGE_KEY_STUDENTS = 'lab_students_by_course_v5';

export function getStoredStudentsByCourse(): Record<string, string[]> {
  try {
    let saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!saved) {
      // Migrate from v4, v3, v2 or v1 if present
      const v4 = localStorage.getItem('lab_students_by_course_v4');
      const v3 = localStorage.getItem('lab_students_by_course_v3');
      const v2 = localStorage.getItem('lab_students_by_course_v2');
      const v1 = localStorage.getItem('lab_students_by_course_v1');
      const prevRaw = v4 || v3 || v2 || v1;
      if (prevRaw) {
        try {
          const parsedPrev = JSON.parse(prevRaw);
          const merged: Record<string, string[]> = {
            ...STUDENTS_BY_COURSE,
            ...parsedPrev,
          };
          for (const courseKey of ['4º Año I', '5º Año L', '6º Año J']) {
            if (!merged[courseKey] || merged[courseKey].length === 0) {
              merged[courseKey] = [...STUDENTS_BY_COURSE[courseKey]];
            } else {
              for (const std of STUDENTS_BY_COURSE[courseKey] || []) {
                if (!merged[courseKey].includes(std)) {
                  merged[courseKey].push(std);
                }
              }
              merged[courseKey].sort((a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
            }
          }
          saved = JSON.stringify(merged);
          localStorage.setItem(STORAGE_KEY_STUDENTS, saved);
        } catch {
          // fallback to defaults
        }
      }
    }
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure default course rosters are present and populated with official students
      for (const courseKey of ['4º Año I', '5º Año L', '6º Año J']) {
        if (!parsed[courseKey] || parsed[courseKey].length === 0) {
          parsed[courseKey] = [...STUDENTS_BY_COURSE[courseKey]];
        } else {
          for (const std of STUDENTS_BY_COURSE[courseKey] || []) {
            if (!parsed[courseKey].includes(std)) {
              parsed[courseKey].push(std);
            }
          }
          parsed[courseKey].sort((a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
        }
      }
      // Ensure typo is corrected if present in cached data
      if (parsed['5º Año L']) {
        parsed['5º Año L'] = parsed['5º Año L'].map((name: string) =>
          name === 'Chiquilito Lara Lazmin' ? 'Chiquilito Lara Jazmin' : name
        );
      }
      return { ...STUDENTS_BY_COURSE, ...parsed };
    }
  } catch (e) {
    console.error('Error loading stored students', e);
  }
  return { ...STUDENTS_BY_COURSE };
}

export function saveStoredStudentsByCourse(data: Record<string, string[]>) {
  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving stored students', e);
  }
}

export const PROFESSORS_LIST = [
  'Jorge Medina',
  'Moises Tinte',
  'Mirian Gomez',
  'German Gomez',
  'Maximiliano Romero',
  'Bringas Santiago',
  'Laura Rojano',
  'Gastón Frossasco',
] as const;

export type UserRole = 'profesor' | 'administrador';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  pin: string;
  courses: string[];
  defaultSubject: string;
  avatarColor: string;
  lastLogin?: string;
  phone?: string;
}

export const DEFAULT_USER_PROFILES: UserProfile[] = [
  {
    id: 'admin-lab',
    name: 'Encargado de Laboratorio (Admin)',
    email: 'admin.laboratorio@escuela.edu.ar',
    role: 'administrador',
    pin: '1234',
    courses: ['4º Año I', '4º Año K', '5º Año K', '5º Año L', '6º Año E', '6º Año J'],
    defaultSubject: 'Coordinación Sala de Informática',
    avatarColor: 'from-purple-600 to-indigo-700',
  },
  {
    id: 'prof-jorge-medina',
    name: 'Jorge Medina',
    email: 'jorge.medina@escuela.edu.ar',
    role: 'profesor',
    pin: '1234',
    courses: ['5º Año L', '5º Año K'],
    defaultSubject: '',
    avatarColor: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'prof-laura-rojano',
    name: 'Laura Rojano',
    email: 'laura.rojano@escuela.edu.ar',
    role: 'profesor',
    pin: '1234',
    courses: ['4º Año I', '4º Año K'],
    defaultSubject: 'Algoritmos y Estructuras de Datos',
    avatarColor: 'from-pink-600 to-rose-600',
  },
  {
    id: 'prof-gaston-frossasco',
    name: 'Gastón Frossasco',
    email: 'gaston.frossasco@escuela.edu.ar',
    role: 'profesor',
    pin: '1234',
    courses: ['6º Año E', '6º Año J'],
    defaultSubject: 'Desarrollo Web & Bases de Datos',
    avatarColor: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'prof-maximiliano-romero',
    name: 'Maximiliano Romero',
    email: 'maximiliano.romero@escuela.edu.ar',
    role: 'profesor',
    pin: '1234',
    courses: ['5º Año L', '6º Año E'],
    defaultSubject: 'Laboratorio de Programación Avanzada',
    avatarColor: 'from-amber-600 to-orange-600',
  },
  {
    id: 'prof-mirian-gomez',
    name: 'Mirian Gomez',
    email: 'mirian.gomez@escuela.edu.ar',
    role: 'profesor',
    pin: '1234',
    courses: ['4º Año K', '5º Año K'],
    defaultSubject: 'Tecnologías de la Información y Comunicación',
    avatarColor: 'from-violet-600 to-purple-600',
  },
  {
    id: 'prof-moises-tinte',
    name: 'Moises Tinte',
    email: 'moises.tinte@escuela.edu.ar',
    role: 'profesor',
    pin: '1234',
    courses: ['6º Año J', '4º Año I'],
    defaultSubject: 'Redes y Telecomunicaciones',
    avatarColor: 'from-sky-600 to-blue-700',
  },
  {
    id: 'prof-german-gomez',
    name: 'German Gomez',
    email: 'german.gomez@escuela.edu.ar',
    role: 'profesor',
    pin: '1234',
    courses: ['5º Año K', '6º Año E'],
    defaultSubject: 'Programación Orientada a Objetos',
    avatarColor: 'from-lime-600 to-emerald-700',
  },
  {
    id: 'prof-bringas-santiago',
    name: 'Bringas Santiago',
    email: 'bringas.santiago@escuela.edu.ar',
    role: 'profesor',
    pin: '1234',
    courses: ['4º Año I', '5º Año L'],
    defaultSubject: 'Arquitectura de Computadoras y Hardware',
    avatarColor: 'from-red-600 to-amber-700',
  },
];

export interface IncidentRecord {
  id: string;
  pcNumber: string;
  deliveryId?: string;
  date: string;
  reportedBy: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  observations: string;
  resolved: boolean;
}

export interface RepairRecord {
  id: string;
  pcNumber: string;
  startDate: string;
  endDate?: string;
  technicianName: string;
  faultDiagnosis: string;
  workDone: string;
  replacedParts: string[];
  costEstimate?: number;
  finalStatus: 'en_progreso' | 'reparado' | 'requiere_baja';
  observations: string;
}

export interface MaintenanceAlert {
  id: string;
  pcNumber: string;
  ruleType: 'usage_threshold' | 'days_since_service' | 'repeated_incidents' | 'critical_hardware';
  priority: AlertPriority;
  title: string;
  message: string;
  createdAt: string;
  status: 'activa' | 'atendida' | 'descartada';
  suggestedAction: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'damage' | 'maintenance' | 'delay' | 'repair';
  priority: 'normal' | 'alta' | 'urgente';
  timestamp: string;
  pcNumber?: string;
  read: boolean;
}

export interface SystemStats {
  totalComputers: number;
  availableComputers: number;
  inUseComputers: number;
  inMaintenanceComputers: number;
  inRepairComputers: number;
  activeDeliveriesCount: number;
  pendingAlertsCount: number;
  totalLoansToday: number;
  availablePcNumbers?: string[];
  inUsePcNumbers?: string[];
}

export const DEFAULT_COMPUTERS: Computer[] = Array.from({ length: 25 }, (_, i) => {
  const num = i + 1;
  const pad = num < 10 ? `0${num}` : `${num}`;
  const pcNumber = `PC-${pad}`;
  const rowLetters = ['A', 'B', 'C', 'D', 'E'];
  const rowIndex = Math.floor(i / 5);
  const seatIndex = (i % 5) + 1;
  const rowLetter = rowLetters[rowIndex] || 'E';
  const locationRow = `Fila ${rowLetter} - Puesto 0${seatIndex}`;

  let model = 'Dell OptiPlex 7090 Tower';
  let processor = 'Intel Core i7-11700 (8C/16T, 2.50 GHz)';
  let ram = '16 GB DDR4 3200MHz';
  let storage = '512 GB NVMe M.2 SSD';
  const os = 'Dual Boot: Ubuntu 24.04 LTS / Windows 11 Pro';

  if (rowLetter === 'B') {
    model = 'Lenovo ThinkCentre M70s Gen 3';
    processor = 'Intel Core i5-12500 (6C/12T, 3.00 GHz)';
    ram = '16 GB DDR4 3200MHz';
    storage = '512 GB PCIe M.2 SSD';
  } else if (rowLetter === 'C') {
    model = 'HP ProDesk 600 G6 Microtower';
    processor = 'AMD Ryzen 7 PRO 4750G (8C/16T, 3.60 GHz)';
    ram = '32 GB DDR4 3200MHz';
    storage = '1 TB NVMe SSD';
  } else if (rowLetter === 'D') {
    model = 'Dell OptiPlex 7090 Tower';
    processor = 'Intel Core i7-11700 (8C/16T, 2.50 GHz)';
    ram = '16 GB DDR4 3200MHz';
    storage = '512 GB NVMe M.2 SSD';
  } else if (rowLetter === 'E') {
    model = 'HP ProDesk 600 G6 Microtower';
    processor = 'Intel Core i7-10700 (8C/16T, 2.90 GHz)';
    ram = '16 GB DDR4 3200MHz';
    storage = '512 GB NVMe SSD';
  }

  return {
    id: pcNumber,
    pcNumber,
    model,
    processor,
    ram,
    storage,
    os,
    status: 'disponible',
    locationRow,
    lastMaintenanceDate: '2026-03-01T08:00:00.000Z',
    totalLoansCount: 0,
    totalUsageHours: 12 + i,
    healthScore: 100,
    notes: 'Configurado con IDEs de programación (VS Code, Python, GCC, Node.js)',
  };
});
