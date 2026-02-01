import { Component, ChangeDetectionStrategy, signal, output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../../../services/attendance.service';
import { LoggedInUser } from '../../../../../app.component';
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  attendanceService = inject(AttendanceService);
  
  emailOrUsername = signal('');
  password = signal('');
  error = signal<string | null>(null);
  viewState = signal<'login' | 'forgotPassword' | 'confirmation'>('login');
  showPassword = signal(false);

  loginSuccess = output<void>();
  authService = inject(AuthService);
  private router = inject(Router);

  /* ESTE ES EL EJEMPLO HARDCODE
  login() {
    const username = this.emailOrUsername().trim();
    const password = this.password();

    // Check for admin
    if (username === 'admin@example.com' && password === 'password') {
      this.error.set(null);
      this.loginSuccess.emit({ role: 'admin' });
      return;
    }

    // Check for employee
    const employee = this.attendanceService.employees().find(
      emp => (emp.email === username || emp.username === username) && emp.password === password
    );

    if (employee) {
      this.error.set(null);
      this.loginSuccess.emit({ role: 'employee', data: employee });
      return;
    }

    this.error.set('Email, usuario o contraseña no válidos.');
    this.password.set('');
  } */

  login() {
    this.error.set(null);

    const subdomainOrganization = window.location.hostname.split('.')[0];

    this.authService.login({
      username: this.emailOrUsername(),
      password: this.password(),
      subdomain: subdomainOrganization,
    }).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);

        // Decodificamos token
        const payload = JSON.parse(atob(response.token.split('.')[1]));
        console.log('PAYLOAD', payload);

        /*
        // EJEMPLO CUANDO SE DEVUELVE UN SOLO ROL. REVISAR EN OTRO ESCENARIO
        // const role = payload.role ? payload.role.toUpperCase() : '';

        // Acá dependiendo del rol, si es admin muestro la info del admin en pantalla
        if (role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/employee']);
        }
         */


        // 3. Manejo de Roles Robusto
        // El backend manda algo como: "ADMIN,RRHH"
        const rolesString = payload.role ? payload.role.toUpperCase() : '';
        const rolesArray = rolesString.split(','); // Convertimos a lista: ['ADMIN', 'RRHH']

        // 4. Redirección inteligente
        if (rolesArray.includes('ADMIN')) {
          this.router.navigate(['/admin']);
        } else if (rolesArray.includes('EMPLOYEE')) {
          this.router.navigate(['/employee']);
        } else {
          // Caso por defecto si no tiene roles claros
          this.router.navigate(['/home']);
        }

      },
      error: () => {
        this.error.set('Email, usuario o contraseña no válidos.');
        this.password.set('');
      }
    });
  }
  
  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  switchToForgotPassword() {
    this.viewState.set('forgotPassword');
    this.error.set(null);
    this.password.set('');
  }
  
  switchToLogin() {
    this.viewState.set('login');
    this.error.set(null);
    this.password.set('');
  }

  onForgotPassword() {
    // Simulate sending an email
    this.viewState.set('confirmation');
  }
}
