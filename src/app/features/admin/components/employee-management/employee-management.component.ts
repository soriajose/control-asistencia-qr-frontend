import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {EmployeeResponseDto} from "./dto/employee-response-dto";
import {EmployeeManagementService} from "./services/employee-management.service";
import {EmployeeRequestDto} from "./dto/employee-request-dto";

@Component({
    selector: 'app-employee-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './employee-management.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeManagementComponent {

    // Inyectamos el servicio correcto
    employeeManagementService = inject(EmployeeManagementService);

    // Computed signal to determine modal mode
    editMode = computed(() => !!this.editingEmployee());

    // --- SEÑALES DE ESTADO (Tabla) ---
    employees = signal<EmployeeResponseDto[]>([]);
    totalElements = signal(0);
    totalPages = signal(0);
    currentPage = signal(1);
    itemsPerPage = signal(10);
    searchTerm = signal('');
    isLoading = signal(false);

    // --- SEÑALES DE FORMULARIO (Modal) ---
    isModalOpen = signal(false);
    editingEmployee = signal<EmployeeResponseDto | null>(null);

    // Campos del formulario
    firstName = signal('');
    lastName = signal('');
    email = signal('');
    phone = signal('');
    username = signal('');
    password = signal(''); // Para generar/editar

    isConfirmModalOpen = signal(false);
    isDeleteModalOpen = signal(false);
    employeeIdToDelete = signal<number | null>(null);

    copiedField = signal<'username' | 'password' | null>(null);


    constructor() {
        // EFECTO: Se dispara automáticamente si cambia la página o la búsqueda
        effect(() => {
            const page = this.currentPage();
            const search = this.searchTerm();

            // Llamada al backend
            this.loadEmployees(page, this.itemsPerPage(), search);
        }, {allowSignalWrites: true});
    }

    loadEmployees(page: number, size: number, search: string) {
        this.isLoading.set(true);
        this.employeeManagementService.getEmployees(page, size, search).subscribe({
            next: (response) => {
                console.log('EMPLOYEES', response);
                this.employees.set(response.content);
                this.totalPages.set(response.totalPages);
                this.totalElements.set(response.totalElements);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error:', err);
                this.isLoading.set(false);
            }
        });
    }


// --- ACCIONES DE UI ---

    // Al escribir en el buscador
    onSearch(term: string) {
        this.searchTerm.set(term);
        this.currentPage.set(1); // Volver a pág 1 al buscar
    }

    nextPage() {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(p => p + 1);
        }
    }

    previousPage() {
        if (this.currentPage() > 1) {
            this.currentPage.update(p => p - 1);
        }
    }

    // --- GESTIÓN DEL MODAL ---

    openModal(employee: EmployeeResponseDto | null = null) {
        if (employee) {
            // MODO EDICIÓN
            this.editingEmployee.set(employee);
            this.firstName.set(employee.firstName);
            this.lastName.set(employee.lastName);
            this.email.set(employee.email);
            this.phone.set(employee.phone || '');
            this.username.set(employee.username);
            this.password.set(''); // Password vacía por defecto
        } else {
            // MODO CREACIÓN
            this.editingEmployee.set(null);
            this.resetForm();
            this.generatePassword();
        }
        this.isModalOpen.set(true);
    }

    closeModal() {
        this.isModalOpen.set(false);
        this.editingEmployee.set(null);
        this.resetForm();
    }

    saveEmployee() {
        const passwordRequired = !this.editingEmployee() && !this.password();

        if (passwordRequired) {
            alert('La contraseña es obligatoria para nuevos empleados');
            return;
        }

        if (!this.firstName() || !this.lastName() || !this.email()) {
            alert('Por favor complete los campos obligatorios');
            return;
        }

        this.isConfirmModalOpen.set(true);
    }

    closeConfirmModal() {
        this.isConfirmModalOpen.set(false);
    }

    executeSave() {
        this.isLoading.set(true);

        const employeeRequestDTO: EmployeeRequestDto = {
            firstName: this.firstName(),
            lastName: this.lastName(),
            email: this.email(),
            phone: this.phone(),
            username: this.username(),
            password: this.password() || undefined
        };

        if (this.editingEmployee()) {
            // UPDATE
            const id = this.editingEmployee()!.id;
            this.employeeManagementService.updateEmployee(id, employeeRequestDTO).subscribe({
                next: () => {
                    this.isLoading.set(false);
                    this.closeConfirmModal();
                    this.closeModal();
                    this.loadEmployees(this.currentPage(), this.itemsPerPage(), this.searchTerm());
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.closeConfirmModal();
                    alert('Error al actualizar: ' + (err.error?.message || 'Error desconocido'));
                }
            });
        } else {
            // CREATE
            this.employeeManagementService.createEmployee(employeeRequestDTO).subscribe({
                next: () => {
                    this.isLoading.set(false);
                    this.closeConfirmModal();
                    this.closeModal();
                    this.loadEmployees(this.currentPage(), this.itemsPerPage(), this.searchTerm());
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.closeConfirmModal();
                    alert('Error al crear: ' + (err.error?.message || 'Error desconocido'));
                }
            });
        }
    }

    deleteEmployee(id: number) {
        this.employeeIdToDelete.set(id);
        this.isDeleteModalOpen.set(true);
    }

    closeDeleteModal() {
        this.isDeleteModalOpen.set(false);
        this.employeeIdToDelete.set(null);
    }


    confirmDelete() {
        const id = this.employeeIdToDelete();

        if (id) {
            this.isLoading.set(true);

            this.employeeManagementService.deleteEmployee(id).subscribe({
                next: () => {
                    this.isLoading.set(false);
                    this.closeDeleteModal();
                    this.loadEmployees(this.currentPage(), this.itemsPerPage(), this.searchTerm());
                },
                error: () => {
                    this.isLoading.set(false);
                    this.closeDeleteModal();
                }
            });
        }
    }

    resetForm() {
        this.firstName.set('');
        this.lastName.set('');
        this.email.set('');
        this.phone.set('');
        this.username.set('');
        this.password.set('');
    }

    generateUsername() {
        if (this.editingEmployee()) return;

        this.username.set(this.email().trim().toLowerCase());
    }

    generatePassword() {
        this.password.set(Math.random().toString(36).slice(-10));
    }

    copyToClipboard(text: string, field: 'username' | 'password') {
        navigator.clipboard.writeText(text);
        this.copiedField.set(field);
        setTimeout(() => this.copiedField.set(null), 2000);
    }
}
