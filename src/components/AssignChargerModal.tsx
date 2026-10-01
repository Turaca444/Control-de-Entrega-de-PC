import React, { useState, useMemo } from 'react';
import {
  Zap,
  BatteryCharging,
  X,
  AlertCircle,
  CheckCircle2,
  Laptop,
  User,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { DeliveryRecord, UserProfile } from '../types';

interface AssignChargerModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: DeliveryRecord | null;
  deliveries: DeliveryRecord[];
  currentUser?: UserProfile | null;
  onConfirm: (
    deliveryId: string,
    chargerData: { chargerNumber: string; reason?: string }
  ) => Promise<void>;
}

const QUICK_REASONS = [
  '🔋 Batería agotada durante la clase',
  '⚡ Batería en nivel crítico (menos de 10%)',
  '💻 Alumno necesita continuar trabajo práctico',
  '🔌 Alumno solicitó cargador para su clase',
  '⚠️ Equipo se apagó por falta de carga',
];

export const AssignChargerModal: React.FC<AssignChargerModalProps> = ({
  isOpen,
  onClose,
  delivery,
  deliveries,
  currentUser,
  onConfirm,
}) => {
  if (!isOpen || !delivery) return null;

  // Extract number from PC if possible (e.g. PC-05 -> 05)
  const pcDigits = delivery.pcNumber.replace(/\D/g, '');
  const defaultSuggestedCharger = pcDigits
    ? `Cargador ${pcDigits.padStart(2, '0')}`
    : 'Cargador 01';

  const [chargerNumber, setChargerNumber] = useState<string>(
    delivery.chargerNumber || defaultSuggestedCharger
  );
  const [reason, setReason] = useState<string>(
    'Estudiante sin batería durante la clase. Se asigna cargador para continuar actividad.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Map of active chargers in use
  const chargersInUseMap = useMemo(() => {
    const map = new Map<string, { student: string; pc: string }>();
    deliveries.forEach((d) => {
      if (d.status === 'activo' && d.includesCharger && d.chargerNumber && d.id !== delivery.id) {
        map.set(d.chargerNumber.trim().toLowerCase(), {
          student: d.studentName,
          pc: d.pcNumber,
        });
      }
    });
    return map;
  }, [deliveries, delivery]);

  const currentChargerInUse = chargerNumber
    ? chargersInUseMap.get(chargerNumber.trim().toLowerCase())
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargerNumber.trim()) {
      setErrorMessage('Por favor ingrese o seleccione un número de cargador.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onConfirm(delivery.id, {
        chargerNumber: chargerNumber.trim(),
        reason: reason.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al asignar el cargador.');
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
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
              <Zap className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Asignar Cargador por Batería Baja
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Equipo ya retirado • Asignación de cargador en curso
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
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              En Préstamo Activo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-slate-400 block text-[11px]">Estudiante:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {delivery.studentName}
              </strong>
              <span className="text-slate-500 text-[11px] block">
                {delivery.studentId} {delivery.studentCareer ? `• ${delivery.studentCareer}` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Docente y Materia:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {delivery.teacherName}
              </strong>
              <span className="text-slate-500 text-[11px] block">
                {delivery.subjectName}
              </span>
            </div>
          </div>
        </div>

        {/* Situation Notice */}
        <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <BatteryCharging className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-950 dark:text-amber-100">
              El estudiante se quedó sin carga en su equipo
            </p>
            <p className="text-[11.5px] leading-relaxed">
              Al confirmar, el cargador quedará registrado en su ficha de préstamo. Al momento de devolver el equipo, el sistema solicitará la devolución conjunta de la PC y este cargador.
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
          {/* Charger Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Cargador a Asignar: *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-7">
                <select
                  value={chargerNumber}
                  onChange={(e) => setChargerNumber(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
                >
                  <option value="">-- Seleccionar cargador --</option>
                  {Array.from({ length: 25 }, (_, i) => {
                    const num = String(i + 1).padStart(2, '0');
                    const code = `Cargador ${num}`;
                    const inUse = chargersInUseMap.get(code.toLowerCase());
                    const isSamePC = pcDigits && parseInt(pcDigits, 10) === i + 1;
                    return (
                      <option key={num} value={code}>
                        {code} {isSamePC ? '★ (Mismo número que la PC)' : ''}
                        {inUse ? ` ⚠️ (En uso por ${inUse.student})` : ' ✓ (Disponible)'}
                      </option>
                    );
                  })}
                  {chargerNumber &&
                    !Array.from({ length: 25 }, (_, i) => `Cargador ${String(i + 1).padStart(2, '0')}`).includes(chargerNumber) && (
                      <option value={chargerNumber}>
                        {chargerNumber} (Personalizado)
                      </option>
                    )}
                </select>
              </div>

              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={chargerNumber}
                  onChange={(e) => setChargerNumber(e.target.value)}
                  placeholder="Ej. Cargador 05"
                  className="w-full text-xs sm:text-sm p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Quick recommend same as PC button */}
            {pcDigits && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setChargerNumber(defaultSuggestedCharger)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Usar {defaultSuggestedCharger} (Mismo N° que {delivery.pcNumber})</span>
                </button>
              </div>
            )}

            {/* Warning if charger already in use */}
            {currentChargerInUse && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>
                  <strong>Aviso:</strong> El <em>{chargerNumber}</em> figura actualmente asignado a{' '}
                  <strong>{currentChargerInUse.student}</strong> ({currentChargerInUse.pc}). Verifique antes de entregar.
                </span>
              </div>
            )}
          </div>

          {/* Reason / Observation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Motivo u Observación de la Asignación Posterior:
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Batería agotada en clase..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />

            {/* Quick Reason tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_REASONS.map((q) => (
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !chargerNumber.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isSubmitting ? 'Asignando cargador...' : '⚡ Confirmar Asignación'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
