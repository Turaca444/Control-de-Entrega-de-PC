import React, { useState, useEffect } from 'react';
import {
  Laptop,
  GraduationCap,
  BookOpen,
  User,
  AlertTriangle,
  Clock,
  Check,
  X,
  FileDown,
  BatteryCharging,
  Zap,
  CheckCircle2,
  Trash2,
  Plus,
  RotateCcw,
  Mouse,
  Tag,
} from 'lucide-react';
import {
  Computer,
  SCHOOL_COURSES,
  PROFESSORS_LIST,
  STUDENTS_BY_COURSE,
  getStoredStudentsByCourse,
  saveStoredStudentsByCourse,
  UserProfile,
  LAB_MOUSE_CODES,
  DEFAULT_MOUSE_BRAND,
  COMMON_MOUSE_BRANDS,
  DEFAULT_COMPUTERS,
} from '../types';
import { ConfirmModal } from './ConfirmModal';

interface NewDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  computers: Computer[];
  currentUser?: UserProfile | null;
  onSubmit: (data: {
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
  }) => Promise<any>;
}

const CAREER_OPTIONS = [
  'Programación I',
  'Informática Aplicada I',
  'Programación II',
  'Informática Aplicada II',
  'Programación III',
  'Bases de Datos I',
  'Bases de Datos II',
  'Sistemas y Telecomunicaciones',
  'Sistemas de Información',
  'Lógica Matemática',
  'FAT',
];

const COMMON_SUBJECTS = [
  'Programación I',
  'Informática Aplicada I',
  'Programación II',
  'Informática Aplicada II',
  'Programación III',
  'Bases de Datos I',
  'Bases de Datos II',
  'Sistemas y Telecomunicaciones',
  'Sistemas de Información',
  'Lógica Matemática',
  'FAT',
  'Estructura de Datos y Algoritmos',
  'Programación Orientada a Objetos',
  'Desarrollo Web Full Stack',
  'Sistemas Operativos y Redes',
  'Arquitectura de Computadoras',
];

const QUICK_OBSERVATION_TAGS = [
  'Sin daños previos',
  'PC descargada (se entrega con cargador)',
  'Rayón leve en carcasa',
  'Teclado con tecla desgastada',
  'Monitor con leve marca de uso',
  'Puerto frontal USB 3.0 ajustado',
  'Cable HDMI verificado',
  'Ventilador con leve zumbido',
];

const QUICK_CHARGER_OBSERVATIONS = [
  'Cargador y ficha en perfecto estado',
  'Cable sano sin peladuras ni dobleces',
  'Transformador funcional verificado',
  'Ficha con leve desgaste estético',
];

export const NewDeliveryModal: React.FC<NewDeliveryModalProps> = ({
  isOpen,
  onClose,
  computers,
  currentUser,
  onSubmit,
}) => {
  const [loanMode, setLoanMode] = useState<'pc' | 'solo_cargador' | 'solo_mouse'>('pc');
  const [pcNumber, setPcNumber] = useState('');
  const [includesCharger, setIncludesCharger] = useState(false);
  const [chargerNumber, setChargerNumber] = useState('');
  const [includesMouse, setIncludesMouse] = useState(false);
  const [mouseNumber, setMouseNumber] = useState('');
  const [mouseBrand, setMouseBrand] = useState<string>(DEFAULT_MOUSE_BRAND);
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isManualStudentName, setIsManualStudentName] = useState(false);
  const [studentCareer, setStudentCareer] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [observations, setObservations] = useState('Sin daños previos detectados.');
  const [expectedReturnHours, setExpectedReturnHours] = useState('3');
  const [registeredBy, setRegisteredBy] = useState('Encargado de Laboratorio');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [studentsByCourseMap, setStudentsByCourseMap] = useState<Record<string, string[]>>(() =>
    getStoredStudentsByCourse()
  );
  const [newStudentInput, setNewStudentInput] = useState('');
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [confirmClearCourse, setConfirmClearCourse] = useState<string | null>(null);

  // Sync state if modal is opened or stored data changes
  useEffect(() => {
    if (isOpen) {
      setStudentsByCourseMap(getStoredStudentsByCourse());
      if (currentUser) {
        setTeacherName(currentUser.name);
        if (currentUser.defaultSubject && currentUser.defaultSubject !== 'Programación y Sistemas Informáticos') {
          setSubjectName(currentUser.defaultSubject);
        } else {
          setSubjectName('');
        }
        if (currentUser.courses && currentUser.courses.length > 0) {
          setStudentId(currentUser.courses[0]);
        }
        setRegisteredBy(currentUser.name);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const computersList = (computers && Array.isArray(computers) && computers.length > 0)
    ? computers
    : DEFAULT_COMPUTERS;

  const availableComputers = computersList.filter(
    (c) => c.status === 'disponible' || c.status === 'mantenimiento'
  );

  const selectedComp = computersList.find((c) => c.pcNumber === pcNumber);

  const courseStudents = studentId ? studentsByCourseMap[studentId] || [] : [];

  const handleCourseChange = (selectedCourse: string) => {
    setStudentId(selectedCourse);
    const students = studentsByCourseMap[selectedCourse] || [];
    if (students.length > 0) {
      setIsManualStudentName(false);
      if (!students.includes(studentName)) {
        setStudentName('');
      }
    }
  };

  const handleRemoveStudentFromCourse = (course: string, studentToRemove: string) => {
    setStudentsByCourseMap((prev) => {
      const updated = {
        ...prev,
        [course]: (prev[course] || []).filter((s) => s !== studentToRemove),
      };
      saveStoredStudentsByCourse(updated);
      return updated;
    });
    if (studentName === studentToRemove) {
      setStudentName('');
    }
  };

  const handleClearAllStudentsFromCourse = (course: string) => {
    setConfirmClearCourse(course);
  };

  const executeClearCourseStudents = () => {
    if (!confirmClearCourse) return;
    const course = confirmClearCourse;
    setStudentsByCourseMap((prev) => {
      const updated = {
        ...prev,
        [course]: [],
      };
      saveStoredStudentsByCourse(updated);
      return updated;
    });
    setStudentName('');
    setConfirmClearCourse(null);
  };

  const handleResetCourseStudents = (course: string) => {
    const original = STUDENTS_BY_COURSE[course] || [];
    setStudentsByCourseMap((prev) => {
      const updated = {
        ...prev,
        [course]: [...original],
      };
      saveStoredStudentsByCourse(updated);
      return updated;
    });
  };

  const handleAddStudentToCourse = (course: string) => {
    const name = newStudentInput.trim();
    if (!name) return;
    setStudentsByCourseMap((prev) => {
      const existing = prev[course] || [];
      if (existing.includes(name)) return prev;
      const updated = {
        ...prev,
        [course]: [...existing, name].sort(),
      };
      saveStoredStudentsByCourse(updated);
      return updated;
    });
    setStudentName(name);
    setNewStudentInput('');
    setShowAddStudentForm(false);
  };

  const handleSelectPC = (selected: string) => {
    setPcNumber(selected);
    // El cargador es 100% independiente del número de PC.
    // NO se sobreescribe ni se fuerza el cargador al cambiar o elegir la PC.
  };

  const handleSelectCharger = (val: string) => {
    setChargerNumber(val);
    if (val && val.trim()) {
      setIncludesCharger(true);
      if (
        observations === 'Sin daños previos detectados.' ||
        observations.startsWith('PC descargada.')
      ) {
        setObservations(`PC descargada. Se entrega con ${val.trim()}.`);
      }
    } else {
      setIncludesCharger(false);
      if (observations.startsWith('PC descargada.')) {
        setObservations('Sin daños previos detectados.');
      }
    }
  };

  const handleToggleCharger = (checked: boolean) => {
    setIncludesCharger(checked);
    if (checked) {
      // Si el usuario activa "Prestar Cargador" y aún no eligió cargador,
      // sugerir uno inicial pero permitiendo cambiar libremente a cualquier otro
      if (!chargerNumber) {
        const num = pcNumber ? pcNumber.replace(/\D/g, '') : '01';
        setChargerNumber(`Cargador ${num}`);
        if (
          observations === 'Sin daños previos detectados.' ||
          observations.startsWith('PC descargada.')
        ) {
          setObservations(`PC descargada. Se entrega con Cargador ${num}.`);
        }
      }
    } else {
      setChargerNumber('');
      if (observations.startsWith('PC descargada.')) {
        setObservations('Sin daños previos detectados.');
      }
    }
  };

  const handleSelectMouse = (val: string) => {
    setMouseNumber(val);
    if (val && val.trim()) {
      setIncludesMouse(true);
    } else {
      setIncludesMouse(false);
    }
  };

  const handleToggleMouse = (checked: boolean) => {
    setIncludesMouse(checked);
    if (checked) {
      if (!mouseNumber) {
        const num = pcNumber ? pcNumber.replace(/\D/g, '') : '01';
        setMouseNumber(`Mouse ${num || '01'}`);
      }
    } else {
      setMouseNumber('');
    }
  };

  const handleAddTag = (tag: string) => {
    if (observations.includes(tag)) return;
    if (observations === 'Sin daños previos detectados.' || !observations.trim()) {
      setObservations(tag);
    } else {
      setObservations(`${observations}. ${tag}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const isOnlyCharger = loanMode === 'solo_cargador';
    const isOnlyMouse = loanMode === 'solo_mouse';
    const isPeripheralsOnly = isOnlyCharger || isOnlyMouse;

    if (!isPeripheralsOnly && !pcNumber) {
      setErrorMsg('Seleccione un equipo de cómputo.');
      return;
    }

    if (isOnlyCharger && !chargerNumber.trim()) {
      setErrorMsg('Seleccione o ingrese el número de cargador a prestar al alumno.');
      return;
    }

    if (isOnlyMouse && !mouseNumber.trim()) {
      setErrorMsg('Seleccione o ingrese el número de mouse a prestar al alumno.');
      return;
    }

    const finalIncludesCharger = isOnlyCharger || Boolean(includesCharger || (chargerNumber && chargerNumber.trim() !== ''));
    const finalChargerNumber = isOnlyCharger
      ? chargerNumber.trim()
      : finalIncludesCharger
        ? (chargerNumber.trim() || `Cargador ${pcNumber.replace(/\D/g, '') || '01'}`)
        : undefined;

    const finalIncludesMouse = isOnlyMouse || Boolean(includesMouse || (mouseNumber && mouseNumber.trim() !== ''));
    const finalMouseNumber = isOnlyMouse
      ? mouseNumber.trim()
      : finalIncludesMouse
        ? (mouseNumber.trim() || `Mouse ${pcNumber.replace(/\D/g, '') || '01'}`)
        : undefined;

    if (finalIncludesCharger && !finalChargerNumber) {
      setErrorMsg('Indique o seleccione el número de cargador a prestar.');
      return;
    }

    if (finalIncludesMouse && !finalMouseNumber) {
      setErrorMsg('Indique o seleccione el número de mouse a prestar.');
      return;
    }

    if (!studentName.trim() || !studentId.trim()) {
      setErrorMsg('Ingrese los datos del alumno (Nombre y Matrícula o Curso).');
      return;
    }
    if (!teacherName.trim()) {
      setErrorMsg('Indique el nombre del docente / profesor.');
      return;
    }
    if (!subjectName.trim()) {
      setErrorMsg('Indique la materia o asignatura.');
      return;
    }

    try {
      setIsSubmitting(true);
      const expectedTime = new Date(Date.now() + Number(expectedReturnHours) * 60 * 60 * 1000).toISOString();

      let targetPC = pcNumber;
      if (isOnlyCharger) targetPC = 'SOLO-CARGADOR';
      if (isOnlyMouse) targetPC = 'SOLO-MOUSE';

      let defaultObs = 'Sin daños previos detectados.';
      if (isOnlyCharger) {
        defaultObs = 'Préstamo exclusivo de cargador (el alumno trajo su propia PC/Netbook).';
      } else if (isOnlyMouse) {
        defaultObs = 'Préstamo exclusivo de mouse óptico USB (el alumno trajo su propia PC/Netbook).';
      }

      await onSubmit({
        pcNumber: targetPC,
        studentName,
        studentId,
        studentCareer,
        teacherName,
        subjectName,
        observations: observations || defaultObs,
        expectedReturnTime: expectedTime,
        registeredBy,
        includesCharger: finalIncludesCharger,
        chargerNumber: finalChargerNumber,
        onlyCharger: isOnlyCharger,
        includesMouse: finalIncludesMouse,
        mouseNumber: finalMouseNumber,
        mouseBrand: finalIncludesMouse ? (mouseBrand.trim() || DEFAULT_MOUSE_BRAND) : undefined,
        onlyMouse: isOnlyMouse,
      });

      onClose();
      // Reset form
      setLoanMode('pc');
      setPcNumber('');
      setIncludesCharger(false);
      setChargerNumber('');
      setIncludesMouse(false);
      setMouseNumber('');
      setMouseBrand(DEFAULT_MOUSE_BRAND);
      setStudentName('');
      setStudentId('');
      setIsManualStudentName(false);
      setObservations('Sin daños previos detectados.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la entrega');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-750 shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nueva Asignación / Entrega de Equipo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seleccione la computadora disponible e indique el alumno asignado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 sm:pr-2 space-y-4 flex-1 mt-3">
          {/* Mode selector: Computadora vs Solo Cargador vs Solo Mouse */}
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setLoanMode('pc');
                if (pcNumber === 'SOLO-CARGADOR' || pcNumber === 'SOLO-MOUSE') setPcNumber('');
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                loanMode === 'pc'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 shrink-0" />
              <span>PC (+ Accesorios)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoanMode('solo_cargador');
                setPcNumber('SOLO-CARGADOR');
                setIncludesCharger(true);
                if (!chargerNumber) setChargerNumber('Cargador 01');
                if (observations.startsWith('Sin daños') || observations.startsWith('PC descargada')) {
                  setObservations('Préstamo exclusivo de cargador (el alumno trajo su propia PC/Netbook).');
                }
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                loanMode === 'solo_cargador'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span>⚡ Solo Cargador</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoanMode('solo_mouse');
                setPcNumber('SOLO-MOUSE');
                setIncludesMouse(true);
                if (!mouseNumber) setMouseNumber('Mouse 01');
                if (observations.startsWith('Sin daños') || observations.startsWith('PC descargada')) {
                  setObservations('Préstamo exclusivo de mouse óptico USB (el alumno trajo su propia PC/Netbook).');
                }
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                loanMode === 'solo_mouse'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mouse className="w-3.5 h-3.5 text-purple-200 shrink-0" />
              <span>🖱️ Solo Mouse</span>
            </button>
          </div>

          {/* If Solo Cargador mode is active */}
          {loanMode === 'solo_cargador' ? (
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500 text-white shadow-xs shrink-0 mt-0.5">
                    <BatteryCharging className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200">
                      1. Préstamo Exclusivo de Cargador (El Alumno Trajo su Propia PC)
                    </h4>
                    <p className="text-[11.5px] text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                      El estudiante ya cuenta con su netbook o computadora personal y únicamente solicita un cargador de la sala. <strong>No se descontará ni bloqueará ninguna computadora del laboratorio.</strong>
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 shrink-0">
                  ⚡ Solo Cargador
                </span>
              </div>

              {/* Charger selection controls */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2.5 border-t border-amber-200/90 dark:border-amber-900/60">
                <div className="sm:col-span-7">
                  <label htmlFor="select-solo-charger-number" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Seleccionar Cargador del Armario: *
                  </label>
                  <select
                    id="select-solo-charger-number"
                    value={chargerNumber}
                    onChange={(e) => handleSelectCharger(e.target.value)}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">-- Elige un cargador disponible --</option>
                    {Array.from({ length: 30 }, (_, i) => {
                      const num = String(i + 1).padStart(2, '0');
                      return (
                        <option key={num} value={`Cargador ${num}`}>
                          Cargador N° {num}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label htmlFor="input-solo-charger-custom" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    O escribir identificación:
                  </label>
                  <input
                    id="input-solo-charger-custom"
                    type="text"
                    value={chargerNumber}
                    onChange={(e) => handleSelectCharger(e.target.value)}
                    placeholder="Ej. Cargador 07, Lenovo..."
                    className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Quick Charger Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Selección rápida de cargadores:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Cargador 01', 'Cargador 02', 'Cargador 03', 'Cargador 04', 'Cargador 05', 'Cargador 06', 'Cargador 07', 'Cargador 08', 'Cargador 09', 'Cargador 10', 'Cargador 11', 'Cargador 12'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleSelectCharger(c)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all cursor-pointer ${
                        chargerNumber === c
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white dark:bg-slate-855 text-slate-700 dark:text-slate-300 border-amber-200 dark:border-amber-900/60 hover:border-amber-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {chargerNumber && (
                <div className="p-2.5 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Cargador seleccionado para préstamo: <u>{chargerNumber}</u></span>
                  </span>
                  <span className="text-[11px] text-amber-800 dark:text-amber-300">
                    PC de la sala: No aplica (PC propia)
                  </span>
                </div>
              )}
            </div>
          ) : loanMode === 'solo_mouse' ? (
            <div className="p-4 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/30 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-600 text-white shadow-xs shrink-0 mt-0.5">
                    <Mouse className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-purple-950 dark:text-purple-200">
                      1. Préstamo Exclusivo de Mouse USB (El Alumno Trajo su Propia PC)
                    </h4>
                    <p className="text-[11.5px] text-purple-900/80 dark:text-purple-300/80 mt-0.5">
                      El estudiante trajo su notebook personal y requiere un mouse para diseñar, programar o trabajar con comodidad. <strong>No se ocupará ninguna computadora del aula.</strong>
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200 shrink-0">
                  🖱️ Solo Mouse
                </span>
              </div>

              {/* Mouse selection controls */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2.5 border-t border-purple-200/90 dark:border-purple-900/60">
                <div className="sm:col-span-7">
                  <label htmlFor="select-solo-mouse-number" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Seleccionar Mouse del Armario (Código): *
                  </label>
                  <select
                    id="select-solo-mouse-number"
                    value={mouseNumber}
                    onChange={(e) => handleSelectMouse(e.target.value)}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">-- Elige un mouse disponible --</option>
                    {LAB_MOUSE_CODES.map((code) => (
                      <option key={code} value={code}>
                        Mouse {code}
                      </option>
                    ))}
                    {mouseNumber && !LAB_MOUSE_CODES.includes(mouseNumber as any) && (
                      <option value={mouseNumber}>{mouseNumber} (Personalizado)</option>
                    )}
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label htmlFor="input-solo-mouse-custom" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    O escribir código:
                  </label>
                  <input
                    id="input-solo-mouse-custom"
                    type="text"
                    value={mouseNumber}
                    onChange={(e) => handleSelectMouse(e.target.value.toUpperCase())}
                    placeholder="Ej. LF79, N249, N3Z9..."
                    className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Quick Mouse Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Selección rápida de código:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {LAB_MOUSE_CODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMouse(m)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-mono font-bold border transition-all cursor-pointer ${
                        mouseNumber === m
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white dark:bg-slate-855 text-slate-700 dark:text-slate-300 border-purple-200 dark:border-purple-900/60 hover:border-purple-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mouse Brand Controls in Solo Mouse mode */}
              <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-white/70 dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span>Marca / Modelo del Mouse:</span>
                  </label>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                    Predeterminado: M90 Logitech
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7">
                    <select
                      value={mouseBrand}
                      onChange={(e) => setMouseBrand(e.target.value)}
                      className="w-full text-xs sm:text-sm p-2 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium cursor-pointer"
                    >
                      {COMMON_MOUSE_BRANDS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                      {mouseBrand && !COMMON_MOUSE_BRANDS.includes(mouseBrand as any) && (
                        <option value={mouseBrand}>{mouseBrand} (Personalizado)</option>
                      )}
                    </select>
                  </div>
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={mouseBrand}
                      onChange={(e) => setMouseBrand(e.target.value)}
                      placeholder="Ej. Logitech M90"
                      className="w-full text-xs sm:text-sm p-2 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {['Logitech M90', 'M90 Logitech', 'Logitech B100', 'Genius DX-120'].map((brandOption) => (
                    <button
                      key={brandOption}
                      type="button"
                      onClick={() => setMouseBrand(brandOption)}
                      className={`text-[10.5px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        mouseBrand === brandOption
                          ? 'bg-purple-600 text-white border-purple-600 font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-purple-200 dark:border-purple-800 hover:border-purple-400'
                      }`}
                    >
                      {brandOption}
                    </button>
                  ))}
                </div>
              </div>

              {mouseNumber && (
                <div className="p-2.5 rounded-lg bg-purple-100/70 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-800 text-xs text-purple-950 dark:text-purple-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Mouse: <u>{mouseNumber}</u> ({mouseBrand || 'Logitech M90'})</span>
                  </span>
                  <span className="text-[11px] text-purple-800 dark:text-purple-300">
                    PC de la sala: No aplica (PC propia)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Section 1: PC Selection (Always visible and prioritized) */}
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    1. Seleccionar Computadora (Número de PC) *
                  </label>
                  {pcNumber ? (
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2.5 py-0.5 rounded-full border border-blue-300 dark:border-blue-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Equipo seleccionado: {pcNumber}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      (Haz clic en una PC para seleccionarla)
                    </span>
                  )}
                </div>

                {/* Small Color Key / Legend for PC Selection */}
                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] mb-2 px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-blue-200/80 dark:border-blue-900/40 text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Guía de Colores:</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">Libre (Disponible)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">En uso (Prestada)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-rose-600 dark:text-rose-400">Taller (Reparación)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 ring-2 ring-blue-300 dark:ring-blue-800" />
                    <span className="text-blue-700 dark:text-blue-300 font-bold">Azul (Seleccionada)</span>
                  </span>
                </div>

                {/* Available PCs direct selection bar */}
                <div className="mb-2.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{availableComputers.length} Computadoras Disponibles para entrega:</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                      (Clic para seleccionar al instante)
                    </span>
                  </div>
                  {availableComputers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {availableComputers.map((c) => (
                        <button
                          key={c.pcNumber}
                          type="button"
                          onClick={() => handleSelectPC(c.pcNumber)}
                          className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                            pcNumber === c.pcNumber
                              ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400'
                              : 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          }`}
                        >
                          {c.pcNumber}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      No hay computadoras libres en este momento (todas se encuentran prestadas o en mantenimiento).
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {computersList.map((c) => {
                    const isSelected = pcNumber === c.pcNumber;
                    const isBusy = c.status === 'en_uso';
                    const isBroken = c.status === 'en_reparacion' || c.status === 'de_baja';
                    return (
                      <button
                        key={c.pcNumber}
                        type="button"
                        disabled={isBusy || isBroken}
                        onClick={() => handleSelectPC(c.pcNumber)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-400 shadow-md scale-105 z-10'
                            : isBusy
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
                            : isBroken
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-400 border-rose-200 dark:border-rose-900 opacity-60 cursor-not-allowed'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="font-mono text-xs">{c.pcNumber}</span>
                        <span className={`text-[9px] font-medium ${
                          isSelected ? 'text-blue-100' : isBusy ? 'text-slate-400' : isBroken ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isSelected ? '✓ Elegida' : isBusy ? 'En uso' : isBroken ? 'Taller' : 'Libre'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedComp && (
                  <div className="mt-2.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-[11.5px] text-blue-900 dark:text-blue-200 flex items-center justify-between">
                    <span>
                      <strong>{selectedComp.pcNumber}:</strong> {selectedComp.model} ({selectedComp.processor} • {selectedComp.ram})
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Salud: {selectedComp.healthScore}%
                    </span>
                  </div>
                )}
              </div>

              {/* Section 1.5: PC Descargada y Préstamo de Cargador (Compacto) */}
              <div className="p-3 rounded-xl border border-amber-300/80 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
                      <BatteryCharging className="w-4 h-4" />
                    </div>
                    <div>
                      <label
                        htmlFor="chk-pc-discharged"
                        className="text-xs sm:text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Cargador de Alimentación (PC Descargada)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-semibold uppercase">
                          {includesCharger || chargerNumber ? 'Con Cargador' : 'Opcional'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="chk-pc-discharged"
                      checked={includesCharger}
                      onChange={(e) => handleToggleCharger(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 dark:border-slate-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <label
                      htmlFor="chk-pc-discharged"
                      className="text-xs font-semibold text-amber-900 dark:text-amber-300 cursor-pointer"
                    >
                      Prestar Cargador
                    </label>
                  </div>
                </div>

                {/* Expanded only if charger is needed */}
                {(includesCharger || chargerNumber) && (
                  <div className="mt-3 pt-2.5 border-t border-amber-200/80 dark:border-amber-900/40 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-7">
                        <label htmlFor="select-charger-number" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Seleccionar Cargador:
                        </label>
                        <select
                          id="select-charger-number"
                          value={chargerNumber}
                          onChange={(e) => handleSelectCharger(e.target.value)}
                          className="w-full text-xs sm:text-sm p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer font-medium"
                        >
                          <option value="">-- Seleccionar número de cargador --</option>
                          {chargerNumber &&
                            !Array.from({ length: 25 }, (_, i) => `Cargador ${String(i + 1).padStart(2, '0')}`).includes(chargerNumber) && (
                              <option value={chargerNumber}>
                                {chargerNumber} (Personalizado)
                              </option>
                            )}
                          {Array.from({ length: 25 }, (_, i) => {
                            const num = String(i + 1).padStart(2, '0');
                            const isMatchPC = pcNumber === `PC-${num}`;
                            return (
                              <option key={num} value={`Cargador ${num}`}>
                                Cargador N° {num} {isMatchPC ? '★ (Mismo número que la PC)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <label htmlFor="custom-charger-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          O ingresar número a mano:
                        </label>
                        <input
                          id="custom-charger-input"
                          type="text"
                          value={chargerNumber}
                          onChange={(e) => handleSelectCharger(e.target.value)}
                          placeholder="Ej. Cargador 05"
                          className="w-full text-xs sm:text-sm p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        {pcNumber && (
                          <button
                            type="button"
                            onClick={() => {
                              const num = pcNumber.replace(/\D/g, '') || '01';
                              handleSelectCharger(`Cargador ${num}`);
                            }}
                            className="text-[11px] font-medium px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 bg-amber-100/80 hover:bg-amber-200 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 cursor-pointer inline-flex items-center gap-1 transition-colors"
                          >
                            <Zap className="w-3 h-3 text-amber-600" />
                            <span>Usar Cargador {pcNumber.replace(/\D/g, '')} (Mismo N° que {pcNumber})</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1 bg-amber-200/60 dark:bg-amber-900/50 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>{chargerNumber || 'Cargador'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setChargerNumber('');
                            setIncludesCharger(false);
                            if (observations.startsWith('PC descargada.')) {
                              setObservations('Sin daños previos detectados.');
                            }
                          }}
                          className="text-[10.5px] font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          ✕ Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 1.6: Préstamo de Mouse Óptico USB */}
              <div className="p-3 rounded-xl border border-purple-300/80 dark:border-purple-800/80 bg-purple-50/70 dark:bg-purple-950/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-700 dark:text-purple-400">
                      <Mouse className="w-4 h-4" />
                    </div>
                    <div>
                      <label
                        htmlFor="chk-pc-mouse"
                        className="text-xs sm:text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Mouse Óptico USB (Periférico)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-200 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200 font-semibold uppercase">
                          {includesMouse || mouseNumber ? 'Con Mouse' : 'Opcional'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="chk-pc-mouse"
                      checked={includesMouse}
                      onChange={(e) => handleToggleMouse(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <label
                      htmlFor="chk-pc-mouse"
                      className="text-xs font-semibold text-purple-900 dark:text-purple-300 cursor-pointer"
                    >
                      Prestar Mouse
                    </label>
                  </div>
                </div>

                {/* Expanded only if mouse is needed */}
                {(includesMouse || mouseNumber) && (
                  <div className="mt-3 pt-2.5 border-t border-purple-200/80 dark:border-purple-900/40 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-7">
                        <label htmlFor="select-mouse-number" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Seleccionar Mouse (Código Oficial):
                        </label>
                        <select
                          id="select-mouse-number"
                          value={mouseNumber}
                          onChange={(e) => handleSelectMouse(e.target.value)}
                          className="w-full text-xs sm:text-sm p-2 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden cursor-pointer font-bold"
                        >
                          <option value="">-- Seleccionar código de mouse --</option>
                          {LAB_MOUSE_CODES.map((code) => (
                            <option key={code} value={code}>
                              Mouse {code}
                            </option>
                          ))}
                          {mouseNumber && !LAB_MOUSE_CODES.includes(mouseNumber as any) && (
                            <option value={mouseNumber}>{mouseNumber} (Personalizado)</option>
                          )}
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <label htmlFor="custom-mouse-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          O escribir código a mano:
                        </label>
                        <input
                          id="custom-mouse-input"
                          type="text"
                          value={mouseNumber}
                          onChange={(e) => handleSelectMouse(e.target.value.toUpperCase())}
                          placeholder="Ej. LF79, N249, N3Z9..."
                          className="w-full text-xs sm:text-sm p-2 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Quick chips for lab mouse codes */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Códigos de mouse del laboratorio:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {LAB_MOUSE_CODES.map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => handleSelectMouse(code)}
                            className={`px-2 py-0.5 text-xs rounded-lg font-mono font-bold border transition-all cursor-pointer ${
                              mouseNumber === code
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-purple-200 dark:border-purple-900/60 hover:border-purple-400'
                            }`}
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Brand / Model Selection for Mouse in PC Mode */}
                    <div className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-purple-600" />
                          <span>Marca / Modelo del Mouse:</span>
                        </label>
                        <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                          Predeterminado: M90 Logitech
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-7">
                          <select
                            value={mouseBrand}
                            onChange={(e) => setMouseBrand(e.target.value)}
                            className="w-full text-xs sm:text-sm p-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium cursor-pointer"
                          >
                            {COMMON_MOUSE_BRANDS.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                            {mouseBrand && !COMMON_MOUSE_BRANDS.includes(mouseBrand as any) && (
                              <option value={mouseBrand}>{mouseBrand} (Personalizado)</option>
                            )}
                          </select>
                        </div>
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            value={mouseBrand}
                            onChange={(e) => setMouseBrand(e.target.value)}
                            placeholder="Ej. Logitech M90"
                            className="w-full text-xs sm:text-sm p-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {['Logitech M90', 'M90 Logitech', 'Logitech B100', 'Genius DX-120'].map((brandOption) => (
                          <button
                            key={brandOption}
                            type="button"
                            onClick={() => setMouseBrand(brandOption)}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                              mouseBrand === brandOption
                                ? 'bg-purple-600 text-white border-purple-600 font-bold'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-purple-200 dark:border-purple-800 hover:border-purple-400'
                            }`}
                          >
                            {brandOption}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <div className="text-[11px] font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5 bg-purple-200/60 dark:bg-purple-900/50 px-2.5 py-1 rounded-lg border border-purple-300 dark:border-purple-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span>Mouse: {mouseNumber || 'Asignado'} ({mouseBrand || 'Logitech M90'})</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setMouseNumber('');
                          setIncludesMouse(false);
                        }}
                        className="text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        ✕ Quitar Mouse
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Section 2: Student Information (Without quantity badges or bulky student grid) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Datos del Alumno Asignado *
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Curso / División */}
              <div>
                <label htmlFor="select-student-course" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Curso / División *
                </label>
                <select
                  id="select-student-course"
                  value={studentId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                  required
                >
                  <option value="">-- Seleccione el curso --</option>
                  {currentUser?.courses && currentUser.courses.length > 0 && (
                    <optgroup label={`★ Mis Cursos Asignados (Prof. ${currentUser.name})`}>
                      {currentUser.courses.map((course) => (
                        <option key={`my-${course}`} value={course}>
                          ★ {course}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label={currentUser?.courses?.length ? 'Otros Cursos' : 'Todos los Cursos'}>
                    {SCHOOL_COURSES.filter(
                      (course) => !currentUser?.courses || !currentUser.courses.includes(course)
                    ).map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Nombre Completo del Alumno */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="select-student-name" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Nombre Completo del Alumno *
                  </label>
                  {courseStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualStudentName(!isManualStudentName);
                        if (!isManualStudentName) setStudentName('');
                      }}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                    >
                      {isManualStudentName ? '← Ver lista de alumnos' : '✎ Escribir a mano'}
                    </button>
                  )}
                </div>

                {courseStudents.length > 0 && !isManualStudentName ? (
                  <select
                    id="select-student-name"
                    value={studentName}
                    onChange={(e) => {
                      if (e.target.value === '__manual__') {
                        setIsManualStudentName(true);
                        setStudentName('');
                      } else {
                        setStudentName(e.target.value);
                      }
                    }}
                    className="w-full text-xs sm:text-sm p-2 rounded-lg border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer font-medium"
                    required
                  >
                    <option value="">-- Seleccionar estudiante de {studentId} --</option>
                    {courseStudents.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                    <option value="__manual__">✎ Escribir otro nombre manualmente...</option>
                  </select>
                ) : (
                  <>
                    <input
                      type="text"
                      list="course-students-datalist"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder={
                        courseStudents.length > 0
                          ? `Ej. ${courseStudents[0]}`
                          : studentId
                          ? `Nombre del alumno de ${studentId}`
                          : 'Ej. Carlos Mendoza Ruiz'
                      }
                      className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      required
                    />
                    {courseStudents.length > 0 && (
                      <datalist id="course-students-datalist">
                        {courseStudents.map((st) => (
                          <option key={st} value={st} />
                        ))}
                      </datalist>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quick helper to add student if missing */}
            {studentId && (
              <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => setShowAddStudentForm(!showAddStudentForm)}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddStudentForm ? 'Ocultar agregar alumno' : 'Agregar alumno no listado a este curso'}</span>
                </button>

                {STUDENTS_BY_COURSE[studentId] && (
                  <button
                    type="button"
                    onClick={() => handleResetCourseStudents(studentId)}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer inline-flex items-center gap-1"
                    title="Restablecer nómina original de alumnos"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restablecer lista</span>
                  </button>
                )}
              </div>
            )}

            {showAddStudentForm && studentId && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-blue-300 dark:border-blue-700 mt-2">
                <input
                  type="text"
                  value={newStudentInput}
                  onChange={(e) => setNewStudentInput(e.target.value)}
                  placeholder="Apellido y Nombre del nuevo alumno"
                  className="text-xs p-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex-1 focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddStudentToCourse(studentId);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddStudentToCourse(studentId)}
                  className="px-2.5 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 cursor-pointer"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStudentForm(false)}
                  className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="mt-2.5">
              <label htmlFor="select-student-career" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Carrera / Programa
              </label>
              <select
                id="select-student-career"
                value={studentCareer}
                onChange={(e) => setStudentCareer(e.target.value)}
                className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                <option value="">-- Seleccione la carrera o programa --</option>
                {CAREER_OPTIONS.map((career) => (
                  <option key={career} value={career}>
                    {career}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Academic Details (Docente & Materia) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              3. Asignación Académica (Profesor y Materia) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="select-teacher-name" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Nombre del Profesor / Docente *
                  </label>
                  {currentUser && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                      Sesión: {currentUser.name}
                    </span>
                  )}
                </div>
                <select
                  id="select-teacher-name"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                  required
                >
                  <option value="">-- Seleccione el profesor --</option>
                  {currentUser && !(PROFESSORS_LIST as readonly string[]).includes(currentUser.name) && (
                    <option value={currentUser.name}>
                      {currentUser.name} (Tú)
                    </option>
                  )}
                  {PROFESSORS_LIST.map((prof) => (
                    <option key={prof} value={prof}>
                      {prof} {currentUser && currentUser.name === prof ? '(Tú)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nombre de la Materia / Asignatura *
                </label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Ej. Estructura de Datos"
                  list="subjects-datalist"
                  className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
                <datalist id="subjects-datalist">
                  {COMMON_SUBJECTS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Section 4: Observaciones y Daños Previos */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {loanMode === 'solo_cargador' ? '4. Observaciones del Cargador' : '4. Observaciones (Fallas o Daño Previo del Equipo)'}
              </label>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                * Clave para reportes de entrega
              </span>
            </div>

            {/* Quick tag chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(loanMode === 'solo_cargador' ? QUICK_CHARGER_OBSERVATIONS : QUICK_OBSERVATION_TAGS).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="text-[10.5px] px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder={loanMode === 'solo_cargador' ? 'Describa el estado del cargador (cable, ficha, transformador)...' : 'Describa si el equipo presenta rayas, teclado con detalles, etc.'}
              className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Registrador: {registeredBy.split(' ')[0]} {registeredBy.split(' ')[1]}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Guardando...' : 'Asignar y Generar Registro'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* MODAL: Confirmar vaciar lista de alumnos del curso */}
      <ConfirmModal
        isOpen={!!confirmClearCourse}
        title="¿Vaciar lista de alumnos?"
        message={`¿Deseas vaciar la lista de alumnos de ${confirmClearCourse} al terminar la clase? Los datos del curso se restablecerán a vacío.`}
        confirmText="Sí, Vaciar Lista"
        cancelText="Cancelar"
        variant="warning"
        onCancel={() => setConfirmClearCourse(null)}
        onConfirm={executeClearCourseStudents}
      />
    </div>
  );
};
