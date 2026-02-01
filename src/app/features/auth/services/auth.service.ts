import {Injectable, signal} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {AuthLoginRequestDto} from "../dto/auth-login-request-dto";
import {AuthResponseDto} from "../dto/auth-response-dto";
import {tap} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly API_URL = 'http://localhost:8080/auth';

  token = signal<string | null>(localStorage.getItem('token'));

  constructor(private http: HttpClient) { }


  login(request: AuthLoginRequestDto) {
      console.log('REQUEST LOGIN', request);
    return this.http.post<AuthResponseDto>(`${this.API_URL}/login`, request)
        .pipe(
            tap(res => {
              localStorage.setItem('token', res.token);
              this.token.set(res.token);
            })
        );
  }

  logout() {
    localStorage.removeItem('token');
    this.token.set(null);
  }

  isAuthenticated() {
    return !!this.token();
  }
}
