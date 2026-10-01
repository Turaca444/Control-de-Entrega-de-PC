import React, { useState } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileDown,
  RotateCcw,
  Clock,
  User,
  GraduationCap,
  BookOpen,
  Laptop,
  Calendar,
  Filter,
  Eye,
  AlertTriangle,
  FileText,
  Printer,
  BatteryCharging,
  Zap,
  Trash2,
  LogOut,
  Mouse,
} from 'lucide-react';
import { DeliveryRecord, Computer, PROFESSORS_LIST, SCHOOL_COURSES, UserProfile } from '../types';
import {
  generateDeliveryReceiptPDF,
  generateBorrowedPCsStudentsReportPDF,
  formatDateTime,
} from '../utils/pdfGenerator';
import { BorrowedPCsModal } from './BorrowedPCsModal';
import { ConfirmModal } from './ConfirmModal';
import { AssignChargerModal } from './AssignChargerModal';
import { AssignMouseModal } from './AssignMouseModal';

interface DeliveriesViewProps {
  deliveries: DeliveryRecord[];
  computers: Computer[];
  currentUser?: UserProfile | null;
  onOpenNewDelivery: () => void;
  onReturnDelivery: (
    deliveryId: string,
    data: {
      returnObservations?: string;
      reportedDamageOnReturn?: boolean;
      incidentDescription?: string;
      incidentSeverity?: string;
      incidentType?: string;
      chargerReturned?: boolean;
      mouseReturned?: boolean;
    }
  ) => Promise<void>;
  onAssignCharger?: (
    deliveryId: string,
    chargerData: { chargerNumber: string; reason?: string }
  ) => Promise<void>;
  onAssignMouse?: (
    deliveryId: string,
    mouseData: { mouseNumber: string; reason?: string }
  ) => Promise<void>;
  onDeleteDelivery?: (deliveryId: string) => Promise<void> | void;
  onReturnCourse?: (courseName: string, teacherName?: string) => Promise<void> | void;
  onDeleteCourse?: (courseName: string, teacherName?: string) => Promise<void> | void;
  onRefresh: () => void;
  onLogout?: () => void;
  onOpenLoginModal?: () => void;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = ({
  deliveries,
  computers,
  currentUser,
  onOpenNewDelivery,
  onReturnDelivery,
  onAssignCharger,
  onAssignMouse,
  onDeleteDelivery,
  onReturnCourse,
  onDeleteCourse,
  onRefresh,
  onLogout,
  onOpenLoginModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'devuelto_bien' | 'devuelto_con_novedad'>('all');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [onlyMyCourses, setOnlyMyCourses] = useState<boolean>(currentUser?.role === 'profesor');
  
  // Return modal state
  const [selectedReturnDelivery, setSelectedReturnDelivery] = useState<DeliveryRecord | null>(null);
  const [returnObs, setReturnObs] = useState('');
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [damageSeverity, setDamageSeverity] = useState('media');
  const [damageType, setDamageType] = useState('hardware');
  const [chargerReturned, setChargerReturned] = useState(true);
  const [mouseReturned, setMouseReturned] = useState(true);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Detail preview modal
  const [viewingDetail, setViewingDetail] = useState<DeliveryRecord | null>(null);

  // Borrowed PCs report modal
  const [showBorrowedModal, setShowBorrowedModal] = useState(false);

  // Assign charger modal state (when student runs out of battery during class)
  const [assignChargerDelivery, setAssignChargerDelivery] = useState<DeliveryRecord | null>(null);

  // Assign mouse modal state (when student requests mouse during class)
  const [assignMouseDelivery, setAssignMouseDelivery] = useState<DeliveryRecord | null>(null);

  // In-app deletion confirmation state
  const [deleteConfirmDelivery, setDeleteConfirmDelivery] = useState<DeliveryRecord | null>(null);
  const [isDeletingDelivery, setIsDeletingDelivery] = useState(false);

  // Distinct teachers list (presets + existing records)
  const teachersList = Array.from(
    new Set([...PROFESSORS_LIST, ...deliveries.map((d) => d.teacherName)])
  ).filter(Boolean);

  // Distinct courses list
  const coursesList = Array.from(
    new Set([...SCHOOL_COURSES, ...deliveries.map((d) => d.studentId)])
  ).filter(Boolean);

  // Filter deliveries
  const filteredDeliveries = deliveries.filter((d) => {
    const q = searchTerm.toLowerCase().trim();
    const qNorm = q.replace(/º|°|ª|año|to|\s/gi, '');
    const studentIdNorm = d.studentId.toLowerCase().replace(/º|°|ª|año|to|\s/gi, '');

    const matchesSearch =
      !q ||
      d.pcNumber.toLowerCase().includes(q) ||
      d.studentName.toLowerCase().includes(q) ||
      d.studentId.toLowerCase().includes(q) ||
      (qNorm.length > 0 && studentIdNorm.includes(qNorm)) ||
      (d.studentCareer && d.studentCareer.toLowerCase().includes(q)) ||
      d.teacherName.toLowerCase().includes(q) ||
      d.subjectName.toLowerCase().includes(q) ||
      d.observations.toLowerCase().includes(q);

    const matchesCourse =
      !courseFilter ||
      d.studentId === courseFilter ||
      (courseFilter && studentIdNorm === courseFilter.toLowerCase().replace(/º|°|ª|año|to|\s/gi, ''));

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesTeacher = !teacherFilter || d.teacherName === teacherFilter;

    // Independent teacher workstation isolation
    const matchesMyWorkstation =
      !onlyMyCourses ||
      !currentUser ||
      d.teacherName.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
      (currentUser.courses &&
        currentUser.courses.some((c) =>
          d.studentId.trim().toLowerCase().includes(c.trim().toLowerCase())
        ));

    return matchesSearch && matchesCourse && matchesStatus && matchesTeacher && matchesMyWorkstation;
  });

  const activeDeliveriesCount = deliveries.filter((d) => d.status === 'activo').length;
  const myActiveDeliveriesCount = currentUser
    ? deliveries.filter(
        (d) =>
          d.status === 'activo' &&
          (d.teacherName.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
            (currentUser.courses &&
              currentUser.courses.some((c) =>
                d.studentId.trim().toLowerCase().includes(c.trim().toLowerCase())
              )))
      ).length
    : activeDeliveriesCount;

  const handleOpenReturnModal = (delivery: DeliveryRecord) => {
    setSelectedReturnDelivery(delivery);
    setReturnObs('Devolución de equipo sin contratiempos.');
    setHasDamage(false);
    setDamageDescription('');
    setDamageSeverity('media');
    setDamageType('hardware');
    setChargerReturned(true);
    setMouseReturned(true);
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturnDelivery) return;

    try {
      setIsSubmittingReturn(true);
      let finalObs = returnObs;
      if (selectedReturnDelivery.includesCharger) {
        if (chargerReturned) {
          finalObs += ` [Cargador (${selectedReturnDelivery.chargerNumber || 'asignado'}): DEVUELTO OK]`;
        } else {
          finalObs += ` [ALERTA: El estudiante NO devolvió el ${selectedReturnDelivery.chargerNumber || 'cargador'}]`;
        }
      }

      if (selectedReturnDelivery.includesMouse) {
        if (mouseReturned) {
          finalObs += ` [Mouse (${selectedReturnDelivery.mouseNumber || 'asignado'}): DEVUELTO OK]`;
        } else {
          finalObs += ` [ALERTA: El estudiante NO devolvió el ${selectedReturnDelivery.mouseNumber || 'mouse'}]`;
        }
      }

      await onReturnDelivery(selectedReturnDelivery.id, {
        returnObservations: finalObs,
        reportedDamageOnReturn: hasDamage,
        incidentDescription: hasDamage ? damageDescription : undefined,
        incidentSeverity: hasDamage ? damageSeverity : undefined,
        incidentType: hasDamage ? damageType : undefined,
        chargerReturned: selectedReturnDelivery.includesCharger ? chargerReturned : undefined,
        mouseReturned: selectedReturnDelivery.includesMouse ? mouseReturned : undefined,
      });
      setSelectedReturnDelivery(null);
    } catch (err: any) {
      alert(err.message || 'Error al procesar devolución');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Action Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Control de Asignaciones y Devolución de PC
            </h2>
            <button
              onClick={() => setShowBorrowedModal(true)}
              title="Abrir registro de todas las PCs prestadas para imprimir reporte"
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <Laptop className="w-3 h-3" />
              <span>{activeDeliveriesCount} en uso activo</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registro con materia, profesor, alumno y columna de observaciones para fallas o daños previos.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            id="btn-report-borrowed-pcs"
            onClick={() => setShowBorrowedModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer"
            title="Registrar y ver todas las PC prestadas para imprimir el reporte de estudiantes"
          >
            <Printer className="w-4 h-4" />
            <span>Planilla de PCs Prestadas ({activeDeliveriesCount})</span>
          </button>

          <button
            id="btn-new-delivery-modal"
            onClick={onOpenNewDelivery}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Entrega de PC</span>
          </button>
        </div>
      </div>

      {/* Teacher Independence & Workstation Banner */}
      {currentUser && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/90 dark:to-indigo-950/40 rounded-xl p-3.5 border border-blue-200 dark:border-blue-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                currentUser.avatarColor || 'from-blue-600 to-indigo-600'
              } flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0`}
            >
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Espacio Docente: {currentUser.name}
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {currentUser.role === 'administrador' ? 'Supervisión Total' : 'Sesión Independiente'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Tus cursos asignados:</span>
                {currentUser.courses && currentUser.courses.length > 0 ? (
                  currentUser.courses.map((c) => (
                    <span
                      key={c}
                      className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400">Todos los cursos de la escuela</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              id="btn-toggle-my-courses-view"
              onClick={() => setOnlyMyCourses(!onlyMyCourses)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                onlyMyCourses
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-blue-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {onlyMyCourses
                  ? `Solo mis cursos (${myActiveDeliveriesCount} activas)`
                  : `Toda la sala (${activeDeliveriesCount} activas)`}
              </span>
            </button>

            {myActiveDeliveriesCount > 0 && onReturnCourse && (
              <button
                type="button"
                id="btn-quick-end-my-class"
                onClick={() => setShowBorrowedModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                title="Finalizar mi clase y devolver únicamente mis equipos"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Finalizar Mi Clase ({myActiveDeliveriesCount})</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                id="btn-banner-logout"
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-300 dark:border-rose-900/70 bg-white hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:border-rose-400 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                title={`Cerrar sesión de ${currentUser.name}`}
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Guest/Unauthenticated Notice */}
      {!currentUser && (
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Sesión Docente no iniciada
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inicia sesión con tu perfil y clave PIN para gestionar las entregas de tus cursos de manera independiente.
              </p>
            </div>
          </div>
          {onOpenLoginModal && (
            <button
              type="button"
              id="btn-banner-login"
              onClick={onOpenLoginModal}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 self-end sm:self-auto shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span>Iniciar Sesión Docente</span>
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-deliveries"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por 4 i, alumno, docente, PC..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Course filter */}
          <div className="sm:col-span-3">
            <select
              id="select-course-filter"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
            >
              <option value="">Curso: Todos los Cursos</option>
              {coursesList.map((c) => (
                <option key={c} value={c}>
                  {c === '4º Año I' ? '4º Año I (4 i)' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher filter */}
          <div className="sm:col-span-3">
            <select
              id="select-teacher-filter"
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">Docente: Todos</option>
              {teachersList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter tabs */}
          <div className="sm:col-span-2">
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">Estado: Todos</option>
              <option value="activo">Solo Activos</option>
              <option value="devuelto_bien">Devueltos OK</option>
              <option value="devuelto_con_novedad">Con Novedad</option>
            </select>
          </div>
        </div>

        {/* Quick Course Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-blue-500" />
            <span>Filtro rápido por curso:</span>
          </span>
          <button
            type="button"
            onClick={() => setCourseFilter('')}
            className={`px-2.5 py-0.5 text-xs rounded-full font-semibold border transition-all cursor-pointer ${
              courseFilter === ''
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({deliveries.length})
          </button>
          {coursesList.map((c) => {
            const count = deliveries.filter((d) => d.studentId === c).length;
            const isSelected = courseFilter === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCourseFilter(isSelected ? '' : c)}
                className={`px-2.5 py-0.5 text-xs rounded-full font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : c.includes('4') && c.toLowerCase().includes('i')
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100'
                    : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200'
                }`}
              >
                {c === '4º Año I' ? '4º Año I (4 i)' : c} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>

        {/* Filter summary badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span>Mostrando <strong>{filteredDeliveries.length}</strong> de {deliveries.length} registros</span>
            {activeDeliveriesCount > 0 && (
              <span className="hidden sm:inline text-slate-400">• ({activeDeliveriesCount} préstamos activos)</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-quick-print-students-report"
              onClick={() => {
                const target = activeDeliveriesCount > 0
                  ? deliveries.filter((d) => d.status === 'activo')
                  : deliveries;
                generateBorrowedPCsStudentsReportPDF(target, {
                  title: activeDeliveriesCount > 0
                    ? 'SALA DE PROGRAMACIÓN - PLANILLA DE EQUIPOS EN PRÉSTAMO ACTIVO'
                    : 'SALA DE PROGRAMACIÓN - REGISTRO GENERAL DE EQUIPOS Y ESTUDIANTES',
                  subTitle: `CONTROL DE ESTUDIANTES CON NOTEBOOKS/PCS ASIGNADAS (${target.length} EQUIPOS)`,
                });
              }}
              className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
              title="Descargar directamente la planilla PDF de los estudiantes con PCs prestadas"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir reporte de estudiantes</span>
            </button>

            {(searchTerm || teacherFilter || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTeacherFilter('');
                  setStatusFilter('all');
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-3.5">PC</th>
                <th className="py-3 px-3.5">Alumno / Curso</th>
                <th className="py-3 px-3.5">Docente / Profesor</th>
                <th className="py-3 px-3.5">Materia</th>
                <th className="py-3 px-3.5">Horarios (Entrega / Retorno)</th>
                <th className="py-3 px-3.5 min-w-[200px]">
                  Observaciones (Fallas / Daños Previos)
                </th>
                <th className="py-3 px-3.5">Estado</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/80 text-slate-700 dark:text-slate-200">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Laptop className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-slate-600 dark:text-slate-300">
                        {deliveries.length === 0
                          ? 'No hay registros de préstamos de PC aún.'
                          : 'No se encontraron entregas con los filtros aplicados.'}
                      </p>
                      {deliveries.length === 0 && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                          Use el botón "+ Nueva Entrega de PC" para registrar la entrega de un equipo a un estudiante con su respectivo docente y materia.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => {
                  const comp = computers.find((c) => c.pcNumber === delivery.pcNumber);
                  const isDamagePresent =
                    delivery.reportedDamageOnReturn ||
                    (delivery.observations &&
                      !delivery.observations.toLowerCase().includes('sin daño') &&
                      !delivery.observations.toLowerCase().includes('sin fallo'));

                  return (
                    <tr
                      key={delivery.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors"
                    >
                      {/* PC Number */}
                      <td className="py-3 px-3.5 font-mono">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600">
                            {delivery.pcNumber}
                          </span>
                          {delivery.includesCharger ? (
                            <div className="flex items-center gap-1">
                              <span
                                className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 inline-flex items-center gap-1 whitespace-nowrap shadow-xs"
                                title={`PC con ${delivery.chargerNumber || 'cargador'}${delivery.chargerAssignedLater ? ' (Asignado en clase por batería baja)' : ''}`}
                              >
                                <Zap className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 fill-amber-500" />
                                <span>{delivery.chargerNumber || 'Cargador'}</span>
                              </span>
                              {delivery.status === 'activo' && onAssignCharger && (
                                <button
                                  type="button"
                                  onClick={() => setAssignChargerDelivery(delivery)}
                                  className="text-[10px] font-sans text-amber-700 hover:text-amber-900 dark:text-amber-300 hover:underline p-0.5 cursor-pointer"
                                  title="Modificar o reasignar cargador"
                                >
                                  Editar
                                </button>
                              )}
                            </div>
                          ) : (
                            delivery.status === 'activo' && onAssignCharger && (
                              <button
                                type="button"
                                onClick={() => setAssignChargerDelivery(delivery)}
                                className="text-[10.5px] font-sans font-medium px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-dashed border-amber-300 dark:border-amber-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="El estudiante se quedó sin carga en su PC: asignarle un cargador"
                              >
                                <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                                <span>+ Cargador</span>
                              </button>
                            )
                          )}

                          {/* Mouse Status / Badge */}
                          {delivery.includesMouse ? (
                            <div className="flex items-center gap-1">
                              <span
                                className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800 inline-flex items-center gap-1 whitespace-nowrap shadow-xs"
                                title={`PC con Mouse ${delivery.mouseNumber || ''}${delivery.mouseBrand ? ` (${delivery.mouseBrand})` : ''}${delivery.mouseAssignedLater ? ' - Asignado en clase' : ''}`}
                              >
                                <Mouse className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                                <span>{delivery.mouseNumber || 'Mouse'}{delivery.mouseBrand ? ` • ${delivery.mouseBrand}` : ''}</span>
                              </span>
                              {delivery.status === 'activo' && onAssignMouse && (
                                <button
                                  type="button"
                                  onClick={() => setAssignMouseDelivery(delivery)}
                                  className="text-[10px] font-sans text-purple-700 hover:text-purple-900 dark:text-purple-300 hover:underline p-0.5 cursor-pointer"
                                  title="Modificar o reasignar mouse"
                                >
                                  Editar
                                </button>
                              )}
                            </div>
                          ) : (
                            delivery.status === 'activo' && onAssignMouse && (
                              <button
                                type="button"
                                onClick={() => setAssignMouseDelivery(delivery)}
                                className="text-[10.5px] font-sans font-medium px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-dashed border-purple-300 dark:border-purple-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Prestar mouse óptico USB al estudiante"
                              >
                                <Mouse className="w-3 h-3 text-purple-600" />
                                <span>+ Mouse</span>
                              </button>
                            )
                          )}
                        </div>
                      </td>

                      {/* Student */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {delivery.studentName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/80 px-1.5 py-0.5 rounded text-[10.5px]">
                            {delivery.studentId}
                          </span>
                          {delivery.studentCareer && (
                            <span className="truncate max-w-[120px]">• {delivery.studentCareer}</span>
                          )}
                        </div>
                      </td>

                      {/* Teacher */}
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{delivery.teacherName}</span>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{delivery.subjectName}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3.5 text-[11px] whitespace-nowrap">
                        <div className="text-slate-800 dark:text-slate-200">
                          <span className="font-medium">Entrega:</span> {formatDateTime(delivery.deliveryDate)}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          <span className="font-medium">Retorno:</span>{' '}
                          {delivery.returnDate ? (
                            formatDateTime(delivery.returnDate)
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">En progreso</span>
                          )}
                        </div>
                      </td>

                      {/* Explicit Observaciones Column */}
                      <td className="py-3 px-3.5">
                        <div
                          className={`p-2 rounded-lg text-xs leading-relaxed border ${
                            isDamagePresent
                              ? 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-900/50'
                              : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="font-semibold text-[11px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            {isDamagePresent ? (
                              <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                            ) : null}
                            <span>Entrega:</span>
                          </div>
                          <p className="line-clamp-2">{delivery.observations || 'Sin daños previos.'}</p>

                          {delivery.returnObservations && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                              <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                Retorno:
                              </span>
                              <p className="line-clamp-2">{delivery.returnObservations}</p>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {delivery.status === 'activo' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>En Uso</span>
                          </span>
                        )}
                        {delivery.status === 'devuelto_bien' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Devuelto OK</span>
                          </span>
                        )}
                        {delivery.status === 'devuelto_con_novedad' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <AlertCircle className="w-3 h-3" />
                            <span>Con Novedad</span>
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Assign Charger if active */}
                          {delivery.status === 'activo' && onAssignCharger && (
                            <button
                              type="button"
                              onClick={() => setAssignChargerDelivery(delivery)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shadow-xs ${
                                delivery.includesCharger
                                  ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  : 'bg-amber-500 hover:bg-amber-600 text-white'
                              }`}
                              title={
                                delivery.includesCharger
                                  ? `Modificar cargador asignado (${delivery.chargerNumber})`
                                  : 'Asignar cargador si el estudiante se quedó sin carga en su PC'
                              }
                            >
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span className="hidden sm:inline">
                                {delivery.includesCharger ? 'Cargador' : '+ Cargador'}
                              </span>
                            </button>
                          )}

                          {/* Assign Mouse if active */}
                          {delivery.status === 'activo' && onAssignMouse && (
                            <button
                              type="button"
                              onClick={() => setAssignMouseDelivery(delivery)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shadow-xs ${
                                delivery.includesMouse
                                  ? 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                              title={
                                delivery.includesMouse
                                  ? `Modificar mouse asignado (${delivery.mouseNumber})`
                                  : 'Prestar mouse óptico USB para la clase'
                              }
                            >
                              <Mouse className="w-3.5 h-3.5 fill-current" />
                              <span className="hidden sm:inline">
                                {delivery.includesMouse ? 'Mouse' : '+ Mouse'}
                              </span>
                            </button>
                          )}

                          {/* Return Action if active */}
                          {delivery.status === 'activo' && (
                            <button
                              onClick={() => handleOpenReturnModal(delivery)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
                              title="Registrar Devolución de PC"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Devolver</span>
                            </button>
                          )}

                          {/* PDF Receipt Download */}
                          <button
                            onClick={() => generateDeliveryReceiptPDF(delivery, comp)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                            title="Descargar Acta / Comprobante en PDF"
                          >
                            <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="hidden sm:inline">Acta PDF</span>
                          </button>

                          {/* Quick details */}
                          <button
                            onClick={() => setViewingDetail(delivery)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="Ver detalle completo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete individual delivery (End of class / cleanup) */}
                          {onDeleteDelivery && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmDelivery(delivery)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                              title="Eliminar de la planilla (Fin de clase)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Registrar Devolución */}
      {selectedReturnDelivery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Registrar Devolución de Equipo ({selectedReturnDelivery.pcNumber})
                </h3>
              </div>
              <button
                onClick={() => setSelectedReturnDelivery(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div>
                <span className="font-semibold text-slate-500 dark:text-slate-400">Alumno:</span>{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedReturnDelivery.studentName} ({selectedReturnDelivery.studentId})
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 dark:text-slate-400">Docente / Materia:</span>{' '}
                <span className="text-slate-800 dark:text-slate-200">
                  {selectedReturnDelivery.teacherName} — {selectedReturnDelivery.subjectName}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 dark:text-slate-400">Daño previo al entregar:</span>{' '}
                <span className="text-amber-600 dark:text-amber-400">
                  {selectedReturnDelivery.observations || 'Sin daños previos registrados'}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-4">
              {/* Charger Return Control if PC was delivered with charger */}
              {selectedReturnDelivery.includesCharger && (
                <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <BatteryCharging className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Control de Cargador Prestado
                        </p>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Esta PC se prestó descargada con: <strong className="text-amber-700 dark:text-amber-300">{selectedReturnDelivery.chargerNumber || 'Cargador de alimentación'}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-2 border-t border-amber-200 dark:border-amber-900/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chargerReturned}
                      onChange={(e) => setChargerReturned(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {chargerReturned
                        ? `✓ Cargador (${selectedReturnDelivery.chargerNumber || 'de alimentación'}) devuelto en mano`
                        : `✕ Cargador NO devuelto / Pendiente por el estudiante`}
                    </span>
                  </label>
                </div>
              )}

              {/* Mouse Return Control if PC was delivered with mouse */}
              {selectedReturnDelivery.includesMouse && (
                <div className="p-3.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Mouse className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Control de Mouse Óptico Prestado
                        </p>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Este equipo se entregó con periférico: <strong className="text-purple-700 dark:text-purple-300">{selectedReturnDelivery.mouseNumber || 'Mouse óptico USB'}{selectedReturnDelivery.mouseBrand ? ` (${selectedReturnDelivery.mouseBrand})` : ''}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-2 border-t border-purple-200 dark:border-purple-900/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mouseReturned}
                      onChange={(e) => setMouseReturned(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {mouseReturned
                        ? `✓ Mouse (${selectedReturnDelivery.mouseNumber || 'óptico USB'}${selectedReturnDelivery.mouseBrand ? ` - ${selectedReturnDelivery.mouseBrand}` : ''}) devuelto en mano`
                        : `✕ Mouse NO devuelto / Pendiente por el estudiante`}
                    </span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones de Devolución
                </label>
                <textarea
                  rows={2}
                  value={returnObs}
                  onChange={(e) => setReturnObs(e.target.value)}
                  placeholder="Describa el estado físico, periféricos, entrega de cables, etc."
                  className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Toggle: ¿Detectó nueva falla o daño al recibir? */}
              <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDamage}
                    onChange={(e) => setHasDamage(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Reportar falla, daño o anomalía técnica detectada al devolver
                  </span>
                </label>

                {hasDamage && (
                  <div className="space-y-3 pt-2 border-t border-rose-200 dark:border-rose-900/50">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Tipo de Incidencia
                        </label>
                        <select
                          value={damageType}
                          onChange={(e) => setDamageType(e.target.value)}
                          className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          <option value="hardware">Hardware / Componente</option>
                          <option value="periferico">Periférico (Teclado/Mouse)</option>
                          <option value="dano_fisico">Daño Físico / Chasis</option>
                          <option value="software">Software / Sistema</option>
                          <option value="red_conectividad">Red / Conectividad</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Severidad
                        </label>
                        <select
                          value={damageSeverity}
                          onChange={(e) => setDamageSeverity(e.target.value)}
                          className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          <option value="baja">Baja (Leve detalle)</option>
                          <option value="media">Media (Requiere revisión)</option>
                          <option value="alta">Alta (Equipo inutilizable)</option>
                          <option value="critica">Crítica (Riesgo eléctrico/físico)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Descripción detallada de la novedad:
                      </label>
                      <input
                        type="text"
                        value={damageDescription}
                        onChange={(e) => setDamageDescription(e.target.value)}
                        placeholder="Ej. Tecla rota, pantalla parpadea, equipo no reinicia..."
                        className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        required={hasDamage}
                      />
                    </div>
                    <p className="text-[10.5px] text-rose-700 dark:text-rose-300">
                      * Esta acción enviará una notificación push inmediata al administrador y cambiará el estado de la PC a mantenimiento.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReturnDelivery(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReturn ? 'Registrando...' : 'Confirmar Devolución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Preview Modal */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span>Asignación {viewingDetail.id}</span>
              </h3>
              <button
                onClick={() => setViewingDetail(null)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <p><strong>Equipo:</strong> {viewingDetail.pcNumber}</p>
              <p><strong>Alumno:</strong> {viewingDetail.studentName}</p>
              <p><strong>Curso:</strong> {viewingDetail.studentId}</p>
              {viewingDetail.studentCareer && (
                <p><strong>Carrera / Programa:</strong> {viewingDetail.studentCareer}</p>
              )}
              <p><strong>Docente:</strong> {viewingDetail.teacherName}</p>
              <p><strong>Materia:</strong> {viewingDetail.subjectName}</p>
              <p><strong>Fecha Entrega:</strong> {formatDateTime(viewingDetail.deliveryDate)}</p>
              <p><strong>Fecha Retorno:</strong> {formatDateTime(viewingDetail.returnDate)}</p>
              <p><strong>Estado:</strong> {viewingDetail.status}</p>

              {viewingDetail.includesCharger && (
                <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <BatteryCharging className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span><strong>Cargador Prestado:</strong> {viewingDetail.chargerNumber || 'Cargador de equipo'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    viewingDetail.chargerReturned
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : viewingDetail.returnDate
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  }`}>
                    {viewingDetail.chargerReturned
                      ? 'Devuelto ✓'
                      : viewingDetail.returnDate
                      ? 'No Devuelto ✕'
                      : 'En Préstamo'}
                  </span>
                </div>
              )}

              {viewingDetail.includesMouse && (
                <div className="p-2.5 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Mouse className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span><strong>Mouse USB Prestado:</strong> {viewingDetail.mouseNumber || 'Mouse de equipo'}{viewingDetail.mouseBrand ? ` (${viewingDetail.mouseBrand})` : ''}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    viewingDetail.mouseReturned
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : viewingDetail.returnDate
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                  }`}>
                    {viewingDetail.mouseReturned
                      ? 'Devuelto ✓'
                      : viewingDetail.returnDate
                      ? 'No Devuelto ✕'
                      : 'En Préstamo'}
                  </span>
                </div>
              )}

              <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="font-semibold mb-1">Observaciones al Entregar:</p>
                <p>{viewingDetail.observations || 'Sin daños previos.'}</p>
              </div>
              {viewingDetail.returnObservations && (
                <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="font-semibold mb-1">Observaciones de Devolución:</p>
                  <p>{viewingDetail.returnObservations}</p>
                </div>
              )}

              {viewingDetail.status === 'activo' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {onAssignCharger && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = viewingDetail;
                        setViewingDetail(null);
                        setAssignChargerDelivery(target);
                      }}
                      className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>
                        {viewingDetail.includesCharger
                          ? `Modificar Cargador (${viewingDetail.chargerNumber})`
                          : '⚡ Asignar Cargador'}
                      </span>
                    </button>
                  )}

                  {onAssignMouse && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = viewingDetail;
                        setViewingDetail(null);
                        setAssignMouseDelivery(target);
                      }}
                      className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Mouse className="w-4 h-4 fill-current" />
                      <span>
                        {viewingDetail.includesMouse
                          ? `Modificar Mouse (${viewingDetail.mouseNumber})`
                          : '🖱️ Asignar Mouse'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  const comp = computers.find((c) => c.pcNumber === viewingDetail.pcNumber);
                  generateDeliveryReceiptPDF(viewingDetail, comp);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Descargar PDF</span>
              </button>

              <button
                onClick={() => setViewingDetail(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Planilla y Reporte de PCs Prestadas a Estudiantes */}
      <BorrowedPCsModal
        isOpen={showBorrowedModal}
        onClose={() => setShowBorrowedModal(false)}
        deliveries={deliveries}
        computers={computers}
        currentUser={currentUser}
        onOpenNewDelivery={onOpenNewDelivery}
        onReturnDelivery={(d) => handleOpenReturnModal(d)}
        onAssignCharger={(d) => setAssignChargerDelivery(d)}
        onAssignMouse={(d) => setAssignMouseDelivery(d)}
        onDeleteDelivery={onDeleteDelivery}
        onReturnCourse={onReturnCourse}
        onDeleteCourse={onDeleteCourse}
      />

      {/* MODAL: Asignar cargador cuando el estudiante se queda sin carga en su PC */}
      <AssignChargerModal
        isOpen={!!assignChargerDelivery}
        onClose={() => setAssignChargerDelivery(null)}
        delivery={assignChargerDelivery}
        deliveries={deliveries}
        currentUser={currentUser}
        onConfirm={async (id, data) => {
          if (onAssignCharger) {
            await onAssignCharger(id, data);
          }
        }}
      />

      {/* MODAL: Asignar mouse óptico USB para la clase */}
      <AssignMouseModal
        isOpen={!!assignMouseDelivery}
        onClose={() => setAssignMouseDelivery(null)}
        delivery={assignMouseDelivery}
        deliveries={deliveries}
        currentUser={currentUser}
        onConfirm={async (id, data) => {
          if (onAssignMouse) {
            await onAssignMouse(id, data);
          }
        }}
      />

      {/* MODAL: Confirmar eliminación de registro de la planilla */}
      <ConfirmModal
        isOpen={!!deleteConfirmDelivery}
        title="¿Eliminar de la planilla?"
        message={`¿Deseas eliminar de la planilla el préstamo a ${deleteConfirmDelivery?.studentName} (${deleteConfirmDelivery?.pcNumber})? El equipo quedará libre de inmediato.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingDelivery}
        onCancel={() => setDeleteConfirmDelivery(null)}
        onConfirm={async () => {
          if (!deleteConfirmDelivery || !onDeleteDelivery) return;
          try {
            setIsDeletingDelivery(true);
            await onDeleteDelivery(deleteConfirmDelivery.id);
            setDeleteConfirmDelivery(null);
          } catch (err: any) {
            console.error('Error al eliminar registro:', err);
          } finally {
            setIsDeletingDelivery(false);
          }
        }}
      />
    </div>
  );
};
