import { Component, ChangeDetectionStrategy, inject, computed, input, signal, AfterViewInit, OnDestroy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService, Employee } from '../../../../services/attendance.service';
import { EmployeeHistoryComponent } from '../employee-history/employee-history.component';

declare var Html5Qrcode: any;

@Component({
  selector: 'app-employee-view',
  standalone: true,
  imports: [CommonModule, EmployeeHistoryComponent],
  templateUrl: './employee-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeViewComponent implements AfterViewInit, OnDestroy {
  attendanceService = inject(AttendanceService);
  
  employee = input.required<Employee>();

  logout = output<void>();
  isSidebarOpen = signal(false);

  private html5Qrcode: any;
  private isScannerInitialized = false;

  activeView = signal<'scanner' | 'history'>('scanner');

  menuItems = signal([
    { id: 'scanner', label: 'Escanear QR', icon: 'pi pi-qrcode' },
    { id: 'history', label: 'Mi Historial', icon: 'pi pi-history' },
  ] as const);

  // Find the employee signal from the service to get live updates
  liveEmployee = computed(() => 
    this.attendanceService.employees().find(e => e.id === this.employee().id) || this.employee()
  );

  lastActionStatus = signal<{ success: boolean; message: string; employeeName: string; } | null>(null);
  scannerStatus = signal('Iniciando cámara...');
  isScanCooldown = signal(false);

  ngAfterViewInit(): void {
    // Defer scanner initialization until it's visible
    if (this.activeView() === 'scanner') {
      this.initializeScanner();
    }
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  onLogout() {
    this.logout.emit();
  }
  
  setView(view: 'scanner' | 'history') {
      this.activeView.set(view);
      this.lastActionStatus.set(null);
      this.isSidebarOpen.set(false); // Close sidebar on selection
      if (view === 'scanner' && !this.isScannerInitialized) {
          // Use timeout to allow the view to render before initializing
          setTimeout(() => this.initializeScanner(), 0);
      } else if (view !== 'scanner') {
        this.stopScanner();
      }
  }
  
  private initializeScanner(): void {
    if (this.isScannerInitialized || !document.getElementById('qr-reader')) {
      return;
    }
    this.isScannerInitialized = true;
    this.html5Qrcode = new Html5Qrcode('qr-reader');
    this.startScanner();
  }

  private startScanner(): void {
    if(!this.html5Qrcode) return;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    const onScanSuccess = (decodedText: string, decodedResult: any) => {
        this.handleScan(decodedText);
    };
    const onScanFailure = (error: string) => {
        // We can ignore this as it fires continuously when no QR is found
    };
    
    this.scannerStatus.set('Solicitando permisos de cámara...');
    this.html5Qrcode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
      .then(() => {
        this.scannerStatus.set('Cámara activa. Esperando código QR...');
      })
      .catch((err: string) => {
        console.error("Error al iniciar el escaner", err);
        this.scannerStatus.set('Error de cámara. Revisa los permisos.');
      });
  }

  private stopScanner(): void {
    if (this.html5Qrcode && this.isScannerInitialized) {
        this.html5Qrcode.stop()
            .then(() => {
              this.isScannerInitialized = false;
              console.log('QR Scanner stopped.');
            })
            .catch((err: string) => {
              console.error('Error stopping scanner', err)
            });
    }
  }
  
  simulateScan(): void {
    if (this.isScanCooldown()) {
      return;
    }
    const qrId = this.attendanceService.qrCode().id;
    if (qrId) {
      this.handleScan(qrId);
    } else {
      console.error('No QR code configured for simulation.');
      this.lastActionStatus.set({ success: false, message: 'No hay un código QR configurado en el sistema.', employeeName: '' });
    }
  }

  private handleScan(scannedId: string): void {
      if (this.isScanCooldown()) {
        return;
      }
      
      this.isScanCooldown.set(true);

      const isValidQR = this.attendanceService.qrCode().id === scannedId;

      if (isValidQR) {
          const result = this.attendanceService.toggleClockStatus(this.liveEmployee().id);
          this.lastActionStatus.set(result);
          this.scannerStatus.set('¡Escaneo exitoso! Espera un momento...');
      } else {
          this.lastActionStatus.set({ 
              success: false, 
              message: 'Código QR no válido. Por favor, escanea el código QR oficial.', 
              employeeName: this.liveEmployee().firstName 
          });
          this.scannerStatus.set('Código no válido. Inténtalo de nuevo en 3 segundos.');
      }
      
      // Hide status message after a few seconds
      setTimeout(() => this.lastActionStatus.set(null), 5000);

      // Cooldown period
      setTimeout(() => {
          this.isScanCooldown.set(false);
          // Only reset scanner status if the camera is still supposed to be active
          if (this.isScannerInitialized) {
              this.scannerStatus.set('Cámara activa. Esperando código QR...');
          }
      }, 3000); // 3-second cooldown
  }
}