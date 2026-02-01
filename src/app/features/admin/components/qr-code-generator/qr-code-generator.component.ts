import { Component, ChangeDetectionStrategy, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../../services/attendance.service';
import { toCanvas } from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {QrCodeGeneratorService} from "./services/qr-code-generator.service";
import {QrData} from "./dto/qr-data";

@Component({
  selector: 'app-qr-code-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qr-code-generator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrCodeGeneratorComponent {
  // Inyectamos el servicio real
  private qrCodeGeneratorService = inject(QrCodeGeneratorService);


  // Signal global para mantener el estado del QR actual en toda la app
  qrCode = signal<QrData>({ token: '', name: 'Cargando...' });

  isModalOpen = signal(false);
  qrCodeName = signal('');
  isRegenerateModalOpen = signal(false);
  isLoading = signal(false); // Para deshabilitar botones mientras carga

  constructor() {
    effect(() => {
      const data = this.qrCode();

      // Verificamos si tenemos un token válido para pintar
      if (data && data.token) {
        // Usamos un pequeño timeout para dar tiempo a que el HTML renderice el <canvas>
        setTimeout(() => {
          // Limpiamos el token de espacios o saltos de línea (\n) por seguridad
          this.generateQrCode(data.token.trim());
        }, 50);
      }
    });
    this.loadQrInfoCurrent();
  }

  loadQrInfoCurrent() {
    this.isLoading.set(true);
    this.qrCodeGeneratorService.loadCurrentQrCode().subscribe({
      next: value => {
        console.log('qrCodeGeneratorService.loadQrInfoCurrent', value);
        this.qrCode.set(value);
        this.isLoading.set(false);
      },
      error: error => {
        console.log('qrCodeGeneratorService.loadQrInfoCurrentError', error);
        this.isLoading.set(false);
      }
    });
  }

  private generateQrCode(token: string): void {
    const canvas = document.getElementById('qr-canvas-main');
    if (canvas) {
      toCanvas(canvas, token, { width: 350, margin: 2 }, (error: any) => {
        if (error) console.error(`Error generando QR:`, error);
      });
    }
  }

  // --- MODAL DE EDICIÓN DE NOMBRE ---
  openModal() {
    this.qrCodeName.set(this.qrCode().name);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveQrCode() {
    const newName = this.qrCodeName().trim();
    if(newName){
      this.isLoading.set(true);
      this.qrCodeGeneratorService.updateQrName(newName).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.loadQrInfoCurrent();
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          this.isLoading.set(false);
          alert('Error al actualizar nombre');
        }
      });
    }
  }

  regenerateId() {
    this.isRegenerateModalOpen.set(true);
  }

  closeRegenerateModal() {
    this.isRegenerateModalOpen.set(false);
  }

  confirmRegenerate() {
    this.isLoading.set(true);
    this.qrCodeGeneratorService.regenerateQrToken().subscribe({
      next: value => {
        this.isLoading.set(false);
        this.loadQrInfoCurrent();
        this.closeRegenerateModal();
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }


  async downloadPdf(): Promise<void> {
    const printableArea = document.getElementById('qr-code-printable-area');
    if (!printableArea) return;

    const canvas = await html2canvas(printableArea, {
      scale: 4,
      backgroundColor: '#ffffff'
    });

    const imageData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = 180;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;

    pdf.addImage(imageData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(`qr-asistencia-${this.qrCode().name}.pdf`);
  }
}
