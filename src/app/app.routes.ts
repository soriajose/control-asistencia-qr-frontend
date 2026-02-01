import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/components/login/login.component';
import { AdminViewComponent } from './features/admin/components/admin-view/admin-view.component';
import { EmployeeViewComponent } from './features/employee/components/employee-view/employee-view.component';
import { inject } from '@angular/core';
import { AuthService } from './features/auth/services/auth.service';
import { Router } from '@angular/router';

// Componentes Hijos del Admin (¡Nuevos imports!)
import { AdminDashboardComponent } from './features/admin/components/admin-dashboard/admin-dashboard.component';
import { EmployeeManagementComponent } from './features/admin/components/employee-management/employee-management.component';
import { HistoryViewComponent } from './features/admin/components/history-view/history-view.component';
import { QrCodeGeneratorComponent } from './features/admin/components/qr-code-generator/qr-code-generator.component';

// --- GUARDIA DE SEGURIDAD (AuthGuard) ---
// Esto evita que alguien escriba "/admin" y entre sin loguearse
const authGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true; // Pasa, amigo
    } else {
        router.navigate(['/login']); // Alto ahí, vete al login
        return false;
    }
};

/// --- DEFINICIÓN DE RUTAS ---
export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },

    // --- RUTA ADMIN (CON HIJOS) ---
    {
        path: 'admin',
        component: AdminViewComponent, // Carga el Layout (Sidebar + Header)
        canActivate: [authGuard],
        children: [
            // 1. Si entra a /admin, redirigir automáticamente a /admin/dashboard
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

            // 2. Rutas hijas (se cargan dentro del router-outlet de AdminView)
            { path: 'dashboard', component: AdminDashboardComponent },
            { path: 'employees', component: EmployeeManagementComponent },
            { path: 'history', component: HistoryViewComponent },
            { path: 'qr-generator', component: QrCodeGeneratorComponent }
        ]
    },

    // --- RUTA EMPLOYEE ---
    {
        path: 'employee',
        component: EmployeeViewComponent,
        canActivate: [authGuard]
    },

    { path: '**', redirectTo: 'login' }
];
