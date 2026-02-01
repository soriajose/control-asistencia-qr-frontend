import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AttendanceService } from '../../../../services/attendance.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatePipe, CommonModule],
  templateUrl: './admin-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {

  attendanceService = inject(AttendanceService);

  // --- SEÑALES DE DATOS ---

  // 1. Estadísticas Generales (Mockeadas por ahora, vendrán del Service)
  stats = signal({
    present: 12,
    onTime: 10,
    late: 2,
    absent: 3
  });

  // 2. Alertas Críticas (Ej: Gente que no marcó salida ayer)
  alerts = signal([
    { message: 'Sin registro de salida ayer', employee: 'Carlos Gómez', date: new Date() },
    { message: '3 llegadas tarde esta semana', employee: 'Ana Silva', date: new Date() }
  ]);

  // --- PAGINACIÓN DE EMPLEADOS ---
  employeeStatusItemsPerPage = signal(5);
  employeeStatusCurrentPage = signal(1);

  employeeStatusTotalPages = computed(() => Math.ceil(this.attendanceService.employees().length / this.employeeStatusItemsPerPage()));

  paginatedEmployees = computed(() => {
    const start = (this.employeeStatusCurrentPage() - 1) * this.employeeStatusItemsPerPage();
    const end = start + this.employeeStatusItemsPerPage();
    return this.attendanceService.employees().slice(start, end);
  });

  // --- MÉTODOS DE PÁGINA ---
  nextEmployeeStatusPage() {
    if (this.employeeStatusCurrentPage() < this.employeeStatusTotalPages()) {
      this.employeeStatusCurrentPage.update(page => page + 1);
    }
  }

  previousEmployeeStatusPage() {
    if (this.employeeStatusCurrentPage() > 1) {
      this.employeeStatusCurrentPage.update(page => page - 1);
    }
  }
}
