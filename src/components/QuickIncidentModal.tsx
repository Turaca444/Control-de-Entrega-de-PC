import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Wrench, ShieldAlert } from 'lucide-react';
import { Computer } from '../types';
import { api } from '../utils/api';

interface QuickIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  computers: Computer[];
  onSuccess: () => void;
  initialPcNumber?: string;
}

const COMMON_INCIDENT_TAGS = [
  'Teclado no responde',
  'Mouse no detectado / no enciende',
  'Pantalla sin señal / cable HDMI flojo',
  'No enciende / falla de energía',
  'Sin conexión a red / internet',
  'Sistema congelado / reinicios continuos',
  'Golpe físico o daño en carcasa',
];

export const QuickIncidentModal: React.FC<QuickIncidentModalProps> = ({
  isOpen,
  onClose,
  computers,
  onSuccess,
  initialPcNumber,
}) => {
  const [pcNumber, setPcNumber] = useState(initialPcNumber || (computers[0]?.pcNumber ?? 'PC-01'));
  const [type, setType] = useState('hardware');
  const [severity, setSeverity] = useState('media');
  const [reportedBy, setReportedBy] = useState('Operador de Sala / Docente');
  const [description, setDescription] = useState('');
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initialPcNumber if passed
  useEffect(() => {
    if (initialPcNumber) {
      setPcNumber(initialPcNumber);
    } else if (computers.length > 0 && !computers.some((c) => c.pcNumber === pcNumber)) {
      setPcNumber(computers[0].pcNumber);
    }
  }, [initialPcNumber, computers]);

  // Reset errors when opened
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Por favor describa el problema o falla.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await api.createIncident({
        pcNumber,
        type,
        severity,
        description: description.trim(),
        observations: observations.trim() || undefined,
        reportedBy: reportedBy.trim() || 'Operador de Sala / Docente',
      });
      // Reset fields
      setDescription('');
      setObservations('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar la incidencia');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyTag = (tag: string) => {
    if (!description) {
      setDescription(tag);
    } else if (!description.includes(tag)) {
      setDescription(`${description}, ${tag}`);
    }
  };

  return (
    <div
      id="quick-incident-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="quick-incident-modal"
        className="bg-white dark:bg-slate-850 rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Registro Rápido de Incidencia o Falla
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Notifica anomalías técnicas para mantenimiento y trazabilidad.
              </p>
            </div>
          </div>
          <button
            id="btn-close-quick-incident"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* PC Selection & Failure Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="incident-pc-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número de PC *
              </label>
              <select
                id="incident-pc-select"
                value={pcNumber}
                onChange={(e) => setPcNumber(e.target.value)}
                className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
              >
                {computers.map((c) => (
                  <option key={c.pcNumber} value={c.pcNumber}>
                    {c.pcNumber} — Estado: {c.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="incident-type-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Falla
              </label>
              <select
                id="incident-type-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
              >
                <option value="hardware">Hardware / Componente interno</option>
                <option value="periferico">Periféricos (Teclado / Mouse / Monitor)</option>
                <option value="dano_fisico">Daño Físico / Chasis / Conector</option>
                <option value="software">Software / Sistema Operativo</option>
                <option value="red_conectividad">Red / Conectividad / Cableado</option>
              </select>
            </div>
          </div>

          {/* Severity & Reported By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="incident-severity-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nivel de Severidad
              </label>
              <select
                id="incident-severity-select"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
              >
                <option value="baja">Baja (Detalle menor, no bloqueante)</option>
                <option value="media">Media (Afecta funcionamiento parcial)</option>
                <option value="alta">Alta (Equipo inutilizable)</option>
                <option value="critica">Crítica (Riesgo eléctrico o daño mayor)</option>
              </select>
            </div>

            <div>
              <label htmlFor="incident-reported-by" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reportado por
              </label>
              <input
                id="incident-reported-by"
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                placeholder="Nombre del operador o docente"
                className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Quick Issue Tags */}
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Problemas frecuentes (clic para autocompletar):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_INCIDENT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleApplyTag(tag)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="incident-description" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descripción del Problema o Falla *
            </label>
            <input
              id="incident-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Teclado no reconoce la tecla espacio y mouse con falso contacto"
              className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Observations */}
          <div>
            <label htmlFor="incident-observations" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observaciones Técnicas Adicionales (Opcional)
            </label>
            <textarea
              id="incident-observations"
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Pruebas efectuadas, cables revisados, o sugerencias de repuesto..."
              className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              id="btn-cancel-incident"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-incident"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registrando...' : 'Registrar y Notificar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
