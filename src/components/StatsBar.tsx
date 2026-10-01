import React from 'react';
import {
  Laptop,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  CalendarCheck2,
} from 'lucide-react';
import { SystemStats } from '../types';

interface StatsBarProps {
  stats: SystemStats | null;
  onFilterStatus?: (status: string) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, onFilterStatus }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Equipos */}
      <div
        id="stat-total-computers"
        className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3"
      >
        <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
          <Laptop className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Equipos
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.totalComputers}
          </span>
        </div>
      </div>

      {/* 2. Disponibles */}
      <div
        id="stat-available-computers"
        className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3"
      >
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Disponibles
          </span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.availableComputers}
          </span>
        </div>
      </div>

      {/* 3. En Uso / Asignados */}
      <div
        id="stat-in-use-computers"
        className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3"
      >
        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Préstamos Activos
          </span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {stats.inUseComputers}
          </span>
        </div>
      </div>

      {/* 4. En Mantenimiento */}
      <div
        id="stat-maintenance-computers"
        className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3"
      >
        <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            En Mantenimiento
          </span>
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {stats.inMaintenanceComputers + stats.inRepairComputers}
          </span>
        </div>
      </div>

      {/* 5. Alertas Preventivas */}
      <div
        id="stat-alerts-computers"
        className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3"
      >
        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Alertas Activas
          </span>
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
            {stats.pendingAlertsCount}
          </span>
        </div>
      </div>

      {/* 6. Préstamos Hoy */}
      <div
        id="stat-today-loans"
        className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3"
      >
        <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 shrink-0">
          <CalendarCheck2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Sesiones Hoy
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.totalLoansToday}
          </span>
        </div>
      </div>
    </div>
  );
};
