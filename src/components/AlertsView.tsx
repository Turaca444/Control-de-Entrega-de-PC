import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  RefreshCw,
  Bell,
  Cpu,
  Calendar,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { MaintenanceAlert, Computer } from '../types';
import { formatDateTime, formatDateOnly } from '../utils/pdfGenerator';
import { api } from '../utils/api';

interface AlertsViewProps {
  alerts: MaintenanceAlert[];
  computers: Computer[];
  onRefresh: () => void;
  onTestPush: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  computers,
  onRefresh,
  onTestPush,
}) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'resolved' | 'all'>('pending');

  const pendingAlerts = alerts.filter((a) => a.status === 'activa');
  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus === 'pending') return a.status === 'activa';
    if (filterStatus === 'resolved') return a.status === 'atendida' || a.status === 'descartada';
    return true;
  });

  const handleEvaluate = async () => {
    try {
      setIsEvaluating(true);
      await api.evaluateAlerts();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al evaluar reglas');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.resolveAlert(alertId, 'atendida');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar alerta');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500 text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Motor de Alertas Automáticas y Mantenimiento Preventivo
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Algoritmo inteligente que evalúa horas de uso, número de préstamos, incidencias acumuladas y antigüedad.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>Evaluar Reglas Ahora</span>
          </button>

          <button
            onClick={onTestPush}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Probar Push</span>
          </button>
        </div>
      </div>

      {/* Logic rules summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Horas Acumuladas</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
            Se dispara cuando un equipo sobrepasa <strong>120 horas</strong> de uso continuo en la sala.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>Tiempo Transcurrido</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
            Supera los <strong>60 días</strong> sin mantenimiento técnico preventivo ni limpieza interna.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Rotación / Préstamos</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
            Al alcanzar <strong>25 préstamos</strong> a alumnos se programa revisión de puertos y periféricos.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1">
            <Cpu className="w-4 h-4 text-rose-500" />
            <span>Índice de Salud</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
            Salud técnica inferior a <strong>75%</strong> debido a reportes de fallas o daños físicos previos.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Pendientes ({pendingAlerts.length})
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'resolved'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Atendidas / Historial
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Todas ({alerts.length})
          </button>
        </div>

        <span className="text-xs text-slate-400">
          Notificaciones Push emitidas automáticamente al admin
        </span>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
            No hay alertas en esta categoría. Todos los equipos de la sala cumplen las normativas preventivas.
          </div>
        ) : (
          filteredAlerts.map((alertItem) => {
            const comp = computers.find((c) => c.pcNumber === alertItem.pcNumber);
            const isPending = alertItem.status === 'activa';

            return (
              <div
                key={alertItem.id}
                className={`rounded-xl p-4 border transition-all ${
                  isPending
                    ? 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-800/80 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                        {alertItem.pcNumber}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          alertItem.priority === 'urgente'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : alertItem.priority === 'alta'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        Prioridad: {alertItem.priority}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formatDateTime(alertItem.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {alertItem.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {alertItem.message}
                    </p>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <strong>Acción Recomendada:</strong> {alertItem.suggestedAction}
                    </p>

                    {comp && (
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span>Horas: {comp.totalUsageHours} hrs</span>
                        <span>•</span>
                        <span>Préstamos: {comp.totalLoansCount}</span>
                        <span>•</span>
                        <span>Salud: {comp.healthScore}%</span>
                        <span>•</span>
                        <span>Último mant.: {formatDateOnly(comp.lastMaintenanceDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isPending ? (
                      <button
                        onClick={() => handleResolveAlert(alertItem.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Marcar Atendida</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Atendida</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
