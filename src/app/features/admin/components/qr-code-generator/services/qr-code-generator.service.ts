import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {QrData} from "../dto/qr-data";
import {tap} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class QrCodeGeneratorService {

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/organization'; // Ajusta tu puerto si es necesario

  constructor() {
  }

  loadCurrentQrCode() {
    return this.http.get<QrData>(this.apiUrl + '/current-qr');
  }


  regenerateQrToken() {
    return this.http.patch(this.apiUrl + '/regenerate-qr', {}, { responseType: 'text' });
  }


  updateQrName(newName: string) {
    return this.http.patch(this.apiUrl + '/update-qr-name', newName );
  }
}
