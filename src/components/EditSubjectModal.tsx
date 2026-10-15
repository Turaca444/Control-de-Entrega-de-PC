import React, { useState, useEffect } from 'react';
import { BookOpen, X, Check, AlertCircle, Laptop, User, GraduationCap, Sparkles } from 'lucide-react';
import { DeliveryRecord } from '../types';

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: DeliveryRecord | null;
  allDeliveries?: DeliveryRecord[];
  onSave: (deliveryId: string, newSubjectName: string, updateWholeCourse: boolean) => Promise<void>;
}

const COMMON_SUBJECT_SUGGESTIONS = [
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
  'Arquitectura de Computadoras y Hardware',
];

export const EditSubjectModal: React.FC<EditSubjectModalProps> = ({
  isOpen,
  onClose,
  delivery,
  allDeliveries = [],
  onSave,
}) => {
  const [subjectName, setSubjectName] = useState('');
  const [updateWholeCourse, setUpdateWholeCourse] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (delivery) {
      setSubjectName(delivery.subjectName || '');
      setError('');
      setUpdateWholeCourse(true);
    }
  }, [delivery]);

  if (!isOpen || !delivery) return null;

  // Calculate other active deliveries in the same course/class
  const normalizedCourse = (delivery.studentId || '').trim().toLowerCase();
  const normalizedTeacher = (delivery.teacherName || '').trim().toLowerCase();
  const sameCourseActiveDeliveries = allDeliveries.filter((d) => {
    if (d.id === delivery.id || d.status !== 'activo') return false;
    const matchCourse =
      (d.studentId || '').trim().toLowerCase() === normalizedCourse ||
      (d.studentId || '').trim().toLowerCase().includes(normalizedCourse);
    const matchTeacher = (d.teacherName || '').trim().toLowerCase() === normalizedTeacher;
    return matchCourse && matchTeacher;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = subjectName.trim();
    if (!clean) {
      setError('Por favor ingresa o selecciona un nombre para la materia.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await onSave(delivery.id, clean, updateWholeCourse && sameCourseActiveDeliveries.length > 0);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la materia.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Corregir Nombre de Materia
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cambia la materia asignada en caso de equivocación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Assignment Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <span>Datos del Préstamo Activo</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{delivery.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5 truncate">
                <Laptop className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white">{delivery.pcNumber}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{delivery.studentName}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{delivery.studentId}</span>
              </div>
              <div className="truncate text-slate-500 dark:text-slate-400">
                Prof. <span className="font-medium text-slate-700 dark:text-slate-300">{delivery.teacherName}</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[11px] flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Materia actual:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400 line-through truncate max-w-[220px]">
                {delivery.subjectName || '(Sin materia)'}
              </span>
            </div>
          </div>

          {/* New Subject Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nuevo Nombre de la Materia / Asignatura *
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Ej. Programación II o Informática Aplicada"
                list="edit-subjects-suggestions"
                className="w-full text-sm py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              />
              <datalist id="edit-subjects-suggestions">
                {COMMON_SUBJECT_SUGGESTIONS.map((subj) => (
                  <option key={subj} value={subj} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Sugerencias rápidas de materias:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {COMMON_SUBJECT_SUGGESTIONS.slice(0, 10).map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSubjectName(subj)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    subjectName.trim().toLowerCase() === subj.toLowerCase()
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>

          {/* Option: Update whole course if multiple students active */}
          {sameCourseActiveDeliveries.length > 0 && (
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateWholeCourse}
                  onChange={(e) => setUpdateWholeCourse(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Aplicar cambio también al resto del curso ({delivery.studentId})
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] block mt-0.5">
                    Modificar la materia a los otros <strong>{sameCourseActiveDeliveries.length}</strong> alumnos activos de esta misma clase con {delivery.teacherName}.
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !subjectName.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Materia Corregida</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
