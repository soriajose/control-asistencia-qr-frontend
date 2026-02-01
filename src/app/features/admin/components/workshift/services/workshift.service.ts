import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {WorkshiftResponseDto} from "../dto/workshift-response-dto";
import {WorkshiftRequestDto} from "../dto/workshift-request-dto";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class WorkshiftService {

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/work-shifts';

  constructor() { }

  getWorkShifts() {
    return this.http.get<WorkshiftResponseDto[]>(this.apiUrl + '/list');
  }

  createWorkShift(request: WorkshiftRequestDto) {
    return this.http.post<number>(this.apiUrl, request);
  }

  updateWorkShift(id: number, request: WorkshiftRequestDto) {
    return this.http.put<number>(this.apiUrl + '/' + id, request);
  }

  deleteWorkShift(id: number) {
    return this.http.delete<void>(this.apiUrl + '/' + id);
  }

}
