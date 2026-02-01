import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class OrganizationConfigService {

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/organization';

  constructor() { }

  getTolerance() {
    return this.http.get<number>(this.apiUrl + '/tolerance');
  }

  updateTolerance(tolerance: number) {
    return this.http.put<void>(this.apiUrl + '/update-tolerance', tolerance);
  }


}
