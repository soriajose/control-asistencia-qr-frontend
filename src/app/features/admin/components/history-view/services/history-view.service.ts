import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {EmployeeComboResponseDto} from "../dto/employee-combo-response-dto";

@Injectable({
    providedIn: 'root'
})
export class HistoryViewService {

    constructor() {
    }

    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/api/attendance-history'; // Tu endpoint

    getAllEmployee() {
        return this.http.get<EmployeeComboResponseDto[]>(this.apiUrl + '/employees-combo');
    }

    getEmployeeHistory(employeeId: number) {
        return this.http.get<any[]>(`${this.apiUrl}/employee/${employeeId}`);
    }
}
