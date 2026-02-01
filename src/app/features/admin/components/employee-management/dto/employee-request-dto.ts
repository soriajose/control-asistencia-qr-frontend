export interface EmployeeRequestDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    username: string;
    password?: string; // Opcional porque en edición puede ir vacío
}
