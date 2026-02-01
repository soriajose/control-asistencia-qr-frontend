export interface EmployeeResponseDto {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    username: string;
    // --- DATOS DEL TURNO ---
    workShiftId: number;
    workShiftName: string;
    workShiftStartTime: string;
    workShiftEndTime: string;
}
