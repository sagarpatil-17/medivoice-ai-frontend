
export interface Department {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    isActive: boolean;
}

export interface DoctorUser {
    id: string;
    name?: string;
    email: string;
    phone: string | null;
    role?: 'DOCTOR';
    isActive: boolean;
}

export interface Doctor {
    id: string;
    userId: string;
    departmentId: string;
    fullName: string;
    specialization: string;
    qualification: string;
    experienceYears: number;
    consultationFee: number;
    bio: string | null;
    isActive: boolean;
    department: Department;
    user: DoctorUser;
    createdAt?: string;
    updatedAt?: string;
}

export interface DoctorsResponse {
    data: Doctor[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CreateDoctorRequest {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    departmentId: string;
    specialization: string;
    qualification: string;
    experienceYears: number;
    consultationFee: number;
    bio?: string;
}

export type UpdateDoctorRequest = Partial<
    Omit<CreateDoctorRequest, 'email' | 'password'>
>;