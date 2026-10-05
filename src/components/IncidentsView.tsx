import React, { useState } from 'react';
import {
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Laptop,
  User,
  DollarSign,
  Layers,
  X,
  Check,
  FileText,
  FileDown,
  Trash2,
} from 'lucide-react';
import { IncidentRecord, RepairRecord, Computer } from '../types';
import { formatDateTime, formatDateOnly, generateIncidentReportPDF, generateRepairOrderPDF } from '../utils/pdfGenerator';
import { api } from '../utils/api';

interface IncidentsViewProps {
  incidents: IncidentRecord[];
  repairs: RepairRecord[];
  computers: Computer[];
  onRefresh: () => void;
  onOpenQuickIncident?: () => void;
  onDeleteIncident?: (id: string) => Promise<void>;
  onDeleteRepair?: (id: string) => Promise<void>;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  repairs,
  computers,
  onRefresh,
  onOpenQuickIncident,
  onDeleteIncident,
  onDeleteRepair,
}) => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'repairs'>('incidents');
  const [selectedPCFilter, setSelectedPCFilter] = useState('');

  // New repair modal
  const [showNewRepairModal, setShowNewRepairModal] = useState(false);
  const [repairPC, setRepairPC] = useState('PC-01');
  const [repairTech, setRepairTech] = useState('');
  const [repairDiag, setRepairDiag] = useState('');
  const [repairWork, setRepairWork] = useState('');
  const [repairParts, setRepairParts] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [repairStatus, setRepairStatus] = useState<'en_progreso' | 'reparado' | 'requiere_baja'>('en_progreso');
  const [downloadRepairPDF, setDownloadRepairPDF] = useState(true);
  const [isSubmittingRepair, setIsSubmittingRepair] = useState(false);

  // Complete repair modal
  const [repairToComplete, setRepairToComplete] = useState<RepairRecord | null>(null);
  const [completeWork, setCompleteWork] = useState('');
  const [completeFinalStatus, setCompleteFinalStatus] = useState<'reparado' | 'requiere_baja'>('reparado');

  // Deletion modals
  const [incidentToDelete, setIncidentToDelete] = useState<IncidentRecord | null>(null);
  const [repairToDelete, setRepairToDelete] = useState<RepairRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredIncidents = incidents.filter((i) =>
    !selectedPCFilter || i.pcNumber === selectedPCFilter
  );

  const filteredRepairs = repairs.filter((r) =>
    !selectedPCFilter || r.pcNumber === selectedPCFilter
  );

  const handleCreateRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairDiag.trim() || !repairWork.trim()) return;

    try {
      setIsSubmittingRepair(true);
      const partsArray = repairParts
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const created = await api.createRepair({
        pcNumber: repairPC,
        technicianName: repairTech,
        faultDiagnosis: repairDiag,
        workDone: repairWork,
        replacedParts: partsArray,
        costEstimate: repairCost ? Number(repairCost) : undefined,
        finalStatus: repairStatus,
      });

      // Auto download PDF order with exact report date and time!
      if (downloadRepairPDF && created) {
        const comp = computers.find((c) => c.pcNumber === repairPC);
        try {
          generateRepairOrderPDF(created, comp);
        } catch (pdfErr) {
          console.warn('Error generating repair PDF:', pdfErr);
        }
      }

      setShowNewRepairModal(false);
      setRepairDiag('');
      setRepairWork('');
      setRepairParts('');
      setRepairCost('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al crear orden técnica');
    } finally {
      setIsSubmittingRepair(false);
    }
  };

  const handleFinishRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairToComplete) return;

    try {
      await api.completeRepair(repairToComplete.id, {
        workDone: completeWork || repairToComplete.workDone,
        finalStatus: completeFinalStatus,
      });
      setRepairToComplete(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al completar orden');
    }
  };

  const handleConfirmDeleteIncident = async () => {
    if (!incidentToDelete) return;
    try {
      setIsDeleting(true);
      if (onDeleteIncident) {
        await onDeleteIncident(incidentToDelete.id);
      } else {
        await api.deleteIncident(incidentToDelete.id);
        onRefresh();
      }
      setIncidentToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la incidencia');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteRepair = async () => {
    if (!repairToDelete) return;
    try {
      setIsDeleting(true);
      if (onDeleteRepair) {
        await onDeleteRepair(repairToDelete.id);
      } else {
        await api.deleteRepair(repairToDelete.id);
        onRefresh();
      }
      setRepairToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la orden técnica');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <span>Gestión de Incidencias y Reparaciones Técnicas</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Registro rápido de fallas o daños por equipo con trazabilidad de órdenes técnicas de reparación.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenQuickIncident && (
            <button
              id="btn-view-report-incident"
              onClick={onOpenQuickIncident}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Reportar Incidencia</span>
            </button>
          )}

          <button
            id="btn-new-repair-order"
            onClick={() => setShowNewRepairModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden Técnica</span>
          </button>
        </div>
      </div>

      {/* Tabs and PC Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'incidents'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Incidencias y Fallas ({incidents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('repairs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'repairs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Historial de Reparaciones ({repairs.length})</span>
          </button>
        </div>

        <div className="w-full sm:w-60">
          <select
            value={selectedPCFilter}
            onChange={(e) => setSelectedPCFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="">Filtrar por PC: Todas</option>
            {computers.map((c) => (
              <option key={c.pcNumber} value={c.pcNumber}>
                {c.pcNumber} ({c.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Content: Incidents List */}
      {activeTab === 'incidents' && (
        <div className="space-y-3">
          {filteredIncidents.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl text-center border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
              No hay incidencias registradas con el filtro actual.
            </div>
          ) : (
            filteredIncidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white text-xs">
                      {inc.pcNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        inc.severity === 'critica'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : inc.severity === 'alta'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {inc.type} • Severidad: {inc.severity}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formatDateTime(inc.date)}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  {inc.description}
                </p>

                {inc.observations && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-[10.5px] uppercase text-slate-400 block mb-0.5">
                      Observaciones Técnicas Registradas:
                    </span>
                    <p>{inc.observations}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-x-3">
                    <span>Reportado por: <strong className="text-slate-700 dark:text-slate-300">{inc.reportedBy}</strong></span>
                    {inc.deliveryId && <span>• Préstamo: <strong className="text-slate-700 dark:text-slate-300">{inc.deliveryId}</strong></span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`btn-download-incident-${inc.id}`}
                      onClick={() => {
                        const comp = computers.find((c) => c.pcNumber === inc.pcNumber);
                        generateIncidentReportPDF(inc, comp);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      title="Descargar comprobante en PDF con fecha y hora de reporte"
                    >
                      <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Descargar PDF</span>
                    </button>

                    <button
                      type="button"
                      id={`btn-delete-incident-${inc.id}`}
                      onClick={() => setIncidentToDelete(inc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
                      title="Eliminar este reporte de incidencia"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content: Repairs List */}
      {activeTab === 'repairs' && (
        <div className="space-y-3">
          {filteredRepairs.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl text-center border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
              No hay reparaciones técnicas registradas.
            </div>
          ) : (
            filteredRepairs.map((rep) => (
              <div
                key={rep.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white text-xs">
                      {rep.pcNumber}
                    </span>
                    <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">
                      {rep.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        rep.finalStatus === 'reparado'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : rep.finalStatus === 'en_progreso'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {rep.finalStatus === 'en_progreso' ? 'En Taller / Reparación' : rep.finalStatus}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Iniciado: {formatDateOnly(rep.startDate)}
                    {rep.endDate && ` • Finalizado: ${formatDateOnly(rep.endDate)}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-[10.5px] uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      Diagnóstico Técnico de Falla
                    </span>
                    <p className="text-slate-800 dark:text-slate-200">{rep.faultDiagnosis}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-[10.5px] uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      Trabajo Efectuado / Solución
                    </span>
                    <p className="text-slate-800 dark:text-slate-200">{rep.workDone}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="space-x-2">
                    <span><strong>Técnico:</strong> {rep.technicianName}</span>
                    {rep.replacedParts && rep.replacedParts.length > 0 && (
                      <span>• <strong>Piezas:</strong> {rep.replacedParts.join(', ')}</span>
                    )}
                    {rep.costEstimate && (
                      <span>• <strong>Costo:</strong> ${rep.costEstimate.toFixed(2)} USD</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`btn-download-repair-${rep.id}`}
                      onClick={() => {
                        const comp = computers.find((c) => c.pcNumber === rep.pcNumber);
                        generateRepairOrderPDF(rep, comp);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      title="Descargar orden técnica en PDF con fecha y hora de reporte"
                    >
                      <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Descargar PDF</span>
                    </button>

                    {rep.finalStatus === 'en_progreso' && (
                      <button
                        type="button"
                        onClick={() => {
                          setRepairToComplete(rep);
                          setCompleteWork(rep.workDone);
                          setCompleteFinalStatus('reparado');
                        }}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
                      >
                        Finalizar y Habilitar PC
                      </button>
                    )}

                    <button
                      type="button"
                      id={`btn-delete-repair-${rep.id}`}
                      onClick={() => setRepairToDelete(rep)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
                      title="Eliminar esta orden técnica"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: Nueva Orden Técnica de Reparación */}
      {showNewRepairModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-500" />
                <span>Nueva Orden Técnica de Reparación</span>
              </h3>
              <button
                onClick={() => setShowNewRepairModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRepair} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Equipo a Reparar *
                  </label>
                  <select
                    value={repairPC}
                    onChange={(e) => setRepairPC(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                  >
                    {computers.map((c) => (
                      <option key={c.pcNumber} value={c.pcNumber}>
                        {c.pcNumber} ({c.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Técnico Responsable *
                  </label>
                  <input
                    type="text"
                    value={repairTech}
                    onChange={(e) => setRepairTech(e.target.value)}
                    placeholder="Ej. Ing. Soporte Técnico"
                    className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Diagnóstico de Falla *
                </label>
                <input
                  type="text"
                  value={repairDiag}
                  onChange={(e) => setRepairDiag(e.target.value)}
                  placeholder="Ej. Ventilador de CPU obstruido con recalentamiento"
                  className="w-full text-xs sm:text-sm p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trabajo a Realizar *
                </label>
                <textarea
                  rows={2}
                  value={repairWork}
                  onChange={(e) => setRepairWork(e.target.value)}
                  placeholder="Describa el procedimiento técnico o intervención planeada"
                  className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Repuestos / Piezas (separar por comas)
                  </label>
                  <input
                    type="text"
                    value={repairParts}
                    onChange={(e) => setRepairParts(e.target.value)}
                    placeholder="Ej. Pasta térmica, Ventilador 80mm"
                    className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Costo Estimado (USD)
                  </label>
                  <input
                    type="number"
                    value={repairCost}
                    onChange={(e) => setRepairCost(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* PDF Download Checkbox */}
              <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                <input
                  type="checkbox"
                  id="chk-repair-download-pdf"
                  checked={downloadRepairPDF}
                  onChange={(e) => setDownloadRepairPDF(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="chk-repair-download-pdf" className="cursor-pointer select-none flex items-center gap-1.5 font-medium">
                  <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Generar y descargar comprobante PDF con fecha y hora de reporte</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowNewRepairModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRepair}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRepair ? 'Guardando...' : 'Crear Orden y Generar PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación de Incidencia */}
      {incidentToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Eliminar Reporte de Incidencia?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta acción eliminará el reporte permanentemente del historial.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Equipo afectado:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{incidentToDelete.pcNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Fecha y Hora de reporte:</span>
                <span>{formatDateTime(incidentToDelete.date)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Severidad / Tipo:</span>
                <span className="uppercase font-semibold">{incidentToDelete.severity} • {incidentToDelete.type}</span>
              </div>
              <div className="text-slate-600 dark:text-slate-300 pt-1.5 border-t border-slate-200 dark:border-slate-800">
                <span className="font-semibold block mb-0.5">Descripción de la falla:</span>
                <p className="italic text-slate-800 dark:text-slate-200">{incidentToDelete.description}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIncidentToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteIncident}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar Incidencia'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación de Orden Técnica */}
      {repairToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Eliminar Orden Técnica?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Se removerá la orden técnica {repairToDelete.id} del historial.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="font-semibold">N° Orden / Equipo:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{repairToDelete.id} ({repairToDelete.pcNumber})</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Técnico:</span>
                <span>{repairToDelete.technicianName}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Fecha y Hora de reporte:</span>
                <span>{formatDateTime(repairToDelete.startDate)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Diagnóstico:</span>
                <span>{repairToDelete.faultDiagnosis}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRepairToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRepair}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar Orden'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Finalizar Reparación */}
      {repairToComplete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Finalizar Reparación ({repairToComplete.pcNumber})
              </h3>
              <button
                onClick={() => setRepairToComplete(null)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFinishRepair} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trabajo Final Efectuado
                </label>
                <textarea
                  rows={2}
                  value={completeWork}
                  onChange={(e) => setCompleteWork(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estado Final del Equipo
                </label>
                <select
                  value={completeFinalStatus}
                  onChange={(e) => setCompleteFinalStatus(e.target.value as any)}
                  className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="reparado">Reparado y Operativo (Pasa a Disponible)</option>
                  <option value="requiere_baja">Inoperativo irreversible (Dar de baja)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setRepairToComplete(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer"
                >
                  Guardar y Habilitar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
