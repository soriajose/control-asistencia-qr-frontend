import {ChangeDetectionStrategy, Component, inject, output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {AttendanceService} from '../../../../services/attendance.service';
import {AuthService} from "../../../auth/services/auth.service";

@Component({
    selector: 'app-admin-view',
    standalone: true,
    imports: [CommonModule,
        RouterLink, RouterLinkActive, RouterOutlet
    ],
    templateUrl: './admin-view.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminViewComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    logout = output<void>();
    isSidebarOpen = signal(false);

    // Definimos las rutas relativas que coinciden con app.routes.ts
    menuItems = signal([
        {route: 'dashboard', label: 'Dashboard', icon: 'pi pi-th-large'},
        {route: 'employees', label: 'Empleados', icon: 'pi pi-users'},
        {route: 'history', label: 'Historial', icon: 'pi pi-history'},
        {route: 'qr-generator', label: 'Generar QR', icon: 'pi pi-qrcode'},
        {route: 'config', label: 'Configuración', icon: 'pi pi-cog'},
    ] as const);

    toggleSidebar() {
        this.isSidebarOpen.update(v => !v);
    }

    onLogout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
