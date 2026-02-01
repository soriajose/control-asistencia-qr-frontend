import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkshiftService } from "../workshift/services/workshift.service";
import { OrganizationConfigService } from "./services/organization-config.service";
import { WorkshiftResponseDto } from "../workshift/dto/workshift-response-dto";
import { WorkshiftRequestDto } from "../workshift/dto/workshift-request-dto";

@Component({
  selector: 'app-organization-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organization-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationConfigComponent implements OnInit {

  private workShiftService = inject(WorkshiftService);
  private organizationConfigService = inject(OrganizationConfigService);

  // --- ESTADO GLOBAL ---
  tolerance = signal(0);
  isSavingGlobal = signal(false);

  // --- ESTADO TOAST ---
  toast = signal<{ show: boolean, message: string, type: 'success' | 'error' }>({
    show: false, message: '', type: 'success'
  });

  // --- ESTADO DE TURNOS ---
  shifts = signal<WorkshiftResponseDto[]>([]);
  selectedShift = signal<WorkshiftResponseDto | null>(null);

  // --- ESTADO DE MODALES ---
  isModalOpen = signal(false);
  isConfirmModalOpen = signal(false);
  isDeleteModalOpen = signal(false);

  editingShiftId = signal<number | null>(null);
  shiftIdToDelete = signal<number | null>(null);
  isLoading = signal(false);

  tempShift = { name: '', startTime: '', endTime: '' };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.organizationConfigService.getTolerance().subscribe({
      next: (val) => this.tolerance.set(val),
      error: (e) => console.error('Error cargando tolerancia', e)
    });
    this.loadShifts();
  }

  loadShifts() {
    this.workShiftService.getWorkShifts().subscribe({
      next: (data) => {
        this.shifts.set(data);
        if (!this.selectedShift() && data.length > 0) {
          this.selectedShift.set(data[0]);
        }
      },
      error: (e) => console.error('Error cargando turnos', e)
    });
  }

  updateTolerance(value: number) {
    let parsedValue = parseInt(value.toString(), 10);

    if (isNaN(parsedValue) || parsedValue < 0) {
      parsedValue = 0;
    }

    this.tolerance.set(parsedValue);
  }

  saveGlobalRules() {
    this.isSavingGlobal.set(true);
    this.organizationConfigService.updateTolerance(this.tolerance()).subscribe({
      next: () => {
        this.isSavingGlobal.set(false)
        this.showToast('Reglas globales actualizadas correctamente', 'success');
      },
      error: () => {
        this.isSavingGlobal.set(false);
        this.showToast('Error al guardar configuración', 'error');
      }
    });
  }

  selectShiftForPreview(shift: WorkshiftResponseDto) {
    this.selectedShift.set(shift);
  }

  // --- ABM DE TURNOS ---

  openShiftModal() {
    this.editingShiftId.set(null);
    this.tempShift = { name: '', startTime: '', endTime: '' };
    this.isModalOpen.set(true);
  }

  editShift(shift: WorkshiftResponseDto) {
    this.editingShiftId.set(shift.id);
    this.tempShift = {
      name: shift.name,
      startTime: shift.startTime.substring(0, 5),
      endTime: shift.endTime.substring(0, 5)
    };
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  // --- PASO 1: PREGUNTAR ---
  askToSave() {
    if (!this.tempShift.name || !this.tempShift.startTime || !this.tempShift.endTime) {
      this.showToast('Completa todos los campos obligatorios', 'error');
      return;
    }
    this.isConfirmModalOpen.set(true);
  }

  closeConfirmModal() {
    this.isConfirmModalOpen.set(false);
  }

  // --- PASO 2: EJECUTAR (Renombrado a executeSave) ---
  executeSave() {
    this.isLoading.set(true); // Spinner ON

    const request: WorkshiftRequestDto = {
      name: this.tempShift.name,
      startTime: this.tempShift.startTime.length === 5 ? this.tempShift.startTime + ':00' : this.tempShift.startTime,
      endTime: this.tempShift.endTime.length === 5 ? this.tempShift.endTime + ':00' : this.tempShift.endTime
    };

    const currentId = this.editingShiftId(); // Capturamos ID

    if (currentId) {
      // EDITAR
      this.workShiftService.updateWorkShift(currentId, request).subscribe({
        next: () => {
          this.finalizeSave();
          this.showToast('Turno actualizado correctamente', 'success');
        },
        error: (err: any) => this.handleError(err)
      });
    } else {
      // CREAR
      this.workShiftService.createWorkShift(request).subscribe({
        next: () => {
          this.finalizeSave();
          this.showToast('Nuevo turno creado con éxito', 'success');
        },
        error: (err: any) => this.handleError(err)
      });
    }
  }

  // --- ELIMINAR ---
  askToDelete(id: number) {
    this.shiftIdToDelete.set(id);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.shiftIdToDelete.set(null);
  }

  confirmDelete() {
    const id = this.shiftIdToDelete();
    if (id) {
      this.isLoading.set(true);
      this.workShiftService.deleteWorkShift(id).subscribe({
        next: () => {
          if (this.selectedShift()?.id === id) this.selectedShift.set(null);
          this.loadShifts();
          this.isLoading.set(false);
          this.closeDeleteModal();
          this.showToast('Turno eliminado correctamente', 'success'); // <--- TOAST
        },
        error: (err: any) => {
          this.isLoading.set(false);
          this.closeDeleteModal();
          this.showToast(err.error?.message || 'No se pudo eliminar el turno', 'error');
        }
      });
    }
  }

  // --- HELPERS DE LIMPIEZA ---

  // Limpia todo tras guardar con éxito
  finalizeSave() {
    this.isLoading.set(false);       // Spinner OFF
    this.isConfirmModalOpen.set(false); // Cierra modal confirmar
    this.closeModal();               // Cierra formulario
    this.loadShifts();               // Recarga tabla
  }

  // Maneja error al guardar
  handleError(err: any) {
    this.isLoading.set(false);
    this.isConfirmModalOpen.set(false);
    console.error(err);
    this.showToast(err.error?.message || 'Ocurrió un error inesperado', 'error');
  }

  private showToast(message: string, type: 'success' | 'error') {
    this.toast.set({ show: true, message, type });
    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
      this.toast.update(t => ({ ...t, show: false }));
    }, 3000);
  }

  closeToast() {
    this.toast.update(t => ({ ...t, show: false }));
  }


  // --- CÁLCULOS VISUALES ---
  calculateLateTime(startTime: string): string {
    if (!startTime) return '--:--';
    const [h, m] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + this.tolerance());
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  calculateDuration(start: string, end: string): string {
    if (!start || !end) return '0';
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);

    let minutesStart = h1 * 60 + m1;
    let minutesEnd = h2 * 60 + m2;
    if (minutesEnd < minutesStart) minutesEnd += 24 * 60;

    const diffMinutes = minutesEnd - minutesStart;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return mins > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `${hours}`;
  }
}
