
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateDoctorRequest, Doctor, DoctorsResponse, UpdateDoctorRequest } from '../models/doctor.model';

@Injectable({
    providedIn: 'root',
})
export class DoctorsService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/doctors`;

    getDoctors(
        page = 1,
        limit = 10,
        search = '',
        isActive = true,
    ): Observable<DoctorsResponse> {
        let params = new HttpParams()
            .set('page', page)
            .set('limit', limit)
            .set('isActive', isActive);

        if (search.trim()) {
            params = params.set('search', search.trim());
        }

        return this.http.get<DoctorsResponse>(this.apiUrl, { params });
    }

    getDoctor(id: string): Observable<Doctor> {
        return this.http.get<Doctor>(`${this.apiUrl}/${id}`);
    }

    deactivateDoctor(id: string): Observable<Doctor> {
        return this.http.patch<Doctor>(
            `${this.apiUrl}/${id}/deactivate`,
            {},
        );
    }

    createDoctor(payload: CreateDoctorRequest): Observable<Doctor> {
        return this.http.post<Doctor>(this.apiUrl, payload);
    }

    updateDoctor(
        id: string,
        payload: UpdateDoctorRequest,
    ): Observable<Doctor> {
        return this.http.patch<Doctor>(`${this.apiUrl}/${id}`, payload);
    }
}
