import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Computer, DeliveryRecord, IncidentRecord, RepairRecord } from '../types';

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return 'Pendiente / En uso';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatDateOnly(isoString?: string | null): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * 1. Genera el Acta Oficial de Entrega / Comprobante Individual en PDF
 */
export function generateDeliveryReceiptPDF(delivery: DeliveryRecord, computer?: Computer) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SALA DE PROGRAMACIÓN - CONTROL DE EQUIPOS', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ACTA OFICIAL DE ENTREGA Y ASIGNACIÓN DE COMPUTADOR', 14, 20);

  doc.setFontSize(9);
  doc.text(`Folio: ${delivery.id}`, pageWidth - 50, 12);
  doc.text(`Emisión: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 50, 20);

  // Status Badge
  const statusColor = delivery.status === 'activo' ? [234, 88, 12] : delivery.status === 'devuelto_bien' ? [22, 163, 74] : [220, 38, 38];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - 65, 33, 50, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const statusLabel = delivery.status === 'activo' ? 'EN PRÉSTAMO ACTIVO' : delivery.status === 'devuelto_bien' ? 'DEVUELTO EN ORDEN' : 'DEVUELTO C/ NOVEDAD';
  doc.text(statusLabel, pageWidth - 40, 38.5, { align: 'center' });

  // Section 1: Datos de Asignación Académica
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Datos de la Asignación Académica', 14, 40);

  autoTable(doc, {
    startY: 44,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    body: [
      [
        { content: 'Docente / Profesor:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        delivery.teacherName,
        { content: 'Materia / Asignatura:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        delivery.subjectName,
      ],
      [
        { content: 'Alumno Asignado:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        delivery.studentName,
        { content: 'Curso / División:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        delivery.studentId,
      ],
      [
        { content: 'Fecha y Hora Entrega:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        formatDateTime(delivery.deliveryDate),
        { content: 'Fecha Devolución:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        formatDateTime(delivery.returnDate),
      ],
      [
        { content: 'Carrera / Programa:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        delivery.studentCareer || 'No especificada',
        { content: 'Registrado por:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        delivery.registeredBy || 'Encargado de Laboratorio',
      ],
    ],
  });

  // Section 2: Datos del Equipo y Hardware
  const lastY1 = (doc as any).lastAutoTable.finalY || 80;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Identificación del Equipo de Cómputo', 14, lastY1 + 10);

  autoTable(doc, {
    startY: lastY1 + 14,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    body: [
      [
        { content: 'Número de PC:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        delivery.pcNumber,
        { content: 'Modelo / Chasis:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        computer?.model || 'OptiPlex 7090 Tower',
      ],
      [
        { content: 'Procesador / CPU:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        computer?.processor || 'Intel Core i7 / AMD Ryzen',
        { content: 'Memoria RAM / Almacenamiento:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        `${computer?.ram || '16 GB'} / ${computer?.storage || '512 GB SSD'}`,
      ],
      [
        { content: 'Ubicación en Sala:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        computer?.locationRow || 'Mesa Central de Programación',
        { content: 'Sistema Operativo:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        computer?.os || 'Ubuntu Linux / Windows 11',
      ],
      [
        { content: 'Cargador / Alimentación:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        delivery.includesCharger
          ? `ENTREGADO CON CARGADOR: ${delivery.chargerNumber || 'Cargador asignado'} (PC Descargada)`
          : 'NO REQUERIDO (PC con carga / sin cargador adicional)',
        { content: 'Devolución de Cargador:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        delivery.includesCharger
          ? (delivery.chargerReturned ? 'DEVUELTO CONFORME' : (delivery.returnDate ? 'PENDIENTE / NO DEVUELTO' : 'EN PRÉSTAMO'))
          : 'N/A',
      ],
      [
        { content: 'Mouse Óptico USB:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        delivery.includesMouse
          ? `ENTREGADO CON MOUSE: ${delivery.mouseNumber || 'Mouse asignado'}${delivery.mouseBrand ? ` (${delivery.mouseBrand})` : ''}`
          : 'NO REQUERIDO (Uso con touchpad / sin mouse adicional)',
        { content: 'Devolución de Mouse:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        delivery.includesMouse
          ? (delivery.mouseReturned ? 'DEVUELTO CONFORME' : (delivery.returnDate ? 'PENDIENTE / NO DEVUELTO' : 'EN PRÉSTAMO'))
          : 'N/A',
      ],
    ],
  });

  // Section 3: Observaciones y Daños Previos / Devolución
  const lastY2 = (doc as any).lastAutoTable.finalY || 135;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Observaciones Técnicas (Fallas, Daños Previos y Retorno)', 14, lastY2 + 10);

  autoTable(doc, {
    startY: lastY2 + 14,
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
    body: [
      [
        {
          content: `OBSERVACIONES DE ENTREGA (Fallas o daño previo registrado):\n${delivery.observations || 'Sin daños previos reportados. El equipo y periféricos se entregan en buen estado.'}`,
          styles: { fillColor: [254, 243, 199], textColor: [120, 53, 15] }, // amber-100
        },
      ],
      [
        {
          content: `OBSERVACIONES DE DEVOLUCIÓN:\n${delivery.returnObservations || (delivery.status === 'activo' ? 'Equipo aún en uso por el estudiante en la sesión académica.' : 'Devolución conforme.')}`,
          styles: { fillColor: [241, 245, 249], textColor: [30, 41, 59] }, // slate-100
        },
      ],
    ],
  });

  // Section 4: Compromiso y Firmas
  const lastY3 = (doc as any).lastAutoTable.finalY || 200;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Declaración: El alumno se compromete al uso ético y cuidado de los componentes de hardware y software de la sala.\nCualquier anomalía debe notificarse inmediatamente al docente y al administrador.',
    14,
    lastY3 + 8
  );

  const signY = lastY3 + 30;

  // Signatures lines
  doc.setDrawColor(148, 163, 184);
  doc.line(18, signY, 68, signY);
  doc.line(78, signY, 128, signY);
  doc.line(138, signY, 188, signY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Firma del Alumno', 43, signY + 5, { align: 'center' });
  doc.text(delivery.studentName, 43, signY + 9, { align: 'center' });

  doc.text('Firma del Docente', 103, signY + 5, { align: 'center' });
  doc.text(delivery.teacherName, 103, signY + 9, { align: 'center' });

  doc.text('Responsable de Sala', 163, signY + 5, { align: 'center' });
  doc.text(delivery.registeredBy || 'Administrador', 163, signY + 9, { align: 'center' });

  doc.save(`Acta_Entrega_${delivery.pcNumber}_${delivery.id}.pdf`);
}

/**
 * 2. Genera el Reporte Detallado Filtrable por Docente y Fecha en PDF
 */
export function generateDeliveriesReportPDF(
  deliveries: DeliveryRecord[],
  filters: {
    teacherName?: string;
    startDate?: string;
    endDate?: string;
    subjectName?: string;
  }
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DETALLADO DE CONTROL DE ENTREGA DE EQUIPOS', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('SALA DE PROGRAMACIÓN - REGISTRO HISTÓRICO Y OBSERVACIONES', 14, 18);

  doc.text(`Fecha de Emisión: ${new Date().toLocaleString('es-ES')}`, pageWidth - 70, 11);
  doc.text(`Total de Asignaciones: ${deliveries.length}`, pageWidth - 70, 18);

  // Filter Details Bar
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 28, pageWidth - 28, 12, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');

  const teacherTxt = filters.teacherName ? `Docente: ${filters.teacherName}` : 'Docente: Todos';
  const rangeTxt = `Rango Fechas: ${filters.startDate ? formatDateOnly(filters.startDate) : 'Inicio'} al ${filters.endDate ? formatDateOnly(filters.endDate) : 'Hoy'}`;
  const subjectTxt = filters.subjectName ? `Materia: ${filters.subjectName}` : 'Materia: Todas';

  doc.text(teacherTxt, 18, 35);
  doc.text(rangeTxt, 105, 35);
  doc.text(subjectTxt, 205, 35);

  // Table with explicit Observaciones column for fallas o daños previos
  const rows = deliveries.map((d) => [
    d.pcNumber,
    `${d.studentName}${d.studentId ? `\nCurso: ${d.studentId}` : ''}`,
    d.teacherName,
    d.subjectName,
    formatDateTime(d.deliveryDate),
    formatDateTime(d.returnDate),
    d.status === 'activo' ? 'En Uso' : d.status === 'devuelto_bien' ? 'Devuelto OK' : 'Con Novedad',
    // Detailed observations column highlighting prior damage and return condition
    `Entrega: ${d.observations || 'Sin daños previos'}\nDevolución: ${d.returnObservations || (d.status === 'activo' ? 'Pendiente' : 'OK')}`,
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['PC', 'Alumno / Curso', 'Docente / Profesor', 'Materia', 'F. Entrega', 'F. Devolución', 'Estado', 'Observaciones (Fallas o Daños)']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 15, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 36 },
      2: { cellWidth: 34 },
      3: { cellWidth: 38 },
      4: { cellWidth: 26 },
      5: { cellWidth: 26 },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'Con Novedad') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'En Uso') {
          data.cell.styles.textColor = [234, 88, 12];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [22, 163, 74];
        }
      }
    },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${pageCount} - Sistema de Control de Sala de Programación`, pageWidth / 2, doc.internal.pageSize.getHeight() - 6, {
      align: 'center',
    });
  }

  const teacherSuffix = filters.teacherName ? `_${filters.teacherName.replace(/\s+/g, '_')}` : '';
  doc.save(`Reporte_Entregas_SalaProgramacion${teacherSuffix}.pdf`);
}

/**
 * 3. Genera la Hoja de Vida y Trazabilidad de Equipo en PDF
 */
export function generateEquipmentHistoryPDF(
  computer: Computer,
  deliveries: DeliveryRecord[],
  incidents: IncidentRecord[],
  repairs: RepairRecord[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(`HOJA DE VIDA Y TRAZABILIDAD: ${computer.pcNumber}`, 14, 12);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('HISTORIAL TÉCNICO, USUARIOS ASIGNADOS, INCIDENCIAS Y REPARACIONES', 14, 20);

  // Technical Specs Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Especificaciones de Hardware y Estado General', 14, 36);

  autoTable(doc, {
    startY: 40,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.5 },
    body: [
      [
        { content: 'Modelo:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        computer.model,
        { content: 'Procesador:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        computer.processor,
      ],
      [
        { content: 'Memoria RAM:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        computer.ram,
        { content: 'Almacenamiento:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        computer.storage,
      ],
      [
        { content: 'Sistema Operativo:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        computer.os,
        { content: 'Ubicación en Sala:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        computer.locationRow,
      ],
      [
        { content: 'Total de Préstamos:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        `${computer.totalLoansCount} asignaciones`,
        { content: 'Horas Acumuladas:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        `${computer.totalUsageHours} hrs de uso`,
      ],
      [
        { content: 'Índice de Salud:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        `${computer.healthScore}%`,
        { content: 'Último Mantenimiento:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        formatDateOnly(computer.lastMaintenanceDate),
      ],
    ],
  });

  // Deliveries history
  let currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Historial de Usuarios Asignados (${deliveries.length} registros)`, 14, currentY);

  autoTable(doc, {
    startY: currentY + 4,
    theme: 'striped',
    head: [['Alumno', 'Matrícula', 'Docente', 'Materia', 'F. Entrega', 'F. Retorno', 'Observaciones / Daño']],
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { font: 'helvetica', fontSize: 7, cellPadding: 2 },
    body: deliveries.slice(0, 15).map((d) => [
      d.studentName,
      d.studentId,
      d.teacherName,
      d.subjectName,
      formatDateOnly(d.deliveryDate),
      formatDateOnly(d.returnDate),
      d.observations || 'Sin novedades',
    ]),
  });

  // Incidents history
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Historial de Incidencias Técnicas (${incidents.length} reportes)`, 14, currentY);

  autoTable(doc, {
    startY: currentY + 4,
    theme: 'grid',
    head: [['Fecha', 'Tipo', 'Severidad', 'Reportado por', 'Descripción', 'Observaciones']],
    headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { font: 'helvetica', fontSize: 7, cellPadding: 2 },
    body: incidents.length
      ? incidents.map((i) => [
          formatDateOnly(i.date),
          i.type.toUpperCase(),
          i.severity.toUpperCase(),
          i.reportedBy,
          i.description,
          i.observations || 'N/A',
        ])
      : [['N/A', 'N/A', 'N/A', 'N/A', 'No registra incidencias', 'Sin historial de daños']],
  });

  // Technical repairs history
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Historial de Reparaciones Técnicas (${repairs.length} intervenciones)`, 14, currentY);

  autoTable(doc, {
    startY: currentY + 4,
    theme: 'grid',
    head: [['Orden', 'Inicio', 'Técnico', 'Diagnóstico', 'Trabajo Realizado', 'Piezas', 'Estado']],
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { font: 'helvetica', fontSize: 7, cellPadding: 2 },
    body: repairs.length
      ? repairs.map((r) => [
          r.id,
          formatDateOnly(r.startDate),
          r.technicianName,
          r.faultDiagnosis,
          r.workDone,
          r.replacedParts.join(', ') || 'Ninguna',
          r.finalStatus.toUpperCase(),
        ])
      : [['N/A', 'N/A', 'N/A', 'No registra reparaciones', 'Mantenimiento de fábrica', 'Ninguna', 'OPERATIVO']],
  });

  doc.save(`Hoja_Vida_${computer.pcNumber}.pdf`);
}

/**
 * 4. Genera la Planilla Oficial de PCs Prestadas a Estudiantes (para control e impresión)
 */
export function generateBorrowedPCsStudentsReportPDF(
  borrowedDeliveries: DeliveryRecord[],
  options?: {
    title?: string;
    subTitle?: string;
  }
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(options?.title || 'SALA DE PROGRAMACIÓN - PLANILLA DE EQUIPOS PRESTADOS A ESTUDIANTES', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    options?.subTitle || 'REGISTRO GENERAL DE ESTUDIANTES CON NOTEBOOKS / COMPUTADORAS EN USO ACTIVO',
    14,
    18
  );

  doc.text(`Fecha y Hora: ${new Date().toLocaleString('es-ES')}`, pageWidth - 70, 11);
  doc.text(`Equipos en Planilla: ${borrowedDeliveries.length}`, pageWidth - 70, 18);

  // Stats Sub-header Bar
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 28, pageWidth - 28, 11, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');

  const activeCount = borrowedDeliveries.filter((d) => d.status === 'activo').length;
  const withChargerCount = borrowedDeliveries.filter((d) => d.includesCharger).length;
  const withMouseCount = borrowedDeliveries.filter((d) => d.includesMouse).length;
  const uniqueStudents = new Set(borrowedDeliveries.map((d) => d.studentName)).size;
  const teachersInvolved = Array.from(new Set(borrowedDeliveries.map((d) => d.teacherName))).filter(Boolean);

  doc.text(
    `Equipos Registrados: ${borrowedDeliveries.length} (${activeCount} en uso activo • ${withChargerCount} con cargador • ${withMouseCount} con mouse)`,
    18,
    35
  );
  doc.text(`Alumnos: ${uniqueStudents}`, 145, 35);
  doc.text(
    `Docentes: ${teachersInvolved.length > 0 ? teachersInvolved.slice(0, 2).join(', ') + (teachersInvolved.length > 2 ? '...' : '') : 'Varios'}`,
    200,
    35
  );

  // Table
  const rows = borrowedDeliveries.map((d) => {
    let accessories = '';
    if (d.includesCharger) accessories += `\n+ ${d.chargerNumber || 'Cargador'}`;
    if (d.includesMouse) accessories += `\n+ Mouse ${d.mouseNumber || 'USB'}${d.mouseBrand ? ` (${d.mouseBrand})` : ''}`;

    let obsNote = d.observations || 'Sin daños previos declarados';
    return [
      `${d.pcNumber}${accessories}`,
      d.studentName,
      d.studentId || 'N/A',
      d.teacherName,
      d.subjectName,
      formatDateTime(d.deliveryDate),
      d.status === 'activo'
        ? 'EN PRÉSTAMO'
        : d.status === 'devuelto_bien'
        ? 'DEVUELTO OK'
        : 'C/ NOVEDAD',
      obsNote,
      '__________________', // Espacio para firma de conformidad
    ];
  });

  autoTable(doc, {
    startY: 43,
    head: [
      [
        'N° PC / Accesorios',
        'Estudiante / Alumno',
        'Curso / División',
        'Docente a Cargo',
        'Materia / Cátedra',
        'Hora Entrega',
        'Estado',
        'Observaciones / Estado Previo',
        'Firma Conformidad',
      ],
    ],
    body: rows.length > 0 ? rows : [['-', 'No hay equipos en préstamo registrados en este momento', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 40, fontStyle: 'bold' },
      2: { cellWidth: 24 },
      3: { cellWidth: 32 },
      4: { cellWidth: 32 },
      5: { cellWidth: 25 },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 35 },
      8: { cellWidth: 28, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'EN PRÉSTAMO') {
          data.cell.styles.textColor = [234, 88, 12];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'C/ NOVEDAD') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [22, 163, 74];
        }
      }
    },
  });

  // Signatures Section at the end of the last table or page
  let finalY = (doc as any).lastAutoTable.finalY + 14;
  if (finalY > pageHeight - 32) {
    doc.addPage();
    finalY = 25;
  }

  // Signature lines
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);

  // Line 1: Preceptor / Pañolero
  doc.line(25, finalY, 85, finalY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Preceptor / Responsable de Sala', 55, finalY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Firma y Aclaración', 55, finalY + 7.5, { align: 'center' });

  // Line 2: Docente de Turno
  doc.line(115, finalY, 175, finalY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Docente / Profesor de Turno', 145, finalY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Firma y Aclaración', 145, finalY + 7.5, { align: 'center' });

  // Line 3: Autoridad / Coordinador
  doc.line(205, finalY, 265, finalY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Coordinación / Jefatura de Informática', 235, finalY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Firma y Sello', 235, finalY + 7.5, { align: 'center' });

  // Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} - Planilla Oficial de Equipos Prestados a Estudiantes`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const dateSlug = new Date().toISOString().slice(0, 10);
  doc.save(`Planilla_PCs_Prestadas_Estudiantes_${dateSlug}.pdf`);
}

/**
 * 5. Genera el Comprobante Oficial de Incidencia / Reporte Técnico en PDF
 * Incluye fecha y hora exacta de reporte, datos del equipo y firmas de trazabilidad.
 */
export function generateIncidentReportPDF(incident: IncidentRecord, computer?: Computer) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header banner (Rose / Slate styling)
  doc.setFillColor(159, 18, 57); // rose-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('SALA DE PROGRAMACIÓN - CONTROL DE EQUIPOS', 14, 12);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPROBANTE OFICIAL DE REPORTE DE INCIDENCIA TÉCNICA', 14, 20);

  doc.setFontSize(9);
  doc.text(`Folio: ${incident.id}`, pageWidth - 14, 12, { align: 'right' });
  doc.text(`Fecha y Hora de Reporte: ${formatDateTime(incident.date)}`, pageWidth - 14, 20, { align: 'right' });

  // Severity Badge
  const sev = (incident.severity || 'media').toLowerCase();
  const sevColor =
    sev === 'critica'
      ? [225, 29, 72] // rose-600
      : sev === 'alta'
      ? [234, 88, 12] // orange-600
      : sev === 'media'
      ? [202, 138, 4] // amber-600
      : [37, 99, 235]; // blue-600

  doc.setFillColor(sevColor[0], sevColor[1], sevColor[2]);
  doc.roundedRect(pageWidth - 65, 33, 51, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`SEVERIDAD: ${sev.toUpperCase()}`, pageWidth - 39.5, 38.5, { align: 'center' });

  // Section 1: Datos del Reporte
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Datos de la Incidencia y Equipo Afectado', 14, 40);

  const pcDetails = computer
    ? `${incident.pcNumber} (${computer.brand || ''} ${computer.model || ''}) - Serie: ${computer.serialNumber || 'N/D'}`
    : incident.pcNumber;

  autoTable(doc, {
    startY: 44,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    body: [
      [
        { content: 'Equipo / Identificador:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        pcDetails,
        { content: 'Tipo de Incidencia:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        (incident.type || 'hardware').toUpperCase(),
      ],
      [
        { content: 'Reportado Por:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        incident.reportedBy || 'Operador de Sala / Docente',
        { content: 'Fecha y Hora Exacta:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        formatDateTime(incident.date),
      ],
      [
        { content: 'Asociado a Préstamo:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        incident.deliveryId ? `Préstamo ${incident.deliveryId}` : 'Reporte directo en sala (Sin préstamo activo)',
        { content: 'Estado de Resolución:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        incident.resolved ? 'RESUELTO / EN SERVICIO' : 'ABIERTA / PENDIENTE DE REVISIÓN',
      ],
    ],
  });

  // Section 2: Descripción y Observaciones Técnicas
  const currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Detalle de la Falla y Observaciones Técnicas', 14, currentY);

  autoTable(doc, {
    startY: currentY + 4,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3.5 },
    body: [
      [
        { content: 'Descripción de la Falla o Problema:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold', cellWidth: 55 } },
        incident.description,
      ],
      [
        { content: 'Observaciones Técnicas Registradas:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold', cellWidth: 55 } },
        incident.observations || 'Sin observaciones adicionales registradas.',
      ],
      [
        { content: 'Procedimiento Sugerido:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold', cellWidth: 55 } },
        sev === 'critica' || sev === 'alta'
          ? 'Retirar inmediatamente de disponibilidad. Trasladar a banco de servicio técnico para diagnóstico y reparación.'
          : 'Verificar periféricos y conexiones en sala. Si la falla persiste, derivar a orden técnica de mantenimiento.',
      ],
    ],
  });

  // Signatures Section
  let signY = (doc as any).lastAutoTable.finalY + 22;
  if (signY > pageHeight - 35) {
    doc.addPage();
    signY = 35;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);

  // Line 1: Reportante
  doc.line(20, signY, 90, signY);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Docente / Operador Reportante', 55, signY + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(incident.reportedBy || 'Firma y Aclaración', 55, signY + 8.5, { align: 'center' });

  // Line 2: Responsable Técnico
  doc.line(120, signY, 190, signY);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Responsable de Pañol / Soporte Técnico', 155, signY + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Firma y Sello de Recepción Técnica', 155, signY + 8.5, { align: 'center' });

  // Footer notes & page number
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento oficial generado el ${new Date().toLocaleString('es-ES')} - Sala de Programación`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  const cleanPC = (incident.pcNumber || 'PC').replace(/\s+/g, '-');
  doc.save(`Comprobante_Incidencia_${cleanPC}_${incident.id}.pdf`);
}

/**
 * 6. Genera la Orden Técnica Oficial de Reparación en PDF
 * Incluye diagnóstico, trabajos realizados, repuestos, costos y firmas.
 */
export function generateRepairOrderPDF(repair: RepairRecord, computer?: Computer) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header banner (Blue-900 / Slate)
  doc.setFillColor(30, 58, 138); // blue-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('SALA DE PROGRAMACIÓN - SERVICIO TÉCNICO', 14, 12);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('ORDEN OFICIAL DE REPARACIÓN Y MANTENIMIENTO TÉCNICO', 14, 20);

  doc.setFontSize(9);
  doc.text(`N° Orden: ${repair.id}`, pageWidth - 14, 12, { align: 'right' });
  doc.text(`Fecha y Hora de Reporte: ${formatDateTime(repair.startDate)}`, pageWidth - 14, 20, { align: 'right' });

  // Status Badge
  const st = repair.finalStatus || 'en_progreso';
  const stColor =
    st === 'reparado'
      ? [22, 163, 74] // emerald-600
      : st === 'en_progreso'
      ? [234, 88, 12] // orange-600
      : [220, 38, 38]; // rose-600

  const stLabel =
    st === 'reparado'
      ? 'REPARACIÓN FINALIZADA'
      : st === 'en_progreso'
      ? 'EN TALLER / EN PROGRESO'
      : 'REQUIERE BAJA DEFINITIVA';

  doc.setFillColor(stColor[0], stColor[1], stColor[2]);
  doc.roundedRect(pageWidth - 70, 33, 56, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(stLabel, pageWidth - 42, 38.5, { align: 'center' });

  // Section 1: Datos de la Orden Técnica
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Datos Generales de la Orden Técnica', 14, 40);

  const pcDetails = computer
    ? `${repair.pcNumber} (${computer.brand || ''} ${computer.model || ''}) - Serie: ${computer.serialNumber || 'N/D'}`
    : repair.pcNumber;

  autoTable(doc, {
    startY: 44,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    body: [
      [
        { content: 'Equipo Intervenido:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        pcDetails,
        { content: 'Técnico Responsable:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        repair.technicianName,
      ],
      [
        { content: 'Fecha y Hora Apertura:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        formatDateTime(repair.startDate),
        { content: 'Fecha de Cierre:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        formatDateTime(repair.endDate),
      ],
      [
        { content: 'Costo Estimado / Total:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        repair.costEstimate !== undefined ? `$${repair.costEstimate.toFixed(2)} USD` : 'Sin costo adicional (Interno)',
        { content: 'Estado del Servicio:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold' } },
        stLabel,
      ],
    ],
  });

  // Section 2: Diagnóstico y Trabajo Efectuado
  const currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Diagnóstico Técnico y Procedimiento Realizado', 14, currentY);

  const partsText =
    repair.replacedParts && repair.replacedParts.length > 0
      ? repair.replacedParts.join(', ')
      : 'Ninguno (Reparación / mantenimiento sin sustitución de partes)';

  autoTable(doc, {
    startY: currentY + 4,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3.5 },
    body: [
      [
        { content: 'Diagnóstico de la Falla:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold', cellWidth: 55 } },
        repair.faultDiagnosis,
      ],
      [
        { content: 'Trabajo Efectuado / Solución:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold', cellWidth: 55 } },
        repair.workDone,
      ],
      [
        { content: 'Piezas / Repuestos Utilizados:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold', cellWidth: 55 } },
        partsText,
      ],
      [
        { content: 'Observaciones Finales:', styles: { fillColor: [248, 250, 252], fontStyle: 'bold', cellWidth: 55 } },
        repair.observations || 'Equipo probado y verificado según protocolo de laboratorio.',
      ],
    ],
  });

  // Signatures Section
  let signY = (doc as any).lastAutoTable.finalY + 22;
  if (signY > pageHeight - 35) {
    doc.addPage();
    signY = 35;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);

  // Line 1: Técnico
  doc.line(20, signY, 90, signY);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Técnico Responsable', 55, signY + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(repair.technicianName || 'Firma y Matrícula', 55, signY + 8.5, { align: 'center' });

  // Line 2: Coordinación / Aprobación
  doc.line(120, signY, 190, signY);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Coordinación / Jefatura de Sala', 155, signY + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Conformidad y Habilitación de Equipo', 155, signY + 8.5, { align: 'center' });

  // Footer notes & page number
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento técnico oficial emitido el ${new Date().toLocaleString('es-ES')} - Sala de Programación`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  const cleanPC = (repair.pcNumber || 'PC').replace(/\s+/g, '-');
  doc.save(`Orden_Tecnica_${cleanPC}_${repair.id}.pdf`);
}
