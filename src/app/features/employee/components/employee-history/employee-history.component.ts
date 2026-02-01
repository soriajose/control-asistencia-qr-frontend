import {Component, ChangeDetectionStrategy, computed, inject, input, signal, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService, Employee } from '../../../../services/attendance.service';

@Component({
  selector: 'app-employee-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeHistoryComponent implements OnInit {
  attendanceService = inject(AttendanceService);
  
  employee = input.required<Employee>();

  // Pagination state
  itemsPerPage = signal(10);
  currentPage = signal(1);


  ngOnInit() {

    this.getAllEmployee();

  }

  getAllEmployee() {

  }

  employeeHistory = computed(() => {
    const id = this.employee().id;
    if (!id) {
      return [];
    }
    return this.attendanceService.getEmployeeHistory(id);
  });

  // Computed values for pagination
  totalPages = computed(() => Math.ceil(this.employeeHistory().length / this.itemsPerPage()));
  paginatedHistory = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.employeeHistory().slice(start, end);
  });
  
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }

}
