
import {Component, ChangeDetectionStrategy, computed, inject, signal, OnInit, effect} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../../services/attendance.service';
import {HistoryViewService} from "./services/history-view.service";
import {EmployeeComboResponseDto} from "./dto/employee-combo-response-dto";

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
    // 3. EFECTO MAGICO:
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

}
