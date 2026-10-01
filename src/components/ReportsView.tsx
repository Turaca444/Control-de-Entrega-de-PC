import React, { useState } from 'react';
import {
  FileText,
  FileDown,
  Calendar,
  GraduationCap,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Laptop,
  Zap,
  Mouse,
} from 'lucide-react';
import { DeliveryRecord, PROFESSORS_LIST, SCHOOL_COURSES } from '../types';
import { generateDeliveriesReportPDF, formatDateTime, formatDateOnly } from '../utils/pdfGenerator';

interface ReportsViewProps {
  deliveries: DeliveryRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ deliveries }) => {
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchKeywords, setSearchKeywords] = useState('');

  // Extract unique teachers and subjects for selectors (including predefined list)
  const teachers = Array.from(
    new Set([...PROFESSORS_LIST, ...deliveries.map((d) => d.teacherName)])
  ).filter(Boolean);
  const subjects = Array.from(new Set(deliveries.map((d) => d.subjectName))).filter(Boolean);

  // Apply filters
  const filteredRecords = deliveries.filter((d) => {
    if (selectedTeacher && d.teacherName !== selectedTeacher) return false;
    if (selectedSubject && d.subjectName !== selectedSubject) return false;
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;

    if (startDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const delivTime = new Date(d.deliveryDate).getTime();
      if (delivTime < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      const delivTime = new Date(d.deliveryDate).getTime();
      if (delivTime > end) return false;
    }

    if (searchKeywords) {
      const q = searchKeywords.toLowerCase().trim();
      const qNorm = q.replace(/º|°|ª|año|to|\s/gi, '');
      const studentIdNorm = d.studentId.toLowerCase().replace(/º|°|ª|año|to|\s/gi, '');

      const match =
        d.pcNumber.toLowerCase().includes(q) ||
        d.studentName.toLowerCase().includes(q) ||
        d.studentId.toLowerCase().includes(q) ||
        (qNorm.length > 0 && studentIdNorm.includes(qNorm)) ||
        (d.studentCareer && d.studentCareer.toLowerCase().includes(q)) ||
        d.teacherName.toLowerCase().includes(q) ||
        d.subjectName.toLowerCase().includes(q) ||
        d.observations.toLowerCase().includes(q) ||
        (d.returnObservations && d.returnObservations.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Quick range helper
  const handleSetQuickDate = (type: 'today' | 'week' | 'month' | 'all') => {
    const now = new Date();
    if (type === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(oneWeekAgo.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (type === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const damageReportsCount = filteredRecords.filter(
    (d) =>
      d.reportedDamageOnReturn ||
      (d.observations &&
        !d.observations.toLowerCase().includes('sin daño') &&
        !d.observations.toLowerCase().includes('sin fallo'))
  ).length;

  const handleExportPDF = () => {
    generateDeliveriesReportPDF(filteredRecords, {
      teacherName: selectedTeacher || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      subjectName: selectedSubject || undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header & Export CTA */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Reportes Detallados por Docente y Fecha
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consulta auditora de entregas, devoluciones, materias y columna de observaciones para fallas o daños previos.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={filteredRecords.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          <FileDown className="w-4 h-4" />
          <span>Descargar Reporte Oficial (PDF)</span>
        </button>
      </div>

      {/* Filter Matrix Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-500" />
            <span>Filtros de Búsqueda y Generación de Reporte</span>
          </span>

          {/* Quick presets */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400 hidden sm:inline mr-1">Rápido:</span>
            <button
              onClick={() => handleSetQuickDate('today')}
              className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={() => handleSetQuickDate('week')}
              className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              7 días
            </button>
            <button
              onClick={() => handleSetQuickDate('month')}
              className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              Este mes
            </button>
            <button
              onClick={() => handleSetQuickDate('all')}
              className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              Todo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Docente / Profesor */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Docente / Profesor
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full py-2 px-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">Todos los docentes</option>
              {teachers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Inicio */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Materia */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Materia / Asignatura
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2 px-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">Todas las materias</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchKeywords}
              onChange={(e) => setSearchKeywords(e.target.value)}
              placeholder="Filtrar por texto en alumno, matrícula, observaciones o fallas..."
              className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 py-1.5 px-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">Estado: Todos los préstamos</option>
              <option value="activo">Solo Préstamos Activos</option>
              <option value="devuelto_bien">Devueltos Conformes</option>
              <option value="devuelto_con_novedad">Devueltos con Novedad / Fallas</option>
            </select>

            {(selectedTeacher || startDate || endDate || selectedSubject || statusFilter !== 'all' || searchKeywords) && (
              <button
                onClick={() => {
                  setSelectedTeacher('');
                  setStartDate('');
                  setEndDate('');
                  setSelectedSubject('');
                  setStatusFilter('all');
                  setSearchKeywords('');
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
              Registros Encontrados
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {filteredRecords.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {deliveries.length > 0 ? `${Math.round((filteredRecords.length / deliveries.length) * 100)}% del total` : '0%'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
              Docente en Consulta
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] block">
              {selectedTeacher || 'Todos los Docentes'}
            </span>
          </div>
          <GraduationCap className="w-5 h-5 text-blue-500" />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
              Casos con Observaciones / Daño
            </span>
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
              {damageReportsCount}
            </span>
          </div>
          <AlertTriangle className="w-5 h-5 text-rose-500" />
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Detalle de Préstamos para el Reporte
          </span>
          <span className="text-xs text-slate-500">
            {filteredRecords.length} filas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-2.5 px-3">PC</th>
                <th className="py-2.5 px-3">Alumno / Curso</th>
                <th className="py-2.5 px-3">Docente</th>
                <th className="py-2.5 px-3">Materia</th>
                <th className="py-2.5 px-3">F. Entrega</th>
                <th className="py-2.5 px-3">F. Retorno</th>
                <th className="py-2.5 px-3 min-w-[220px]">
                  Observaciones (Fallas / Daños Registrados)
                </th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/80 text-slate-700 dark:text-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs sm:text-sm">
                    No hay registros con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((d) => {
                  const hasDamageAlert =
                    d.reportedDamageOnReturn ||
                    (d.observations &&
                      !d.observations.toLowerCase().includes('sin daño') &&
                      !d.observations.toLowerCase().includes('sin fallo'));

                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span>{d.pcNumber}</span>
                          {d.includesCharger && (
                            <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700 inline-flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 fill-amber-500" />
                              <span>{d.chargerNumber || 'Cargador'}</span>
                            </span>
                          )}
                          {d.includesMouse && (
                            <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-400 dark:border-purple-700 inline-flex items-center gap-1">
                              <Mouse className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                              <span>{d.mouseNumber || 'Mouse'}{d.mouseBrand ? ` • ${d.mouseBrand}` : ''}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{d.studentName}</div>
                        <div className="text-[10.5px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-slate-700 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                            {d.studentId}
                          </span>
                          {d.studentCareer && <span>• {d.studentCareer}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {d.teacherName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{d.subjectName}</td>
                      <td className="py-2.5 px-3 text-[11px] whitespace-nowrap">
                        {formatDateTime(d.deliveryDate)}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] whitespace-nowrap">
                        {d.returnDate ? formatDateTime(d.returnDate) : <span className="text-amber-500 font-semibold">En uso</span>}
                      </td>

                      {/* Columna Observaciones destacada */}
                      <td className="py-2.5 px-3">
                        <div
                          className={`p-2 rounded-lg text-xs leading-relaxed border ${
                            hasDamageAlert
                              ? 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-900/60'
                              : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="font-semibold text-[10.5px] uppercase mb-0.5 flex items-center gap-1">
                            {hasDamageAlert && <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />}
                            <span>Al Entregar:</span>
                          </div>
                          <p>{d.observations || 'Sin daños previos.'}</p>

                          {d.returnObservations && (
                            <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400">
                                Al Devolver:
                              </span>{' '}
                              <span>{d.returnObservations}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {d.status === 'activo' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            En Uso
                          </span>
                        )}
                        {d.status === 'devuelto_bien' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Devuelto OK
                          </span>
                        )}
                        {d.status === 'devuelto_con_novedad' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            Con Daño
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
