import React, { useState } from 'react';
import {
  Laptop,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  FileDown,
  Plus,
  History,
  HardDrive,
  Cpu,
  Layers,
  MapPin,
  Calendar,
  X,
  Check,
  Search,
} from 'lucide-react';
import { Computer, DeliveryRecord, IncidentRecord, RepairRecord } from '../types';
import { generateEquipmentHistoryPDF, formatDateOnly, formatDateTime } from '../utils/pdfGenerator';
import { api } from '../utils/api';

interface ComputersViewProps {
  computers: Computer[];
  deliveries: DeliveryRecord[];
  incidents: IncidentRecord[];
  repairs: RepairRecord[];
  onRefresh: () => void;
  onSelectDeliveryForPC?: (pcNumber: string) => void;
}

export const ComputersView: React.FC<ComputersViewProps> = ({
  computers,
  deliveries,
  incidents,
  repairs,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComputer, setSelectedComputer] = useState<Computer | null>(null);
  const [historyTab, setHistoryTab] = useState<'deliveries' | 'incidents' | 'repairs'>('deliveries');

  // Add PC modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPcNumber, setNewPcNumber] = useState('');
  const [newModel, setNewModel] = useState('Dell OptiPlex 7090 Tower');
  const [newProcessor, setNewProcessor] = useState('Intel Core i7-11700 (8C/16T)');
  const [newRam, setNewRam] = useState('16 GB DDR4 3200MHz');
  const [newStorage, setNewStorage] = useState('512 GB NVMe SSD');
  const [newOs, setNewOs] = useState('Ubuntu 22.04 LTS / Win 11');
  const [newLocation, setNewLocation] = useState('Fila C - Puesto 01');
  const [isSubmittingPC, setIsSubmittingPC] = useState(false);

  const filteredComputers = computers.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      c.pcNumber.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      c.processor.toLowerCase().includes(q) ||
      c.locationRow.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countDisponible = computers.filter((c) => c.status === 'disponible').length;
  const countEnUso = computers.filter((c) => c.status === 'en_uso').length;
  const countMantenimiento = computers.filter((c) => c.status === 'mantenimiento').length;
  const countReparacion = computers.filter((c) => c.status === 'en_reparacion').length;

  const handleCreatePC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPcNumber.trim()) return;

    try {
      setIsSubmittingPC(true);
      await api.createComputer({
        pcNumber: newPcNumber.trim().toUpperCase(),
        model: newModel,
        processor: newProcessor,
        ram: newRam,
        storage: newStorage,
        os: newOs,
        locationRow: newLocation,
        healthScore: 100,
        totalLoansCount: 0,
        totalUsageHours: 0,
      });
      setShowAddModal(false);
      setNewPcNumber('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al registrar equipo');
    } finally {
      setIsSubmittingPC(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponible':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Disponible</span>
          </span>
        );
      case 'en_uso':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            <span>Asignado / En Uso</span>
          </span>
        );
      case 'mantenimiento':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Wrench className="w-3 h-3" />
            <span>Mantenimiento</span>
          </span>
        );
      case 'en_reparacion':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3" />
            <span>En Reparación</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Laptop className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Inventario y Trazabilidad de Equipos de la Sala</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoreo continuo de hardware, índice de salud, usuarios asignados e historial técnico descargable en PDF.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Equipo</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por PC, procesador, modelo o fila..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="all">Todos los estados</option>
            <option value="disponible">Disponibles</option>
            <option value="en_uso">En Uso / Prestados</option>
            <option value="mantenimiento">En Mantenimiento</option>
            <option value="en_reparacion">En Reparación</option>
          </select>
        </div>
      </div>

      {/* Status Legend / Color Key */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Leyenda y Guía de Colores de Equipos:
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (Haz clic en cualquier tarjeta para filtrar)
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
              >
                Ver todos ({computers.length})
              </button>
            )}
            <span>
              Total: <strong className="text-slate-800 dark:text-slate-200">{computers.length} computadoras</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {/* Disponible */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'disponible' ? 'all' : 'disponible')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
              statusFilter === 'disponible'
                ? 'bg-emerald-100/90 dark:bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 shadow-xs" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 truncate">
                  Disponible (Libre)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 shrink-0">
                  {countDisponible}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400/90 leading-tight mt-0.5">
                Equipo desocupado y en condiciones óptimas para asignación inmediata.
              </p>
            </div>
          </button>

          {/* En Uso */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'en_uso' ? 'all' : 'en_uso')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
              statusFilter === 'en_uso'
                ? 'bg-amber-100/90 dark:bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 hover:border-amber-400'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0 shadow-xs" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-amber-800 dark:text-amber-300 truncate">
                  En Uso (Prestado)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 shrink-0">
                  {countEnUso}
                </span>
              </div>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 leading-tight mt-0.5">
                Entregado a un estudiante con sesión de clase en curso.
              </p>
            </div>
          </button>

          {/* Mantenimiento */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'mantenimiento' ? 'all' : 'mantenimiento')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
              statusFilter === 'mantenimiento'
                ? 'bg-indigo-100/90 dark:bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-400'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1 shrink-0 shadow-xs" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-indigo-800 dark:text-indigo-300 truncate">
                  Mantenimiento
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 shrink-0">
                  {countMantenimiento}
                </span>
              </div>
              <p className="text-[11px] text-indigo-700/90 dark:text-indigo-400/90 leading-tight mt-0.5">
                Limpieza, actualización de SO o revisión preventiva programada.
              </p>
            </div>
          </button>

          {/* En Reparación */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'en_reparacion' ? 'all' : 'en_reparacion')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
              statusFilter === 'en_reparacion'
                ? 'bg-rose-100/90 dark:bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 hover:border-rose-400'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0 shadow-xs" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-rose-800 dark:text-rose-300 truncate">
                  En Reparación
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-200/80 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 shrink-0">
                  {countReparacion}
                </span>
              </div>
              <p className="text-[11px] text-rose-700/90 dark:text-rose-400/90 leading-tight mt-0.5">
                Incidencia técnica reportada en hardware o pantalla en taller.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Grid of Computer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredComputers.map((comp) => {
          const pcDeliveries = deliveries.filter((d) => d.pcNumber === comp.pcNumber);
          const activeLoan = pcDeliveries.find((d) => d.status === 'activo');
          const pcIncidents = incidents.filter((i) => i.pcNumber === comp.pcNumber);
          const pcRepairs = repairs.filter((r) => r.pcNumber === comp.pcNumber);

          return (
            <div
              key={comp.pcNumber}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all p-4 flex flex-col justify-between"
            >
              <div>
                {/* Header card */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono font-bold text-xs tracking-wider">
                      {comp.pcNumber}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {comp.locationRow}
                    </span>
                  </div>
                  {getStatusBadge(comp.status)}
                </div>

                {/* Model & Specs */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {comp.model}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <Cpu className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{comp.processor}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {comp.ram} • {comp.storage}
                    </span>
                  </div>
                </div>

                {/* Health & Usage Progress Bar */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Salud Técnica:</span>
                    <span
                      className={`font-bold ${
                        comp.healthScore > 80
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : comp.healthScore > 60
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {comp.healthScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        comp.healthScore > 80
                          ? 'bg-emerald-500'
                          : comp.healthScore > 60
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${comp.healthScore}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>{comp.totalLoansCount} asignaciones</span>
                    <span>{comp.totalUsageHours} hrs de uso</span>
                  </div>
                </div>

                {/* Active user if assigned */}
                {activeLoan ? (
                  <div className="p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 mb-3 space-y-0.5">
                    <div className="font-semibold flex items-center justify-between">
                      <span>En sesión actual:</span>
                      <span className="text-[10px] font-mono">{activeLoan.studentId}</span>
                    </div>
                    <p className="truncate">{activeLoan.studentName}</p>
                    <p className="text-[10px] text-amber-800 dark:text-amber-300 truncate">
                      {activeLoan.teacherName} — {activeLoan.subjectName}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 mb-3 text-center">
                    Sin usuario asignado actualmente
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedComputer(comp);
                    setHistoryTab('deliveries');
                  }}
                  className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-blue-500" />
                  <span>Ver Historial</span>
                </button>

                <button
                  onClick={() => generateEquipmentHistoryPDF(comp, pcDeliveries, pcIncidents, pcRepairs)}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Descargar Hoja de Vida y Trazabilidad en PDF"
                >
                  <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Historial Detallado del Equipo */}
      {selectedComputer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-750 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white font-mono font-bold text-sm">
                  {selectedComputer.pcNumber}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Hoja de Vida y Trazabilidad del Equipo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedComputer.model} • {selectedComputer.locationRow}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const pcDeliveries = deliveries.filter((d) => d.pcNumber === selectedComputer.pcNumber);
                    const pcIncidents = incidents.filter((i) => i.pcNumber === selectedComputer.pcNumber);
                    const pcRepairs = repairs.filter((r) => r.pcNumber === selectedComputer.pcNumber);
                    generateEquipmentHistoryPDF(selectedComputer, pcDeliveries, pcIncidents, pcRepairs);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </button>

                <button
                  onClick={() => setSelectedComputer(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Hardware Specs Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10.5px]">Procesador:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {selectedComputer.processor}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10.5px]">Memoria / Disco:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {selectedComputer.ram} • {selectedComputer.storage}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10.5px]">Préstamos / Horas:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {selectedComputer.totalLoansCount} préstamos ({selectedComputer.totalUsageHours} hrs)
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10.5px]">Último Mantenimiento:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {formatDateOnly(selectedComputer.lastMaintenanceDate)}
                </span>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 text-xs font-semibold gap-4">
              <button
                onClick={() => setHistoryTab('deliveries')}
                className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                  historyTab === 'deliveries'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Historial de Asignaciones ({deliveries.filter((d) => d.pcNumber === selectedComputer.pcNumber).length})
              </button>
              <button
                onClick={() => setHistoryTab('incidents')}
                className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                  historyTab === 'incidents'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Incidencias y Daños ({incidents.filter((i) => i.pcNumber === selectedComputer.pcNumber).length})
              </button>
              <button
                onClick={() => setHistoryTab('repairs')}
                className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                  historyTab === 'repairs'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Reparaciones Técnicas ({repairs.filter((r) => r.pcNumber === selectedComputer.pcNumber).length})
              </button>
            </div>

            {/* Tab content 1: Deliveries */}
            {historyTab === 'deliveries' && (
              <div className="max-h-72 overflow-y-auto space-y-2">
                {deliveries.filter((d) => d.pcNumber === selectedComputer.pcNumber).length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">No registra asignaciones previas.</p>
                ) : (
                  deliveries
                    .filter((d) => d.pcNumber === selectedComputer.pcNumber)
                    .map((d) => (
                      <div
                        key={d.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {d.studentName} ({d.studentId})
                          </span>
                          <span className="text-[10.5px] text-slate-500 font-mono">
                            {formatDateTime(d.deliveryDate)}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11.5px]">
                          <strong>Docente:</strong> {d.teacherName} • <strong>Materia:</strong> {d.subjectName}
                        </p>
                        <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-850 text-[11px] text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                          <strong>Observaciones / Daño:</strong> {d.observations || 'Sin novedad reportada.'}
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* Tab content 2: Incidents */}
            {historyTab === 'incidents' && (
              <div className="max-h-72 overflow-y-auto space-y-2">
                {incidents.filter((i) => i.pcNumber === selectedComputer.pcNumber).length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">
                    No se han registrado incidencias para este equipo.
                  </p>
                ) : (
                  incidents
                    .filter((i) => i.pcNumber === selectedComputer.pcNumber)
                    .map((inc) => (
                      <div
                        key={inc.id}
                        className="p-3 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider text-[11px]">
                            {inc.type} • Severidad: {inc.severity}
                          </span>
                          <span className="text-[10.5px] text-slate-500">{formatDateTime(inc.date)}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200">{inc.description}</p>
                        {inc.observations && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                            Observación técnica: {inc.observations}
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>
            )}

            {/* Tab content 3: Repairs */}
            {historyTab === 'repairs' && (
              <div className="max-h-72 overflow-y-auto space-y-2">
                {repairs.filter((r) => r.pcNumber === selectedComputer.pcNumber).length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">
                    No registra órdenes de reparación técnica.
                  </p>
                ) : (
                  repairs
                    .filter((r) => r.pcNumber === selectedComputer.pcNumber)
                    .map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {rep.id} — Técnico: {rep.technicianName}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 uppercase">
                            {rep.finalStatus}
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200">
                          <strong>Diagnóstico:</strong> {rep.faultDiagnosis}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          <strong>Trabajo:</strong> {rep.workDone}
                        </p>
                        {rep.replacedParts.length > 0 && (
                          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                            <strong>Piezas reemplazadas:</strong> {rep.replacedParts.join(', ')}
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-right">
              <button
                onClick={() => setSelectedComputer(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Nuevo Equipo */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Registrar Nuevo Equipo en la Sala
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePC} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número de PC (Identificador único) *
                </label>
                <input
                  type="text"
                  value={newPcNumber}
                  onChange={(e) => setNewPcNumber(e.target.value)}
                  placeholder="Ej. PC-09"
                  className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Modelo y Fabricante
                </label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="Ej. Dell OptiPlex 7090 / HP ProDesk"
                  className="w-full text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Procesador
                  </label>
                  <input
                    type="text"
                    value={newProcessor}
                    onChange={(e) => setNewProcessor(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Memoria RAM
                  </label>
                  <input
                    type="text"
                    value={newRam}
                    onChange={(e) => setNewRam(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Almacenamiento
                  </label>
                  <input
                    type="text"
                    value={newStorage}
                    onChange={(e) => setNewStorage(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ubicación / Fila
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPC}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPC ? 'Guardando...' : 'Guardar Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
