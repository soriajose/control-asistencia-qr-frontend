import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import { AttendanceService } from '../../../../services/attendance.service'; // Ajusta los ../ según tu carpeta

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    CommonModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {

  attendanceService = inject(AttendanceService);

  // --- LÓGICA DE PAGINACIÓN DE EMPLEADOS ---
  employeeStatusItemsPerPage = signal(5);
  employeeStatusCurrentPage = signal(1);

  employeeStatusTotalPages = computed(() => Math.ceil(this.attendanceService.employees().length / this.employeeStatusItemsPerPage()));
  paginatedEmployees = computed(() => {
    const start = (this.employeeStatusCurrentPage() - 1) * this.employeeStatusItemsPerPage();
    const end = start + this.employeeStatusItemsPerPage();
    return this.attendanceService.employees().slice(start, end);
  });

  // --- LÓGICA DE PAGINACIÓN DE HISTORIAL ---
  sortedLog = computed(() => this.attendanceService.attendanceLog().slice().sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()));
  logItemsPerPage = signal(5);
  logCurrentPage = signal(1);

  logTotalPages = computed(() => Math.ceil(this.sortedLog().length / this.logItemsPerPage()));
  paginatedLog = computed(() => {
    const start = (this.logCurrentPage() - 1) * this.logItemsPerPage();
    const end = start + this.logItemsPerPage();
    return this.sortedLog().slice(start, end);
  });

  // --- MÉTODOS DE CAMBIO DE PÁGINA ---
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

  nextLogPage() {
    if (this.logCurrentPage() < this.logTotalPages()) {
      this.logCurrentPage.update(page => page + 1);
    }
  }

  previousLogPage() {
    if (this.logCurrentPage() > 1) {
      this.logCurrentPage.update(page => page - 1);
    }
  }

}
