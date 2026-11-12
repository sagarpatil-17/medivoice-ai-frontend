export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    user: AuthUser;
}

export interface RefreshResponse {
    accessToken: string;
}