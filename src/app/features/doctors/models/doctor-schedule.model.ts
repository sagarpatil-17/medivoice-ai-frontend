export interface DoctorSchedule {
    id: string;
    doctorId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
    breakStartTime: string | null;
    breakEndTime: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    doctor?: {
        id: string;
        fullName: string;
        specialization: string;
        isActive?: boolean;
    };
}

export interface CreateDoctorScheduleRequest {
    doctorId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDurationMinutes?: number;
    breakStartTime?: string;
    breakEndTime?: string;
    isActive?: boolean;
}