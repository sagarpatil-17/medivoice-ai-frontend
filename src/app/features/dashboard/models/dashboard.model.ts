export interface DashboardOverview {
    date: string;
    timezone: string;
    appointments: {
        total: number;
        confirmed: number;
        pending: number;
        cancelled: number;
        completed: number;
        noShow: number;
    };
    patients: {
        total: number;
    };
    doctors: {
        active: number;
    };
    departments: {
        active: number;
    };
}

export interface RecentAppointment {
    id: string;
    startAt: string;
    endAt: string;
    status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'COMPLETED'
    | 'NO_SHOW';
    bookingSource: string;
    createdAt: string;
    patient: {
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
    };
    doctor: {
        id: string;
        fullName: string;
        specialization: string;
        department: {
            id: string;
            name: string;
        };
    };
}

export interface RecentAppointmentsResponse {
    data: RecentAppointment[];
    total: number;
}

export interface AppointmentTrend {
    date: string;
    appointments: number;
}

export interface AppointmentTrendsResponse {
    period: string;
    timezone: string;
    totalAppointments: number;
    data: AppointmentTrend[];
}

export interface AppointmentStatusItem {
    status: string;
    count: number;
}

export interface AppointmentStatusResponse {
    date: string;
    timezone: string;
    total: number;
    data: AppointmentStatusItem[];
}

export interface DepartmentStat {
    departmentId: string;
    departmentName: string;
    departmentCode: string;
    activeDoctors: number;
    appointments: number;
}

export interface DepartmentStatsResponse {
    period: string;
    timezone: string;
    data: DepartmentStat[];
}