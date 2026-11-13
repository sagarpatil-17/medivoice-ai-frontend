export interface Department {
    id: string;
    name: string;
    code: string;
    description: string | null;
    isActive: boolean;
    _count?: {
        doctors: number;
    };
}

export interface DepartmentsResponse {
    data: Department[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}