
export type AppointmentStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'COMPLETED'
    | 'NO_SHOW';

export type BookingSource =
    | 'ADMIN'
    | 'RECEPTIONIST'
    | 'VOICE_AI'
    | 'PATIENT_PORTAL';

export interface AppointmentPatient {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string | null;
}

export interface AppointmentDoctor {
    id: string;
    fullName: string;
    specialization: string;
    qualification?: string;
    department?: {
        id: string;
        name: string;
    };
}

export interface Appointment {
    id: string;
    bookingReference?: string | null;
    patientId: string;
    doctorId: string;
    startAt: string;
    endAt: string;
    status: AppointmentStatus;
    bookingSource: BookingSource;
    reason?: string | null;
    cancellationReason?: string | null;
    cancelledAt?: string | null;
    createdAt: string;
    updatedAt: string;
    patient: AppointmentPatient;
    doctor: AppointmentDoctor;
}

export interface AppointmentsResponse {
    data: Appointment[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface AppointmentQuery {
    page?: number;
    limit?: number;
    patientId?: string;
    doctorId?: string;
    status?: AppointmentStatus;
    from?: string;
    to?: string;
}

export interface CreateAppointmentRequest {
    patientId: string;
    doctorId: string;
    startAt: string;
    reason?: string;
}

export interface RescheduleAppointmentRequest {
    startAt: string;
}

export interface CancelAppointmentRequest {
    cancellationReason: string;
}

export interface AvailableSlot {
    startAt: string;
    endAt: string;
    available: boolean;
}

export interface AppointmentAvailabilityResponse {
    doctor: {
        id: string;
        fullName: string;
        specialization: string;
        department: {
            name: string;
        };
    };
    date: string;
    timezone: string;
    slots: AvailableSlot[];
    availableCount: number;
}
