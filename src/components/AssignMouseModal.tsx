import React, { useState, useMemo } from 'react';
import {
  Mouse,
  X,
  AlertCircle,
  Laptop,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import {
  DeliveryRecord,
  UserProfile,
  LAB_MOUSE_CODES,
  DEFAULT_MOUSE_BRAND,
  COMMON_MOUSE_BRANDS,
} from '../types';

interface AssignMouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: DeliveryRecord | null;
  deliveries: DeliveryRecord[];
  currentUser?: UserProfile | null;
  onConfirm: (
    deliveryId: string,
    mouseData: { mouseNumber: string; mouseBrand?: string; reason?: string }
  ) => Promise<void>;
}

const QUICK_MOUSE_REASONS = [
  '🖱️ Solicitud de mouse para trabajo práctico',
  '💻 Incomodidad o dificultad con el touchpad',
  '🎯 Tarea de precisión (Diseño, CAD, Programación)',
  '⚡ Alumno solicitó mouse óptico USB en clase',
  '🛠️ Touchpad deshabilitado o no responde',
];

export const AssignMouseModal: React.FC<AssignMouseModalProps> = ({
  isOpen,
  onClose,
  delivery,
  deliveries,
  currentUser,
  onConfirm,
}) => {
  if (!isOpen || !delivery) return null;

  const [mouseNumber, setMouseNumber] = useState<string>(
    delivery.mouseNumber || LAB_MOUSE_CODES[0]
  );
  const [mouseBrand, setMouseBrand] = useState<string>(
    delivery.mouseBrand || DEFAULT_MOUSE_BRAND
  );
  const [reason, setReason] = useState<string>(
    'Estudiante solicitó mouse óptico USB para la clase.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Map of active mice in use
  const miceInUseMap = useMemo(() => {
    const map = new Map<string, { student: string; pc: string }>();
    deliveries.forEach((d) => {
      if (d.status === 'activo' && d.includesMouse && d.mouseNumber && d.id !== delivery.id) {
        map.set(d.mouseNumber.trim().toUpperCase(), {
          student: d.studentName,
          pc: d.pcNumber,
        });
      }
    });
    return map;
  }, [deliveries, delivery]);

  const currentMouseInUse = mouseNumber
    ? miceInUseMap.get(mouseNumber.trim().toUpperCase())
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mouseNumber.trim()) {
      setErrorMessage('Por favor ingrese o seleccione un código de mouse.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onConfirm(delivery.id, {
        mouseNumber: mouseNumber.trim().toUpperCase(),
        mouseBrand: mouseBrand.trim() || DEFAULT_MOUSE_BRAND,
        reason: reason.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al asignar el mouse.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-800">
              <Mouse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Asignar Mouse Óptico USB
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Equipo ya retirado • Préstamo de mouse para la clase
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student & Equipment Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-500" />
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600">
                {delivery.pcNumber}
              </span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              En Préstamo Activo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-slate-400 block text-[11px]">Estudiante:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {delivery.studentName}
              </strong>
              <span className="text-slate-500 dark:text-slate-400 block text-[10.5px]">
                {delivery.studentId} {delivery.studentCareer ? `• ${delivery.studentCareer}` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Docente a cargo:</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {delivery.teacherName}
              </span>
              <span className="text-slate-500 dark:text-slate-400 block text-[10.5px]">
                {delivery.subjectName}
              </span>
            </div>
          </div>
        </div>

        {/* Notice of binding */}
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-xs text-purple-950 dark:text-purple-200 flex items-start gap-2.5">
          <Mouse className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Préstamo de Periférico Adicional (Mouse USB)</p>
            <p className="text-[11.5px] text-purple-800 dark:text-purple-300">
              El mouse quedará vinculado a la ficha de préstamo del estudiante. Al registrar la devolución del equipo, el sistema solicitará la entrega y verificación del mouse.
            </p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mouse Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Código Identificador del Mouse: *
              </label>
              <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                Mouses oficiales del laboratorio
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-7">
                <select
                  value={mouseNumber}
                  onChange={(e) => setMouseNumber(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-bold cursor-pointer"
                >
                  <option value="">-- Seleccionar código de mouse --</option>
                  {LAB_MOUSE_CODES.map((code) => {
                    const inUse = miceInUseMap.get(code);
                    return (
                      <option key={code} value={code}>
                        {code} {inUse ? ` ⚠️ (En uso por ${inUse.student})` : ' ✓ (Disponible)'}
                      </option>
                    );
                  })}
                  {mouseNumber &&
                    !LAB_MOUSE_CODES.includes(mouseNumber as any) && (
                      <option value={mouseNumber}>
                        {mouseNumber} (Personalizado)
                      </option>
                    )}
                </select>
              </div>

              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={mouseNumber}
                  onChange={(e) => setMouseNumber(e.target.value.toUpperCase())}
                  placeholder="Ej. LF79, N249..."
                  className="w-full text-xs sm:text-sm p-2 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-mono uppercase font-semibold"
                />
              </div>
            </div>

            {/* Quick Chips for Lab Mouse Codes */}
            <div className="space-y-1 pt-1">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                Selección rápida por código:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LAB_MOUSE_CODES.map((code) => {
                  const inUse = miceInUseMap.get(code);
                  const isSelected = mouseNumber === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setMouseNumber(code)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-mono font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : inUse
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-purple-200 dark:border-purple-900/60 hover:border-purple-400'
                      }`}
                      title={inUse ? `En uso por ${inUse.student} (${inUse.pc})` : 'Disponible'}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Warning if mouse already in use */}
            {currentMouseInUse && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>
                  <strong>Aviso:</strong> El mouse <em>{mouseNumber}</em> figura actualmente asignado a{' '}
                  <strong>{currentMouseInUse.student}</strong> ({currentMouseInUse.pc}). Verifique antes de entregar.
                </span>
              </div>
            )}
          </div>

          {/* Mouse Brand Section */}
          <div className="space-y-1.5 p-3 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20">
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

            {/* Quick Brand Chips */}
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

          {/* Reason / Observation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Motivo u Observación del Préstamo de Mouse:
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Solicitud para trabajo práctico..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />

            {/* Quick Reason tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_MOUSE_REASONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setReason(q)}
                  className="text-[10.5px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Current Selection Summary */}
          {mouseNumber && (
            <div className="p-2.5 rounded-xl bg-purple-100/70 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-800 text-xs text-purple-950 dark:text-purple-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Mouse: <u>{mouseNumber}</u> ({mouseBrand || 'Logitech M90'})</span>
              </span>
              <span className="text-[11px] text-purple-800 dark:text-purple-300">
                Para: {delivery.studentName} ({delivery.pcNumber})
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !mouseNumber.trim()}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Mouse className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Confirmar Asignación'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
