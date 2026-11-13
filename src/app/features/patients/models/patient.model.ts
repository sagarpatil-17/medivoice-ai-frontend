export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    dateOfBirth: string | null;
    gender: PatientGender | null;
    createdAt: string;
}

export interface PatientDetails extends Patient {
    address: string | null;
    bloodGroup?: string | null;
    notes: string | null;
    updatedAt: string;
}

export interface CreatePatientRequest {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    dateOfBirth?: string;
    gender?: PatientGender;
    address?: string;
    notes?: string;
}

export type UpdatePatientRequest = Partial<CreatePatientRequest>;

export interface PatientsResponse {
    data: Patient[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PatientAppointment {
    id: string;
    startAt: string;
    endAt: string;
    status: string;
    bookingSource: string;
    reason: string | null;
    doctor: {
        id: string;
        fullName: string;
        specialization: string;
        department: {
            name: string;
        };
    };
}

export interface PatientAppointmentsResponse {
    patientId: string;
    total: number;
    appointments: PatientAppointment[];
}