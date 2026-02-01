import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";
import {EmployeeResponseDto} from "../dto/employee-response-dto";
import {Page} from "../dto/page";
import {EmployeeRequestDto} from "../dto/employee-request-dto";

@Injectable({
  providedIn: 'root'
})
export class EmployeeManagementService {

  constructor() { }

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/employees'; // Tu endpoint

  // 1. GET PAGINADO
  getEmployees(page: number, size: number, search: string = ''): Observable<Page<EmployeeResponseDto>> {
    const params = new HttpParams()
        .set('page', (page - 1).toString()) // Front: 1 -> Back: 0
        .set('size', size.toString())
        .set('search', search);

    return this.http.get<Page<EmployeeResponseDto>>(this.apiUrl, { params });
  }

  // 2. CREAR
  createEmployee(employee: EmployeeRequestDto): Observable<void> {
    return this.http.post<void>(this.apiUrl, employee);
  }

  // 3. EDITAR
  updateEmployee(id: number, employee: EmployeeRequestDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, employee);
  }

  // 4. ELIMINAR
  deleteEmployee(id: number): Observable<void> {
    return this.http.patch<void>(this.apiUrl + '/delete' + '/' + id, {});
  }
}
