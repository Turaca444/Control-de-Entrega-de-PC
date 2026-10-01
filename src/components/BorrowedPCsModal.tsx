import React, { useState } from 'react';
import {
  Printer,
  FileDown,
  X,
  Search,
  Laptop,
  GraduationCap,
  BookOpen,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Filter,
  BatteryCharging,
  Zap,
  Trash2,
  Mouse,
} from 'lucide-react';
import { DeliveryRecord, Computer, UserProfile } from '../types';
import {
  generateBorrowedPCsStudentsReportPDF,
  generateDeliveryReceiptPDF,
  formatDateTime,
} from '../utils/pdfGenerator';
import { ConfirmModal } from './ConfirmModal';

interface BorrowedPCsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveries: DeliveryRecord[];
  computers: Computer[];
  currentUser?: UserProfile | null;
  onOpenNewDelivery?: () => void;
  onReturnDelivery?: (delivery: DeliveryRecord) => void;
  onAssignCharger?: (delivery: DeliveryRecord) => void;
  onAssignMouse?: (delivery: DeliveryRecord) => void;
  onDeleteDelivery?: (deliveryId: string) => Promise<void> | void;
  onReturnCourse?: (courseName: string, teacherName?: string) => Promise<void> | void;
  onDeleteCourse?: (courseName: string, teacherName?: string) => Promise<void> | void;
}

export const BorrowedPCsModal: React.FC<BorrowedPCsModalProps> = ({
  isOpen,
  onClose,
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
}) => {
  const [filterMode, setFilterMode] = useState<'active' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [onlyMyDeliveries, setOnlyMyDeliveries] = useState<boolean>(currentUser?.role === 'profesor');

  // In-app confirmation states
  const [deleteConfirmDelivery, setDeleteConfirmDelivery] = useState<DeliveryRecord | null>(null);
  const [deleteCourseConfirm, setDeleteCourseConfirm] = useState<{ course: string; teacher?: string; count: number } | null>(null);
  const [returnCourseConfirm, setReturnCourseConfirm] = useState<{ course: string; teacher?: string; count: number } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  if (!isOpen) return null;

  // Filter deliveries according to active mode or all
  const baseDeliveries = filterMode === 'active'
    ? deliveries.filter((d) => d.status === 'activo')
    : deliveries;

  // Extract unique courses (prioritizing user courses if teacher)
  const coursesList = Array.from(new Set(deliveries.map((d) => d.studentId))).filter(Boolean);

  // Apply search query, teacher isolation, and course filter
  const displayedDeliveries = baseDeliveries.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const qNorm = q.replace(/º|°|ª|año|to|\s/gi, '');
    const studentIdNorm = d.studentId.toLowerCase().replace(/º|°|ª|año|to|\s/gi, '');

    const matchQuery =
      !q ||
      d.pcNumber.toLowerCase().includes(q) ||
      d.studentName.toLowerCase().includes(q) ||
      d.studentId.toLowerCase().includes(q) ||
      (qNorm.length > 0 && studentIdNorm.includes(qNorm)) ||
      (d.studentCareer && d.studentCareer.toLowerCase().includes(q)) ||
      d.teacherName.toLowerCase().includes(q) ||
      d.subjectName.toLowerCase().includes(q) ||
      d.observations.toLowerCase().includes(q);

    const matchCourse =
      !selectedCourse ||
      d.studentId === selectedCourse ||
      (selectedCourse && studentIdNorm === selectedCourse.toLowerCase().replace(/º|°|ª|año|to|\s/gi, ''));
    const matchTeacher =
      !onlyMyDeliveries ||
      !currentUser ||
      d.teacherName.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
      (currentUser.courses && currentUser.courses.includes(d.studentId));

    return matchQuery && matchCourse && matchTeacher;
  });

  const activeCount = deliveries.filter((d) => d.status === 'activo').length;
  const withChargerCount = displayedDeliveries.filter((d) => d.includesCharger).length;
  const withMouseCount = displayedDeliveries.filter((d) => d.includesMouse).length;
  const uniqueStudents = new Set(displayedDeliveries.map((d) => d.studentName)).size;
  const uniqueCourses = new Set(displayedDeliveries.map((d) => d.studentId)).size;
  const uniqueTeachers = new Set(displayedDeliveries.map((d) => d.teacherName)).size;

  const handlePrintPDF = () => {
    generateBorrowedPCsStudentsReportPDF(displayedDeliveries, {
      title: filterMode === 'active'
        ? 'SALA DE PROGRAMACIÓN - PLANILLA DE EQUIPOS EN PRÉSTAMO ACTIVO'
        : 'SALA DE PROGRAMACIÓN - REGISTRO GENERAL DE EQUIPOS Y ESTUDIANTES',
      subTitle: `CONTROL DE ESTUDIANTES CON NOTEBOOKS/PCS ASIGNADAS - ${displayedDeliveries.length} EQUIPOS REGISTRADOS`,
    });
  };

  return (
    <div
      id="borrowed-pcs-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="borrowed-pcs-modal"
        className="bg-white dark:bg-slate-850 rounded-2xl max-w-5xl w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Planilla y Reporte de PCs Prestadas a Estudiantes
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {activeCount} activas
                </span>
                {withChargerCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{withChargerCount} con cargador</span>
                  </span>
                )}
                {withMouseCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                    <Mouse className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span>{withMouseCount} con mouse</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro de todos los estudiantes con equipos asignados listo para imprimir en planilla oficial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              id="btn-print-borrowed-report"
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer"
              title="Generar e imprimir planilla PDF oficial"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Reporte PDF</span>
            </button>

            <button
              id="btn-close-borrowed-modal"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">PCs Registradas</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">{displayedDeliveries.length}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">Estudiantes</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">{uniqueStudents}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">Cursos Activos</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">{uniqueCourses}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">Docentes</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">{uniqueTeachers}</p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-borrowed-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por estudiante, PC, curso, profesor o falla..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {coursesList.length > 0 && (
              <select
                id="select-borrowed-course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                <option value="">Curso: Todos</option>
                {coursesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-900 p-0.5 rounded-lg shrink-0 flex-wrap">
            {currentUser && (
              <button
                type="button"
                id="tab-toggle-my-deliveries"
                onClick={() => setOnlyMyDeliveries(!onlyMyDeliveries)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  onlyMyDeliveries
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Aislar vista a mis cursos y entregas"
              >
                <span>{onlyMyDeliveries ? '✓ Mis Cursos/Entregas' : 'Ver Todos los Profes'}</span>
              </button>
            )}
            <button
              type="button"
              id="tab-mode-active"
              onClick={() => setFilterMode('active')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterMode === 'active'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Solo Activos ({activeCount})
            </button>
            <button
              type="button"
              id="tab-mode-all"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Histórico ({deliveries.length})
            </button>
          </div>
        </div>

        {/* Course Class Actions Banner */}
        {selectedCourse && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <span className="font-bold text-indigo-950 dark:text-indigo-200">
                  Gestión de Clase: {selectedCourse}
                  {onlyMyDeliveries && currentUser ? ` (Prof. ${currentUser.name})` : ''}
                </span>
                <span className="ml-1.5 text-indigo-700 dark:text-indigo-300 text-[11px]">
                  ({displayedDeliveries.filter((d) => d.status === 'activo').length} equipos activos en clase)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onReturnCourse && (
                <button
                  type="button"
                  onClick={() => {
                    const activeInCourse = displayedDeliveries.filter((d) => d.status === 'activo').length;
                    const teacherParam = onlyMyDeliveries && currentUser?.role === 'profesor' ? currentUser.name : undefined;
                    setReturnCourseConfirm({
                      course: selectedCourse,
                      teacher: teacherParam,
                      count: activeInCourse,
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Devolver Todos (Fin de clase)</span>
                </button>
              )}

              {onDeleteCourse && (
                <button
                  type="button"
                  onClick={() => {
                    const teacherParam = onlyMyDeliveries && currentUser?.role === 'profesor' ? currentUser.name : undefined;
                    setDeleteCourseConfirm({
                      course: selectedCourse,
                      teacher: teacherParam,
                      count: displayedDeliveries.length,
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Alumnos del Curso</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Deliveries Table (Scrollable) */}
        <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700/80 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-xs">
              <tr className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-2.5 px-3">Equipo / Cargador</th>
                <th className="py-2.5 px-3">Estudiante / Alumno</th>
                <th className="py-2.5 px-3">Curso</th>
                <th className="py-2.5 px-3">Profesor / Materia</th>
                <th className="py-2.5 px-3">Fecha y Hora</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Observaciones Previas</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Laptop className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {filterMode === 'active'
                          ? 'No hay computadoras en préstamo activo en este momento.'
                          : 'No se encontraron registros con los filtros seleccionados.'}
                      </p>
                      {filterMode === 'active' && onOpenNewDelivery && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenNewDelivery();
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                        >
                          Registrar Nueva Entrega
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayedDeliveries.map((delivery) => {
                  const comp = computers.find((c) => c.pcNumber === delivery.pcNumber);
                  return (
                    <tr
                      key={delivery.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {delivery.pcNumber}
                          </span>
                          {delivery.includesCharger ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700 inline-flex items-center gap-1 shadow-xs">
                                <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400 fill-amber-500" />
                                <span>{delivery.chargerNumber || 'Cargador'}</span>
                              </span>
                              {delivery.status === 'activo' && onAssignCharger && (
                                <button
                                  type="button"
                                  onClick={() => onAssignCharger(delivery)}
                                  className="text-[9px] text-amber-700 dark:text-amber-300 hover:underline"
                                  title="Editar cargador asignado"
                                >
                                  Editar
                                </button>
                              )}
                            </div>
                          ) : (
                            delivery.status === 'activo' && onAssignCharger ? (
                              <button
                                type="button"
                                onClick={() => onAssignCharger(delivery)}
                                className="text-[9.5px] font-semibold text-amber-700 hover:text-amber-900 dark:text-amber-300 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 border border-dashed border-amber-300 dark:border-amber-800 transition-colors cursor-pointer"
                                title="El alumno se quedó sin batería: Asignar cargador"
                              >
                                <Zap className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                                <span>+ Cargador</span>
                              </button>
                            ) : null
                          )}

                          {/* Mouse badge / action */}
                          {delivery.includesMouse ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-400 dark:border-purple-700 inline-flex items-center gap-1 shadow-xs">
                                <Mouse className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                <span>{delivery.mouseNumber || 'Mouse'}{delivery.mouseBrand ? ` • ${delivery.mouseBrand}` : ''}</span>
                              </span>
                              {delivery.status === 'activo' && onAssignMouse && (
                                <button
                                  type="button"
                                  onClick={() => onAssignMouse(delivery)}
                                  className="text-[9px] text-purple-700 dark:text-purple-300 hover:underline"
                                  title="Editar mouse asignado"
                                >
                                  Editar
                                </button>
                              )}
                            </div>
                          ) : (
                            delivery.status === 'activo' && onAssignMouse ? (
                              <button
                                type="button"
                                onClick={() => onAssignMouse(delivery)}
                                className="text-[9.5px] font-semibold text-purple-700 hover:text-purple-900 dark:text-purple-300 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 border border-dashed border-purple-300 dark:border-purple-800 transition-colors cursor-pointer"
                                title="Prestar mouse óptico USB"
                              >
                                <Mouse className="w-2.5 h-2.5 text-purple-600" />
                                <span>+ Mouse</span>
                              </button>
                            ) : null
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                        <div>{delivery.studentName}</div>
                        {delivery.studentCareer && (
                          <div className="text-[10px] text-slate-400 font-normal">{delivery.studentCareer}</div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                        {delivery.studentId || 'S/D'}
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        <div className="font-medium">{delivery.teacherName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{delivery.subjectName}</div>
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formatDateTime(delivery.deliveryDate)}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {delivery.status === 'activo' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            En Préstamo
                          </span>
                        ) : delivery.status === 'devuelto_bien' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            Devuelto OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                            C/ Novedad
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px] max-w-xs truncate">
                        {delivery.observations || 'Sin daños'}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => generateDeliveryReceiptPDF(delivery, comp)}
                            title="Descargar acta individual de este alumno"
                            className="p-1 rounded-md text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {delivery.status === 'activo' && onAssignCharger && (
                            <button
                              type="button"
                              onClick={() => onAssignCharger(delivery)}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                              title={
                                delivery.includesCharger
                                  ? `Modificar cargador asignado (${delivery.chargerNumber})`
                                  : 'Asignar cargador por batería baja'
                              }
                            >
                              <Zap className="w-3 h-3 fill-current" />
                              <span>{delivery.includesCharger ? 'Cargador' : '+ Cargador'}</span>
                            </button>
                          )}
                          {delivery.status === 'activo' && onAssignMouse && (
                            <button
                              type="button"
                              onClick={() => onAssignMouse(delivery)}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                              title={
                                delivery.includesMouse
                                  ? `Modificar mouse asignado (${delivery.mouseNumber})`
                                  : 'Prestar mouse óptico USB'
                              }
                            >
                              <Mouse className="w-3 h-3 fill-current" />
                              <span>{delivery.includesMouse ? 'Mouse' : '+ Mouse'}</span>
                            </button>
                          )}
                          {delivery.status === 'activo' && onReturnDelivery && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onReturnDelivery(delivery);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                            >
                              Devolver
                            </button>
                          )}
                          {onDeleteDelivery && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmDelivery(delivery)}
                              title="Eliminar este alumno de la planilla (Fin de clase)"
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700 shrink-0 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Mostrando <strong>{displayedDeliveries.length}</strong> computadoras prestadas / registradas.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="button"
              id="btn-print-footer-report"
              onClick={handlePrintPDF}
              disabled={displayedDeliveries.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Reporte Completo de Estudiantes</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Confirmar eliminación individual de alumno de la planilla */}
      <ConfirmModal
        isOpen={!!deleteConfirmDelivery}
        title="¿Eliminar alumno de la planilla?"
        message={`¿Deseas eliminar de la planilla el préstamo a ${deleteConfirmDelivery?.studentName} (${deleteConfirmDelivery?.pcNumber})? El equipo se liberará de inmediato.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isProcessingAction}
        onCancel={() => setDeleteConfirmDelivery(null)}
        onConfirm={async () => {
          if (!deleteConfirmDelivery || !onDeleteDelivery) return;
          try {
            setIsProcessingAction(true);
            await onDeleteDelivery(deleteConfirmDelivery.id);
            setDeleteConfirmDelivery(null);
          } catch (err: any) {
            console.error('Error al eliminar:', err);
          } finally {
            setIsProcessingAction(false);
          }
        }}
      />

      {/* MODAL: Confirmar eliminación de todos los alumnos del curso */}
      <ConfirmModal
        isOpen={!!deleteCourseConfirm}
        title="¿Eliminar alumnos del curso?"
        message={
          deleteCourseConfirm?.teacher
            ? `¿Deseas eliminar de la planilla los alumnos de tu clase en ${deleteCourseConfirm.course} (Prof. ${deleteCourseConfirm.teacher})? Los equipos se liberarán de inmediato.`
            : `¿Deseas eliminar todos los alumnos y registros del curso ${deleteCourseConfirm?.course} de la planilla? Los equipos se liberarán inmediatamente.`
        }
        confirmText="Sí, Eliminar Alumnos"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isProcessingAction}
        onCancel={() => setDeleteCourseConfirm(null)}
        onConfirm={async () => {
          if (!deleteCourseConfirm || !onDeleteCourse) return;
          try {
            setIsProcessingAction(true);
            await onDeleteCourse(deleteCourseConfirm.course, deleteCourseConfirm.teacher);
            setDeleteCourseConfirm(null);
          } catch (err: any) {
            console.error('Error al eliminar curso:', err);
          } finally {
            setIsProcessingAction(false);
          }
        }}
      />

      {/* MODAL: Confirmar devolución de todos los equipos del curso */}
      <ConfirmModal
        isOpen={!!returnCourseConfirm}
        title="¿Devolver todos los equipos?"
        message={
          returnCourseConfirm?.teacher
            ? `¿Confirmas la devolución de todos los ${returnCourseConfirm.count} equipos activos del curso ${returnCourseConfirm.course} (Prof. ${returnCourseConfirm.teacher}) al terminar la clase?`
            : `¿Confirmas la devolución de todos los ${returnCourseConfirm?.count} equipos activos del curso ${returnCourseConfirm?.course} al finalizar la clase?`
        }
        confirmText="Sí, Devolver Todos"
        cancelText="Cancelar"
        variant="warning"
        isLoading={isProcessingAction}
        onCancel={() => setReturnCourseConfirm(null)}
        onConfirm={async () => {
          if (!returnCourseConfirm || !onReturnCourse) return;
          try {
            setIsProcessingAction(true);
            await onReturnCourse(returnCourseConfirm.course, returnCourseConfirm.teacher);
            setReturnCourseConfirm(null);
          } catch (err: any) {
            console.error('Error al devolver curso:', err);
          } finally {
            setIsProcessingAction(false);
          }
        }}
      />
    </div>
  );
};
