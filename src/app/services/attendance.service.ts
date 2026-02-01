
import { Injectable, signal } from '@angular/core';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  username?: string;
  password?: string;
  status: 'Entrada registrada' | 'Salida registrada';
  lastClockIn?: Date | null;
  lastClockOut?: Date | null;
}

export interface AttendanceRecord {
  id: number;
  employeeId: string;
  employeeName: string;
  timestamp: Date;
  type: 'Entrada' | 'Salida';
}

export interface WorkSession {
  clockIn: Date;
  clockOut?: Date;
  duration?: string;
}

export interface QrCode {
  id: string;
  name: string;
}

// Helper function to create dates for mock data
const createPastDate = (daysAgo: number, hour: number, minute: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, minute, 0, 0);
    return date;
};

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private nextRecordId = signal(15); // Start after mock data
  private nextEmployeeId = signal(5);

  employees = signal<Employee[]>([
    { id: 'EMP001', firstName: 'Alicia', lastName: 'Jiménez', email: 'alicia.j@example.com', phone: '555-0101', username: 'alicia.jimenez', password: 'password123', status: 'Salida registrada' },
    { id: 'EMP002', firstName: 'Roberto', lastName: 'Williams', email: 'roberto.w@example.com', phone: '555-0102', username: 'roberto.williams', password: 'password123', status: 'Entrada registrada', lastClockIn: createPastDate(0, 8, 45) },
    { id: 'EMP003', firstName: 'Carlos', lastName: 'Pardo', email: 'carlos.p@example.com', phone: '555-0103', username: 'carlos.pardo', password: 'password123', status: 'Salida registrada' },
    { id: 'EMP004', firstName: 'Diana', lastName: 'Molinero', email: 'diana.m@example.com', phone: '555-0104', username: 'diana.molinero', password: 'password123', status: 'Salida registrada' },
  ]);

  qrCode = signal<QrCode>({ id: 'ACCESS-ID-6a8b2c9d', name: 'Código de Acceso General' });

  attendanceLog = signal<AttendanceRecord[]>([
    // Alicia Jiménez
    { id: 1, employeeId: 'EMP001', employeeName: 'Alicia Jiménez', timestamp: createPastDate(2, 9, 1), type: 'Entrada' },
    { id: 2, employeeId: 'EMP001', employeeName: 'Alicia Jiménez', timestamp: createPastDate(2, 17, 3), type: 'Salida' },
    { id: 3, employeeId: 'EMP001', employeeName: 'Alicia Jiménez', timestamp: createPastDate(1, 8, 58), type: 'Entrada' },
    { id: 4, employeeId: 'EMP001', employeeName: 'Alicia Jiménez', timestamp: createPastDate(1, 17, 12), type: 'Salida' },

    // Roberto Williams - Clocked in today
    { id: 5, employeeId: 'EMP002', employeeName: 'Roberto Williams', timestamp: createPastDate(1, 8, 30), type: 'Entrada' },
    { id: 6, employeeId: 'EMP002', employeeName: 'Roberto Williams', timestamp: createPastDate(1, 16, 45), type: 'Salida' },
    { id: 7, employeeId: 'EMP002', employeeName: 'Roberto Williams', timestamp: createPastDate(0, 8, 45), type: 'Entrada' },

    // Carlos Pardo - Multiple sessions in one day
    { id: 8, employeeId: 'EMP003', employeeName: 'Carlos Pardo', timestamp: createPastDate(1, 9, 15), type: 'Entrada' },
    { id: 9, employeeId: 'EMP003', employeeName: 'Carlos Pardo', timestamp: createPastDate(1, 13, 0), type: 'Salida' },
    { id: 10, employeeId: 'EMP003', employeeName: 'Carlos Pardo', timestamp: createPastDate(1, 14, 2), type: 'Entrada' },
    { id: 11, employeeId: 'EMP003', employeeName: 'Carlos Pardo', timestamp: createPastDate(1, 18, 5), type: 'Salida' },
    { id: 12, employeeId: 'EMP003', employeeName: 'Carlos Pardo', timestamp: createPastDate(2, 9, 5), type: 'Entrada' },
    { id: 13, employeeId: 'EMP003', employeeName: 'Carlos Pardo', timestamp: createPastDate(2, 17, 20), type: 'Salida' },
    
    // EMP004 has no records
  ]);

  getEmployeeById(employeeId: string): Employee | undefined {
    return this.employees().find(emp => emp.id === employeeId);
  }

  getRecordsForEmployee(employeeId: string) {
    return this.attendanceLog().filter(r => r.employeeId === employeeId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  clockIn(employeeId: string): { success: boolean, message: string, employeeName: string } {
    const employee = this.getEmployeeById(employeeId);
    if (!employee) {
      return { success: false, message: 'Empleado no encontrado.', employeeName: '' };
    }
    const employeeName = `${employee.firstName} ${employee.lastName}`;
    if (employee.status === 'Entrada registrada') {
      return { success: false, message: `${employeeName} ya ha registrado la entrada.`, employeeName: employeeName };
    }

    const now = new Date();
    this.employees.update(employees =>
      employees.map(emp =>
        emp.id === employeeId ? { ...emp, status: 'Entrada registrada', lastClockIn: now } : emp
      )
    );

    this.attendanceLog.update(log => [
      ...log,
      {
        id: this.nextRecordId(),
        employeeId,
        employeeName: employeeName,
        timestamp: now,
        type: 'Entrada',
      },
    ]);
    this.nextRecordId.update(id => id + 1);

    return { success: true, message: `Entrada registrada con éxito a las ${now.toLocaleTimeString()}`, employeeName: employeeName };
  }

  clockOut(employeeId: string): { success: boolean, message: string, employeeName: string } {
    const employee = this.getEmployeeById(employeeId);
    if (!employee) {
      return { success: false, message: 'Empleado no encontrado.', employeeName: '' };
    }
    const employeeName = `${employee.firstName} ${employee.lastName}`;
    if (employee.status === 'Salida registrada') {
        return { success: false, message: `${employeeName} ya ha registrado la salida.`, employeeName: employeeName };
    }

    const now = new Date();
    this.employees.update(employees =>
      employees.map(emp =>
        emp.id === employeeId ? { ...emp, status: 'Salida registrada', lastClockOut: now } : emp
      )
    );

    this.attendanceLog.update(log => [
      ...log,
      {
        id: this.nextRecordId(),
        employeeId,
        employeeName: employeeName,
        timestamp: now,
        type: 'Salida',
      },
    ]);
    this.nextRecordId.update(id => id + 1);
    
    return { success: true, message: `Salida registrada con éxito a las ${now.toLocaleTimeString()}`, employeeName: employeeName };
  }
  
  toggleClockStatus(employeeId: string): { success: boolean, message: string, employeeName: string } {
      const employee = this.getEmployeeById(employeeId);
      if(!employee) {
          return { success: false, message: 'Empleado no encontrado.', employeeName: '' };
      }
      
      if(employee.status === 'Entrada registrada') {
          return this.clockOut(employeeId);
      } else {
          return this.clockIn(employeeId);
      }
  }

  addEmployee(firstName: string, lastName: string, email: string, phone: string, username: string, password: string) {
    const newId = `EMP${this.nextEmployeeId().toString().padStart(3, '0')}`;
    const newEmployee: Employee = {
      id: newId,
      firstName,
      lastName,
      email,
      phone,
      username,
      password,
      status: 'Salida registrada'
    };
    this.employees.update(employees => [...employees, newEmployee]);
    this.nextEmployeeId.update(id => id + 1);
  }

  updateEmployee(updatedEmployee: Employee) {
    const oldEmployee = this.getEmployeeById(updatedEmployee.id);
    if (!oldEmployee) return;

    const nameHasChanged = oldEmployee.firstName !== updatedEmployee.firstName || oldEmployee.lastName !== updatedEmployee.lastName;

    this.employees.update(employees =>
      employees.map(emp => (emp.id === updatedEmployee.id ? updatedEmployee : emp))
    );
    
    if (nameHasChanged) {
        const newFullName = `${updatedEmployee.firstName} ${updatedEmployee.lastName}`;
        this.attendanceLog.update(log => 
            log.map(record => 
                record.employeeId === updatedEmployee.id 
                    ? { ...record, employeeName: newFullName } 
                    : record
            )
        );
    }
  }

  deleteEmployee(id: string) {
    this.employees.update(employees => employees.filter(emp => emp.id !== id));
    // Optional: also remove attendance logs for the deleted employee
    this.attendanceLog.update(log => log.filter(record => record.employeeId !== id));
  }

  updateQrCode(newName: string) {
    this.qrCode.update(qr => ({ ...qr, name: newName }));
  }

  regenerateQrCodeId() {
    // Generate a simple random hex string for uniqueness
    const newId = `ACCESS-ID-${Math.random().toString(16).substring(2, 10)}`;
    this.qrCode.update(qr => ({ ...qr, id: newId }));
  }

  private calculateDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 'Inválido';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  getEmployeeHistory(employeeId: string): WorkSession[] {
    const records = this.attendanceLog()
      .filter(r => r.employeeId === employeeId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort ascending

    const sessions: WorkSession[] = [];
    let currentSessionStart: Date | null = null;

    for (const record of records) {
      if (record.type === 'Entrada') {
        if (currentSessionStart) {
          sessions.push({ clockIn: currentSessionStart });
        }
        currentSessionStart = record.timestamp;
      } else if (record.type === 'Salida' && currentSessionStart) {
        const session: WorkSession = {
          clockIn: currentSessionStart,
          clockOut: record.timestamp,
          duration: this.calculateDuration(currentSessionStart, record.timestamp),
        };
        sessions.push(session);
        currentSessionStart = null; 
      }
    }

    if (currentSessionStart) {
      sessions.push({ clockIn: currentSessionStart });
    }

    return sessions.sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime()); // Show most recent first
  }
}