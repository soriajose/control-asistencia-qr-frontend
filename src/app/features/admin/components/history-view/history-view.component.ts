
import {Component, ChangeDetectionStrategy, computed, inject, signal, OnInit, effect} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../../services/attendance.service';
import {HistoryViewService} from "./services/history-view.service";
import {EmployeeComboResponseDto} from "./dto/employee-combo-response-dto";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";

@Component({
  selector: 'app-history-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './history-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryViewComponent implements OnInit {
  historyViewService = inject(HistoryViewService);

  // 1. CORRECCIÓN: Ahora es una Signal para que el HTML funcione
  allEmployees = signal<EmployeeComboResponseDto[]>([]);

  // El ID seleccionado (El HTML lo tratará como string, así que lo parsearemos)
  selectedEmployeeId = signal<string>('');

  // 2. CORRECCIÓN: Signal normal, no computed (porque los datos vienen de la API)
  employeeHistory = signal<any[]>([]);

  constructor() {
    // Escucha cambios en 'selectedEmployeeId'. Cuando eliges a alguien en el combo,
    // esto se dispara solo y busca los datos.
    effect(() => {
      const idStr = this.selectedEmployeeId();

      if (idStr) {
        const id = Number(idStr); // Convertimos string a number para el back
        this.loadHistory(id);
      } else {
        this.employeeHistory.set([]); // Limpiamos si no hay selección
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(){
    this.loadAllEmployees();
  }

  loadAllEmployees(){
    this.historyViewService.getAllEmployee().subscribe({
      next: (data) => {
        // Guardamos los datos en la señal
        this.allEmployees.set(data);
      },
      error: (error) => console.error('Error cargando empleados:', error)
    });
  }

  loadHistory(id: number) {
    this.historyViewService.getEmployeeHistory(id).subscribe({
      next: (data) => {
        console.log('HISTORY', data);
        this.employeeHistory.set(data);
      },
      error: (err) => console.error('Error historial:', err)
    });
  }

  // Este sí puede ser computed porque calcula datos en base a lo que ya tenemos en memoria
  selectedEmployeeName = computed(() => {
    const id = this.selectedEmployeeId();
    if (!id) return '';

    // Buscamos en la señal de empleados
    const employee = this.allEmployees().find(e => e.id === Number(id));
    return employee ? `${employee.firstName} ${employee.lastName}` : '';
  });

  downloadReport() {
    const history = this.employeeHistory();
    const employeeName = this.selectedEmployeeName();

    // Validación de seguridad
    if (!history || history.length === 0) return;

    // A. Crear documento
    const doc = new jsPDF();

    // B. Encabezado del PDF
    doc.setFontSize(18);
    doc.text('Reporte de Asistencia', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100); // Gris oscuro
    doc.text(`Empleado: ${employeeName}`, 14, 28);
    // Fecha actual formateada (Argentina)
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 14, 34);

    // C. Preparar los datos (Formateo manual para la tabla)
    const tableData = history.map(session => {
      // 1. Formatear Fecha (ej: Lunes, 25 de Enero de 2026)
      const dateObj = new Date(session.clockIn);
      const dateStr = dateObj.toLocaleDateString('es-AR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      // Capitalizar la primera letra (opcional, estética)
      const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

      // 2. Formatear Hora Entrada
      const inTime = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      // 3. Formatear Hora Salida
      let outTime = '-';
      if (session.clockOut) {
        outTime = new Date(session.clockOut).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      } else {
        outTime = 'En curso';
      }

      // 4. Duración
      const duration = session.duration ? session.duration : '-';

      return [dateFormatted, inTime, outTime, duration];
    });

    // D. Generar la tabla automática con jspdf-autotable
    autoTable(doc, {
      startY: 40, // Empezar debajo del encabezado
      head: [['Fecha', 'Entrada', 'Salida', 'Duración']],
      body: tableData,
      theme: 'striped', // Diseño a rayas
      headStyles: { fillColor: [79, 70, 229] }, // Color Indigo-600
      styles: { fontSize: 10, cellPadding: 3 },
    });

    // E. Guardar archivo
    // Limpiamos el nombre de espacios para el archivo
    const cleanName = employeeName.replace(/\s+/g, '_');
    doc.save(`Asistencia_${cleanName}.pdf`);
  }

}
